/**
 * Stripe SDK Client Singleton
 * HSAFX WORLD — Stripe handles coin-pack payments and B2B metered billing.
 *
 * Subscriptions are handled by Polar (Merchant of Record).
 * This Stripe client is used for:
 *   - Creating coin-pack checkout sessions
 *   - Verifying webhook signatures (in the webhook route)
 *   - Reporting B2B API usage via Billing Meter Events
 */

import Stripe from 'stripe';

/**
 * Singleton Stripe client (lazy).
 * Uses server-side secret key — never expose to the browser.
 * Lazy-initialized to avoid crashing at module load when STRIPE_SECRET_KEY is missing.
 */
let _stripe: Stripe | undefined;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('[stripe] STRIPE_SECRET_KEY is required for Stripe operations');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
    });
  }
  return _stripe;
}

/**
 * @deprecated Use getStripe() instead. This getter exists for backward compatibility.
 * Throws at access time (not import time) if STRIPE_SECRET_KEY is missing.
 */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as Record<string | symbol, unknown>)[prop];
  },
});
