/**
 * GET /api/v1/health
 * Public health check (also verifies API key if provided).
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateApiKey,
  apiResponse,
  type ApiContext,
} from '@/lib/api-v1-auth';

export async function GET(request: NextRequest) {
  const raw = request.headers.get('authorization') || request.headers.get('x-hsafx-api-key');

  // If no key provided, return simple health
  if (!raw) {
    return NextResponse.json({
      success: true,
      message: 'HSAFX WORLD API v1 is operational',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  }

  // If key provided, validate it and return key info
  const result = await authenticateApiKey(request);
  if (result instanceof NextResponse) return result;

  const ctx = result as ApiContext;
  return apiResponse(
    {
      message: 'API key authenticated',
      keyName: ctx.keyName,
      scopes: ctx.scopes,
      rateLimitTier: ctx.rateLimitTier,
    },
    ctx,
  );
}
