import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, adminProcedure } from '../trpc';
import {
  tools,
  toolCategories,
  toolLimits,
  toolExecutions,
  usageCounters,
  coinTransactions,
  eq,
  and,
  desc,
  isNull,
  sql,
} from '@hsafx/db/schema';
import { TRPCError } from '@trpc/server';

// Lazy import for server execution layer (only in Next.js runtime)
type ExecuteToolInput = {
  toolId: string;
  inputs: Record<string, unknown>;
  userId: string;
  idempotencyKey?: string;
};
type ExecuteToolResult = {
  status: 'completed' | 'queued';
  result?: unknown;
  jobId?: string;
  executionId: string;
  coinsCharged: number;
  duration?: number;
};

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
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.pageSize;

      let query = ctx.db
        .select()
        .from(tools)
        .where(and(eq(tools.isActive, true), isNull(tools.deletedAt)));

      const items = await ctx.db
        .select()
        .from(tools)
        .where(and(eq(tools.isActive, true), isNull(tools.deletedAt)))
        .orderBy(tools.sortOrder)
        .limit(input.pageSize)
        .offset(offset);

      return { items, page: input.page, pageSize: input.pageSize };
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

  execute: protectedProcedure
    .input(z.object({
      toolId: z.string().uuid(),
      inputs: z.record(z.unknown()),
      idempotencyKey: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [tool] = await ctx.db
        .select()
        .from(tools)
        .where(eq(tools.id, input.toolId))
        .limit(1);

      if (!tool) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tool not found' });
      }

      if (!tool.isActive) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Tool is disabled' });
      }

      try {
        // Delegate to the server execution layer which handles:
        // - Cost calculation with BA weights & plan discounts
        // - Atomic coin deduction / reservation
        // - Sync execution (wasm/node) or async job creation (python/native)
        // - Usage counter increment
        // - Execution audit logging
        const { executeToolServer } = (await import(
          '@/server/tool-execution'
        )) as { executeToolServer: (input: ExecuteToolInput) => Promise<ExecuteToolResult> };

        const result = await executeToolServer({
          toolId: input.toolId,
          inputs: input.inputs,
          userId: ctx.user!.id,
          idempotencyKey: input.idempotencyKey,
        });

        return {
          executionId: result.executionId,
          status: result.status,
          result: result.result,
          jobId: result.jobId,
          coinsCharged: result.coinsCharged,
          duration: result.duration,
          tool,
        };
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'name' in err && err.name === 'InsufficientCoinsError') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: (err as Error).message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err instanceof Error ? err.message : 'Execution failed',
        });
      }
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
    }))
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.pageSize;

      const items = await ctx.db
        .select()
        .from(toolExecutions)
        .where(eq(toolExecutions.userId, ctx.user!.id))
        .orderBy(desc(toolExecutions.createdAt))
        .limit(input.pageSize)
        .offset(offset);

      return { items, page: input.page, pageSize: input.pageSize };
    }),

  create: adminProcedure
    .input(z.object({
      categoryId: z.string().uuid(),
      name: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().min(1),
      longDescription: z.string().optional(),
      toolGroup: z.number().int().min(1).max(5),
      runtime: z.enum(['wasm', 'node', 'python', 'browser']),
      executionMode: z.enum(['client', 'server', 'hybrid']),
      coinCost: z.number().int().min(0).default(0),
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
      coinCost: z.number().int().min(0).optional(),
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
});
