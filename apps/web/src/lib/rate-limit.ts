/**
 * Rate Limiting Module
 * Reference: SOLUTION_ROADMAP Task 4.8, 15_SECURITY_MODEL.md §4.1-4.2
 *
 * 3-Layer rate limiting:
 * 1. IP layer — Global, all requests (anonymous: 100/min)
 * 2. Session layer — Per authenticated user (plan-based limits)
 * 3. Auth endpoint layer — Strict limits on auth routes (10 req/15min)
 *
 * Layer 3 (coin balance check) is handled by CoinService, not middleware.
 *
 * Provider: Upstash Redis + @upstash/ratelimit (sliding window)
 * Runtime: Edge-compatible
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ─── Redis client (Edge-compatible) ──────────────────────────

let _redis: Redis | undefined;

function getEdgeRedis(): Redis {
  if (!_redis) {
    _redis = Redis.fromEnv();
  }
  return _redis;
}

// ─── Rate limiters ────────────────────────────────────────────

/**
 * IP-based rate limiter — applies to ALL requests.
 * Anonymous users: 100 req/min
 */
let _ipLimiter: Ratelimit | undefined;

function getIpLimiter(): Ratelimit {
  if (!_ipLimiter) {
    _ipLimiter = new Ratelimit({
      redis: getEdgeRedis(),
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      prefix: 'rl:ip',
      analytics: false,
    });
  }
  return _ipLimiter;
}

/**
 * Session-based rate limiter — applies to authenticated users.
 * Limits vary by plan tier (per hour, matching user decisions).
 */
function getUserLimiter(requestsPerHour: number): Ratelimit {
  return new Ratelimit({
    redis: getEdgeRedis(),
    limiter: Ratelimit.slidingWindow(requestsPerHour, '1 h'),
    prefix: 'rl:user',
    analytics: false,
  });
}

/**
 * Auth endpoint rate limiter — strict limits.
 * 10 requests per 15 minutes per IP.
 */
let _authLimiter: Ratelimit | undefined;

function getAuthLimiter(): Ratelimit {
  if (!_authLimiter) {
    _authLimiter = new Ratelimit({
      redis: getEdgeRedis(),
      limiter: Ratelimit.slidingWindow(10, '15 m'),
      prefix: 'rl:auth',
      analytics: false,
    });
  }
  return _authLimiter;
}

/**
 * API key rate limiter — per-key limits for B2B.
 * Default: 60 req/min per key.
 */
let _apiKeyLimiter: Ratelimit | undefined;

function getApiKeyLimiter(): Ratelimit {
  if (!_apiKeyLimiter) {
    _apiKeyLimiter = new Ratelimit({
      redis: getEdgeRedis(),
      limiter: Ratelimit.slidingWindow(60, '1 m'),
      prefix: 'rl:apikey',
      analytics: false,
    });
  }
  return _apiKeyLimiter;
}

// ─── Plan tier limits ─────────────────────────────────────────

/** Hardcoded fallback — overridden by DB-backed Redis config when available */
const DEFAULT_PLAN_RATE_LIMITS: Record<string, number> = {
  guest: 50,
  free: 100,
  pro: 500,
  advance: 2000,
};

const EDGE_SESSION_LIMIT = 500;

/** In-memory cache of DB-backed limits (refreshed from Redis) */
let _cachedPlanLimits: Record<string, number> | null = null;
let _cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Load plan rate limits from Redis cache (synced from DB by admin).
 * Falls back to hardcoded defaults if Redis unavailable or unconfigured.
 */
async function getPlanRateLimits(): Promise<Record<string, number>> {
  const now = Date.now();
  if (_cachedPlanLimits && _cacheExpiry > now) return _cachedPlanLimits;

  try {
    const redis = getEdgeRedis();
    const raw = await redis.get<Record<string, number>>('config:rate_limits:plan_hourly');
    if (raw && typeof raw === 'object') {
      _cachedPlanLimits = { ...DEFAULT_PLAN_RATE_LIMITS, ...raw };
      _cacheExpiry = now + CACHE_TTL_MS;
      return _cachedPlanLimits;
    }
  } catch {
    // Redis unavailable — use defaults
  }

  _cachedPlanLimits = DEFAULT_PLAN_RATE_LIMITS;
  _cacheExpiry = now + CACHE_TTL_MS;
  return _cachedPlanLimits;
}

/**
 * Sync rate limit config from DB to Redis. Call from admin save handler.
 */
export async function syncRateLimitsToRedis(
  limits: Record<string, number>,
): Promise<void> {
  const redis = getEdgeRedis();
  await redis.set('config:rate_limits:plan_hourly', limits);
  // Invalidate local cache immediately
  _cachedPlanLimits = null;
  _cacheExpiry = 0;
}

// ─── Public API ───────────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  reset: number; // Unix timestamp (ms)
  layer: 'ip' | 'user' | 'auth' | 'apikey';
}

/**
 * Check IP-based rate limit (Layer 1).
 * Applied to all requests.
 */
export async function checkIpRateLimit(ip: string): Promise<RateLimitResult> {
  const limiter = getIpLimiter();
  const result = await limiter.limit(ip);
  return {
    allowed: result.success,
    remaining: result.remaining,
    limit: result.limit,
    reset: result.reset,
    layer: 'ip',
  };
}

/**
 * Check session-based rate limit (Layer 2).
 * Applied to authenticated users based on their plan tier.
 * When called from Edge middleware (no DB access), pass sessionToken as userId
 * and omit planSlug to use the generous edge default.
 */
export async function checkUserRateLimit(
  userId: string,
  planSlug?: string,
): Promise<RateLimitResult> {
  const planLimits = await getPlanRateLimits();
  const limit = planSlug
    ? (planLimits[planSlug] ?? planLimits.free ?? 100)
    : EDGE_SESSION_LIMIT;
  const limiter = getUserLimiter(limit);
  const result = await limiter.limit(userId);
  return {
    allowed: result.success,
    remaining: result.remaining,
    limit: result.limit,
    reset: result.reset,
    layer: 'user',
  };
}

/**
 * Check auth endpoint rate limit (Layer 3 — auth-specific).
 * Applied to /auth/* and /api/auth/* routes.
 */
export async function checkAuthRateLimit(ip: string): Promise<RateLimitResult> {
  const limiter = getAuthLimiter();
  const result = await limiter.limit(ip);
  return {
    allowed: result.success,
    remaining: result.remaining,
    limit: result.limit,
    reset: result.reset,
    layer: 'auth',
  };
}

/**
 * Check API key rate limit (B2B layer).
 * Applied to /api/v1/* routes with Bearer token.
 */
export async function checkApiKeyRateLimit(keyId: string): Promise<RateLimitResult> {
  const limiter = getApiKeyLimiter();
  const result = await limiter.limit(keyId);
  return {
    allowed: result.success,
    remaining: result.remaining,
    limit: result.limit,
    reset: result.reset,
    layer: 'apikey',
  };
}

/**
 * Build rate-limit response headers.
 * Includes Retry-After (seconds) per RFC 6585 §4.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.reset),
    'X-RateLimit-Layer': result.layer,
    'Retry-After': String(retryAfter),
  };
}
