import { z } from 'zod';
import { router, adminProcedure } from '../trpc';
import {
  users,
  subscriptions,
  coinTransactions,
  toolExecutions,
  plans,
  planLimits,
  toolCategories,
  tools,
  featureFlags,
  activityLogs,
  roles,
  permissions,
  rolePermissions,
  userRoles,
  eq,
  desc,
  sql,
  and,
} from '@hsafx/db/schema';
import { TRPCError } from '@trpc/server';

export const adminRouter = router({
  getDashboardStats: adminProcedure.query(async ({ ctx }) => {
    const [userCount] = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    const [activeSubCount] = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));

    const [todayExecutions] = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(toolExecutions)
      .where(sql`DATE(${toolExecutions.createdAt}) = CURRENT_DATE`);

    const [todayRevenue] = await ctx.db
      .select({ total: sql<number>`COALESCE(SUM(${coinTransactions.amount}), 0)` })
      .from(coinTransactions)
      .where(
        and(
          eq(coinTransactions.type, 'purchase'),
          sql`DATE(${coinTransactions.createdAt}) = CURRENT_DATE`
        )
      );

    return {
      totalUsers: userCount?.count ?? 0,
      activeSubscriptions: activeSubCount?.count ?? 0,
      todayExecutions: todayExecutions?.count ?? 0,
      todayRevenue: todayRevenue?.total ?? 0,
    };
  }),

  getRecentActivity: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(20) }))
    .query(async ({ ctx, input }) => {
      const logs = await ctx.db
        .select()
        .from(activityLogs)
        .orderBy(desc(activityLogs.createdAt))
        .limit(input.limit);

      return logs;
    }),

  getPlans: adminProcedure.query(async ({ ctx }) => {
    const allPlans = await ctx.db.select().from(plans);
    return allPlans;
  }),

  createPlan: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().optional(),
      priceMonthly: z.string().optional(),
      priceYearly: z.string().optional(),
      coinGrant: z.number().int().min(0).default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const [plan] = await ctx.db.insert(plans).values(input).returning();
      return plan;
    }),

  updatePlan: adminProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      priceMonthly: z.string().optional(),
      priceYearly: z.string().optional(),
      coinGrant: z.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(plans)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(plans.id, id))
        .returning();
      return updated;
    }),

  createPlanLimit: adminProcedure
    .input(z.object({
      planId: z.string().uuid(),
      limitKey: z.string(),
      limitValue: z.number().int(),
      unit: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [limit] = await ctx.db.insert(planLimits).values(input).returning();
      return limit;
    }),

  getFeatureFlags: adminProcedure.query(async ({ ctx }) => {
    const flags = await ctx.db.select().from(featureFlags);
    return flags;
  }),

  updateFeatureFlag: adminProcedure
    .input(z.object({
      id: z.string().uuid(),
      isEnabled: z.boolean().optional(),
      rolloutPercentage: z.number().int().min(0).max(100).optional(),
      targetUsers: z.array(z.string()).optional(),
      targetRoles: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(featureFlags)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(featureFlags.id, id))
        .returning();
      return updated;
    }),

  createFeatureFlag: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      isEnabled: z.boolean().default(false),
      rolloutPercentage: z.number().int().min(0).max(100).default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const [flag] = await ctx.db.insert(featureFlags).values(input).returning();
      return flag;
    }),

  getRoles: adminProcedure.query(async ({ ctx }) => {
    const allRoles = await ctx.db.select().from(roles);
    return allRoles;
  }),

  getPermissions: adminProcedure.query(async ({ ctx }) => {
    const allPermissions = await ctx.db.select().from(permissions);
    return allPermissions;
  }),

  assignRoleToUser: adminProcedure
    .input(z.object({
      userId: z.string().uuid(),
      roleId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [assignment] = await ctx.db
        .insert(userRoles)
        .values(input)
        .returning();
      return assignment;
    }),

  removeRoleFromUser: adminProcedure
    .input(z.object({
      userId: z.string().uuid(),
      roleId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(userRoles)
        .where(
          and(
            eq(userRoles.userId, input.userId),
            eq(userRoles.roleId, input.roleId)
          )
        );
      return { success: true };
    }),

  createCategory: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().optional(),
      parentId: z.string().uuid().optional(),
      icon: z.string().optional(),
      sortOrder: z.number().int().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const [category] = await ctx.db
        .insert(toolCategories)
        .values(input)
        .returning();
      return category;
    }),

  updateCategory: adminProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      icon: z.string().optional(),
      sortOrder: z.number().int().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(toolCategories)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(toolCategories.id, id))
        .returning();
      return updated;
    }),

  // ─── Category Deletion ────────────────────────────────────

  deleteCategory: adminProcedure
    .input(z.object({ categoryId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check if any tools reference this category
      const toolsInCategory = await ctx.db
        .select({ id: tools.id })
        .from(tools)
        .where(eq(tools.categoryId, input.categoryId))
        .limit(1);

      if (toolsInCategory.length > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message:
            'Cannot delete category that has tools assigned. Reassign or remove tools first.',
        });
      }

      // Hard-delete the category (no tools reference it)
      const [deleted] = await ctx.db
        .delete(toolCategories)
        .where(eq(toolCategories.id, input.categoryId))
        .returning();

      if (!deleted) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Category not found',
        });
      }

      // Write audit log
      await ctx.db.insert(activityLogs).values({
        userId: ctx.user!.id,
        action: 'delete_category',
        resource: 'tool_category',
        resourceId: input.categoryId,
        metadata: { categoryName: deleted.name },
      } as typeof activityLogs.$inferInsert);

      return deleted;
    }),
});
