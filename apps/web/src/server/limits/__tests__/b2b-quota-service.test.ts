/**
 * B2B Quota Service Tests
 *
 * Pure-function + mock-based tests for the B2B quota service.
 * Tests error classes (pure), resolveB2bSuite, getActiveB2bSubscription,
 * checkB2bQuota, incrementB2bUsage, and getB2bUsageSummary via db mocks.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mock state (available inside vi.mock factory) ─────
const { queryChain, mockExecute } = vi.hoisted(() => {
  const fn = vi.fn;
  const chain: Record<string, ReturnType<typeof fn>> = {};
  const methods = [
    'select', 'from', 'innerJoin', 'leftJoin', 'where',
    'limit', 'orderBy', 'insert', 'values', 'returning',
    'update', 'set', 'execute', 'onConflictDoUpdate',
  ];
  for (const m of methods) {
    chain[m] = fn(() => chain);
  }
  return { queryChain: chain, mockExecute: fn() };
});

vi.mock('@hsafx/db', () => {
  return {
    db: new Proxy(
      {},
      {
        get(_target, prop) {
          if (prop === 'execute') return mockExecute;
          if (typeof queryChain[prop as string] === 'function') {
            return queryChain[prop as string];
          }
          return undefined;
        },
      },
    ),
    b2bSubscriptions: { id: 'id', userId: 'userId', status: 'status', b2bPlanId: 'b2bPlanId', currentPeriodStart: 'cps', currentPeriodEnd: 'cpe' },
    b2bPlanQuotas: { b2bPlanId: 'b2bPlanId', b2bSuiteId: 'b2bSuiteId', monthlyLimit: 'monthlyLimit' },
    b2bSuites: { id: 'id', slug: 'slug', name: 'name' },
    b2bSuiteCategories: { b2bSuiteId: 'b2bSuiteId', category: 'category' },
    b2bToolSuiteOverrides: { toolId: 'toolId', b2bSuiteId: 'b2bSuiteId' },
    b2bUsage: { userId: 'userId', b2bSuiteId: 'b2bSuiteId', periodStart: 'periodStart', usageCount: 'usageCount' },
    eq: vi.fn((a: unknown, b: unknown) => ({ op: 'eq', a, b })),
    and: vi.fn((...args: unknown[]) => ({ op: 'and', args })),
    sql: Object.assign(vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({ sql: strings, values })), {
      join: vi.fn(),
    }),
  };
});

import {
  B2bQuotaExhaustedError,
  B2bNoSubscriptionError,
  B2bSuiteNotAvailableError,
  resolveB2bSuite,
  getActiveB2bSubscription,
  checkB2bQuota,
  incrementB2bUsage,
  getB2bUsageSummary,
} from '../b2b-quota-service';

beforeEach(() => {
  vi.clearAllMocks();
  // Reset all chain methods
  for (const fn of Object.values(queryChain)) {
    if (typeof fn === 'function' && 'mockReset' in fn) {
      (fn as ReturnType<typeof vi.fn>).mockReset().mockReturnValue(queryChain);
    }
  }
});

// ─── Error Classes ────────────────────────────────────────────

describe('B2bQuotaExhaustedError', () => {
  it('should expose suiteId and limit', () => {
    const err = new B2bQuotaExhaustedError('suite-123', 5000);
    expect(err.name).toBe('B2bQuotaExhaustedError');
    expect(err.suiteId).toBe('suite-123');
    expect(err.limit).toBe(5000);
    expect(err.message).toContain('suite-123');
    expect(err.message).toContain('5000');
    expect(err).toBeInstanceOf(Error);
  });
});

describe('B2bNoSubscriptionError', () => {
  it('should have correct name and message', () => {
    const err = new B2bNoSubscriptionError();
    expect(err.name).toBe('B2bNoSubscriptionError');
    expect(err.message).toContain('No active B2B subscription');
    expect(err).toBeInstanceOf(Error);
  });
});

describe('B2bSuiteNotAvailableError', () => {
  it('should expose suiteId', () => {
    const err = new B2bSuiteNotAvailableError('suite-xyz');
    expect(err.name).toBe('B2bSuiteNotAvailableError');
    expect(err.suiteId).toBe('suite-xyz');
    expect(err.message).toContain('suite-xyz');
    expect(err).toBeInstanceOf(Error);
  });
});

// ─── resolveB2bSuite ─────────────────────────────────────────

describe('resolveB2bSuite', () => {
  it('should return tool override when toolId provided and override exists', async () => {
    // Make the chain resolve to an override
    queryChain['limit']!.mockResolvedValueOnce([{ suiteId: 'suite-media', suiteName: 'Media' }]);

    const result = await resolveB2bSuite('text', 'tool-abc');
    expect(result).toEqual({ suiteId: 'suite-media', suiteName: 'Media' });
  });

  it('should fall back to category mapping when no tool override', async () => {
    // First call (override check) returns empty
    queryChain['limit']!.mockResolvedValueOnce([]);
    // Second call (category mapping) returns a result
    queryChain['limit']!.mockResolvedValueOnce([{ suiteId: 'suite-text', suiteName: 'Text Tools' }]);

    const result = await resolveB2bSuite('text', 'tool-abc');
    expect(result).toEqual({ suiteId: 'suite-text', suiteName: 'Text Tools' });
  });

  it('should use category mapping directly when no toolId', async () => {
    queryChain['limit']!.mockResolvedValueOnce([{ suiteId: 'suite-data', suiteName: 'Data Tools' }]);

    const result = await resolveB2bSuite('data');
    expect(result).toEqual({ suiteId: 'suite-data', suiteName: 'Data Tools' });
  });

  it('should return null when no mapping found', async () => {
    queryChain['limit']!.mockResolvedValueOnce([]);

    const result = await resolveB2bSuite('unknown-category');
    expect(result).toBeNull();
  });
});

// ─── getActiveB2bSubscription ─────────────────────────────────

describe('getActiveB2bSubscription', () => {
  it('should return subscription info when active sub exists', async () => {
    const now = new Date();
    const end = new Date(now.getTime() + 30 * 86400000);
    queryChain['limit']!.mockResolvedValueOnce([{
      subscriptionId: 'sub-1',
      b2bPlanId: 'plan-1',
      currentPeriodStart: now,
      currentPeriodEnd: end,
    }]);

    const result = await getActiveB2bSubscription('user-1');
    expect(result).toEqual({
      subscriptionId: 'sub-1',
      b2bPlanId: 'plan-1',
      currentPeriodStart: now,
      currentPeriodEnd: end,
    });
  });

  it('should return null when no active sub', async () => {
    queryChain['limit']!.mockResolvedValueOnce([]);

    const result = await getActiveB2bSubscription('user-no-sub');
    expect(result).toBeNull();
  });
});

// ─── checkB2bQuota ────────────────────────────────────────────

describe('checkB2bQuota', () => {
  const mockSub = {
    subscriptionId: 'sub-1',
    b2bPlanId: 'plan-1',
    currentPeriodStart: new Date('2025-01-01'),
    currentPeriodEnd: new Date('2025-02-01'),
  };

  it('should return allowed=true when under limit', async () => {
    // getActiveB2bSubscription → has sub
    queryChain['limit']!.mockResolvedValueOnce([mockSub]);
    // getQuota → limit 5000
    queryChain['limit']!.mockResolvedValueOnce([{ monthlyLimit: 5000, suiteName: 'Text' }]);
    // getUsage → used 100
    queryChain['limit']!.mockResolvedValueOnce([{ usageCount: 100 }]);

    const result = await checkB2bQuota('user-1', 'suite-text');
    expect(result.allowed).toBe(true);
    expect(result.used).toBe(100);
    expect(result.limit).toBe(5000);
    expect(result.remaining).toBe(4900);
    expect(result.suiteId).toBe('suite-text');
    expect(result.suiteName).toBe('Text');
  });

  it('should return allowed=false when at limit', async () => {
    queryChain['limit']!.mockResolvedValueOnce([mockSub]);
    queryChain['limit']!.mockResolvedValueOnce([{ monthlyLimit: 5000, suiteName: 'Text' }]);
    queryChain['limit']!.mockResolvedValueOnce([{ usageCount: 5000 }]);

    const result = await checkB2bQuota('user-1', 'suite-text');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.used).toBe(5000);
  });

  it('should return allowed=true when no usage row exists (0 used)', async () => {
    queryChain['limit']!.mockResolvedValueOnce([mockSub]);
    queryChain['limit']!.mockResolvedValueOnce([{ monthlyLimit: 3000, suiteName: 'Media' }]);
    queryChain['limit']!.mockResolvedValueOnce([]); // no usage row

    const result = await checkB2bQuota('user-1', 'suite-media');
    expect(result.allowed).toBe(true);
    expect(result.used).toBe(0);
    expect(result.remaining).toBe(3000);
  });

  it('should throw B2bNoSubscriptionError when no active sub', async () => {
    queryChain['limit']!.mockResolvedValueOnce([]); // no sub

    await expect(checkB2bQuota('user-no-sub', 'suite-text'))
      .rejects.toThrow(B2bNoSubscriptionError);
  });

  it('should throw B2bSuiteNotAvailableError when plan has no quota for suite', async () => {
    queryChain['limit']!.mockResolvedValueOnce([mockSub]);
    queryChain['limit']!.mockResolvedValueOnce([]); // no quota for this suite

    await expect(checkB2bQuota('user-1', 'suite-unknown'))
      .rejects.toThrow(B2bSuiteNotAvailableError);
  });
});

// ─── incrementB2bUsage ────────────────────────────────────────

describe('incrementB2bUsage', () => {
  const mockSub = {
    subscriptionId: 'sub-1',
    b2bPlanId: 'plan-1',
    currentPeriodStart: new Date('2025-01-01'),
    currentPeriodEnd: new Date('2025-02-01'),
  };

  it('should return new count on successful increment', async () => {
    // getActiveB2bSubscription
    queryChain['limit']!.mockResolvedValueOnce([mockSub]);
    // getQuota
    queryChain['limit']!.mockResolvedValueOnce([{ monthlyLimit: 5000 }]);
    // execute atomic upsert
    mockExecute.mockResolvedValueOnce({ rows: [{ usage_count: 101 }] });

    const result = await incrementB2bUsage('user-1', 'suite-text');
    expect(result.newUsageCount).toBe(101);
    expect(result.limit).toBe(5000);
    expect(result.remaining).toBe(4899);
  });

  it('should throw B2bQuotaExhaustedError when limit reached', async () => {
    queryChain['limit']!.mockResolvedValueOnce([mockSub]);
    queryChain['limit']!.mockResolvedValueOnce([{ monthlyLimit: 5000 }]);
    // Empty rows = WHERE clause failed = limit reached
    mockExecute.mockResolvedValueOnce({ rows: [] });

    await expect(incrementB2bUsage('user-1', 'suite-text'))
      .rejects.toThrow(B2bQuotaExhaustedError);
  });

  it('should throw B2bNoSubscriptionError when no active sub', async () => {
    queryChain['limit']!.mockResolvedValueOnce([]); // no sub

    await expect(incrementB2bUsage('user-no-sub', 'suite-text'))
      .rejects.toThrow(B2bNoSubscriptionError);
  });

  it('should throw B2bSuiteNotAvailableError when no quota for suite', async () => {
    queryChain['limit']!.mockResolvedValueOnce([mockSub]);
    queryChain['limit']!.mockResolvedValueOnce([]); // no quota

    await expect(incrementB2bUsage('user-1', 'suite-missing'))
      .rejects.toThrow(B2bSuiteNotAvailableError);
  });
});

// ─── getB2bUsageSummary ───────────────────────────────────────

describe('getB2bUsageSummary', () => {
  const mockSub = {
    subscriptionId: 'sub-1',
    b2bPlanId: 'plan-1',
    currentPeriodStart: new Date('2025-01-01'),
    currentPeriodEnd: new Date('2025-02-01'),
  };

  it('should return usage summaries for all suites', async () => {
    // getActiveB2bSubscription: select().from().where().limit(1)
    // 1st where() → chain (intermediate), 1st limit() → resolves with sub
    queryChain['limit']!.mockResolvedValueOnce([mockSub]);
    // Main query: select().from().innerJoin().leftJoin().where()
    // 2nd where() → terminal (resolves with data)
    // Need to let 1st where() return chain (default), 2nd where() return data
    queryChain['where']!
      .mockReturnValueOnce(queryChain)  // 1st where() in getActiveSub → chain
      .mockResolvedValueOnce([          // 2nd where() in main query → data
        { suiteId: 's1', suiteSlug: 'text', suiteName: 'Text', limit: 5000, used: 1200 },
        { suiteId: 's2', suiteSlug: 'data', suiteName: 'Data', limit: 5000, used: 0 },
        { suiteId: 's3', suiteSlug: 'media', suiteName: 'Media', limit: 3000, used: 3000 },
      ]);

    const result = await getB2bUsageSummary('user-1');
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      suiteId: 's1', suiteSlug: 'text', suiteName: 'Text',
      used: 1200, limit: 5000, remaining: 3800,
    });
    expect(result[1]!.remaining).toBe(5000);
    expect(result[2]!.remaining).toBe(0);
  });

  it('should throw B2bNoSubscriptionError when no active sub', async () => {
    queryChain['limit']!.mockResolvedValueOnce([]);

    await expect(getB2bUsageSummary('user-no-sub'))
      .rejects.toThrow(B2bNoSubscriptionError);
  });
});
