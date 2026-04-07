/**
 * GET /api/v1/engine/{name}/schema
 * Returns the full option schema for one engine.
 * Requires scope: tools:read
 *
 * Useful for API clients to build dynamic UIs or validate options before execution.
 */

import { NextRequest } from 'next/server';
import {
  authenticateApiKey,
  requireScope,
  apiResponse,
  apiErrorResponse,
  type ApiContext,
} from '@/lib/api-v1-auth';
import { getEngine } from '@hsafx/tool-execution/engines';
import { ApiErrorCode } from '@hsafx/shared/errors';
import {
  ENGINE_RUNTIME,
  ENGINE_TOOL_CLASS,
  ENGINE_TO_CATEGORY,
  ALL_ENGINE_NAMES,
} from '@/lib/engine-constants';
import { ENGINE_OPTION_SCHEMAS } from '@/lib/engines-option-schemas';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name: engineName } = await params;

  // 1. Auth
  const result = await authenticateApiKey(request);
  if (result instanceof Response) return result;
  const ctx = result as ApiContext;

  // 2. Scope check
  const scopeErr = requireScope(ctx, 'tools:read');
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

  // 4. Build schema response
  const nodeEngine = runtime === 'node' ? getEngine(engineName) : null;
  const optionSchema = ENGINE_OPTION_SCHEMAS[engineName] ?? {};

  return apiResponse(
    {
      name: engineName,
      description: nodeEngine?.description ?? `${engineName} engine (${runtime} backend)`,
      runtime,
      category: ENGINE_TO_CATEGORY[engineName] ?? 'unknown',
      billingClass: ENGINE_TOOL_CLASS[engineName] ?? 'text_transform',
      optionSchema,
    },
    ctx,
  );
}
