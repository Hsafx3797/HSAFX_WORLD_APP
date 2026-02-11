/**
 * POST /api/v1/tools/[toolKey]/execute
 * Execute a tool — always returns 202 Accepted with a jobId.
 * Requires scope: tools:execute
 *
 * Idempotency:  Honors `Idempotency-Key` header (24h TTL via Redis).
 */

import { NextRequest } from 'next/server';
import {
  authenticateApiKey,
  requireScope,
  apiResponse,
  apiErrorResponse,
  type ApiContext,
} from '@/lib/api-v1-auth';
import { getAllTools } from '@/lib/tools/registry';
import { createJob, type JobStatus } from '@/server/jobs/job-manager';
import { redis, keys, TTL } from '@/lib/redis';

interface Params {
  params: Promise<{ toolKey: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  // 1. Auth
  const result = await authenticateApiKey(request);
  if (result instanceof Response) return result;
  const ctx = result as ApiContext;

  // 2. Scope check
  const scopeErr = requireScope(ctx, 'tools:execute');
  if (scopeErr) return scopeErr;

  // 3. Find tool
  const { toolKey } = await params;
  const allTools = getAllTools();
  const tool = allTools.find((t) => t.id === toolKey);

  if (!tool) {
    return apiErrorResponse('T001', `Tool '${toolKey}' not found`, ctx, 404);
  }

  // 4. Parse body
  let body: { input: unknown; options?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return apiErrorResponse('V001', 'Invalid JSON body', ctx, 400);
  }

  if (body.input === undefined) {
    return apiErrorResponse(
      'V002',
      'Missing required field: input',
      ctx,
      400,
    );
  }

  // 5. Idempotency check
  const idempotencyKey = request.headers.get('idempotency-key');
  if (idempotencyKey) {
    const redisKey = keys.idempotency(idempotencyKey);
    const existing = await redis.get(redisKey);
    if (existing) {
      // Return cached response
      const cached = typeof existing === 'string' ? JSON.parse(existing) : existing;
      return apiResponse(cached, ctx, 202);
    }
  }

  // 6. Create async job
  const job = await createJob({
    toolId: tool.id,
    toolSlug: tool.id,
    userId: ctx.userId,
    apiKeyId: ctx.keyId,
    input: body.input,
    options: body.options,
    source: 'api_v1',
  });

  const responseData = {
    jobId: job.id,
    status: job.status as string,
    toolId: tool.id,
    message: 'Job created. Poll GET /api/v1/jobs/{jobId} for status.',
    links: {
      status: `/api/v1/jobs/${job.id}`,
      result: `/api/v1/jobs/${job.id}/result`,
    },
  };

  // 7. Cache idempotency
  if (idempotencyKey) {
    const redisKey = keys.idempotency(idempotencyKey);
    await redis.set(redisKey, JSON.stringify(responseData), { ex: TTL.IDEMPOTENCY });
  }

  return apiResponse(responseData, ctx, 202);
}
