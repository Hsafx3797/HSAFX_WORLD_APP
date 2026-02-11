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

if (!process.env.POLAR_ACCESS_TOKEN) {
  console.warn(
    '[polar] POLAR_ACCESS_TOKEN is not set — Polar API calls will fail.',
  );
}

/**
 * Singleton Polar client.
 * Uses server-side access token — never expose to the browser.
 */
export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN ?? '',
  // Use sandbox for development; production uses default
  ...(process.env.POLAR_ENVIRONMENT === 'sandbox' && { server: 'sandbox' }),
});
