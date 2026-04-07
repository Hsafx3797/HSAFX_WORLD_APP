/**
 * Webhook Endpoints Management
 *   GET    /api/v1/account/webhooks — list registered webhooks
 *   POST   /api/v1/account/webhooks — register a new webhook endpoint
 *   DELETE /api/v1/account/webhooks — delete a webhook by id (query param)
 *
 * Requires scope: account:write (POST/DELETE), account:read (GET)
 */

import { NextRequest } from 'next/server';
import { db, eq, and, webhookEndpoints } from '@hsafx/db';
import { randomBytes } from 'crypto';
import {
  authenticateApiKey,
  requireScope,
  apiResponse,
  apiErrorResponse,
  type ApiContext,
} from '@/lib/api-v1-auth';
import { ApiErrorCode } from '@hsafx/shared/errors';

const MAX_WEBHOOKS_PER_USER = 5;
const VALID_EVENTS = ['job.completed', 'job.failed'] as const;
const MAX_URL_LENGTH = 2048;

/**
 * Block SSRF-prone hostnames: private IPs, loopback, link-local, cloud metadata.
 * Returns an error string if blocked, null if safe.
 */
function validateWebhookUrl(url: URL): string | null {
  if (url.protocol !== 'https:') {
    return 'Webhook URL must use HTTPS';
  }
  if (url.href.length > MAX_URL_LENGTH) {
    return `URL too long (max ${MAX_URL_LENGTH} characters)`;
  }
  // Block embedded credentials
  if (url.username || url.password) {
    return 'Webhook URL must not contain credentials';
  }
  const hostname = url.hostname.toLowerCase();
  // Block cloud metadata endpoints
  const blockedHostnames = [
    'metadata.google.internal',
    'metadata.goog',
    'kubernetes.default.svc',
  ];
  if (blockedHostnames.includes(hostname)) {
    return 'Webhook URL points to a blocked hostname';
  }
  // Block localhost variants
  if (hostname === 'localhost' || hostname === '[::1]') {
    return 'Webhook URL cannot point to localhost';
  }
  // Parse IP-based hostnames
  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b, c] = ipv4Match.map(Number);
    // 127.x.x.x (loopback)
    if (a === 127) return 'Webhook URL cannot point to loopback address';
    // 10.x.x.x (private)
    if (a === 10) return 'Webhook URL cannot point to private network';
    // 172.16-31.x.x (private)
    if (a === 172 && b! >= 16 && b! <= 31) return 'Webhook URL cannot point to private network';
    // 192.168.x.x (private)
    if (a === 192 && b === 168) return 'Webhook URL cannot point to private network';
    // 169.254.x.x (link-local / cloud metadata like 169.254.169.254)
    if (a === 169 && b === 254) return 'Webhook URL cannot point to link-local address';
    // 0.0.0.0
    if (a === 0 && b === 0 && c === 0) return 'Webhook URL cannot point to unspecified address';
  }
  return null;
}

// ─── GET — list webhooks ──────────────────────────────────────

export async function GET(request: NextRequest) {
  const result = await authenticateApiKey(request);
  if (result instanceof Response) return result;
  const ctx = result as ApiContext;

  const scopeErr = requireScope(ctx, 'billing:read');
  if (scopeErr) return scopeErr;

  const endpoints = await db
    .select({
      id: webhookEndpoints.id,
      url: webhookEndpoints.url,
      events: webhookEndpoints.events,
      isActive: webhookEndpoints.isActive,
      description: webhookEndpoints.description,
      createdAt: webhookEndpoints.createdAt,
    })
    .from(webhookEndpoints)
    .where(eq(webhookEndpoints.userId, ctx.userId));

  return apiResponse({ webhooks: endpoints }, ctx);
}

// ─── POST — register webhook ─────────────────────────────────

export async function POST(request: NextRequest) {
  const result = await authenticateApiKey(request);
  if (result instanceof Response) return result;
  const ctx = result as ApiContext;

  const scopeErr = requireScope(ctx, 'billing:write');
  if (scopeErr) return scopeErr;

  let body: { url: string; events?: string[]; description?: string };
  try {
    body = await request.json();
  } catch {
    return apiErrorResponse(ApiErrorCode.INVALID_JSON, 'Invalid JSON body', ctx, 400);
  }

  // Validate URL
  if (!body.url || typeof body.url !== 'string') {
    return apiErrorResponse(ApiErrorCode.MISSING_FIELD, 'Missing required field: url', ctx, 400);
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(body.url);
  } catch {
    return apiErrorResponse(ApiErrorCode.INVALID_FIELD, 'Invalid URL format', ctx, 400);
  }

  const urlError = validateWebhookUrl(parsedUrl);
  if (urlError) {
    return apiErrorResponse(ApiErrorCode.INVALID_FIELD, urlError, ctx, 400);
  }

  // Validate events
  const events = body.events ?? ['job.completed', 'job.failed'];
  for (const e of events) {
    if (!VALID_EVENTS.includes(e as typeof VALID_EVENTS[number])) {
      return apiErrorResponse(
        ApiErrorCode.INVALID_FIELD,
        `Invalid event type: ${e}. Valid: ${VALID_EVENTS.join(', ')}`,
        ctx,
        400,
      );
    }
  }

  // Check limit + insert atomically to prevent race condition
  const secret = `whsec_${randomBytes(32).toString('hex')}`;

  let created;
  try {
    [created] = await db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: webhookEndpoints.id })
        .from(webhookEndpoints)
        .where(eq(webhookEndpoints.userId, ctx.userId));

      if (existing.length >= MAX_WEBHOOKS_PER_USER) {
        throw new Error('LIMIT_EXCEEDED');
      }

      return tx
        .insert(webhookEndpoints)
        .values({
          userId: ctx.userId,
          url: body.url,
          secret,
          events,
          description: body.description ?? null,
        })
        .returning({
          id: webhookEndpoints.id,
          url: webhookEndpoints.url,
          events: webhookEndpoints.events,
          isActive: webhookEndpoints.isActive,
          description: webhookEndpoints.description,
          createdAt: webhookEndpoints.createdAt,
        });
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'LIMIT_EXCEEDED') {
      return apiErrorResponse(
        ApiErrorCode.LIMIT_REACHED,
        `Maximum ${MAX_WEBHOOKS_PER_USER} webhook endpoints allowed`,
        ctx,
        409,
      );
    }
    throw err;
  }

  return apiResponse(
    {
      webhook: created,
      // Only show the secret once at creation time
      secret,
    },
    ctx,
    201,
  );
}

// ─── DELETE — remove webhook ──────────────────────────────────

export async function DELETE(request: NextRequest) {
  const result = await authenticateApiKey(request);
  if (result instanceof Response) return result;
  const ctx = result as ApiContext;

  const scopeErr = requireScope(ctx, 'billing:write');
  if (scopeErr) return scopeErr;

  const { searchParams } = new URL(request.url);
  const webhookId = searchParams.get('id');

  if (!webhookId) {
    return apiErrorResponse(
      ApiErrorCode.MISSING_FIELD,
      'Missing required query parameter: id',
      ctx,
      400,
    );
  }

  const deleted = await db
    .delete(webhookEndpoints)
    .where(
      and(
        eq(webhookEndpoints.id, webhookId),
        eq(webhookEndpoints.userId, ctx.userId),
      ),
    )
    .returning({ id: webhookEndpoints.id });

  if (deleted.length === 0) {
    return apiErrorResponse(ApiErrorCode.WEBHOOK_NOT_FOUND, 'Webhook not found', ctx, 404);
  }

  return apiResponse({ deleted: true, id: webhookId }, ctx);
}
