/**
 * Job system shared types
 * Extracted to break circular dependency between job-manager and job-worker.
 */

export type JobStatus =
  | 'queued'
  | 'preparing'
  | 'processing'
  | 'completed'
  | 'failed';

export interface Job {
  id: string;
  /** Engine name (new B2B route). When set, runtime is resolved from ENGINE_RUNTIME. */
  engineName?: string;
  /** @deprecated */
  toolId?: string;
  /** @deprecated */
  toolSlug?: string;
  userId: string;
  apiKeyId?: string;
  status: JobStatus;
  progress: number; // 0-100
  input: unknown;
  options?: Record<string, unknown>;
  source: 'api_v1' | 'api_v1_batch' | 'trpc' | 'web';
  error?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface JobResult {
  output: unknown;
  downloadUrl?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: string;
}

export interface CreateJobInput {
  /** Engine name. Runtime is resolved from ENGINE_RUNTIME. */
  engineName?: string;
  userId: string;
  apiKeyId?: string;
  input: unknown;
  options?: Record<string, unknown>;
  source: 'api_v1' | 'api_v1_batch' | 'trpc' | 'web';
}
