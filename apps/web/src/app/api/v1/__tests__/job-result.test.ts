/**
 * GET /api/v1/jobs/[jobId]/result — Job Result API Tests
 * Tests result retrieval, status preconditions, expiry, download URL.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import {
  createMockContext,
  createGetRequest,
  createMockJob,
  createMockJobResult,
} from './helpers';
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

const mockGetJob = vi.fn();
const mockGetJobResult = vi.fn();

vi.mock('@/server/jobs/job-manager', () => ({
  getJob: (...args: unknown[]) => mockGetJob(...args),
  getJobResult: (...args: unknown[]) => mockGetJobResult(...args),
}));

// Import route handler after mocks
import { GET } from '@/app/api/v1/jobs/[jobId]/result/route';

// ─── Setup ────────────────────────────────────────────────────

const ctx = createMockContext();

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthenticateApiKey.mockResolvedValue(ctx);
  mockRequireScope.mockReturnValue(null);
});

// ─── Helper ───────────────────────────────────────────────────

function callGET(jobId: string) {
  const req = createGetRequest(`/api/v1/jobs/${jobId}/result`);
  return GET(req, { params: Promise.resolve({ jobId }) });
}

// ─── Tests ────────────────────────────────────────────────────

describe('GET /api/v1/jobs/[jobId]/result', () => {
  describe('Authentication', () => {
    it('returns 401 when auth fails', async () => {
      mockAuthenticateApiKey.mockResolvedValue(
        NextResponse.json(
          { success: false, error: { code: 'A001' } },
          { status: 401 },
        ),
      );
      const res = await callGET('job_test_123');
      expect(res.status).toBe(401);
    });

    it('returns 403 when tools:read scope missing', async () => {
      mockRequireScope.mockReturnValue(
        NextResponse.json(
          { success: false, error: { code: 'A005' } },
          { status: 403 },
        ),
      );
      const res = await callGET('job_test_123');
      expect(res.status).toBe(403);
    });
  });

  describe('Job Not Found (J001)', () => {
    it('returns 404 when job does not exist', async () => {
      mockGetJob.mockResolvedValue(null);

      const res = await callGET('job_nonexistent');
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error.code).toBe('J001');
    });
  });

  describe('Ownership Security', () => {
    it('returns 404 when job belongs to different user', async () => {
      mockGetJob.mockResolvedValue(
        createMockJob({
          status: 'completed',
          userId: 'different_user_999',
        }),
      );

      const res = await callGET('job_test_abc123');
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error.code).toBe('J001');
    });
  });

  describe('Job Not Completed (J002)', () => {
    it.each([
      ['queued', 0],
      ['processing', 45],
      ['preparing', 10],
    ] as const)(
      'returns 409 when job is %s (progress %d)',
      async (status, progress) => {
        mockGetJob.mockResolvedValue(
          createMockJob({ userId: ctx.userId, status, progress }),
        );

        const res = await callGET('job_test_abc123');
        const body = await res.json();

        expect(res.status).toBe(409);
        expect(body.error.code).toBe('J002');
        expect(body.error.message).toContain(status);
        expect(body.error.details).toEqual(
          expect.objectContaining({ status, progress }),
        );
      },
    );

    it('returns 409 when job is failed', async () => {
      mockGetJob.mockResolvedValue(
        createMockJob({
          userId: ctx.userId,
          status: 'failed',
          error: 'Execution error',
        }),
      );

      const res = await callGET('job_test_abc123');
      const body = await res.json();

      expect(res.status).toBe(409);
      expect(body.error.code).toBe('J002');
    });
  });

  describe('Result Expired (J003)', () => {
    it('returns 410 when result has expired', async () => {
      mockGetJob.mockResolvedValue(
        createMockJob({ userId: ctx.userId, status: 'completed' }),
      );
      mockGetJobResult.mockResolvedValue(null);

      const res = await callGET('job_test_abc123');
      const body = await res.json();

      expect(res.status).toBe(410);
      expect(body.error.code).toBe('J003');
      expect(body.error.message).toContain('expired');
    });
  });

  describe('Successful Result', () => {
    it('returns output and metadata for completed job', async () => {
      mockGetJob.mockResolvedValue(
        createMockJob({ userId: ctx.userId, status: 'completed' }),
      );
      mockGetJobResult.mockResolvedValue(
        createMockJobResult({
          output: 'HELLO WORLD',
          metadata: { charCount: 11 },
        }),
      );

      const res = await callGET('job_test_abc123');
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.output).toBe('HELLO WORLD');
      expect(body.data.metadata).toEqual({ charCount: 11 });
    });

    it('returns empty metadata when not provided', async () => {
      mockGetJob.mockResolvedValue(
        createMockJob({ userId: ctx.userId, status: 'completed' }),
      );
      mockGetJobResult.mockResolvedValue(
        createMockJobResult({ output: 'test', metadata: undefined }),
      );

      const res = await callGET('job_test_abc123');
      const body = await res.json();

      expect(body.data.metadata).toEqual({});
    });

    it('includes downloadUrl when result has one', async () => {
      mockGetJob.mockResolvedValue(
        createMockJob({ userId: ctx.userId, status: 'completed' }),
      );
      mockGetJobResult.mockResolvedValue(
        createMockJobResult({
          output: null,
          downloadUrl: 'https://storage.example.com/results/abc.zip',
          expiresAt: '2025-12-31T00:00:00Z',
          metadata: { fileSize: 1024 },
        }),
      );

      const res = await callGET('job_test_abc123');
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.downloadUrl).toBe(
        'https://storage.example.com/results/abc.zip',
      );
      expect(body.data.expiresAt).toBe('2025-12-31T00:00:00Z');
      expect(body.data.output).toBeNull();
    });

    it('omits downloadUrl and expiresAt for inline results', async () => {
      mockGetJob.mockResolvedValue(
        createMockJob({ userId: ctx.userId, status: 'completed' }),
      );
      mockGetJobResult.mockResolvedValue(
        createMockJobResult({
          output: 'inline output data',
          downloadUrl: undefined,
        }),
      );

      const res = await callGET('job_test_abc123');
      const body = await res.json();

      expect(body.data.output).toBe('inline output data');
      expect(body.data.downloadUrl).toBeUndefined();
      expect(body.data.expiresAt).toBeUndefined();
    });
  });

  describe('Response Envelope', () => {
    it('has success flag and requestId', async () => {
      mockGetJob.mockResolvedValue(
        createMockJob({ userId: ctx.userId, status: 'completed' }),
      );
      mockGetJobResult.mockResolvedValue(createMockJobResult());

      const res = await callGET('job_test_abc123');
      const body = await res.json();

      expect(body.success).toBe(true);
      expect(body.requestId).toBe(ctx.requestId);
    });

    it('error response has success=false and error code', async () => {
      mockGetJob.mockResolvedValue(null);

      const res = await callGET('job_nonexistent');
      const body = await res.json();

      expect(body.success).toBe(false);
      expect(body.error.code).toBeDefined();
      expect(body.error.requestId).toBe(ctx.requestId);
    });
  });
});
