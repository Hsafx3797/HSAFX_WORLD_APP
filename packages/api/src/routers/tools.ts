import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, adminProcedure, planGatedProcedure } from '../trpc';
import {
  tools,
  toolCategories,
  toolLimits,
  toolExecutions,
  usageCounters,
  coinTransactions,
  dailyProTrials,
  eq,
  and,
  desc,
  isNull,
  sql,
} from '@hsafx/db/schema';
import { TRPCError } from '@trpc/server';
import { isPlanAtLeast } from '@hsafx/shared/permissions';
import type { UserPlan } from '@hsafx/shared/permissions';

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

  execute: planGatedProcedure
    .input(z.object({
      toolId: z.string().uuid(),
      inputs: z.record(z.unknown()),
      idempotencyKey: z.string().optional(),
      isTrialExecution: z.boolean().optional(),
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

      // Plan-based access check: premium tools require 'pro' or higher
      // Allow trial executions for free/guest users (1 per day)
      if (tool.isPremium && !isPlanAtLeast(ctx.plan as UserPlan, 'pro')) {
        if (input.isTrialExecution) {
          const { consumeTrial } = (await import('@/server/limits/pro-trial-service')) as {
            consumeTrial: (userId: string, toolId: string) => Promise<{ success: boolean; reason?: string }>;
          };
          const trialResult = await consumeTrial(ctx.user!.id, input.toolId);
          if (!trialResult.success) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: trialResult.reason ?? 'No free trials remaining today',
            });
          }
        } else {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'This tool requires a Pro or Advance subscription',
          });
        }
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

  // ─── Pro Trial Endpoints (T2.6) ─────────────────────────────

  getTrialStatus: protectedProcedure.query(async ({ ctx }) => {
    const { getTrialStatus } = (await import('@/server/limits/pro-trial-service')) as {
      getTrialStatus: (userId: string) => Promise<{ trialsUsedToday: number; trialsRemaining: number; maxTrialsPerDay: number }>;
    };
    return getTrialStatus(ctx.user!.id);
  }),

  useProTrial: protectedProcedure
    .input(z.object({ toolId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { consumeTrial } = (await import('@/server/limits/pro-trial-service')) as {
        consumeTrial: (userId: string, toolId: string) => Promise<{ success: boolean; remaining?: number; reason?: string }>;
      };
      const result = await consumeTrial(ctx.user!.id, input.toolId);
      if (!result.success) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: result.reason ?? 'No free trials remaining today',
        });
      }
      return { remaining: result.remaining ?? 0 };
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

  // ─── User Analytics (T3.2) ────────────────────────────────

  getAnalytics: protectedProcedure.query(async ({ ctx }) => {
    const { getUserAnalytics } = await import('@/server/analytics/analytics-service');
    return getUserAnalytics(ctx.user!.id);
  }),

  // ─── Batch Processing (T3.8) ─────────────────────────────

  createBatchJob: planGatedProcedure
    .input(z.object({
      toolId: z.string().uuid(),
      inputs: z.array(z.record(z.unknown())).min(1).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      const { createBatchJob } = await import('@/server/batch/batch-service');
      return createBatchJob({
        userId: ctx.user!.id,
        jobType: input.toolId,
        files: input.inputs.map((item, idx) => ({
          filename: `input-${idx}`,
          storageKey: `batch/${ctx.user!.id}/${input.toolId}/${idx}`,
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
