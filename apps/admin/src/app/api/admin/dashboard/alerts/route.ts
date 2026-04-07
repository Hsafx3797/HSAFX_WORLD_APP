/**
 * Alerts API Route
 * GET /api/admin/dashboard/alerts
 * 
 * Real database implementation using Drizzle ORM
 * Generates alerts based on actual system metrics
 */

import { NextResponse } from 'next/server';
import { db, tools, toolExecutions, subscriptions, users, eq, and, sql, gte } from '@hsafx/db';
import { createLogger } from '@hsafx/shared/logger';
import { requireAdminRole } from '@/lib/require-admin';
import { adminResponse, adminErrorResponse } from '@/lib/admin-response';

const log = createLogger('admin-alerts');

interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  createdAt: string;
  acknowledged: boolean;
}

export async function GET() {
  try {
    const authResult = await requireAdminRole('system.view');
    if (authResult instanceof NextResponse) return authResult;

    const alerts: Alert[] = [];
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Check for tools with high error rates (> 5%)
    const toolErrorRates = await db
      .select({
        toolId: tools.id,
        toolName: tools.name,
        totalExecutions: sql<number>`COUNT(*)`.as('totalExecutions'),
        failedExecutions: sql<number>`COUNT(CASE WHEN ${toolExecutions.status} = 'failed' THEN 1 END)`.as('failedExecutions'),
      })
      .from(toolExecutions)
      .innerJoin(tools, eq(toolExecutions.toolId, tools.id))
      .where(gte(toolExecutions.createdAt, oneHourAgo))
      .groupBy(tools.id)
      .having(sql`COUNT(*) >= 10`); // Only tools with at least 10 executions

    for (const tool of toolErrorRates) {
      const total = tool.totalExecutions ?? 0;
      const failed = tool.failedExecutions ?? 0;
      const errorRate = total > 0 ? (failed / total) * 100 : 0;

      if (errorRate > 5) {
        alerts.push({
          id: `alert-error-${tool.toolId}`,
          type: errorRate > 10 ? 'error' : 'warning',
          title: 'High Error Rate',
          message: `${tool.toolName} has an error rate of ${errorRate.toFixed(1)}% in the last hour`,
          createdAt: new Date().toISOString(),
          acknowledged: false,
        });
      }
    }

    // Check for new subscription spikes
    const [recentSubscriptions] = await db
      .select({
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(subscriptions)
      .where(gte(subscriptions.createdAt, oneHourAgo));

    const subCount = recentSubscriptions?.count ?? 0;
    if (subCount >= 10) {
      alerts.push({
        id: 'alert-sub-spike',
        type: 'info',
        title: 'Subscription Spike',
        message: `${subCount} new subscriptions in the last hour`,
        createdAt: new Date().toISOString(),
        acknowledged: false,
      });
    }

    // Check for new user signups
    const [recentUsers] = await db
      .select({
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(users)
      .where(gte(users.createdAt, oneDayAgo));

    const userCount = recentUsers?.count ?? 0;
    if (userCount >= 50) {
      alerts.push({
        id: 'alert-user-growth',
        type: 'info',
        title: 'User Growth',
        message: `${userCount} new users signed up in the last 24 hours`,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
        acknowledged: false,
      });
    }

    // Check for disabled tools that might need attention
    const [disabledTools] = await db
      .select({
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(tools)
      .where(eq(tools.isActive, false));

    const disabledCount = disabledTools?.count ?? 0;
    if (disabledCount > 0) {
      alerts.push({
        id: 'alert-disabled-tools',
        type: 'warning',
        title: 'Disabled Tools',
        message: `${disabledCount} tool(s) are currently disabled`,
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
        acknowledged: true,
      });
    }

    // Sort alerts by createdAt descending
    alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return adminResponse(alerts);
  } catch (error) {
    log.error('Failed to fetch alerts', { err: error });
    return adminErrorResponse('FETCH_ERROR', 'Failed to fetch alerts');
  }
}
