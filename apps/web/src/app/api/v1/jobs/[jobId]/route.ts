/**
 * GET /api/v1/jobs/[jobId]
 * Get job status and metadata.
 * Requires scope: tools:read
 */

import { NextRequest } from 'next/server';
import {
  authenticateApiKey,
  requireScope,
  apiResponse,
  apiErrorResponse,
  type ApiContext,
} from '@/lib/api-v1-auth';
import { ApiErrorCode } from '@hsafx/shared/errors';
import { getJob } from '@/server/jobs/job-manager';

interface Params {
  params: Promise<{ jobId: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  // 1. Auth
  const result = await authenticateApiKey(request);
  if (result instanceof Response) return result;
  const ctx = result as ApiContext;

  // 2. Scope check
  const scopeErr = requireScope(ctx, 'tools:read');
  if (scopeErr) return scopeErr;

  // 3. Fetch job
  const { jobId } = await params;
  const job = await getJob(jobId);

  if (!job) {
    return apiErrorResponse(ApiErrorCode.JOB_NOT_FOUND, `Job '${jobId}' not found`, ctx, 404);
  }

  // 4. Security: ensure job belongs to this API key's owner
  if (job.userId !== ctx.userId) {
    return apiErrorResponse(ApiErrorCode.JOB_NOT_FOUND, `Job '${jobId}' not found`, ctx, 404);
  }

  return apiResponse(
    {
      jobId: job.id,
      status: job.status,
      toolId: job.toolId,
      toolSlug: job.toolSlug,
      progress: job.progress,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      completedAt: job.completedAt,
      error: job.status === 'failed' ? job.error : undefined,
      links:
        job.status === 'completed'
          ? { result: `/api/v1/jobs/${job.id}/result` }
          : undefined,
    },
    ctx,
  );
}
