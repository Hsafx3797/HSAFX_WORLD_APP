'use server';

import { db } from '@hsafx/db';
import {
  users,
  referrals,
  coinTransactions,
  userCoinWallets,
  eq,
  and,
  sql,
} from '@hsafx/db/schema';
import { randomBytes } from 'node:crypto';

const REFERRAL_REWARD_COINS = 50;

/** Generate a unique 8-char alphanumeric referral code */
function generateCode(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

/** Get or create a referral code for a user */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const [user] = await db
    .select({ referralCode: users.referralCode })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user?.referralCode) return user.referralCode;

  // Generate unique code
  let code = generateCode();
  let attempts = 0;
  while (attempts < 5) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.referralCode, code))
      .limit(1);

    if (!existing) break;
    code = generateCode();
    attempts++;
  }

  await db
    .update(users)
    .set({ referralCode: code, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return code;
}

/** Track a referral when a new user signs up with ?ref=CODE */
export async function trackReferralSignup(
  referralCode: string,
  newUserId: string,
): Promise<{ success: boolean; referrerId?: string }> {
  // Find the referrer
  const [referrer] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.referralCode, referralCode))
    .limit(1);

  if (!referrer) return { success: false };

  // Don't allow self-referral
  if (referrer.id === newUserId) return { success: false };

  // Check if this user was already referred
  const [existing] = await db
    .select({ id: referrals.id })
    .from(referrals)
    .where(eq(referrals.referredUserId, newUserId))
    .limit(1);

  if (existing) return { success: false };

  // Create referral record as activated
  await db.insert(referrals).values({
    referrerId: referrer.id,
    referredUserId: newUserId,
    referralCode,
    status: 'activated',
    activatedAt: new Date(),
  });

  // Grant coins to referrer
  await grantReferralReward(referrer.id, newUserId);

  return { success: true, referrerId: referrer.id };
}

async function grantReferralReward(referrerId: string, referredUserId: string) {
  await db.transaction(async (tx) => {
    let [wallet] = await tx
      .select()
      .from(userCoinWallets)
      .where(eq(userCoinWallets.userId, referrerId))
      .limit(1);

    if (!wallet) {
      [wallet] = await tx
        .insert(userCoinWallets)
        .values({ userId: referrerId, balance: 0, lifetimeEarned: 0, lifetimeSpent: 0 })
        .returning();
    }

    const newBalance = wallet!.balance + REFERRAL_REWARD_COINS;

    await tx.insert(coinTransactions).values({
      userId: referrerId,
      amount: REFERRAL_REWARD_COINS,
      type: 'reward',
      reason: 'referral_reward',
      balanceAfter: newBalance,
      metadata: { referredUserId },
    });

    await tx
      .update(userCoinWallets)
      .set({
        balance: newBalance,
        lifetimeEarned: sql`${userCoinWallets.lifetimeEarned} + ${REFERRAL_REWARD_COINS}`,
        updatedAt: new Date(),
      })
      .where(eq(userCoinWallets.userId, referrerId));

    // Update referral status to rewarded
    await tx
      .update(referrals)
      .set({
        status: 'rewarded',
        coinsEarned: REFERRAL_REWARD_COINS,
        rewardedAt: new Date(),
      })
      .where(
        and(
          eq(referrals.referrerId, referrerId),
          eq(referrals.referredUserId, referredUserId),
        ),
      );
  });
}

/** Get referral stats for a user */
export async function getReferralStats(userId: string) {
  const code = await getOrCreateReferralCode(userId);

  const allReferrals = await db
    .select({
      id: referrals.id,
      status: referrals.status,
      coinsEarned: referrals.coinsEarned,
      createdAt: referrals.createdAt,
      activatedAt: referrals.activatedAt,
    })
    .from(referrals)
    .where(eq(referrals.referrerId, userId));

  const totalReferred = allReferrals.length;
  const totalActivated = allReferrals.filter((r) => r.status !== 'pending').length;
  const totalCoinsEarned = allReferrals.reduce((sum, r) => sum + (r.coinsEarned ?? 0), 0);

  return {
    referralCode: code,
    totalReferred,
    totalActivated,
    totalCoinsEarned,
    referrals: allReferrals,
  };
}
