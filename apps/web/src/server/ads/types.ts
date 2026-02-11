/**
 * Ad Reward Types
 * Separated from ad-reward-service.ts because "use server" files
 * can only export async functions.
 */

export interface AdWatchInitResult {
  rewardId: string;
  expiresAt: Date;
  requiresCaptcha: boolean;
}

export interface AdWatchCompleteResult {
  success: boolean;
  coinsAwarded: number;
  newBalance: number;
  dailyAdsRemaining: number;
  error?: string;
}

export class AdRewardError extends Error {
  constructor(
    message: string,
    public code:
      | 'DAILY_CAP_REACHED'
      | 'IP_RATE_LIMITED'
      | 'CAPTCHA_REQUIRED'
      | 'NOT_ELIGIBLE'
      | 'INVALID_REWARD'
      | 'EXPIRED'
      | 'ALREADY_VERIFIED'
      | 'WATCH_TOO_SHORT'
      | 'FRAUD_DETECTED',
  ) {
    super(message);
    this.name = 'AdRewardError';
  }
}
