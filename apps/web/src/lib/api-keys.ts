/**
 * API Key Infrastructure
 * Reference: 25_API_AUTHENTICATION_GUIDE.md
 *
 * Key format:  hsafx_{env}_{52 random alphanumeric chars}
 * Storage:     SHA-256 hash in `apiKeys.keyHash` — plaintext NEVER stored
 * Prefix:      first 14 chars kept in `apiKeys.keyPrefix` for dashboard display
 * Rotation:    POST /api/v1/keys/rotate — 24h grace period on old key
 */

import { createHash, randomBytes } from 'crypto';

// ─── Constants ─────────────────────────────────────────────────
const KEY_RANDOM_LENGTH = 52; // chars in the random section
const KEY_PREFIX_DISPLAY_LENGTH = 14; // "hsafx_live_Abc" shown in UI
const VALID_KEY_REGEX = /^hsafx_(live|test)_[A-Za-z0-9]{52}$/;

// ─── Types ─────────────────────────────────────────────────────

export type ApiKeyScope =
  | 'tools:read'
  | 'tools:execute'
  | 'billing:read'
  | 'billing:write'
  | 'admin:*';

export interface GeneratedApiKey {
  /** Full plaintext key — shown once, then discarded */
  plaintext: string;
  /** SHA-256 hex hash stored in DB */
  hash: string;
  /** Display prefix (e.g. "hsafx_live_Abc") */
  prefix: string;
}

export interface ApiKeyValidationResult {
  valid: boolean;
  hash?: string;
  prefix?: string;
  environment?: 'live' | 'test';
  error?: string;
}

/** Rate limit tiers aligned with plan names (guest/free/pro/advance) */
export const RATE_LIMIT_TIERS = {
  free: { requestsPerHour: 100, requestsPerDay: 2_000, burstPerMinute: 10 },
  pro: { requestsPerHour: 1_000, requestsPerDay: 20_000, burstPerMinute: 50 },
  advance: { requestsPerHour: 5_000, requestsPerDay: 100_000, burstPerMinute: 200 },
} as const;

export type RateLimitTier = keyof typeof RATE_LIMIT_TIERS;

// ─── Key Generation ────────────────────────────────────────────

/**
 * Determine the environment tag used in key format.
 * `live` in production, `test` otherwise.
 */
function getEnvTag(): 'live' | 'test' {
  return process.env.NODE_ENV === 'production' ? 'live' : 'test';
}

/**
 * Generate a cryptographically-secure random alphanumeric string of `len` chars.
 */
function randomAlphanumeric(len: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const maxValid = 256 - (256 % chars.length); // 252 — reject >= 252 to avoid bias
  let result = '';
  while (result.length < len) {
    const bytes = randomBytes(len - result.length + 16); // over-sample to minimize loops
    for (let i = 0; i < bytes.length && result.length < len; i++) {
      if (bytes[i]! < maxValid) {
        result += chars[bytes[i]! % chars.length];
      }
    }
  }
  return result;
}

/**
 * Generate a new API key.
 *
 * @returns `{ plaintext, hash, prefix }` — caller must show `plaintext` once
 *          and store `hash` + `prefix` in the `apiKeys` DB table.
 */
export function generateApiKey(): GeneratedApiKey {
  const env = getEnvTag();
  const random = randomAlphanumeric(KEY_RANDOM_LENGTH);
  const plaintext = `hsafx_${env}_${random}`;
  const hash = hashApiKey(plaintext);
  const prefix = plaintext.slice(0, KEY_PREFIX_DISPLAY_LENGTH);
  return { plaintext, hash, prefix };
}

// ─── Hashing ───────────────────────────────────────────────────

/**
 * Compute the SHA-256 hex digest used for DB lookup.
 */
export function hashApiKey(plaintext: string): string {
  return createHash('sha256').update(plaintext).digest('hex');
}

// ─── Validation ────────────────────────────────────────────────

/**
 * Validate key format and extract components without a DB round-trip.
 */
export function validateApiKeyFormat(key: string): ApiKeyValidationResult {
  if (!key || typeof key !== 'string') {
    return { valid: false, error: 'Missing API key' };
  }

  if (!VALID_KEY_REGEX.test(key)) {
    return { valid: false, error: 'Invalid API key format' };
  }

  const env = key.startsWith('hsafx_live_') ? 'live' : 'test';
  const hash = hashApiKey(key);
  const prefix = key.slice(0, KEY_PREFIX_DISPLAY_LENGTH);

  return { valid: true, hash, prefix, environment: env };
}

// ─── Scope Helpers ─────────────────────────────────────────────

/**
 * Default scope set assigned to newly-created keys.
 */
export const DEFAULT_SCOPES: ApiKeyScope[] = ['tools:read', 'tools:execute'];

/**
 * Check whether a list of granted scopes satisfies a required scope.
 * `admin:*` is a wildcard that implies all other scopes.
 */
export function hasScope(
  grantedScopes: ApiKeyScope[],
  requiredScope: ApiKeyScope,
): boolean {
  if (grantedScopes.includes('admin:*')) return true;
  return grantedScopes.includes(requiredScope);
}

/**
 * Parse the scopes stored in the `apiKeys.metadata.scopes` JSON field.
 * Falls back to DEFAULT_SCOPES if missing or malformed.
 */
export function parseScopesFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): ApiKeyScope[] {
  if (!metadata || !Array.isArray(metadata.scopes)) return [...DEFAULT_SCOPES];
  return metadata.scopes.filter(
    (s: unknown): s is ApiKeyScope =>
      typeof s === 'string' &&
      ['tools:read', 'tools:execute', 'billing:read', 'billing:write', 'admin:*'].includes(
        s as string,
      ),
  );
}

// ─── Header Extraction ────────────────────────────────────────

/**
 * Extract the raw API key from an incoming request.
 * Checks:
 *   1. `Authorization: Bearer hsafx_…`
 *   2. `X-HSAFX-API-Key: hsafx_…`
 *
 * Returns `null` if no key is present.
 */
export function extractApiKeyFromHeaders(headers: Headers): string | null {
  // 1. Bearer token
  const authHeader = headers.get('authorization');
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match?.[1]) return match[1];
  }

  // 2. Custom header
  const customHeader = headers.get('x-hsafx-api-key');
  if (customHeader) return customHeader;

  return null;
}

// ─── Rate-limit tier mapping ──────────────────────────────────

/**
 * Map a plan name (`free`, `pro`, `advance`) to a rate-limit tier.
 */
export function planToRateLimitTier(planName: string): RateLimitTier {
  switch (planName.toLowerCase()) {
    case 'advance':
      return 'advance';
    case 'pro':
      return 'pro';
    default:
      return 'free';
  }
}
