/**
 * Webhook Dispatch — delivers job completion notifications to customer endpoints.
 *
 * Features:
 *   - HMAC-SHA256 signature for payload verification
 *   - Fire-and-forget with retry (3 attempts, exponential backoff)
 *   - Filters by event type (job.completed, job.failed)
 */

import { db, eq, and, webhookEndpoints } from '@hsafx/db';
import { createHmac, randomUUID } from 'crypto';
import { createLogger } from '@hsafx/shared/logger';

const log = createLogger('webhook-dispatch');

// ─── Types ─────────────────────────────────────────────────────

export type WebhookEvent = 'job.completed' | 'job.failed';

export interface WebhookPayload {
  id: string;           // Unique delivery id
  event: WebhookEvent;
  timestamp: string;    // ISO-8601
  data: {
    jobId: string;
    toolId: string;
    status: 'completed' | 'failed';
    engine?: string;
    output?: unknown;
    error?: string;
    executionTime?: number;
  };
}

// ─── Signature ─────────────────────────────────────────────────

function signPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
}

// ─── Delivery ──────────────────────────────────────────────────

const MAX_RETRIES = Number(process.env.WEBHOOK_MAX_RETRIES ?? 3);
const RETRY_DELAYS = (process.env.WEBHOOK_RETRY_DELAYS_MS ?? '1000,5000,15000')
  .split(',')
  .map(Number); // ms
const WEBHOOK_TIMEOUT_MS = Number(process.env.WEBHOOK_TIMEOUT_MS ?? 10_000);

async function deliverWebhook(
  url: string,
  secret: string,
  payload: WebhookPayload,
): Promise<void> {
  const body = JSON.stringify(payload);
  const signature = signPayload(body, secret);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Id': payload.id,
          'X-Webhook-Timestamp': payload.timestamp,
          'X-Webhook-Signature': `sha256=${signature}`,
          'User-Agent': 'HSAFX-Webhook/1.0',
        },
        signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
      });

      // 2xx = success, stop retrying
      if (res.ok) return;

      // 4xx (except 429) = permanent failure, don't retry
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        log.error('Permanent failure delivering webhook', { url, statusCode: res.status });
        return;
      }
    } catch (err) {
      // Network error or timeout
      if (attempt === MAX_RETRIES) {
        log.error('Webhook delivery failed after all retries', {
          url,
          attempts: MAX_RETRIES + 1,
          error: err instanceof Error ? err.message : String(err),
        });
        return;
      }
    }

    // Wait before retry (skip wait on last failed attempt)
    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]!));
    }
  }
}

// ─── Public API ────────────────────────────────────────────────

/**
 * Dispatch webhook notifications for a completed/failed job.
 * Looks up all active endpoints for the user, filters by event type,
 * and delivers in parallel (fire-and-forget).
 */
export async function dispatchJobWebhooks(
  userId: string,
  event: WebhookEvent,
  data: WebhookPayload['data'],
): Promise<void> {
  try {
    const endpoints = await db
      .select()
      .from(webhookEndpoints)
      .where(
        and(
          eq(webhookEndpoints.userId, userId),
          eq(webhookEndpoints.isActive, true),
        ),
      );

    if (endpoints.length === 0) return;

    const matching = endpoints.filter((ep) =>
      ep.events?.includes(event),
    );

    if (matching.length === 0) return;

    const payload: WebhookPayload = {
      id: randomUUID(),
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    // Fire-and-forget — don't block the caller
    Promise.allSettled(
      matching.map((ep) => deliverWebhook(ep.url, ep.secret, payload)),
    ).catch(() => {});
  } catch (err) {
    // Never let webhook dispatch crash the caller
    log.error('Failed to dispatch webhooks', { userId, event, error: err instanceof Error ? err.message : String(err) });
  }
}
