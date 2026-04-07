/**
 * POST /api/internal/job-complete
 * Callback endpoint for FastAPI → Next.js job completion notifications.
 * Auth: X-Internal-Secret header (must match INTERNAL_API_SECRET env var).
 *
 * Reference: SOLUTION_ROADMAP Task 3.5
 *
 * Handles billing reconciliation: confirmReservation on success,
 * releaseReservation on failure. This is the canonical completion path
 * for all tools dispatched to FastAPI (native/python runtimes).
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getJob, updateJob, setJobResult } from '@/server/jobs/job-manager';
import { confirmReservation, releaseReservation } from '@/server/limits/coin-service';
import { incrementB2bUsage } from '@/server/limits/b2b-quota-service';
import { dispatchJobWebhooks } from '@/server/webhooks/dispatch';
import { reportStripeUsage } from '@/server/billing/stripe-usage';
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

  // 3. Look up original job to get reservationId for billing
  const existingJob = await getJob(body.jobId);
  if (!existingJob) {
    log.warn('Job not found in Redis (may have expired)', { jobId: body.jobId });
    return NextResponse.json(
      { error: 'Job not found — state may have expired' },
      { status: 404 },
    );
  }
  const reservationId = existingJob.options?.reservationId as string | undefined;
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

      // Billing reconciliation — B2B (ops increment) vs B2C (coin confirmation)
      if (isB2b && b2bSuiteId && existingJob?.userId) {
        // B2B: increment usage count (SUCCESS-only counting)
        await incrementB2bUsage(existingJob.userId, b2bSuiteId).catch((err) =>
          log.error('Failed to increment B2B usage', { userId: existingJob.userId, suiteId: b2bSuiteId, error: err }),
        );
      } else {
        // B2C: confirm coin reservation (coins permanently deducted)
        if (reservationId) {
          await confirmReservation(reservationId).catch((err) =>
            log.error('Failed to confirm reservation', { reservationId, error: err }),
          );
        }
      }

      // Report usage to Stripe metered billing (fire-and-forget, B2C only)
      if (!isB2b) {
        const coinCost = (existingJob?.options as Record<string, unknown> | null)?.coinCost as number ?? 0;
        if (existingJob?.userId) {
          reportStripeUsage(existingJob.userId, existingJob.toolId, coinCost);
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

      // Release coin reservation (refund user, B2C only)
      if (!isB2b && reservationId) {
        await releaseReservation(reservationId).catch((err) =>
          log.error('Failed to release reservation', { reservationId, error: err }),
        );
      }
      // B2B: nothing to do on failure — failed executions are free

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
