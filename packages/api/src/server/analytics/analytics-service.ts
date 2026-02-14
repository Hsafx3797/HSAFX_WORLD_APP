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
export async function getUserAnalytics(userId: string) {
  const [executionsPerDay, categoryBreakdown, coinFlow, topTools] = await Promise.all([
    getExecutionsPerDay(userId),
    getCategoryBreakdown(userId),
    getCoinFlow(userId),
    getTopTools(userId),
  ]);

  return { executionsPerDay, categoryBreakdown, coinFlow, topTools };
}
