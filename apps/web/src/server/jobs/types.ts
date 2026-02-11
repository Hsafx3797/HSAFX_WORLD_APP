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
  toolId: string;
  toolSlug: string;
  userId: string;
  apiKeyId?: string;
  status: JobStatus;
  progress: number; // 0-100
  input: unknown;
  options?: Record<string, unknown>;
  source: 'api_v1' | 'trpc' | 'web';
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
  toolId: string;
  toolSlug: string;
  userId: string;
  apiKeyId?: string;
  input: unknown;
  options?: Record<string, unknown>;
  source: 'api_v1' | 'trpc' | 'web';
}
