/**
 * User Plan Resolution
 * Resolves a user's current plan from their active subscription.
 */

import { db } from '@hsafx/db';
import { subscriptions, plans, eq, and } from '@hsafx/db/schema';
import type { UserPlan } from '@hsafx/shared/permissions';

/**
 * Look up the user's active subscription plan slug.
 * Returns 'free' for authenticated users with no active subscription,
 * or 'guest' for unauthenticated visitors.
 */
export async function getUserPlan(userId: string | null): Promise<UserPlan> {
  if (!userId) return 'guest';

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
  if (slug === 'pro' || slug === 'advance') return slug;
  return 'free';
}
