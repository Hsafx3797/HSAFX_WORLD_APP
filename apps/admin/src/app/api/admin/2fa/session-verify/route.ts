/**
 * 2FA Session Verification API
 * POST /api/admin/2fa/session-verify
 *
 * Called after password login for users with 2FA enabled.
 * Validates a TOTP code and sets an HTTP-only signed cookie
 * (`admin_2fa_session`) that proves the user verified 2FA for
 * this browser session.
 *
 * GET /api/admin/2fa/session-verify
 * Returns whether the current session has 2FA verified.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@hsafx/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import * as OTPAuth from 'otpauth';
import { createHmac, randomBytes } from 'crypto';

/** Cookie name for per-session 2FA verification */
const COOKIE_NAME = 'admin_2fa_session';

/** Cookie max-age: 24 hours (matches admin session TTL) */
const COOKIE_MAX_AGE = 60 * 60 * 24;

/**
 * Create a signed token: `userId:timestamp:signature`
 * The signature prevents tampering. Only valid for the same AUTH_SECRET.
 */
function signToken(userId: string): string {
  const secret = process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET || '';
  const timestamp = Date.now().toString();
  const payload = `${userId}:${timestamp}`;
  const sig = createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}:${sig}`;
}

/**
 * Verify a signed token. Returns the userId if valid, null otherwise.
 */
function verifyToken(token: string): string | null {
  const secret = process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET || '';
  const parts = token.split(':');
  if (parts.length !== 3) return null;

  const [userId, timestamp, sig] = parts;
  if (!userId || !timestamp || !sig) return null;

  // Check signature
  const payload = `${userId}:${timestamp}`;
  const expectedSig = createHmac('sha256', secret).update(payload).digest('hex');
  if (sig !== expectedSig) return null;

  // Check expiry (24 hours)
  const age = Date.now() - parseInt(timestamp, 10);
  if (isNaN(age) || age > COOKIE_MAX_AGE * 1000) return null;

  return userId;
}

async function getSessionUserId(): Promise<string | null> {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  return session?.user?.id ?? null;
}

/**
 * POST — Verify TOTP code and set 2FA session cookie
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json(
        { code: 'UNAUTHORIZED', message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string' || code.length !== 6) {
      return NextResponse.json(
        { code: 'INVALID_CODE', message: 'A 6-digit code is required' },
        { status: 400 }
      );
    }

    // Look up TOTP secret
    const rows = await db.execute(
      sql`SELECT secret, is_enabled FROM admin_totp_secrets WHERE user_id = ${userId}`
    );
    const row = (rows as unknown as { rows: { secret: string; is_enabled: boolean }[] }).rows?.[0];
    if (!row?.secret || !row.is_enabled) {
      return NextResponse.json(
        { code: 'NOT_ENABLED', message: '2FA is not enabled for this account' },
        { status: 400 }
      );
    }

    // Validate TOTP
    const totp = new OTPAuth.TOTP({
      issuer: 'HSAFX Admin',
      label: 'admin',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(row.secret),
    });

    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) {
      return NextResponse.json(
        { code: 'INVALID_CODE', message: 'Incorrect code. Please try again.' },
        { status: 400 }
      );
    }

    // Create signed session cookie
    const token = signToken(userId);
    const response = NextResponse.json({ verified: true });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error('[2FA Session Verify] Error:', error);
    return NextResponse.json(
      { code: 'INTERNAL', message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET — Check if 2FA session is verified
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ verified: false }, { status: 401 });
    }

    // Check 2FA enabled
    let twoFactorEnabled = false;
    try {
      const rows = await db.execute(
        sql`SELECT is_enabled FROM admin_totp_secrets WHERE user_id = ${userId}`
      );
      const row = (rows as unknown as { rows: { is_enabled: boolean }[] }).rows?.[0];
      twoFactorEnabled = row?.is_enabled ?? false;
    } catch {
      // Table may not exist yet
    }

    if (!twoFactorEnabled) {
      return NextResponse.json({ verified: true, twoFactorEnabled: false });
    }

    // Check session cookie
    const cookie = request.cookies.get(COOKIE_NAME)?.value;
    if (!cookie) {
      return NextResponse.json({ verified: false, twoFactorEnabled: true });
    }

    const tokenUserId = verifyToken(cookie);
    const verified = tokenUserId === userId;

    return NextResponse.json({ verified, twoFactorEnabled: true });
  } catch (error) {
    console.error('[2FA Session Check] Error:', error);
    return NextResponse.json({ verified: false }, { status: 500 });
  }
}
