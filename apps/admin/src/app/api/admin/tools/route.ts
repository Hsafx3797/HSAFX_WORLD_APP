/**
 * Tools API Routes
 * GET    /api/admin/tools — List tools with pagination, filters, usage stats
 * POST   /api/admin/tools — Create a new tool
 * PATCH  /api/admin/tools — Update a tool (enable/disable, tier, coinCost, etc.)
 * DELETE /api/admin/tools — Soft-delete a tool
 *
 * Real database implementation using Drizzle ORM
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, tools, toolCategories, toolExecutions, activityLogs, eq, and, or, sql, desc, asc } from '@hsafx/db';
import { createLogger } from '@hsafx/shared/logger';

const log = createLogger('admin-tools');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search')?.toLowerCase();
    const category = searchParams.get('category');
    const tier = searchParams.get('tier');
    const enabled = searchParams.get('enabled');
    const sortBy = searchParams.get('sortBy') || 'sortOrder';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];
    
    // Exclude soft-deleted tools
    conditions.push(sql`${tools.deletedAt} IS NULL`);
    
    // Search filter
    if (search) {
      conditions.push(
        or(
          sql`LOWER(${tools.name}) LIKE ${`%${search}%`}`,
          sql`LOWER(${tools.slug}) LIKE ${`%${search}%`}`,
          sql`LOWER(${tools.description}) LIKE ${`%${search}%`}`
        )
      );
    }
    
    // Enabled filter
    if (enabled !== null && enabled !== undefined) {
      conditions.push(eq(tools.isActive, enabled === 'true'));
    }

    // Tier filter
    if (tier === 'free') {
      conditions.push(eq(tools.isPremium, false));
    } else if (tier === 'pro' || tier === 'premium') {
      conditions.push(eq(tools.isPremium, true));
    }

    // Build where clause
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Query tools with category info
    const toolsQuery = db
      .select({
        id: tools.id,
        name: tools.slug,
        displayName: tools.name,
        slug: tools.slug,
        description: tools.description,
        categoryId: tools.categoryId,
        tier: sql<string>`CASE WHEN ${tools.isPremium} = true THEN 'pro' ELSE 'free' END`,
        costType: sql<string>`CASE WHEN ${tools.coinCost} > 0 THEN 'coin' ELSE 'free' END`,
        coinCost: tools.coinCost,
        execution: tools.executionMode,
        runtime: tools.runtime,
        enabled: tools.isActive,
        createdAt: tools.createdAt,
        updatedAt: tools.updatedAt,
      })
      .from(tools)
      .where(whereClause)
      .orderBy(
        sortOrder === 'desc' 
          ? desc(tools.sortOrder) 
          : asc(tools.sortOrder)
      )
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const countQuery = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(tools)
      .where(whereClause);

    // Get categories for filtering
    const categoriesQuery = db
      .select({
        id: toolCategories.id,
        slug: toolCategories.slug,
        name: toolCategories.name,
      })
      .from(toolCategories)
      .where(eq(toolCategories.isActive, true));

    // Execute queries in parallel
    const [toolResults, countResults, categories] = await Promise.all([
      toolsQuery,
      countQuery,
      categoriesQuery,
    ]);

    // Create category lookup map
    const categoryMap = new Map(categories.map(c => [c.id, c]));

    // Enrich tools with usage stats and category info
    const enrichedTools = await Promise.all(
      toolResults.map(async (tool) => {
        // Get 24h execution count
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const [exec24h] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(toolExecutions)
          .where(
            and(
              eq(toolExecutions.toolId, tool.id),
              sql`${toolExecutions.createdAt} >= ${twentyFourHoursAgo}`
            )
          );

        // Get total execution count
        const [execTotal] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(toolExecutions)
          .where(eq(toolExecutions.toolId, tool.id));

        // Get error rate (failed executions / total)
        const [errorCount] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(toolExecutions)
          .where(
            and(
              eq(toolExecutions.toolId, tool.id),
              eq(toolExecutions.status, 'failed')
            )
          );

        // Get average execution time
        const [avgTime] = await db
          .select({ avg: sql<number>`AVG(${toolExecutions.executionTime})` })
          .from(toolExecutions)
          .where(
            and(
              eq(toolExecutions.toolId, tool.id),
              eq(toolExecutions.status, 'succeeded')
            )
          );

        const category = categoryMap.get(tool.categoryId);
        const totalExec = execTotal?.count ?? 0;
        const errorExec = errorCount?.count ?? 0;

        return {
          ...tool,
          category: category?.slug || 'unknown',
          categoryName: category?.name || 'Unknown',
          usageCount24h: exec24h?.count ?? 0,
          usageCountTotal: totalExec,
          usageCount: totalExec, // Alias for admin table
          errorRate: totalExec > 0 ? Number(((errorExec / totalExec) * 100).toFixed(2)) : 0,
          avgExecutionTime: avgTime?.avg ? Math.round(avgTime.avg) : 0,
        };
      })
    );

    // Apply category filter after enrichment
    let filteredTools = enrichedTools;
    if (category) {
      filteredTools = enrichedTools.filter((t) => t.category === category);
    }

    const total = countResults[0]?.count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: filteredTools,
      page,
      limit,
      total,
      totalPages,
    });
  } catch (error) {
    log.error('Failed to fetch tools', { error: String(error) });
    return NextResponse.json(
      { code: 'FETCH_ERROR', message: 'Failed to fetch tools' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/tools
 * Create a new tool.
 *
 * Body: { name, slug, description, categoryId, toolGroup, runtime, executionMode, coinCost?, isPremium?, tags?, icon?, sortOrder? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, categoryId, toolGroup, runtime, executionMode, coinCost, isPremium, tags, icon, sortOrder, longDescription, metadata } = body;

    if (!name || !slug || !description || !categoryId || !toolGroup || !runtime || !executionMode) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'name, slug, description, categoryId, toolGroup, runtime, executionMode are required' },
        { status: 400 }
      );
    }

    // Check duplicate slug
    const existing = await db.select({ id: tools.id }).from(tools).where(eq(tools.slug, slug)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json(
        { code: 'DUPLICATE_SLUG', message: 'Tool with this slug already exists' },
        { status: 409 }
      );
    }

    const [newTool] = await db
      .insert(tools)
      .values({
        name,
        slug,
        description,
        longDescription: longDescription || null,
        categoryId,
        toolGroup: Number(toolGroup),
        runtime,
        executionMode,
        coinCost: coinCost ?? 0,
        isPremium: isPremium ?? false,
        tags: tags ?? [],
        icon: icon || null,
        sortOrder: sortOrder ?? 0,
        metadata: metadata ?? {},
        isActive: true,
      } as typeof tools.$inferInsert)
      .returning();

    // Audit log
    await db.insert(activityLogs).values({
      action: 'tool_created',
      resource: 'tool',
      resourceId: newTool.id,
      metadata: JSON.stringify({ slug }),
    } as typeof activityLogs.$inferInsert);

    return NextResponse.json(
      {
        id: newTool.id,
        name: newTool.name,
        slug: newTool.slug,
        description: newTool.description,
        categoryId: newTool.categoryId,
        runtime: newTool.runtime,
        executionMode: newTool.executionMode,
        coinCost: newTool.coinCost,
        isPremium: newTool.isPremium,
        isActive: newTool.isActive,
        createdAt: newTool.createdAt?.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    log.error('Failed to create tool', { error: String(error) });
    return NextResponse.json(
      { code: 'CREATE_ERROR', message: 'Failed to create tool' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/tools
 * Update a tool: enable/disable, tier, coinCost, description, etc.
 *
 * Body: { id: string, ...fields }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body as { id?: string; [k: string]: unknown };

    if (!id) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'Tool ID is required' },
        { status: 400 }
      );
    }

    // Only allow specific fields
    const allowedFields: Record<string, string> = {
      name: 'name',
      description: 'description',
      longDescription: 'longDescription',
      categoryId: 'categoryId',
      coinCost: 'coinCost',
      isActive: 'isActive',
      isPremium: 'isPremium',
      tags: 'tags',
      icon: 'icon',
      sortOrder: 'sortOrder',
      runtime: 'runtime',
      executionMode: 'executionMode',
      metadata: 'metadata',
    };

    const setValues: Record<string, unknown> = { updatedAt: new Date() };
    for (const [key, val] of Object.entries(updates)) {
      if (key in allowedFields) {
        setValues[allowedFields[key]] = val;
      }
    }

    const [updated] = await db
      .update(tools)
      .set(setValues)
      .where(and(eq(tools.id, id), sql`${tools.deletedAt} IS NULL`))
      .returning({
        id: tools.id,
        name: tools.name,
        slug: tools.slug,
        isActive: tools.isActive,
        isPremium: tools.isPremium,
        coinCost: tools.coinCost,
        updatedAt: tools.updatedAt,
      });

    if (!updated) {
      return NextResponse.json(
        { code: 'NOT_FOUND', message: 'Tool not found' },
        { status: 404 }
      );
    }

    // Audit log
    await db.insert(activityLogs).values({
      action: updates.isActive === false ? 'tool_disabled' : 'tool_updated',
      resource: 'tool',
      resourceId: id,
      metadata: JSON.stringify({ fields: Object.keys(updates) }),
    } as typeof activityLogs.$inferInsert);

    return NextResponse.json(updated);
  } catch (error) {
    log.error('Failed to update tool', { error: String(error) });
    return NextResponse.json(
      { code: 'UPDATE_ERROR', message: 'Failed to update tool' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/tools
 * Soft-delete a tool by setting deletedAt + isActive = false
 *
 * Body: { id: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body as { id?: string };

    if (!id) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'Tool ID is required' },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .update(tools)
      .set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() } as Partial<typeof tools.$inferInsert>)
      .where(and(eq(tools.id, id), sql`${tools.deletedAt} IS NULL`))
      .returning({ id: tools.id, slug: tools.slug });

    if (!deleted) {
      return NextResponse.json(
        { code: 'NOT_FOUND', message: 'Tool not found or already deleted' },
        { status: 404 }
      );
    }

    // Audit log
    await db.insert(activityLogs).values({
      action: 'tool_deleted',
      resource: 'tool',
      resourceId: id,
      metadata: { slug: deleted.slug },
    } as typeof activityLogs.$inferInsert);

    return NextResponse.json({ success: true, id: deleted.id });
  } catch (error) {
    log.error('Failed to delete tool', { error: String(error) });
    return NextResponse.json(
      { code: 'DELETE_ERROR', message: 'Failed to delete tool' },
      { status: 500 }
    );
  }
}
