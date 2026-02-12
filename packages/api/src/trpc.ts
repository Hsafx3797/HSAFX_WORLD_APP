import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from './context';
import { getUserPlan } from './helpers/get-user-plan';
import { buildUserAbility, isPlanAtLeast } from '@hsafx/shared/permissions';
import type { UserPlan, UserAbility } from '@hsafx/shared/permissions';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof Error ? error.cause.message : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

const isAuthed = middleware(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  return next({ ctx: { ...ctx, session: ctx.session, user: ctx.user } });
});

const isAdmin = middleware(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx: { ...ctx, session: ctx.session, user: ctx.user } });
});

/**
 * Middleware that resolves the user's plan and CASL ability.
 * Sets `plan` (UserPlan) and `ability` (UserAbility) on context.
 */
const withPlan = middleware(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  const plan = await getUserPlan(ctx.user.id);
  const ability = buildUserAbility(plan);
  return next({
    ctx: { ...ctx, session: ctx.session, user: ctx.user, plan, ability },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);
export const adminProcedure = t.procedure.use(isAdmin);

/** Procedure with plan + CASL ability on context. Requires auth. */
export const planGatedProcedure = t.procedure.use(withPlan);

export type { UserPlan, UserAbility };
