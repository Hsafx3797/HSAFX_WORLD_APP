/**
 * Ad Reward Service
 * HSAFX WORLD - Core service for ad-watching coin rewards
 */

import type {
  AdRewardConfig,
  AdRewardTransaction,
  UserAdDailyCap,
  AdWatchResult,
  AdAvailability,
  AdProvider,
  AdProviderCallback,
  FingerprintData,
  FraudFlags,
  AdTransactionStatus,
} from './types';
import { DEFAULT_AD_REWARD_CONFIG } from './types';
import {
  canUserWatchAd,
  isIpRateLimited,
  isValidWatchDuration,
  getDailyRemaining,
  generateFingerprintHash,
  detectFraudIndicators,
  calculateCooldownEnd,
  calculateTransactionExpiration,
} from './validation';

/**
 * Generate unique transaction ID
 */
export function generateTransactionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `ad_${timestamp}_${random}`;
}

/**
 * Get today's date string (UTC)
 */
export function getTodayDateString(): string {
  const parts = new Date().toISOString().split('T');
  return parts[0] ?? new Date().toISOString().slice(0, 10);
}

/**
 * Check ad availability for user
 */
export function checkAdAvailability(
  userId: string,
  dailyCap: UserAdDailyCap | undefined,
  adsFromIpInHour: number,
  adsWatchedInSession: number,
  config: AdRewardConfig = DEFAULT_AD_REWARD_CONFIG
): AdAvailability {
  // Check IP rate limit
  if (isIpRateLimited(adsFromIpInHour, config)) {
    return {
      available: false,
      reason: 'Too many ads from this network. Please try again later.',
      dailyAdsRemaining: 0,
      dailyCoinsRemaining: 0,
      requiresCaptcha: false,
    };
  }

  // Check user can watch
  const canWatch = canUserWatchAd(dailyCap, adsWatchedInSession, config);
  if (!canWatch.canWatch) {
    const remaining = getDailyRemaining(dailyCap, config);
    return {
      available: false,
      reason: canWatch.reason ?? 'Cannot watch ad',
      cooldownRemaining: canWatch.cooldownRemaining,
      dailyAdsRemaining: remaining.adsRemaining,
      dailyCoinsRemaining: remaining.coinsRemaining,
      requiresCaptcha: false,
    };
  }

  const remaining = getDailyRemaining(dailyCap, config);
  return {
    available: true,
    dailyAdsRemaining: remaining.adsRemaining,
    dailyCoinsRemaining: remaining.coinsRemaining,
    requiresCaptcha: canWatch.requiresCaptcha,
    suggestedProvider: config.primaryProvider,
  };
}

/**
 * Create ad watch transaction (before ad starts)
 */
export function createAdTransaction(
  userId: string,
  adUnitId: string,
  provider: AdProvider,
  ipAddress: string,
  fingerprintData: FingerprintData,
  config: AdRewardConfig = DEFAULT_AD_REWARD_CONFIG
): AdRewardTransaction {
  const now = Date.now();
  const fingerprint = generateFingerprintHash(fingerprintData);

  return {
    id: generateTransactionId(),
    userId,
    adUnitId,
    provider,
    status: 'pending',
    validationStatus: 'pending',
    coinsAwarded: 0,
    watchDuration: 0,
    startedAt: now,
    expiresAt: calculateTransactionExpiration(config),
    ipAddress,
    fingerprint,
    userAgent: fingerprintData.userAgent,
  };
}

/**
 * Process ad provider callback (ad completion)
 */
export function processAdCallback(
  transaction: AdRewardTransaction,
  callback: AdProviderCallback,
  watchDuration: number,
  recentTransactions: { fingerprint: string; timestamp: number }[],
  config: AdRewardConfig = DEFAULT_AD_REWARD_CONFIG
): {
  updatedTransaction: AdRewardTransaction;
  fraudFlags: FraudFlags;
  shouldCredit: boolean;
} {
  const now = Date.now();

  // Check if transaction expired
  if (now > transaction.expiresAt) {
    return {
      updatedTransaction: {
        ...transaction,
        status: 'expired',
        validationStatus: 'expired',
        completedAt: now,
      },
      fraudFlags: detectFraudIndicators(
        transaction.fingerprint,
        transaction.ipAddress,
        watchDuration,
        recentTransactions,
        config
      ),
      shouldCredit: false,
    };
  }

  // Check ad completion status
  if (callback.status !== 'complete') {
    return {
      updatedTransaction: {
        ...transaction,
        status: 'cancelled',
        validationStatus: 'invalid',
        completedAt: now,
        watchDuration,
      },
      fraudFlags: detectFraudIndicators(
        transaction.fingerprint,
        transaction.ipAddress,
        watchDuration,
        recentTransactions,
        config
      ),
      shouldCredit: false,
    };
  }

  // Validate watch duration
  if (!isValidWatchDuration(watchDuration, config)) {
    return {
      updatedTransaction: {
        ...transaction,
        status: 'fraud',
        validationStatus: 'fraud',
        completedAt: now,
        watchDuration,
        fraudReason: 'Ad completed too quickly',
      },
      fraudFlags: detectFraudIndicators(
        transaction.fingerprint,
        transaction.ipAddress,
        watchDuration,
        recentTransactions,
        config
      ),
      shouldCredit: false,
    };
  }

  // Detect fraud
  const fraudFlags = detectFraudIndicators(
    transaction.fingerprint,
    transaction.ipAddress,
    watchDuration,
    recentTransactions,
    config
  );

  // Check for fraud indicators
  const hasFraud = fraudFlags.automatedBehavior ||
                   fraudFlags.duplicateFingerprint ||
                   fraudFlags.suspiciousTiming;

  if (hasFraud) {
    const reasons: string[] = [];
    if (fraudFlags.automatedBehavior) reasons.push('Automated behavior detected');
    if (fraudFlags.duplicateFingerprint) reasons.push('Duplicate fingerprint');
    if (fraudFlags.suspiciousTiming) reasons.push('Suspicious timing');

    return {
      updatedTransaction: {
        ...transaction,
        status: 'fraud',
        validationStatus: 'fraud',
        completedAt: now,
        watchDuration,
        fraudReason: reasons.join(', '),
      },
      fraudFlags,
      shouldCredit: false,
    };
  }

  // Success - credit coins
  return {
    updatedTransaction: {
      ...transaction,
      status: 'verified',
      validationStatus: 'verified',
      coinsAwarded: config.coinsPerAd,
      completedAt: now,
      watchDuration,
    },
    fraudFlags,
    shouldCredit: true,
  };
}

/**
 * Update daily cap after successful ad watch
 */
export function updateDailyCap(
  existingCap: UserAdDailyCap | undefined,
  userId: string,
  coinsAwarded: number,
  config: AdRewardConfig = DEFAULT_AD_REWARD_CONFIG
): UserAdDailyCap {
  const now = Date.now();
  const today = getTodayDateString();

  if (!existingCap || existingCap.date !== today) {
    return {
      userId,
      date: today,
      adsWatched: 1,
      coinsEarned: coinsAwarded,
      lastAdAt: now,
      cooldownUntil: calculateCooldownEnd(config),
    };
  }

  return {
    ...existingCap,
    adsWatched: existingCap.adsWatched + 1,
    coinsEarned: existingCap.coinsEarned + coinsAwarded,
    lastAdAt: now,
    cooldownUntil: calculateCooldownEnd(config),
  };
}

/**
 * Format ad watch result for client
 */
export function formatAdWatchResult(
  success: boolean,
  transaction?: AdRewardTransaction,
  newBalance?: number,
  dailyCap?: UserAdDailyCap,
  error?: { code: string; message: string },
  config: AdRewardConfig = DEFAULT_AD_REWARD_CONFIG
): AdWatchResult {
  if (!success || !transaction) {
    const remaining = getDailyRemaining(dailyCap, config);
    return {
      success: false,
      error,
      dailyAdsRemaining: remaining.adsRemaining,
      dailyCoinsRemaining: remaining.coinsRemaining,
    };
  }

  const remaining = getDailyRemaining(dailyCap, config);
  const cooldownRemaining = dailyCap?.cooldownUntil
    ? Math.max(0, Math.ceil((dailyCap.cooldownUntil - Date.now()) / 1000))
    : config.cooldownBetweenAds;

  return {
    success: true,
    transactionId: transaction.id,
    coinsAwarded: transaction.coinsAwarded,
    newBalance,
    cooldownRemaining,
    dailyAdsRemaining: remaining.adsRemaining,
    dailyCoinsRemaining: remaining.coinsRemaining,
  };
}

/**
 * Redis keys for ad reward system
 */
export const AD_REWARD_REDIS_KEYS = {
  userDailyCap: (userId: string, date: string) => `ads:daily:${userId}:${date}`,
  ipHourlyCount: (ipHash: string, hour: number) => `ads:ip:${ipHash}:${hour}`,
  sessionCount: (sessionId: string) => `ads:session:${sessionId}`,
  transaction: (transactionId: string) => `ads:tx:${transactionId}`,
  userPenalty: (userId: string) => `ads:penalty:${userId}`,
  fingerprintHistory: (fingerprint: string) => `ads:fp:${fingerprint}`,
};
