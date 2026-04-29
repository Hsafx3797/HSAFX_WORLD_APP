/**
 * POST /api/v1/keys/rotate
 * Rotate the calling API key: generates a new key, keeps old key active
 * for a 24-hour grace period, then the old key is auto-deactivated.
 *
 * Auth: Requires valid API key with `billing:write` scope.
 * Returns: New key plaintext (shown once — cannot be retrieved again).
 */

import { NextRequest } from 'next/server';
import {
  authenticateApiKey,
  requireScope,
  apiResponse,
  apiErrorResponse,
  type ApiContext,
} from '@/lib/api-v1-auth';
import { ApiErrorCode } from '@hsafx/shared/errors';
import { generateApiKey } from '@/lib/api-keys';
import { db, apiKeys, eq } from '@hsafx/db';

const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(request: NextRequest) {
  // 1. Auth
  const result = await authenticateApiKey(request);
  if (result instanceof Response) return result;
  const ctx = result as ApiContext;

  // 2. Scope check — key rotation requires billing:write (elevated permission)
  const scopeErr = requireScope(ctx, 'billing:write');
  if (scopeErr) return scopeErr;

  // 3. Look up current key
  const currentKey = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.id, ctx.keyId),
  });

  if (!currentKey) {
    return apiErrorResponse(ApiErrorCode.AUTH_INVALID_KEY, 'API key not found', ctx, 404);
  }

  // Prevent already-rotated keys from being rotated again (unbounded chain)
  if (currentKey.expiresAt && new Date(currentKey.expiresAt) > new Date()) {
    return apiErrorResponse(
      ApiErrorCode.AUTH_KEY_IN_GRACE,
      'This key has already been rotated and is in its grace period. Use the new key to rotate again.',
      ctx,
      409,
    );
  }

  // 4. Generate new key
  const newKey = generateApiKey();

  // 5. Insert new key with same config as current
  const rows = await db.insert(apiKeys).values({
    userId: currentKey.userId,
    name: `${currentKey.name} (rotated)`,
    keyHash: newKey.hash,
    keyPrefix: newKey.prefix,
    scopes: currentKey.scopes,
    isActive: true,
    rateLimitTier: currentKey.rateLimitTier,
    metadata: currentKey.metadata as Record<string, unknown>,
  }).returning();

  const inserted = rows[0];
  if (!inserted) {
    return apiErrorResponse(ApiErrorCode.SERVER_ERROR, 'Failed to create rotated key', ctx, 500);
  }

  // 6. Set grace period on old key — expires in 24 hours
  const graceExpiry = new Date(Date.now() + GRACE_PERIOD_MS);
  await db.update(apiKeys)
    .set({ expiresAt: graceExpiry })
    .where(eq(apiKeys.id, ctx.keyId));

  return apiResponse({
    newKey: newKey.plaintext,
    newKeyId: inserted.id,
    newKeyPrefix: newKey.prefix,
    oldKeyId: ctx.keyId,
    oldKeyExpiresAt: graceExpiry.toISOString(),
    message: 'Key rotated. Save the new key — it cannot be retrieved again. Old key remains valid for 24 hours.',
  }, ctx, 200);
}
