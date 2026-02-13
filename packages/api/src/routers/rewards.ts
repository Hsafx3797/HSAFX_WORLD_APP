/**
 * Login Rewards tRPC Router
 * Reference: 20_BILLING_SYSTEM.md §8
 *
 * All endpoints require authentication (protectedProcedure).
 * Replaces the old ad-based rewards with daily/hourly login rewards.
 *
 * Uses lazy dynamic imports with type assertions for login-reward-service
 * (lives in apps/web, resolves at runtime via Next.js bundler).
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';

// ── Local type declarations for lazy-imported login-reward-service ──
type RewardType = 'daily' | 'hourly';

type ClaimRewardResult = {
  success: boolean;
  rewardType: RewardType;
  coinsAwarded: number;
  newBalance: number;
  dailyCoinsEarned: number;
  dailyClaimsCount: number;
  dailyCoinCap: number;
};

type RewardStats = {
  dailyCoinsEarned: number;
  dailyClaimsCount: number;
  dailyCoinCap: number;
  coinsPerReward: number;
  canClaimDaily: boolean;
  canClaimHourly: boolean;
  nextHourlyClaimAt: Date | null;
};

type LoginRewardServiceModule = {
  claimLoginReward: (userId: string, rewardType: RewardType) => Promise<ClaimRewardResult>;
  getLoginRewardStats: (userId: string) => Promise<RewardStats>;
};

/** Lazy-load login-reward-service (resolves via @/ alias at Next.js runtime) */
async function loadLoginRewardService(): Promise<LoginRewardServiceModule> {
  // @ts-expect-error — @/ alias resolves at Next.js runtime, not during standalone tsc
  return (await import('@/server/rewards/login-reward-service')) as LoginRewardServiceModule;
}

/** Duck-type check for LoginRewardError (avoids cross-package instanceof). */
function isLoginRewardError(err: unknown): err is { code: string; message: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    'message' in err &&
    typeof (err as Record<string, unknown>).code === 'string' &&
    typeof (err as Record<string, unknown>).message === 'string'
  );
}

const rewardTypeSchema = z.enum(['daily', 'hourly']);

export const rewardsRouter = router({
  /**
   * Get current login reward stats for the user.
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const mod = await loadLoginRewardService();
    return mod.getLoginRewardStats(ctx.user.id);
  }),

  /**
   * Claim a login reward (daily or hourly).
   */
  claim: protectedProcedure
    .input(z.object({ rewardType: rewardTypeSchema }))
    .mutation(async ({ ctx, input }) => {
      const mod = await loadLoginRewardService();

      try {
        return await mod.claimLoginReward(ctx.user.id, input.rewardType);
      } catch (err: unknown) {
        if (isLoginRewardError(err)) {
          const codeMap: Record<string, ConstructorParameters<typeof TRPCError>[0]['code']> = {
            DAILY_CAP_REACHED: 'TOO_MANY_REQUESTS',
            ALREADY_CLAIMED: 'CONFLICT',
            COOLDOWN_ACTIVE: 'TOO_MANY_REQUESTS',
            NOT_ELIGIBLE: 'FORBIDDEN',
          };

          throw new TRPCError({
            code: codeMap[err.code] ?? 'BAD_REQUEST',
            message: err.message,
            cause: err,
          });
        }
        throw err;
      }
    }),
});
