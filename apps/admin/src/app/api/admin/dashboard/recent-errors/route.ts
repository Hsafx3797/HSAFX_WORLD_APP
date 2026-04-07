/**
 * Recent Errors API Route
 * GET /api/admin/dashboard/recent-errors
 * 
 * Real database implementation using Drizzle ORM
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, tools, toolExecutions, eq, and, sql, desc } from '@hsafx/db';
import { requireAdminRole } from '@/lib/require-admin';
import { createLogger } from '@hsafx/shared/logger';
import { adminResponse, adminErrorResponse } from '@/lib/admin-response';

const log = createLogger('admin-recent-errors');

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminRole('system.logs');
    if (authResult instanceof NextResponse) return authResult;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Query recent errors grouped by tool and error message
    const recentErrors = await db
      .select({
        toolId: tools.slug,
        toolName: tools.name,
        error: toolExecutions.errorMessage,
        count: sql<number>`COUNT(*)`.as('count'),
        lastOccurred: sql<Date>`MAX(${toolExecutions.createdAt})`.as('lastOccurred'),
      })
      .from(toolExecutions)
      .innerJoin(tools, eq(toolExecutions.toolId, tools.id))
      .where(
        and(
          eq(toolExecutions.status, 'failed'),
          sql`${toolExecutions.errorMessage} IS NOT NULL`
        )
      )
      .groupBy(tools.slug, tools.name, toolExecutions.errorMessage)
      .orderBy(desc(sql`MAX(${toolExecutions.createdAt})`))
      .limit(limit);

    // Determine severity based on error count
    const formatSeverity = (count: number): 'info' | 'warning' | 'error' => {
      if (count >= 50) return 'error';
      if (count >= 10) return 'warning';
      return 'info';
    };

    const formattedErrors = recentErrors.map((err, index) => ({
      id: `err-${index + 1}`,
      toolId: err.toolId,
      toolName: err.toolName,
      error: err.error ?? 'Unknown error',
      count: err.count ?? 0,
      lastOccurred: err.lastOccurred instanceof Date 
        ? err.lastOccurred.toISOString() 
        : new Date().toISOString(),
      severity: formatSeverity(err.count ?? 0),
    }));

    return adminResponse(formattedErrors);
  } catch (error) {
    log.error('Failed to fetch recent errors', { err: error });
    return adminErrorResponse('FETCH_ERROR', 'Failed to fetch recent errors');
  }
}
