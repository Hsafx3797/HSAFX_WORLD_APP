/**
 * Audit Log API Routes
 * GET /api/admin/audit
 * 
 * Real database implementation using Drizzle ORM
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, activityLogs, users, eq, and, sql, desc, asc } from '@hsafx/db';
import { createLogger } from '@hsafx/shared/logger';
import { requireAdminRole } from '@/lib/require-admin';

const log = createLogger('admin-audit');

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminRole();
    if (authResult instanceof NextResponse) return authResult;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const action = searchParams.get('action');
    const adminId = searchParams.get('adminId');
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    if (action) {
      conditions.push(eq(activityLogs.action, action));
    }

    if (adminId) {
      conditions.push(eq(activityLogs.userId, adminId));
    }

    // Build where clause
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Subquery for user role — eliminates N+1
    const roleSubquery = sql<string>`COALESCE((
      SELECT r.name FROM user_roles ur
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ${activityLogs.userId}
      LIMIT 1
    ), 'user')`;

    // Query audit logs with user info and role — single query
    const logsQuery = db
      .select({
        id: activityLogs.id,
        userId: activityLogs.userId,
        userEmail: users.email,
        action: activityLogs.action,
        resource: activityLogs.resource,
        resourceId: activityLogs.resourceId,
        metadata: activityLogs.metadata,
        ipAddress: activityLogs.ipAddress,
        userAgent: activityLogs.userAgent,
        createdAt: activityLogs.createdAt,
        adminRole: roleSubquery,
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .where(whereClause)
      .orderBy(
        sortOrder === 'desc'
          ? desc(activityLogs.createdAt)
          : asc(activityLogs.createdAt)
      )
      .limit(limit)
      .offset(offset);

    // Get total count
    const countQuery = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(activityLogs)
      .where(whereClause);

    // Execute queries in parallel
    const [logResults, countResults] = await Promise.all([logsQuery, countQuery]);

    // Map results — no N+1 enrichment needed
    const enrichedLogs = logResults.map((logEntry) => {
      const metadata = typeof logEntry.metadata === 'string' 
        ? JSON.parse(logEntry.metadata) 
        : (logEntry.metadata || {});

      return {
        id: logEntry.id,
        adminId: logEntry.userId,
        adminEmail: logEntry.userEmail || 'system',
        adminRole: logEntry.adminRole,
        action: logEntry.action,
        targetType: logEntry.resource,
        targetId: logEntry.resourceId,
        details: metadata,
        ip: logEntry.ipAddress,
        createdAt: logEntry.createdAt?.toISOString(),
      };
    });

    const total = countResults[0]?.count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: enrichedLogs,
      page,
      limit,
      total,
      totalPages,
    });
  } catch (error) {
    log.error('Failed to fetch audit logs', { error: String(error) });
    return NextResponse.json(
      { code: 'FETCH_ERROR', message: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
