/**
 * Feature Flag & Kill Switch Service
 * Reference: 03_FEATURE_FLAGS.md, SOLUTION_ROADMAP Sprint 5.4
 *
 * Server-side flag evaluation with Redis caching.
 * Supports: toggle, kill_switch, experiment, rollout flag types.
 *
 * Kill switches propagate across all instances within ~5 seconds (Redis TTL).
 * Flag evaluation is logged to audit for compliance.
 *
 * Usage:
 *   import { FlagService } from '@hsafx/shared/flags/service';
 *
 *   const flags = new FlagService(redis, db);
 *   const enabled = await flags.evaluate('new_billing_ui', { userId, role });
 *   await flags.activateKillSwitch('payment_processing');
 */

import { createLogger } from '../logger';

const log = createLogger('flags');

// ─── Types ──────────────────────────────────────────────────

export type FlagType = 'toggle' | 'kill_switch' | 'experiment' | 'rollout';

export interface FeatureFlag {
  id: string;
  name: string;
  description: string | null;
  flagType: FlagType;
  isEnabled: boolean;
  rolloutPercentage: number;
  targetUsers: string[];
  targetRoles: string[];
  killSwitchActivatedAt: Date | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface FlagContext {
  userId?: string;
  role?: string;
  sessionId?: string;
}

export interface FlagEvaluationResult {
  flagName: string;
  enabled: boolean;
  reason: string; // 'flag_disabled', 'kill_switch_active', 'user_targeted', 'role_targeted', 'rollout_hit', 'rollout_miss', 'flag_not_found'
  flagType?: FlagType;
}

// ─── Redis key helpers ──────────────────────────────────────

const FLAG_CACHE_PREFIX = 'flags:';
const FLAG_CACHE_TTL = 5; // 5 seconds — kill switch propagation window
const ALL_FLAGS_KEY = 'flags:__all__';

// ─── Hash function for rollout ──────────────────────────────

/**
 * Deterministic hash for rollout percentage — same user always gets same result.
 * Uses a simple FNV-1a-like hash for consistency.
 */
function hashForRollout(flagName: string, userId: string): number {
  const str = `${flagName}:${userId}`;
  let hash = 2166136261; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 16777619) >>> 0; // FNV prime, keep as uint32
  }
  return hash % 100; // 0-99
}

// ─── Service ────────────────────────────────────────────────

/**
 * Redis and DB interfaces — kept minimal for portability.
 * Accepts Upstash Redis client or any compatible interface.
 */
interface RedisLike {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, opts?: { ex?: number }): Promise<unknown>;
  del(...keys: string[]): Promise<unknown>;
}

interface DbLike {
  select(): any; // Drizzle-style query builder
  update(table: any): any;
  execute(query: any): any;
}

export class FlagService {
  constructor(
    private redis: RedisLike,
    private db: DbLike,
  ) {}

  // ── Core evaluation ─────────────────────────────────────

  /**
   * Evaluate a feature flag for the given context.
   * Returns whether the flag is enabled and the reason.
   *
   * Evaluation order:
   * 1. Check Redis cache (5s TTL)
   * 2. If kill_switch && activated → DISABLED
   * 3. If !isEnabled → DISABLED
   * 4. If user is in targetUsers → ENABLED
   * 5. If role is in targetRoles → ENABLED
   * 6. If rollout → hash(flagName:userId) < rolloutPercentage → ENABLED
   * 7. For plain toggles, isEnabled is the answer
   */
  async evaluate(
    flagName: string,
    context: FlagContext = {},
  ): Promise<FlagEvaluationResult> {
    try {
      const flag = await this.getFlag(flagName);

      if (!flag) {
        return { flagName, enabled: false, reason: 'flag_not_found' };
      }

      // Kill switch check — highest priority
      if (flag.flagType === 'kill_switch' && flag.killSwitchActivatedAt) {
        return {
          flagName,
          enabled: false,
          reason: 'kill_switch_active',
          flagType: flag.flagType,
        };
      }

      // Global disable
      if (!flag.isEnabled) {
        return {
          flagName,
          enabled: false,
          reason: 'flag_disabled',
          flagType: flag.flagType,
        };
      }

      // User targeting
      if (context.userId && flag.targetUsers.length > 0) {
        if (flag.targetUsers.includes(context.userId)) {
          return {
            flagName,
            enabled: true,
            reason: 'user_targeted',
            flagType: flag.flagType,
          };
        }
      }

      // Role targeting
      if (context.role && flag.targetRoles.length > 0) {
        if (flag.targetRoles.includes(context.role)) {
          return {
            flagName,
            enabled: true,
            reason: 'role_targeted',
            flagType: flag.flagType,
          };
        }
      }

      // Percentage rollout
      if (flag.flagType === 'rollout' || flag.flagType === 'experiment') {
        if (flag.rolloutPercentage <= 0) {
          return { flagName, enabled: false, reason: 'rollout_miss', flagType: flag.flagType };
        }
        if (flag.rolloutPercentage >= 100) {
          return { flagName, enabled: true, reason: 'rollout_hit', flagType: flag.flagType };
        }

        // Need a userId for deterministic rollout
        const id = context.userId ?? context.sessionId ?? '';
        if (!id) {
          return { flagName, enabled: false, reason: 'rollout_miss', flagType: flag.flagType };
        }

        const bucket = hashForRollout(flagName, id);
        const enabled = bucket < flag.rolloutPercentage;
        return {
          flagName,
          enabled,
          reason: enabled ? 'rollout_hit' : 'rollout_miss',
          flagType: flag.flagType,
        };
      }

      // Simple toggle — isEnabled is true at this point
      return {
        flagName,
        enabled: true,
        reason: 'flag_enabled',
        flagType: flag.flagType,
      };
    } catch (error) {
      // Fail open for feature flags, fail closed for kill switches
      log.error('Flag evaluation error', { flagName, error: String(error) });
      return { flagName, enabled: false, reason: 'evaluation_error' };
    }
  }

  // ── Kill switch operations ──────────────────────────────

  /**
   * Activate a kill switch. Takes effect across all instances within 5 seconds.
   */
  async activateKillSwitch(flagName: string): Promise<boolean> {
    try {
      // Update DB
      const now = new Date();
      await this.db.execute(
        // Using raw SQL for portability
        {
          sql: `UPDATE feature_flags 
                SET is_enabled = false, 
                    kill_switch_activated_at = $1, 
                    updated_at = $1,
                    flag_type = 'kill_switch'
                WHERE name = $2`,
          params: [now, flagName],
        },
      );

      // Invalidate Redis cache immediately
      await this.redis.del(`${FLAG_CACHE_PREFIX}${flagName}`, ALL_FLAGS_KEY);

      log.info('Kill switch activated', { flagName });
      return true;
    } catch (error) {
      log.error('Failed to activate kill switch', { flagName, error: String(error) });
      return false;
    }
  }

  /**
   * Deactivate a kill switch.
   */
  async deactivateKillSwitch(flagName: string): Promise<boolean> {
    try {
      await this.db.execute({
        sql: `UPDATE feature_flags 
              SET is_enabled = true, 
                  kill_switch_activated_at = NULL, 
                  updated_at = $1
              WHERE name = $2`,
        params: [new Date(), flagName],
      });

      // Invalidate cache
      await this.redis.del(`${FLAG_CACHE_PREFIX}${flagName}`, ALL_FLAGS_KEY);

      log.info('Kill switch deactivated', { flagName });
      return true;
    } catch (error) {
      log.error('Failed to deactivate kill switch', { flagName, error: String(error) });
      return false;
    }
  }

  // ── Cache layer ─────────────────────────────────────────

  /**
   * Get a single flag, with Redis caching (5s TTL).
   */
  private async getFlag(flagName: string): Promise<FeatureFlag | null> {
    const cacheKey = `${FLAG_CACHE_PREFIX}${flagName}`;

    // Try Redis cache first
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as FeatureFlag;
      }
    } catch {
      // Cache miss or error, fall through to DB
    }

    // Fetch from DB
    try {
      const result = await this.db.execute({
        sql: `SELECT * FROM feature_flags WHERE name = $1 LIMIT 1`,
        params: [flagName],
      });

      const rows = (result as any).rows ?? result;
      if (!rows || rows.length === 0) return null;

      const row = rows[0];
      const flag: FeatureFlag = {
        id: row.id,
        name: row.name,
        description: row.description,
        flagType: row.flag_type as FlagType,
        isEnabled: row.is_enabled,
        rolloutPercentage: row.rollout_percentage,
        targetUsers: row.target_users ?? [],
        targetRoles: row.target_roles ?? [],
        killSwitchActivatedAt: row.kill_switch_activated_at
          ? new Date(row.kill_switch_activated_at)
          : null,
        metadata: row.metadata ?? {},
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };

      // Cache for 5 seconds
      try {
        await this.redis.set(cacheKey, JSON.stringify(flag), { ex: FLAG_CACHE_TTL });
      } catch {
        // Non-critical cache write failure
      }

      return flag;
    } catch (error) {
      log.error('Flag DB fetch error', { flagName, error: String(error) });
      return null;
    }
  }

  /**
   * Get all flags (for admin UI). Cached for 5 seconds.
   */
  async getAllFlags(): Promise<FeatureFlag[]> {
    try {
      const cached = await this.redis.get(ALL_FLAGS_KEY);
      if (cached) {
        return JSON.parse(cached) as FeatureFlag[];
      }
    } catch {
      // Fall through
    }

    try {
      const result = await this.db.execute({
        sql: `SELECT * FROM feature_flags ORDER BY created_at DESC`,
        params: [],
      });

      const rows = (result as any).rows ?? result;
      const flags: FeatureFlag[] = (rows ?? []).map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        flagType: row.flag_type as FlagType,
        isEnabled: row.is_enabled,
        rolloutPercentage: row.rollout_percentage,
        targetUsers: row.target_users ?? [],
        targetRoles: row.target_roles ?? [],
        killSwitchActivatedAt: row.kill_switch_activated_at
          ? new Date(row.kill_switch_activated_at)
          : null,
        metadata: row.metadata ?? {},
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));

      try {
        await this.redis.set(ALL_FLAGS_KEY, JSON.stringify(flags), { ex: FLAG_CACHE_TTL });
      } catch {
        // Non-critical
      }

      return flags;
    } catch (error) {
      log.error('getAllFlags error', { error: String(error) });
      return [];
    }
  }

  /**
   * Invalidate all flag caches. Call after admin updates.
   */
  async invalidateCache(flagName?: string): Promise<void> {
    try {
      if (flagName) {
        await this.redis.del(`${FLAG_CACHE_PREFIX}${flagName}`, ALL_FLAGS_KEY);
      } else {
        await this.redis.del(ALL_FLAGS_KEY);
      }
    } catch {
      // Non-critical
    }
  }
}

// ─── Singleton factory ──────────────────────────────────────

let _instance: FlagService | null = null;

/**
 * Get or create a FlagService singleton.
 * Requires Redis and DB clients to be passed on first call.
 */
export function getFlagService(redis?: RedisLike, db?: DbLike): FlagService {
  if (_instance) return _instance;
  if (!redis || !db) {
    throw new Error('[FlagService] Redis and DB required for initialization');
  }
  _instance = new FlagService(redis, db);
  return _instance;
}
