/**
 * Cron: B2B Usage Reconciliation — runs periodically
 *
 * Scans Redis for `b2b:usage_failed:*` keys (written by job-worker.ts
 * when incrementB2bUsage() fails after a successful engine execution).
 *
 * For each failed usage record:
 *  1. Parse the stored { userId, suiteId, ts }
 *  2. Retry incrementB2bUsage()
 *  3. If successful → delete the Redis key
 *  4. If still failing → leave for next run (keys have 7-day TTL)
 *
 * Secured by CRON_SECRET env var (same as wallet-reconciliation).
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@hsafx/db';
import { redis } from '@/lib/redis';
import { incrementB2bUsage } from '@/server/limits/b2b-quota-service';

// ─── Config ─────────────────────────────────────────────────

const CRON_SECRET = process.env.CRON_SECRET ?? '';
const LOCK_KEY = 'cron:lock:b2b-usage-reconciliation';
const LOCK_TTL = 300; // 5 minutes
const SCAN_PATTERN = 'b2b:usage_failed:*';
const SCAN_BATCH = 100;

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// ─── Types ──────────────────────────────────────────────────

interface FailedUsage {
  userId: string;
  suiteId: string;
  ts: number;
}

interface ReconciliationResult {
  totalKeys: number;
  reconciled: number;
  stillFailing: number;
  invalid: number;
  errors: string[];
}

// ─── Handler ────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return unauthorized();
  }

  // Distributed lock — prevent concurrent runs
  const acquired = await redis.set(LOCK_KEY, '1', { ex: LOCK_TTL, nx: true });
  if (!acquired) {
    return NextResponse.json(
      { success: false, error: 'Another instance is already running' },
      { status: 409 },
    );
  }

  const startTime = Date.now();
  const result: ReconciliationResult = {
    totalKeys: 0,
    reconciled: 0,
    stillFailing: 0,
    invalid: 0,
    errors: [],
  };

  try {
    // Scan for all failed usage keys
    const failedKeys: string[] = [];
    let cursor = '0';

    do {
      const [nextCursor, keys] = await redis.scan(cursor, {
        match: SCAN_PATTERN,
        count: SCAN_BATCH,
      });
      cursor = typeof nextCursor === 'number' ? String(nextCursor) : nextCursor;
      failedKeys.push(...keys);
    } while (cursor !== '0');

    result.totalKeys = failedKeys.length;

    // Process each failed usage record
    for (const key of failedKeys) {
      try {
        const raw = await redis.get(key);
        if (!raw) {
          result.invalid++;
          continue;
        }

        let data: FailedUsage;
        try {
          data = JSON.parse(raw as string) as FailedUsage;
        } catch {
          result.invalid++;
          await redis.del(key);
          continue;
        }

        if (!data.userId || !data.suiteId) {
          result.invalid++;
          await redis.del(key);
          continue;
        }

        // Retry the increment
        await incrementB2bUsage(data.userId, data.suiteId);

        // Success — remove the key
        await redis.del(key);
        result.reconciled++;
      } catch (err) {
        // Still failing — leave for next run
        result.stillFailing++;
        const msg = err instanceof Error ? err.message : String(err);
        if (result.errors.length < 20) {
          result.errors.push(`${key} → ${msg}`);
        }
      }
    }

    const durationMs = Date.now() - startTime;

    // Log the cron run
    await db.execute(sql`
      INSERT INTO api_request_logs (
        method, path, status_code, duration_ms, metadata, created_at
      ) VALUES (
        'CRON',
        '/api/cron/b2b-usage-reconciliation',
        200,
        ${durationMs},
        ${JSON.stringify({
          ...result,
          cronJob: 'b2b-usage-reconciliation',
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
