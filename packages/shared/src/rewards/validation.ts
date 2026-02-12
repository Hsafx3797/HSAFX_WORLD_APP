/**
 * Login Reward Validation Utilities
 * HSAFX WORLD - Validation helpers for login rewards
 */

import { DEFAULT_LOGIN_REWARD_CONFIG } from './types';
import type { CanClaimRewardResult, LoginRewardConfig } from './types';

/**
 * Check if the user can claim a daily reward.
 */
export function canClaimDailyReward(
  lastDailyClaimToday: boolean,
  dailyCoinsEarned: number,
  config: LoginRewardConfig = DEFAULT_LOGIN_REWARD_CONFIG,
): CanClaimRewardResult {
  if (dailyCoinsEarned >= config.dailyCoinCap) {
    return { canClaim: false, reason: 'Daily coin cap reached' };
  }
  if (lastDailyClaimToday) {
    return { canClaim: false, reason: 'Daily reward already claimed today' };
  }
  return { canClaim: true };
}

/**
 * Check if the user can claim an hourly reward.
 */
export function canClaimHourlyReward(
  lastHourlyClaimAt: Date | null,
  dailyCoinsEarned: number,
  config: LoginRewardConfig = DEFAULT_LOGIN_REWARD_CONFIG,
): CanClaimRewardResult {
  if (dailyCoinsEarned >= config.dailyCoinCap) {
    return { canClaim: false, reason: 'Daily coin cap reached' };
  }

  if (lastHourlyClaimAt) {
    const cooldownMs = config.hourlyCooldownMinutes * 60 * 1000;
    const cooldownEnd = new Date(lastHourlyClaimAt.getTime() + cooldownMs);
    const now = new Date();

    if (now < cooldownEnd) {
      const waitMs = cooldownEnd.getTime() - now.getTime();
      const waitMinutes = Math.ceil(waitMs / 60000);
      return {
        canClaim: false,
        reason: 'Hourly reward on cooldown',
        waitMinutes,
      };
    }
  }

  return { canClaim: true };
}

/**
 * Get remaining coins available today.
 */
export function getDailyCoinsRemaining(
  dailyCoinsEarned: number,
  config: LoginRewardConfig = DEFAULT_LOGIN_REWARD_CONFIG,
): number {
  return Math.max(0, config.dailyCoinCap - dailyCoinsEarned);
}
