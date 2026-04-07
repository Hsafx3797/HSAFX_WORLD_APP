/**
 * Coin Service — atomic coin operations with reservation pattern
 * Reference: SOLUTION_ROADMAP Task 4.2, 21_BILLING_LOGIC.md
 *
 * Coin flow per execution:
 *  1. calculateCost(tool, plan) → coins
 *  2. reserveCoins(userId, coins) → reservationId
 *  3. Execute tool
 *  4a. confirmReservation(reservationId)  — on success
 *  4b. releaseReservation(reservationId)  — on failure
 *
 * Balance is derived from SUM(ledger) and cached in userCoinWallets.
 */

import {
  db,
  coinTransactions,
  userCoinWallets,
  toolCoinCosts,
  planCoinRules,
  subscriptions,
  plans,
  eq,
  and,
  lt,
  sql,
  desc,
} from '@hsafx/db';
import { createLogger } from '@hsafx/shared/logger';

const log = createLogger('coin-service');

// ─── Types ────────────────────────────────────────────────────

export interface CoinCostParams {
  toolId: string;
  toolClass: string; // e.g. 'text_transform', 'calculator', 'structured_conversion'
  baWeight?: number; // from toolCoinCosts table, defaults to 1.0
  overrideCost?: number | null;
  successCount?: number; // number of billable actions, default 1
}

export interface ReservationResult {
  reservationId: string;
  amount: number;
  balanceAfter: number;
}

// ─── BA weight defaults by tool class ─────────────────────────

const DEFAULT_BA_WEIGHTS: Record<string, number> = {
  calculator: 0.1,
  text_transform: 0.2,
  structured_conversion: 0.2,
};

// ─── Cost calculation ─────────────────────────────────────────

/**
 * Calculate the coin cost for a tool execution.
 * Formula: coins = ceil(successCount × baWeight × (1 - discountPercent/100))
 */
export function calculateCoinCost(
  baWeight: number,
  discountPercent: number,
  successCount: number = 1,
): number {
  const bAcharged = successCount * baWeight;
  return Math.ceil(bAcharged * (1 - discountPercent / 100));
}

/**
 * Look up the full cost for a given tool + user's plan.
 */
export async function getToolCoinCost(
  toolId: string,
  toolClass: string,
  userId: string,
): Promise<{ coins: number; baWeight: number; discountPercent: number }> {
  // 1. Get BA weight from toolCoinCosts (admin override) or default
  const [costRow] = await db
    .select()
    .from(toolCoinCosts)
    .where(eq(toolCoinCosts.toolId, toolId))
    .limit(1);

  // If there's an override cost, use it directly (no formula)
  if (costRow?.overrideCost != null) {
    return { coins: costRow.overrideCost, baWeight: Number(costRow.baWeight), discountPercent: 0 };
  }

  const baWeight = costRow ? Number(costRow.baWeight) : (DEFAULT_BA_WEIGHTS[toolClass] ?? 1.0);

  // 2. Get user's current plan for discount
  const [sub] = await db
    .select({ planId: subscriptions.planId })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active'),
      ),
    )
    .limit(1);

  let discountPercent = 0;
  if (sub) {
    const [rule] = await db
      .select({ discountPercent: planCoinRules.discountPercent })
      .from(planCoinRules)
      .where(
        and(
          eq(planCoinRules.planId, sub.planId),
          eq(planCoinRules.toolClass, toolClass),
        ),
      )
      .limit(1);
    discountPercent = rule?.discountPercent ?? 0;
  }

  const coins = calculateCoinCost(baWeight, discountPercent);
  return { coins, baWeight, discountPercent };
}

// ─── Balance ──────────────────────────────────────────────────

/**
 * Get the current coin balance from the wallet cache.
 * Falls back to ledger SUM if wallet doesn't exist.
 */
export async function getBalance(userId: string): Promise<number> {
  const [wallet] = await db
    .select({ balance: userCoinWallets.balance })
    .from(userCoinWallets)
    .where(eq(userCoinWallets.userId, userId))
    .limit(1);

  if (wallet) return wallet.balance;

  // Fallback: compute from ledger
  const [result] = await db
    .select({ total: sql<number>`COALESCE(SUM(${coinTransactions.amount}), 0)` })
    .from(coinTransactions)
    .where(eq(coinTransactions.userId, userId));

  return Number(result?.total ?? 0);
}

/**
 * Check if user has enough coins for a specific amount.
 */
export async function checkBalance(
  userId: string,
  requiredCoins: number,
): Promise<boolean> {
  const balance = await getBalance(userId);
  return balance >= requiredCoins;
}

// ─── Reservation pattern (atomic) ─────────────────────────────

/**
 * Reserve coins before execution. Uses DB transaction with FOR UPDATE lock.
 * Returns a reservationId (= coinTransaction.id) to confirm or release.
 */
export async function reserveCoins(
  userId: string,
  amount: number,
  toolId: string,
  toolName: string,
  idempotencyKey?: string,
): Promise<ReservationResult> {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(`Invalid coin amount: ${amount}. Must be a positive integer.`);
  }
  return await db.transaction(async (tx) => {
    // Check idempotency — if already reserved with this key, return existing
    if (idempotencyKey) {
      const [existing] = await tx
        .select()
        .from(coinTransactions)
        .where(
          and(
            eq(coinTransactions.userId, userId),
            sql`${coinTransactions.metadata}->>'idempotencyKey' = ${idempotencyKey}`,
            eq(coinTransactions.type, 'spend'),
          ),
        )
        .limit(1);

      if (existing) {
        return {
          reservationId: existing.id,
          amount: Math.abs(existing.amount),
          balanceAfter: existing.balanceAfter,
        };
      }
    }

    // Lock wallet row for atomicity
    const [wallet] = await tx
      .select()
      .from(userCoinWallets)
      .where(eq(userCoinWallets.userId, userId))
      .for('update')
      .limit(1);

    const currentBalance = wallet?.balance ?? 0;

    if (wallet?.disputeFrozen) {
      throw new Error('Wallet is frozen due to a payment dispute. Contact support.');
    }

    if (currentBalance < amount) {
      throw new InsufficientCoinsError(currentBalance, amount);
    }

    const newBalance = currentBalance - amount;

    // Insert reservation transaction
    const [txn] = await tx
      .insert(coinTransactions)
      .values({
        userId,
        amount: -amount,
        type: 'spend',
        reason: `Tool execution: ${toolName} (reserved)`,
        resourceType: 'tool',
        resourceId: toolId,
        balanceAfter: newBalance,
        metadata: {
          status: 'reserved',
          ...(idempotencyKey ? { idempotencyKey } : {}),
        },
      })
      .returning();

    // Update wallet cache
    if (wallet) {
      await tx
        .update(userCoinWallets)
        .set({ balance: newBalance, lifetimeSpent: sql`${userCoinWallets.lifetimeSpent} + ${amount}`, updatedAt: new Date() })
        .where(eq(userCoinWallets.userId, userId));
    } else {
      // Create wallet if it doesn't exist
      await tx.insert(userCoinWallets).values({
        userId,
        balance: newBalance,
        lifetimeSpent: amount,
      });
    }

    return {
      reservationId: txn!.id,
      amount,
      balanceAfter: newBalance,
    };
  });
}

/**
 * Confirm a coin reservation (tool succeeded).
 * Marks the transaction as confirmed. Only transitions from 'reserved' status.
 */
export async function confirmReservation(reservationId: string): Promise<void> {
  await db.transaction(async (tx) => {
    // Lock the row to prevent race with releaseReservation
    const [original] = await tx
      .select()
      .from(coinTransactions)
      .where(eq(coinTransactions.id, reservationId))
      .for('update')
      .limit(1);

    if (!original) return;

    // Only confirm if still in 'reserved' status
    const status = (original.metadata as Record<string, unknown>)?.status;
    if (status !== 'reserved') return;

    await tx
      .update(coinTransactions)
      .set({
        metadata: sql`jsonb_set(COALESCE(${coinTransactions.metadata}, '{}'::jsonb), '{status}', '"confirmed"')`,
      })
      .where(eq(coinTransactions.id, reservationId));
  });
}

/**
 * Release a coin reservation (tool failed — refund).
 * Creates a refund transaction and restores wallet balance.
 */
export async function releaseReservation(reservationId: string): Promise<void> {
  await db.transaction(async (tx) => {
    // Find the original reservation with row lock to prevent double-refund race
    const [original] = await tx
      .select()
      .from(coinTransactions)
      .where(eq(coinTransactions.id, reservationId))
      .for('update')
      .limit(1);

    if (!original) return;

    // Idempotency guard: skip if already released or confirmed
    const status = (original.metadata as Record<string, unknown>)?.status;
    if (status === 'released' || status === 'confirmed') return;

    const refundAmount = Math.abs(original.amount);

    // Mark original as released
    await tx
      .update(coinTransactions)
      .set({
        metadata: sql`jsonb_set(COALESCE(${coinTransactions.metadata}, '{}'::jsonb), '{status}', '"released"')`,
      })
      .where(eq(coinTransactions.id, reservationId));

    // Get current wallet balance
    const [wallet] = await tx
      .select()
      .from(userCoinWallets)
      .where(eq(userCoinWallets.userId, original.userId))
      .for('update')
      .limit(1);

    const currentBalance = wallet?.balance ?? 0;
    const newBalance = currentBalance + refundAmount;

    // Insert refund transaction
    await tx.insert(coinTransactions).values({
      userId: original.userId,
      amount: refundAmount,
      type: 'refund',
      reason: `Refund: execution failed`,
      resourceType: original.resourceType,
      resourceId: original.resourceId,
      balanceAfter: newBalance,
      metadata: { originalTransactionId: reservationId },
    });

    // Update wallet cache
    if (wallet) {
      await tx
        .update(userCoinWallets)
        .set({
          balance: newBalance,
          lifetimeSpent: sql`${userCoinWallets.lifetimeSpent} - ${refundAmount}`,
          updatedAt: new Date(),
        })
        .where(eq(userCoinWallets.userId, original.userId));
    }
  });
}

// ─── Direct deduction (for simple cases) ──────────────────────

/**
 * Deduct coins atomically in a single step (no reservation).
 * Used for immediate client-side tool results.
 */
export async function deductCoins(
  userId: string,
  amount: number,
  toolId: string,
  toolName: string,
  executionId?: string,
): Promise<{ transactionId: string; balanceAfter: number }> {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(`Invalid coin amount: ${amount}. Must be a positive integer.`);
  }
  return await db.transaction(async (tx) => {
    const [wallet] = await tx
      .select()
      .from(userCoinWallets)
      .where(eq(userCoinWallets.userId, userId))
      .for('update')
      .limit(1);

    const currentBalance = wallet?.balance ?? 0;

    if (currentBalance < amount) {
      throw new InsufficientCoinsError(currentBalance, amount);
    }

    const newBalance = currentBalance - amount;

    const [txn] = await tx
      .insert(coinTransactions)
      .values({
        userId,
        amount: -amount,
        type: 'spend',
        reason: `Tool execution: ${toolName}`,
        resourceType: 'tool',
        resourceId: toolId,
        balanceAfter: newBalance,
        metadata: {
          status: 'confirmed',
          ...(executionId ? { executionId } : {}),
        },
      })
      .returning();

    if (wallet) {
      await tx
        .update(userCoinWallets)
        .set({
          balance: newBalance,
          lifetimeSpent: sql`${userCoinWallets.lifetimeSpent} + ${amount}`,
          updatedAt: new Date(),
        })
        .where(eq(userCoinWallets.userId, userId));
    } else {
      await tx.insert(userCoinWallets).values({
        userId,
        balance: newBalance,
        lifetimeSpent: amount,
      });
    }

    return { transactionId: txn!.id, balanceAfter: newBalance };
  });
}

// ─── Grant coins ──────────────────────────────────────────────

/**
 * Grant coins to a user (plan grant, purchase, ad reward, etc.)
 */
export async function grantCoins(
  userId: string,
  amount: number,
  type: 'grant' | 'purchase' | 'adjustment',
  reason: string,
  resourceType?: string,
  resourceId?: string,
): Promise<{ transactionId: string; balanceAfter: number }> {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(`Invalid coin amount: ${amount}. Must be a positive integer.`);
  }
  return await db.transaction(async (tx) => {
    const [wallet] = await tx
      .select()
      .from(userCoinWallets)
      .where(eq(userCoinWallets.userId, userId))
      .for('update')
      .limit(1);

    const currentBalance = wallet?.balance ?? 0;
    const newBalance = currentBalance + amount;

    const [txn] = await tx
      .insert(coinTransactions)
      .values({
        userId,
        amount,
        type,
        reason,
        resourceType,
        resourceId,
        balanceAfter: newBalance,
      })
      .returning();

    if (wallet) {
      await tx
        .update(userCoinWallets)
        .set({
          balance: newBalance,
          lifetimeEarned: sql`${userCoinWallets.lifetimeEarned} + ${amount}`,
          updatedAt: new Date(),
        })
        .where(eq(userCoinWallets.userId, userId));
    } else {
      await tx.insert(userCoinWallets).values({
        userId,
        balance: newBalance,
        lifetimeEarned: amount,
      });
    }

    return { transactionId: txn!.id, balanceAfter: newBalance };
  });
}

// ─── Stale Reservation Cleanup ────────────────────────────────

/**
 * Release coin reservations stuck in 'reserved' status for longer than the threshold.
 * This happens when a process crashes between reserve and confirm/release.
 * Should be called periodically via cron.
 */
export async function releaseStaleReservations(olderThanMinutes = 30): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);

  // Find stale reservations: type = 'spend', metadata.status = 'reserved', created before cutoff
  const stale = await db
    .select({ id: coinTransactions.id })
    .from(coinTransactions)
    .where(
      and(
        eq(coinTransactions.type, 'spend'),
        sql`${coinTransactions.metadata}->>'status' = 'reserved'`,
        lt(coinTransactions.createdAt, cutoff),
      ),
    )
    .limit(100); // Process in batches to avoid locking too many rows

  let released = 0;
  for (const row of stale) {
    try {
      await releaseReservation(row.id);
      released++;
    } catch (err) {
      // Log but continue — one bad reservation shouldn't block others
      log.warn('Failed to release stale reservation', { reservationId: row.id, err });
    }
  }

  if (released > 0) {
    log.info('Released stale coin reservations', { found: stale.length, released });
  }

  return released;
}

// ─── Errors ───────────────────────────────────────────────────

export class InsufficientCoinsError extends Error {
  public readonly currentBalance: number;
  public readonly requiredAmount: number;

  constructor(currentBalance: number, requiredAmount: number) {
    super(
      `Insufficient coins: have ${currentBalance}, need ${requiredAmount}`,
    );
    this.name = 'InsufficientCoinsError';
    this.currentBalance = currentBalance;
    this.requiredAmount = requiredAmount;
  }
}
