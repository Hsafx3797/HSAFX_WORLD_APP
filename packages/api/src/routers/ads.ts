/**
 * Ad Rewards tRPC Router
 * Reference: SOLUTION_ROADMAP Task 4.9, 20_BILLING_SYSTEM.md §8
 *
 * All endpoints require authentication (protectedProcedure).
 * Only Free plan users can watch ads (Pro/Advance are ad-free).
 *
 * Uses lazy dynamic imports with type assertions for ad-reward-service
 * (lives in apps/web, resolves at runtime via Next.js bundler).
 * Same pattern as tools.ts execute mutation.
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';

// ── TRPC error code type ──
type TRPCErrorCode = ConstructorParameters<typeof TRPCError>[0]['code'];

// ── Local type declarations for lazy-imported ad-reward-service ──
type AdWatchStats = {
  adsWatchedToday: number;
  coinsEarnedToday: number;
  dailyAdCap: number;
  dailyCoinCap: number;
  remainingAds: number;
  remainingCoins: number;
};

type InitiateResult = {
  rewardId: string;
  expiresAt: Date;
  requiresCaptcha: boolean;
};

type CompleteResult = {
  coinsAwarded: number;
  newBalance: number;
  adsWatchedToday: number;
  coinsEarnedToday: number;
};

type AdRewardServiceModule = {
  initiateAdWatch: (userId: string, ipAddress: string, fingerprint?: string) => Promise<InitiateResult>;
  completeAdWatch: (rewardId: string, userId: string, watchDurationMs: number, captchaToken?: string) => Promise<CompleteResult>;
  getAdWatchStats: (userId: string) => Promise<AdWatchStats>;
};

/** Lazy-load ad-reward-service (resolves via @/ alias at Next.js runtime) */
async function loadAdRewardService(): Promise<AdRewardServiceModule> {
  // @ts-expect-error — @/ alias resolves at Next.js build time, not in packages/api tsconfig
  return (await import('@/server/ads/ad-reward-service')) as AdRewardServiceModule;
}

/** Duck-type check for AdRewardError (avoids cross-package instanceof). */
function isAdRewardError(err: unknown): err is { code: string; message: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    'message' in err &&
    typeof (err as Record<string, unknown>).code === 'string' &&
    typeof (err as Record<string, unknown>).message === 'string'
  );
}

export const adsRouter = router({
  /**
   * Get current ad watch statistics for the user.
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const mod = await loadAdRewardService();
    return mod.getAdWatchStats(ctx.user.id);
  }),

  /**
   * Initiate an ad watch session.
   * Returns a rewardId and expiration timestamp.
   */
  initiate: protectedProcedure
    .input(
      z.object({
        fingerprint: z.string().max(64).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const mod = await loadAdRewardService();

      const ipAddress =
        ctx.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        ctx.headers.get('x-real-ip') ??
        '127.0.0.1';

      try {
        return await mod.initiateAdWatch(
          ctx.user.id,
          ipAddress,
          input.fingerprint,
        );
      } catch (err: unknown) {
        if (isAdRewardError(err)) {
          const httpCode: TRPCErrorCode =
            err.code === 'DAILY_CAP_REACHED' || err.code === 'IP_RATE_LIMITED'
              ? 'TOO_MANY_REQUESTS'
              : err.code === 'CAPTCHA_REQUIRED'
                ? 'PRECONDITION_FAILED'
                : err.code === 'NOT_ELIGIBLE'
                  ? 'FORBIDDEN'
                  : 'BAD_REQUEST';

          throw new TRPCError({
            code: httpCode,
            message: err.message,
            cause: err,
          });
        }
        throw err;
      }
    }),

  /**
   * Complete/verify an ad watch and credit coins.
   */
  complete: protectedProcedure
    .input(
      z.object({
        rewardId: z.string().uuid(),
        watchDurationMs: z.number().int().min(0),
        captchaToken: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const mod = await loadAdRewardService();

      try {
        return await mod.completeAdWatch(
          input.rewardId,
          ctx.user.id,
          input.watchDurationMs,
          input.captchaToken,
        );
      } catch (err: unknown) {
        if (isAdRewardError(err)) {
          const httpCode: TRPCErrorCode =
            err.code === 'EXPIRED'
              ? 'TIMEOUT'
              : err.code === 'FRAUD_DETECTED'
                ? 'FORBIDDEN'
                : err.code === 'WATCH_TOO_SHORT'
                  ? 'BAD_REQUEST'
                  : err.code === 'ALREADY_VERIFIED'
                    ? 'CONFLICT'
                    : 'BAD_REQUEST';

          throw new TRPCError({
            code: httpCode,
            message: err.message,
            cause: err,
          });
        }
        throw err;
      }
    }),

  // ─── Ad Config ────────────────────────────────────────────

  /**
   * Get ad reward configuration for the current user's plan tier.
   * Pro and Advance plans are ad-free; Free plan gets ad config.
   */
  getConfig: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.user;

    // Pro and Advance plans are ad-free per billing spec
    const tier = (user as Record<string, unknown>).tier as string | undefined;
    const isAdFree = tier === 'pro' || tier === 'advance';

    if (isAdFree) {
      return {
        adsEnabled: false,
        dailyAdCap: 0,
        dailyCoinCap: 0,
        coinsPerAd: 0,
        minWatchDurationMs: 0,
        captchaRequired: false,
      };
    }

    // Free plan ad configuration (from billing spec §8)
    return {
      adsEnabled: true,
      dailyAdCap: 10,
      dailyCoinCap: 50,
      coinsPerAd: 5,
      minWatchDurationMs: 15_000, // 15 seconds
      captchaRequired: true,
    };
  }),
});
