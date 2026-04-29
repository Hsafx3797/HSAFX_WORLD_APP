import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, adminProcedure, planGatedProcedure } from '../trpc';
import {
  tools,
  toolCategories,
  toolLimits,
  toolExecutions,
  eq,
  and,
  desc,
  isNull,
  sql,
  gte,
  lte,
  count,
} from '@hsafx/db/schema';
import { TRPCError } from '@trpc/server';

export const toolsRouter = router({
  getCategories: publicProcedure.query(async ({ ctx }) => {
    const categories = await ctx.db
      .select()
      .from(toolCategories)
      .where(eq(toolCategories.isActive, true))
      .orderBy(toolCategories.sortOrder);

    return categories;
  }),

  getCategoryBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const [category] = await ctx.db
        .select()
        .from(toolCategories)
        .where(eq(toolCategories.slug, input.slug))
        .limit(1);

      if (!category) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Category not found' });
      }

      const categoryTools = await ctx.db
        .select()
        .from(tools)
        .where(
          and(
            eq(tools.categoryId, category.id),
            eq(tools.isActive, true),
            isNull(tools.deletedAt)
          )
        )
        .orderBy(tools.sortOrder);

      return { category, tools: categoryTools };
    }),

  list: publicProcedure
    .input(z.object({
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(20),
      categoryId: z.string().uuid().optional(),
      group: z.number().int().min(1).max(5).optional(),
      search: z.string().max(200).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.pageSize;

      const conditions = [eq(tools.isActive, true), isNull(tools.deletedAt)];

      if (input.categoryId) {
        conditions.push(eq(tools.categoryId, input.categoryId));
      }

      if (input.group) {
        conditions.push(eq(tools.toolGroup, input.group));
      }

      if (input.search && input.search.trim()) {
        conditions.push(
          sql`to_tsvector('english', coalesce(${tools.name}, '') || ' ' || coalesce(${tools.description}, '') || ' ' || coalesce(array_to_string(${tools.tags}, ' '), '')) @@ plainto_tsquery('english', ${input.search.trim()})`,
        );
      }

      const where = and(...conditions);

      const [items, countRows] = await Promise.all([
        ctx.db
          .select()
          .from(tools)
          .where(where)
          .orderBy(tools.sortOrder)
          .limit(input.pageSize)
          .offset(offset),
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(tools)
          .where(where),
      ]);

      const total = Number(countRows[0]?.count ?? 0);

      return {
        items,
        page: input.page,
        pageSize: input.pageSize,
        totalCount: total,
        totalPages: Math.ceil(total / input.pageSize),
      };
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const [tool] = await ctx.db
        .select()
        .from(tools)
        .where(eq(tools.slug, input.slug))
        .limit(1);

      if (!tool) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tool not found' });
      }

      const [category] = await ctx.db
        .select()
        .from(toolCategories)
        .where(eq(toolCategories.id, tool.categoryId))
        .limit(1);

      const limits = await ctx.db
        .select()
        .from(toolLimits)
        .where(eq(toolLimits.toolId, tool.id));

      return { tool, category, limits };
    }),

  getExecutionStatus: protectedProcedure
    .input(z.object({ executionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [execution] = await ctx.db
        .select()
        .from(toolExecutions)
        .where(
          and(
            eq(toolExecutions.id, input.executionId),
            eq(toolExecutions.userId, ctx.user!.id)
          )
        )
        .limit(1);

      if (!execution) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Execution not found' });
      }

      return execution;
    }),

  getMyExecutions: protectedProcedure
    .input(z.object({
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(20),
      status: z.enum(['pending', 'running', 'succeeded', 'failed']).optional(),
      engineName: z.string().optional(),
      dateFrom: z.string().datetime().optional(),
      dateTo: z.string().datetime().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.pageSize;

      const conditions = [eq(toolExecutions.userId, ctx.user!.id)];
      if (input.status) conditions.push(eq(toolExecutions.status, input.status));
      if (input.engineName) {
        conditions.push(sql`${toolExecutions.metadata}->>'engineName' = ${input.engineName}`);
      }
      if (input.dateFrom) conditions.push(gte(toolExecutions.createdAt, new Date(input.dateFrom)));
      if (input.dateTo) conditions.push(lte(toolExecutions.createdAt, new Date(input.dateTo)));

      const whereClause = and(...conditions);

      const [items, [totalRow]] = await Promise.all([
        ctx.db
          .select()
          .from(toolExecutions)
          .where(whereClause)
          .orderBy(desc(toolExecutions.createdAt))
          .limit(input.pageSize)
          .offset(offset),
        ctx.db
          .select({ count: count() })
          .from(toolExecutions)
          .where(whereClause),
      ]);

      const total = Number(totalRow?.count ?? 0);

      return { items, page: input.page, pageSize: input.pageSize, total, totalPages: Math.ceil(total / input.pageSize) };
    }),

  create: adminProcedure
    .input(z.object({
      categoryId: z.string().uuid(),
      name: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().min(1),
      longDescription: z.string().optional(),
      toolGroup: z.number().int().min(1).max(5),
      isPremium: z.boolean().default(false),
      tags: z.array(z.string()).default([]),
      icon: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [tool] = await ctx.db
        .insert(tools)
        .values(input)
        .returning();

      return tool;
    }),

  update: adminProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().min(1).optional(),
      description: z.string().min(1).optional(),
      longDescription: z.string().optional(),
      isActive: z.boolean().optional(),
      isPremium: z.boolean().optional(),
      tags: z.array(z.string()).optional(),
      icon: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(tools)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(tools.id, id))
        .returning();

      return updated;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .update(tools)
        .set({ deletedAt: new Date() })
        .where(eq(tools.id, input.id))
        .returning();

      return deleted;
    }),

  // ─── Batch Processing (T3.8) ─────────────────────────────

  createBatchJob: planGatedProcedure
    .input(z.object({
      engineName: z.string(),
      inputs: z.array(z.record(z.unknown())).min(1).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      const { createBatchJob } = await import('@/server/batch/batch-service');
      return createBatchJob({
        userId: ctx.user!.id,
        jobType: input.engineName,
        files: input.inputs.map((item, idx) => ({
          filename: `input-${idx}`,
          storageKey: `batch/${ctx.user!.id}/${input.engineName}/${idx}`,
          mimeType: 'application/json',
          fileSize: JSON.stringify(item).length,
        })),
      });
    }),

  getBatchJobStatus: protectedProcedure
    .input(z.object({ jobId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { getBatchJobStatus } = await import('@/server/batch/batch-service');
      return getBatchJobStatus(input.jobId, ctx.user!.id);
    }),

  getMyBatchJobs: protectedProcedure.query(async ({ ctx }) => {
    const { getUserBatchJobs } = await import('@/server/batch/batch-service');
    return getUserBatchJobs(ctx.user!.id);
  }),
});
