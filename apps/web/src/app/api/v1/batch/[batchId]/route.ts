/**
 * GET /api/v1/batch/[batchId]
 * Get batch job status by listing all jobs with this batchId.
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
import { redis, keys } from '@/lib/redis';
import { createLogger } from '@hsafx/shared/logger';

const log = createLogger('api-v1-batch-status');

interface Params {
  params: Promise<{ batchId: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  // 1. Auth
  const result = await authenticateApiKey(request);
  if (result instanceof Response) return result;
  const ctx = result as ApiContext;

  // 2. Scope check
  const scopeErr = requireScope(ctx, 'tools:read');
  if (scopeErr) return scopeErr;

  // 3. Fetch batch metadata
  const { batchId } = await params;

  if (!batchId.startsWith('batch_')) {
    return apiErrorResponse(ApiErrorCode.JOB_NOT_FOUND, `Batch '${batchId}' not found`, ctx, 404);
  }

  // Scan Redis for jobs belonging to this batch
  // Jobs store _batchId in their options; we scan job:state:* keys
  const pattern = 'job:state:job_*';
  const batchJobs: {
    jobId: string;
    engine: string;
    status: string;
    progress: number;
    error?: string;
  }[] = [];

  let cursor = '0';
  do {
    const [nextCursor, jobKeys] = await redis.scan(Number(cursor), { match: pattern, count: 200 });
    cursor = String(nextCursor);

    for (const key of jobKeys) {
      const raw = await redis.get(key);
      if (!raw) continue;
      const job = typeof raw === 'string' ? JSON.parse(raw) : raw;

      // Check ownership and batch membership
      if (job.userId === ctx.userId && job.options?._batchId === batchId) {
        batchJobs.push({
          jobId: job.id,
          engine: job.engineName ?? job.options?._engineName ?? job.toolSlug,
          status: job.status,
          progress: job.progress ?? 0,
          error: job.status === 'failed' ? job.error : undefined,
        });
      }
    }
  } while (cursor !== '0');

  if (batchJobs.length === 0) {
    return apiErrorResponse(ApiErrorCode.JOB_NOT_FOUND, `Batch '${batchId}' not found`, ctx, 404);
  }

  // Compute aggregate status
  const total = batchJobs.length;
  const completed = batchJobs.filter((j) => j.status === 'completed').length;
  const failed = batchJobs.filter((j) => j.status === 'failed').length;
  const processing = total - completed - failed;

  let batchStatus: string;
  if (completed === total) batchStatus = 'completed';
  else if (failed === total) batchStatus = 'failed';
  else if (processing > 0) batchStatus = 'processing';
  else batchStatus = 'partial'; // mix of completed + failed

  return apiResponse(
    {
      batchId,
      status: batchStatus,
      totalOperations: total,
      completed,
      failed,
      processing,
      jobs: batchJobs,
      links: {
        results: batchJobs
          .filter((j) => j.status === 'completed')
          .map((j) => `/api/v1/jobs/${j.jobId}/result`),
      },
    },
    ctx,
  );
}
