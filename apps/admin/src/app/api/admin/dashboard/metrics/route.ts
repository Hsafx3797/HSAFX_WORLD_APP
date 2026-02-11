/**
 * Dashboard Metrics API Route
 * GET /api/admin/dashboard/metrics
 * 
 * Real database implementation using Drizzle ORM
 */

import { NextResponse } from 'next/server';
import { db, users, subscriptions, tools, toolExecutions, coinTransactions, sql } from '@hsafx/db';

export async function GET() {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Execute all queries in parallel for performance
    const [
      totalUsersResult,
      prevPeriodUsersResult,
      activeSubscriptionsResult,
      prevSubscriptionsResult,
      activeToolsResult,
      dailyExecutionsResult,
      monthlyExecutionsResult,
      prevMonthlyExecutionsResult,
      monthlyRevenueResult,
      prevRevenueResult,
      errorCountResult,
      totalExecutionsResult,
      avgResponseTimeResult,
    ] = await Promise.all([
      // Total users (excluding deleted)
      db.select({ count: sql<number>`COUNT(*)` })
        .from(users)
        .where(sql`${users.deletedAt} IS NULL`),
      
      // Users from previous period (for trend)
      db.select({ count: sql<number>`COUNT(*)` })
        .from(users)
        .where(sql`${users.deletedAt} IS NULL AND ${users.createdAt} < ${thirtyDaysAgo}`),
      
      // Active subscriptions
      db.select({ count: sql<number>`COUNT(*)` })
        .from(subscriptions)
        .where(sql`${subscriptions.status} = 'active'`),
      
      // Previous period subscriptions (for trend)
      db.select({ count: sql<number>`COUNT(*)` })
        .from(subscriptions)
        .where(sql`${subscriptions.status} = 'active' AND ${subscriptions.createdAt} < ${thirtyDaysAgo}`),
      
      // Active tools
      db.select({ count: sql<number>`COUNT(*)` })
        .from(tools)
        .where(sql`${tools.isActive} = true AND ${tools.deletedAt} IS NULL`),
      
      // Daily executions (today)
      db.select({ count: sql<number>`COUNT(*)` })
        .from(toolExecutions)
        .where(sql`${toolExecutions.createdAt} >= ${todayStart}`),
      
      // Monthly executions (last 30 days)
      db.select({ count: sql<number>`COUNT(*)` })
        .from(toolExecutions)
        .where(sql`${toolExecutions.createdAt} >= ${thirtyDaysAgo}`),
      
      // Previous month executions (for trend)
      db.select({ count: sql<number>`COUNT(*)` })
        .from(toolExecutions)
        .where(sql`${toolExecutions.createdAt} >= ${sixtyDaysAgo} AND ${toolExecutions.createdAt} < ${thirtyDaysAgo}`),
      
      // Monthly revenue (from coin transactions - purchases)
      db.select({ sum: sql<number>`COALESCE(SUM(${coinTransactions.amount}), 0)` })
        .from(coinTransactions)
        .where(sql`${coinTransactions.type} = 'purchase' AND ${coinTransactions.createdAt} >= ${thirtyDaysAgo}`),
      
      // Previous period revenue (for trend)
      db.select({ sum: sql<number>`COALESCE(SUM(${coinTransactions.amount}), 0)` })
        .from(coinTransactions)
        .where(sql`${coinTransactions.type} = 'purchase' AND ${coinTransactions.createdAt} >= ${sixtyDaysAgo} AND ${coinTransactions.createdAt} < ${thirtyDaysAgo}`),
      
      // Error count (last 30 days)
      db.select({ count: sql<number>`COUNT(*)` })
        .from(toolExecutions)
        .where(sql`${toolExecutions.status} = 'failed' AND ${toolExecutions.createdAt} >= ${thirtyDaysAgo}`),
      
      // Total executions (for error rate)
      db.select({ count: sql<number>`COUNT(*)` })
        .from(toolExecutions)
        .where(sql`${toolExecutions.createdAt} >= ${thirtyDaysAgo}`),
      
      // Average response time (last 30 days, successful only)
      db.select({ avg: sql<number>`COALESCE(AVG(${toolExecutions.executionTime}), 0)` })
        .from(toolExecutions)
        .where(sql`${toolExecutions.status} = 'succeeded' AND ${toolExecutions.createdAt} >= ${thirtyDaysAgo}`),
    ]);

    // Calculate metrics
    const totalUsers = totalUsersResult[0]?.count ?? 0;
    const prevUsers = prevPeriodUsersResult[0]?.count ?? 0;
    const activeSubscriptions = activeSubscriptionsResult[0]?.count ?? 0;
    const prevSubscriptions = prevSubscriptionsResult[0]?.count ?? 0;
    const activeTools = activeToolsResult[0]?.count ?? 0;
    const dailyExecutions = dailyExecutionsResult[0]?.count ?? 0;
    const monthlyExecutions = monthlyExecutionsResult[0]?.count ?? 0;
    const prevMonthlyExecutions = prevMonthlyExecutionsResult[0]?.count ?? 0;
    const monthlyRevenue = (monthlyRevenueResult[0]?.sum ?? 0) / 100; // Assume cents to dollars
    const prevRevenue = (prevRevenueResult[0]?.sum ?? 0) / 100;
    const errorCount = errorCountResult[0]?.count ?? 0;
    const totalExecutions = totalExecutionsResult[0]?.count ?? 0;
    const avgResponseTime = Math.round(avgResponseTimeResult[0]?.avg ?? 0);

    // Calculate trends (percentage change)
    const calculateTrend = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number((((current - previous) / previous) * 100).toFixed(1));
    };

    const newUsersThisMonth = totalUsers - prevUsers;
    const usersTrend = prevUsers > 0 ? calculateTrend(newUsersThisMonth, prevUsers) : 0;
    const subscriptionsTrend = calculateTrend(activeSubscriptions, prevSubscriptions);
    const revenueTrend = calculateTrend(monthlyRevenue, prevRevenue);
    const executionsTrend = calculateTrend(monthlyExecutions, prevMonthlyExecutions);
    const errorRate = totalExecutions > 0 ? Number(((errorCount / totalExecutions) * 100).toFixed(2)) : 0;

    const metrics = {
      totalUsers,
      activeSubscriptions,
      monthlyRevenue,
      activeTools,
      dailyExecutions,
      errorRate,
      avgResponseTime,
      storageUsed: 0, // TODO: Implement storage tracking
      trends: {
        users: usersTrend,
        subscriptions: subscriptionsTrend,
        revenue: revenueTrend,
        tools: 0, // Tools don't have a trend metric
        executions: executionsTrend,
        errors: errorRate > 1 ? -errorRate : -errorRate, // Negative means decreasing (good)
      },
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Failed to fetch dashboard metrics:', error);
    return NextResponse.json(
      { code: 'FETCH_ERROR', message: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    );
  }
}
