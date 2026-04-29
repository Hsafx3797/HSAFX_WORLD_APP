/**
 * Admin RBAC Tests
 * Verifies that admin procedures enforce authentication and role checks.
 */
import { describe, it, expect } from 'vitest';
import { appRouter } from '../routers';
import type { Context } from '../context';

// ─── Helpers ──────────────────────────────────────────────────

function makeCtx(overrides: Partial<Context> = {}): Context {
  return {
    db: {} as Context['db'],
    session: null,
    user: null,
    headers: new Headers(),
    ...overrides,
  };
}

const fakeSession = {
  id: 'sess_1',
  userId: 'user_1',
  token: 'tok',
  expiresAt: new Date(Date.now() + 3600_000),
  createdAt: new Date(),
  ipAddress: '127.0.0.1',
  userAgent: 'test',
} as Context['session'];

const fakeUser = (role: string) =>
  ({
    id: 'user_1',
    name: 'Test',
    email: 'test@example.com',
    role,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }) as unknown as Context['user'];

// ─── Tests ────────────────────────────────────────────────────

describe('Admin RBAC middleware', () => {
  it('should reject unauthenticated calls with UNAUTHORIZED', async () => {
    const caller = appRouter.createCaller(makeCtx());

    await expect(caller.admin.getDashboardStats()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });

  it('should reject non-admin users with FORBIDDEN', async () => {
    const caller = appRouter.createCaller(
      makeCtx({ session: fakeSession, user: fakeUser('user') }),
    );

    await expect(caller.admin.getDashboardStats()).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('should reject "moderator" role with FORBIDDEN', async () => {
    const caller = appRouter.createCaller(
      makeCtx({ session: fakeSession, user: fakeUser('moderator') }),
    );

    await expect(caller.admin.getFeatureFlags()).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('should allow admin role past middleware (may fail on DB)', async () => {
    const caller = appRouter.createCaller(
      makeCtx({ session: fakeSession, user: fakeUser('admin') }),
    );

    // Admin passes middleware but the DB call will fail since we don't mock it.
    // We verify it does NOT throw UNAUTHORIZED or FORBIDDEN — it throws
    // a different error (DB/connection) proving the middleware passed.
    try {
      await caller.admin.getDashboardStats();
    } catch (err: unknown) {
      const e = err as { code?: string };
      expect(e.code).not.toBe('UNAUTHORIZED');
      expect(e.code).not.toBe('FORBIDDEN');
    }
  });
});

describe('Protected procedure middleware', () => {
  it('should reject unauthenticated calls to getMyPlan', async () => {
    const caller = appRouter.createCaller(makeCtx());

    await expect(caller.user.getMyPlan()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });

  it('should allow any authenticated user to getMyPlan', async () => {
    const caller = appRouter.createCaller(
      makeCtx({ session: fakeSession, user: fakeUser('user') }),
    );

    // Will fail on DB but should NOT throw UNAUTHORIZED/FORBIDDEN
    try {
      await caller.user.getMyPlan();
    } catch (err: unknown) {
      const e = err as { code?: string };
      expect(e.code).not.toBe('UNAUTHORIZED');
      expect(e.code).not.toBe('FORBIDDEN');
    }
  });
});
