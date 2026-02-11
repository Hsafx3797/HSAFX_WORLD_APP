/**
 * Tool Worker Pool Manager
 * HSAFX WORLD - Manages worker pool for async tool execution
 */

// Worker status
export type WorkerStatus = 'idle' | 'busy' | 'error' | 'terminated';

// Worker info
export interface WorkerInfo {
  id: string;
  type: 'wasm' | 'node' | 'python';
  status: WorkerStatus;
  currentJobId?: string;
  startedAt?: number;
  jobsCompleted: number;
  lastError?: string;
}

// Job priority
export type JobPriority = 'low' | 'normal' | 'high' | 'critical';

// Job status
export type JobStatus = 
  | 'queued' 
  | 'running' 
  | 'completed' 
  | 'failed' 
  | 'cancelled' 
  | 'timeout';

// Job definition
export interface ExecutionJob {
  id: string;
  toolId: string;
  userId?: string;
  priority: JobPriority;
  status: JobStatus;
  input: unknown;
  output?: unknown;
  error?: string;
  queuedAt: number;
  startedAt?: number;
  completedAt?: number;
  workerId?: string;
  retries: number;
  maxRetries: number;
  timeout: number;
}

// Pool configuration
export interface PoolConfig {
  maxWorkers: number;
  minWorkers: number;
  workerTimeout: number;
  jobTimeout: number;
  maxRetries: number;
  queueLimit: number;
}

// Default pool config
export const DEFAULT_POOL_CONFIG: PoolConfig = {
  maxWorkers: 4,
  minWorkers: 1,
  workerTimeout: 30000, // 30 seconds
  jobTimeout: 60000, // 60 seconds
  maxRetries: 3,
  queueLimit: 100,
};

// Pool stats
export interface PoolStats {
  totalWorkers: number;
  idleWorkers: number;
  busyWorkers: number;
  queuedJobs: number;
  runningJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageJobTime: number;
}

/**
 * Create a new execution job
 */
export function createJob(
  toolId: string,
  input: unknown,
  options?: {
    userId?: string;
    priority?: JobPriority;
    timeout?: number;
    maxRetries?: number;
  }
): ExecutionJob {
  return {
    id: generateJobId(),
    toolId,
    userId: options?.userId,
    priority: options?.priority ?? 'normal',
    status: 'queued',
    input,
    queuedAt: Date.now(),
    retries: 0,
    maxRetries: options?.maxRetries ?? DEFAULT_POOL_CONFIG.maxRetries,
    timeout: options?.timeout ?? DEFAULT_POOL_CONFIG.jobTimeout,
  };
}

/**
 * Generate unique job ID
 */
function generateJobId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `job_${timestamp}_${random}`;
}

/**
 * Generate unique worker ID
 */
export function generateWorkerId(type: WorkerInfo['type']): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `worker_${type}_${timestamp}_${random}`;
}

/**
 * Calculate job priority score for queue ordering
 */
export function calculatePriorityScore(job: ExecutionJob): number {
  const priorityWeights: Record<JobPriority, number> = {
    critical: 1000,
    high: 100,
    normal: 10,
    low: 1,
  };

  const baseScore = priorityWeights[job.priority];
  const waitTime = Date.now() - job.queuedAt;
  const waitBonus = Math.floor(waitTime / 1000); // +1 per second waiting

  return baseScore + waitBonus;
}

/**
 * Check if job should timeout
 */
export function isJobTimedOut(job: ExecutionJob): boolean {
  if (job.status !== 'running' || !job.startedAt) {
    return false;
  }
  return Date.now() - job.startedAt > job.timeout;
}

/**
 * Check if job can be retried
 */
export function canRetryJob(job: ExecutionJob): boolean {
  return job.retries < job.maxRetries && 
         (job.status === 'failed' || job.status === 'timeout');
}

/**
 * Format job for API response
 */
export function formatJobResponse(job: ExecutionJob): {
  id: string;
  status: JobStatus;
  progress?: number;
  result?: unknown;
  error?: string;
  estimatedTime?: number;
} {
  return {
    id: job.id,
    status: job.status,
    progress: job.status === 'running' ? undefined : job.status === 'completed' ? 100 : 0,
    result: job.status === 'completed' ? job.output : undefined,
    error: job.error,
    estimatedTime: job.status === 'queued' ? undefined : undefined,
  };
}
