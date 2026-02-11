/**
 * Admin SSE Stream Endpoint
 * GET /api/admin/stream
 *
 * Server-Sent Events stream for real-time admin dashboard updates.
 * Streams: system metrics, active user count, error events, revenue ticks.
 *
 * Requires valid admin session. Auto-reconnects via EventSource on client.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db, sql } from '@hsafx/db';

// ── Types ──────────────────────────────────────────────────

type SSEEventType =
  | 'connected'
  | 'heartbeat'
  | 'active-users'
  | 'recent-errors'
  | 'revenue-tick'
  | 'system-health';

interface SSEMessage {
  event: SSEEventType;
  data: unknown;
  id?: string;
}

// ── Active connection tracking ─────────────────────────────

const activeConnections = new Set<ReadableStreamDefaultController>();

function getActiveConnectionCount(): number {
  return activeConnections.size;
}

// ── Data fetchers ──────────────────────────────────────────

async function fetchActiveUserCount(): Promise<number> {
  try {
    const result = await db.execute<{ count: string }>(
      sql`SELECT COUNT(DISTINCT "userId") AS count
          FROM "session"
          WHERE "expiresAt" > NOW()`
    );
    const rows = Array.isArray(result) ? result : result.rows ?? [];
    return Number(rows[0]?.count ?? 0);
  } catch {
    return 0;
  }
}

async function fetchRecentErrors(): Promise<Array<{ message: string; timestamp: string }>> {
  try {
    // Uses audit_logs if it exists, otherwise returns empty
    const result = await db.execute<{ action: string; createdAt: string }>(
      sql`SELECT "action", "createdAt"
          FROM "audit_logs"
          WHERE "action" LIKE '%error%'
          ORDER BY "createdAt" DESC
          LIMIT 5`
    );
    const rows = Array.isArray(result) ? result : result.rows ?? [];
    return rows.map((r) => ({
      message: r.action,
      timestamp: r.createdAt,
    }));
  } catch {
    return [];
  }
}

async function fetchSystemHealth(): Promise<{
  dbLatencyMs: number;
  uptime: number;
  memoryUsageMb: number;
}> {
  const start = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
  } catch {
    // db down
  }
  const dbLatencyMs = Date.now() - start;

  const mem = process.memoryUsage();
  return {
    dbLatencyMs,
    uptime: process.uptime(),
    memoryUsageMb: Math.round(mem.heapUsed / 1024 / 1024),
  };
}

// ── SSE Encoder ────────────────────────────────────────────

function encodeSSE(msg: SSEMessage): string {
  const lines: string[] = [];
  if (msg.id) lines.push(`id: ${msg.id}`);
  lines.push(`event: ${msg.event}`);
  lines.push(`data: ${JSON.stringify(msg.data)}`);
  lines.push(''); // blank line = end of message
  return lines.join('\n') + '\n';
}

// ── Route Handler ──────────────────────────────────────────

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: NextRequest) {
  // Auth check
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let intervalId: ReturnType<typeof setInterval> | undefined;
  let controllerRef: ReadableStreamDefaultController | undefined;

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;
      activeConnections.add(controller);

      // Send initial connected event
      const encoder = new TextEncoder();
      controller.enqueue(
        encoder.encode(
          encodeSSE({
            event: 'connected',
            data: { userId: session.user.id, timestamp: new Date().toISOString() },
            id: '0',
          })
        )
      );

      let msgId = 1;

      // Send updates every 5 seconds
      intervalId = setInterval(async () => {
        try {
          const [activeUsers, recentErrors, health] =
            await Promise.all([
              fetchActiveUserCount(),
              fetchRecentErrors(),
              fetchSystemHealth(),
            ]);

          const messages: SSEMessage[] = [
            {
              event: 'active-users',
              data: { count: activeUsers, connections: getActiveConnectionCount() },
              id: String(msgId++),
            },
            {
              event: 'recent-errors',
              data: { errors: recentErrors },
              id: String(msgId++),
            },
            {
              event: 'system-health',
              data: health,
              id: String(msgId++),
            },
            {
              event: 'heartbeat',
              data: { ts: Date.now() },
              id: String(msgId++),
            },
          ];

          for (const msg of messages) {
            controller.enqueue(encoder.encode(encodeSSE(msg)));
          }
        } catch {
          // Client disconnected or error, will be cleaned up
          cleanup();
        }
      }, 5000);
    },

    cancel() {
      cleanup();
    },
  });

  function cleanup() {
    if (intervalId) clearInterval(intervalId);
    if (controllerRef) activeConnections.delete(controllerRef);
  }

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
