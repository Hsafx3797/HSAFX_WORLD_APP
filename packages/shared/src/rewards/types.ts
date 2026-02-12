/**
 * Login Reward System Types
 * HSAFX WORLD - Types for login-based coin reward system
 *
 * Replaces the old ad-watching reward system.
 */

/** Reward types available */
export type RewardType = 'daily' | 'hourly';

/** Login reward configuration */
export interface LoginRewardConfig {
  coinsPerReward: number;
  dailyCoinCap: number;
  hourlyCooldownMinutes: number;
}

/** Default reward configuration */
export const DEFAULT_LOGIN_REWARD_CONFIG: LoginRewardConfig = {
  coinsPerReward: 10,
  dailyCoinCap: 50,
  hourlyCooldownMinutes: 60,
};

/** Result of claiming a login reward */
export interface ClaimRewardResult {
  success: boolean;
  rewardType: RewardType;
  coinsAwarded: number;
  newBalance: number;
  dailyCoinsEarned: number;
  dailyClaimsCount: number;
  dailyCoinCap: number;
}

/** Daily reward stats for a user */
export interface RewardStats {
  dailyCoinsEarned: number;
  dailyClaimsCount: number;
  dailyCoinCap: number;
  coinsPerReward: number;
  canClaimDaily: boolean;
  canClaimHourly: boolean;
  nextHourlyClaimAt: Date | null;
}

/** Login reward eligibility check result */
export interface CanClaimRewardResult {
  canClaim: boolean;
  reason?: string;
  waitMinutes?: number;
}
