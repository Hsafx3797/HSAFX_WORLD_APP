/**
 * Polar SDK Client — used by tRPC billing routes
 * HSAFX WORLD — Polar is the Merchant of Record for subscriptions (Pro/Advance).
 */

import { Polar } from '@polar-sh/sdk';

let _polar: Polar | null = null;

/**
 * Lazy-initialised Polar client singleton.
 * Throws at call-time if POLAR_ACCESS_TOKEN is missing.
 */
export function getPolar(): Polar {
  if (!_polar) {
    const token = process.env.POLAR_ACCESS_TOKEN;
    if (!token) {
      throw new Error(
        '[polar] POLAR_ACCESS_TOKEN env var is required for subscription billing',
      );
    }
    _polar = new Polar({
      accessToken: token,
      ...(process.env.POLAR_ENVIRONMENT === 'sandbox' && { server: 'sandbox' }),
    });
  }
  return _polar;
}
