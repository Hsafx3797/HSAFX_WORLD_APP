import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  canUserWatchAd,
  isIpRateLimited,
  isValidWatchDuration,
  getDailyRemaining,
  generateFingerprintHash,
  detectFraudIndicators,
  determinePenaltyLevel,
  calculatePenaltyExpiration,
  isPenaltyActive,
  calculateCooldownEnd,
  calculateTransactionExpiration,
} from '../validation';
import type { AdRewardConfig, UserAdDailyCap, FingerprintData } from '../types';
import { DEFAULT_AD_REWARD_CONFIG } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW = 1_700_000_000_000; // fixed timestamp for fake timers

function makeConfig(overrides: Partial<AdRewardConfig> = {}): AdRewardConfig {
  return { ...DEFAULT_AD_REWARD_CONFIG, ...overrides };
}

function makeDailyCap(overrides: Partial<UserAdDailyCap> = {}): UserAdDailyCap {
  return {
    userId: 'user-1',
    date: '2026-02-11',
    adsWatched: 0,
    coinsEarned: 0,
    ...overrides,
  };
}

function makeFingerprint(overrides: Partial<FingerprintData> = {}): FingerprintData {
  return {
    canvas: 'canvas-hash',
    webgl: 'webgl-hash',
    fonts: ['Arial', 'Helvetica'],
    timezone: 'Asia/Karachi',
    language: 'en-US',
    screenResolution: '1920x1080',
    colorDepth: 24,
    hardwareConcurrency: 8,
    userAgent: 'Mozilla/5.0',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// canUserWatchAd
// ---------------------------------------------------------------------------

describe('canUserWatchAd', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow first ad when dailyCap is undefined', () => {
    const result = canUserWatchAd(undefined, 0);
    expect(result.canWatch).toBe(true);
    expect(result.requiresCaptcha).toBe(false);
  });

  it('should not require captcha when adsWatchedInSession < captchaTriggerAfter and no dailyCap', () => {
    const result = canUserWatchAd(undefined, 5);
    expect(result.requiresCaptcha).toBe(false);
  });

  it('should require captcha when adsWatchedInSession >= captchaTriggerAfter and no dailyCap', () => {
    const result = canUserWatchAd(undefined, 20);
    expect(result.requiresCaptcha).toBe(true);
  });

  it('should require captcha when adsWatchedInSession far exceeds captchaTriggerAfter', () => {
    const result = canUserWatchAd(undefined, 40);
    expect(result.requiresCaptcha).toBe(true);
  });

  it('should deny when daily ad cap is reached', () => {
    const cap = makeDailyCap({ adsWatched: 100 });
    const result = canUserWatchAd(cap, 0);
    expect(result.canWatch).toBe(false);
    expect(result.reason).toBe('Daily ad limit reached');
    expect(result.requiresCaptcha).toBe(false);
  });

  it('should deny when daily coin cap is reached', () => {
    const cap = makeDailyCap({ adsWatched: 50, coinsEarned: 1000 });
    const result = canUserWatchAd(cap, 0);
    expect(result.canWatch).toBe(false);
    expect(result.reason).toBe('Daily coin limit reached');
    expect(result.requiresCaptcha).toBe(false);
  });

  it('should deny when cooldown is active', () => {
    const cap = makeDailyCap({ cooldownUntil: NOW + 60_000 }); // 60 s in future
    const result = canUserWatchAd(cap, 0);
    expect(result.canWatch).toBe(false);
    expect(result.reason).toBe('Please wait before watching another ad');
    expect(result.cooldownRemaining).toBe(60);
  });

  it('should compute cooldownRemaining with ceiling', () => {
    const cap = makeDailyCap({ cooldownUntil: NOW + 1_500 }); // 1.5 s
    const result = canUserWatchAd(cap, 0);
    expect(result.cooldownRemaining).toBe(2); // Math.ceil(1.5)
  });

  it('should allow when cooldown has expired', () => {
    const cap = makeDailyCap({ cooldownUntil: NOW - 1000 });
    const result = canUserWatchAd(cap, 0);
    expect(result.canWatch).toBe(true);
  });

  it('should require captcha when totalAdsInSession is a multiple of captchaTriggerAfter', () => {
    // totalAdsInSession = 5 + 15 = 20, 20 % 20 === 0 && > 0 → true
    const cap = makeDailyCap({ adsWatched: 15 });
    const result = canUserWatchAd(cap, 5);
    expect(result.canWatch).toBe(true);
    expect(result.requiresCaptcha).toBe(true);
  });

  it('should not require captcha when totalAdsInSession is not multiple of captchaTriggerAfter', () => {
    const cap = makeDailyCap({ adsWatched: 10 });
    const result = canUserWatchAd(cap, 3);
    expect(result.canWatch).toBe(true);
    expect(result.requiresCaptcha).toBe(false);
  });

  it('should not require captcha when totalAdsInSession is 0', () => {
    const cap = makeDailyCap({ adsWatched: 0 });
    const result = canUserWatchAd(cap, 0);
    expect(result.requiresCaptcha).toBe(false);
  });

  it('should use custom config for dailyAdCap', () => {
    const cap = makeDailyCap({ adsWatched: 5 });
    const cfg = makeConfig({ dailyAdCap: 5 });
    const result = canUserWatchAd(cap, 0, cfg);
    expect(result.canWatch).toBe(false);
    expect(result.reason).toBe('Daily ad limit reached');
  });

  it('should check ad cap before coin cap', () => {
    const cap = makeDailyCap({ adsWatched: 100, coinsEarned: 1000 });
    const result = canUserWatchAd(cap, 0);
    expect(result.reason).toBe('Daily ad limit reached');
  });
});

// ---------------------------------------------------------------------------
// isIpRateLimited
// ---------------------------------------------------------------------------

describe('isIpRateLimited', () => {
  it('should return false when ads from IP is below limit', () => {
    expect(isIpRateLimited(0)).toBe(false);
    expect(isIpRateLimited(9)).toBe(false);
  });

  it('should return true when ads from IP equals limit', () => {
    expect(isIpRateLimited(10)).toBe(true);
  });

  it('should return true when ads from IP exceeds limit', () => {
    expect(isIpRateLimited(50)).toBe(true);
  });

  it('should respect custom config', () => {
    const cfg = makeConfig({ ipRateLimitPerHour: 5 });
    expect(isIpRateLimited(5, cfg)).toBe(true);
    expect(isIpRateLimited(4, cfg)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isValidWatchDuration
// ---------------------------------------------------------------------------

describe('isValidWatchDuration', () => {
  it('should return true when duration meets minimum', () => {
    expect(isValidWatchDuration(30)).toBe(true);
  });

  it('should return true when duration exceeds minimum', () => {
    expect(isValidWatchDuration(60)).toBe(true);
  });

  it('should return false when duration is below minimum', () => {
    expect(isValidWatchDuration(29)).toBe(false);
  });

  it('should return false for zero duration', () => {
    expect(isValidWatchDuration(0)).toBe(false);
  });

  it('should return false for negative duration', () => {
    expect(isValidWatchDuration(-5)).toBe(false);
  });

  it('should respect custom config minWatchDuration', () => {
    const cfg = makeConfig({ minWatchDuration: 10 });
    expect(isValidWatchDuration(10, cfg)).toBe(true);
    expect(isValidWatchDuration(9, cfg)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getDailyRemaining
// ---------------------------------------------------------------------------

describe('getDailyRemaining', () => {
  it('should return full capacity when dailyCap is undefined', () => {
    const result = getDailyRemaining(undefined);
    expect(result.adsRemaining).toBe(100);
    expect(result.coinsRemaining).toBe(1000);
  });

  it('should return remaining capacity based on usage', () => {
    const cap = makeDailyCap({ adsWatched: 30, coinsEarned: 400 });
    const result = getDailyRemaining(cap);
    expect(result.adsRemaining).toBe(70);
    expect(result.coinsRemaining).toBe(600);
  });

  it('should clamp to zero when usage exceeds cap', () => {
    const cap = makeDailyCap({ adsWatched: 150, coinsEarned: 2000 });
    const result = getDailyRemaining(cap);
    expect(result.adsRemaining).toBe(0);
    expect(result.coinsRemaining).toBe(0);
  });

  it('should return zero when usage equals cap', () => {
    const cap = makeDailyCap({ adsWatched: 100, coinsEarned: 1000 });
    const result = getDailyRemaining(cap);
    expect(result.adsRemaining).toBe(0);
    expect(result.coinsRemaining).toBe(0);
  });

  it('should respect custom config caps', () => {
    const cap = makeDailyCap({ adsWatched: 3, coinsEarned: 20 });
    const cfg = makeConfig({ dailyAdCap: 5, dailyCoinCap: 50 });
    const result = getDailyRemaining(cap, cfg);
    expect(result.adsRemaining).toBe(2);
    expect(result.coinsRemaining).toBe(30);
  });
});

// ---------------------------------------------------------------------------
// generateFingerprintHash
// ---------------------------------------------------------------------------

describe('generateFingerprintHash', () => {
  it('should return a string', () => {
    const hash = generateFingerprintHash(makeFingerprint());
    expect(typeof hash).toBe('string');
  });

  it('should return same hash for same input', () => {
    const fp = makeFingerprint();
    expect(generateFingerprintHash(fp)).toBe(generateFingerprintHash(fp));
  });

  it('should return different hash when canvas changes', () => {
    const a = generateFingerprintHash(makeFingerprint({ canvas: 'a' }));
    const b = generateFingerprintHash(makeFingerprint({ canvas: 'b' }));
    expect(a).not.toBe(b);
  });

  it('should return different hash when timezone changes', () => {
    const a = generateFingerprintHash(makeFingerprint({ timezone: 'UTC' }));
    const b = generateFingerprintHash(makeFingerprint({ timezone: 'EST' }));
    expect(a).not.toBe(b);
  });

  it('should sort fonts before hashing so order does not matter', () => {
    const a = generateFingerprintHash(makeFingerprint({ fonts: ['B', 'A'] }));
    const b = generateFingerprintHash(makeFingerprint({ fonts: ['A', 'B'] }));
    expect(a).toBe(b);
  });

  it('should produce different hash for different font sets', () => {
    const a = generateFingerprintHash(makeFingerprint({ fonts: ['Arial'] }));
    const b = generateFingerprintHash(makeFingerprint({ fonts: ['Courier'] }));
    expect(a).not.toBe(b);
  });

  it('should return base-36 encoded string', () => {
    const hash = generateFingerprintHash(makeFingerprint());
    expect(hash).toMatch(/^[0-9a-z]+$/);
  });
});

// ---------------------------------------------------------------------------
// detectFraudIndicators
// ---------------------------------------------------------------------------

describe('detectFraudIndicators', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const fp = 'fp-abc';
  const ip = '1.2.3.4';

  it('should return clean flags when no fraud signals', () => {
    const result = detectFraudIndicators(fp, ip, 30, []);
    expect(result.suspiciousTiming).toBe(false);
    expect(result.duplicateFingerprint).toBe(false);
    expect(result.multipleAccounts).toBe(false);
    expect(result.automatedBehavior).toBe(false);
    expect(result.vpnDetected).toBe(false);
    expect(result.proxyDetected).toBe(false);
    expect(result.datacenterIp).toBe(false);
    expect(result.ipRateLimited).toBe(false);
  });

  it('should flag suspiciousTiming when watch duration < minWatchDuration', () => {
    const result = detectFraudIndicators(fp, ip, 10, []);
    expect(result.suspiciousTiming).toBe(true);
  });

  it('should not flag suspiciousTiming when duration equals minWatchDuration', () => {
    const result = detectFraudIndicators(fp, ip, 30, []);
    expect(result.suspiciousTiming).toBe(false);
  });

  it('should flag duplicateFingerprint when > 10 same fingerprint txns in last hour', () => {
    const txns = Array.from({ length: 11 }, (_, i) => ({
      fingerprint: fp,
      timestamp: NOW - 1000 * (i + 1), // all within last hour
    }));
    const result = detectFraudIndicators(fp, ip, 30, txns);
    expect(result.duplicateFingerprint).toBe(true);
    expect(result.multipleAccounts).toBe(true);
  });

  it('should not flag duplicateFingerprint when exactly 10 same fingerprint txns in last hour', () => {
    const txns = Array.from({ length: 10 }, (_, i) => ({
      fingerprint: fp,
      timestamp: NOW - 1000 * (i + 1),
    }));
    const result = detectFraudIndicators(fp, ip, 30, txns);
    expect(result.duplicateFingerprint).toBe(false);
  });

  it('should not count fingerprint txns older than 1 hour for duplicateFingerprint', () => {
    const txns = Array.from({ length: 15 }, () => ({
      fingerprint: fp,
      timestamp: NOW - 3_600_001, // just over 1 hour ago
    }));
    const result = detectFraudIndicators(fp, ip, 30, txns);
    expect(result.duplicateFingerprint).toBe(false);
  });

  it('should flag automatedBehavior when > 3 same fingerprint txns in last 5 min', () => {
    const txns = Array.from({ length: 4 }, (_, i) => ({
      fingerprint: fp,
      timestamp: NOW - 1000 * (i + 1),
    }));
    const result = detectFraudIndicators(fp, ip, 30, txns);
    expect(result.automatedBehavior).toBe(true);
  });

  it('should not flag automatedBehavior when exactly 3 same fingerprint txns in last 5 min', () => {
    const txns = Array.from({ length: 3 }, (_, i) => ({
      fingerprint: fp,
      timestamp: NOW - 1000 * (i + 1),
    }));
    const result = detectFraudIndicators(fp, ip, 30, txns);
    expect(result.automatedBehavior).toBe(false);
  });

  it('should not count different fingerprint txns', () => {
    const txns = Array.from({ length: 20 }, () => ({
      fingerprint: 'other-fp',
      timestamp: NOW - 1000,
    }));
    const result = detectFraudIndicators(fp, ip, 30, txns);
    expect(result.duplicateFingerprint).toBe(false);
    expect(result.automatedBehavior).toBe(false);
  });

  it('should respect custom config for suspiciousTiming', () => {
    const cfg = makeConfig({ minWatchDuration: 5 });
    const result = detectFraudIndicators(fp, ip, 4, [], cfg);
    expect(result.suspiciousTiming).toBe(true);
    const result2 = detectFraudIndicators(fp, ip, 5, [], cfg);
    expect(result2.suspiciousTiming).toBe(false);
  });

  it('should always return ipRateLimited as false', () => {
    const result = detectFraudIndicators(fp, ip, 30, []);
    expect(result.ipRateLimited).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// determinePenaltyLevel
// ---------------------------------------------------------------------------

describe('determinePenaltyLevel', () => {
  it('should return warning for first offense', () => {
    expect(determinePenaltyLevel(1)).toBe('warning');
  });

  it('should return ban_24h for second offense', () => {
    expect(determinePenaltyLevel(2)).toBe('ban_24h');
  });

  it('should return ban_7d for third offense', () => {
    expect(determinePenaltyLevel(3)).toBe('ban_7d');
  });

  it('should return permanent_ban for fourth offense', () => {
    expect(determinePenaltyLevel(4)).toBe('permanent_ban');
  });

  it('should return permanent_ban for any offense > 3', () => {
    expect(determinePenaltyLevel(10)).toBe('permanent_ban');
    expect(determinePenaltyLevel(100)).toBe('permanent_ban');
  });

  it('should return permanent_ban for zero offenses (default case)', () => {
    expect(determinePenaltyLevel(0)).toBe('permanent_ban');
  });
});

// ---------------------------------------------------------------------------
// calculatePenaltyExpiration
// ---------------------------------------------------------------------------

describe('calculatePenaltyExpiration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return undefined for warning', () => {
    expect(calculatePenaltyExpiration('warning')).toBeUndefined();
  });

  it('should return now + 24 hours for ban_24h', () => {
    expect(calculatePenaltyExpiration('ban_24h')).toBe(NOW + 24 * 60 * 60 * 1000);
  });

  it('should return now + 7 days for ban_7d', () => {
    expect(calculatePenaltyExpiration('ban_7d')).toBe(NOW + 7 * 24 * 60 * 60 * 1000);
  });

  it('should return undefined for permanent_ban', () => {
    expect(calculatePenaltyExpiration('permanent_ban')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// isPenaltyActive
// ---------------------------------------------------------------------------

describe('isPenaltyActive', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return true for permanent_ban regardless of expiresAt', () => {
    expect(isPenaltyActive('permanent_ban', undefined)).toBe(true);
    expect(isPenaltyActive('permanent_ban', NOW - 999999)).toBe(true);
  });

  it('should return false for warning regardless of expiresAt', () => {
    expect(isPenaltyActive('warning', undefined)).toBe(false);
    expect(isPenaltyActive('warning', NOW + 999999)).toBe(false);
  });

  it('should return false for ban_24h with no expiresAt', () => {
    expect(isPenaltyActive('ban_24h', undefined)).toBe(false);
  });

  it('should return true for ban_24h with future expiresAt', () => {
    expect(isPenaltyActive('ban_24h', NOW + 60_000)).toBe(true);
  });

  it('should return false for ban_24h with past expiresAt', () => {
    expect(isPenaltyActive('ban_24h', NOW - 1)).toBe(false);
  });

  it('should return false for ban_7d with expiresAt equal to now', () => {
    // Date.now() < expiresAt is false when equal
    expect(isPenaltyActive('ban_7d', NOW)).toBe(false);
  });

  it('should return true for ban_7d with future expiresAt', () => {
    expect(isPenaltyActive('ban_7d', NOW + 1)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// calculateCooldownEnd
// ---------------------------------------------------------------------------

describe('calculateCooldownEnd', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return now + cooldownBetweenAds * 1000 with default config', () => {
    // default cooldownBetweenAds = 120 seconds
    expect(calculateCooldownEnd()).toBe(NOW + 120_000);
  });

  it('should respect custom cooldownBetweenAds', () => {
    const cfg = makeConfig({ cooldownBetweenAds: 60 });
    expect(calculateCooldownEnd(cfg)).toBe(NOW + 60_000);
  });

  it('should return now when cooldownBetweenAds is 0', () => {
    const cfg = makeConfig({ cooldownBetweenAds: 0 });
    expect(calculateCooldownEnd(cfg)).toBe(NOW);
  });
});

// ---------------------------------------------------------------------------
// calculateTransactionExpiration
// ---------------------------------------------------------------------------

describe('calculateTransactionExpiration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return now + verificationTimeout with default config', () => {
    // default verificationTimeout = 300000 ms (5 min)
    expect(calculateTransactionExpiration()).toBe(NOW + 300_000);
  });

  it('should respect custom verificationTimeout', () => {
    const cfg = makeConfig({ verificationTimeout: 60_000 });
    expect(calculateTransactionExpiration(cfg)).toBe(NOW + 60_000);
  });

  it('should return now when verificationTimeout is 0', () => {
    const cfg = makeConfig({ verificationTimeout: 0 });
    expect(calculateTransactionExpiration(cfg)).toBe(NOW);
  });
});
