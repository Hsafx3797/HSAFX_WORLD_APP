/**
 * Login Reward Types
 * Reference: 20_BILLING_SYSTEM.md §8 (replaced ad rewards with login rewards)
 */

export type RewardType = 'daily' | 'hourly';

export interface ClaimRewardResult {
  success: boolean;
  rewardType: RewardType;
  coinsAwarded: number;
  newBalance: number;
  dailyCoinsEarned: number;
  dailyClaimsCount: number;
  dailyCoinCap: number;
}

export interface RewardStats {
  dailyCoinsEarned: number;
  dailyClaimsCount: number;
  dailyCoinCap: number;
  coinsPerReward: number;
  canClaimDaily: boolean;
  canClaimHourly: boolean;
  nextHourlyClaimAt: Date | null;
}

export class LoginRewardError extends Error {
  constructor(
    message: string,
    public code:
      | 'DAILY_CAP_REACHED'
      | 'ALREADY_CLAIMED'
      | 'COOLDOWN_ACTIVE'
      | 'NOT_ELIGIBLE',
  ) {
    super(message);
    this.name = 'LoginRewardError';
  }
}
