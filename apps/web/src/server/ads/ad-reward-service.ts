/**
 * Ad Reward Service
 * Reference: SOLUTION_ROADMAP Task 4.9, 20_BILLING_SYSTEM.md §8
 *
 * Handles:
 * - Ad watch initiation (create pending reward)
 * - Ad completion validation (30s minimum, fraud checks)
 * - Coin crediting (atomic wallet update)
 * - Daily cap enforcement (100 ads / 1000 coins per day)
 * - IP rate limiting (10 ads/hr via Redis)
 * - CAPTCHA requirement tracking (after 20 consecutive)
 */

'use server';

import {
  db,
  adRewardTransactions,
  userAdDailyCaps,
  coinTransactions,
  userCoinWallets,
  eq,
  and,
  sql,
} from '@hsafx/db';
import { getRedis, keys, TTL } from '@/lib/redis';
import { AdRewardError } from './types';
import type { AdWatchInitResult, AdWatchCompleteResult } from './types';

// ─── Constants ────────────────────────────────────────────────

const COINS_PER_AD = 10;
const DAILY_AD_CAP = 100;
const DAILY_COIN_CAP = 1000;
const MIN_WATCH_DURATION_MS = 30_000; // 30 seconds
const VERIFICATION_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const IP_HOURLY_LIMIT = 10;
const CAPTCHA_TRIGGER_COUNT = 20;

// ─── Daily cap helpers ────────────────────────────────────────

function getTodayMidnightUTC(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

async function getDailyCap(userId: string) {
  const today = getTodayMidnightUTC();

  const [cap] = await db
    .select()
    .from(userAdDailyCaps)
    .where(
      and(
        eq(userAdDailyCaps.userId, userId),
        eq(userAdDailyCaps.date, today),
      ),
    )
    .limit(1);

  return cap;
}

// ─── IP rate limit (Redis) ────────────────────────────────────

async function checkIpAdRateLimit(ipAddress: string): Promise<boolean> {
  const redis = getRedis();
  const redisKey = keys.rateLimit.ip(`ad:${ipAddress}`);
  const count = await redis.incr(redisKey);

  if (count === 1) {
    await redis.expire(redisKey, TTL.RATE_LIMIT_HOURLY);
  }

  return count <= IP_HOURLY_LIMIT;
}

// ─── Session CAPTCHA tracking (Redis) ─────────────────────────

async function getSessionAdCount(userId: string): Promise<number> {
  const redis = getRedis();
  const redisKey = keys.anon.baCount(`ad_session:${userId}`);
  const count = await redis.get<number>(redisKey);
  return count ?? 0;
}

async function incrementSessionAdCount(userId: string): Promise<number> {
  const redis = getRedis();
  const redisKey = keys.anon.baCount(`ad_session:${userId}`);
  const count = await redis.incr(redisKey);

  if (count === 1) {
    // Expire session counter after 2 hours
    await redis.expire(redisKey, 2 * 60 * 60);
  }

  return count;
}

// ─── Public API ───────────────────────────────────────────────

/**
 * Initiate an ad watch session.
 * Creates a pending reward record and checks eligibility.
 *
 * @param userId - Authenticated user ID
 * @param ipAddress - Client IP address
 * @param fingerprint - Optional browser fingerprint hash
 */
export async function initiateAdWatch(
  userId: string,
  ipAddress: string,
  fingerprint?: string,
): Promise<AdWatchInitResult> {
  // 1. Check daily cap
  const dailyCap = await getDailyCap(userId);
  if (dailyCap && dailyCap.adsWatched >= DAILY_AD_CAP) {
    throw new AdRewardError(
      'Daily ad limit reached. Come back tomorrow!',
      'DAILY_CAP_REACHED',
    );
  }
  if (dailyCap && dailyCap.coinsEarned >= DAILY_COIN_CAP) {
    throw new AdRewardError(
      'Daily coin limit from ads reached.',
      'DAILY_CAP_REACHED',
    );
  }

  // 2. Check IP rate limit
  const ipAllowed = await checkIpAdRateLimit(ipAddress);
  if (!ipAllowed) {
    throw new AdRewardError(
      'Too many ad watches from this IP. Please wait.',
      'IP_RATE_LIMITED',
    );
  }

  // 3. Check if CAPTCHA needed
  const sessionCount = await getSessionAdCount(userId);
  const requiresCaptcha =
    sessionCount > 0 && sessionCount % CAPTCHA_TRIGGER_COUNT === 0;

  // 4. Create pending reward
  const expiresAt = new Date(Date.now() + VERIFICATION_WINDOW_MS);

  const [reward] = await db
    .insert(adRewardTransactions)
    .values({
      userId,
      adProvider: 'google_adsense',
      coinsAwarded: 0, // Will be set on verification
      validationStatus: 'pending',
      ipAddress,
      fingerprint: fingerprint ?? null,
      expiresAt,
    })
    .returning({ id: adRewardTransactions.id });

  if (!reward) {
    throw new Error('Failed to create ad reward transaction');
  }

  return {
    rewardId: reward.id,
    expiresAt,
    requiresCaptcha,
  };
}

/**
 * Complete/verify an ad watch and credit coins.
 *
 * @param rewardId - The pending reward ID from initiateAdWatch
 * @param userId - Authenticated user ID (must match reward owner)
 * @param watchDurationMs - Actual watch duration reported by client
 * @param captchaToken - Optional CAPTCHA verification token
 */
export async function completeAdWatch(
  rewardId: string,
  userId: string,
  watchDurationMs: number,
  captchaToken?: string,
): Promise<AdWatchCompleteResult> {
  // 1. Load reward record
  const [reward] = await db
    .select()
    .from(adRewardTransactions)
    .where(
      and(
        eq(adRewardTransactions.id, rewardId),
        eq(adRewardTransactions.userId, userId),
      ),
    )
    .limit(1);

  if (!reward) {
    throw new AdRewardError('Invalid reward ID', 'INVALID_REWARD');
  }

  if (reward.validationStatus !== 'pending') {
    throw new AdRewardError(
      'Reward already processed',
      'ALREADY_VERIFIED',
    );
  }

  // 2. Check expiration
  if (new Date() > reward.expiresAt) {
    await db
      .update(adRewardTransactions)
      .set({ validationStatus: 'expired' })
      .where(eq(adRewardTransactions.id, rewardId));

    throw new AdRewardError(
      'Verification window expired. Please try again.',
      'EXPIRED',
    );
  }

  // 3. Validate watch duration
  if (watchDurationMs < MIN_WATCH_DURATION_MS) {
    // Mark as fraud if way too short
    if (watchDurationMs < 5000) {
      await db
        .update(adRewardTransactions)
        .set({
          validationStatus: 'fraud',
          watchDurationMs,
          metadata: { reason: 'watch_too_short', reportedMs: watchDurationMs },
        })
        .where(eq(adRewardTransactions.id, rewardId));

      // Increment fraud counter
      const today = getTodayMidnightUTC();
      await db
        .insert(userAdDailyCaps)
        .values({
          userId,
          date: today,
          adsWatched: 0,
          coinsEarned: 0,
          fraudAttempts: 1,
        })
        .onConflictDoUpdate({
          target: [userAdDailyCaps.userId, userAdDailyCaps.date],
          set: {
            fraudAttempts: sql`${userAdDailyCaps.fraudAttempts} + 1`,
            updatedAt: new Date(),
          },
        });

      throw new AdRewardError('Suspicious activity detected', 'FRAUD_DETECTED');
    }

    throw new AdRewardError(
      'Ad must be watched for at least 30 seconds',
      'WATCH_TOO_SHORT',
    );
  }

  // 4. Credit coins atomically
  const result = await db.transaction(async (tx) => {
    // Mark reward as verified
    await tx
      .update(adRewardTransactions)
      .set({
        validationStatus: 'verified',
        coinsAwarded: COINS_PER_AD,
        watchDurationMs,
        verifiedAt: new Date(),
      })
      .where(eq(adRewardTransactions.id, rewardId));

    // Lock wallet
    const [wallet] = await tx
      .select()
      .from(userCoinWallets)
      .where(eq(userCoinWallets.userId, userId))
      .for('update')
      .limit(1);

    const currentBalance = wallet?.balance ?? 0;
    const newBalance = currentBalance + COINS_PER_AD;

    // Create coin transaction
    await tx.insert(coinTransactions).values({
      userId,
      amount: COINS_PER_AD,
      type: 'grant',
      reason: 'Ad watch reward',
      resourceType: 'ad_reward',
      resourceId: rewardId,
      balanceAfter: newBalance,
      metadata: { adProvider: reward.adProvider, watchDurationMs },
    });

    // Update wallet
    if (wallet) {
      await tx
        .update(userCoinWallets)
        .set({
          balance: newBalance,
          lifetimeEarned: sql`${userCoinWallets.lifetimeEarned} + ${COINS_PER_AD}`,
          updatedAt: new Date(),
        })
        .where(eq(userCoinWallets.userId, userId));
    } else {
      await tx.insert(userCoinWallets).values({
        userId,
        balance: newBalance,
        lifetimeEarned: COINS_PER_AD,
      });
    }

    // Update daily cap
    const today = getTodayMidnightUTC();
    await tx
      .insert(userAdDailyCaps)
      .values({
        userId,
        date: today,
        adsWatched: 1,
        coinsEarned: COINS_PER_AD,
      })
      .onConflictDoUpdate({
        target: [userAdDailyCaps.userId, userAdDailyCaps.date],
        set: {
          adsWatched: sql`${userAdDailyCaps.adsWatched} + 1`,
          coinsEarned: sql`${userAdDailyCaps.coinsEarned} + ${COINS_PER_AD}`,
          updatedAt: new Date(),
        },
      });

    // Get updated daily cap
    const [updatedCap] = await tx
      .select()
      .from(userAdDailyCaps)
      .where(
        and(
          eq(userAdDailyCaps.userId, userId),
          eq(userAdDailyCaps.date, today),
        ),
      )
      .limit(1);

    return {
      newBalance,
      dailyAdsRemaining: DAILY_AD_CAP - (updatedCap?.adsWatched ?? 1),
    };
  });

  // Increment session counter for CAPTCHA tracking
  await incrementSessionAdCount(userId);

  return {
    success: true,
    coinsAwarded: COINS_PER_AD,
    newBalance: result.newBalance,
    dailyAdsRemaining: result.dailyAdsRemaining,
  };
}

/**
 * Get ad watch stats for current user.
 */
export async function getAdWatchStats(userId: string) {
  const dailyCap = await getDailyCap(userId);

  return {
    adsWatchedToday: dailyCap?.adsWatched ?? 0,
    coinsEarnedToday: dailyCap?.coinsEarned ?? 0,
    dailyAdCap: DAILY_AD_CAP,
    dailyCoinCap: DAILY_COIN_CAP,
    adsRemainingToday: DAILY_AD_CAP - (dailyCap?.adsWatched ?? 0),
    coinsPerAd: COINS_PER_AD,
  };
}
