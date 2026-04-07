/**
 * B2B Quota Service — ops-based billing for B2B API customers
 *
 * Flow per execution:
 *  1. resolveB2bSuite(category, toolId?) → suiteId
 *  2. checkB2bQuota(userId, suiteId) → { allowed, used, limit, remaining }
 *  3. Execute tool
 *  4a. incrementB2bUsage(userId, suiteId)  — on SUCCESS only
 *  4b. (nothing)                           — on failure (free)
 *
 * Key design:
 *  - Only SUCCESS counts as an op
 *  - Hard block (403) when quota exhausted
 *  - Per-suite quotas, not a global pool
 *  - Atomic increment with limit check to prevent races
 */

import {
  db,
  b2bSubscriptions,
  b2bPlanQuotas,
  b2bSuites,
  b2bSuiteCategories,
  b2bToolSuiteOverrides,
  b2bUsage,
  eq,
  and,
  sql,
} from '@hsafx/db';

// ─── Types ────────────────────────────────────────────────────

export interface B2bQuotaCheck {
  allowed: boolean;
  suiteId: string;
  suiteName: string;
  used: number;
  limit: number;
  remaining: number;
}

export interface B2bUsageIncrementResult {
  newUsageCount: number;
  limit: number;
  remaining: number;
}

export interface B2bUsageSummary {
  suiteId: string;
  suiteSlug: string;
  suiteName: string;
  used: number;
  limit: number;
  remaining: number;
}

// ─── Suite resolution ─────────────────────────────────────────

/**
 * Resolve which B2B suite a request belongs to.
 * First checks per-tool override, then falls back to category→suite mapping.
 */
export async function resolveB2bSuite(
  category: string,
  toolId?: string,
): Promise<{ suiteId: string; suiteName: string } | null> {
  // 1. Check per-tool override first
  if (toolId) {
    const [override] = await db
      .select({
        suiteId: b2bToolSuiteOverrides.b2bSuiteId,
        suiteName: b2bSuites.name,
      })
      .from(b2bToolSuiteOverrides)
      .innerJoin(b2bSuites, eq(b2bToolSuiteOverrides.b2bSuiteId, b2bSuites.id))
      .where(
        and(
          eq(b2bToolSuiteOverrides.toolId, toolId),
          eq(b2bSuites.isActive, true),
        ),
      )
      .limit(1);

    if (override) return override;
  }

  // 2. Fall back to category→suite mapping
  const [mapping] = await db
    .select({
      suiteId: b2bSuiteCategories.b2bSuiteId,
      suiteName: b2bSuites.name,
    })
    .from(b2bSuiteCategories)
    .innerJoin(b2bSuites, eq(b2bSuiteCategories.b2bSuiteId, b2bSuites.id))
    .where(
      and(
        eq(b2bSuiteCategories.category, category),
        eq(b2bSuites.isActive, true),
      ),
    )
    .limit(1);

  return mapping ?? null;
}

// ─── Subscription lookup ──────────────────────────────────────

/**
 * Get the user's active B2B subscription and plan ID.
 * Returns null if the user doesn't have an active B2B subscription.
 */
export async function getActiveB2bSubscription(userId: string): Promise<{
  subscriptionId: string;
  b2bPlanId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
} | null> {
  const [sub] = await db
    .select({
      subscriptionId: b2bSubscriptions.id,
      b2bPlanId: b2bSubscriptions.b2bPlanId,
      currentPeriodStart: b2bSubscriptions.currentPeriodStart,
      currentPeriodEnd: b2bSubscriptions.currentPeriodEnd,
    })
    .from(b2bSubscriptions)
    .where(
      and(
        eq(b2bSubscriptions.userId, userId),
        eq(b2bSubscriptions.status, 'active'),
        sql`${b2bSubscriptions.currentPeriodEnd} > NOW()`,
      ),
    )
    .limit(1);

  return sub ?? null;
}

// ─── Quota check ──────────────────────────────────────────────

/**
 * Check if a B2B user has remaining quota for a given suite.
 * Returns { allowed, used, limit, remaining }.
 * Accepts an optional pre-fetched subscription to avoid redundant DB lookups.
 */
export async function checkB2bQuota(
  userId: string,
  suiteId: string,
  existingSub?: { subscriptionId: string; b2bPlanId: string; currentPeriodStart: Date; currentPeriodEnd: Date },
): Promise<B2bQuotaCheck> {
  const sub = existingSub ?? await getActiveB2bSubscription(userId);
  if (!sub) {
    throw new B2bNoSubscriptionError();
  }

  // Get the quota limit for this plan + suite
  const [quota] = await db
    .select({
      monthlyLimit: b2bPlanQuotas.monthlyLimit,
      suiteName: b2bSuites.name,
    })
    .from(b2bPlanQuotas)
    .innerJoin(b2bSuites, eq(b2bPlanQuotas.b2bSuiteId, b2bSuites.id))
    .where(
      and(
        eq(b2bPlanQuotas.b2bPlanId, sub.b2bPlanId),
        eq(b2bPlanQuotas.b2bSuiteId, suiteId),
      ),
    )
    .limit(1);

  if (!quota) {
    throw new B2bSuiteNotAvailableError(suiteId);
  }

  // Get current usage for this period
  const [usage] = await db
    .select({ usageCount: b2bUsage.usageCount })
    .from(b2bUsage)
    .where(
      and(
        eq(b2bUsage.userId, userId),
        eq(b2bUsage.b2bSuiteId, suiteId),
        eq(b2bUsage.periodStart, sub.currentPeriodStart),
      ),
    )
    .limit(1);

  const used = usage?.usageCount ?? 0;
  const limit = quota.monthlyLimit;
  const remaining = Math.max(0, limit - used);

  return {
    allowed: used < limit,
    suiteId,
    suiteName: quota.suiteName,
    used,
    limit,
    remaining,
  };
}

// ─── Usage increment (atomic, post-success only) ──────────────

/**
 * Increment usage count atomically after a successful execution.
 * Uses INSERT ... ON CONFLICT + atomic WHERE clause to prevent racing past the limit.
 *
 * Returns the new usage count, or throws if the limit is already reached.
 * Accepts an optional pre-fetched subscription to avoid redundant DB lookups.
 */
export async function incrementB2bUsage(
  userId: string,
  suiteId: string,
  existingSub?: { subscriptionId: string; b2bPlanId: string; currentPeriodStart: Date; currentPeriodEnd: Date },
): Promise<B2bUsageIncrementResult> {
  const sub = existingSub ?? await getActiveB2bSubscription(userId);
  if (!sub) {
    throw new B2bNoSubscriptionError();
  }

  // Get the quota limit for this plan + suite
  const [quota] = await db
    .select({ monthlyLimit: b2bPlanQuotas.monthlyLimit })
    .from(b2bPlanQuotas)
    .where(
      and(
        eq(b2bPlanQuotas.b2bPlanId, sub.b2bPlanId),
        eq(b2bPlanQuotas.b2bSuiteId, suiteId),
      ),
    )
    .limit(1);

  if (!quota) {
    throw new B2bSuiteNotAvailableError(suiteId);
  }

  const limit = quota.monthlyLimit;

  // Atomic upsert with limit guard:
  // INSERT if no row exists for this period, or UPDATE if usage_count < limit
  const result = await db.execute(sql`
    INSERT INTO b2b_usage (id, user_id, b2b_suite_id, period_start, period_end, usage_count, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      ${userId},
      ${suiteId},
      ${sub.currentPeriodStart},
      ${sub.currentPeriodEnd},
      1,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id, b2b_suite_id, period_start)
    DO UPDATE SET
      usage_count = b2b_usage.usage_count + 1,
      updated_at = NOW()
    WHERE b2b_usage.usage_count < ${limit}
    RETURNING usage_count
  `);

  const rows = result.rows as Array<{ usage_count: number }>;
  if (!rows || rows.length === 0) {
    // No row returned = the WHERE clause failed = limit reached
    throw new B2bQuotaExhaustedError(suiteId, limit);
  }

  const newUsageCount = rows[0]!.usage_count;
  return {
    newUsageCount,
    limit,
    remaining: limit - newUsageCount,
  };
}

// ─── Usage summary ────────────────────────────────────────────

/**
 * Get usage summary across all suites for a B2B user's current period.
 */
export async function getB2bUsageSummary(
  userId: string,
): Promise<B2bUsageSummary[]> {
  const sub = await getActiveB2bSubscription(userId);
  if (!sub) {
    throw new B2bNoSubscriptionError();
  }

  // Get all quotas for the user's plan, joined with current usage
  const rows = await db
    .select({
      suiteId: b2bSuites.id,
      suiteSlug: b2bSuites.slug,
      suiteName: b2bSuites.name,
      limit: b2bPlanQuotas.monthlyLimit,
      used: sql<number>`COALESCE(${b2bUsage.usageCount}, 0)`,
    })
    .from(b2bPlanQuotas)
    .innerJoin(b2bSuites, eq(b2bPlanQuotas.b2bSuiteId, b2bSuites.id))
    .leftJoin(
      b2bUsage,
      and(
        eq(b2bUsage.b2bSuiteId, b2bPlanQuotas.b2bSuiteId),
        eq(b2bUsage.userId, userId),
        eq(b2bUsage.periodStart, sub.currentPeriodStart),
      ),
    )
    .where(eq(b2bPlanQuotas.b2bPlanId, sub.b2bPlanId));

  return rows.map((row) => ({
    suiteId: row.suiteId,
    suiteSlug: row.suiteSlug,
    suiteName: row.suiteName,
    used: Number(row.used),
    limit: row.limit,
    remaining: Math.max(0, row.limit - Number(row.used)),
  }));
}

// ─── Errors ───────────────────────────────────────────────────

export class B2bQuotaExhaustedError extends Error {
  public readonly suiteId: string;
  public readonly limit: number;

  constructor(suiteId: string, limit: number) {
    super(`B2B quota exhausted for suite ${suiteId}. Monthly limit: ${limit}`);
    this.name = 'B2bQuotaExhaustedError';
    this.suiteId = suiteId;
    this.limit = limit;
  }
}

export class B2bNoSubscriptionError extends Error {
  constructor() {
    super('No active B2B subscription found');
    this.name = 'B2bNoSubscriptionError';
  }
}

export class B2bSuiteNotAvailableError extends Error {
  public readonly suiteId: string;

  constructor(suiteId: string) {
    super(`Suite ${suiteId} is not available in your B2B plan`);
    this.name = 'B2bSuiteNotAvailableError';
    this.suiteId = suiteId;
  }
}
