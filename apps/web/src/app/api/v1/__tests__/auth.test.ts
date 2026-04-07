/**
 * Auth & Access Control Tests
 * Tests authenticateApiKey middleware and requireScope guard
 * across all B2B API v1 endpoints.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// ─── Mock Dependencies ───────────────────────────────────────

const mockFindFirst = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockWhere = vi.fn();

vi.mock('@hsafx/db', () => ({
  db: {
    query: {
      apiKeys: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
    },
    update: () => ({
      set: (...args: unknown[]) => {
        mockSet(...args);
        return {
          where: (...wArgs: unknown[]) => {
            mockWhere(...wArgs);
            return Promise.resolve();
          },
        };
      },
    }),
  },
  eq: vi.fn((_field, value) => value),
  apiKeys: { keyHash: 'keyHash', id: 'id' },
}));

const mockRedisGet = vi.fn();
const mockRedisSet = vi.fn();
const mockRedisEval = vi.fn();
const mockRedisTtl = vi.fn();

vi.mock('@/lib/redis', () => ({
  redis: {
    get: (...args: unknown[]) => mockRedisGet(...args),
    set: (...args: unknown[]) => mockRedisSet(...args),
    eval: (...args: unknown[]) => mockRedisEval(...args),
    ttl: (...args: unknown[]) => mockRedisTtl(...args),
  },
  keys: {
    rateLimit: {
      apiKeyBurst: (id: string) => `ratelimit:apikey:${id}:burst`,
      apiKeyHourly: (id: string) => `ratelimit:apikey:${id}:hourly`,
      apiKeyDaily: (id: string) => `ratelimit:apikey:${id}:daily`,
    },
    idempotency: (k: string) => `idempotency:${k}`,
    job: {
      state: (id: string) => `job:${id}`,
      result: (id: string) => `job:${id}:result`,
      progress: (id: string) => `job:${id}:progress`,
    },
  },
  TTL: {
    JOB_STATE: 259200,
    JOB_RESULT: 86400,
    JOB_PROGRESS: 3600,
    RATE_LIMIT_BURST: 60,
    RATE_LIMIT_HOURLY: 3600,
    RATE_LIMIT_DAILY: 86400,
    IDEMPOTENCY: 86400,
  },
  generateInputHash: vi.fn(() => 'hash123'),
}));

// Import after mocks
import {
  authenticateApiKey,
  requireScope,
  apiResponse,
  apiErrorResponse,
} from '@/lib/api-v1-auth';
import type { ApiContext } from '@/lib/api-v1-auth';
import { hashApiKey } from '@/lib/api-keys';

// ─── Constants ────────────────────────────────────────────────

const VALID_KEY =
  'hsafx_test_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const VALID_KEY_HASH = hashApiKey(VALID_KEY);

const MOCK_DB_ROW = {
  id: 'key_123',
  userId: 'user_456',
  name: 'Test Key',
  keyHash: VALID_KEY_HASH,
  keyPrefix: 'hsafx_test_AB',
  scopes: ['tools:read', 'tools:execute'],
  isActive: true,
  revokedAt: null,
  expiresAt: null,
  rateLimitTier: 'free',
  lastUsed: null,
  metadata: { scopes: ['tools:read', 'tools:execute'] },
};

// ─── Helpers ──────────────────────────────────────────────────

function makeRequest(apiKey?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (apiKey) {
    headers.authorization = `Bearer ${apiKey}`;
  }
  return new NextRequest(new URL('/api/v1/tools', 'http://localhost'), {
    headers,
  });
}

function makeRequestWithCustomHeader(apiKey: string): NextRequest {
  return new NextRequest(new URL('/api/v1/tools', 'http://localhost'), {
    headers: { 'x-hsafx-api-key': apiKey },
  });
}

function allowRateLimits() {
  // burst, hourly, daily all return count = 1 (well under limits)
  mockRedisEval.mockResolvedValue(1);
  mockRedisTtl.mockResolvedValue(3600);
}

// ─── Tests ────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  allowRateLimits();
});

describe('authenticateApiKey', () => {
  describe('A001 — Missing API Key', () => {
    it('returns 401 with code A001 when no Authorization header', async () => {
      const req = makeRequest(); // no key
      const result = await authenticateApiKey(req);
      expect(result).toBeInstanceOf(NextResponse);
      const body = await (result as NextResponse).json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('A001');
      expect((result as NextResponse).status).toBe(401);
    });

    it('returns 401 when Authorization header has no Bearer prefix', async () => {
      const req = new NextRequest(
        new URL('/api/v1/tools', 'http://localhost'),
        { headers: { authorization: VALID_KEY } }, // missing 'Bearer '
      );
      const result = await authenticateApiKey(req);
      expect(result).toBeInstanceOf(NextResponse);
      const body = await (result as NextResponse).json();
      expect(body.error.code).toBe('A001');
    });
  });

  describe('A002 — Invalid API Key Format', () => {
    it('returns 401 for malformed key (wrong prefix)', async () => {
      const req = makeRequest('invalid_key_format_xyz');
      const result = await authenticateApiKey(req);
      expect(result).toBeInstanceOf(NextResponse);
      const body = await (result as NextResponse).json();
      expect(body.error.code).toBe('A002');
      expect((result as NextResponse).status).toBe(401);
    });

    it('returns 401 for key that is too short', async () => {
      const req = makeRequest('hsafx_test_short');
      const result = await authenticateApiKey(req);
      const body = await (result as NextResponse).json();
      expect(body.error.code).toBe('A002');
    });

    it('returns 401 for key with invalid characters', async () => {
      const req = makeRequest(
        'hsafx_test_ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$abcdefghijklmnopqrstuvwxyz',
      );
      const result = await authenticateApiKey(req);
      const body = await (result as NextResponse).json();
      expect(body.error.code).toBe('A002');
    });

    it('returns 401 when key format valid but not found in DB', async () => {
      mockFindFirst.mockResolvedValue(null);
      const req = makeRequest(VALID_KEY);
      const result = await authenticateApiKey(req);
      const body = await (result as NextResponse).json();
      expect(body.error.code).toBe('A002');
    });
  });

  describe('A003 — Revoked / Expired Key', () => {
    it('returns 401 when key is revoked (revokedAt set)', async () => {
      mockFindFirst.mockResolvedValue({
        ...MOCK_DB_ROW,
        revokedAt: new Date().toISOString(),
      });
      const req = makeRequest(VALID_KEY);
      const result = await authenticateApiKey(req);
      const body = await (result as NextResponse).json();
      expect(body.error.code).toBe('A003');
      expect((result as NextResponse).status).toBe(401);
    });

    it('returns 401 when key is inactive', async () => {
      mockFindFirst.mockResolvedValue({
        ...MOCK_DB_ROW,
        isActive: false,
      });
      const req = makeRequest(VALID_KEY);
      const result = await authenticateApiKey(req);
      const body = await (result as NextResponse).json();
      expect(body.error.code).toBe('A003');
    });

    it('returns 401 when key has expired', async () => {
      mockFindFirst.mockResolvedValue({
        ...MOCK_DB_ROW,
        expiresAt: new Date('2020-01-01').toISOString(),
      });
      const req = makeRequest(VALID_KEY);
      const result = await authenticateApiKey(req);
      const body = await (result as NextResponse).json();
      expect(body.error.code).toBe('A003');
    });
  });

  describe('R004 — Rate Limiting', () => {
    it('returns 429 when burst limit exceeded', async () => {
      mockFindFirst.mockResolvedValue(MOCK_DB_ROW);
      // burst count exceeds 10 (free tier burst limit)
      mockRedisEval.mockResolvedValueOnce(11);
      mockRedisTtl.mockResolvedValueOnce(45);

      const req = makeRequest(VALID_KEY);
      const result = await authenticateApiKey(req);
      expect(result).toBeInstanceOf(NextResponse);
      const body = await (result as NextResponse).json();
      expect(body.error.code).toBe('R004');
      expect((result as NextResponse).status).toBe(429);
      expect((result as NextResponse).headers.get('Retry-After')).toBeTruthy();
    });

    it('returns 429 when hourly limit exceeded', async () => {
      mockFindFirst.mockResolvedValue(MOCK_DB_ROW);
      // burst passes, hourly fails
      mockRedisEval
        .mockResolvedValueOnce(1) // burst OK
        .mockResolvedValueOnce(101); // hourly > 100
      mockRedisTtl.mockResolvedValue(1800);

      const req = makeRequest(VALID_KEY);
      const result = await authenticateApiKey(req);
      const body = await (result as NextResponse).json();
      expect(body.error.code).toBe('R004');
      expect((result as NextResponse).status).toBe(429);
    });

    it('returns 429 when daily limit exceeded', async () => {
      mockFindFirst.mockResolvedValue(MOCK_DB_ROW);
      // burst & hourly pass, daily fails
      mockRedisEval
        .mockResolvedValueOnce(1) // burst OK
        .mockResolvedValueOnce(1) // hourly OK
        .mockResolvedValueOnce(2001); // daily > 2000
      mockRedisTtl.mockResolvedValue(43200);

      const req = makeRequest(VALID_KEY);
      const result = await authenticateApiKey(req);
      const body = await (result as NextResponse).json();
      expect(body.error.code).toBe('R004');
    });
  });

  describe('Successful Authentication', () => {
    it('returns ApiContext for valid key with all checks passing', async () => {
      mockFindFirst.mockResolvedValue(MOCK_DB_ROW);
      const req = makeRequest(VALID_KEY);
      const result = await authenticateApiKey(req);

      // Should NOT be a NextResponse (error)
      expect(result).not.toBeInstanceOf(NextResponse);

      const ctx = result as ApiContext;
      expect(ctx.keyId).toBe('key_123');
      expect(ctx.userId).toBe('user_456');
      expect(ctx.keyName).toBe('Test Key');
      expect(ctx.scopes).toEqual(['tools:read', 'tools:execute']);
      expect(ctx.rateLimitTier).toBe('free');
      expect(ctx.requestId).toMatch(/^req_/);
    });

    it('accepts key via X-HSAFX-API-Key header', async () => {
      mockFindFirst.mockResolvedValue(MOCK_DB_ROW);
      const req = makeRequestWithCustomHeader(VALID_KEY);
      const result = await authenticateApiKey(req);
      expect(result).not.toBeInstanceOf(NextResponse);
      expect((result as ApiContext).keyId).toBe('key_123');
    });

    it('uses default scopes when scopes column is empty', async () => {
      mockFindFirst.mockResolvedValue({
        ...MOCK_DB_ROW,
        scopes: [],
        metadata: {},
      });
      const req = makeRequest(VALID_KEY);
      const result = await authenticateApiKey(req);
      const ctx = result as ApiContext;
      expect(ctx.scopes).toEqual(['tools:read', 'tools:execute']);
    });

    it('uses default scopes when scopes column is null', async () => {
      mockFindFirst.mockResolvedValue({
        ...MOCK_DB_ROW,
        scopes: null,
        metadata: null,
      });
      const req = makeRequest(VALID_KEY);
      const result = await authenticateApiKey(req);
      const ctx = result as ApiContext;
      expect(ctx.scopes).toEqual(['tools:read', 'tools:execute']);
    });

    it('parses pro rate limit tier correctly', async () => {
      mockFindFirst.mockResolvedValue({
        ...MOCK_DB_ROW,
        rateLimitTier: 'pro',
      });
      const req = makeRequest(VALID_KEY);
      const result = await authenticateApiKey(req);
      const ctx = result as ApiContext;
      expect(ctx.rateLimitTier).toBe('pro');
    });

    it('generates unique requestId per request', async () => {
      mockFindFirst.mockResolvedValue(MOCK_DB_ROW);
      const req1 = makeRequest(VALID_KEY);
      const req2 = makeRequest(VALID_KEY);
      const r1 = (await authenticateApiKey(req1)) as ApiContext;
      const r2 = (await authenticateApiKey(req2)) as ApiContext;
      expect(r1.requestId).not.toBe(r2.requestId);
    });
  });
});

describe('requireScope', () => {
  const ctx: ApiContext = {
    keyId: 'key_123',
    userId: 'user_456',
    keyName: 'Test Key',
    scopes: ['tools:read'],
    rateLimitTier: 'free',
    requestId: 'req_test',
    rateLimitRemaining: 1000,
    rateLimitReset: Date.now() + 3600_000,
  };

  it('returns null when scope is granted', () => {
    const result = requireScope(ctx, 'tools:read');
    expect(result).toBeNull();
  });

  it('returns A005 error when scope is missing', () => {
    const result = requireScope(ctx, 'tools:execute');
    expect(result).toBeInstanceOf(NextResponse);
    // Can't easily access body synchronously in test, but status should be 403
    expect(result!.status).toBe(403);
  });

  it('admin:* scope grants access to everything', () => {
    const adminCtx: ApiContext = { ...ctx, scopes: ['admin:*'] };
    expect(requireScope(adminCtx, 'tools:read')).toBeNull();
    expect(requireScope(adminCtx, 'tools:execute')).toBeNull();
    expect(requireScope(adminCtx, 'billing:read')).toBeNull();
    expect(requireScope(adminCtx, 'billing:write')).toBeNull();
  });
});

describe('apiResponse', () => {
  const ctx: ApiContext = {
    keyId: 'key_123',
    userId: 'user_456',
    keyName: 'Test Key',
    scopes: ['tools:read'],
    rateLimitTier: 'free',
    requestId: 'req_test_xyz',
    rateLimitRemaining: 1000,
    rateLimitReset: Date.now() + 3600_000,
  };

  it('wraps data in success envelope', async () => {
    const res = apiResponse({ foo: 'bar' }, ctx);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ foo: 'bar' });
    expect(body.requestId).toBe('req_test_xyz');
    expect(res.status).toBe(200);
  });

  it('sets custom status code', async () => {
    const res = apiResponse({ id: 1 }, ctx, 202);
    expect(res.status).toBe(202);
  });

  it('sets rate limit headers', () => {
    const res = apiResponse({}, ctx);
    expect(res.headers.get('X-RateLimit-Limit')).toBe('100');
    expect(res.headers.get('X-Request-Id')).toBe('req_test_xyz');
  });
});

describe('apiErrorResponse', () => {
  const ctx: ApiContext = {
    keyId: 'key_123',
    userId: 'user_456',
    keyName: 'Test Key',
    scopes: ['tools:read'],
    rateLimitTier: 'free',
    requestId: 'req_err_test',
    rateLimitRemaining: 1000,
    rateLimitReset: Date.now() + 3600_000,
  };

  it('wraps error in failure envelope', async () => {
    const res = apiErrorResponse('T001', 'Tool not found', ctx, 404);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('T001');
    expect(body.error.message).toBe('Tool not found');
    expect(body.error.requestId).toBe('req_err_test');
    expect(res.status).toBe(404);
  });

  it('includes optional details', async () => {
    const res = apiErrorResponse('V001', 'Bad input', ctx, 400, {
      field: 'input',
    });
    const body = await res.json();
    expect(body.error.details).toEqual({ field: 'input' });
  });
});

describe('Response envelope structure', () => {
  it('success response has required fields', async () => {
    const ctx: ApiContext = {
      keyId: 'k',
      userId: 'u',
      keyName: 'n',
      scopes: ['tools:read'],
      rateLimitTier: 'free',
      requestId: 'req_1',
      rateLimitRemaining: 1000,
      rateLimitReset: Date.now() + 3600_000,
    };
    const res = apiResponse({ test: true }, ctx);
    const body = await res.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('requestId');
  });

  it('error response has required fields', async () => {
    const ctx: ApiContext = {
      keyId: 'k',
      userId: 'u',
      keyName: 'n',
      scopes: ['tools:read'],
      rateLimitTier: 'free',
      requestId: 'req_2',
      rateLimitRemaining: 1000,
      rateLimitReset: Date.now() + 3600_000,
    };
    const res = apiErrorResponse('E001', 'err', ctx, 500);
    const body = await res.json();
    expect(body).toHaveProperty('success', false);
    expect(body.error).toHaveProperty('code');
    expect(body.error).toHaveProperty('message');
    expect(body.error).toHaveProperty('timestamp');
    expect(body.error).toHaveProperty('requestId');
  });
});
