/**
 * Stripe SDK Client Singleton
 * HSAFX WORLD — Stripe handles coin-pack one-time purchases only.
 *
 * Subscriptions are handled by Polar (Merchant of Record).
 * This Stripe client is used for:
 *   - Creating coin-pack checkout sessions
 *   - Verifying webhook signatures (in the webhook route)
 */

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn(
    '[stripe] STRIPE_SECRET_KEY is not set — Stripe API calls will fail.',
  );
}

/**
 * Singleton Stripe client.
 * Uses server-side secret key — never expose to the browser.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2026-01-28.clover',
});
