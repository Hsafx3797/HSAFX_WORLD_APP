/**
 * GET /api/v1/jobs/[jobId]/result
 * Download or retrieve the completed job result.
 * Requires scope: tools:read
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateApiKey,
  requireScope,
  apiResponse,
  apiErrorResponse,
  type ApiContext,
} from '@/lib/api-v1-auth';
import { getJob, getJobResult } from '@/server/jobs/job-manager';

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
    return apiErrorResponse('J001', `Job '${jobId}' not found`, ctx, 404);
  }

  // 4. Security: ensure job belongs to this API key's owner
  if (job.userId !== ctx.userId) {
    return apiErrorResponse('J001', `Job '${jobId}' not found`, ctx, 404);
  }

  // 5. Check status
  if (job.status !== 'completed') {
    return apiErrorResponse(
      'J002',
      `Job is not completed yet. Current status: ${job.status}`,
      ctx,
      409,
      { status: job.status, progress: job.progress },
    );
  }

  // 6. Get result
  const jobResult = await getJobResult(jobId);

  if (!jobResult) {
    return apiErrorResponse(
      'J003',
      'Job result expired or unavailable',
      ctx,
      410,
    );
  }

  // If result has a downloadUrl, redirect to it
  if (jobResult.downloadUrl) {
    return apiResponse(
      {
        output: jobResult.output ?? null,
        downloadUrl: jobResult.downloadUrl,
        metadata: jobResult.metadata ?? {},
        expiresAt: jobResult.expiresAt ?? null,
      },
      ctx,
    );
  }

  // Otherwise return inline result
  return apiResponse(
    {
      output: jobResult.output,
      metadata: jobResult.metadata ?? {},
    },
    ctx,
  );
}
