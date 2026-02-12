/**
 * useAdminStream — React hook for SSE admin dashboard stream
 *
 * Connects to /api/admin/stream and provides real-time updates.
 * Hybrid: instant event-bus push + periodic health poll.
 * Auto-reconnects on disconnect with exponential backoff.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ── Event payload types (mirrors server-side pub/sub types) ──

interface AdminErrorPayload {
  errorId: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  module: string;
  stack?: string;
}

interface AdminAlertPayload {
  alertId: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface AdminJobPayload {
  jobId: string;
  name: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  message?: string;
}

interface AdminWebhookPayload {
  webhookId: string;
  provider: string;
  event: string;
  status: 'received' | 'processing' | 'completed' | 'failed';
}

interface StreamData {
  activeUsers: { count: number; connections: number };
  systemHealth: {
    dbLatencyMs: number;
    uptime: number;
    memoryUsageMb: number;
  };
  metrics: {
    activeUsers: number;
    dbLatencyMs: number;
    memoryUsageMb: number;
    uptime: number;
  } | null;
  errors: AdminErrorPayload[];
  alerts: AdminAlertPayload[];
  jobs: AdminJobPayload[];
  webhooks: AdminWebhookPayload[];
  lastHeartbeat: number | null;
  connected: boolean;
}

const MAX_LIST_SIZE = 50;

const INITIAL_STATE: StreamData = {
  activeUsers: { count: 0, connections: 0 },
  systemHealth: { dbLatencyMs: 0, uptime: 0, memoryUsageMb: 0 },
  metrics: null,
  errors: [],
  alerts: [],
  jobs: [],
  webhooks: [],
  lastHeartbeat: null,
  connected: false,
};

export function useAdminStream() {
  const [data, setData] = useState<StreamData>(INITIAL_STATE);
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef(0);

  const connect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
    }

    const es = new EventSource('/api/admin/stream');
    esRef.current = es;

    es.addEventListener('connected', () => {
      retryRef.current = 0;
      setData((prev) => ({ ...prev, connected: true }));
    });

    // ── Periodic health events (5s poll) ────────────────

    es.addEventListener('active-users', (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data);
        setData((prev) => ({ ...prev, activeUsers: parsed }));
      } catch { /* ignore */ }
    });

    es.addEventListener('system-health', (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data);
        setData((prev) => ({ ...prev, systemHealth: parsed }));
      } catch { /* ignore */ }
    });

    es.addEventListener('heartbeat', (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data);
        setData((prev) => ({ ...prev, lastHeartbeat: parsed.ts }));
      } catch { /* ignore */ }
    });

    // ── Event-bus driven events (instant push) ──────────

    es.addEventListener('metrics', (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data);
        setData((prev) => ({ ...prev, metrics: parsed }));
      } catch { /* ignore */ }
    });

    es.addEventListener('admin-error', (e: MessageEvent) => {
      try {
        const parsed: AdminErrorPayload = JSON.parse(e.data);
        setData((prev) => ({
          ...prev,
          errors: [parsed, ...prev.errors].slice(0, MAX_LIST_SIZE),
        }));
      } catch { /* ignore */ }
    });

    es.addEventListener('admin-alert', (e: MessageEvent) => {
      try {
        const parsed: AdminAlertPayload = JSON.parse(e.data);
        setData((prev) => ({
          ...prev,
          alerts: [parsed, ...prev.alerts].slice(0, MAX_LIST_SIZE),
        }));
      } catch { /* ignore */ }
    });

    es.addEventListener('admin-job', (e: MessageEvent) => {
      try {
        const parsed: AdminJobPayload = JSON.parse(e.data);
        setData((prev) => {
          const idx = prev.jobs.findIndex((j) => j.jobId === parsed.jobId);
          const next = [...prev.jobs];
          if (idx >= 0) {
            next[idx] = parsed;
          } else {
            next.unshift(parsed);
          }
          return { ...prev, jobs: next.slice(0, MAX_LIST_SIZE) };
        });
      } catch { /* ignore */ }
    });

    es.addEventListener('admin-webhook', (e: MessageEvent) => {
      try {
        const parsed: AdminWebhookPayload = JSON.parse(e.data);
        setData((prev) => ({
          ...prev,
          webhooks: [parsed, ...prev.webhooks].slice(0, MAX_LIST_SIZE),
        }));
      } catch { /* ignore */ }
    });

    es.onerror = () => {
      es.close();
      setData((prev) => ({ ...prev, connected: false }));

      // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
      const delay = Math.min(1000 * 2 ** retryRef.current, 30000);
      retryRef.current++;
      setTimeout(connect, delay);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
    };
  }, [connect]);

  const disconnect = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    setData((prev) => ({ ...prev, connected: false }));
  }, []);

  const clearErrors = useCallback(() => {
    setData((prev) => ({ ...prev, errors: [] }));
  }, []);

  const clearAlerts = useCallback(() => {
    setData((prev) => ({ ...prev, alerts: [] }));
  }, []);

  return { ...data, disconnect, clearErrors, clearAlerts };
}
