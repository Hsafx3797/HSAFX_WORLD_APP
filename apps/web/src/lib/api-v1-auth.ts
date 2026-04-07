/**
 * B2B API v1 Authentication & Response Helpers
 * Reference: 25_API_AUTHENTICATION_GUIDE.md, 46_REDIS_KEY_SCHEMA.md
 *
 * Every /api/v1/* request flows through:
 *   1. Extract API key from headers
 *   2. Validate format
 *   3. Look up hash in DB → get scopes, rate-limit tier, owner
 *   4. Enforce rate limits (burst, hourly, daily) via Upstash Redis
 *   5. Attach context to request, forward to handler
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db, eq, apiKeys } from '@hsafx/db';
import {
  extractApiKeyFromHeaders,
  validateApiKeyFormat,
  parseScopesFromMetadata,
  hasScope,
  RATE_LIMIT_TIERS,
  type ApiKeyScope,
  type RateLimitTier,
} from '@/lib/api-keys';
import { redis, keys, TTL } from '@/lib/redis';
import { ApiErrorCode } from '@hsafx/shared/errors';

// ─── Types ─────────────────────────────────────────────────────

export interface ApiContext {
  /** DB row id of the API key */
  keyId: string;
  /** Owner user id */
  userId: string;
  /** Display name of the key */
  keyName: string;
  /** Granted scopes */
  scopes: ApiKeyScope[];
  /** Rate-limit tier (free, pro, advance) */
  rateLimitTier: RateLimitTier;
  /** Unique request id for tracing */
  requestId: string;
  /** Rate-limit remaining (hourly) */
  rateLimitRemaining: number;
  /** Rate-limit reset timestamp (ms epoch) */
  rateLimitReset: number;
}

// ─── Error helpers ─────────────────────────────────────────────

const ERROR_CODES = {
  [ApiErrorCode.AUTH_MISSING_KEY]:      { status: 401, message: 'Missing API key. Include Authorization: Bearer <key> header.' },
  [ApiErrorCode.AUTH_INVALID_KEY]:      { status: 401, message: 'Invalid API key. Check key format and try again.' },
  [ApiErrorCode.AUTH_KEY_REVOKED]:      { status: 401, message: 'API key has been revoked.' },
  [ApiErrorCode.AUTH_ACCOUNT_SUSPENDED]:{ status: 403, message: 'Account suspended. Contact support.' },
  [ApiErrorCode.AUTH_INSUFFICIENT_SCOPE]:{ status: 403, message: 'Insufficient API key permissions.' },
  [ApiErrorCode.RATE_LIMIT]:            { status: 429, message: 'Rate limit exceeded. Upgrade for higher limits.' },
} as const;

function errorResponse(
  code: keyof typeof ERROR_CODES,
  requestId: string,
  extra?: Record<string, unknown>,
): NextResponse {
  const { status, message } = ERROR_CODES[code];
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
        requestId,
        ...extra,
      },
    },
    { status },
  );
}

// ─── Request ID ────────────────────────────────────────────────

function generateRequestId(): string {
  return `req_${crypto.randomBytes(16).toString('hex')}`;
}

// ─── Rate Limiting (counter-based via Upstash) ────────────────

/** Atomic INCR + EXPIRE — avoids the race where a crash between INCR and EXPIRE leaves a key without TTL */
const INCR_WITH_TTL_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return count
`;

async function atomicIncr(key: string, ttlSeconds: number): Promise<number> {
  return await redis.eval(INCR_WITH_TTL_SCRIPT, [key], [ttlSeconds]) as number;
}

async function checkRateLimit(
  keyId: string,
  tier: RateLimitTier,
): Promise<{ allowed: boolean; remaining: number; limit: number; reset: number; retryAfter?: number }> {
  const limits = RATE_LIMIT_TIERS[tier];
  const now = Date.now();

  // Burst check (per minute)
  const burstKey = keys.rateLimit.apiKeyBurst(keyId);
  const burstCount = await atomicIncr(burstKey, TTL.RATE_LIMIT_BURST);
  if (burstCount > limits.burstPerMinute) {
    const burstTtl = await redis.ttl(burstKey);
    return {
      allowed: false,
      remaining: 0,
      limit: limits.burstPerMinute,
      reset: now + (burstTtl > 0 ? burstTtl * 1000 : 60_000),
      retryAfter: burstTtl > 0 ? burstTtl : 60,
    };
  }

  // Hourly check
  const hourlyKey = keys.rateLimit.apiKeyHourly(keyId);
  const hourlyCount = await atomicIncr(hourlyKey, TTL.RATE_LIMIT_HOURLY);
  if (hourlyCount > limits.requestsPerHour) {
    const hourlyTtl = await redis.ttl(hourlyKey);
    return {
      allowed: false,
      remaining: 0,
      limit: limits.requestsPerHour,
      reset: now + (hourlyTtl > 0 ? hourlyTtl * 1000 : 3_600_000),
      retryAfter: hourlyTtl > 0 ? hourlyTtl : 3600,
    };
  }

  // Daily check
  const dailyKey = keys.rateLimit.apiKeyDaily(keyId);
  const dailyCount = await atomicIncr(dailyKey, TTL.RATE_LIMIT_DAILY);
  if (dailyCount > limits.requestsPerDay) {
    const dailyTtl = await redis.ttl(dailyKey);
    return {
      allowed: false,
      remaining: 0,
      limit: limits.requestsPerDay,
      reset: now + (dailyTtl > 0 ? dailyTtl * 1000 : 86_400_000),
      retryAfter: dailyTtl > 0 ? dailyTtl : 86400,
    };
  }

  const remaining = limits.requestsPerHour - hourlyCount;
  const hourlyTtl = await redis.ttl(hourlyKey);

  return {
    allowed: true,
    remaining: Math.max(0, remaining),
    limit: limits.requestsPerHour,
    reset: now + (hourlyTtl > 0 ? hourlyTtl * 1000 : 3_600_000),
  };
}

// ─── Main middleware ──────────────────────────────────────────

/**
 * Authenticate and authorize a B2B API request.
 *
 * @returns `ApiContext` on success, or a `NextResponse` error on failure.
 */
export async function authenticateApiKey(
  request: NextRequest,
): Promise<ApiContext | NextResponse> {
  const requestId = generateRequestId();

  // 1. Extract key
  const rawKey = extractApiKeyFromHeaders(request.headers);
  if (!rawKey) {
    return errorResponse(ApiErrorCode.AUTH_MISSING_KEY, requestId);
  }

  // 2. Validate format
  const validation = validateApiKeyFormat(rawKey);
  if (!validation.valid || !validation.hash) {
    return errorResponse(ApiErrorCode.AUTH_INVALID_KEY, requestId);
  }

  // 3. DB lookup by hash
  const keyRow = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.keyHash, validation.hash),
  });

  if (!keyRow) {
    return errorResponse(ApiErrorCode.AUTH_INVALID_KEY, requestId);
  }

  // 4. Check revoked / inactive
  if (!keyRow.isActive || keyRow.revokedAt) {
    return errorResponse(ApiErrorCode.AUTH_KEY_REVOKED, requestId);
  }

  // 5. Check expiry
  if (keyRow.expiresAt && new Date(keyRow.expiresAt) < new Date()) {
    return errorResponse(ApiErrorCode.AUTH_KEY_REVOKED, requestId);
  }

  // 6. Parse scopes from metadata
  const scopes = parseScopesFromMetadata(keyRow.metadata as Record<string, unknown>);

  // 7. Rate limit
  const tier = (keyRow.rateLimitTier ?? 'free') as RateLimitTier;
  const rateResult = await checkRateLimit(keyRow.id, tier);

  if (!rateResult.allowed) {
    const res = errorResponse(ApiErrorCode.RATE_LIMIT, requestId, {
      retryAfter: rateResult.retryAfter,
      tier,
      upgradeUrl: 'https://app.hsafx.com/settings/billing',
    });
    res.headers.set('Retry-After', String(rateResult.retryAfter ?? 3600));
    res.headers.set('X-RateLimit-Limit', String(rateResult.limit));
    res.headers.set('X-RateLimit-Remaining', '0');
    res.headers.set('X-RateLimit-Reset', String(Math.floor(rateResult.reset / 1000)));
    return res;
  }

  // 8. Touch lastUsed (fire-and-forget — don't block response)
  db.update(apiKeys)
    .set({ lastUsed: new Date() })
    .where(eq(apiKeys.id, keyRow.id))
    .catch(() => {});

  return {
    keyId: keyRow.id,
    userId: keyRow.userId,
    keyName: keyRow.name,
    scopes,
    rateLimitTier: tier,
    requestId,
    rateLimitRemaining: rateResult.remaining,
    rateLimitReset: rateResult.reset,
  } satisfies ApiContext;
}

// ─── Scope guard ──────────────────────────────────────────────

/**
 * Returns a NextResponse error if the context lacks the required scope.
 */
export function requireScope(
  ctx: ApiContext,
  scope: ApiKeyScope,
): NextResponse | null {
  if (!hasScope(ctx.scopes, scope)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ApiErrorCode.AUTH_INSUFFICIENT_SCOPE,
          message: `Insufficient API key permissions. Required scope: ${scope}`,
          missingScopes: [scope],
          requestId: ctx.requestId,
        },
      },
      { status: 403 },
    );
  }
  return null;
}

// ─── Response helpers ─────────────────────────────────────────

/**
 * Wrap a successful response with standard envelope + rate-limit headers.
 */
export function apiResponse(
  data: unknown,
  ctx: ApiContext,
  status = 200,
): NextResponse {
  const tier = RATE_LIMIT_TIERS[ctx.rateLimitTier];
  const res = NextResponse.json(
    { success: true, data, requestId: ctx.requestId },
    { status },
  );
  res.headers.set('X-RateLimit-Limit', String(tier.requestsPerHour));
  res.headers.set('X-RateLimit-Remaining', String(ctx.rateLimitRemaining));
  res.headers.set('X-RateLimit-Reset', String(Math.floor(ctx.rateLimitReset / 1000)));
  res.headers.set('X-Request-Id', ctx.requestId);
  return res;
}

/**
 * Standard error envelope (for non-auth errors inside handlers).
 */
export function apiErrorResponse(
  code: string,
  message: string,
  ctx: ApiContext,
  status = 400,
  details?: unknown,
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
        timestamp: new Date().toISOString(),
        requestId: ctx.requestId,
      },
    },
    { status },
  );
}
