/**
 * useAdminStream — React hook for SSE admin dashboard stream
 *
 * Connects to /api/admin/stream and provides real-time updates.
 * Auto-reconnects on disconnect with exponential backoff.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface StreamData {
  activeUsers: { count: number; connections: number };
  recentErrors: Array<{ message: string; timestamp: string }>;
  systemHealth: {
    dbLatencyMs: number;
    uptime: number;
    memoryUsageMb: number;
  };
  lastHeartbeat: number | null;
  connected: boolean;
}

const INITIAL_STATE: StreamData = {
  activeUsers: { count: 0, connections: 0 },
  recentErrors: [],
  systemHealth: { dbLatencyMs: 0, uptime: 0, memoryUsageMb: 0 },
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

    es.addEventListener('active-users', (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data);
        setData((prev) => ({ ...prev, activeUsers: parsed }));
      } catch { /* ignore */ }
    });

    es.addEventListener('recent-errors', (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data);
        setData((prev) => ({ ...prev, recentErrors: parsed.errors }));
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

  return { ...data, disconnect };
}
