/**
 * Audit Log API Routes
 * GET /api/admin/audit
 * 
 * Real database implementation using Drizzle ORM
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, activityLogs, users, roles, userRoles, eq, and, sql, desc, asc } from '@hsafx/db';

export async function GET(request: NextRequest) {
  try {
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

    // Query audit logs with user info
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

    // Enrich logs with user role info
    const enrichedLogs = await Promise.all(
      logResults.map(async (log) => {
        let adminRole = 'user';

        // Get user's role if available
        if (log.userId) {
          const userRoleData = await db
            .select({ roleName: roles.name })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .where(eq(userRoles.userId, log.userId))
            .limit(1);

          if (userRoleData.length > 0) {
            adminRole = userRoleData[0].roleName;
          }
        }

        // Parse metadata if it's a string
        const metadata = typeof log.metadata === 'string' 
          ? JSON.parse(log.metadata) 
          : (log.metadata || {});

        return {
          id: log.id,
          adminId: log.userId,
          adminEmail: log.userEmail || 'system',
          adminRole,
          action: log.action,
          targetType: log.resource,
          targetId: log.resourceId,
          details: metadata,
          ip: log.ipAddress,
          createdAt: log.createdAt?.toISOString(),
        };
      })
    );

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
    console.error('Failed to fetch audit logs:', error);
    return NextResponse.json(
      { code: 'FETCH_ERROR', message: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
