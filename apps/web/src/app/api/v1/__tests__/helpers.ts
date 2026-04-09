/**
 * Shared test helpers for B2B API v1 tests
 */
import { NextRequest } from 'next/server';
import type { ApiContext } from '@/lib/api-v1-auth';
import type { Job, JobResult } from '@/server/jobs/types';

// ─── Constants ────────────────────────────────────────────────

export const VALID_API_KEY =
  'hsafx_test_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

// ─── Factories ────────────────────────────────────────────────

export function createMockContext(
  overrides?: Partial<ApiContext>,
): ApiContext {
  return {
    keyId: 'key_test_123',
    userId: 'user_test_456',
    keyName: 'Test Key',
    scopes: ['tools:read', 'tools:execute'],
    rateLimitTier: 'free',
    requestId: 'req_test_789',
    rateLimitRemaining: 1000,
    rateLimitReset: Date.now() + 3600_000,
    ...overrides,
  };
}

export function createGetRequest(
  path: string,
  headers?: Record<string, string>,
): NextRequest {
  return new NextRequest(new URL(path, 'http://localhost'), {
    method: 'GET',
    headers: {
      authorization: `Bearer ${VALID_API_KEY}`,
      ...headers,
    },
  });
}

export function createPostRequest(
  path: string,
  body: unknown,
  headers?: Record<string, string>,
): NextRequest {
  return new NextRequest(new URL(path, 'http://localhost'), {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${VALID_API_KEY}`,
      ...headers,
    },
  });
}

export function createMockJob(overrides?: Partial<Job>): Job {
  const now = new Date().toISOString();
  return {
    id: 'job_test_abc123',
    toolId: 'uppercase',
    toolSlug: 'uppercase',
    userId: 'user_test_456',
    apiKeyId: 'key_test_123',
    status: 'queued',
    progress: 0,
    input: 'hello world',
    options: {},
    source: 'api_v1',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createMockJobResult(
  overrides?: Partial<JobResult>,
): JobResult {
  return {
    output: 'HELLO WORLD',
    metadata: {},
    ...overrides,
  };
}

// ─── Sample Tool Metadata ─────────────────────────────────────
