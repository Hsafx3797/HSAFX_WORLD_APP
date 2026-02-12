/**
 * Monitoring & Error Tracking — Admin App
 * Reference: SOLUTION_ROADMAP Sprint 5.3
 *
 * Lighter version of web monitoring — admin panel has lower traffic.
 * Provides:
 * - Sentry initialization (when NEXT_PUBLIC_SENTRY_DSN is set)
 * - Error capture for admin operations
 * - Admin action audit tracking
 *
 * Falls back to console logging when Sentry is not configured.
 */

import { createLogger } from '@hsafx/shared/logger';
import { publishAdminError } from '@hsafx/shared';

const log = createLogger('admin-monitoring');

// ─── Types ──────────────────────────────────────────────────

type SeverityLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

interface ErrorContext {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  level?: SeverityLevel;
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

export async function initMonitoring(): Promise<void> {
  if (_initialized) return;
  _initialized = true;

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    log.info('Sentry DSN not configured — using console fallback');
    return;
  }

  const Sentry = await getSentry();
  if (!Sentry) {
    log.warn('@sentry/nextjs not installed — using console fallback');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    release: process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0',
    tracesSampleRate: 0.2, // Lower sampling for admin
    enabled: process.env.NODE_ENV === 'production',
    ignoreErrors: [
      'Failed to fetch',
      'Load failed',
      'NetworkError',
      'AbortError',
      'ResizeObserver loop',
    ],
  });

  log.info('Sentry initialized');
}

// ─── Error Capture ──────────────────────────────────────────

export async function captureException(
  error: unknown,
  context?: ErrorContext,
): Promise<void> {
  const err = error instanceof Error ? error : new Error(String(error));
  log.error(err.message, { extra: context?.extra });

  // Publish to admin event bus for real-time SSE relay
  const severity = context?.level === 'fatal' ? 'critical'
    : context?.level === 'error' ? 'high'
    : context?.level === 'warning' ? 'medium'
    : 'low';
  publishAdminError({
    errorId: `err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    message: err.message,
    severity: severity as 'low' | 'medium' | 'high' | 'critical',
    module: context?.tags?.module ?? context?.tags?.category ?? 'admin',
    stack: err.stack,
    metadata: context?.extra,
  });

  const Sentry = await getSentry();
  if (Sentry) {
    Sentry.withScope((scope) => {
      scope.setTag('app', 'admin');
      if (context?.tags) {
        Object.entries(context.tags).forEach(([k, v]) => scope.setTag(k, v));
      }
      if (context?.extra) {
        Object.entries(context.extra).forEach(([k, v]) => scope.setExtra(k, v));
      }
      if (context?.level) {
        scope.setLevel(context.level);
      }
      Sentry.captureException(err);
    });
  }
}

export async function captureMessage(
  message: string,
  context?: ErrorContext,
): Promise<void> {
  const level = context?.level ?? 'info';
  if (level === 'error' || level === 'fatal') {
    log.error(message, { extra: context?.extra });
  } else if (level === 'warning') {
    log.warn(message, { extra: context?.extra });
  } else {
    log.info(message, { extra: context?.extra });
  }

  const Sentry = await getSentry();
  if (Sentry) {
    Sentry.withScope((scope) => {
      scope.setTag('app', 'admin');
      if (context?.tags) {
        Object.entries(context.tags).forEach(([k, v]) => scope.setTag(k, v));
      }
      if (context?.extra) {
        Object.entries(context.extra).forEach(([k, v]) => scope.setExtra(k, v));
      }
      Sentry.captureMessage(message, level);
    });
  }
}

// ─── Admin Action Logger ────────────────────────────────────

/**
 * Log an admin action for monitoring. These are low-volume so always log.
 */
export async function logAdminAction(
  action: string,
  details: Record<string, unknown>,
): Promise<void> {
  log.info(`Admin action: ${action}`, details);

  await captureMessage(`Admin action: ${action}`, {
    level: 'info',
    tags: { category: 'admin_action', action },
    extra: details,
  });
}
