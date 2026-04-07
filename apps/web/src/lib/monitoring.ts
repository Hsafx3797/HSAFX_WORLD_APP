/**
 * Monitoring & Error Tracking — Web App
 * Reference: SOLUTION_ROADMAP Sprint 5.3
 *
 * Provides:
 * - Sentry initialization (when NEXT_PUBLIC_SENTRY_DSN is set)
 * - Unified error capture helpers
 * - Performance monitoring hooks
 * - Alert threshold detection
 *
 * Install: pnpm add @sentry/nextjs
 * Then wire into instrumentation.ts and error.tsx as needed.
 *
 * Falls back to console logging when Sentry is not configured.
 *
 * TODO [G11]: Create error.tsx files at key route segments (app/, dashboard/, settings/) for proper error boundaries.
 */

// ─── Types ──────────────────────────────────────────────────

type SeverityLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

interface MonitoringUser {
  id: string;
  email?: string;
  plan?: string;
}

interface ErrorContext {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  level?: SeverityLevel;
  user?: MonitoringUser;
}

// ─── Sentry lazy import ─────────────────────────────────────

let _sentry: typeof import('@sentry/nextjs') | null = null;
let _initialized = false;

async function getSentry() {
  if (_sentry) return _sentry;
  try {
    _sentry = await import('@sentry/nextjs');
    return _sentry;
  } catch {
    return null;
  }
}

// ─── Initialization ─────────────────────────────────────────

/**
 * Initialize monitoring. Call once in instrumentation.ts or app layout.
 * No-op if NEXT_PUBLIC_SENTRY_DSN is not set.
 */
export async function initMonitoring(): Promise<void> {
  if (_initialized) return;
  _initialized = true;

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    console.info('[monitoring] Sentry DSN not configured — using console fallback');
    return;
  }

  const Sentry = await getSentry();
  if (!Sentry) {
    console.warn('[monitoring] @sentry/nextjs not installed — using console fallback');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    release: process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0',

    // Performance
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Only send errors in production
    enabled: process.env.NODE_ENV === 'production',

    // Filter out noisy errors
    ignoreErrors: [
      // Network errors
      'Failed to fetch',
      'Load failed',
      'NetworkError',
      'AbortError',
      // Browser-specific
      'ResizeObserver loop',
      'Non-Error exception captured',
    ],

    beforeSend(event) {
      // Don't send in development
      if (process.env.NODE_ENV !== 'production') return null;
      return event;
    },
  });

  console.info('[monitoring] Sentry initialized');
}

// ─── Error Capture ──────────────────────────────────────────

/**
 * Capture an exception and send to monitoring.
 */
export async function captureException(
  error: unknown,
  context?: ErrorContext,
): Promise<void> {
  const err = error instanceof Error ? error : new Error(String(error));

  // Always log to console
  console.error('[monitoring]', err.message, context?.extra ?? '');

  const Sentry = await getSentry();
  if (Sentry) {
    Sentry.withScope((scope) => {
      if (context?.tags) {
        Object.entries(context.tags).forEach(([k, v]) => scope.setTag(k, v));
      }
      if (context?.extra) {
        Object.entries(context.extra).forEach(([k, v]) => scope.setExtra(k, v));
      }
      if (context?.level) {
        scope.setLevel(context.level);
      }
      if (context?.user) {
        scope.setUser(context.user);
      }
      Sentry.captureException(err);
    });
  }
}

/**
 * Capture a message (non-error event).
 */
export async function captureMessage(
  message: string,
  context?: ErrorContext,
): Promise<void> {
  const level = context?.level ?? 'info';

  // Console fallback
  const logFn = level === 'error' || level === 'fatal' ? console.error
    : level === 'warning' ? console.warn
    : console.info;
  logFn(`[monitoring] ${message}`, context?.extra ?? '');

  const Sentry = await getSentry();
  if (Sentry) {
    Sentry.withScope((scope) => {
      if (context?.tags) {
        Object.entries(context.tags).forEach(([k, v]) => scope.setTag(k, v));
      }
      if (context?.extra) {
        Object.entries(context.extra).forEach(([k, v]) => scope.setExtra(k, v));
      }
      if (context?.user) {
        scope.setUser(context.user);
      }
      Sentry.captureMessage(message, level);
    });
  }
}

// ─── User Context ───────────────────────────────────────────

/**
 * Set the current user for monitoring context.
 */
export async function setMonitoringUser(user: MonitoringUser | null): Promise<void> {
  const Sentry = await getSentry();
  if (Sentry) {
    Sentry.setUser(user);
  }
}

// ─── Alert Helpers ──────────────────────────────────────────

import { getRedis, key } from './redis';

const ALERT_WINDOW_SECONDS = 60; // 1-minute sliding window
const ERROR_RATE_THRESHOLD = 10;
const WEBHOOK_FAILURE_THRESHOLD = 5;

export async function trackErrorRate(
  category: string,
  threshold = ERROR_RATE_THRESHOLD,
): Promise<void> {
  try {
    const redis = getRedis();
    const redisKey = key('monitoring', 'error_rate', category);

    const pipeline = redis.pipeline();
    pipeline.incr(redisKey);
    pipeline.expire(redisKey, ALERT_WINDOW_SECONDS);
    const results = await pipeline.exec<[number, boolean]>();

    const count = results[0] ?? 1;

    if (count === threshold) {
      await captureMessage(`Alert: ${category} error rate exceeded ${threshold}/min`, {
        level: 'error',
        tags: { alert: 'error_rate', category },
        extra: { count, windowSeconds: ALERT_WINDOW_SECONDS },
      });
    }
  } catch {
    // Redis unavailable — silently degrade (Sentry alerts are primary)
  }
}

/**
 * Track webhook failures for alerting (threshold: 5/min).
 */
export async function trackWebhookFailure(provider: string, eventType: string): Promise<void> {
  await trackErrorRate(`webhook:${provider}`, WEBHOOK_FAILURE_THRESHOLD);
  await captureMessage(`Webhook failure: ${provider}/${eventType}`, {
    level: 'warning',
    tags: { provider, eventType, category: 'webhook' },
  });
}
