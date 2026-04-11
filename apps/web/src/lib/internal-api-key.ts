/**
 * Internal API Key Provisioning
 *
 * Auto-creates a hidden API key for each user on registration.
 * The web UI uses this key to call POST /api/v1/engine/{name}
 * for B2C executions (coin-based billing wraps the B2B engine call).
 *
 * These keys are:
 * - Flagged `isInternal: true` — hidden from user's API key management
 * - Scoped to `tools:execute` + `tools:read`
 * - Not counted toward the 5-active-key user limit
 */

import { db } from '@hsafx/db';
import { apiKeys, eq, and } from '@hsafx/db/schema';
import { generateApiKey } from '@/lib/api-keys';
import { createLogger } from '@hsafx/shared/logger';

const log = createLogger('internal-api-key');

const INTERNAL_KEY_SCOPES = ['tools:execute', 'tools:read'];
const INTERNAL_KEY_NAME = '__internal_web';

/**
 * Provision an internal API key for a newly registered user.
 * Idempotent — skips if the user already has an active internal key.
 */
export async function provisionInternalApiKey(userId: string): Promise<void> {
  // Check if user already has an active internal key
  const existing = await db
    .select({ id: apiKeys.id })
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.userId, userId),
        eq(apiKeys.isInternal, true),
        eq(apiKeys.isActive, true),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    log.debug('Internal API key already exists', { userId });
    return;
  }

  const { hash, prefix } = generateApiKey();
  // NOTE: plaintext is intentionally discarded — the web UI never needs it directly.
  // Server-side code resolves the internal key by querying isInternal=true for the user.

  await db.insert(apiKeys).values({
    userId,
    name: INTERNAL_KEY_NAME,
    keyHash: hash,
    keyPrefix: prefix,
    scopes: INTERNAL_KEY_SCOPES,
    isInternal: true,
    rateLimitTier: 'standard',
  });

  log.info('Provisioned internal API key', { userId });
}

/**
 * Get the internal API key hash for a user (for server-side B2C→B2B bridge calls).
 * Returns null if no active internal key exists.
 */
export async function getInternalKeyForUser(userId: string): Promise<string | null> {
  const [key] = await db
    .select({ keyHash: apiKeys.keyHash })
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.userId, userId),
        eq(apiKeys.isInternal, true),
        eq(apiKeys.isActive, true),
      ),
    )
    .limit(1);

  return key?.keyHash ?? null;
}
