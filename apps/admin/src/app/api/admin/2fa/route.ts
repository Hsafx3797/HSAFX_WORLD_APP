/**
 * Admin 2FA TOTP API Routes
 * POST /api/admin/2fa - Multiple actions: setup, enable, verify, disable
 * 
 * Stores TOTP secrets in admin_totp_secrets table (auto-created on first use).
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@hsafx/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import { createLogger } from '@hsafx/shared/logger';

const log = createLogger('admin-2fa');

// Ensure the admin_totp_secrets table exists
let tableEnsured = false;
async function ensureTable() {
  if (tableEnsured) return;
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS admin_totp_secrets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      secret TEXT NOT NULL,
      is_enabled BOOLEAN NOT NULL DEFAULT false,
      verified_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  tableEnsured = true;
}

async function getAdminUserId(): Promise<string | null> {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  return session?.user?.id ?? null;
}

/**
 * POST /api/admin/2fa
 * Body: { action: 'setup' | 'enable' | 'verify' | 'disable', code?: string }
 */
export async function POST(request: NextRequest) {
  try {
    await ensureTable();
    const userId = await getAdminUserId();
    if (!userId) {
      return NextResponse.json({ code: 'UNAUTHORIZED', message: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { action, code } = body;

    switch (action) {
      case 'setup': {
        // Generate a new TOTP secret
        const secret = new OTPAuth.Secret({ size: 20 });
        const totp = new OTPAuth.TOTP({
          issuer: 'HSAFX Admin',
          label: 'admin',
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
          secret,
        });

        // Upsert the secret (not yet enabled)
        await db.execute(sql`
          INSERT INTO admin_totp_secrets (user_id, secret, is_enabled)
          VALUES (${userId}, ${secret.base32}, false)
          ON CONFLICT (user_id) DO UPDATE SET secret = ${secret.base32}, is_enabled = false, verified_at = NULL
        `);

        const otpauthUrl = totp.toString();
        const qrDataUrl = await QRCode.toDataURL(otpauthUrl, { width: 256, margin: 2 });

        return NextResponse.json({
          secret: secret.base32,
          otpauthUrl,
          qrDataUrl,
        });
      }

      case 'enable': {
        // Verify the code and enable 2FA
        if (!code || typeof code !== 'string' || code.length !== 6) {
          return NextResponse.json({ code: 'INVALID_CODE', message: 'A 6-digit code is required' }, { status: 400 });
        }

        const rows = await db.execute(
          sql`SELECT secret FROM admin_totp_secrets WHERE user_id = ${userId}`
        );
        const row = (rows as unknown as { rows: { secret: string }[] }).rows?.[0];
        if (!row?.secret) {
          return NextResponse.json({ code: 'NO_SECRET', message: 'Run setup first' }, { status: 400 });
        }

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
          return NextResponse.json({ code: 'INVALID_CODE', message: 'Incorrect code. Please try again.' }, { status: 400 });
        }

        await db.execute(sql`
          UPDATE admin_totp_secrets SET is_enabled = true, verified_at = NOW() WHERE user_id = ${userId}
        `);

        return NextResponse.json({ enabled: true });
      }

      case 'verify': {
        // Verify a TOTP code for a destructive operation (per-action verification)
        if (!code || typeof code !== 'string' || code.length !== 6) {
          return NextResponse.json({ code: 'INVALID_CODE', message: 'A 6-digit code is required' }, { status: 400 });
        }

        const rows = await db.execute(
          sql`SELECT secret, is_enabled FROM admin_totp_secrets WHERE user_id = ${userId}`
        );
        const row = (rows as unknown as { rows: { secret: string; is_enabled: boolean }[] }).rows?.[0];
        if (!row?.secret || !row.is_enabled) {
          return NextResponse.json({ code: 'NOT_ENABLED', message: '2FA is not enabled' }, { status: 400 });
        }

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
          return NextResponse.json({ code: 'INVALID_CODE', message: 'Incorrect code. Please try again.' }, { status: 400 });
        }

        return NextResponse.json({ verified: true });
      }

      case 'disable': {
        // Disable 2FA (requires valid code)
        if (!code || typeof code !== 'string' || code.length !== 6) {
          return NextResponse.json({ code: 'INVALID_CODE', message: 'A 6-digit code is required' }, { status: 400 });
        }

        const rows = await db.execute(
          sql`SELECT secret, is_enabled FROM admin_totp_secrets WHERE user_id = ${userId}`
        );
        const row = (rows as unknown as { rows: { secret: string; is_enabled: boolean }[] }).rows?.[0];
        if (!row?.secret || !row.is_enabled) {
          return NextResponse.json({ code: 'NOT_ENABLED', message: '2FA is not enabled' }, { status: 400 });
        }

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
          return NextResponse.json({ code: 'INVALID_CODE', message: 'Incorrect code. Please try again.' }, { status: 400 });
        }

        await db.execute(sql`DELETE FROM admin_totp_secrets WHERE user_id = ${userId}`);
        return NextResponse.json({ disabled: true });
      }

      case 'status': {
        // Check if 2FA is enabled for the current user
        const rows = await db.execute(
          sql`SELECT is_enabled FROM admin_totp_secrets WHERE user_id = ${userId}`
        );
        const row = (rows as unknown as { rows: { is_enabled: boolean }[] }).rows?.[0];
        return NextResponse.json({ enabled: row?.is_enabled ?? false });
      }

      default:
        return NextResponse.json(
          { code: 'INVALID_ACTION', message: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    log.error('2FA API error', { error: String(error) });
    return NextResponse.json(
      { code: 'INTERNAL', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
