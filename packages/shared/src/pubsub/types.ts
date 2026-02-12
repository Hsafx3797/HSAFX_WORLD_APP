/**
 * Pub/Sub Event Payload Types
 *
 * Typed event payloads for each channel. All events include a
 * `timestamp` and `source` field for traceability.
 */

// ── Base ──────────────────────────────────────────────────

export interface PubSubEvent<T = unknown> {
  channel: string;
  timestamp: string;
  source: string;
  data: T;
}

// ── Admin: Errors ─────────────────────────────────────────

export interface AdminErrorEvent {
  errorId: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  module: string;
  stack?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

// ── Admin: Alerts ─────────────────────────────────────────

export interface AdminAlertEvent {
  alertId: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  actionUrl?: string;
}

// ── Admin: Metrics ────────────────────────────────────────

export interface AdminMetricsEvent {
  activeUsers: number;
  activeConnections?: number;
  dbLatencyMs: number;
  memoryUsageMb: number;
  uptime: number;
  requestsPerMinute?: number;
}

// ── Admin: Jobs ───────────────────────────────────────────

export interface AdminJobEvent {
  jobId: string;
  name: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  message?: string;
  userId?: string;
  error?: string;
}

// ── Admin: Webhooks ───────────────────────────────────────

export interface AdminWebhookEvent {
  webhookId: string;
  provider: string;
  event: string;
  status: 'received' | 'processing' | 'completed' | 'failed';
  processingMs?: number;
}

// ── Cache Invalidation ────────────────────────────────────

export interface CacheInvalidationEvent {
  keys: string[];
  reason: string;
}

// ── Job Progress ──────────────────────────────────────────

export interface JobProgressEvent {
  jobId: string;
  progress: number;
  stage?: string;
  estimatedRemainingMs?: number;
}

// ── Channel-to-payload map ────────────────────────────────

export interface ChannelEventMap {
  'admin:errors': AdminErrorEvent;
  'admin:alerts': AdminAlertEvent;
  'admin:metrics': AdminMetricsEvent;
  'admin:jobs': AdminJobEvent;
  'admin:webhooks': AdminWebhookEvent;
  'channel:cache:invalidation': CacheInvalidationEvent;
  'job:progress': JobProgressEvent;
}
