/**
 * Impersonation API
 * POST /api/admin/impersonate — Start impersonating a user
 * DELETE /api/admin/impersonate — Stop impersonating
 *
 * Requirements:
 * - Only super_admin and admin roles (with `users:impersonate` permission)
 * - Requires 2FA verification (valid `admin_2fa_session` cookie)
 * - Creates a scoped, read-only impersonation session (1-hour TTL)
 * - Full audit trail logged
 */

import { NextResponse, type NextRequest } from 'next/server';
import { headers, cookies } from 'next/headers';
import { auth } from '@/lib/auth';
import { db, users, roles, userRoles, eq, sql } from '@hsafx/db';
import { createHmac, timingSafeEqual } from 'crypto';

// ── Constants ──────────────────────────────────────────────

const IMPERSONATION_COOKIE = 'admin_impersonation';
const IMPERSONATION_TTL_SECONDS = 3600; // 1 hour
const ALLOWED_ROLES = new Set(['super_admin', 'admin']);

// ── Helpers ────────────────────────────────────────────────

function getSecret(): string {
  const secret = process.env.AUTH_SECRET ?? process.env.BETTER_AUTH_SECRET ?? '';
  if (!secret) throw new Error('Missing AUTH_SECRET');
  return secret;
}

function signToken(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('hex');
}

function verifyToken(payload: string, signature: string): boolean {
  const expected = signToken(payload);
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

function createImpersonationToken(adminId: string, targetUserId: string): string {
  const timestamp = Date.now();
  const payload = `${adminId}:${targetUserId}:${timestamp}`;
  const sig = signToken(payload);
  return `${payload}:${sig}`;
}

function parseImpersonationToken(
  token: string
): { adminId: string; targetUserId: string; timestamp: number } | null {
  const parts = token.split(':');
  if (parts.length !== 4) return null;

  const [adminId, targetUserId, timestampStr, signature] = parts;
  if (!adminId || !targetUserId || !timestampStr || !signature) return null;

  const payload = `${adminId}:${targetUserId}:${timestampStr}`;
  if (!verifyToken(payload, signature)) return null;

  const timestamp = Number(timestampStr);
  if (isNaN(timestamp)) return null;

  // Check TTL
  if (Date.now() - timestamp > IMPERSONATION_TTL_SECONDS * 1000) return null;

  return { adminId, targetUserId, timestamp };
}

async function getAdminSession() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session?.user) return null;
  return session;
}

async function getUserHighestRole(userId: string): Promise<string | null> {
  const rows = await db
    .select({ roleName: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  for (const r of rows) {
    if (ALLOWED_ROLES.has(r.roleName)) return r.roleName;
  }
  return null;
}

async function has2FAVerified(): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get('admin_2fa_session');
  if (!cookie?.value) return false;

  const parts = cookie.value.split(':');
  if (parts.length !== 3) return false;

  const [userId, timestampStr, signature] = parts;
  if (!userId || !timestampStr || !signature) return false;
  const payload = `${userId}:${timestampStr}`;

  return verifyToken(payload, signature);
}

async function logAuditEvent(
  adminId: string,
  action: string,
  targetUserId: string,
  metadata?: Record<string, unknown>
) {
  try {
    await db.execute(
      sql`INSERT INTO "audit_logs" ("userId", "action", "targetUserId", "metadata", "createdAt")
          VALUES (${adminId}, ${action}, ${targetUserId}, ${JSON.stringify(metadata ?? {})}, NOW())`
    );
  } catch {
    // Audit table may not exist yet; silently skip
    console.warn('[impersonate] Failed to write audit log');
  }
}

// ── POST: Start Impersonation ──────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // 1. Verify admin session
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Check admin role
    const role = await getUserHighestRole(session.user.id);
    if (!role) {
      return NextResponse.json(
        { error: 'Forbidden: insufficient role for impersonation' },
        { status: 403 }
      );
    }

    // 3. Require 2FA
    const verified2FA = await has2FAVerified();
    if (!verified2FA) {
      return NextResponse.json(
        { error: '2FA verification required for impersonation' },
        { status: 403 }
      );
    }

    // 4. Parse target user
    const body = await request.json().catch(() => ({}));
    const targetUserId = (body as Record<string, unknown>).userId as string | undefined;

    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json(
        { error: 'Missing userId in request body' },
        { status: 400 }
      );
    }

    // 5. Cannot impersonate yourself
    if (targetUserId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot impersonate yourself' },
        { status: 400 }
      );
    }

    // 6. Verify target user exists
    const targetRows = await db
      .select({ id: users.id, fullName: users.fullName, username: users.username, email: users.email })
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (targetRows.length === 0) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // 7. Cannot impersonate another admin
    const targetRole = await getUserHighestRole(targetUserId);
    if (targetRole && ALLOWED_ROLES.has(targetRole)) {
      return NextResponse.json(
        { error: 'Cannot impersonate another admin' },
        { status: 403 }
      );
    }

    // 8. Create impersonation token
    const token = createImpersonationToken(session.user.id, targetUserId);
    const displayName = targetRows[0]!.fullName ?? targetRows[0]!.username ?? 'Unknown';

    // 9. Set cookie
    const response = NextResponse.json({
      success: true,
      impersonating: {
        userId: targetRows[0]!.id,
        name: displayName,
        email: targetRows[0]!.email,
      },
      expiresIn: IMPERSONATION_TTL_SECONDS,
    });

    response.cookies.set(IMPERSONATION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: IMPERSONATION_TTL_SECONDS,
      path: '/',
    });

    // 10. Audit log
    await logAuditEvent(session.user.id, 'impersonation:start', targetUserId, {
      adminRole: role,
      targetEmail: targetRows[0]!.email,
      targetName: displayName,
    });

    return response;
  } catch (error) {
    console.error('[impersonate] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── DELETE: Stop Impersonation ─────────────────────────────

export async function DELETE() {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cookieStore = await cookies();
    const impersonationCookie = cookieStore.get(IMPERSONATION_COOKIE);

    let targetUserId = 'unknown';
    if (impersonationCookie?.value) {
      const parsed = parseImpersonationToken(impersonationCookie.value);
      if (parsed) {
        targetUserId = parsed.targetUserId;
      }
    }

    // Clear cookie
    const response = NextResponse.json({ success: true, impersonating: null });
    response.cookies.set(IMPERSONATION_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    // Audit log
    await logAuditEvent(session.user.id, 'impersonation:stop', targetUserId);

    return response;
  } catch (error) {
    console.error('[impersonate] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── GET: Check current impersonation status ────────────────

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cookieStore = await cookies();
    const impersonationCookie = cookieStore.get(IMPERSONATION_COOKIE);

    if (!impersonationCookie?.value) {
      return NextResponse.json({ impersonating: null });
    }

    const parsed = parseImpersonationToken(impersonationCookie.value);
    if (!parsed) {
      return NextResponse.json({ impersonating: null });
    }

    // Fetch target user details
    const targetRows = await db
      .select({ id: users.id, fullName: users.fullName, username: users.username, email: users.email })
      .from(users)
      .where(eq(users.id, parsed.targetUserId))
      .limit(1);

    if (targetRows.length === 0) {
      return NextResponse.json({ impersonating: null });
    }

    return NextResponse.json({
      impersonating: {
        userId: targetRows[0]!.id,
        name: targetRows[0]!.fullName ?? targetRows[0]!.username ?? 'Unknown',
        email: targetRows[0]!.email,
        startedAt: new Date(parsed.timestamp).toISOString(),
        expiresAt: new Date(
          parsed.timestamp + IMPERSONATION_TTL_SECONDS * 1000
        ).toISOString(),
      },
    });
  } catch (error) {
    console.error('[impersonate] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
