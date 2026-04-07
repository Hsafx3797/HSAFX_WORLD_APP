/**
 * Stripe Metered Billing — Usage Reporting
 *
 * Reports API usage to Stripe Billing Meters for B2B customers.
 * Only fires for users with a stripeCustomerId set on their account.
 *
 * Uses the Stripe Billing Meter Events API (stripe.billing.meterEvents.create).
 * The meter event name is configured via STRIPE_USAGE_METER_NAME env var
 * (defaults to "api_calls").
 *
 * This is fire-and-forget — failures are logged but never block the request.
 */

import { stripe } from '@/lib/stripe';
import { db, users, eq } from '@hsafx/db';
import { createLogger } from '@hsafx/shared/logger';

const log = createLogger('stripe-usage');
const METER_EVENT_NAME = process.env.STRIPE_USAGE_METER_NAME ?? 'api_calls';

/**
 * Report a tool execution to Stripe metered billing.
 * No-op if the user has no stripeCustomerId.
 */
export async function reportStripeUsage(
  userId: string,
  toolId: string,
  coinCost: number,
): Promise<void> {
  try {
    // Look up user's Stripe customer ID
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return; // Not a Stripe-billed customer — skip
    }

    // Don't report free tools (coinCost=0) to Stripe
    if (coinCost <= 0) {
      return;
    }

    await stripe.billing.meterEvents.create({
      event_name: METER_EVENT_NAME,
      payload: {
        stripe_customer_id: user.stripeCustomerId,
        value: String(coinCost),
      },
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (err) {
    // Never let Stripe errors block the execution pipeline
    log.error('Failed to report usage to Stripe', {
      userId,
      toolId,
      coinCost,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
