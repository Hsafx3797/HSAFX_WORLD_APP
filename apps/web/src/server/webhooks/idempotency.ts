/**
 * Webhook Idempotency Helper
 * Reference: C-11 (STEP_3.md) — processedWebhooks table
 *
 * Ensures each webhook event is processed at most once.
 * Uses the `processedWebhooks` table with a unique constraint on `eventId`.
 */

import { db, processedWebhooks, eq } from '@hsafx/db';

/**
 * Check if a webhook event has already been processed.
 */
export async function isWebhookProcessed(eventId: string): Promise<boolean> {
  const [existing] = await db
    .select({ id: processedWebhooks.id })
    .from(processedWebhooks)
    .where(eq(processedWebhooks.eventId, eventId))
    .limit(1);

  return !!existing;
}

/**
 * Record a webhook event as processed.
 * Uses INSERT ... ON CONFLICT DO NOTHING for safety against race conditions.
 */
export async function markWebhookProcessed(
  eventId: string,
  provider: string,
  eventType: string,
): Promise<void> {
  await db
    .insert(processedWebhooks)
    .values({ eventId, provider, eventType })
    .onConflictDoNothing({ target: processedWebhooks.eventId });
}
