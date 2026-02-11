/**
 * Redis configuration and helpers
 * Reference: 46_REDIS_KEY_SCHEMA.md
 *
 * Provider: Upstash Redis (serverless)
 * Key pattern: {env}:{category}:{scope}:{identifier}
 * Rule: Every key MUST have a TTL — no eternal keys.
 */

import { Redis } from '@upstash/redis';

// ─── Singleton ─────────────────────────────────────────────────

let _redis: Redis | undefined;

export function getRedis(): Redis {
  if (!_redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      throw new Error(
        'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required',
      );
    }
    _redis = new Redis({ url, token });
  }
  return _redis;
}

/** Convenience alias (lazy, same instance) */
export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    const instance = getRedis();
    const value = instance[prop as keyof typeof instance];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});

// ─── Environment prefix ───────────────────────────────────────

const ENV_PREFIX_MAP: Record<string, string> = {
  development: 'dev',
  staging: 'staging',
  production: 'prod',
  test: 'test',
};

/**
 * Returns the env prefix for Redis keys (e.g. `dev:`, `prod:`).
 * Always includes trailing colon.
 */
export function getEnvPrefix(): string {
  const env = process.env.NODE_ENV ?? 'development';
  const prefix = ENV_PREFIX_MAP[env] ?? 'dev';
  return `${prefix}:`;
}

// ─── Key builders ─────────────────────────────────────────────

/**
 * Build a namespaced Redis key.
 *
 * @example key('ratelimit', 'user', userId, toolId)
 *   → "prod:ratelimit:user:user_123:tool_001"
 */
export function key(...parts: string[]): string {
  return `${getEnvPrefix()}${parts.join(':')}`;
}

// Pre-defined key builders for each domain

export const keys = {
  // Rate limiting
  rateLimit: {
    user: (userId: string) => key('ratelimit', 'user', userId),
    ip: (ipHash: string) => key('ratelimit', 'ip', ipHash),
    apiKey: (keyId: string) => key('ratelimit', 'apikey', keyId),
    apiKeyHourly: (keyId: string) => key('ratelimit', 'apikey', keyId, 'hourly'),
    apiKeyDaily: (keyId: string) => key('ratelimit', 'apikey', keyId, 'daily'),
    apiKeyBurst: (keyId: string) => key('ratelimit', 'apikey', keyId, 'burst'),
    global: (userId: string) => key('ratelimit', 'api', userId),
  },

  // Jobs
  job: {
    state: (jobId: string) => key('job', jobId),
    result: (jobId: string) => key('job', jobId, 'result'),
    progress: (jobId: string) => key('job', jobId, 'progress'),
  },

  // Caching
  cache: {
    tool: (toolId: string, inputHash: string) =>
      key('cache', 'tool', toolId, inputHash),
    api: (endpoint: string, paramsHash: string) =>
      key('cache', 'api', endpoint, paramsHash),
    user: (userId: string, dataType: string) =>
      key('cache', 'user', userId, dataType),
  },

  // Sessions
  session: (token: string) => key('session', token),

  // Anonymous tracking
  anon: {
    baCount: (ipHash: string) => key('temp', 'anon', ipHash, 'ba_count'),
    lastTool: (ipHash: string) => key('temp', 'anon', ipHash, 'last_tool'),
  },

  // Idempotency
  idempotency: (idempotencyKey: string) =>
    key('idempotency', idempotencyKey),
} as const;

// ─── TTL constants (seconds) ──────────────────────────────────

export const TTL = {
  JOB_STATE: 72 * 60 * 60, // 72 hours
  JOB_RESULT: 24 * 60 * 60, // 24 hours
  JOB_PROGRESS: 60 * 60, // 1 hour
  TOOL_CACHE: 24 * 60 * 60, // 24 hours
  API_CACHE_SHORT: 60 * 60, // 1 hour (metadata)
  API_CACHE_LONG: 24 * 60 * 60, // 24 hours (plans)
  USER_CACHE: 60 * 60, // 1 hour
  SESSION: 7 * 24 * 60 * 60, // 7 days
  ANON_TRACKING: 24 * 60 * 60, // 24 hours
  AD_VIEW: 60 * 60, // 1 hour
  IDEMPOTENCY: 24 * 60 * 60, // 24 hours
  RATE_LIMIT_BURST: 60, // 1 minute
  RATE_LIMIT_HOURLY: 60 * 60, // 1 hour
  RATE_LIMIT_DAILY: 24 * 60 * 60, // 24 hours
} as const;

// ─── IP hashing ───────────────────────────────────────────────

import { createHash } from 'crypto';

export function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

export function generateInputHash(input: unknown): string {
  const str = typeof input === 'string' ? input : JSON.stringify(input);
  return createHash('sha256').update(str).digest('hex').slice(0, 16);
}
