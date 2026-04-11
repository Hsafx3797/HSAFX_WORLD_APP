import { z } from 'zod';
import { createHash } from 'node:crypto';
import { router, protectedProcedure } from '../trpc';
import { apiKeys, eq, and, desc } from '@hsafx/db/schema';
import { TRPCError } from '@trpc/server';

/**
 * Generate API key in canonical format: hsafx_{live|test}_{52 alphanumeric}
 * Must match the regex in apps/web/src/lib/api-keys.ts
 */
function generateApiKeyForTRPC(): { plaintext: string; hash: string; prefix: string } {
  const env = process.env.NODE_ENV === 'production' ? 'live' : 'test';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const { randomBytes } = require('node:crypto');
  const maxValid = 256 - (256 % chars.length);
  let random = '';
  while (random.length < 52) {
    const bytes = randomBytes(68);
    for (let i = 0; i < bytes.length && random.length < 52; i++) {
      if (bytes[i]! < maxValid) random += chars[bytes[i]! % chars.length];
    }
  }
  const plaintext = `hsafx_${env}_${random}`;
  const hash = createHash('sha256').update(plaintext).digest('hex');
  const prefix = plaintext.slice(0, 14);
  return { plaintext, hash, prefix };
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
      .where(and(
        eq(apiKeys.userId, ctx.user!.id),
        eq(apiKeys.isInternal, false),
      ))
      .orderBy(desc(apiKeys.createdAt));

    return keys;
  }),

  generate: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100).default('Default'),
      scopes: z.array(z.string()).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      // Limit to 5 active user-created keys (excludes internal keys)
      const activeKeys = await ctx.db
        .select({ id: apiKeys.id })
        .from(apiKeys)
        .where(and(
          eq(apiKeys.userId, ctx.user!.id),
          eq(apiKeys.isActive, true),
          eq(apiKeys.isInternal, false),
        ));

      if (activeKeys.length >= 5) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Maximum 5 active API keys allowed. Revoke an existing key first.',
        });
      }

      const generated = generateApiKeyForTRPC();

      const [created] = await ctx.db
        .insert(apiKeys)
        .values({
          userId: ctx.user!.id,
          name: input.name,
          keyHash: generated.hash,
          keyPrefix: generated.prefix,
          scopes: input.scopes,
        })
        .returning({
          id: apiKeys.id,
          name: apiKeys.name,
          keyPrefix: apiKeys.keyPrefix,
          createdAt: apiKeys.createdAt,
        });

      // Return full key ONCE — it cannot be recovered after this
      return { ...created, key: generated.plaintext };
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
