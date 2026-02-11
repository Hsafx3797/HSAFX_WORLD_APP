/**
 * Stripe SDK Client — used by tRPC billing routes (coin packs only)
 * HSAFX WORLD — Stripe handles one-time coin-pack purchases.
 */

import Stripe from 'stripe';

let _stripe: Stripe | null = null;

/**
 * Lazy-initialised Stripe client singleton.
 * Throws at call-time if STRIPE_SECRET_KEY is missing.
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        '[stripe] STRIPE_SECRET_KEY env var is required for coin pack billing',
      );
    }
    _stripe = new Stripe(key, {
      apiVersion: '2026-01-28.clover',
    });
  }
  return _stripe;
}
