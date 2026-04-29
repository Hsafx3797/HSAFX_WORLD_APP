/**
 * POST /api/internal/job-complete
 * Callback endpoint for FastAPI → Next.js job completion notifications.
 * Auth: X-Internal-Secret header (must match INTERNAL_API_SECRET env var).
 *
 * Reference: SOLUTION_ROADMAP Task 3.5
 *
 * Handles B2B billing: incrementB2bUsage on success. Failed executions are free.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getJob, updateJob, setJobResult } from '@/server/jobs/job-manager';
import { incrementB2bUsage } from '@/server/limits/b2b-quota-service';
import { dispatchJobWebhooks } from '@/server/webhooks/dispatch';
import { redis } from '@/lib/redis';
import { createLogger } from '@hsafx/shared/logger';

const log = createLogger('job-complete');

interface JobCompletePayload {
  jobId: string;
  status: 'completed' | 'failed';
  output?: unknown;
  resultUrl?: string;
  downloadUrl?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  // 1. Verify internal secret (timing-safe comparison)
  const secret = request.headers.get('x-internal-secret') ?? '';
  const expectedSecret = process.env.INTERNAL_API_SECRET ?? '';

  if (
    !expectedSecret ||
    !secret ||
    secret.length !== expectedSecret.length ||
    !crypto.timingSafeEqual(Buffer.from(secret), Buffer.from(expectedSecret))
  ) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 },
    );
  }

  // 2. Parse payload
  let body: JobCompletePayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 },
    );
  }

  if (!body.jobId || !body.status) {
    return NextResponse.json(
      { error: 'Missing required fields: jobId, status' },
      { status: 400 },
    );
  }

  // Runtime validation: status must be exactly 'completed' or 'failed'
  if (body.status !== 'completed' && body.status !== 'failed') {
    log.warn('Invalid status value received', { jobId: body.jobId, status: body.status });
    return NextResponse.json(
      { error: `Invalid status: '${body.status}'. Must be 'completed' or 'failed'.` },
      { status: 400 },
    );
  }

  // 3. Look up original job
  const existingJob = await getJob(body.jobId);
  if (!existingJob) {
    log.warn('Job not found in Redis (may have expired)', { jobId: body.jobId });
    return NextResponse.json(
      { error: 'Job not found — state may have expired' },
      { status: 404 },
    );
  }
  const isB2b = existingJob.options?._isB2b === true;
  const b2bSuiteId = existingJob.options?._b2bSuiteId as string | undefined;

  // Idempotency guard: if the job is already in a terminal state, don't process again
  if (existingJob.status === 'completed' || existingJob.status === 'failed') {
    log.warn('Duplicate job-complete callback — job already terminal', {
      jobId: body.jobId,
      existingStatus: existingJob.status,
      incomingStatus: body.status,
    });
    return NextResponse.json({
      success: true,
      jobId: body.jobId,
      note: 'Already processed (idempotent)',
    });
  }

  // 4. Update job and handle billing
  try {
    if (body.status === 'completed') {
      // Store result
      await setJobResult(body.jobId, {
        output: body.output ?? null,
        downloadUrl: body.downloadUrl ?? body.resultUrl,
        metadata: body.metadata ?? {},
      });

      await updateJob(body.jobId, {
        status: 'completed',
        progress: 100,
        completedAt: new Date().toISOString(),
      });

      // B2B: increment usage count (SUCCESS-only counting)
      if (isB2b && b2bSuiteId && existingJob?.userId) {
        try {
          await incrementB2bUsage(existingJob.userId, b2bSuiteId);
        } catch (err) {
          log.error('Failed to increment B2B usage — flagging for reconciliation', {
            userId: existingJob.userId,
            suiteId: b2bSuiteId,
            jobId: body.jobId,
            error: err,
          });
          redis.set(
            `b2b:usage_failed:${body.jobId}`,
            JSON.stringify({ userId: existingJob.userId, suiteId: b2bSuiteId, ts: Date.now() }),
            { ex: 7 * 24 * 60 * 60 }, // 7 day TTL
          ).catch(() => {});
        }
      }

      // Dispatch webhook notification (fire-and-forget)
      if (existingJob?.userId) {
        dispatchJobWebhooks(existingJob.userId, 'job.completed', {
          jobId: body.jobId,
          toolId: existingJob.toolId,
          status: 'completed',
          output: body.output,
        });
      }
    } else {
      // Mark failed
      await updateJob(body.jobId, {
        status: 'failed',
        error: body.error ?? 'Unknown error from FastAPI',
        completedAt: new Date().toISOString(),
      });

      // B2B: failed executions are free — nothing to do on failure

      // Dispatch failure webhook notification (fire-and-forget)
      if (existingJob?.userId) {
        dispatchJobWebhooks(existingJob.userId, 'job.failed', {
          jobId: body.jobId,
          toolId: existingJob.toolId,
          status: 'failed',
          error: body.error,
        });
      }
    }

    return NextResponse.json({ success: true, jobId: body.jobId });
  } catch (err) {
    log.error('Failed to update job', { error: err });
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 },
    );
  }
}
