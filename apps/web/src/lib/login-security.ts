/**
 * Login Security — Progressive brute-force protection
 *
 * Key schema (per 46_REDIS_KEY_SCHEMA.md):
 *   {env}:login:fails:{ipHash}:{emailHash} → count (TTL 15min)
 *
 * Progression:
 *   1–5 failures  → normal login attempts
 *   6–10 failures → CAPTCHA required (hCaptcha)
 *   11+ failures  → 15-minute lockout
 *
 * Counter resets on successful login.
 */

import { redis, key, hashIp, TTL } from '@/lib/redis';
import { createHash } from 'crypto';

// ─── Constants ────────────────────────────────────────────────

const CAPTCHA_THRESHOLD = 5;
const LOCKOUT_THRESHOLD = 10;
const LOCKOUT_TTL = 15 * 60; // 15 minutes in seconds
const FAIL_COUNTER_TTL = 15 * 60; // 15 minutes — counter expires automatically

// ─── Helpers ──────────────────────────────────────────────────

function hashEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex').slice(0, 16);
}

function failKey(ipHash: string, emailHash: string): string {
  return key('login', 'fails', ipHash, emailHash);
}

function lockoutKey(ipHash: string, emailHash: string): string {
  return key('login', 'lockout', ipHash, emailHash);
}

// ─── Public API ───────────────────────────────────────────────

export type LoginCheckResult =
  | { allowed: true; requiresCaptcha: false }
  | { allowed: true; requiresCaptcha: true }
  | { allowed: false; retryAfterSeconds: number };

/**
 * Check if a login attempt is allowed for the given IP + email combo.
 * Call this BEFORE verifying the password.
 */
export async function checkLoginAttempt(
  ip: string,
  email: string,
): Promise<LoginCheckResult> {
  const ipH = hashIp(ip);
  const emailH = hashEmail(email);

  // Check hard lockout first
  const lockoutTtl = await redis.ttl(lockoutKey(ipH, emailH));
  if (lockoutTtl > 0) {
    return { allowed: false, retryAfterSeconds: lockoutTtl };
  }

  // Check failure count
  const failCount = await redis.get<number>(failKey(ipH, emailH));
  const count = failCount ?? 0;

  if (count >= LOCKOUT_THRESHOLD) {
    // Set hard lockout
    await redis.set(lockoutKey(ipH, emailH), '1', { ex: LOCKOUT_TTL });
    return { allowed: false, retryAfterSeconds: LOCKOUT_TTL };
  }

  if (count >= CAPTCHA_THRESHOLD) {
    return { allowed: true, requiresCaptcha: true };
  }

  return { allowed: true, requiresCaptcha: false };
}

/**
 * Record a failed login attempt. Increments the counter.
 * Call this AFTER password verification fails.
 */
export async function recordFailedLogin(
  ip: string,
  email: string,
): Promise<{ failCount: number; locked: boolean }> {
  const ipH = hashIp(ip);
  const emailH = hashEmail(email);
  const k = failKey(ipH, emailH);

  // Atomic increment
  const newCount = await redis.incr(k);

  // Set/refresh TTL on the counter
  await redis.expire(k, FAIL_COUNTER_TTL);

  const locked = newCount >= LOCKOUT_THRESHOLD;
  if (locked) {
    await redis.set(lockoutKey(ipH, emailH), '1', { ex: LOCKOUT_TTL });
  }

  return { failCount: newCount, locked };
}

/**
 * Reset the failure counter after a successful login.
 */
export async function resetLoginFailures(
  ip: string,
  email: string,
): Promise<void> {
  const ipH = hashIp(ip);
  const emailH = hashEmail(email);
  await redis.del(failKey(ipH, emailH));
  await redis.del(lockoutKey(ipH, emailH));
}

/**
 * Verify hCaptcha token server-side.
 * Returns true if valid.
 */
export async function verifyCaptcha(token: string): Promise<boolean> {
  const secret = process.env.HCAPTCHA_SECRET_KEY;
  if (!secret) {
    // If CAPTCHA not configured, skip verification in development
    if (process.env.NODE_ENV === 'development') return true;
    throw new Error('HCAPTCHA_SECRET_KEY is not configured');
  }

  try {
    const res = await fetch('https://api.hcaptcha.com/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    });

    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

/**
 * Get the current failure count for admin visibility.
 */
export async function getFailureCount(
  ip: string,
  email: string,
): Promise<{ count: number; ttl: number; locked: boolean }> {
  const ipH = hashIp(ip);
  const emailH = hashEmail(email);

  const [count, lockTtl, failTtl] = await Promise.all([
    redis.get<number>(failKey(ipH, emailH)),
    redis.ttl(lockoutKey(ipH, emailH)),
    redis.ttl(failKey(ipH, emailH)),
  ]);

  return {
    count: count ?? 0,
    ttl: Math.max(failTtl, 0),
    locked: lockTtl > 0,
  };
}
