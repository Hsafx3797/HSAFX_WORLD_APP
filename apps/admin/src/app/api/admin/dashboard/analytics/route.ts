/**
 * Dashboard Analytics API Route
 * GET /api/admin/dashboard/analytics
 * Returns time-series data for charts: user growth, revenue, executions over last 30 days
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, users, subscriptions, coinTransactions, toolExecutions, sql } from '@hsafx/db';
import { requireAdminRole } from '@/lib/require-admin';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminRole();
    if (authResult instanceof NextResponse) return authResult;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Execute all time-series queries in parallel
    const [userGrowth, executionTrend, revenueTrend, tierBreakdown] = await Promise.all([
      // Daily new user signups
      db
        .select({
          date: sql<string>`DATE(${users.createdAt})`,
          count: sql<number>`COUNT(*)`,
        })
        .from(users)
        .where(sql`${users.createdAt} >= ${startDate} AND ${users.deletedAt} IS NULL`)
        .groupBy(sql`DATE(${users.createdAt})`)
        .orderBy(sql`DATE(${users.createdAt})`),

      // Daily tool executions
      db
        .select({
          date: sql<string>`DATE(${toolExecutions.createdAt})`,
          count: sql<number>`COUNT(*)`,
          errors: sql<number>`SUM(CASE WHEN ${toolExecutions.status} = 'failed' THEN 1 ELSE 0 END)`,
        })
        .from(toolExecutions)
        .where(sql`${toolExecutions.createdAt} >= ${startDate}`)
        .groupBy(sql`DATE(${toolExecutions.createdAt})`)
        .orderBy(sql`DATE(${toolExecutions.createdAt})`),

      // Daily revenue from coin transactions (purchases only)
      db
        .select({
          date: sql<string>`DATE(${coinTransactions.createdAt})`,
          total: sql<number>`COALESCE(SUM(ABS(${coinTransactions.amount})), 0)`,
        })
        .from(coinTransactions)
        .where(
          sql`${coinTransactions.createdAt} >= ${startDate} AND ${coinTransactions.type} = 'purchase'`
        )
        .groupBy(sql`DATE(${coinTransactions.createdAt})`)
        .orderBy(sql`DATE(${coinTransactions.createdAt})`),

      // Current tier breakdown
      db
        .select({
          status: sql<string>`CASE WHEN ${subscriptions.status} = 'active' THEN 'paid' ELSE 'free' END`,
          count: sql<number>`COUNT(DISTINCT ${subscriptions.userId})`,
        })
        .from(subscriptions)
        .groupBy(sql`CASE WHEN ${subscriptions.status} = 'active' THEN 'paid' ELSE 'free' END`),
    ]);

    // Total users without subscription = free
    const [totalUsersResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(sql`${users.deletedAt} IS NULL`);

    const paidCount = tierBreakdown.find((t) => t.status === 'paid')?.count || 0;
    const totalUsers = Number(totalUsersResult?.count ?? 0);
    const freeCount = totalUsers - Number(paidCount);

    return NextResponse.json({
      userGrowth: userGrowth.map((r) => ({ date: r.date, users: Number(r.count) })),
      executionTrend: executionTrend.map((r) => ({
        date: r.date,
        executions: Number(r.count),
        errors: Number(r.errors ?? 0),
      })),
      revenueTrend: revenueTrend.map((r) => ({ date: r.date, revenue: Number(r.total) })),
      conversionFunnel: [
        { name: 'Free Users', value: Number(freeCount) },
        { name: 'Paid Users', value: Number(paidCount) },
      ],
    });
  } catch (error) {
    console.error('[Dashboard Analytics] Error:', error);
    return NextResponse.json(
      { code: 'INTERNAL', message: 'Failed to load analytics' },
      { status: 500 }
    );
  }
}
