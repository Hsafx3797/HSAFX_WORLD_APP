/**
 * Admin SSE Stream Endpoint
 * GET /api/admin/stream
 *
 * Server-Sent Events stream for real-time admin dashboard updates.
 * Hybrid approach: event-bus driven (instant push) + periodic health poll (5s).
 *
 * Event channels relayed:
 * - admin:errors   → SSE event 'admin-error'
 * - admin:alerts   → SSE event 'admin-alert'
 * - admin:metrics  → SSE event 'metrics'       (also pushed by periodic poll)
 * - admin:jobs     → SSE event 'admin-job'
 * - admin:webhooks → SSE event 'admin-webhook'
 *
 * Periodic (5s):
 * - active-users, system-health, heartbeat
 *
 * Requires valid admin session. Auto-reconnects via EventSource on client.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireAdminRole } from '@/lib/require-admin';
import { db, sql } from '@hsafx/db';
import {
  getEventBus,
  PubSubChannels,
  type PubSubEvent,
  type AdminErrorEvent,
  type AdminAlertEvent,
  type AdminMetricsEvent,
  type AdminJobEvent,
  type AdminWebhookEvent,
} from '@hsafx/shared';
import { startMetricsCollector } from '@/lib/metrics-collector';

// ── Types ──────────────────────────────────────────────────

type SSEEventType =
  | 'connected'
  | 'heartbeat'
  | 'active-users'
  | 'system-health'
  | 'admin-error'
  | 'admin-alert'
  | 'metrics'
  | 'admin-job'
  | 'admin-webhook';

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
  // Start the centralized metrics collector (idempotent, lazy init on first request)
  startMetricsCollector();
  // Auth + admin role check
  const adminAuth = await requireAdminRole('admin.view');
  if (adminAuth instanceof NextResponse) return adminAuth;

  let intervalId: ReturnType<typeof setInterval> | undefined;
  let controllerRef: ReadableStreamDefaultController | undefined;
  const unsubscribers: Array<() => void> = [];

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;
      activeConnections.add(controller);

      const encoder = new TextEncoder();
      let msgId = 1;

      function send(event: SSEEventType, data: unknown): void {
        try {
          controller.enqueue(
            encoder.encode(encodeSSE({ event, data, id: String(msgId++) }))
          );
        } catch {
          cleanup();
        }
      }

      // Send initial connected event
      send('connected', {
        userId: adminAuth.userId,
        timestamp: new Date().toISOString(),
      });

      // ── Event bus subscriptions (instant push) ──────────

      const bus = getEventBus();

      unsubscribers.push(
        bus.subscribe(PubSubChannels.ADMIN_ERRORS, (e: PubSubEvent<AdminErrorEvent>) => {
          send('admin-error', e.data);
        }),
        bus.subscribe(PubSubChannels.ADMIN_ALERTS, (e: PubSubEvent<AdminAlertEvent>) => {
          send('admin-alert', e.data);
        }),
        bus.subscribe(PubSubChannels.ADMIN_METRICS, (e: PubSubEvent<AdminMetricsEvent>) => {
          send('metrics', e.data);
        }),
        bus.subscribe(PubSubChannels.ADMIN_JOBS, (e: PubSubEvent<AdminJobEvent>) => {
          send('admin-job', e.data);
        }),
        bus.subscribe(PubSubChannels.ADMIN_WEBHOOKS, (e: PubSubEvent<AdminWebhookEvent>) => {
          send('admin-webhook', e.data);
        }),
      );

      // ── Periodic health poll (5s fallback) ─────────────

      intervalId = setInterval(async () => {
        try {
          const [activeUsers, health] = await Promise.all([
            fetchActiveUserCount(),
            fetchSystemHealth(),
          ]);

          send('active-users', {
            count: activeUsers,
            connections: getActiveConnectionCount(),
          });
          send('system-health', health);
          send('heartbeat', { ts: Date.now() });
        } catch {
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
    for (const unsub of unsubscribers) unsub();
    unsubscribers.length = 0;
    if (controllerRef) activeConnections.delete(controllerRef);
  }

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
