/**
 * Login Reward Service
 * Reference: 20_BILLING_SYSTEM.md §8 (replaced ad rewards with login rewards)
 *
 * Handles:
 * - Daily login reward: 10 coins, once per day
 * - Hourly login reward: 10 coins, once per hour (while logged in)
 * - Daily cap enforcement: 50 coins per day
 */

import {
  db,
  loginRewardClaims,
  userDailyRewardCaps,
  coinTransactions,
  userCoinWallets,
  userStreaks,
  eq,
  and,
  sql,
  gte,
} from '@hsafx/db';
import { LoginRewardError } from './types';
import type { ClaimRewardResult, RewardStats, StreakInfo, RewardType } from './types';

// ─── Constants ────────────────────────────────────────────────

const BASE_COINS_PER_REWARD = 10;
const DAILY_COIN_CAP = 50;
const HOURLY_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

/** Streak multiplier tiers per roadmap T2.2 */
const STREAK_TIERS = [
  { days: 30, multiplier: 5 },
  { days: 14, multiplier: 3 },
  { days: 7, multiplier: 2 },
  { days: 3, multiplier: 1.5 },
] as const;

function getStreakMultiplier(streak: number): number {
  for (const tier of STREAK_TIERS) {
    if (streak >= tier.days) return tier.multiplier;
  }
  return 1;
}

// ─── Helpers ──────────────────────────────────────────────────

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
    .from(userDailyRewardCaps)
    .where(
      and(
        eq(userDailyRewardCaps.userId, userId),
        eq(userDailyRewardCaps.date, today),
      ),
    )
    .limit(1);

  return cap;
}

async function getLastClaim(userId: string, rewardType: RewardType) {
  const today = getTodayMidnightUTC();

  const [claim] = await db
    .select()
    .from(loginRewardClaims)
    .where(
      and(
        eq(loginRewardClaims.userId, userId),
        eq(loginRewardClaims.rewardType, rewardType),
        gte(loginRewardClaims.claimedAt, today),
      ),
    )
    .orderBy(sql`${loginRewardClaims.claimedAt} DESC`)
    .limit(1);

  return claim;
}

async function getUserStreakInternal(userId: string) {
  const [streak] = await db
    .select()
    .from(userStreaks)
    .where(eq(userStreaks.userId, userId))
    .limit(1);
  return streak;
}

// ─── Public API ───────────────────────────────────────────────

/**
 * Claim a login reward (daily or hourly).
 * Daily rewards apply a streak multiplier (T2.2).
 */
export async function claimLoginReward(
  userId: string,
  rewardType: RewardType,
): Promise<ClaimRewardResult> {
  // 1. Check daily cap
  const dailyCap = await getDailyCap(userId);
  if (dailyCap && dailyCap.totalCoinsEarned >= DAILY_COIN_CAP) {
    throw new LoginRewardError(
      'Daily coin limit reached. Come back tomorrow!',
      'DAILY_CAP_REACHED',
    );
  }

  // 2. Check type-specific constraints
  if (rewardType === 'daily') {
    const lastDaily = await getLastClaim(userId, 'daily');
    if (lastDaily) {
      throw new LoginRewardError(
        'Daily reward already claimed today.',
        'ALREADY_CLAIMED',
      );
    }
  } else {
    // hourly
    const lastHourly = await getLastClaim(userId, 'hourly');
    if (lastHourly) {
      const elapsed = Date.now() - lastHourly.claimedAt.getTime();
      if (elapsed < HOURLY_COOLDOWN_MS) {
        throw new LoginRewardError(
          'Hourly reward on cooldown. Please wait.',
          'COOLDOWN_ACTIVE',
        );
      }
    }
  }

  // 3. Compute reward amount (streak multiplier for daily only)
  let streakMultiplier = 1;
  if (rewardType === 'daily') {
    const streak = await getUserStreakInternal(userId);
    const today = getTodayMidnightUTC();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const isConsecutive = streak?.lastActiveDate?.getTime() === yesterday.getTime();
    const newStreak = isConsecutive ? (streak?.currentStreak ?? 0) + 1 : 1;
    streakMultiplier = getStreakMultiplier(newStreak);
  }

  const coinsToAward = Math.min(
    Math.floor(BASE_COINS_PER_REWARD * streakMultiplier),
    DAILY_COIN_CAP - (dailyCap?.totalCoinsEarned ?? 0),
  );

  if (coinsToAward <= 0) {
    throw new LoginRewardError(
      'Daily coin limit reached.',
      'DAILY_CAP_REACHED',
    );
  }

  // 4. Credit coins atomically
  const result = await db.transaction(async (tx) => {
    // Lock wallet
    const [wallet] = await tx
      .select()
      .from(userCoinWallets)
      .where(eq(userCoinWallets.userId, userId))
      .for('update')
      .limit(1);

    // Re-check daily cap inside transaction
    const today = getTodayMidnightUTC();
    const [capInTx] = await tx
      .select()
      .from(userDailyRewardCaps)
      .where(
        and(
          eq(userDailyRewardCaps.userId, userId),
          eq(userDailyRewardCaps.date, today),
        ),
      )
      .limit(1);

    if (capInTx && capInTx.totalCoinsEarned >= DAILY_COIN_CAP) {
      throw new LoginRewardError(
        'Daily coin limit reached.',
        'DAILY_CAP_REACHED',
      );
    }

    const currentBalance = wallet?.balance ?? 0;
    const newBalance = currentBalance + coinsToAward;

    // Create coin transaction
    const [coinTx] = await tx
      .insert(coinTransactions)
      .values({
        userId,
        amount: coinsToAward,
        type: 'reward',
        reason: `${rewardType === 'daily' ? 'Daily' : 'Hourly'} login reward${streakMultiplier > 1 ? ` (${streakMultiplier}× streak)` : ''}`,
        resourceType: 'login_reward',
        balanceAfter: newBalance,
        metadata: { rewardType, streakMultiplier },
      })
      .returning({ id: coinTransactions.id });

    // Create reward claim record
    await tx.insert(loginRewardClaims).values({
      userId,
      rewardType,
      coinsAwarded: coinsToAward,
      coinTransactionId: coinTx?.id,
    });

    // Update wallet
    if (wallet) {
      await tx
        .update(userCoinWallets)
        .set({
          balance: newBalance,
          lifetimeEarned: sql`${userCoinWallets.lifetimeEarned} + ${coinsToAward}`,
          updatedAt: new Date(),
        })
        .where(eq(userCoinWallets.userId, userId));
    } else {
      await tx.insert(userCoinWallets).values({
        userId,
        balance: newBalance,
        lifetimeEarned: coinsToAward,
      });
    }

    // Upsert daily cap
    await tx
      .insert(userDailyRewardCaps)
      .values({
        userId,
        date: today,
        totalCoinsEarned: coinsToAward,
        claimsCount: 1,
      })
      .onConflictDoUpdate({
        target: [userDailyRewardCaps.userId, userDailyRewardCaps.date],
        set: {
          totalCoinsEarned: sql`${userDailyRewardCaps.totalCoinsEarned} + ${coinsToAward}`,
          claimsCount: sql`${userDailyRewardCaps.claimsCount} + 1`,
          updatedAt: new Date(),
        },
      });

    // Update streak (daily claims only)
    let streakInfo = { currentStreak: 0, longestStreak: 0 };
    if (rewardType === 'daily') {
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const [existing] = await tx
        .select()
        .from(userStreaks)
        .where(eq(userStreaks.userId, userId))
        .limit(1);

      const isConsecutive = existing?.lastActiveDate?.getTime() === yesterday.getTime();
      const newStreak = isConsecutive ? (existing?.currentStreak ?? 0) + 1 : 1;
      const newLongest = Math.max(newStreak, existing?.longestStreak ?? 0);

      await tx
        .insert(userStreaks)
        .values({
          userId,
          currentStreak: newStreak,
          longestStreak: newLongest,
          lastActiveDate: today,
        })
        .onConflictDoUpdate({
          target: [userStreaks.userId],
          set: {
            currentStreak: newStreak,
            longestStreak: newLongest,
            lastActiveDate: today,
            updatedAt: new Date(),
          },
        });

      streakInfo = { currentStreak: newStreak, longestStreak: newLongest };
    }

    // Get updated cap
    const [updatedCap] = await tx
      .select()
      .from(userDailyRewardCaps)
      .where(
        and(
          eq(userDailyRewardCaps.userId, userId),
          eq(userDailyRewardCaps.date, today),
        ),
      )
      .limit(1);

    return {
      newBalance,
      dailyCoinsEarned: updatedCap?.totalCoinsEarned ?? coinsToAward,
      dailyClaimsCount: updatedCap?.claimsCount ?? 1,
      streakInfo,
    };
  });

  return {
    success: true,
    rewardType,
    coinsAwarded: coinsToAward,
    newBalance: result.newBalance,
    dailyCoinsEarned: result.dailyCoinsEarned,
    dailyClaimsCount: result.dailyClaimsCount,
    dailyCoinCap: DAILY_COIN_CAP,
    streakMultiplier,
    streak: result.streakInfo,
  };
}

/**
 * Get login reward stats for current user.
 */
export async function getLoginRewardStats(
  userId: string,
): Promise<RewardStats> {
  const dailyCap = await getDailyCap(userId);
  const lastDaily = await getLastClaim(userId, 'daily');
  const lastHourly = await getLastClaim(userId, 'hourly');
  const streakRow = await getUserStreakInternal(userId);

  const canClaimDaily = !lastDaily;
  let canClaimHourly = true;
  let nextHourlyClaimAt: Date | null = null;

  if (lastHourly) {
    const elapsed = Date.now() - lastHourly.claimedAt.getTime();
    if (elapsed < HOURLY_COOLDOWN_MS) {
      canClaimHourly = false;
      nextHourlyClaimAt = new Date(
        lastHourly.claimedAt.getTime() + HOURLY_COOLDOWN_MS,
      );
    }
  }

  // Build streak info
  const currentStreak = streakRow?.currentStreak ?? 0;
  const multiplier = getStreakMultiplier(currentStreak);
  const nextTier = STREAK_TIERS.slice()
    .reverse()
    .find((t) => currentStreak < t.days);
  const streak: StreakInfo = {
    currentStreak,
    longestStreak: streakRow?.longestStreak ?? 0,
    multiplier,
    nextTier: nextTier ? { days: nextTier.days, multiplier: nextTier.multiplier } : null,
  };

  // If daily cap is reached, neither can be claimed
  if (dailyCap && dailyCap.totalCoinsEarned >= DAILY_COIN_CAP) {
    return {
      dailyCoinsEarned: dailyCap.totalCoinsEarned,
      dailyClaimsCount: dailyCap.claimsCount,
      dailyCoinCap: DAILY_COIN_CAP,
      coinsPerReward: BASE_COINS_PER_REWARD,
      canClaimDaily: false,
      canClaimHourly: false,
      nextHourlyClaimAt,
      streak,
    };
  }

  return {
    dailyCoinsEarned: dailyCap?.totalCoinsEarned ?? 0,
    dailyClaimsCount: dailyCap?.claimsCount ?? 0,
    dailyCoinCap: DAILY_COIN_CAP,
    coinsPerReward: BASE_COINS_PER_REWARD,
    canClaimDaily,
    canClaimHourly,
    nextHourlyClaimAt,
    streak,
  };
}

/**
 * Get streak info for a user (public API for tRPC).
 */
export async function getUserStreak(userId: string): Promise<StreakInfo> {
  const streakRow = await getUserStreakInternal(userId);
  const currentStreak = streakRow?.currentStreak ?? 0;
  const multiplier = getStreakMultiplier(currentStreak);
  const nextTier = STREAK_TIERS.slice()
    .reverse()
    .find((t) => currentStreak < t.days);

  return {
    currentStreak,
    longestStreak: streakRow?.longestStreak ?? 0,
    multiplier,
    nextTier: nextTier ? { days: nextTier.days, multiplier: nextTier.multiplier } : null,
  };
}
