/**
 * B2B Admin Route Tests
 *
 * Tests the 7 B2B admin API routes for validation, error handling,
 * and correct response shapes. Uses mocked DB + auth to isolate route logic.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Hoisted mock state ────────────────────────────────────────
const { queryChain, mockReturning, mockAuth } = vi.hoisted(() => {
  const fn = vi.fn;
  const returning = fn().mockResolvedValue([]);
  const chain: Record<string, ReturnType<typeof fn>> = {};
  const methods = [
    'select', 'from', 'innerJoin', 'leftJoin', 'where',
    'limit', 'offset', 'orderBy', 'insert', 'values',
    'returning', 'update', 'set', 'delete', 'execute',
    'onConflictDoUpdate', 'onConflictDoNothing',
  ];
  for (const m of methods) {
    chain[m] = fn(() => chain);
  }
  chain.returning = returning;
  return {
    queryChain: chain,
    mockReturning: returning,
    mockAuth: fn().mockResolvedValue({ userId: 'admin-uuid', email: 'admin@test.com', role: 'super_admin' }),
  };
});

// ── Mocks ─────────────────────────────────────────────────────
vi.mock('@/lib/require-admin', () => ({
  requireAdminRole: mockAuth,
}));

vi.mock('@/lib/admin-response', () => {
  const { NextResponse } = require('next/server');
  return {
    adminResponse: (data: unknown, status = 200) =>
      NextResponse.json({ success: true, data }, { status }),
    adminPaginatedResponse: (data: unknown[], opts: { page: number; limit: number; total: number }, status = 200) =>
      NextResponse.json({ success: true, data, ...opts, totalPages: Math.ceil(opts.total / opts.limit) }, { status }),
    adminErrorResponse: (code: string, message: string, status = 500) =>
      NextResponse.json({ success: false, error: { code, message } }, { status }),
  };
});

vi.mock('@hsafx/shared/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

vi.mock('@hsafx/db', () => {
  const _sql = Object.assign(
    vi.fn((strings: TemplateStringsArray, ..._values: unknown[]) => ({ sql: strings })),
    { join: vi.fn() },
  );
  return {
    db: new Proxy(
      {},
      {
        get(_t, prop) {
          const p = prop as string;
          if (typeof queryChain[p] === 'function') return queryChain[p];
          return undefined;
        },
      },
    ),
    b2bPlans: { id: 'id', slug: 'slug', createdAt: 'createdAt' },
    b2bPlanQuotas: { id: 'id', b2bPlanId: 'b2bPlanId', b2bSuiteId: 'b2bSuiteId', monthlyLimit: 'monthlyLimit' },
    b2bSuites: { id: 'id', slug: 'slug', name: 'name', createdAt: 'createdAt', isActive: 'isActive' },
    b2bSuiteCategories: { id: 'id', b2bSuiteId: 'b2bSuiteId', category: 'category' },
    b2bSubscriptions: { id: 'id', userId: 'userId', b2bPlanId: 'planId', status: 'status', billingCycle: 'bc', currentPeriodStart: 'cps', currentPeriodEnd: 'cpe' },
    b2bToolSuiteOverrides: { id: 'id', toolId: 'toolId', b2bSuiteId: 'suiteId' },
    b2bUsage: { id: 'id', userId: 'userId', b2bSuiteId: 'suiteId', periodStart: 'ps', periodEnd: 'pe', usageCount: 'uc' },
    users: { id: 'id', email: 'email', name: 'name' },
    tools: { id: 'id', name: 'name' },
    eq: vi.fn((a: unknown, b: unknown) => ({ op: 'eq', a, b })),
    and: vi.fn((...args: unknown[]) => ({ op: 'and', args })),
    sql: _sql,
  };
});

// ── Helper ────────────────────────────────────────────────────
function makeReq(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3001'), init);
}

// ── Plans Route Tests ─────────────────────────────────────────
describe('B2B Plans Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'admin-uuid', email: 'admin@test.com', role: 'super_admin' });
    // Default: select chain resolves to [] for both plan list and count
    queryChain.select.mockReturnValue(queryChain);
    queryChain.from.mockReturnValue(queryChain);
    queryChain.where.mockReturnValue(queryChain);
    queryChain.innerJoin.mockReturnValue(queryChain);
    queryChain.orderBy.mockReturnValue(queryChain);
    queryChain.limit.mockReturnValue(queryChain);
    queryChain.offset.mockResolvedValue([]);
    mockReturning.mockResolvedValue([]);
  });

  it('POST: rejects missing name', async () => {
    const { POST } = await import('../plans/route');
    const res = await POST(makeReq('/api/admin/b2b/plans', {
      method: 'POST',
      body: JSON.stringify({ slug: 'test' }),
    }));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('VALIDATION');
  });

  it('POST: rejects missing slug', async () => {
    const { POST } = await import('../plans/route');
    const res = await POST(makeReq('/api/admin/b2b/plans', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Plan' }),
    }));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error.code).toBe('VALIDATION');
  });

  it('POST: creates plan with valid data', async () => {
    const { POST } = await import('../plans/route');
    const fakePlan = { id: 'uuid-1', name: 'Basic', slug: 'basic', priceMonthlyCents: 4900 };
    mockReturning.mockResolvedValueOnce([fakePlan]);

    const res = await POST(makeReq('/api/admin/b2b/plans', {
      method: 'POST',
      body: JSON.stringify({ name: 'Basic', slug: 'basic', priceMonthlyCents: 4900 }),
    }));
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.name).toBe('Basic');
    expect(json.data.slug).toBe('basic');
  });

  it('POST: returns 409 on duplicate slug', async () => {
    const { POST } = await import('../plans/route');
    mockReturning.mockRejectedValueOnce(new Error('b2b_plans_slug_unique'));

    const res = await POST(makeReq('/api/admin/b2b/plans', {
      method: 'POST',
      body: JSON.stringify({ name: 'Basic', slug: 'basic' }),
    }));
    const json = await res.json();
    expect(res.status).toBe(409);
    expect(json.error.code).toBe('CONFLICT');
  });

  it('PATCH: rejects missing id', async () => {
    const { PATCH } = await import('../plans/route');
    const res = await PATCH(makeReq('/api/admin/b2b/plans', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
    }));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error.code).toBe('VALIDATION');
  });

  it('PATCH: returns 404 for non-existent plan', async () => {
    const { PATCH } = await import('../plans/route');
    mockReturning.mockResolvedValueOnce([]);

    const res = await PATCH(makeReq('/api/admin/b2b/plans', {
      method: 'PATCH',
      body: JSON.stringify({ id: 'non-existent-uuid', name: 'Updated' }),
    }));
    const json = await res.json();
    expect(res.status).toBe(404);
    expect(json.error.code).toBe('NOT_FOUND');
  });

  it('PATCH: updates plan successfully', async () => {
    const { PATCH } = await import('../plans/route');
    const updated = { id: 'uuid-1', name: 'Updated Basic', slug: 'basic' };
    mockReturning.mockResolvedValueOnce([updated]);

    const res = await PATCH(makeReq('/api/admin/b2b/plans', {
      method: 'PATCH',
      body: JSON.stringify({ id: 'uuid-1', name: 'Updated Basic' }),
    }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.name).toBe('Updated Basic');
  });

  it('PATCH: strips unknown fields (allowlist)', async () => {
    const { PATCH } = await import('../plans/route');
    const updated = { id: 'uuid-1', name: 'Basic' };
    mockReturning.mockResolvedValueOnce([updated]);

    await PATCH(makeReq('/api/admin/b2b/plans', {
      method: 'PATCH',
      body: JSON.stringify({ id: 'uuid-1', name: 'Basic', __proto__: 'evil', randomField: 'injected' }),
    }));

    // The set() call should have been called with only allowed fields + updatedAt
    expect(queryChain.set).toHaveBeenCalled();
    const setArg = queryChain.set.mock.calls[0]?.[0];
    expect(setArg).not.toHaveProperty('__proto__');
    expect(setArg).not.toHaveProperty('randomField');
    expect(setArg).toHaveProperty('updatedAt');
  });
});

// ── Subscriptions Route Tests ─────────────────────────────────
describe('B2B Subscriptions Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'admin-uuid', email: 'admin@test.com', role: 'super_admin' });
    queryChain.select.mockReturnValue(queryChain);
    queryChain.from.mockReturnValue(queryChain);
    queryChain.where.mockReturnValue(queryChain);
    queryChain.innerJoin.mockReturnValue(queryChain);
    queryChain.leftJoin.mockReturnValue(queryChain);
    queryChain.orderBy.mockReturnValue(queryChain);
    queryChain.limit.mockReturnValue(queryChain);
    queryChain.offset.mockResolvedValue([]);
    mockReturning.mockResolvedValue([]);
  });

  it('POST: rejects missing userId', async () => {
    const { POST } = await import('../subscriptions/route');
    const res = await POST(makeReq('/api/admin/b2b/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        b2bPlanId: 'plan-uuid',
        billingCycle: 'monthly',
        currentPeriodStart: '2025-01-01',
        currentPeriodEnd: '2025-02-01',
      }),
    }));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error.code).toBe('VALIDATION');
  });

  it('POST: rejects missing b2bPlanId', async () => {
    const { POST } = await import('../subscriptions/route');
    const res = await POST(makeReq('/api/admin/b2b/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'user-uuid',
        billingCycle: 'monthly',
        currentPeriodStart: '2025-01-01',
        currentPeriodEnd: '2025-02-01',
      }),
    }));
    const json = await res.json();
    expect(res.status).toBe(400);
  });

  it('PATCH: rejects missing id', async () => {
    const { PATCH } = await import('../subscriptions/route');
    const res = await PATCH(makeReq('/api/admin/b2b/subscriptions', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'canceled' }),
    }));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error.code).toBe('VALIDATION');
  });
});

// ── Quotas Route Tests ────────────────────────────────────────
describe('B2B Quotas Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'admin-uuid', email: 'admin@test.com', role: 'super_admin' });
    queryChain.select.mockReturnValue(queryChain);
    queryChain.from.mockReturnValue(queryChain);
    queryChain.where.mockReturnValue(queryChain);
    queryChain.innerJoin.mockReturnValue(queryChain);
    queryChain.orderBy.mockReturnValue(queryChain);
    queryChain.limit.mockReturnValue(queryChain);
    queryChain.offset.mockResolvedValue([]);
    queryChain.onConflictDoUpdate.mockReturnValue(queryChain);
    mockReturning.mockResolvedValue([]);
  });

  it('POST: rejects missing b2bPlanId', async () => {
    const { POST } = await import('../quotas/route');
    const res = await POST(makeReq('/api/admin/b2b/quotas', {
      method: 'POST',
      body: JSON.stringify({ b2bSuiteId: 'suite-uuid', monthlyLimit: 5000 }),
    }));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error.code).toBe('VALIDATION');
  });

  it('POST: rejects non-positive monthlyLimit', async () => {
    const { POST } = await import('../quotas/route');
    const res = await POST(makeReq('/api/admin/b2b/quotas', {
      method: 'POST',
      body: JSON.stringify({ b2bPlanId: 'plan-uuid', b2bSuiteId: 'suite-uuid', monthlyLimit: 0 }),
    }));
    const json = await res.json();
    expect(res.status).toBe(400);
  });

  it('PATCH: rejects missing id', async () => {
    const { PATCH } = await import('../quotas/route');
    const res = await PATCH(makeReq('/api/admin/b2b/quotas', {
      method: 'PATCH',
      body: JSON.stringify({ monthlyLimit: 10000 }),
    }));
    const json = await res.json();
    expect(res.status).toBe(400);
  });
});

// ── Suite Categories Route Tests ──────────────────────────────
describe('B2B Suite Categories Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'admin-uuid', email: 'admin@test.com', role: 'super_admin' });
    queryChain.select.mockReturnValue(queryChain);
    queryChain.from.mockReturnValue(queryChain);
    queryChain.where.mockReturnValue(queryChain);
    queryChain.innerJoin.mockReturnValue(queryChain);
    queryChain.orderBy.mockReturnValue(queryChain);
    queryChain.limit.mockReturnValue(queryChain);
    queryChain.offset.mockResolvedValue([]);
    mockReturning.mockResolvedValue([]);
  });

  it('POST: rejects missing b2bSuiteId', async () => {
    const { POST } = await import('../suite-categories/route');
    const res = await POST(makeReq('/api/admin/b2b/suite-categories', {
      method: 'POST',
      body: JSON.stringify({ category: 'text' }),
    }));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error.code).toBe('VALIDATION');
  });

  it('POST: rejects missing category', async () => {
    const { POST } = await import('../suite-categories/route');
    const res = await POST(makeReq('/api/admin/b2b/suite-categories', {
      method: 'POST',
      body: JSON.stringify({ b2bSuiteId: 'suite-uuid' }),
    }));
    const json = await res.json();
    expect(res.status).toBe(400);
  });

  it('DELETE: rejects missing id', async () => {
    const { DELETE } = await import('../suite-categories/route');
    const res = await DELETE(makeReq('/api/admin/b2b/suite-categories', {
      method: 'DELETE',
      body: JSON.stringify({}),
    }));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error.code).toBe('VALIDATION');
  });
});

// ── Auth Gate Tests ───────────────────────────────────────────
describe('B2B Admin Auth Gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryChain.select.mockReturnValue(queryChain);
    queryChain.from.mockReturnValue(queryChain);
    queryChain.where.mockReturnValue(queryChain);
    queryChain.orderBy.mockReturnValue(queryChain);
    queryChain.limit.mockReturnValue(queryChain);
    queryChain.offset.mockResolvedValue([]);
  });

  it('Returns 401 when not authenticated', async () => {
    const { NextResponse } = await import('next/server');
    mockAuth.mockResolvedValueOnce(
      NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 }),
    );

    const { GET } = await import('../plans/route');
    const res = await GET(makeReq('/api/admin/b2b/plans'));
    expect(res.status).toBe(401);
  });

  it('Returns 403 when lacking permission', async () => {
    const { NextResponse } = await import('next/server');
    mockAuth.mockResolvedValueOnce(
      NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } }, { status: 403 }),
    );

    const { POST } = await import('../plans/route');
    const res = await POST(makeReq('/api/admin/b2b/plans', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', slug: 'test' }),
    }));
    expect(res.status).toBe(403);
  });
});
