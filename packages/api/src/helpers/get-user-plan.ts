/**
 * User Plan Resolution
 * Resolves a user's current plan from their active subscription.
 * Uses an in-memory TTL cache (5 min) to avoid repeated DB hits.
 */

import { db } from '@hsafx/db';
import { subscriptions, plans, eq, and } from '@hsafx/db/schema';
import type { UserPlan } from '@hsafx/shared/permissions';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const planCache = new Map<string, { plan: UserPlan; expiresAt: number }>();

/**
 * Look up the user's active subscription plan slug.
 * Returns 'free' for authenticated users with no active subscription,
 * or 'guest' for unauthenticated visitors.
 */
export async function getUserPlan(userId: string | null): Promise<UserPlan> {
  if (!userId) return 'guest';

  const now = Date.now();
  const cached = planCache.get(userId);
  if (cached && cached.expiresAt > now) {
    return cached.plan;
  }

  const [sub] = await db
    .select({ slug: plans.slug })
    .from(subscriptions)
    .innerJoin(plans, eq(plans.id, subscriptions.planId))
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active'),
      ),
    )
    .limit(1);

  // Map slug to UserPlan; default to 'free' for registered users
  const slug = sub?.slug;
  const plan: UserPlan = (slug === 'pro' || slug === 'advance') ? slug : 'free';

  planCache.set(userId, { plan, expiresAt: now + CACHE_TTL_MS });
  return plan;
}

/** Invalidate cached plan for a user (call on subscription change). */
export function invalidateUserPlanCache(userId: string): void {
  planCache.delete(userId);
}
