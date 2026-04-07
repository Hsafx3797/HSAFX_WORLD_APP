/**
 * Cron: Wallet Reconciliation — 02:00 UTC daily
 * Reference: 21_BILLING_LOGIC.md, SOLUTION_ROADMAP Sprint 5.1
 *
 * Compares wallet.balance vs SUM(coin_transactions.amount) for every wallet.
 * - Drift < 100 coins → auto-fix wallet balance, log adjustment tx
 * - Drift ≥ 100 coins → log alert to audit_logs for admin review
 *
 * Secured by CRON_SECRET env var check.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  db,
  userCoinWallets,
  coinTransactions,
  eq,
  sql,
} from '@hsafx/db';
import { redis } from '@/lib/redis';

// ─── Auth guard ─────────────────────────────────────────────

const CRON_SECRET = process.env.CRON_SECRET ?? '';
const LOCK_KEY = 'cron:lock:wallet-reconciliation';
const LOCK_TTL = 600; // 10 minutes

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// ─── Types ──────────────────────────────────────────────────

interface ReconciliationResult {
  totalWallets: number;
  autoFixed: number;
  alertsRaised: number;
  skipped: number;
  errors: string[];
}

// ─── Handler ────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel Cron or QStash)
  const authHeader = req.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return unauthorized();
  }

  // Distributed lock — prevent concurrent runs
  const acquired = await redis.set(LOCK_KEY, '1', { ex: LOCK_TTL, nx: true });
  if (!acquired) {
    return NextResponse.json({ success: false, error: 'Another instance is already running' }, { status: 409 });
  }

  const startTime = Date.now();
  const result: ReconciliationResult = {
    totalWallets: 0,
    autoFixed: 0,
    alertsRaised: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // 1. Get all wallets with their computed balance from transactions
    const wallets = await db
      .select({
        walletId: userCoinWallets.id,
        userId: userCoinWallets.userId,
        currentBalance: userCoinWallets.balance,
        computedBalance: sql<number>`COALESCE(
          (SELECT SUM(${coinTransactions.amount})
           FROM ${coinTransactions}
           WHERE ${coinTransactions.userId} = ${userCoinWallets.userId}),
          0
        )`.as('computed_balance'),
      })
      .from(userCoinWallets);

    result.totalWallets = wallets.length;

    for (const wallet of wallets) {
      try {
        const drift = Number(wallet.currentBalance) - Number(wallet.computedBalance);

        if (drift === 0) {
          result.skipped++;
          continue;
        }

        const absDrift = Math.abs(drift);

        if (absDrift < 100) {
          // Auto-fix: update wallet balance to match computed
          await db.transaction(async (tx) => {
            // Insert reconciliation transaction
            await tx.insert(coinTransactions).values({
              userId: wallet.userId,
              amount: -drift, // Negate drift to correct balance
              type: 'adjustment',
              reason: 'wallet_reconciliation',
              balanceAfter: Number(wallet.computedBalance),
              metadata: {
                previousBalance: Number(wallet.currentBalance),
                computedBalance: Number(wallet.computedBalance),
                drift,
                autoFixed: true,
                cronJob: 'wallet-reconciliation',
                timestamp: new Date().toISOString(),
              },
            });

            // Update wallet to computed balance
            await tx
              .update(userCoinWallets)
              .set({
                balance: Number(wallet.computedBalance),
                lastRecalculatedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(userCoinWallets.id, wallet.walletId));
          });

          result.autoFixed++;
        } else {
          // Alert: drift too large for auto-fix — log to audit
          // Using a simple insert to detect large drift; admin panel shows audit_logs
          await db.execute(sql`
            INSERT INTO api_request_logs (
              user_id, method, path, status_code, duration_ms, error_message, metadata, created_at
            ) VALUES (
              ${wallet.userId},
              'CRON',
              '/api/cron/wallet-reconciliation',
              299,
              0,
              ${'ALERT: Large wallet drift detected'},
              ${JSON.stringify({
                walletBalance: Number(wallet.currentBalance),
                computedBalance: Number(wallet.computedBalance),
                drift,
                severity: absDrift >= 500 ? 'critical' : 'warning',
                requiresManualReview: true,
                cronJob: 'wallet-reconciliation',
              })}::jsonb,
              NOW()
            )
          `);

          result.alertsRaised++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(`wallet:${wallet.walletId} → ${msg}`);
      }
    }

    const durationMs = Date.now() - startTime;

    // Log the cron run itself
    await db.execute(sql`
      INSERT INTO api_request_logs (
        method, path, status_code, duration_ms, metadata, created_at
      ) VALUES (
        'CRON',
        '/api/cron/wallet-reconciliation',
        200,
        ${durationMs},
        ${JSON.stringify({
          ...result,
          cronJob: 'wallet-reconciliation',
          completedAt: new Date().toISOString(),
        })}::jsonb,
        NOW()
      )
    `);

    return NextResponse.json({
      success: true,
      ...result,
      durationMs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  } finally {
    await redis.del(LOCK_KEY);
  }
}
