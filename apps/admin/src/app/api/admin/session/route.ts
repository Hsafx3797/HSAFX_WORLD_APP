/**
 * Admin Session API Route
 * GET /api/admin/session
 *
 * Returns the current admin session with role information.
 * The RBAC provider fetches this endpoint on load.
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db, users, roles, userRoles, eq, and, sql } from '@hsafx/db';
import type { AdminRole, AdminSession } from '@/lib/types';
import { createHmac } from 'crypto';

/** Map DB role names → admin panel roles. Extend as roles are seeded. */
const ADMIN_ROLE_MAP: Record<string, AdminRole> = {
  super_admin: 'super_admin',
  admin: 'admin',
  support: 'support',
  developer: 'developer',
  analyst: 'analyst',
  billing: 'billing',
  // Fallback aliases for pre-existing DB roles
  moderator: 'support',
};

/** Roles that grant admin panel access (in priority order) */
const ADMIN_ROLES = new Set<string>([
  'super_admin', 'admin', 'support', 'developer', 'analyst', 'billing', 'moderator',
]);

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return NextResponse.json({ session: null }, { status: 401 });
    }

    // Look up user's roles from the DB
    const userRoleRows = await db
      .select({ roleName: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, session.user.id));

    // Find the highest-priority admin role
    const adminRoleNames = userRoleRows
      .map((r) => r.roleName)
      .filter((name) => ADMIN_ROLES.has(name));

    if (adminRoleNames.length === 0) {
      return NextResponse.json(
        { session: null, error: 'No admin role assigned' },
        { status: 403 }
      );
    }

    // Priority: super_admin > admin > developer > support > analyst > billing
    const priority: AdminRole[] = ['super_admin', 'admin', 'developer', 'support', 'analyst', 'billing'];
    const mappedRoles = adminRoleNames.map((n) => ADMIN_ROLE_MAP[n] ?? 'support');
    const role = priority.find((r) => mappedRoles.includes(r)) ?? 'support';

    // Check if 2FA is enabled for this admin
    let twoFactorEnabled = false;
    try {
      const totpRows = await db.execute(
        sql`SELECT is_enabled FROM admin_totp_secrets WHERE user_id = ${session.user.id}`
      );
      const totpRow = (totpRows as unknown as { rows: { is_enabled: boolean }[] }).rows?.[0];
      twoFactorEnabled = totpRow?.is_enabled ?? false;
    } catch {
      // Table may not exist yet — that's fine, treat as disabled
    }

    // Check per-session 2FA verification via signed cookie
    let twoFactorVerified = false;
    if (twoFactorEnabled) {
      const cookieValue = request.cookies.get('admin_2fa_session')?.value;
      if (cookieValue) {
        const secret = process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET || '';
        const parts = cookieValue.split(':');
        if (parts.length === 3) {
          const [tokenUserId, timestamp, sig] = parts;
          const payload = `${tokenUserId}:${timestamp}`;
          const expectedSig = createHmac('sha256', secret).update(payload).digest('hex');
          if (sig === expectedSig && tokenUserId === session.user.id) {
            const age = Date.now() - parseInt(timestamp, 10);
            if (!isNaN(age) && age < 24 * 60 * 60 * 1000) {
              twoFactorVerified = true;
            }
          }
        }
      }
    } else {
      // No 2FA set up — treat as verified (no challenge needed)
      twoFactorVerified = true;
    }

    const adminSession: AdminSession & { twoFactorEnabled: boolean } = {
      adminId: session.user.id,
      email: session.user.email,
      name: (session.user as any).name ?? session.user.email.split('@')[0],
      role,
      twoFactorEnabled,
      twoFactorVerified,
      expiresAt: session.session.expiresAt
        ? new Date(session.session.expiresAt).toISOString()
        : new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
    };

    return NextResponse.json({ session: adminSession });
  } catch (error) {
    console.error('[Admin Session] Error:', error);
    return NextResponse.json({ session: null, error: 'Internal error' }, { status: 500 });
  }
}
