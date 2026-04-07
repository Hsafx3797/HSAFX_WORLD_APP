/**
 * POST /api/v1/engine/{name}
 * Execute an engine directly with options.
 * Returns 202 Accepted with a jobId.
 * Requires scope: tools:execute
 *
 * B2B-only engine execution endpoint. Engine name is in the URL path.
 * Body: { input, options }
 *
 * Idempotency:  Honors `Idempotency-Key` header (24h TTL via Redis).
 * Billing:      B2B ops quota only — no coin/B2C fallback.
 */

import { NextRequest } from 'next/server';
import {
  authenticateApiKey,
  requireScope,
  apiResponse,
  apiErrorResponse,
  type ApiContext,
} from '@/lib/api-v1-auth';
import { createJob, getJob } from '@/server/jobs/job-manager';
import { redis, keys, TTL } from '@/lib/redis';
import {
  getActiveB2bSubscription,
  resolveB2bSuite,
  checkB2bQuota,
  B2bQuotaExhaustedError,
  B2bSuiteNotAvailableError,
  B2bNoSubscriptionError,
} from '@/server/limits/b2b-quota-service';
import { getEngine } from '@hsafx/tool-execution/engines';
import { getUserPlan } from '@hsafx/api/helpers';
import { isPlanAtLeast } from '@hsafx/shared/permissions';
import { createLogger } from '@hsafx/shared/logger';
import { ApiErrorCode } from '@hsafx/shared/errors';
import {
  ENGINE_RUNTIME,
  ENGINE_MIN_TIER,
  ENGINE_TO_CATEGORY,
  ALL_ENGINE_NAMES,
} from '@/lib/engine-constants';

const log = createLogger('api-v1-engine-execute');

const MAX_INPUT_BYTES = 512 * 1024; // 512 KB for text input

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name: engineName } = await params;

  // 1. Auth
  const result = await authenticateApiKey(request);
  if (result instanceof Response) return result;
  const ctx = result as ApiContext;

  // 2. Scope check
  const scopeErr = requireScope(ctx, 'tools:execute');
  if (scopeErr) return scopeErr;

  // 3. Validate engine exists
  const runtime = ENGINE_RUNTIME[engineName];
  if (!runtime) {
    return apiErrorResponse(
      ApiErrorCode.ENGINE_NOT_FOUND,
      `Engine '${engineName}' not found. Available: ${ALL_ENGINE_NAMES.join(', ')}`,
      ctx,
      404,
    );
  }

  // For node engines, also verify the engine is registered in the TS engine system
  if (runtime === 'node') {
    const engine = getEngine(engineName);
    if (!engine) {
      return apiErrorResponse(
        ApiErrorCode.ENGINE_NOT_FOUND,
        `Engine '${engineName}' is registered but not yet implemented`,
        ctx,
        404,
      );
    }
  }

  // 4. Plan-based access check
  const requiredTier = ENGINE_MIN_TIER[engineName];
  if (requiredTier) {
    const userPlan = await getUserPlan(ctx.userId);
    if (!isPlanAtLeast(userPlan, requiredTier)) {
      return apiErrorResponse(
        ApiErrorCode.PLAN_REQUIRED,
        `Engine '${engineName}' requires a ${requiredTier} or higher subscription`,
        ctx,
        403,
      );
    }
  }

  // 5. Parse body
  let body: { input: unknown; options?: unknown };
  try {
    body = await request.json();
  } catch {
    return apiErrorResponse(ApiErrorCode.INVALID_JSON, 'Invalid JSON body', ctx, 400);
  }

  // 6. Validate input field
  if (body.input === undefined) {
    return apiErrorResponse(ApiErrorCode.MISSING_FIELD, 'Missing required field: input', ctx, 400);
  }

  // 6b. Input size limit (512 KB for text input)
  if (typeof body.input === 'string' && new TextEncoder().encode(body.input).length > MAX_INPUT_BYTES) {
    return apiErrorResponse(
      ApiErrorCode.INPUT_TOO_LARGE,
      `Input too large. Maximum size is ${MAX_INPUT_BYTES / 1024} KB`,
      ctx,
      413,
    );
  }

  // 7. Validate options
  const options = (body.options ?? {}) as Record<string, unknown>;
  if (typeof options !== 'object' || options === null || Array.isArray(options)) {
    return apiErrorResponse(
      ApiErrorCode.INVALID_FIELD,
      'Field "options" must be an object',
      ctx,
      400,
    );
  }

  // For node engines, run the engine's own validate() function
  if (runtime === 'node') {
    const engine = getEngine(engineName)!;
    const validation = engine.validate(options);
    if (!validation.valid) {
      return apiErrorResponse(
        ApiErrorCode.ENGINE_VALIDATION,
        `Engine validation failed: ${validation.errors.join('; ')}`,
        ctx,
        400,
        { engine: engineName, errors: validation.errors },
      );
    }
  }

  // 8. Idempotency check
  const idempotencyKey = request.headers.get('idempotency-key');
  if (idempotencyKey) {
    const redisKey = keys.idempotency(`${ctx.userId}:${idempotencyKey}`);
    const existing = await redis.get(redisKey);
    if (existing) {
      const cached = typeof existing === 'string' ? JSON.parse(existing) : existing;
      if (cached.jobId) {
        const liveJob = await getJob(cached.jobId);
        if (liveJob) {
          cached.status = liveJob.status;
        }
      }
      return apiResponse(cached, ctx, 202);
    }
  }

  // 9. Billing — B2B ops quota only
  let b2bSuiteId: string | undefined;
  let b2bQuotaInfo: { used: number; limit: number; remaining: number } | undefined;
  const billingToolId = `engine:${engineName}`;

  try {
    const b2bSub = await getActiveB2bSubscription(ctx.userId);
    if (!b2bSub) {
      return apiErrorResponse(
        ApiErrorCode.B2B_NO_SUBSCRIPTION,
        'An active B2B subscription is required to use the engine API',
        ctx,
        403,
      );
    }

    const engineCategory = ENGINE_TO_CATEGORY[engineName] ?? 'text';
    const suite = await resolveB2bSuite(engineCategory, billingToolId);
    if (!suite) {
      return apiErrorResponse(
        ApiErrorCode.SUITE_NOT_AVAILABLE,
        `No B2B suite configured for engine '${engineName}' (category: ${engineCategory})`,
        ctx,
        500,
      );
    }
    b2bSuiteId = suite.suiteId;

    const quota = await checkB2bQuota(ctx.userId, suite.suiteId, b2bSub);
    b2bQuotaInfo = { used: quota.used, limit: quota.limit, remaining: quota.remaining };

    if (!quota.allowed) {
      return apiErrorResponse(
        ApiErrorCode.QUOTA_EXHAUSTED,
        `B2B quota exhausted for ${quota.suiteName}: ${quota.used}/${quota.limit} ops used this period`,
        ctx,
        403,
        { suite: quota.suiteName, used: quota.used, limit: quota.limit },
      );
    }
  } catch (err) {
    if (err instanceof B2bQuotaExhaustedError) {
      return apiErrorResponse(ApiErrorCode.QUOTA_EXHAUSTED, err.message, ctx, 403);
    }
    if (err instanceof B2bSuiteNotAvailableError) {
      return apiErrorResponse(ApiErrorCode.SUITE_NOT_AVAILABLE, err.message, ctx, 403);
    }
    if (err instanceof B2bNoSubscriptionError) {
      return apiErrorResponse(ApiErrorCode.B2B_NO_SUBSCRIPTION, 'B2B subscription expired or not found', ctx, 403);
    }
    log.error('Billing check failed', { engine: engineName, error: err instanceof Error ? err.message : String(err) });
    return apiErrorResponse(
      ApiErrorCode.SERVER_ERROR,
      'Failed to process billing for this engine execution',
      ctx,
      500,
    );
  }

  // 10. Strip internal keys from user-supplied options
  const sanitizedOpts: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(options)) {
    if (!k.startsWith('_') && k !== 'reservationId' && k !== 'coinCost') {
      sanitizedOpts[k] = v;
    }
  }

  // 11. Create async job
  const job = await createJob({
    engineName,
    toolId: billingToolId,
    toolSlug: billingToolId,
    userId: ctx.userId,
    apiKeyId: ctx.keyId,
    input: body.input,
    options: {
      ...sanitizedOpts,
      _engineName: engineName,
      _isB2b: true,
      _b2bSuiteId: b2bSuiteId,
      _runtime: runtime,
    },
    source: 'api_v1',
  });

  const responseData = {
    jobId: job.id,
    status: job.status as string,
    engine: engineName,
    message: 'Job created. Poll GET /api/v1/jobs/{jobId} for status.',
    links: {
      status: `/api/v1/jobs/${job.id}`,
      result: `/api/v1/jobs/${job.id}/result`,
    },
    billing: {
      type: 'b2b_ops' as const,
      opsUsedBefore: b2bQuotaInfo!.used,
      opsLimit: b2bQuotaInfo!.limit,
      opsRemaining: b2bQuotaInfo!.remaining,
    },
  };

  // 12. Cache idempotency
  if (idempotencyKey) {
    const redisKey = keys.idempotency(`${ctx.userId}:${idempotencyKey}`);
    await redis.set(redisKey, JSON.stringify(responseData), { ex: TTL.IDEMPOTENCY });
  }

  return apiResponse(responseData, ctx, 202);
}
