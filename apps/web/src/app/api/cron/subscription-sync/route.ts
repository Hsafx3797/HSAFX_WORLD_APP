/**
 * Cron: Subscription Sync — 04:00 UTC daily
 * Reference: 21_BILLING_LOGIC.md, SOLUTION_ROADMAP Sprint 5.1
 *
 * Checks ACTIVE subscriptions against the billing provider (Polar).
 * - If subscription is PAST_DUE > 3 days → mark as 'expired'
 * - If Polar says cancelled but local still active → sync status
 * - Logs results to audit trail
 *
 * Secured by CRON_SECRET env var check.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  db,
  subscriptions,
  eq,
  and,
  sql,
} from '@hsafx/db';

// ─── Auth guard ─────────────────────────────────────────────

const CRON_SECRET = process.env.CRON_SECRET ?? '';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// ─── Grace period ───────────────────────────────────────────

const PAST_DUE_GRACE_DAYS = 3;

// ─── Types ──────────────────────────────────────────────────

interface SyncResult {
  totalChecked: number;
  expired: number;
  synced: number;
  errors: string[];
}

// ─── Handler ────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return unauthorized();
  }

  const startTime = Date.now();
  const result: SyncResult = {
    totalChecked: 0,
    expired: 0,
    synced: 0,
    errors: [],
  };

  try {
    // 1. Find all active/past_due subscriptions
    const activeSubs = await db
      .select()
      .from(subscriptions)
      .where(
        sql`${subscriptions.status} IN ('active', 'past_due', 'trialing')`,
      );

    result.totalChecked = activeSubs.length;

    for (const sub of activeSubs) {
      try {
        // Check if subscription has a Polar ID for remote verification
        if (sub.polarSubscriptionId) {
          // Attempt to fetch from Polar API
          const polarStatus = await fetchPolarSubscriptionStatus(sub.polarSubscriptionId);

          if (polarStatus === 'canceled' && sub.status === 'active') {
            // Polar says canceled, update local
            await db
              .update(subscriptions)
              .set({
                status: 'canceled',
                canceledAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(subscriptions.id, sub.id));

            result.synced++;
            continue;
          }
        }

        // 2. Check PAST_DUE grace period
        if (sub.status === 'past_due') {
          const periodEnd = new Date(sub.currentPeriodEnd);
          const graceDeadline = new Date(periodEnd);
          graceDeadline.setDate(graceDeadline.getDate() + PAST_DUE_GRACE_DAYS);

          if (new Date() > graceDeadline) {
            // Past grace period → expire
            await db
              .update(subscriptions)
              .set({
                status: 'expired' as string,
                updatedAt: new Date(),
                metadata: sql`${subscriptions.metadata} || ${JSON.stringify({
                  expiredByCron: true,
                  expiredAt: new Date().toISOString(),
                  reason: 'past_due_grace_exceeded',
                })}::jsonb`,
              })
              .where(eq(subscriptions.id, sub.id));

            result.expired++;
          }
        }

        // 3. Check if current period has ended for active subs
        if (sub.status === 'active' && new Date() > new Date(sub.currentPeriodEnd)) {
          // Period ended without renewal — mark past_due
          await db
            .update(subscriptions)
            .set({
              status: 'past_due',
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(subscriptions.id, sub.id),
                eq(subscriptions.status, 'active'),
              ),
            );

          result.synced++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(`sub:${sub.id} → ${msg}`);
      }
    }

    const durationMs = Date.now() - startTime;

    // Log the cron run
    await db.execute(sql`
      INSERT INTO api_request_logs (
        method, path, status_code, duration_ms, metadata, created_at
      ) VALUES (
        'CRON',
        '/api/cron/subscription-sync',
        200,
        ${durationMs},
        ${JSON.stringify({
          ...result,
          cronJob: 'subscription-sync',
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
  }
}

// ─── Polar API helper ───────────────────────────────────────

/**
 * Fetch subscription status from Polar API.
 * Falls back to 'unknown' on errors to avoid blocking the cron job.
 */
async function fetchPolarSubscriptionStatus(
  polarSubId: string,
): Promise<string> {
  try {
    const polarToken = process.env.POLAR_ACCESS_TOKEN;
    if (!polarToken) return 'unknown';

    const response = await fetch(
      `https://api.polar.sh/v1/subscriptions/${polarSubId}`,
      {
        headers: {
          Authorization: `Bearer ${polarToken}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10_000), // 10s timeout
      },
    );

    if (!response.ok) return 'unknown';

    const data = (await response.json()) as { status?: string };
    return data.status ?? 'unknown';
  } catch {
    return 'unknown';
  }
}
