/**
 * POST /api/internal/job-complete
 * Callback endpoint for FastAPI → Next.js job completion notifications.
 * Auth: X-Internal-Secret header (must match INTERNAL_API_SECRET env var).
 *
 * Reference: SOLUTION_ROADMAP Task 3.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateJob, setJobResult } from '@/server/jobs/job-manager';
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
  // 1. Verify internal secret
  const secret = request.headers.get('x-internal-secret');
  const expectedSecret = process.env.INTERNAL_API_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
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

  // 3. Update job
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
    } else {
      // Mark failed
      await updateJob(body.jobId, {
        status: 'failed',
        error: body.error ?? 'Unknown error from FastAPI',
        completedAt: new Date().toISOString(),
      });
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
