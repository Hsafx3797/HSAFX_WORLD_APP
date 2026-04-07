/**
 * B2B Usage API Route (read-only)
 * GET /api/admin/b2b/usage — View usage stats with filters (userId, suiteId, period)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  db, b2bUsage, b2bSuites, users,
  eq, and, gte, lte, desc, sql,
} from '@hsafx/db';
import { requireAdminRole } from '@/lib/require-admin';
import { adminPaginatedResponse, adminErrorResponse } from '@/lib/admin-response';
import { createLogger } from '@hsafx/shared/logger';

const log = createLogger('admin-b2b-usage');

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminRole('subscriptions.view');
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const suiteId = searchParams.get('suiteId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Validate date params
    if (from && isNaN(Date.parse(from))) {
      return adminErrorResponse('VALIDATION', 'Invalid "from" date format', 400);
    }
    if (to && isNaN(Date.parse(to))) {
      return adminErrorResponse('VALIDATION', 'Invalid "to" date format', 400);
    }
    if (from && to && new Date(from) >= new Date(to)) {
      return adminErrorResponse('VALIDATION', '"from" must be before "to"', 400);
    }
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50));
    const offset = (page - 1) * limit;

    const conditions = [];
    if (userId) conditions.push(eq(b2bUsage.userId, userId));
    if (suiteId) conditions.push(eq(b2bUsage.b2bSuiteId, suiteId));
    if (from) conditions.push(gte(b2bUsage.periodStart, new Date(from)));
    if (to) conditions.push(lte(b2bUsage.periodEnd, new Date(to)));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, countResult] = await Promise.all([
      db
        .select({
          id: b2bUsage.id,
          userId: b2bUsage.userId,
          userEmail: users.email,
          userName: users.fullName,
          b2bSuiteId: b2bUsage.b2bSuiteId,
          suiteName: b2bSuites.name,
          suiteSlug: b2bSuites.slug,
          periodStart: b2bUsage.periodStart,
          periodEnd: b2bUsage.periodEnd,
          usageCount: b2bUsage.usageCount,
          createdAt: b2bUsage.createdAt,
          updatedAt: b2bUsage.updatedAt,
        })
        .from(b2bUsage)
        .innerJoin(users, eq(b2bUsage.userId, users.id))
        .innerJoin(b2bSuites, eq(b2bUsage.b2bSuiteId, b2bSuites.id))
        .where(whereClause)
        .orderBy(desc(b2bUsage.periodStart))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`COUNT(*)` }).from(b2bUsage).where(whereClause),
    ]);

    const total = countResult[0]?.count ?? 0;

    return adminPaginatedResponse(rows, { page, limit, total });
  } catch (error) {
    log.error('Failed to fetch B2B usage', { err: error });
    return adminErrorResponse('INTERNAL', 'Failed to fetch B2B usage');
  }
}
