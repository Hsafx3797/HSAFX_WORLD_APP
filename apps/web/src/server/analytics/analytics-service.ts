'use server';

import { db } from '@hsafx/db';
import { toolExecutions, coinTransactions, tools, toolCategories, sql, eq, and, gte } from '@hsafx/db/schema';

/**
 * T3.2 — User Analytics Service
 * Queries tool_executions + coin_transactions for dashboard charts.
 */

/** Executions per day for the last N days */
export async function getExecutionsPerDay(userId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db
    .select({
      date: sql<string>`DATE(${toolExecutions.createdAt})`.as('date'),
      count: sql<number>`COUNT(*)`.as('count'),
    })
    .from(toolExecutions)
    .where(and(eq(toolExecutions.userId, userId), gte(toolExecutions.createdAt, since)))
    .groupBy(sql`DATE(${toolExecutions.createdAt})`)
    .orderBy(sql`DATE(${toolExecutions.createdAt})`);

  return rows.map((r) => ({ date: String(r.date), count: Number(r.count) }));
}

/** Tool category distribution (pie chart) */
export async function getCategoryBreakdown(userId: string) {
  const rows = await db
    .select({
      categoryName: toolCategories.name,
      count: sql<number>`COUNT(*)`.as('count'),
    })
    .from(toolExecutions)
    .innerJoin(tools, eq(toolExecutions.toolId, tools.id))
    .innerJoin(toolCategories, eq(tools.categoryId, toolCategories.id))
    .where(eq(toolExecutions.userId, userId))
    .groupBy(toolCategories.name)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(10);

  return rows.map((r) => ({ name: String(r.categoryName), count: Number(r.count) }));
}

/** Coin spend vs earn per month (bar chart) */
export async function getCoinFlow(userId: string, months = 6) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const rows = await db
    .select({
      month: sql<string>`TO_CHAR(${coinTransactions.createdAt}, 'YYYY-MM')`.as('month'),
      earned: sql<number>`COALESCE(SUM(CASE WHEN ${coinTransactions.amount} > 0 THEN ${coinTransactions.amount} ELSE 0 END), 0)`.as('earned'),
      spent: sql<number>`COALESCE(SUM(CASE WHEN ${coinTransactions.amount} < 0 THEN ABS(${coinTransactions.amount}) ELSE 0 END), 0)`.as('spent'),
    })
    .from(coinTransactions)
    .where(and(eq(coinTransactions.userId, userId), gte(coinTransactions.createdAt, since)))
    .groupBy(sql`TO_CHAR(${coinTransactions.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${coinTransactions.createdAt}, 'YYYY-MM')`);

  return rows.map((r) => ({
    month: String(r.month),
    earned: Number(r.earned),
    spent: Number(r.spent),
  }));
}

/** Top used tools */
export async function getTopTools(userId: string, limit = 5) {
  const rows = await db
    .select({
      toolName: tools.name,
      count: sql<number>`COUNT(*)`.as('count'),
    })
    .from(toolExecutions)
    .innerJoin(tools, eq(toolExecutions.toolId, tools.id))
    .where(eq(toolExecutions.userId, userId))
    .groupBy(tools.name)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(limit);

  return rows.map((r) => ({ name: String(r.toolName), count: Number(r.count) }));
}

/** Aggregate analytics for user dashboard */
export async function getUserAnalytics(userId: string, days = 30) {
  const [executionsPerDay, categoryBreakdown, coinFlow, topTools, responseStats, peakHours, errorRate] = await Promise.all([
    getExecutionsPerDay(userId, days),
    getCategoryBreakdown(userId),
    getCoinFlow(userId),
    getTopTools(userId),
    getResponseTimeStats(userId, days),
    getPeakHours(userId, days),
    getErrorRate(userId, days),
  ]);

  return { executionsPerDay, categoryBreakdown, coinFlow, topTools, responseStats, peakHours, errorRate };
}

/** Response time stats (avg, p50, p95, p99) */
export async function getResponseTimeStats(userId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [row] = await db
    .select({
      avg: sql<number>`COALESCE(AVG(${toolExecutions.executionTime}), 0)`.as('avg'),
      p50: sql<number>`COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ${toolExecutions.executionTime}), 0)`.as('p50'),
      p95: sql<number>`COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY ${toolExecutions.executionTime}), 0)`.as('p95'),
      total: sql<number>`COUNT(*)`.as('total'),
    })
    .from(toolExecutions)
    .where(
      and(
        eq(toolExecutions.userId, userId),
        gte(toolExecutions.createdAt, since),
        sql`${toolExecutions.executionTime} IS NOT NULL`
      )
    );

  return {
    avg: Math.round(Number(row?.avg ?? 0)),
    p50: Math.round(Number(row?.p50 ?? 0)),
    p95: Math.round(Number(row?.p95 ?? 0)),
    total: Number(row?.total ?? 0),
  };
}

/** Peak usage hours (0-23) */
export async function getPeakHours(userId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db
    .select({
      hour: sql<number>`EXTRACT(HOUR FROM ${toolExecutions.createdAt})`.as('hour'),
      count: sql<number>`COUNT(*)`.as('count'),
    })
    .from(toolExecutions)
    .where(and(eq(toolExecutions.userId, userId), gte(toolExecutions.createdAt, since)))
    .groupBy(sql`EXTRACT(HOUR FROM ${toolExecutions.createdAt})`)
    .orderBy(sql`EXTRACT(HOUR FROM ${toolExecutions.createdAt})`);

  return rows.map((r) => ({ hour: Number(r.hour), count: Number(r.count) }));
}

/** Error rate over time (daily) */
export async function getErrorRate(userId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db
    .select({
      date: sql<string>`DATE(${toolExecutions.createdAt})`.as('date'),
      total: sql<number>`COUNT(*)`.as('total'),
      failed: sql<number>`COUNT(*) FILTER (WHERE ${toolExecutions.status} = 'failed')`.as('failed'),
    })
    .from(toolExecutions)
    .where(and(eq(toolExecutions.userId, userId), gte(toolExecutions.createdAt, since)))
    .groupBy(sql`DATE(${toolExecutions.createdAt})`)
    .orderBy(sql`DATE(${toolExecutions.createdAt})`);

  return rows.map((r) => ({
    date: String(r.date),
    total: Number(r.total),
    failed: Number(r.failed),
    rate: Number(r.total) > 0 ? Number(r.failed) / Number(r.total) : 0,
  }));
}
