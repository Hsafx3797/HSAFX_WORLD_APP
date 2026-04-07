/**
 * POST /api/v1/batch — Batch Engine API Tests
 * Tests auth, operation validation, B2B billing aggregation,
 * quota checks, and multi-job creation.
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

const mockCreateJob = vi.fn();

vi.mock('@/server/jobs/job-manager', () => ({
  createJob: (...args: unknown[]) => mockCreateJob(...args),
}));

const mockGetActiveB2bSubscription = vi.fn();
const mockResolveB2bSuite = vi.fn();
const mockCheckB2bQuota = vi.fn();

vi.mock('@/server/limits/b2b-quota-service', () => ({
  getActiveB2bSubscription: (...args: unknown[]) => mockGetActiveB2bSubscription(...args),
  resolveB2bSuite: (...args: unknown[]) => mockResolveB2bSuite(...args),
  checkB2bQuota: (...args: unknown[]) => mockCheckB2bQuota(...args),
}));

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
import { POST } from '@/app/api/v1/batch/route';

// ─── Setup ────────────────────────────────────────────────────

const ctx = createMockContext();

const MOCK_B2B_SUB = {
  subscriptionId: 'sub_123',
  b2bPlanId: 'plan_123',
  currentPeriodStart: new Date('2024-01-01'),
  currentPeriodEnd: new Date('2024-02-01'),
};

const MOCK_SUITE_TEXT = { suiteId: 'suite_text', suiteName: 'Text Processing' };

const MOCK_QUOTA_OK = {
  allowed: true,
  suiteId: 'suite_text',
  suiteName: 'Text Processing',
  used: 10,
  limit: 1000,
  remaining: 990,
};

let jobCounter = 0;

function setupDefaults() {
  mockGetActiveB2bSubscription.mockResolvedValue(MOCK_B2B_SUB);
  mockResolveB2bSuite.mockResolvedValue(MOCK_SUITE_TEXT);
  mockCheckB2bQuota.mockResolvedValue(MOCK_QUOTA_OK);
  jobCounter = 0;
  mockCreateJob.mockImplementation(() => {
    jobCounter++;
    return Promise.resolve(createMockJob({ id: `job_batch_${jobCounter}`, status: 'queued' }));
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthenticateApiKey.mockResolvedValue(ctx);
  mockRequireScope.mockReturnValue(null);
  mockGetEngine.mockReturnValue(null);
  setupDefaults();
});

// ─── Helpers ──────────────────────────────────────────────────

function callPOST(body: unknown, headers?: Record<string, string>) {
  const req = createPostRequest('/api/v1/batch', body, headers);
  return POST(req);
}

async function expectStatus(res: Response, status: number) {
  expect(res.status).toBe(status);
  return res.json();
}

// ─── Tests ────────────────────────────────────────────────────

describe('POST /api/v1/batch', () => {
  // ─── Authentication ─────────────────────────────────────────

  describe('Authentication', () => {
    it('returns 401 when auth fails', async () => {
      mockAuthenticateApiKey.mockResolvedValue(
        NextResponse.json(
          { success: false, error: { code: 'A001', message: 'Invalid API key' } },
          { status: 401 },
        ),
      );

      const res = await callPOST({ operations: [{ engine: 'case', input: 'test' }] });
      const body = await expectStatus(res, 401);

      expect(body.success).toBe(false);
    });

    it('returns 403 when scope is missing', async () => {
      mockRequireScope.mockReturnValue(
        NextResponse.json(
          { success: false, error: { code: 'A003', message: 'Missing scope' } },
          { status: 403 },
        ),
      );

      const res = await callPOST({ operations: [{ engine: 'case', input: 'test' }] });
      await expectStatus(res, 403);
    });
  });

  // ─── Operations Validation ──────────────────────────────────

  describe('Operations Validation', () => {
    it('returns 400 when operations is not an array', async () => {
      const res = await callPOST({ operations: 'not-array' });
      const body = await expectStatus(res, 400);

      expect(body.error.code).toBe('J005'); // BATCH_EMPTY
    });

    it('returns 400 when operations is empty', async () => {
      const res = await callPOST({ operations: [] });
      const body = await expectStatus(res, 400);

      expect(body.error.code).toBe('J005');
    });

    it('returns 400 when batch exceeds 100 items', async () => {
      const ops = Array.from({ length: 101 }, (_, i) => ({
        engine: 'case',
        input: `item-${i}`,
      }));

      const res = await callPOST({ operations: ops });
      const body = await expectStatus(res, 400);

      expect(body.error.code).toBe('J004'); // BATCH_TOO_LARGE
      expect(body.error.message).toContain('101');
    });

    it('returns 400 when operation is not an object', async () => {
      const res = await callPOST({ operations: ['string-not-object'] });
      const body = await expectStatus(res, 400);

      expect(body.error.code).toBe('V003');
      expect(body.error.message).toContain('operations[0]');
    });

    it('returns 400 when operation missing engine field', async () => {
      const res = await callPOST({ operations: [{ input: 'hello' }] });
      const body = await expectStatus(res, 400);

      expect(body.error.code).toBe('V002');
      expect(body.error.message).toContain('engine');
    });

    it('returns 400 when operation missing input field', async () => {
      const res = await callPOST({ operations: [{ engine: 'case' }] });
      const body = await expectStatus(res, 400);

      expect(body.error.code).toBe('V002');
      expect(body.error.message).toContain('input');
    });

    it('returns 404 for unknown engine in batch', async () => {
      const res = await callPOST({
        operations: [{ engine: 'bogus', input: 'hello' }],
      });
      const body = await expectStatus(res, 404);

      expect(body.error.code).toBe('E001');
      expect(body.error.message).toContain('operations[0]');
    });

    it('returns 413 when a single item input is too large', async () => {
      const largeInput = 'x'.repeat(512 * 1024 + 1);
      const res = await callPOST({
        operations: [{ engine: 'case', input: largeInput }],
      });
      const body = await expectStatus(res, 413);

      expect(body.error.code).toBe('V005');
    });

    it('returns 400 when item options is an array', async () => {
      const res = await callPOST({
        operations: [{ engine: 'case', input: 'hello', options: [1] }],
      });
      const body = await expectStatus(res, 400);

      expect(body.error.code).toBe('V003');
    });
  });

  // ─── Plan Gating ────────────────────────────────────────────

  describe('Plan Gating', () => {
    it('returns 403 when batch contains engine above user tier', async () => {
      mockGetUserPlan.mockResolvedValue('free');

      const res = await callPOST({
        operations: [
          { engine: 'case', input: 'hello' },
          { engine: 'image', input: { file_url: 'https://example.com/img.png' } },
        ],
      });
      const body = await expectStatus(res, 403);

      expect(body.error.code).toBe('P001');
      expect(body.error.message).toContain('operations[1]');
    });
  });

  // ─── B2B Billing ────────────────────────────────────────────

  describe('B2B Billing', () => {
    it('returns 403 when no B2B subscription', async () => {
      mockGetActiveB2bSubscription.mockResolvedValue(null);

      const res = await callPOST({
        operations: [{ engine: 'case', input: 'hello' }],
      });
      const body = await expectStatus(res, 403);

      expect(body.error.code).toBe('B004');
    });

    it('returns 403 when batch exceeds remaining quota', async () => {
      mockCheckB2bQuota.mockResolvedValue({
        allowed: true,
        suiteId: 'suite_text',
        suiteName: 'Text Processing',
        used: 998,
        limit: 1000,
        remaining: 2,
      });

      const res = await callPOST({
        operations: [
          { engine: 'case', input: 'a' },
          { engine: 'wrap', input: 'b' },
          { engine: 'filter', input: 'c' },
        ],
      });
      const body = await expectStatus(res, 403);

      expect(body.error.code).toBe('B002');
      expect(body.error.message).toContain('3');
      expect(body.error.message).toContain('2');
    });

    it('returns 500 when suite not configured', async () => {
      mockResolveB2bSuite.mockResolvedValue(null);

      const res = await callPOST({
        operations: [{ engine: 'case', input: 'hello' }],
      });
      const body = await expectStatus(res, 500);

      expect(body.error.code).toBe('B003');
    });
  });

  // ─── Successful Batch ───────────────────────────────────────

  describe('Successful Batch', () => {
    it('returns 202 with batchId and job list', async () => {
      const res = await callPOST({
        operations: [
          { engine: 'case', input: 'hello' },
          { engine: 'wrap', input: 'world' },
        ],
      });
      const body = await expectStatus(res, 202);

      expect(body.success).toBe(true);
      expect(body.data.batchId).toMatch(/^batch_/);
      expect(body.data.totalOperations).toBe(2);
      expect(body.data.jobs).toHaveLength(2);
      expect(body.data.jobs[0].engine).toBe('case');
      expect(body.data.jobs[1].engine).toBe('wrap');
      expect(body.data.jobs[0].status).toBe('queued');
      expect(body.data.links.jobs).toHaveLength(2);
    });

    it('creates a job for each operation', async () => {
      await callPOST({
        operations: [
          { engine: 'case', input: 'a', options: { style: 'camel' } },
          { engine: 'hash', input: 'b', options: { algorithm: 'sha256' } },
        ],
      });

      expect(mockCreateJob).toHaveBeenCalledTimes(2);

      const call1 = mockCreateJob.mock.calls[0][0];
      expect(call1.engineName).toBe('case');
      expect(call1.input).toBe('a');
      expect(call1.options.style).toBe('camel');
      expect(call1.options._batchId).toMatch(/^batch_/);
      expect(call1.source).toBe('api_v1_batch');

      const call2 = mockCreateJob.mock.calls[1][0];
      expect(call2.engineName).toBe('hash');
      expect(call2.input).toBe('b');
    });

    it('strips internal keys from operation options', async () => {
      await callPOST({
        operations: [
          {
            engine: 'case',
            input: 'hello',
            options: { style: 'camel', _hack: true, reservationId: 'r1', coinCost: 5 },
          },
        ],
      });

      const opts = mockCreateJob.mock.calls[0][0].options;
      expect(opts.style).toBe('camel');
      expect(opts._engineName).toBe('case');
      expect(opts._isB2b).toBe(true);
      expect(opts._hack).toBeUndefined();
      expect(opts.reservationId).toBeUndefined();
      expect(opts.coinCost).toBeUndefined();
    });

    it('includes billing quota info in response', async () => {
      const res = await callPOST({
        operations: [{ engine: 'case', input: 'hello' }],
      });
      const body = await expectStatus(res, 202);

      expect(body.data.billing.type).toBe('b2b_ops');
      expect(body.data.billing.suiteQuotas).toBeDefined();
      expect(body.data.billing.suiteQuotas['Text Processing']).toEqual({
        used: 10,
        limit: 1000,
        remaining: 990,
      });
    });
  });

  // ─── Node Engine Handling ───────────────────────────────────

  describe('Node Engine in Batch', () => {
    it('returns 404 when node engine is not implemented', async () => {
      mockGetEngine.mockReturnValue(null);

      const res = await callPOST({
        operations: [{ engine: 'comment', input: 'const x = 1;' }],
      });
      const body = await expectStatus(res, 404);

      expect(body.error.message).toContain('not yet implemented');
    });

    it('returns 400 when node engine validation fails', async () => {
      mockGetEngine.mockReturnValue({
        validate: () => ({ valid: false, errors: ['Missing: language'] }),
      });

      const res = await callPOST({
        operations: [{ engine: 'comment', input: 'code', options: {} }],
      });
      const body = await expectStatus(res, 400);

      expect(body.error.code).toBe('V004');
    });
  });
});
