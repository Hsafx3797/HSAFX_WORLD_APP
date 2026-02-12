/**
 * Admin Metrics Collector
 *
 * Collects system metrics at a configurable interval and publishes
 * them to the shared event bus. This replaces per-SSE-connection
 * DB polling — a single collector feeds all subscribers.
 *
 * Usage:
 *   startMetricsCollector();   // idempotent, starts on first call
 *   stopMetricsCollector();    // graceful shutdown
 */

import { db, sql } from '@hsafx/db';
import { publishAdminMetrics } from '@hsafx/shared';

const COLLECT_INTERVAL_MS = 10_000; // 10s

let intervalId: ReturnType<typeof setInterval> | undefined;
let running = false;

async function collectAndPublish(): Promise<void> {
  let activeUsers = 0;
  let dbLatencyMs = 0;

  const dbStart = Date.now();
  try {
    const result = await db.execute<{ count: string }>(
      sql`SELECT COUNT(DISTINCT "userId") AS count
          FROM "session"
          WHERE "expiresAt" > NOW()`
    );
    const rows = Array.isArray(result) ? result : result.rows ?? [];
    activeUsers = Number(rows[0]?.count ?? 0);
    dbLatencyMs = Date.now() - dbStart;
  } catch {
    dbLatencyMs = Date.now() - dbStart;
  }

  const mem = process.memoryUsage();

  publishAdminMetrics({
    activeUsers,
    dbLatencyMs,
    memoryUsageMb: Math.round(mem.heapUsed / 1024 / 1024),
    uptime: process.uptime(),
  });
}

export function startMetricsCollector(): void {
  if (running) return;
  running = true;
  // Immediate first collection
  collectAndPublish();
  intervalId = setInterval(collectAndPublish, COLLECT_INTERVAL_MS);
}

export function stopMetricsCollector(): void {
  if (intervalId) clearInterval(intervalId);
  intervalId = undefined;
  running = false;
}
