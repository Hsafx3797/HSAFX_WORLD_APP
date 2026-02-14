import { db, coinTransactions, userCoinWallets, eq, sql } from '@hsafx/db';

const ONBOARDING_BONUS = 25;

/**
 * Award 25 bonus coins for completing onboarding wizard.
 * Idempotent — checks if already awarded via transaction reason.
 */
export async function claimOnboardingBonus(userId: string) {
  // Check if already awarded
  const [existing] = await db
    .select({ id: coinTransactions.id })
    .from(coinTransactions)
    .where(
      sql`${coinTransactions.userId} = ${userId} AND ${coinTransactions.reason} = 'Onboarding wizard completion bonus'`,
    )
    .limit(1);

  if (existing) return { alreadyClaimed: true };

  await db.transaction(async (tx) => {
    const [wallet] = await tx
      .select()
      .from(userCoinWallets)
      .where(eq(userCoinWallets.userId, userId))
      .for('update')
      .limit(1);

    const currentBalance = wallet?.balance ?? 0;
    const newBalance = currentBalance + ONBOARDING_BONUS;

    await tx.insert(coinTransactions).values({
      userId,
      amount: ONBOARDING_BONUS,
      type: 'reward',
      reason: 'Onboarding wizard completion bonus',
      resourceType: 'onboarding_bonus',
      balanceAfter: newBalance,
      metadata: {},
    });

    if (wallet) {
      await tx
        .update(userCoinWallets)
        .set({
          balance: newBalance,
          lifetimeEarned: sql`${userCoinWallets.lifetimeEarned} + ${ONBOARDING_BONUS}`,
          updatedAt: new Date(),
        })
        .where(eq(userCoinWallets.userId, userId));
    } else {
      await tx.insert(userCoinWallets).values({
        userId,
        balance: newBalance,
        lifetimeEarned: ONBOARDING_BONUS,
      });
    }
  });

  return { alreadyClaimed: false, coinsAwarded: ONBOARDING_BONUS };
}
