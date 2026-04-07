/**
 * GET /api/v1/jobs/[jobId] — Job Status API Tests
 * Tests job lookup, ownership security, status reporting, error states.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { createMockContext, createGetRequest, createMockJob } from './helpers';
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

vi.mock('@/server/jobs/job-manager', () => ({
  getJob: (...args: unknown[]) => mockGetJob(...args),
}));

// Import route handler after mocks
import { GET } from '@/app/api/v1/jobs/[jobId]/route';

// ─── Setup ────────────────────────────────────────────────────

const ctx = createMockContext();

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthenticateApiKey.mockResolvedValue(ctx);
  mockRequireScope.mockReturnValue(null);
});

// ─── Helper ───────────────────────────────────────────────────

function callGET(jobId: string) {
  const req = createGetRequest(`/api/v1/jobs/${jobId}`);
  return GET(req, { params: Promise.resolve({ jobId }) });
}

// ─── Tests ────────────────────────────────────────────────────

describe('GET /api/v1/jobs/[jobId]', () => {
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
      expect(body.error.message).toContain('job_nonexistent');
    });
  });

  describe('Ownership Security', () => {
    it('returns 404 (not 403) when job belongs to different user', async () => {
      mockGetJob.mockResolvedValue(
        createMockJob({ userId: 'different_user_999' }),
      );

      const res = await callGET('job_test_abc123');
      const body = await res.json();

      // Must return 404, not 403.  Prevents enumeration.
      expect(res.status).toBe(404);
      expect(body.error.code).toBe('J001');
    });

    it('returns job data when userId matches', async () => {
      mockGetJob.mockResolvedValue(createMockJob({ userId: ctx.userId }));

      const res = await callGET('job_test_abc123');
      expect(res.status).toBe(200);
    });
  });

  describe('Job Status Responses', () => {
    it('returns queued job status', async () => {
      const ts = new Date().toISOString();
      mockGetJob.mockResolvedValue(
        createMockJob({
          userId: ctx.userId,
          status: 'queued',
          progress: 0,
          createdAt: ts,
          updatedAt: ts,
        }),
      );

      const res = await callGET('job_test_abc123');
      const body = await res.json();

      expect(body.data.status).toBe('queued');
      expect(body.data.progress).toBe(0);
      expect(body.data.createdAt).toBe(ts);
      expect(body.data.links).toBeUndefined();
      expect(body.data.error).toBeUndefined();
    });

    it('returns processing job with progress', async () => {
      mockGetJob.mockResolvedValue(
        createMockJob({
          userId: ctx.userId,
          status: 'processing',
          progress: 65,
        }),
      );

      const res = await callGET('job_test_abc123');
      const body = await res.json();

      expect(body.data.status).toBe('processing');
      expect(body.data.progress).toBe(65);
      expect(body.data.links).toBeUndefined();
    });

    it('returns completed job with result link', async () => {
      mockGetJob.mockResolvedValue(
        createMockJob({
          id: 'job_completed_1',
          userId: ctx.userId,
          status: 'completed',
          progress: 100,
          completedAt: new Date().toISOString(),
        }),
      );

      const res = await callGET('job_completed_1');
      const body = await res.json();

      expect(body.data.status).toBe('completed');
      expect(body.data.completedAt).toBeDefined();
      expect(body.data.links).toEqual({
        result: '/api/v1/jobs/job_completed_1/result',
      });
    });

    it('returns failed job with error message', async () => {
      mockGetJob.mockResolvedValue(
        createMockJob({
          userId: ctx.userId,
          status: 'failed',
          error: 'Tool execution timed out',
        }),
      );

      const res = await callGET('job_test_abc123');
      const body = await res.json();

      expect(body.data.status).toBe('failed');
      expect(body.data.error).toBe('Tool execution timed out');
      expect(body.data.links).toBeUndefined();
    });

    it('does not leak error field for non-failed jobs', async () => {
      mockGetJob.mockResolvedValue(
        createMockJob({
          userId: ctx.userId,
          status: 'processing',
          error: undefined,
        }),
      );

      const res = await callGET('job_test_abc123');
      const body = await res.json();

      expect(body.data.error).toBeUndefined();
    });
  });

  describe('Response Shape', () => {
    it('includes all expected fields', async () => {
      mockGetJob.mockResolvedValue(
        createMockJob({
          id: 'job_shape_test',
          userId: ctx.userId,
          toolId: 'base64-encode',
          toolSlug: 'base64-encode',
          status: 'queued',
          progress: 0,
        }),
      );

      const res = await callGET('job_shape_test');
      const body = await res.json();

      expect(body.success).toBe(true);
      expect(body.requestId).toBe(ctx.requestId);
      expect(body.data).toEqual(
        expect.objectContaining({
          jobId: 'job_shape_test',
          status: 'queued',
          toolId: 'base64-encode',
          toolSlug: 'base64-encode',
          progress: 0,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      );
    });
  });
});
