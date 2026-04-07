/**
 * Admin Role Authorization Helper
 *
 * Verifies that the current request is from an authenticated user
 * with an admin role. Returns the session + role or a 401/403 response.
 */

import { NextResponse } from 'next/server';
import { adminErrorResponse } from '@/lib/admin-response';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db, roles, userRoles, eq } from '@hsafx/db';
import type { AdminRole, Permission } from '@/lib/types';
import { hasPermission } from '@/lib/permissions';

/** Roles that grant admin panel access */
const ADMIN_ROLES = new Set<string>([
  'super_admin', 'admin', 'support', 'developer', 'analyst', 'billing', 'moderator',
]);

const ROLE_MAP: Record<string, AdminRole> = {
  super_admin: 'super_admin',
  admin: 'admin',
  support: 'support',
  developer: 'developer',
  analyst: 'analyst',
  billing: 'billing',
  moderator: 'support',
};

const ROLE_PRIORITY: AdminRole[] = [
  'super_admin', 'admin', 'developer', 'support', 'analyst', 'billing',
];

export interface AdminAuth {
  userId: string;
  email: string;
  role: AdminRole;
}

/**
 * Verify the caller has a valid session AND an admin role.
 * Optionally checks a granular permission against the role's permission set.
 * Returns AdminAuth on success; returns NextResponse (401/403) on failure.
 * Use `instanceof NextResponse` to narrow.
 */
export async function requireAdminRole(permission?: Permission): Promise<AdminAuth | NextResponse> {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user) {
    return adminErrorResponse('UNAUTHORIZED', 'Authentication required', 401);
  }

  const userRoleRows = await db
    .select({ roleName: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, session.user.id));

  const adminRoleNames = userRoleRows
    .map((r) => r.roleName)
    .filter((name) => ADMIN_ROLES.has(name));

  if (adminRoleNames.length === 0) {
    return adminErrorResponse('FORBIDDEN', 'No admin role assigned', 403);
  }

  const mappedRoles = adminRoleNames.map((n) => ROLE_MAP[n] ?? 'support');
  const role = ROLE_PRIORITY.find((r) => mappedRoles.includes(r)) ?? 'support';

  if (permission && !hasPermission(role, permission)) {
    return adminErrorResponse('FORBIDDEN', 'Insufficient permissions', 403);
  }

  return { userId: session.user.id, email: session.user.email, role };
}
