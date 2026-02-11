/**
 * Ad Reward System Types
 * HSAFX WORLD - Types for ad-watching coin reward system
 */

// Ad provider types
export type AdProvider = 'google_adsense' | 'meta_audience' | 'amazon' | 'unity';

// Ad unit types
export type AdUnitType = 'rewarded_video' | 'rewarded_interstitial' | 'banner';

// Ad transaction status
export type AdTransactionStatus = 
  | 'pending'     // Ad started, awaiting completion
  | 'completed'   // Ad watched successfully
  | 'verified'    // Completion verified, coins credited
  | 'expired'     // Verification timeout
  | 'fraud'       // Fraud detected
  | 'cancelled';  // User cancelled

// Validation status
export type ValidationStatus = 
  | 'pending'
  | 'verified'
  | 'expired'
  | 'fraud'
  | 'invalid';

// Ad reward configuration
export interface AdRewardConfig {
  coinsPerAd: number;
  dailyAdCap: number;
  dailyCoinCap: number;
  minWatchDuration: number; // in seconds
  cooldownBetweenAds: number; // in seconds
  verificationTimeout: number; // in milliseconds
  ipRateLimitPerHour: number;
  captchaTriggerAfter: number;
  primaryProvider: AdProvider;
  fallbackProviders: AdProvider[];
}

// Default configuration
export const DEFAULT_AD_REWARD_CONFIG: AdRewardConfig = {
  coinsPerAd: 10,
  dailyAdCap: 100,
  dailyCoinCap: 1000,
  minWatchDuration: 30,
  cooldownBetweenAds: 120, // 2 minutes
  verificationTimeout: 300000, // 5 minutes
  ipRateLimitPerHour: 10,
  captchaTriggerAfter: 20,
  primaryProvider: 'google_adsense',
  fallbackProviders: [],
};

// Ad reward transaction
export interface AdRewardTransaction {
  id: string;
  userId: string;
  adUnitId: string;
  provider: AdProvider;
  status: AdTransactionStatus;
  validationStatus: ValidationStatus;
  coinsAwarded: number;
  watchDuration: number;
  startedAt: number;
  completedAt?: number;
  expiresAt: number;
  ipAddress: string;
  fingerprint: string;
  userAgent: string;
  fraudReason?: string;
}

// User ad daily cap tracking
export interface UserAdDailyCap {
  userId: string;
  date: string; // YYYY-MM-DD
  adsWatched: number;
  coinsEarned: number;
  lastAdAt?: number;
  cooldownUntil?: number;
}

// Ad watch attempt result
export interface AdWatchResult {
  success: boolean;
  transactionId?: string;
  coinsAwarded?: number;
  newBalance?: number;
  error?: {
    code: string;
    message: string;
  };
  cooldownRemaining?: number;
  dailyAdsRemaining?: number;
  dailyCoinsRemaining?: number;
}

// Ad availability check result
export interface AdAvailability {
  available: boolean;
  reason?: string;
  cooldownRemaining?: number;
  dailyAdsRemaining: number;
  dailyCoinsRemaining: number;
  requiresCaptcha: boolean;
  suggestedProvider?: AdProvider;
}

// Browser fingerprint components
export interface FingerprintData {
  canvas: string;
  webgl: string;
  fonts: string[];
  timezone: string;
  language: string;
  screenResolution: string;
  colorDepth: number;
  hardwareConcurrency: number;
  userAgent: string;
}

// Penalty levels
export type PenaltyLevel = 'warning' | 'ban_24h' | 'ban_7d' | 'permanent_ban';

// User ad penalty record
export interface AdPenaltyRecord {
  userId: string;
  level: PenaltyLevel;
  reason: string;
  startedAt: number;
  expiresAt?: number;
  appealable: boolean;
  appealed: boolean;
  appealedAt?: number;
  appealReason?: string;
  appealResolution?: 'approved' | 'denied' | 'pending';
}

// Fraud detection flags
export interface FraudFlags {
  vpnDetected: boolean;
  proxyDetected: boolean;
  datacenterIp: boolean;
  suspiciousTiming: boolean;
  duplicateFingerprint: boolean;
  multipleAccounts: boolean;
  automatedBehavior: boolean;
  ipRateLimited: boolean;
}

// Ad provider callback data
export interface AdProviderCallback {
  provider: AdProvider;
  adUnitId: string;
  transactionId: string;
  status: 'complete' | 'skip' | 'error';
  timestamp: number;
  rewardAmount?: number;
  verificationToken?: string;
}
