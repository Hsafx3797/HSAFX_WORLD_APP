import { z } from 'zod';
import { router, adminProcedure } from '../trpc';
import {
  users,
  subscriptions,
  coinTransactions,
  toolExecutions,
  plans,
  planLimits,
  planFeatures,
  toolCategories,
  tools,
  featureFlags,
  activityLogs,
  roles,
  permissions,
  rolePermissions,
  userRoles,
  adminSettings,
  streakTiers,
  referralConfig,
  rateLimitConfig,
  eq,
  desc,
  asc,
  sql,
  and,
  ilike,
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

  // ═══════════════════════════════════════════════════════════════
  // PLAN LIMITS CRUD
  // ═══════════════════════════════════════════════════════════════

  getPlanLimits: adminProcedure
    .input(z.object({ planId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(planLimits)
        .where(eq(planLimits.planId, input.planId))
        .orderBy(asc(planLimits.limitKey));
    }),

  updatePlanLimit: adminProcedure
    .input(z.object({
      id: z.string().uuid(),
      limitValue: z.number().int(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(planLimits)
        .set(data)
        .where(eq(planLimits.id, id))
        .returning();
      if (!updated) throw new TRPCError({ code: 'NOT_FOUND', message: 'Plan limit not found' });
      return updated;
    }),

  deletePlanLimit: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(planLimits)
        .where(eq(planLimits.id, input.id))
        .returning();
      if (!deleted) throw new TRPCError({ code: 'NOT_FOUND', message: 'Plan limit not found' });
      return deleted;
    }),

  // ═══════════════════════════════════════════════════════════════
  // PLAN FEATURES CRUD
  // ═══════════════════════════════════════════════════════════════

  getPlanFeatures: adminProcedure
    .input(z.object({ planId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(planFeatures)
        .where(eq(planFeatures.planId, input.planId))
        .orderBy(asc(planFeatures.featureKey));
    }),

  upsertPlanFeature: adminProcedure
    .input(z.object({
      planId: z.string().uuid(),
      featureKey: z.string().min(1),
      enabled: z.boolean().default(true),
      limitValue: z.number().int().optional(),
      metadata: z.record(z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [result] = await ctx.db
        .insert(planFeatures)
        .values(input)
        .onConflictDoUpdate({
          target: [planFeatures.planId, planFeatures.featureKey],
          set: {
            enabled: input.enabled,
            limitValue: input.limitValue,
            metadata: input.metadata,
          },
        })
        .returning();
      return result;
    }),

  deletePlanFeature: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(planFeatures)
        .where(eq(planFeatures.id, input.id))
        .returning();
      if (!deleted) throw new TRPCError({ code: 'NOT_FOUND', message: 'Plan feature not found' });
      return deleted;
    }),

  // ═══════════════════════════════════════════════════════════════
  // STREAK TIERS CRUD
  // ═══════════════════════════════════════════════════════════════

  getStreakTiers: adminProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(streakTiers)
      .orderBy(asc(streakTiers.sortOrder), asc(streakTiers.minDays));
  }),

  createStreakTier: adminProcedure
    .input(z.object({
      minDays: z.number().int().min(1),
      maxDays: z.number().int().min(1).optional(),
      name: z.string().min(1).max(100),
      coinsReward: z.number().int().min(0),
      badgeIcon: z.string().optional(),
      isActive: z.boolean().default(true),
      sortOrder: z.number().int().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const [tier] = await ctx.db.insert(streakTiers).values(input).returning();
      return tier;
    }),

  updateStreakTier: adminProcedure
    .input(z.object({
      id: z.string().uuid(),
      minDays: z.number().int().min(1).optional(),
      maxDays: z.number().int().min(1).nullable().optional(),
      name: z.string().min(1).max(100).optional(),
      coinsReward: z.number().int().min(0).optional(),
      badgeIcon: z.string().nullable().optional(),
      isActive: z.boolean().optional(),
      sortOrder: z.number().int().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(streakTiers)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(streakTiers.id, id))
        .returning();
      if (!updated) throw new TRPCError({ code: 'NOT_FOUND', message: 'Streak tier not found' });
      return updated;
    }),

  deleteStreakTier: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(streakTiers)
        .where(eq(streakTiers.id, input.id))
        .returning();
      if (!deleted) throw new TRPCError({ code: 'NOT_FOUND', message: 'Streak tier not found' });
      return deleted;
    }),

  // ═══════════════════════════════════════════════════════════════
  // REFERRAL CONFIG CRUD
  // ═══════════════════════════════════════════════════════════════

  getReferralConfig: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(referralConfig).orderBy(asc(referralConfig.key));
  }),

  upsertReferralConfig: adminProcedure
    .input(z.object({
      key: z.string().min(1).max(100),
      value: z.number().int(),
      description: z.string().optional(),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const [result] = await ctx.db
        .insert(referralConfig)
        .values({ ...input, updatedBy: ctx.user!.id })
        .onConflictDoUpdate({
          target: referralConfig.key,
          set: {
            value: input.value,
            description: input.description,
            isActive: input.isActive,
            updatedBy: ctx.user!.id,
            updatedAt: new Date(),
          },
        })
        .returning();
      return result;
    }),

  // ═══════════════════════════════════════════════════════════════
  // ADMIN SETTINGS (key/value config store)
  // ═══════════════════════════════════════════════════════════════

  getAdminSettings: adminProcedure
    .input(z.object({
      category: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      if (input?.category) {
        return ctx.db
          .select()
          .from(adminSettings)
          .where(eq(adminSettings.category, input.category));
      }
      return ctx.db.select().from(adminSettings);
    }),

  upsertAdminSetting: adminProcedure
    .input(z.object({
      key: z.string().min(1).max(255),
      value: z.unknown(),
      description: z.string().optional(),
      category: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [result] = await ctx.db
        .insert(adminSettings)
        .values({
          key: input.key,
          value: input.value,
          description: input.description,
          category: input.category,
          updatedBy: ctx.user!.id,
        })
        .onConflictDoUpdate({
          target: adminSettings.key,
          set: {
            value: input.value,
            description: input.description,
            category: input.category,
            updatedBy: ctx.user!.id,
            updatedAt: new Date(),
          },
        })
        .returning();
      return result;
    }),

  // ═══════════════════════════════════════════════════════════════
  // RATE LIMIT CONFIG
  // ═══════════════════════════════════════════════════════════════

  getRateLimitConfig: adminProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(rateLimitConfig)
      .orderBy(asc(rateLimitConfig.planSlug), asc(rateLimitConfig.endpoint));
  }),

  upsertRateLimitConfig: adminProcedure
    .input(z.object({
      planSlug: z.string().min(1).max(50),
      endpoint: z.string().min(1).max(100).default('global'),
      requestsPerMinute: z.number().int().min(0),
      requestsPerHour: z.number().int().min(0).optional(),
      requestsPerDay: z.number().int().min(0).optional(),
      burstLimit: z.number().int().min(0).optional(),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const [result] = await ctx.db
        .insert(rateLimitConfig)
        .values({ ...input, updatedBy: ctx.user!.id })
        .onConflictDoUpdate({
          target: [rateLimitConfig.planSlug, rateLimitConfig.endpoint],
          set: {
            requestsPerMinute: input.requestsPerMinute,
            requestsPerHour: input.requestsPerHour,
            requestsPerDay: input.requestsPerDay,
            burstLimit: input.burstLimit,
            isActive: input.isActive,
            updatedBy: ctx.user!.id,
            updatedAt: new Date(),
          },
        })
        .returning();
      return result;
    }),

  // ═══════════════════════════════════════════════════════════════
  // ANALYTICS ENDPOINTS (Q9)
  // ═══════════════════════════════════════════════════════════════

  getAnalyticsOverview: adminProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const start = new Date(input.startDate);
      const end = new Date(input.endDate);

      const [userGrowth] = await ctx.db
        .select({
          total: sql<number>`count(*)`,
          newInRange: sql<number>`count(*) filter (where ${users.createdAt} >= ${start} and ${users.createdAt} <= ${end})`,
        })
        .from(users);

      const [executions] = await ctx.db
        .select({
          total: sql<number>`count(*)`,
          inRange: sql<number>`count(*) filter (where ${toolExecutions.createdAt} >= ${start} and ${toolExecutions.createdAt} <= ${end})`,
        })
        .from(toolExecutions);

      const [revenue] = await ctx.db
        .select({
          total: sql<number>`coalesce(sum(${coinTransactions.amount}), 0)`,
          inRange: sql<number>`coalesce(sum(${coinTransactions.amount}) filter (where ${coinTransactions.createdAt} >= ${start} and ${coinTransactions.createdAt} <= ${end}), 0)`,
        })
        .from(coinTransactions)
        .where(eq(coinTransactions.type, 'purchase'));

      return {
        userGrowth: userGrowth ?? { total: 0, newInRange: 0 },
        executions: executions ?? { total: 0, inRange: 0 },
        revenue: revenue ?? { total: 0, inRange: 0 },
      };
    }),

  getUserCohortAnalysis: adminProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      interval: z.enum(['day', 'week', 'month']).default('week'),
    }))
    .query(async ({ ctx, input }) => {
      const start = new Date(input.startDate);
      const end = new Date(input.endDate);
      const trunc = input.interval === 'day' ? 'day' : input.interval === 'week' ? 'week' : 'month';

      const cohorts = await ctx.db.execute(sql`
        SELECT
          date_trunc(${sql.raw(`'${trunc}'`)}, ${users.createdAt}) as cohort,
          count(distinct ${users.id}) as users_count,
          count(distinct ${toolExecutions.userId}) as active_users
        FROM ${users}
        LEFT JOIN ${toolExecutions} ON ${toolExecutions.userId} = ${users.id}
          AND ${toolExecutions.createdAt} >= ${start}
          AND ${toolExecutions.createdAt} <= ${end}
        WHERE ${users.createdAt} >= ${start}
          AND ${users.createdAt} <= ${end}
        GROUP BY cohort
        ORDER BY cohort
      `);

      return cohorts.rows ?? [];
    }),

  getFunnelAnalysis: adminProcedure.query(async ({ ctx }) => {
    const [registered] = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    const [verified] = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.emailVerified, true));

    const [executed] = await ctx.db
      .select({ count: sql<number>`count(distinct ${toolExecutions.userId})` })
      .from(toolExecutions);

    const [subscribed] = await ctx.db
      .select({ count: sql<number>`count(distinct ${subscriptions.userId})` })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));

    return {
      steps: [
        { name: 'Registered', count: registered?.count ?? 0 },
        { name: 'Email Verified', count: verified?.count ?? 0 },
        { name: 'Used a Tool', count: executed?.count ?? 0 },
        { name: 'Subscribed', count: subscribed?.count ?? 0 },
      ],
    };
  }),

  getToolUsageBreakdown: adminProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      limit: z.number().int().min(1).max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const start = new Date(input.startDate);
      const end = new Date(input.endDate);

      const breakdown = await ctx.db
        .select({
          toolId: toolExecutions.toolId,
          toolName: tools.name,
          categoryName: toolCategories.name,
          count: sql<number>`count(*)`,
          uniqueUsers: sql<number>`count(distinct ${toolExecutions.userId})`,
        })
        .from(toolExecutions)
        .leftJoin(tools, eq(tools.id, toolExecutions.toolId))
        .leftJoin(toolCategories, eq(toolCategories.id, tools.categoryId))
        .where(
          and(
            sql`${toolExecutions.createdAt} >= ${start}`,
            sql`${toolExecutions.createdAt} <= ${end}`
          )
        )
        .groupBy(toolExecutions.toolId, tools.name, toolCategories.name)
        .orderBy(sql`count(*) desc`)
        .limit(input.limit);

      return breakdown;
    }),

  getRevenueTimeSeries: adminProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      interval: z.enum(['day', 'week', 'month']).default('day'),
    }))
    .query(async ({ ctx, input }) => {
      const start = new Date(input.startDate);
      const end = new Date(input.endDate);
      const trunc = input.interval;

      const series = await ctx.db.execute(sql`
        SELECT
          date_trunc(${sql.raw(`'${trunc}'`)}, ${coinTransactions.createdAt}) as period,
          coalesce(sum(${coinTransactions.amount}), 0) as revenue,
          count(*) as transactions
        FROM ${coinTransactions}
        WHERE ${coinTransactions.type} = 'purchase'
          AND ${coinTransactions.createdAt} >= ${start}
          AND ${coinTransactions.createdAt} <= ${end}
        GROUP BY period
        ORDER BY period
      `);

      return series.rows ?? [];
    }),

  getUserRetention: adminProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const start = new Date(input.startDate);
      const end = new Date(input.endDate);

      const retention = await ctx.db.execute(sql`
        WITH user_activity AS (
          SELECT
            ${toolExecutions.userId},
            date_trunc('week', min(${toolExecutions.createdAt})) as first_week,
            date_trunc('week', ${toolExecutions.createdAt}) as activity_week
          FROM ${toolExecutions}
          WHERE ${toolExecutions.createdAt} >= ${start}
            AND ${toolExecutions.createdAt} <= ${end}
          GROUP BY ${toolExecutions.userId}, date_trunc('week', ${toolExecutions.createdAt})
        )
        SELECT
          first_week as cohort,
          extract(epoch from (activity_week - first_week)) / 604800 as week_number,
          count(distinct ${sql.raw('"user_id"')}) as users
        FROM user_activity
        GROUP BY first_week, week_number
        ORDER BY first_week, week_number
      `);

      return retention.rows ?? [];
    }),

  getChurnAnalysis: adminProcedure
    .input(z.object({
      daysInactive: z.number().int().min(1).default(30),
    }))
    .query(async ({ ctx, input }) => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - input.daysInactive);

      const [activeUsers] = await ctx.db
        .select({ count: sql<number>`count(distinct ${toolExecutions.userId})` })
        .from(toolExecutions)
        .where(sql`${toolExecutions.createdAt} >= ${cutoff}`);

      const [totalUsers] = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(users);

      const total = totalUsers?.count ?? 0;
      const active = activeUsers?.count ?? 0;
      const churned = total - active;

      return {
        totalUsers: total,
        activeUsers: active,
        churnedUsers: churned,
        churnRate: total > 0 ? ((churned / total) * 100).toFixed(2) : '0',
        daysInactive: input.daysInactive,
      };
    }),

  getSystemHealth: adminProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const [recentExecs] = await ctx.db
      .select({
        count: sql<number>`count(*)`,
        avgDuration: sql<number>`coalesce(avg(${toolExecutions.executionTime}), 0)`,
        errorCount: sql<number>`count(*) filter (where ${toolExecutions.status} = 'error')`,
      })
      .from(toolExecutions)
      .where(sql`${toolExecutions.createdAt} >= ${fiveMinAgo}`);

    return {
      recentExecutions: recentExecs?.count ?? 0,
      avgResponseTime: Math.round(recentExecs?.avgDuration ?? 0),
      errorRate: recentExecs?.count
        ? ((recentExecs.errorCount / recentExecs.count) * 100).toFixed(2)
        : '0',
      timestamp: now.toISOString(),
    };
  }),
});
