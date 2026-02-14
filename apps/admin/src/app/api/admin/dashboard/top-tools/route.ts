/**
 * Top Tools API Route
 * GET /api/admin/dashboard/top-tools
 * 
 * Real database implementation using Drizzle ORM
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, tools, toolExecutions, eq, sql, desc } from '@hsafx/db';
import { requireAdminRole } from '@/lib/require-admin';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminRole();
    if (authResult instanceof NextResponse) return authResult;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    // Get current period (last 30 days) and previous period for trend calculation
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Query top tools by execution count in the last 30 days
    const topToolsQuery = await db
      .select({
        id: tools.id,
        name: tools.name,
        slug: tools.slug,
        currentExecutions: sql<number>`COUNT(CASE WHEN ${toolExecutions.createdAt} >= ${thirtyDaysAgo} THEN 1 END)`.as('currentExecutions'),
        previousExecutions: sql<number>`COUNT(CASE WHEN ${toolExecutions.createdAt} >= ${sixtyDaysAgo} AND ${toolExecutions.createdAt} < ${thirtyDaysAgo} THEN 1 END)`.as('previousExecutions'),
      })
      .from(tools)
      .leftJoin(toolExecutions, eq(toolExecutions.toolId, tools.id))
      .groupBy(tools.id)
      .orderBy(desc(sql`COUNT(CASE WHEN ${toolExecutions.createdAt} >= ${thirtyDaysAgo} THEN 1 END)`))
      .limit(limit);

    // Calculate trend percentage for each tool
    const topTools = topToolsQuery.map((tool) => {
      const current = tool.currentExecutions ?? 0;
      const previous = tool.previousExecutions ?? 0;
      
      let trend = 0;
      if (previous > 0) {
        trend = ((current - previous) / previous) * 100;
      } else if (current > 0) {
        trend = 100; // New tool with executions
      }

      return {
        id: tool.id,
        name: tool.name,
        slug: tool.slug,
        executions: current,
        trend: Math.round(trend * 10) / 10, // Round to 1 decimal place
      };
    });

    return NextResponse.json(topTools);
  } catch (error) {
    console.error('Failed to fetch top tools:', error);
    return NextResponse.json(
      { code: 'FETCH_ERROR', message: 'Failed to fetch top tools' },
      { status: 500 }
    );
  }
}
