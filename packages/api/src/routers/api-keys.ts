import { z } from 'zod';
import { randomBytes, createHash } from 'node:crypto';
import { router, protectedProcedure } from '../trpc';
import { apiKeys, eq, and, desc } from '@hsafx/db/schema';
import { TRPCError } from '@trpc/server';

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export const apiKeysRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const keys = await ctx.db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        scopes: apiKeys.scopes,
        lastUsed: apiKeys.lastUsed,
        expiresAt: apiKeys.expiresAt,
        isActive: apiKeys.isActive,
        createdAt: apiKeys.createdAt,
        revokedAt: apiKeys.revokedAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, ctx.user!.id))
      .orderBy(desc(apiKeys.createdAt));

    return keys;
  }),

  generate: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100).default('Default'),
      scopes: z.array(z.string()).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      // Limit to 5 active keys per user
      const activeKeys = await ctx.db
        .select({ id: apiKeys.id })
        .from(apiKeys)
        .where(and(
          eq(apiKeys.userId, ctx.user!.id),
          eq(apiKeys.isActive, true),
        ));

      if (activeKeys.length >= 5) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Maximum 5 active API keys allowed. Revoke an existing key first.',
        });
      }

      const rawKey = `sk_${randomBytes(32).toString('hex')}`;
      const keyPrefix = rawKey.slice(0, 11); // "sk_" + first 8 hex chars
      const keyHash = hashKey(rawKey);

      const [created] = await ctx.db
        .insert(apiKeys)
        .values({
          userId: ctx.user!.id,
          name: input.name,
          keyHash,
          keyPrefix,
          scopes: input.scopes,
        })
        .returning({
          id: apiKeys.id,
          name: apiKeys.name,
          keyPrefix: apiKeys.keyPrefix,
          createdAt: apiKeys.createdAt,
        });

      // Return full key ONCE — it cannot be recovered after this
      return { ...created, key: rawKey };
    }),

  revoke: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [key] = await ctx.db
        .select({ id: apiKeys.id, userId: apiKeys.userId })
        .from(apiKeys)
        .where(and(
          eq(apiKeys.id, input.id),
          eq(apiKeys.userId, ctx.user!.id),
        ))
        .limit(1);

      if (!key) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'API key not found' });
      }

      await ctx.db
        .update(apiKeys)
        .set({ isActive: false, revokedAt: new Date() })
        .where(eq(apiKeys.id, input.id));

      return { success: true };
    }),
});
