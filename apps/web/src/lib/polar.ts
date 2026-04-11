/**
 * Polar SDK Client Singleton
 * HSAFX WORLD — Polar is the Merchant of Record for subscriptions (Pro/Advance).
 *
 * Polar handles:
 *   - Subscription checkout sessions
 *   - Subscription lifecycle (cancel, reactivate)
 *   - Tax collection & compliance
 *
 * Stripe continues to handle coin-pack one-time purchases separately.
 */

import { Polar } from '@polar-sh/sdk';

/**
 * Singleton Polar client (lazy).
 * Uses server-side access token — never expose to the browser.
 * Lazy-initialized to avoid warning/crashing at module load when POLAR_ACCESS_TOKEN is missing.
 */
let _polar: Polar | undefined;

export function getPolar(): Polar {
  if (!_polar) {
    if (!process.env.POLAR_ACCESS_TOKEN) {
      throw new Error('[polar] POLAR_ACCESS_TOKEN is required for Polar operations');
    }
    _polar = new Polar({
      accessToken: process.env.POLAR_ACCESS_TOKEN,
      ...(process.env.POLAR_ENVIRONMENT === 'sandbox' && { server: 'sandbox' }),
    });
  }
  return _polar;
}

/**
 * @deprecated Use getPolar() instead. This getter exists for backward compatibility.
 * Throws at access time (not import time) if POLAR_ACCESS_TOKEN is missing.
 */
export const polar = new Proxy({} as Polar, {
  get(_target, prop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (getPolar() as any)[prop];
  },
});
