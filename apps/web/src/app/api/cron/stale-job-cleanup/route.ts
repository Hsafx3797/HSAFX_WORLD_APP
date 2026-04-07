/**
 * Cron: Stale Job Cleanup — runs hourly
 * Reference: 71_ASYNC_JOB_SPEC.md, SOLUTION_ROADMAP Sprint 5.1
 *
 * 1. Cancel DB jobs stuck in 'running'/'pending' > 1 hour
 * 2. Delete expired job results from Redis (TTL-based, but sweep as safety)
 * 3. Mark file_uploads in 'processing' > 24h as 'failed' (R2 cleanup trigger)
 *
 * Secured by CRON_SECRET env var check.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  db,
  asyncJobs,
  fileUploads,
  sql,
} from '@hsafx/db';
import { redis, keys, TTL } from '@/lib/redis';
import { releaseStaleReservations } from '@/server/limits/coin-service';

// ─── Auth guard ─────────────────────────────────────────────

const CRON_SECRET = process.env.CRON_SECRET ?? '';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// ─── Thresholds ─────────────────────────────────────────────

const STALE_JOB_MINUTES = 60; // 1 hour
const STALE_UPLOAD_HOURS = 24; // 24 hours
const STALE_RESERVATION_MINUTES = 30; // 30 minutes

// ─── Types ──────────────────────────────────────────────────

interface CleanupResult {
  staleJobsCanceled: number;
  redisKeysCleared: number;
  staleUploadsFailed: number;
  orphanedReservationsReleased: number;
  errors: string[];
}

// ─── Handler ────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return unauthorized();
  }

  const startTime = Date.now();
  const result: CleanupResult = {
    staleJobsCanceled: 0,
    redisKeysCleared: 0,
    staleUploadsFailed: 0,
    orphanedReservationsReleased: 0,
    errors: [],
  };

  try {
    // ── 1. Cancel stale jobs in DB ────────────────────────────

    const staleJobCutoff = new Date();
    staleJobCutoff.setMinutes(staleJobCutoff.getMinutes() - STALE_JOB_MINUTES);

    const canceledJobs = await db
      .update(asyncJobs)
      .set({
        status: 'failed',
        errorMessage: 'Timed out — canceled by stale job cleanup cron',
        completedAt: new Date(),
      })
      .where(
        sql`${asyncJobs.status} IN ('pending', 'running')
            AND ${asyncJobs.createdAt} < ${staleJobCutoff}`,
      )
      .returning({ id: asyncJobs.id });

    result.staleJobsCanceled = canceledJobs.length;

    // ── 2. Clean up stale Redis job keys ──────────────────────

    // For each canceled job, remove its Redis keys
    for (const job of canceledJobs) {
      try {
        const keysToDelete = [
          keys.job.state(job.id),
          keys.job.result(job.id),
          keys.job.progress(job.id),
        ];

        await Promise.allSettled(
          keysToDelete.map((k) => redis.del(k)),
        );

        result.redisKeysCleared += keysToDelete.length;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(`redis:${job.id} → ${msg}`);
      }
    }

    // ── 3. Mark stale file uploads as failed ──────────────────

    const staleUploadCutoff = new Date();
    staleUploadCutoff.setHours(staleUploadCutoff.getHours() - STALE_UPLOAD_HOURS);

    const failedUploads = await db
      .update(fileUploads)
      .set({
        status: 'failed',
        updatedAt: new Date(),
      })
      .where(
        sql`${fileUploads.status} IN ('pending', 'processing')
            AND ${fileUploads.createdAt} < ${staleUploadCutoff}`,
      )
      .returning({ id: fileUploads.id });

    result.staleUploadsFailed = failedUploads.length;

    // ── 4. Release orphaned coin reservations ─────────────────

    try {
      result.orphanedReservationsReleased = await releaseStaleReservations(STALE_RESERVATION_MINUTES);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`reservations → ${msg}`);
    }

    const durationMs = Date.now() - startTime;

    // Log the cron run
    await db.execute(sql`
      INSERT INTO api_request_logs (
        method, path, status_code, duration_ms, metadata, created_at
      ) VALUES (
        'CRON',
        '/api/cron/stale-job-cleanup',
        200,
        ${durationMs},
        ${JSON.stringify({
          ...result,
          cronJob: 'stale-job-cleanup',
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
