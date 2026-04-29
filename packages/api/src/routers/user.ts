import { z } from 'zod';
import { hashPassword, verifyPassword } from 'better-auth/crypto';
import { router, publicProcedure, protectedProcedure, adminProcedure } from '../trpc';
import { users, userPreferences, userSettings, sessions, userOnboarding, plans, planLimits, oauthConnections, eq, and, ne, or, ilike, isNotNull } from '@hsafx/db/schema';
import { TRPCError } from '@trpc/server';
import { getUserPlan } from '../helpers/get-user-plan';

export const userRouter = router({
  /** Public: check if an email is already registered (for signup form). */
  checkEmailAvailability: publicProcedure
    .input(z.object({ email: z.string().email().max(255) }))
    .query(async ({ ctx, input }) => {
      const normalized = input.email.toLowerCase().trim();
      const existing = await ctx.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, normalized))
        .limit(1);
      return { available: existing.length === 0 };
    }),

  checkUsernameAvailability: publicProcedure
    .input(z.object({ username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/) }))
    .query(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, input.username))
        .limit(1);
      return { available: existing.length === 0 };
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),

  /** Returns the caller's current plan slug and DB-backed limits. */
  getMyPlan: protectedProcedure.query(async ({ ctx }) => {
    const plan = await getUserPlan(ctx.user!.id);

    // Fetch plan limits from DB in a single query
    const rows = await ctx.db
      .select({ key: planLimits.limitKey, value: planLimits.limitValue })
      .from(planLimits)
      .innerJoin(plans, eq(plans.id, planLimits.planId))
      .where(eq(plans.slug, plan));

    const limits: Record<string, number> = {};
    for (const r of rows) {
      limits[r.key] = r.value;
    }

    return { plan, limits };
  }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await ctx.db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user!.id))
      .limit(1);

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
    }

    const [preferences] = await ctx.db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id))
      .limit(1);

    const [settings] = await ctx.db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, user.id))
      .limit(1);

    return { user, preferences, settings };
  }),

  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100).optional(),
      username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/).optional(),
      image: z.string().url().optional(),
      phoneNumber: z.string().max(20).optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Username uniqueness check
      if (input.username) {
        const [existing] = await ctx.db
          .select({ id: users.id })
          .from(users)
          .where(and(eq(users.username, input.username), ne(users.id, ctx.user!.id)))
          .limit(1);

        if (existing) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Username is already taken' });
        }
      }

      const [updated] = await ctx.db
        .update(users)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(users.id, ctx.user!.id))
        .returning();

      return updated;
    }),

  updatePreferences: protectedProcedure
    .input(z.object({
      theme: z.enum(['light', 'dark', 'system']).optional(),
      language: z.string().length(2).optional(),
      timezone: z.string().optional(),
      extras: z.record(z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { extras, ...columns } = input;

      // Read existing for merging jsonb extras
      const [existing] = await ctx.db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, ctx.user!.id))
        .limit(1);

      const mergedPrefs = extras
        ? { ...(existing?.preferences as Record<string, unknown> ?? {}), ...extras }
        : undefined;

      const setData = {
        ...columns,
        ...(mergedPrefs !== undefined ? { preferences: mergedPrefs } : {}),
      };

      const [result] = await ctx.db
        .insert(userPreferences)
        .values({ userId: ctx.user!.id, ...setData })
        .onConflictDoUpdate({
          target: userPreferences.userId,
          set: setData,
        })
        .returning();
      return result;
    }),

  updateSettings: protectedProcedure
    .input(z.object({
      emailNotifications: z.boolean().optional(),
      pushNotifications: z.boolean().optional(),
      marketingEmails: z.boolean().optional(),
      extras: z.record(z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { extras, ...columns } = input;

      // Read existing for merging jsonb extras
      const [existing] = await ctx.db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, ctx.user!.id))
        .limit(1);

      const mergedSettings = extras
        ? { ...(existing?.settings as Record<string, unknown> ?? {}), ...extras }
        : undefined;

      const setData = {
        ...columns,
        ...(mergedSettings !== undefined ? { settings: mergedSettings } : {}),
      };

      const [result] = await ctx.db
        .insert(userSettings)
        .values({ userId: ctx.user!.id, ...setData })
        .onConflictDoUpdate({
          target: userSettings.userId,
          set: setData,
        })
        .returning();
      return result;
    }),

  list: adminProcedure
    .input(z.object({
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(20),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.pageSize;

      const where = input.search
        ? or(
            ilike(users.name, `%${input.search}%`),
            ilike(users.email, `%${input.search}%`),
          )
        : undefined;

      const items = await ctx.db
        .select()
        .from(users)
        .where(where)
        .limit(input.pageSize)
        .offset(offset);

      return { items, page: input.page, pageSize: input.pageSize };
    }),

  getById: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [user] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, input.id))
        .limit(1);

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      return user;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .update(users)
        .set({ deletedAt: new Date() })
        .where(eq(users.id, input.id))
        .returning();

      return deleted;
    }),

  // ─── Password Management ─────────────────────────────────

  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z
          .string()
          .min(8, 'Password must be at least 8 characters')
          .max(128, 'Password must be at most 128 characters')
          .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
          .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
          .regex(/\d/, 'Password must contain at least one number')
          .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.id;

      // Fetch credential account (better-auth stores passwords in oauthConnections)
      const [account] = await ctx.db
        .select({ id: oauthConnections.id, password: oauthConnections.password })
        .from(oauthConnections)
        .where(and(eq(oauthConnections.userId, userId), eq(oauthConnections.providerId, 'credential'), isNotNull(oauthConnections.password)))
        .limit(1);

      if (!account?.password) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No password set. Use password reset instead.',
        });
      }

      const isCorrect = await verifyPassword({ hash: account.password, password: input.currentPassword });
      if (!isCorrect) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Current password is incorrect',
        });
      }

      // Hash new password using better-auth format
      const newPasswordHash = await hashPassword(input.newPassword);

      // Update password in credential account
      await ctx.db
        .update(oauthConnections)
        .set({ password: newPasswordHash, updatedAt: new Date() })
        .where(and(eq(oauthConnections.userId, userId), eq(oauthConnections.providerId, 'credential')));

      // Invalidate all other sessions (keep current session active)
      if (ctx.session?.id) {
        await ctx.db
          .delete(sessions)
          .where(
            and(
              eq(sessions.userId, userId),
              ne(sessions.id, ctx.session.id),
            ),
          );
      }

      return { success: true };
    }),

  hasPassword: protectedProcedure.query(async ({ ctx }) => {
    const [account] = await ctx.db
      .select({ id: oauthConnections.id })
      .from(oauthConnections)
      .where(and(eq(oauthConnections.userId, ctx.user!.id), eq(oauthConnections.providerId, 'credential'), isNotNull(oauthConnections.password)))
      .limit(1);
    return { hasPassword: !!account };
  }),

  verifyCurrentPassword: protectedProcedure
    .input(z.object({ password: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [account] = await ctx.db
        .select({ password: oauthConnections.password })
        .from(oauthConnections)
        .where(and(eq(oauthConnections.userId, ctx.user!.id), eq(oauthConnections.providerId, 'credential'), isNotNull(oauthConnections.password)))
        .limit(1);
      if (!account?.password) return { valid: false };
      try {
        return { valid: await verifyPassword({ hash: account.password, password: input.password }) };
      } catch {
        return { valid: false };
      }
    }),

  // ─── Onboarding ───────────────────────────────────────────

  getOnboarding: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db
      .select()
      .from(userOnboarding)
      .where(eq(userOnboarding.userId, ctx.user!.id))
      .limit(1);

    return {
      completed: !!row?.completedAt,
      skipped: !!row?.skippedAt,
      selectedCategories: (row?.selectedCategories ?? []) as string[],
      firstToolUsed: row?.firstToolUsed ?? null,
    };
  }),

  completeOnboarding: protectedProcedure
    .input(
      z.object({
        selectedCategories: z.array(z.string()).min(1).max(12),
        firstToolUsed: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.id;

      await ctx.db
        .insert(userOnboarding)
        .values({
          userId,
          completedAt: new Date(),
          selectedCategories: input.selectedCategories,
          firstToolUsed: input.firstToolUsed ?? null,
        })
        .onConflictDoUpdate({
          target: [userOnboarding.userId],
          set: {
            completedAt: new Date(),
            selectedCategories: input.selectedCategories,
            firstToolUsed: input.firstToolUsed ?? null,
          },
        });

      return { success: true };
    }),

  skipOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .insert(userOnboarding)
      .values({
        userId: ctx.user!.id,
        skippedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [userOnboarding.userId],
        set: { skippedAt: new Date() },
      });

    return { success: true };
  }),

  getChecklist: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db
      .select()
      .from(userOnboarding)
      .where(eq(userOnboarding.userId, ctx.user!.id))
      .limit(1);

    return (row?.checklistProgress ?? {}) as Record<string, boolean>;
  }),

  completeChecklistStep: protectedProcedure
    .input(z.object({ step: z.string().min(1).max(50) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.id;

      // Ensure onboarding row exists
      const [row] = await ctx.db
        .select()
        .from(userOnboarding)
        .where(eq(userOnboarding.userId, userId))
        .limit(1);

      const current = (row?.checklistProgress ?? {}) as Record<string, boolean>;
      if (current[input.step]) return { alreadyCompleted: true };

      const updated = { ...current, [input.step]: true };

      if (row) {
        await ctx.db
          .update(userOnboarding)
          .set({ checklistProgress: updated })
          .where(eq(userOnboarding.userId, userId));
      } else {
        await ctx.db
          .insert(userOnboarding)
          .values({ userId, checklistProgress: updated });
      }

      return { alreadyCompleted: false };
    }),

  // ─── Account Deletion ────────────────────────────────────

  getDeletionStatus: protectedProcedure.query(async ({ ctx }) => {
    // @ts-ignore — @/ alias resolves at Next.js runtime
    const { getDeletionStatus } = await import('@/server/account/deletion-service');
    return getDeletionStatus(ctx.user!.id);
  }),

  requestDeletion: protectedProcedure
    .input(z.object({ password: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.id;

      // Verify password before allowing deletion
      const [account] = await ctx.db
        .select({ password: oauthConnections.password })
        .from(oauthConnections)
        .where(and(eq(oauthConnections.userId, userId), eq(oauthConnections.providerId, 'credential'), isNotNull(oauthConnections.password)))
        .limit(1);

      if (!account?.password) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No password set on this account.' });
      }

      const isValid = await verifyPassword({ hash: account.password, password: input.password });
      if (!isValid) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Incorrect password.' });
      }

      // @ts-ignore — @/ alias resolves at Next.js runtime
      const { requestAccountDeletion } = await import('@/server/account/deletion-service');
      return requestAccountDeletion(userId);
    }),

  cancelDeletion: protectedProcedure.mutation(async ({ ctx }) => {
    // @ts-ignore — @/ alias resolves at Next.js runtime
    const { cancelAccountDeletion } = await import('@/server/account/deletion-service');
    await cancelAccountDeletion(ctx.user!.id);
    return { success: true };
  }),

  // ─── Referral Program (T3.1) ─────────────────────────────

  getReferralStats: protectedProcedure.query(async ({ ctx }) => {
    const { getReferralStats } = await import('@/server/referral/referral-service');
    return getReferralStats(ctx.user!.id);
  }),

  getMyReferralCode: protectedProcedure.query(async ({ ctx }) => {
    const { getOrCreateReferralCode } = await import('@/server/referral/referral-service');
    const code = await getOrCreateReferralCode(ctx.user!.id);
    return { code };
  }),

  trackReferral: protectedProcedure
    .input(z.object({ referralCode: z.string().min(1).max(20) }))
    .mutation(async ({ ctx, input }) => {
      const { trackReferralSignup } = await import('@/server/referral/referral-service');
      return trackReferralSignup(input.referralCode, ctx.user!.id);
    }),

  // ─── Social Account Linking (T1.2) ─────────────────────────

  getLinkedAccounts: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: oauthConnections.id,
        provider: oauthConnections.providerId,
        providerUserId: oauthConnections.accountId,
        createdAt: oauthConnections.createdAt,
      })
      .from(oauthConnections)
      .where(eq(oauthConnections.userId, ctx.user!.id));
    return rows;
  }),

  unlinkAccount: protectedProcedure
    .input(z.object({ provider: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.id;

      // Check how many auth methods the user has
      const [user] = await ctx.db
        .select({ passwordHash: users.passwordHash })
        .from(users)
        .where(eq(users.id, userId));

      const linkedAccounts = await ctx.db
        .select({ id: oauthConnections.id, provider: oauthConnections.providerId })
        .from(oauthConnections)
        .where(eq(oauthConnections.userId, userId));

      const hasPassword = !!user?.passwordHash;
      const otherProviders = linkedAccounts.filter((a) => a.provider !== input.provider);

      // Must keep at least 1 auth method
      if (!hasPassword && otherProviders.length === 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Cannot unlink your only authentication method. Set a password first or link another provider.',
        });
      }

      const deleted = await ctx.db
        .delete(oauthConnections)
        .where(and(eq(oauthConnections.userId, userId), eq(oauthConnections.providerId, input.provider)))
        .returning({ id: oauthConnections.id });

      if (deleted.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Account not linked' });
      }

      return { success: true };
    }),

  // ─── GDPR Data Export (T3.3) ──────────────────────────────

  requestDataExport: protectedProcedure.mutation(async ({ ctx }) => {
    const { requestDataExport } = await import('@/server/gdpr/gdpr-export-service');
    return requestDataExport(ctx.user!.id, ctx.user!.email);
  }),
});
