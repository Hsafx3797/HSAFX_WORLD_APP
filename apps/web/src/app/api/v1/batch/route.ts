/**
 * POST /api/v1/batch
 * Submit a batch of engine operations in a single request.
 * Each operation becomes an individual async job.
 *
 * Requires scope: tools:execute
 * Billing: Each item counts toward the B2B suite quota.
 *
 * Body: { operations: [{ engine, input, options? }] }
 * Returns: { batchId, jobs: [{ jobId, engine, status }], billing }
 */

import { NextRequest } from 'next/server';
import {
  authenticateApiKey,
  requireScope,
  apiResponse,
  apiErrorResponse,
  type ApiContext,
} from '@/lib/api-v1-auth';
import { createJob } from '@/server/jobs/job-manager';
import {
  getActiveB2bSubscription,
  resolveB2bSuite,
  checkB2bQuota,
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
import crypto from 'crypto';

const log = createLogger('api-v1-batch');

const MAX_BATCH_SIZE = 100;
const MAX_INPUT_BYTES = 512 * 1024; // 512 KB per item

interface BatchOperation {
  engine: string;
  input: unknown;
  options?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  // 1. Auth
  const result = await authenticateApiKey(request);
  if (result instanceof Response) return result;
  const ctx = result as ApiContext;

  // 2. Scope check
  const scopeErr = requireScope(ctx, 'tools:execute');
  if (scopeErr) return scopeErr;

  // 3. Parse body
  let body: { operations: unknown };
  try {
    body = await request.json();
  } catch {
    return apiErrorResponse(ApiErrorCode.INVALID_JSON, 'Invalid JSON body', ctx, 400);
  }

  // 4. Validate operations array
  if (!Array.isArray(body.operations) || body.operations.length === 0) {
    return apiErrorResponse(
      ApiErrorCode.BATCH_EMPTY,
      'Field "operations" must be a non-empty array',
      ctx,
      400,
    );
  }
  if (body.operations.length > MAX_BATCH_SIZE) {
    return apiErrorResponse(
      ApiErrorCode.BATCH_TOO_LARGE,
      `Batch too large: ${body.operations.length} items (max ${MAX_BATCH_SIZE})`,
      ctx,
      400,
    );
  }

  const operations = body.operations as BatchOperation[];

  // 5. Validate each operation
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    if (!op || typeof op !== 'object') {
      return apiErrorResponse(ApiErrorCode.INVALID_FIELD, `operations[${i}]: must be an object`, ctx, 400);
    }
    if (typeof op.engine !== 'string' || !op.engine) {
      return apiErrorResponse(ApiErrorCode.MISSING_FIELD, `operations[${i}]: missing "engine" field`, ctx, 400);
    }
    if (op.input === undefined) {
      return apiErrorResponse(ApiErrorCode.MISSING_FIELD, `operations[${i}]: missing "input" field`, ctx, 400);
    }
    const runtime = ENGINE_RUNTIME[op.engine];
    if (!runtime) {
      return apiErrorResponse(
        ApiErrorCode.ENGINE_NOT_FOUND,
        `operations[${i}]: engine '${op.engine}' not found`,
        ctx,
        404,
      );
    }
    if (runtime === 'node') {
      const engine = getEngine(op.engine);
      if (!engine) {
        return apiErrorResponse(
          ApiErrorCode.ENGINE_NOT_FOUND,
          `operations[${i}]: engine '${op.engine}' is not yet implemented`,
          ctx,
          404,
        );
      }
    }
    // Input size check
    if (typeof op.input === 'string' && new TextEncoder().encode(op.input).length > MAX_INPUT_BYTES) {
      return apiErrorResponse(
        ApiErrorCode.INPUT_TOO_LARGE,
        `operations[${i}]: input exceeds ${MAX_INPUT_BYTES / 1024} KB limit`,
        ctx,
        413,
      );
    }
    // Options validation
    if (op.options !== undefined) {
      if (typeof op.options !== 'object' || op.options === null || Array.isArray(op.options)) {
        return apiErrorResponse(ApiErrorCode.INVALID_FIELD, `operations[${i}]: "options" must be an object`, ctx, 400);
      }
    }
    // Tier check
    const requiredTier = ENGINE_MIN_TIER[op.engine];
    if (requiredTier) {
      const userPlan = await getUserPlan(ctx.userId);
      if (!isPlanAtLeast(userPlan, requiredTier)) {
        return apiErrorResponse(
          ApiErrorCode.PLAN_REQUIRED,
          `operations[${i}]: engine '${op.engine}' requires a ${requiredTier} or higher subscription`,
          ctx,
          403,
        );
      }
    }
    // Node engine validation
    if (runtime === 'node') {
      const engine = getEngine(op.engine)!;
      const validation = engine.validate(op.options ?? {});
      if (!validation.valid) {
        return apiErrorResponse(
          ApiErrorCode.ENGINE_VALIDATION,
          `operations[${i}]: validation failed: ${validation.errors.join('; ')}`,
          ctx,
          400,
          { engine: op.engine, errors: validation.errors },
        );
      }
    }
  }

  // 6. B2B subscription check
  const b2bSub = await getActiveB2bSubscription(ctx.userId);
  if (!b2bSub) {
    return apiErrorResponse(
      ApiErrorCode.B2B_NO_SUBSCRIPTION,
      'An active B2B subscription is required to use the batch API',
      ctx,
      403,
    );
  }

  // 7. Aggregate quota check per suite
  // Group operations by suite and check total quota availability
  const suiteOps: Map<string, { suiteId: string; suiteName: string; count: number }> = new Map();
  for (const op of operations) {
    const category = ENGINE_TO_CATEGORY[op.engine] ?? 'text';
    const suite = await resolveB2bSuite(category, `engine:${op.engine}`);
    if (!suite) {
      return apiErrorResponse(
        ApiErrorCode.SUITE_NOT_AVAILABLE,
        `No B2B suite configured for engine '${op.engine}' (category: ${category})`,
        ctx,
        500,
      );
    }
    const existing = suiteOps.get(suite.suiteId);
    if (existing) {
      existing.count++;
    } else {
      suiteOps.set(suite.suiteId, { suiteId: suite.suiteId, suiteName: suite.suiteName ?? suite.suiteId, count: 1 });
    }
  }

  // Check quota for each suite (total items must fit within remaining quota)
  const quotaInfo: Record<string, { used: number; limit: number; remaining: number }> = {};
  for (const [suiteId, info] of suiteOps) {
    const quota = await checkB2bQuota(ctx.userId, suiteId, b2bSub);
    quotaInfo[info.suiteName] = { used: quota.used, limit: quota.limit, remaining: quota.remaining };
    if (!quota.allowed || quota.remaining < info.count) {
      return apiErrorResponse(
        ApiErrorCode.QUOTA_EXHAUSTED,
        `Batch requires ${info.count} ops for ${info.suiteName} but only ${quota.remaining} remaining (${quota.used}/${quota.limit} used)`,
        ctx,
        403,
        { suite: info.suiteName, required: info.count, remaining: quota.remaining },
      );
    }
  }

  // 8. Create jobs for each operation
  const batchId = `batch_${crypto.randomBytes(12).toString('hex')}`;
  const jobs: { jobId: string; engine: string; status: string }[] = [];

  for (const op of operations) {
    const runtime = ENGINE_RUNTIME[op.engine];
    const category = ENGINE_TO_CATEGORY[op.engine] ?? 'text';
    const suite = await resolveB2bSuite(category, `engine:${op.engine}`);

    // Sanitize options
    const sanitizedOpts: Record<string, unknown> = {};
    if (op.options) {
      for (const [k, v] of Object.entries(op.options)) {
        if (!k.startsWith('_') && k !== 'reservationId' && k !== 'coinCost') {
          sanitizedOpts[k] = v;
        }
      }
    }

    const job = await createJob({
      engineName: op.engine,
      toolId: `engine:${op.engine}`,
      toolSlug: `engine:${op.engine}`,
      userId: ctx.userId,
      apiKeyId: ctx.keyId,
      input: op.input,
      options: {
        ...sanitizedOpts,
        _engineName: op.engine,
        _isB2b: true,
        _b2bSuiteId: suite?.suiteId,
        _runtime: runtime,
        _batchId: batchId,
      },
      source: 'api_v1_batch',
    });

    jobs.push({ jobId: job.id, engine: op.engine, status: job.status });
  }

  log.info('Batch created', {
    batchId,
    userId: ctx.userId,
    operationCount: operations.length,
  });

  return apiResponse(
    {
      batchId,
      totalOperations: operations.length,
      jobs,
      billing: {
        type: 'b2b_ops' as const,
        suiteQuotas: quotaInfo,
      },
      links: {
        jobs: jobs.map((j) => `/api/v1/jobs/${j.jobId}`),
      },
    },
    ctx,
    202,
  );
}
