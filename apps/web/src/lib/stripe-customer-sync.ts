/**
 * Stripe Customer Sync
 *
 * Creates a Stripe customer on user registration and stores
 * `stripeCustomerId` on the users table.
 *
 * A single Stripe customer handles both:
 * - B2C coin-pack purchases
 * - B2B metered subscription billing
 * Payment methods are shared across both systems.
 */

import { db } from '@hsafx/db';
import { users, eq } from '@hsafx/db/schema';
import { getStripe } from '@/lib/stripe';
import { createLogger } from '@hsafx/shared/logger';

const log = createLogger('stripe-customer-sync');

/**
 * Create or link a Stripe customer for a newly registered user.
 * Idempotent — skips if the user already has a `stripeCustomerId`.
 */
export async function syncStripeCustomer(userId: string, email: string, name?: string): Promise<void> {
  // Check if user already has a Stripe customer
  const [user] = await db
    .select({ stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user?.stripeCustomerId) {
    log.debug('Stripe customer already linked', { userId });
    return;
  }

  // Check for existing Stripe customer by email (e.g. if they previously purchased as guest)
  const existing = await getStripe().customers.list({ email, limit: 1 });

  let stripeCustomerId: string;

  if (existing.data.length > 0) {
    stripeCustomerId = existing.data[0]!.id;
    // Update Stripe metadata to link to our user
    await getStripe().customers.update(stripeCustomerId, {
      metadata: { hsafx_user_id: userId },
      ...(name ? { name } : {}),
    });
    log.info('Linked existing Stripe customer', { userId, stripeCustomerId });
  } else {
    const customer = await getStripe().customers.create({
      email,
      ...(name ? { name } : {}),
      metadata: { hsafx_user_id: userId },
    });
    stripeCustomerId = customer.id;
    log.info('Created new Stripe customer', { userId, stripeCustomerId });
  }

  await db
    .update(users)
    .set({ stripeCustomerId })
    .where(eq(users.id, userId));
}
