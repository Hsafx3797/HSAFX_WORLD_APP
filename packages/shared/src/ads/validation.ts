/**
 * Ad Reward Validation
 * HSAFX WORLD - Validation functions for ad-watching system
 */

import type {
  AdRewardConfig,
  UserAdDailyCap,
  FraudFlags,
  FingerprintData,
  PenaltyLevel,
} from './types';
import { DEFAULT_AD_REWARD_CONFIG } from './types';

/**
 * Check if user can watch an ad
 */
export interface CanWatchAdResult {
  canWatch: boolean;
  reason?: string;
  requiresCaptcha: boolean;
  cooldownRemaining?: number;
}

export function canUserWatchAd(
  dailyCap: UserAdDailyCap | undefined,
  adsWatchedInSession: number,
  config: AdRewardConfig = DEFAULT_AD_REWARD_CONFIG
): CanWatchAdResult {
  const now = Date.now();

  // No cap record means first ad of the day
  if (!dailyCap) {
    return {
      canWatch: true,
      requiresCaptcha: adsWatchedInSession >= config.captchaTriggerAfter,
    };
  }

  // Check daily ad cap
  if (dailyCap.adsWatched >= config.dailyAdCap) {
    return {
      canWatch: false,
      reason: 'Daily ad limit reached',
      requiresCaptcha: false,
    };
  }

  // Check daily coin cap
  if (dailyCap.coinsEarned >= config.dailyCoinCap) {
    return {
      canWatch: false,
      reason: 'Daily coin limit reached',
      requiresCaptcha: false,
    };
  }

  // Check cooldown
  if (dailyCap.cooldownUntil && now < dailyCap.cooldownUntil) {
    const cooldownRemaining = Math.ceil((dailyCap.cooldownUntil - now) / 1000);
    return {
      canWatch: false,
      reason: 'Please wait before watching another ad',
      requiresCaptcha: false,
      cooldownRemaining,
    };
  }

  // Determine if CAPTCHA is needed
  const totalAdsInSession = adsWatchedInSession + dailyCap.adsWatched;
  const requiresCaptcha = totalAdsInSession % config.captchaTriggerAfter === 0 &&
                          totalAdsInSession > 0;

  return {
    canWatch: true,
    requiresCaptcha,
  };
}

/**
 * Check IP rate limit
 */
export function isIpRateLimited(
  adsFromIpInHour: number,
  config: AdRewardConfig = DEFAULT_AD_REWARD_CONFIG
): boolean {
  return adsFromIpInHour >= config.ipRateLimitPerHour;
}

/**
 * Validate ad watch duration
 */
export function isValidWatchDuration(
  durationSeconds: number,
  config: AdRewardConfig = DEFAULT_AD_REWARD_CONFIG
): boolean {
  return durationSeconds >= config.minWatchDuration;
}

/**
 * Calculate remaining daily capacity
 */
export function getDailyRemaining(
  dailyCap: UserAdDailyCap | undefined,
  config: AdRewardConfig = DEFAULT_AD_REWARD_CONFIG
): { adsRemaining: number; coinsRemaining: number } {
  if (!dailyCap) {
    return {
      adsRemaining: config.dailyAdCap,
      coinsRemaining: config.dailyCoinCap,
    };
  }

  return {
    adsRemaining: Math.max(0, config.dailyAdCap - dailyCap.adsWatched),
    coinsRemaining: Math.max(0, config.dailyCoinCap - dailyCap.coinsEarned),
  };
}

/**
 * Generate fingerprint hash
 */
export function generateFingerprintHash(data: FingerprintData): string {
  const components = [
    data.canvas,
    data.webgl,
    data.fonts.sort().join(','),
    data.timezone,
    data.language,
    data.screenResolution,
    data.colorDepth.toString(),
    data.hardwareConcurrency.toString(),
  ];

  // Simple hash for demonstration - in production use proper SHA256
  return simpleHash(components.join('|'));
}

/**
 * Simple hash function (for demonstration)
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Detect fraud indicators
 */
export function detectFraudIndicators(
  fingerprint: string,
  ipAddress: string,
  watchDuration: number,
  recentTransactions: { fingerprint: string; timestamp: number }[],
  config: AdRewardConfig = DEFAULT_AD_REWARD_CONFIG
): FraudFlags {
  const now = Date.now();
  const oneHourAgo = now - 3600000;
  const fiveMinutesAgo = now - 300000;

  // Check for multiple transactions with same fingerprint in short time
  const recentSameFingerprint = recentTransactions.filter(
    t => t.fingerprint === fingerprint && t.timestamp > fiveMinutesAgo
  );

  // Check for suspiciously fast ad completion
  const suspiciousTiming = watchDuration < config.minWatchDuration;

  // Check for duplicate fingerprint (multiple accounts)
  const duplicateFingerprint = recentTransactions.filter(
    t => t.fingerprint === fingerprint && t.timestamp > oneHourAgo
  ).length > 10;

  // Note: VPN/proxy/datacenter detection would require external service
  // These are placeholder checks
  const vpnDetected = false;
  const proxyDetected = false;
  const datacenterIp = false;

  return {
    vpnDetected,
    proxyDetected,
    datacenterIp,
    suspiciousTiming,
    duplicateFingerprint,
    multipleAccounts: duplicateFingerprint,
    automatedBehavior: recentSameFingerprint.length > 3,
    ipRateLimited: false, // Checked separately
  };
}

/**
 * Determine penalty level based on offense count
 */
export function determinePenaltyLevel(offenseCount: number): PenaltyLevel {
  switch (offenseCount) {
    case 1:
      return 'warning';
    case 2:
      return 'ban_24h';
    case 3:
      return 'ban_7d';
    default:
      return 'permanent_ban';
  }
}

/**
 * Calculate penalty expiration
 */
export function calculatePenaltyExpiration(level: PenaltyLevel): number | undefined {
  const now = Date.now();
  
  switch (level) {
    case 'warning':
      return undefined; // No expiration for warnings
    case 'ban_24h':
      return now + 24 * 60 * 60 * 1000; // 24 hours
    case 'ban_7d':
      return now + 7 * 24 * 60 * 60 * 1000; // 7 days
    case 'permanent_ban':
      return undefined; // No expiration
  }
}

/**
 * Check if penalty is active
 */
export function isPenaltyActive(
  level: PenaltyLevel,
  expiresAt: number | undefined
): boolean {
  if (level === 'permanent_ban') {
    return true;
  }
  
  if (level === 'warning') {
    return false; // Warnings don't block
  }
  
  if (!expiresAt) {
    return false;
  }
  
  return Date.now() < expiresAt;
}

/**
 * Calculate cooldown end time after watching an ad
 */
export function calculateCooldownEnd(
  config: AdRewardConfig = DEFAULT_AD_REWARD_CONFIG
): number {
  return Date.now() + (config.cooldownBetweenAds * 1000);
}

/**
 * Calculate transaction expiration time
 */
export function calculateTransactionExpiration(
  config: AdRewardConfig = DEFAULT_AD_REWARD_CONFIG
): number {
  return Date.now() + config.verificationTimeout;
}
