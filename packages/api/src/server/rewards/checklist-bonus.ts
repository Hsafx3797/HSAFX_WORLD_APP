import { db, coinTransactions, userCoinWallets, eq, sql } from '@hsafx/db';

const CHECKLIST_COINS = 5;

/**
 * Award 5 bonus coins for completing an onboarding checklist step.
 * Idempotent — checks if already awarded via transaction reason.
 */
export async function claimChecklistBonus(userId: string, step: string) {
  const reason = `Checklist step: ${step}`;

  // Check if already awarded
  const [existing] = await db
    .select({ id: coinTransactions.id })
    .from(coinTransactions)
    .where(
      sql`${coinTransactions.userId} = ${userId} AND ${coinTransactions.reason} = ${reason}`,
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
    const newBalance = currentBalance + CHECKLIST_COINS;

    await tx.insert(coinTransactions).values({
      userId,
      amount: CHECKLIST_COINS,
      type: 'reward',
      reason,
      resourceType: 'checklist_bonus',
      balanceAfter: newBalance,
      metadata: { step },
    });

    if (wallet) {
      await tx
        .update(userCoinWallets)
        .set({
          balance: newBalance,
          lifetimeEarned: sql`${userCoinWallets.lifetimeEarned} + ${CHECKLIST_COINS}`,
          updatedAt: new Date(),
        })
        .where(eq(userCoinWallets.userId, userId));
    } else {
      await tx.insert(userCoinWallets).values({
        userId,
        balance: newBalance,
        lifetimeEarned: CHECKLIST_COINS,
      });
    }
  });

  return { alreadyClaimed: false, coinsAwarded: CHECKLIST_COINS };
}
