/**
 * GET /api/v1/openapi.json
 * Serves the OpenAPI 3.1 specification for the HSAFX WORLD B2B API v1.
 * Public — no authentication required.
 */

import { NextResponse } from 'next/server';
import { openApiSpec } from '@/lib/openapi-spec';

export async function GET() {
  return NextResponse.json(openApiSpec, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
