/**
 * POST /api/v1/engine/{name} — Engine Execute API Tests
 * Tests auth, scope, engine validation, plan gating, input validation,
 * B2B billing (subscription, suite, quota), idempotency, and job creation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import {
  createMockContext,
  createPostRequest,
  createMockJob,
} from '../../__tests__/helpers';
import type { ApiContext } from '@/lib/api-v1-auth';

// ─── Mocks ────────────────────────────────────────────────────

const mockAuthenticateApiKey = vi.fn();
const mockRequireScope = vi.fn();

vi.mock('@/lib/api-v1-auth', () => ({
  authenticateApiKey: (...args: unknown[]) => mockAuthenticateApiKey(...args),
  requireScope: (...args: unknown[]) => mockRequireScope(...args),
  apiResponse: vi.fn(
    (data: unknown, ctx: ApiContext, status = 200) =>
      NextResponse.json(
        { success: true, data, requestId: ctx.requestId },
        { status },
      ),
  ),
  apiErrorResponse: vi.fn(
    (
      code: string,
      message: string,
      ctx: ApiContext,
      status = 400,
      details?: unknown,
    ) =>
      NextResponse.json(
        {
          success: false,
          error: {
            code,
            message,
            ...(details ? { details } : {}),
            requestId: ctx.requestId,
          },
        },
        { status },
      ),
  ),
}));

const mockRedisGet = vi.fn();
const mockRedisSet = vi.fn();

vi.mock('@/lib/redis', () => ({
  redis: {
    get: (...args: unknown[]) => mockRedisGet(...args),
    set: (...args: unknown[]) => mockRedisSet(...args),
  },
  keys: {
    idempotency: (k: string) => `idempotency:${k}`,
  },
  TTL: {
    IDEMPOTENCY: 86400,
  },
}));

const mockCreateJob = vi.fn();
const mockGetJob = vi.fn();

vi.mock('@/server/jobs/job-manager', () => ({
  createJob: (...args: unknown[]) => mockCreateJob(...args),
  getJob: (...args: unknown[]) => mockGetJob(...args),
}));

const mockGetActiveB2bSubscription = vi.fn();
const mockResolveB2bSuite = vi.fn();
const mockCheckB2bQuota = vi.fn();

vi.mock('@/server/limits/b2b-quota-service', () => {
  class B2bQuotaExhaustedError extends Error {
    suiteId: string;
    limit: number;
    constructor(suiteId: string, limit: number) {
      super(`Quota exhausted for suite ${suiteId}: limit ${limit}`);
      this.suiteId = suiteId;
      this.limit = limit;
    }
  }
  class B2bNoSubscriptionError extends Error {
    constructor() {
      super('No active B2B subscription');
    }
  }
  class B2bSuiteNotAvailableError extends Error {
    suiteId: string;
    constructor(suiteId: string) {
      super(`Suite ${suiteId} not available`);
      this.suiteId = suiteId;
    }
  }
  return {
    getActiveB2bSubscription: (...args: unknown[]) => mockGetActiveB2bSubscription(...args),
    resolveB2bSuite: (...args: unknown[]) => mockResolveB2bSuite(...args),
    checkB2bQuota: (...args: unknown[]) => mockCheckB2bQuota(...args),
    B2bQuotaExhaustedError,
    B2bNoSubscriptionError,
    B2bSuiteNotAvailableError,
  };
});

const mockGetEngine = vi.fn();

vi.mock('@hsafx/tool-execution/engines', () => ({
  getEngine: (...args: unknown[]) => mockGetEngine(...args),
}));

const mockGetUserPlan = vi.fn();

vi.mock('@hsafx/api/helpers', () => ({
  getUserPlan: (...args: unknown[]) => mockGetUserPlan(...args),
}));

vi.mock('@hsafx/shared/permissions', () => ({
  isPlanAtLeast: vi.fn((plan: string, required: string) => {
    const order = ['free', 'pro', 'advance'];
    return order.indexOf(plan) >= order.indexOf(required);
  }),
}));

vi.mock('@hsafx/shared/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

// Import route handler after all mocks
import { POST } from '@/app/api/v1/engine/[name]/route';

// ─── Setup ────────────────────────────────────────────────────

const ctx = createMockContext();

const MOCK_B2B_SUB = {
  subscriptionId: 'sub_123',
  b2bPlanId: 'plan_123',
  currentPeriodStart: new Date('2024-01-01'),
  currentPeriodEnd: new Date('2024-02-01'),
};

const MOCK_SUITE = { suiteId: 'suite_text', suiteName: 'Text Processing' };

const MOCK_QUOTA_OK = {
  allowed: true,
  suiteId: 'suite_text',
  suiteName: 'Text Processing',
  used: 50,
  limit: 1000,
  remaining: 950,
};

function setupBillingDefaults() {
  mockGetActiveB2bSubscription.mockResolvedValue(MOCK_B2B_SUB);
  mockResolveB2bSuite.mockResolvedValue(MOCK_SUITE);
  mockCheckB2bQuota.mockResolvedValue(MOCK_QUOTA_OK);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthenticateApiKey.mockResolvedValue(ctx);
  mockRequireScope.mockReturnValue(null);
  mockGetEngine.mockReturnValue(null); // Rust engines don't need getEngine
  mockRedisGet.mockResolvedValue(null);
  mockRedisSet.mockResolvedValue('OK');
  setupBillingDefaults();
});

// ─── Helpers ──────────────────────────────────────────────────

function callPOST(
  engineName: string,
  body: unknown,
  headers?: Record<string, string>,
) {
  const req = createPostRequest(`/api/v1/engine/${engineName}`, body, headers);
  return POST(req, { params: Promise.resolve({ name: engineName }) });
}

async function expectStatus(res: Response, status: number) {
  expect(res.status).toBe(status);
  return res.json();
}

// ─── Tests ────────────────────────────────────────────────────

describe('POST /api/v1/engine/{name}', () => {
  // ─── Authentication ─────────────────────────────────────────

  describe('Authentication', () => {
    it('returns 401 when auth fails', async () => {
      mockAuthenticateApiKey.mockResolvedValue(
        NextResponse.json(
          { success: false, error: { code: 'A001', message: 'Invalid API key' } },
          { status: 401 },
        ),
      );

      const res = await callPOST('case', { input: 'test' });
      const body = await expectStatus(res, 401);

      expect(body.success).toBe(false);
      expect(body.error.code).toBe('A001');
    });

    it('returns 403 when scope tools:execute is missing', async () => {
      mockRequireScope.mockReturnValue(
        NextResponse.json(
          {
            success: false,
            error: { code: 'A003', message: 'Missing required scope: tools:execute' },
          },
          { status: 403 },
        ),
      );

      const res = await callPOST('case', { input: 'test' });
      const body = await expectStatus(res, 403);

      expect(body.success).toBe(false);
      expect(mockRequireScope).toHaveBeenCalledWith(ctx, 'tools:execute');
    });
  });

  // ─── Engine Validation ──────────────────────────────────────

  describe('Engine Validation', () => {
    it('returns 404 for unknown engine name', async () => {
      const res = await callPOST('nonexistent-engine', { input: 'test' });
      const body = await expectStatus(res, 404);

      expect(body.success).toBe(false);
      expect(body.error.code).toBe('E001');
      expect(body.error.message).toContain('nonexistent-engine');
    });

    it('returns 404 when node engine is not implemented', async () => {
      // 'comment' is a node engine; getEngine returns null means not implemented
      mockGetEngine.mockReturnValue(null);

      const res = await callPOST('comment', { input: 'test' });
      const body = await expectStatus(res, 404);

      expect(body.success).toBe(false);
      expect(body.error.code).toBe('E001');
      expect(body.error.message).toContain('not yet implemented');
    });

    it('accepts valid rust engine without getEngine check', async () => {
      const job = createMockJob({ id: 'job_rust_1', engineName: 'case' });
      mockCreateJob.mockResolvedValue(job);

      const res = await callPOST('case', { input: 'hello world', options: { style: 'camel' } });
      await expectStatus(res, 202);

      // getEngine should NOT be called for rust engines
      expect(mockGetEngine).not.toHaveBeenCalled();
    });
  });

  // ─── Plan-Based Access ──────────────────────────────────────

  describe('Plan-Based Access', () => {
    it('returns 403 when user plan is below required tier', async () => {
      // 'image' requires 'pro' tier
      mockGetUserPlan.mockResolvedValue('free');

      const res = await callPOST('image', { input: { file_url: 'https://example.com/img.png' } });
      const body = await expectStatus(res, 403);

      expect(body.success).toBe(false);
      expect(body.error.code).toBe('P001');
      expect(body.error.message).toContain('pro');
    });

    it('allows access when user plan meets required tier', async () => {
      mockGetUserPlan.mockResolvedValue('pro');
      const job = createMockJob({ id: 'job_image_1', engineName: 'image' });
      mockCreateJob.mockResolvedValue(job);

      const res = await callPOST('image', {
        input: { file_url: 'https://example.com/img.png' },
        options: { operation: 'resize', width: 800 },
      });
      await expectStatus(res, 202);
    });

    it('skips plan check for engines with no tier requirement', async () => {
      // 'case' has no tier requirement — getUserPlan should not be called
      const job = createMockJob({ id: 'job_case_1', engineName: 'case' });
      mockCreateJob.mockResolvedValue(job);

      const res = await callPOST('case', { input: 'hello' });
      await expectStatus(res, 202);

      expect(mockGetUserPlan).not.toHaveBeenCalled();
    });
  });

  // ─── Input Validation ───────────────────────────────────────

  describe('Input Validation', () => {
    it('returns 400 for invalid JSON body', async () => {
      // Simulate non-JSON body by using a request that will fail .json()
      const req = new (await import('next/server')).NextRequest(
        new URL('/api/v1/engine/case', 'http://localhost'),
        {
          method: 'POST',
          body: 'not json{{{',
          headers: {
            'content-type': 'application/json',
            authorization: 'Bearer hsafx_test_key',
          },
        },
      );

      const res = await POST(req, { params: Promise.resolve({ name: 'case' }) });
      const body = await expectStatus(res, 400);

      expect(body.success).toBe(false);
      expect(body.error.code).toBe('V001');
    });

    it('returns 400 when input field is missing', async () => {
      const res = await callPOST('case', { options: { style: 'camel' } });
      const body = await expectStatus(res, 400);

      expect(body.success).toBe(false);
      expect(body.error.code).toBe('V002');
      expect(body.error.message).toContain('input');
    });

    it('returns 413 when text input exceeds 512 KB', async () => {
      const largeInput = 'x'.repeat(512 * 1024 + 1);

      const res = await callPOST('case', { input: largeInput });
      const body = await expectStatus(res, 413);

      expect(body.success).toBe(false);
      expect(body.error.code).toBe('V005');
    });

    it('allows non-string input without size check', async () => {
      // Object input (e.g. for media engines) should not trigger size limit
      const job = createMockJob({ id: 'job_obj_1' });
      mockCreateJob.mockResolvedValue(job);

      const res = await callPOST('case', { input: { data: 'hello' } });
      await expectStatus(res, 202);
    });

    it('returns 400 when options is an array', async () => {
      const res = await callPOST('case', { input: 'hello', options: [1, 2, 3] });
      const body = await expectStatus(res, 400);

      expect(body.success).toBe(false);
      expect(body.error.code).toBe('V003');
      expect(body.error.message).toContain('options');
    });

    it('returns 400 when options is a string', async () => {
      const res = await callPOST('case', { input: 'hello', options: 'bad' });
      const body = await expectStatus(res, 400);

      expect(body.success).toBe(false);
      expect(body.error.code).toBe('V003');
    });
  });

  // ─── Node Engine Validation ─────────────────────────────────

  describe('Node Engine Option Validation', () => {
    it('returns 400 when node engine validate() fails', async () => {
      mockGetEngine.mockReturnValue({
        validate: () => ({ valid: false, errors: ['Missing required option: language'] }),
      });
      mockGetUserPlan.mockResolvedValue('pro'); // schema requires pro

      const res = await callPOST('schema', { input: '{}', options: {} });
      const body = await expectStatus(res, 400);

      expect(body.success).toBe(false);
      expect(body.error.code).toBe('V004');
      expect(body.error.message).toContain('language');
      expect(body.error.details.engine).toBe('schema');
    });

    it('passes when node engine validate() succeeds', async () => {
      mockGetEngine.mockReturnValue({
        validate: () => ({ valid: true, errors: [] }),
      });
      const job = createMockJob({ id: 'job_node_1', engineName: 'comment' });
      mockCreateJob.mockResolvedValue(job);

      const res = await callPOST('comment', { input: 'const x = 1;', options: { language: 'javascript' } });
      await expectStatus(res, 202);
    });
  });

  // ─── B2B Billing ────────────────────────────────────────────

  describe('B2B Billing', () => {
    it('returns 403 when no active B2B subscription', async () => {
      mockGetActiveB2bSubscription.mockResolvedValue(null);

      const res = await callPOST('case', { input: 'hello' });
      const body = await expectStatus(res, 403);

      expect(body.success).toBe(false);
      expect(body.error.code).toBe('B004');
    });

    it('returns 500 when no B2B suite configured for engine', async () => {
      mockResolveB2bSuite.mockResolvedValue(null);

      const res = await callPOST('case', { input: 'hello' });
      const body = await expectStatus(res, 500);

      expect(body.success).toBe(false);
      expect(body.error.code).toBe('B003');
    });

    it('returns 403 when B2B quota is exhausted', async () => {
      mockCheckB2bQuota.mockResolvedValue({
        allowed: false,
        suiteId: 'suite_text',
        suiteName: 'Text Processing',
        used: 1000,
        limit: 1000,
        remaining: 0,
      });

      const res = await callPOST('case', { input: 'hello' });
      const body = await expectStatus(res, 403);

      expect(body.success).toBe(false);
      expect(body.error.code).toBe('B002');
      expect(body.error.message).toContain('1000/1000');
    });

    it('passes quota info to response on success', async () => {
      const job = createMockJob({ id: 'job_billing_1' });
      mockCreateJob.mockResolvedValue(job);

      const res = await callPOST('case', { input: 'hello' });
      const body = await expectStatus(res, 202);

      expect(body.data.billing).toEqual({
        type: 'b2b_ops',
        opsUsedBefore: 50,
        opsLimit: 1000,
        opsRemaining: 950,
      });
    });

    it('resolves suite using engine name', async () => {
      const job = createMockJob({ id: 'job_suite_1' });
      mockCreateJob.mockResolvedValue(job);

      await callPOST('case', { input: 'hello' });

      // Suite is resolved by engine name (not category), toolId is 'engine:case'
      expect(mockResolveB2bSuite).toHaveBeenCalledWith('case', 'engine:case');
    });

    it('handles B2bQuotaExhaustedError thrown by checkB2bQuota', async () => {
      const { B2bQuotaExhaustedError } = await import('@/server/limits/b2b-quota-service');
      mockCheckB2bQuota.mockRejectedValue(new B2bQuotaExhaustedError('suite_text', 1000));

      const res = await callPOST('case', { input: 'hello' });
      const body = await expectStatus(res, 403);

      expect(body.error.code).toBe('B002');
    });

    it('handles B2bNoSubscriptionError thrown by service', async () => {
      const { B2bNoSubscriptionError } = await import('@/server/limits/b2b-quota-service');
      mockCheckB2bQuota.mockRejectedValue(new B2bNoSubscriptionError());

      const res = await callPOST('case', { input: 'hello' });
      const body = await expectStatus(res, 403);

      expect(body.error.code).toBe('B004');
    });
  });

  // ─── Idempotency ────────────────────────────────────────────

  describe('Idempotency', () => {
    it('returns cached result on duplicate idempotency key', async () => {
      const cachedData = {
        jobId: 'job_cached_1',
        status: 'queued',
        engine: 'case',
      };
      mockRedisGet.mockResolvedValue(JSON.stringify(cachedData));

      const res = await callPOST(
        'case',
        { input: 'hello' },
        { 'idempotency-key': 'idem-123' },
      );
      const body = await expectStatus(res, 202);

      expect(body.data.jobId).toBe('job_cached_1');
      // Should not create a new job
      expect(mockCreateJob).not.toHaveBeenCalled();
    });

    it('updates cached result status from live job', async () => {
      const cachedData = {
        jobId: 'job_live_1',
        status: 'queued',
        engine: 'case',
      };
      mockRedisGet.mockResolvedValue(JSON.stringify(cachedData));
      mockGetJob.mockResolvedValue(createMockJob({ id: 'job_live_1', status: 'completed' }));

      const res = await callPOST(
        'case',
        { input: 'hello' },
        { 'idempotency-key': 'idem-456' },
      );
      const body = await expectStatus(res, 202);

      expect(body.data.status).toBe('completed');
    });

    it('stores response in Redis when idempotency key provided', async () => {
      const job = createMockJob({ id: 'job_idem_new' });
      mockCreateJob.mockResolvedValue(job);

      await callPOST(
        'case',
        { input: 'hello' },
        { 'idempotency-key': 'idem-new' },
      );

      expect(mockRedisSet).toHaveBeenCalledWith(
        expect.stringContaining('idempotency:'),
        expect.any(String),
        { ex: 86400 },
      );
    });

    it('skips idempotency when no key provided', async () => {
      const job = createMockJob({ id: 'job_no_idem' });
      mockCreateJob.mockResolvedValue(job);

      await callPOST('case', { input: 'hello' });

      // Redis set should not be called for idempotency (no key header)
      expect(mockRedisSet).not.toHaveBeenCalled();
    });
  });

  // ─── Job Creation ───────────────────────────────────────────

  describe('Job Creation', () => {
    it('returns 202 with jobId for valid request', async () => {
      const job = createMockJob({ id: 'job_success_1', status: 'queued' });
      mockCreateJob.mockResolvedValue(job);

      const res = await callPOST('case', { input: 'hello world', options: { style: 'camel' } });
      const body = await expectStatus(res, 202);

      expect(body.success).toBe(true);
      expect(body.data.jobId).toBe('job_success_1');
      expect(body.data.status).toBe('queued');
      expect(body.data.engine).toBe('case');
      expect(body.data.links.status).toBe('/api/v1/jobs/job_success_1');
      expect(body.data.links.result).toBe('/api/v1/jobs/job_success_1/result');
    });

    it('passes correct params to createJob', async () => {
      const job = createMockJob({ id: 'job_params_1' });
      mockCreateJob.mockResolvedValue(job);

      await callPOST('case', { input: 'hello', options: { style: 'camel' } });

      expect(mockCreateJob).toHaveBeenCalledWith({
        engineName: 'case',
        toolId: 'engine:case',
        toolSlug: 'engine:case',
        userId: ctx.userId,
        apiKeyId: ctx.keyId,
        input: 'hello',
        options: expect.objectContaining({
          style: 'camel',
          _engineName: 'case',
          _isB2b: true,
          _b2bSuiteId: 'suite_text',
          _runtime: 'rust',
        }),
        source: 'api_v1',
      });
    });

    it('strips internal keys from user-supplied options', async () => {
      const job = createMockJob({ id: 'job_strip_1' });
      mockCreateJob.mockResolvedValue(job);

      await callPOST('case', {
        input: 'hello',
        options: {
          style: 'camel',
          _sneaky: 'hack',
          _internal: true,
          reservationId: 'res_123',
          coinCost: 50,
          keepThis: 'yes',
        },
      });

      const createJobArg = mockCreateJob.mock.calls[0]![0];
      expect(createJobArg.options.style).toBe('camel');
      expect(createJobArg.options.keepThis).toBe('yes');
      // System internal keys should be set by route, not user
      expect(createJobArg.options._engineName).toBe('case');
      expect(createJobArg.options._isB2b).toBe(true);
      // User-supplied internal keys should be stripped
      expect(createJobArg.options._sneaky).toBeUndefined();
      expect(createJobArg.options.reservationId).toBeUndefined();
      expect(createJobArg.options.coinCost).toBeUndefined();
    });

    it('defaults options to empty object when not provided', async () => {
      const job = createMockJob({ id: 'job_no_opts' });
      mockCreateJob.mockResolvedValue(job);

      await callPOST('case', { input: 'hello' });

      const createJobArg = mockCreateJob.mock.calls[0]![0];
      // Only system keys, no user options
      expect(createJobArg.options._engineName).toBe('case');
      expect(createJobArg.options._isB2b).toBe(true);
    });

    it('sets runtime to python for media engines', async () => {
      mockGetUserPlan.mockResolvedValue('pro');
      const job = createMockJob({ id: 'job_python_1' });
      mockCreateJob.mockResolvedValue(job);

      await callPOST('image', {
        input: { file_url: 'https://example.com/img.png' },
        options: { operation: 'resize' },
      });

      const createJobArg = mockCreateJob.mock.calls[0]![0];
      expect(createJobArg.options._runtime).toBe('python');
    });
  });
});
