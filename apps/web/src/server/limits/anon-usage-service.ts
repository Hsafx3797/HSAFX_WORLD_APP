/**
 * Anonymous Usage Tracking Service
 * Reference: SOLUTION_ROADMAP Task 4.10, 20_BILLING_SYSTEM.md §9
 *
 * Tracks unauthenticated tool usage by fingerprint + IP.
 * Enforces per-tool-class daily limits for anonymous users.
 * Uses DB table `anonymous_usage` and Redis for fast checks.
 *
 * Tool Class Limits (per day):
 * - Text Tools (1-177): Unlimited
 * - Code Tools (178-283): 10/day
 * - File Tools (284-365): 3/day
 * - Generators (366-400): 5/day
 * - Calculators (401-428): Unlimited
 * - Visualizers (429-430): 3/day
 * - Intelligence (431-432): 0/day (auth required)
 */

'use server';

import { db, anonymousUsage, eq, and, sql } from '@hsafx/db';
import { getRedis, keys, TTL } from '@/lib/redis';
import { createHash } from 'crypto';
import { createLogger } from '@hsafx/shared/logger';

const log = createLogger('anon-usage');

// ─── Tool Class Configuration ─────────────────────────────────

export type ToolClass =
  | 'text'
  | 'code'
  | 'file'
  | 'generator'
  | 'calculator'
  | 'visualizer'
  | 'intelligence';

interface ToolClassConfig {
  name: string;
  dailyLimit: number; // 0 = blocked, -1 = unlimited
}

const TOOL_CLASS_LIMITS: Record<ToolClass, ToolClassConfig> = {
  text: { name: 'Text Tools', dailyLimit: -1 },
  code: { name: 'Code Tools', dailyLimit: 10 },
  file: { name: 'File Tools', dailyLimit: 3 },
  generator: { name: 'Generators', dailyLimit: 5 },
  calculator: { name: 'Calculators', dailyLimit: -1 },
  visualizer: { name: 'Visualizers', dailyLimit: 3 },
  intelligence: { name: 'Intelligence Tools', dailyLimit: 0 },
};

// ─── Types ────────────────────────────────────────────────────

export interface AnonUsageCheckResult {
  allowed: boolean;
  usedToday: number;
  dailyLimit: number;
  toolClass: ToolClass;
  upgradePrompt?: 'soft' | 'modal' | 'fullscreen';
  message?: string;
}

export class AnonLimitError extends Error {
  constructor(
    message: string,
    public toolClass: ToolClass,
    public usedToday: number,
    public dailyLimit: number,
  ) {
    super(message);
    this.name = 'AnonLimitError';
  }
}

// ─── Fingerprint helpers ──────────────────────────────────────

/**
 * Create a fingerprint hash from available client data.
 * Used as fallback when browser fingerprint is not provided.
 */
export function createFingerprintHash(
  ipAddress: string,
  userAgent?: string,
): string {
  const raw = `${ipAddress}|${userAgent ?? 'unknown'}`;
  return createHash('sha256').update(raw).digest('hex').slice(0, 64);
}

// ─── Tool class resolution ────────────────────────────────────

/**
 * Derive tool class from tool's group/order ID.
 * Based on 20_BILLING_SYSTEM.md §9.2 tool ID ranges.
 */
export function resolveToolClass(toolGroup: number): ToolClass {
  if (toolGroup <= 2) return 'text'; // Groups 1-2: text tools
  if (toolGroup === 3) return 'code'; // Group 3: code tools
  if (toolGroup === 4) return 'file'; // Group 4: file tools
  if (toolGroup === 5) return 'generator'; // Group 5: generators
  if (toolGroup === 6) return 'calculator'; // Group 6: calculators
  if (toolGroup === 7) return 'visualizer'; // Group 7: visualizers
  return 'intelligence'; // Group 8+: intelligence/advanced
}

/**
 * Resolve tool class from a tool slug by looking at the tool's sortOrder.
 * Falls back to 'text' (unlimited) if classification fails.
 */
export function resolveToolClassFromOrder(sortOrder: number): ToolClass {
  if (sortOrder <= 177) return 'text';
  if (sortOrder <= 283) return 'code';
  if (sortOrder <= 365) return 'file';
  if (sortOrder <= 400) return 'generator';
  if (sortOrder <= 428) return 'calculator';
  if (sortOrder <= 430) return 'visualizer';
  return 'intelligence';
}

// ─── Usage tracking (Redis fast path) ─────────────────────────

function getAnonRedisKey(fingerprint: string, toolClass: ToolClass): string {
  return keys.anon.baCount(`${fingerprint}:${toolClass}`);
}

/**
 * Check anonymous usage count via Redis (fast path).
 * Returns current count for the tool class today.
 */
async function getRedisUsageCount(
  fingerprint: string,
  toolClass: ToolClass,
): Promise<number> {
  const redis = getRedis();
  const redisKey = getAnonRedisKey(fingerprint, toolClass);
  const count = await redis.get<number>(redisKey);
  return count ?? 0;
}

/**
 * Increment anonymous usage in Redis + persist to DB.
 */
async function recordUsage(
  fingerprint: string,
  ipAddress: string,
  toolId: string,
  toolClass: ToolClass,
): Promise<number> {
  // Increment Redis counter (fast)
  const redis = getRedis();
  const redisKey = getAnonRedisKey(fingerprint, toolClass);
  const newCount = await redis.incr(redisKey);

  if (newCount === 1) {
    // Set TTL to expire at next midnight UTC
    const now = new Date();
    const tomorrow = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
    );
    const secondsUntilMidnight = Math.ceil(
      (tomorrow.getTime() - now.getTime()) / 1000,
    );
    await redis.expire(redisKey, Math.min(secondsUntilMidnight, TTL.ANON_TRACKING));
  }

  // Persist to DB (async, non-blocking for the user)
  try {
    await db.insert(anonymousUsage).values({
      fingerprint,
      ipAddress,
      toolId,
    });
  } catch {
    // DB write failure is non-critical — Redis is source of truth for limits
    log.warn('Failed to persist usage to DB', { fingerprint, toolId });
  }

  return newCount;
}

// ─── Public API ───────────────────────────────────────────────

/**
 * Check if an anonymous user can use a tool.
 * Returns usage status and optional upgrade prompt.
 */
export async function checkAnonymousLimit(
  fingerprint: string,
  toolClass: ToolClass,
): Promise<AnonUsageCheckResult> {
  const config = TOOL_CLASS_LIMITS[toolClass];

  // Unlimited tool class
  if (config.dailyLimit === -1) {
    return {
      allowed: true,
      usedToday: 0,
      dailyLimit: -1,
      toolClass,
    };
  }

  // Blocked tool class (auth required)
  if (config.dailyLimit === 0) {
    return {
      allowed: false,
      usedToday: 0,
      dailyLimit: 0,
      toolClass,
      upgradePrompt: 'fullscreen',
      message: `${config.name} require a free account. Sign up to access!`,
    };
  }

  // Check current usage
  const usedToday = await getRedisUsageCount(fingerprint, toolClass);

  // At or over limit
  if (usedToday >= config.dailyLimit) {
    return {
      allowed: false,
      usedToday,
      dailyLimit: config.dailyLimit,
      toolClass,
      upgradePrompt: 'fullscreen',
      message: `Daily limit reached for ${config.name}. Sign up for ${config.dailyLimit * 5}+ daily uses!`,
    };
  }

  // Over 50% — show modal prompt
  if (usedToday >= Math.floor(config.dailyLimit / 2)) {
    return {
      allowed: true,
      usedToday,
      dailyLimit: config.dailyLimit,
      toolClass,
      upgradePrompt: 'modal',
      message: `You've used ${usedToday}/${config.dailyLimit} daily uses. Create a free account for more!`,
    };
  }

  // After 3 uses — show soft banner
  if (usedToday >= 3) {
    return {
      allowed: true,
      usedToday,
      dailyLimit: config.dailyLimit,
      toolClass,
      upgradePrompt: 'soft',
      message: 'Enjoying the tools? Sign up for 5-10x more daily uses!',
    };
  }

  return {
    allowed: true,
    usedToday,
    dailyLimit: config.dailyLimit,
    toolClass,
  };
}

/**
 * Record an anonymous tool usage and enforce limits.
 * Call this AFTER the tool execution succeeds.
 *
 * @returns The updated usage check result (with new count).
 */
export async function trackAnonymousUsage(
  fingerprint: string,
  ipAddress: string,
  toolId: string,
  toolClass: ToolClass,
): Promise<AnonUsageCheckResult> {
  const config = TOOL_CLASS_LIMITS[toolClass];

  // Don't track unlimited tools
  if (config.dailyLimit === -1) {
    return {
      allowed: true,
      usedToday: 0,
      dailyLimit: -1,
      toolClass,
    };
  }

  const newCount = await recordUsage(fingerprint, ipAddress, toolId, toolClass);

  return checkAnonymousLimit(fingerprint, toolClass);
}

/**
 * Get current anonymous usage summary for all tool classes.
 * Used by the client to show remaining limits in the UI.
 */
export async function getAnonymousUsageSummary(
  fingerprint: string,
): Promise<Record<ToolClass, { used: number; limit: number }>> {
  const result = {} as Record<ToolClass, { used: number; limit: number }>;

  for (const [cls, config] of Object.entries(TOOL_CLASS_LIMITS)) {
    const toolClass = cls as ToolClass;
    if (config.dailyLimit === -1) {
      result[toolClass] = { used: 0, limit: -1 };
    } else if (config.dailyLimit === 0) {
      result[toolClass] = { used: 0, limit: 0 };
    } else {
      const used = await getRedisUsageCount(fingerprint, toolClass);
      result[toolClass] = { used, limit: config.dailyLimit };
    }
  }

  return result;
}
