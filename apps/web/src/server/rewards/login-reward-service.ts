/**
 * Login Reward Service
 * Reference: 20_BILLING_SYSTEM.md §8 (replaced ad rewards with login rewards)
 *
 * Handles:
 * - Daily login reward: 10 coins, once per day
 * - Hourly login reward: 10 coins, once per hour (while logged in)
 * - Daily cap enforcement: 50 coins per day
 */

'use server';

import {
  db,
  loginRewardClaims,
  userDailyRewardCaps,
  coinTransactions,
  userCoinWallets,
  eq,
  and,
  sql,
  gte,
} from '@hsafx/db';
import { LoginRewardError } from './types';
import type { ClaimRewardResult, RewardStats, RewardType } from './types';

// ─── Constants ────────────────────────────────────────────────

const COINS_PER_REWARD = 10;
const DAILY_COIN_CAP = 50;
const HOURLY_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

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

// ─── Public API ───────────────────────────────────────────────

/**
 * Claim a login reward (daily or hourly).
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

  // 3. Credit coins atomically
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
    const newBalance = currentBalance + COINS_PER_REWARD;

    // Create coin transaction
    const [coinTx] = await tx
      .insert(coinTransactions)
      .values({
        userId,
        amount: COINS_PER_REWARD,
        type: 'reward',
        reason: `${rewardType === 'daily' ? 'Daily' : 'Hourly'} login reward`,
        resourceType: 'login_reward',
        balanceAfter: newBalance,
        metadata: { rewardType },
      })
      .returning({ id: coinTransactions.id });

    // Create reward claim record
    await tx.insert(loginRewardClaims).values({
      userId,
      rewardType,
      coinsAwarded: COINS_PER_REWARD,
      coinTransactionId: coinTx?.id,
    });

    // Update wallet
    if (wallet) {
      await tx
        .update(userCoinWallets)
        .set({
          balance: newBalance,
          lifetimeEarned: sql`${userCoinWallets.lifetimeEarned} + ${COINS_PER_REWARD}`,
          updatedAt: new Date(),
        })
        .where(eq(userCoinWallets.userId, userId));
    } else {
      await tx.insert(userCoinWallets).values({
        userId,
        balance: newBalance,
        lifetimeEarned: COINS_PER_REWARD,
      });
    }

    // Upsert daily cap
    await tx
      .insert(userDailyRewardCaps)
      .values({
        userId,
        date: today,
        totalCoinsEarned: COINS_PER_REWARD,
        claimsCount: 1,
      })
      .onConflictDoUpdate({
        target: [userDailyRewardCaps.userId, userDailyRewardCaps.date],
        set: {
          totalCoinsEarned: sql`${userDailyRewardCaps.totalCoinsEarned} + ${COINS_PER_REWARD}`,
          claimsCount: sql`${userDailyRewardCaps.claimsCount} + 1`,
          updatedAt: new Date(),
        },
      });

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
      dailyCoinsEarned: updatedCap?.totalCoinsEarned ?? COINS_PER_REWARD,
      dailyClaimsCount: updatedCap?.claimsCount ?? 1,
    };
  });

  return {
    success: true,
    rewardType,
    coinsAwarded: COINS_PER_REWARD,
    newBalance: result.newBalance,
    dailyCoinsEarned: result.dailyCoinsEarned,
    dailyClaimsCount: result.dailyClaimsCount,
    dailyCoinCap: DAILY_COIN_CAP,
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

  // If daily cap is reached, neither can be claimed
  if (dailyCap && dailyCap.totalCoinsEarned >= DAILY_COIN_CAP) {
    return {
      dailyCoinsEarned: dailyCap.totalCoinsEarned,
      dailyClaimsCount: dailyCap.claimsCount,
      dailyCoinCap: DAILY_COIN_CAP,
      coinsPerReward: COINS_PER_REWARD,
      canClaimDaily: false,
      canClaimHourly: false,
      nextHourlyClaimAt,
    };
  }

  return {
    dailyCoinsEarned: dailyCap?.totalCoinsEarned ?? 0,
    dailyClaimsCount: dailyCap?.claimsCount ?? 0,
    dailyCoinCap: DAILY_COIN_CAP,
    coinsPerReward: COINS_PER_REWARD,
    canClaimDaily,
    canClaimHourly,
    nextHourlyClaimAt,
  };
}
