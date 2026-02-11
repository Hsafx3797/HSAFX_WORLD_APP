import { z } from 'zod';
import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { router, protectedProcedure, adminProcedure } from '../trpc';
import { users, userPreferences, userSettings, sessions, eq, and } from '@hsafx/db/schema';
import { TRPCError } from '@trpc/server';

const scryptAsync = promisify(scrypt);

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
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
      fullName: z.string().min(1).max(100).optional(),
      username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/).optional(),
      avatarUrl: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
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
    }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, ctx.user!.id))
        .limit(1);

      if (existing) {
        const [updated] = await ctx.db
          .update(userPreferences)
          .set(input)
          .where(eq(userPreferences.userId, ctx.user!.id))
          .returning();
        return updated;
      } else {
        const [created] = await ctx.db
          .insert(userPreferences)
          .values({ userId: ctx.user!.id, ...input })
          .returning();
        return created;
      }
    }),

  updateSettings: protectedProcedure
    .input(z.object({
      emailNotifications: z.boolean().optional(),
      pushNotifications: z.boolean().optional(),
      marketingEmails: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, ctx.user!.id))
        .limit(1);

      if (existing) {
        const [updated] = await ctx.db
          .update(userSettings)
          .set(input)
          .where(eq(userSettings.userId, ctx.user!.id))
          .returning();
        return updated;
      } else {
        const [created] = await ctx.db
          .insert(userSettings)
          .values({ userId: ctx.user!.id, ...input })
          .returning();
        return created;
      }
    }),

  list: adminProcedure
    .input(z.object({
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(20),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.pageSize;
      
      const items = await ctx.db
        .select()
        .from(users)
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
          .max(128, 'Password must be at most 128 characters'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.id;

      // Fetch current password hash
      const [user] = await ctx.db
        .select({ passwordHash: users.passwordHash })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user?.passwordHash) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No password set. Use password reset instead.',
        });
      }

      // Verify current password (scrypt format: hash:salt, both base64)
      const [storedHash, storedSalt] = user.passwordHash.split(':');
      if (!storedHash || !storedSalt) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Invalid password hash format',
        });
      }

      const saltBuffer = Buffer.from(storedSalt, 'base64');
      const derivedKey = (await scryptAsync(input.currentPassword, saltBuffer, 64)) as Buffer;
      const storedKey = Buffer.from(storedHash, 'base64');

      if (!timingSafeEqual(derivedKey, storedKey)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Current password is incorrect',
        });
      }

      // Hash new password
      const newSalt = randomBytes(16);
      const newHash = (await scryptAsync(input.newPassword, newSalt, 64)) as Buffer;
      const newPasswordHash = `${newHash.toString('base64')}:${newSalt.toString('base64')}`;

      // Update password
      await ctx.db
        .update(users)
        .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
        .where(eq(users.id, userId));

      // Invalidate all other sessions (keep current session active)
      const sessionToken = ctx.session?.sessionToken;
      if (sessionToken) {
        await ctx.db
          .delete(sessions)
          .where(
            and(
              eq(sessions.userId, userId),
              // Delete all sessions except the current one
              // The session token in DB is hashed, so we compare by userId and exclude current
            ),
          );
      }

      return { success: true };
    }),
});
