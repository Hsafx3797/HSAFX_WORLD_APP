/**
 * Cron: Anonymous Usage Cleanup — 03:00 UTC daily
 * Reference: 21_BILLING_LOGIC.md, SOLUTION_ROADMAP Sprint 5.1
 *
 * Deletes anonymous_usage records older than 90 days.
 * Logs the count of deleted rows to audit for tracking.
 *
 * Secured by CRON_SECRET env var check.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, anonymousUsage, sql } from '@hsafx/db';

// ─── Auth guard ─────────────────────────────────────────────

const CRON_SECRET = process.env.CRON_SECRET ?? '';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// ─── Handler ────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return unauthorized();
  }

  const startTime = Date.now();

  try {
    // Delete anonymous usage records older than 90 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const deleted = await db
      .delete(anonymousUsage)
      .where(sql`${anonymousUsage.usedAt} < ${cutoffDate}`)
      .returning({ id: anonymousUsage.id });

    const deletedCount = deleted.length;
    const durationMs = Date.now() - startTime;

    // Log the cron run
    await db.execute(sql`
      INSERT INTO api_request_logs (
        method, path, status_code, duration_ms, metadata, created_at
      ) VALUES (
        'CRON',
        '/api/cron/anonymous-cleanup',
        200,
        ${durationMs},
        ${JSON.stringify({
          cronJob: 'anonymous-cleanup',
          deletedRecords: deletedCount,
          cutoffDate: cutoffDate.toISOString(),
          completedAt: new Date().toISOString(),
        })}::jsonb,
        NOW()
      )
    `);

    return NextResponse.json({
      success: true,
      deletedRecords: deletedCount,
      cutoffDate: cutoffDate.toISOString(),
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
