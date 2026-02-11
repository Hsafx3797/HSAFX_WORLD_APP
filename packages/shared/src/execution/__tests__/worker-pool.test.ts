import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  DEFAULT_POOL_CONFIG,
  createJob,
  generateWorkerId,
  calculatePriorityScore,
  isJobTimedOut,
  canRetryJob,
  formatJobResponse,
  type ExecutionJob,
  type JobPriority,
} from '../worker-pool';

// ─── DEFAULT_POOL_CONFIG ─────────────────────────────────────────────────────

describe('DEFAULT_POOL_CONFIG', () => {
  it('maxWorkers is 4', () => {
    expect(DEFAULT_POOL_CONFIG.maxWorkers).toBe(4);
  });

  it('minWorkers is 1', () => {
    expect(DEFAULT_POOL_CONFIG.minWorkers).toBe(1);
  });

  it('jobTimeout is 60000ms', () => {
    expect(DEFAULT_POOL_CONFIG.jobTimeout).toBe(60000);
  });

  it('maxRetries is 3', () => {
    expect(DEFAULT_POOL_CONFIG.maxRetries).toBe(3);
  });

  it('queueLimit is 100', () => {
    expect(DEFAULT_POOL_CONFIG.queueLimit).toBe(100);
  });
});

// ─── createJob ───────────────────────────────────────────────────────────────

describe('createJob', () => {
  it('returns an object with id starting with "job_"', () => {
    const job = createJob('calculator-basic', '2+2');
    expect(job.id).toMatch(/^job_/);
  });

  it('sets status to "queued"', () => {
    const job = createJob('calculator-basic', '2+2');
    expect(job.status).toBe('queued');
  });

  it('sets priority to "normal" by default', () => {
    const job = createJob('calculator-basic', '2+2');
    expect(job.priority).toBe('normal');
  });

  it('sets retries to 0', () => {
    const job = createJob('calculator-basic', '2+2');
    expect(job.retries).toBe(0);
  });

  it('stores the toolId', () => {
    const job = createJob('hash-generator', 'abc');
    expect(job.toolId).toBe('hash-generator');
  });

  it('stores the input', () => {
    const input = { expression: '2+2' };
    const job = createJob('calculator-basic', input);
    expect(job.input).toEqual(input);
  });

  it('uses custom priority from options', () => {
    const job = createJob('calc', '2+2', { priority: 'critical' });
    expect(job.priority).toBe('critical');
  });

  it('uses custom timeout from options', () => {
    const job = createJob('calc', '2+2', { timeout: 5000 });
    expect(job.timeout).toBe(5000);
  });

  it('uses default timeout when not specified', () => {
    const job = createJob('calc', '2+2');
    expect(job.timeout).toBe(DEFAULT_POOL_CONFIG.jobTimeout);
  });

  it('sets userId from options', () => {
    const job = createJob('calc', '2+2', { userId: 'user-123' });
    expect(job.userId).toBe('user-123');
  });

  it('userId is undefined when not provided', () => {
    const job = createJob('calc', '2+2');
    expect(job.userId).toBeUndefined();
  });

  it('uses custom maxRetries from options', () => {
    const job = createJob('calc', '2+2', { maxRetries: 5 });
    expect(job.maxRetries).toBe(5);
  });

  it('uses default maxRetries when not specified', () => {
    const job = createJob('calc', '2+2');
    expect(job.maxRetries).toBe(DEFAULT_POOL_CONFIG.maxRetries);
  });

  it('sets queuedAt to approximately Date.now()', () => {
    const before = Date.now();
    const job = createJob('calc', '2+2');
    const after = Date.now();
    expect(job.queuedAt).toBeGreaterThanOrEqual(before);
    expect(job.queuedAt).toBeLessThanOrEqual(after);
  });

  it('generates unique ids for different calls', () => {
    const job1 = createJob('calc', '1');
    const job2 = createJob('calc', '2');
    expect(job1.id).not.toBe(job2.id);
  });
});

// ─── generateWorkerId ────────────────────────────────────────────────────────

describe('generateWorkerId', () => {
  it('returns a string starting with "worker_"', () => {
    const id = generateWorkerId('node');
    expect(id).toMatch(/^worker_/);
  });

  it('contains the type "wasm"', () => {
    const id = generateWorkerId('wasm');
    expect(id).toContain('worker_wasm_');
  });

  it('contains the type "node"', () => {
    const id = generateWorkerId('node');
    expect(id).toContain('worker_node_');
  });

  it('contains the type "python"', () => {
    const id = generateWorkerId('python');
    expect(id).toContain('worker_python_');
  });

  it('generates unique ids', () => {
    const id1 = generateWorkerId('node');
    const id2 = generateWorkerId('node');
    expect(id1).not.toBe(id2);
  });
});

// ─── calculatePriorityScore ──────────────────────────────────────────────────

describe('calculatePriorityScore', () => {
  function makeJob(priority: JobPriority, queuedAt?: number): ExecutionJob {
    return {
      id: 'job_test',
      toolId: 'calc',
      priority,
      status: 'queued',
      input: null,
      queuedAt: queuedAt ?? Date.now(),
      retries: 0,
      maxRetries: 3,
      timeout: 60000,
    };
  }

  it('critical job has higher score than high job', () => {
    const critical = calculatePriorityScore(makeJob('critical'));
    const high = calculatePriorityScore(makeJob('high'));
    expect(critical).toBeGreaterThan(high);
  });

  it('high job has higher score than normal job', () => {
    const high = calculatePriorityScore(makeJob('high'));
    const normal = calculatePriorityScore(makeJob('normal'));
    expect(high).toBeGreaterThan(normal);
  });

  it('normal job has higher score than low job', () => {
    const normal = calculatePriorityScore(makeJob('normal'));
    const low = calculatePriorityScore(makeJob('low'));
    expect(normal).toBeGreaterThan(low);
  });

  it('older job gets a wait bonus (higher score)', () => {
    const recent = calculatePriorityScore(makeJob('normal', Date.now()));
    const old = calculatePriorityScore(makeJob('normal', Date.now() - 10000)); // 10s ago
    expect(old).toBeGreaterThan(recent);
  });

  it('wait bonus is roughly +1 per second', () => {
    const now = Date.now();
    const recent = calculatePriorityScore(makeJob('normal', now));
    const fiveSecsAgo = calculatePriorityScore(makeJob('normal', now - 5000));
    // Bonus should be ~5
    expect(fiveSecsAgo - recent).toBeGreaterThanOrEqual(4);
    expect(fiveSecsAgo - recent).toBeLessThanOrEqual(6);
  });
});

// ─── isJobTimedOut ───────────────────────────────────────────────────────────

describe('isJobTimedOut', () => {
  it('returns true for running job past timeout', () => {
    const job: ExecutionJob = {
      id: 'job_1',
      toolId: 'calc',
      priority: 'normal',
      status: 'running',
      input: null,
      queuedAt: Date.now() - 120000,
      startedAt: Date.now() - 120000, // started 120s ago
      retries: 0,
      maxRetries: 3,
      timeout: 60000, // 60s timeout
    };
    expect(isJobTimedOut(job)).toBe(true);
  });

  it('returns false for running job within timeout', () => {
    const job: ExecutionJob = {
      id: 'job_1',
      toolId: 'calc',
      priority: 'normal',
      status: 'running',
      input: null,
      queuedAt: Date.now() - 5000,
      startedAt: Date.now() - 5000, // started 5s ago
      retries: 0,
      maxRetries: 3,
      timeout: 60000,
    };
    expect(isJobTimedOut(job)).toBe(false);
  });

  it('returns false for queued job (not running)', () => {
    const job: ExecutionJob = {
      id: 'job_1',
      toolId: 'calc',
      priority: 'normal',
      status: 'queued',
      input: null,
      queuedAt: Date.now() - 120000,
      retries: 0,
      maxRetries: 3,
      timeout: 60000,
    };
    expect(isJobTimedOut(job)).toBe(false);
  });

  it('returns false when startedAt is undefined', () => {
    const job: ExecutionJob = {
      id: 'job_1',
      toolId: 'calc',
      priority: 'normal',
      status: 'running',
      input: null,
      queuedAt: Date.now() - 120000,
      startedAt: undefined,
      retries: 0,
      maxRetries: 3,
      timeout: 60000,
    };
    expect(isJobTimedOut(job)).toBe(false);
  });

  it('returns false for completed job', () => {
    const job: ExecutionJob = {
      id: 'job_1',
      toolId: 'calc',
      priority: 'normal',
      status: 'completed',
      input: null,
      queuedAt: Date.now() - 120000,
      startedAt: Date.now() - 120000,
      retries: 0,
      maxRetries: 3,
      timeout: 60000,
    };
    expect(isJobTimedOut(job)).toBe(false);
  });
});

// ─── canRetryJob ─────────────────────────────────────────────────────────────

describe('canRetryJob', () => {
  it('returns true for failed job with retries < maxRetries', () => {
    const job: ExecutionJob = {
      id: 'job_1',
      toolId: 'calc',
      priority: 'normal',
      status: 'failed',
      input: null,
      queuedAt: Date.now(),
      retries: 1,
      maxRetries: 3,
      timeout: 60000,
    };
    expect(canRetryJob(job)).toBe(true);
  });

  it('returns false for failed job with retries >= maxRetries', () => {
    const job: ExecutionJob = {
      id: 'job_1',
      toolId: 'calc',
      priority: 'normal',
      status: 'failed',
      input: null,
      queuedAt: Date.now(),
      retries: 3,
      maxRetries: 3,
      timeout: 60000,
    };
    expect(canRetryJob(job)).toBe(false);
  });

  it('returns false for completed job', () => {
    const job: ExecutionJob = {
      id: 'job_1',
      toolId: 'calc',
      priority: 'normal',
      status: 'completed',
      input: null,
      queuedAt: Date.now(),
      retries: 0,
      maxRetries: 3,
      timeout: 60000,
    };
    expect(canRetryJob(job)).toBe(false);
  });

  it('returns false for queued job', () => {
    const job: ExecutionJob = {
      id: 'job_1',
      toolId: 'calc',
      priority: 'normal',
      status: 'queued',
      input: null,
      queuedAt: Date.now(),
      retries: 0,
      maxRetries: 3,
      timeout: 60000,
    };
    expect(canRetryJob(job)).toBe(false);
  });

  it('returns true for timed-out job with retries left', () => {
    const job: ExecutionJob = {
      id: 'job_1',
      toolId: 'calc',
      priority: 'normal',
      status: 'timeout',
      input: null,
      queuedAt: Date.now(),
      retries: 0,
      maxRetries: 3,
      timeout: 60000,
    };
    expect(canRetryJob(job)).toBe(true);
  });

  it('returns false for cancelled job', () => {
    const job: ExecutionJob = {
      id: 'job_1',
      toolId: 'calc',
      priority: 'normal',
      status: 'cancelled',
      input: null,
      queuedAt: Date.now(),
      retries: 0,
      maxRetries: 3,
      timeout: 60000,
    };
    expect(canRetryJob(job)).toBe(false);
  });
});

// ─── formatJobResponse ───────────────────────────────────────────────────────

describe('formatJobResponse', () => {
  it('completed job has progress 100', () => {
    const job: ExecutionJob = {
      id: 'job_1',
      toolId: 'calc',
      priority: 'normal',
      status: 'completed',
      input: '2+2',
      output: 4,
      queuedAt: Date.now(),
      retries: 0,
      maxRetries: 3,
      timeout: 60000,
    };
    const res = formatJobResponse(job);
    expect(res.progress).toBe(100);
  });

  it('completed job includes result', () => {
    const job: ExecutionJob = {
      id: 'job_1',
      toolId: 'calc',
      priority: 'normal',
      status: 'completed',
      input: '2+2',
      output: 4,
      queuedAt: Date.now(),
      retries: 0,
      maxRetries: 3,
      timeout: 60000,
    };
    const res = formatJobResponse(job);
    expect(res.result).toBe(4);
  });

  it('failed job has progress 0', () => {
    const job: ExecutionJob = {
      id: 'job_1',
      toolId: 'calc',
      priority: 'normal',
      status: 'failed',
      input: '2+2',
      error: 'Something went wrong',
      queuedAt: Date.now(),
      retries: 3,
      maxRetries: 3,
      timeout: 60000,
    };
    const res = formatJobResponse(job);
    expect(res.progress).toBe(0);
  });

  it('failed job includes error', () => {
    const job: ExecutionJob = {
      id: 'job_1',
      toolId: 'calc',
      priority: 'normal',
      status: 'failed',
      input: '2+2',
      error: 'Something went wrong',
      queuedAt: Date.now(),
      retries: 3,
      maxRetries: 3,
      timeout: 60000,
    };
    const res = formatJobResponse(job);
    expect(res.error).toBe('Something went wrong');
  });

  it('queued job has progress 0', () => {
    const job: ExecutionJob = {
      id: 'job_1',
      toolId: 'calc',
      priority: 'normal',
      status: 'queued',
      input: '2+2',
      queuedAt: Date.now(),
      retries: 0,
      maxRetries: 3,
      timeout: 60000,
    };
    const res = formatJobResponse(job);
    expect(res.progress).toBe(0);
  });

  it('queued job has no result', () => {
    const job: ExecutionJob = {
      id: 'job_1',
      toolId: 'calc',
      priority: 'normal',
      status: 'queued',
      input: '2+2',
      queuedAt: Date.now(),
      retries: 0,
      maxRetries: 3,
      timeout: 60000,
    };
    const res = formatJobResponse(job);
    expect(res.result).toBeUndefined();
  });

  it('running job has undefined progress', () => {
    const job: ExecutionJob = {
      id: 'job_1',
      toolId: 'calc',
      priority: 'normal',
      status: 'running',
      input: '2+2',
      queuedAt: Date.now(),
      startedAt: Date.now(),
      retries: 0,
      maxRetries: 3,
      timeout: 60000,
    };
    const res = formatJobResponse(job);
    expect(res.progress).toBeUndefined();
  });

  it('response always includes id and status', () => {
    const job: ExecutionJob = {
      id: 'job_abc',
      toolId: 'calc',
      priority: 'normal',
      status: 'queued',
      input: '2+2',
      queuedAt: Date.now(),
      retries: 0,
      maxRetries: 3,
      timeout: 60000,
    };
    const res = formatJobResponse(job);
    expect(res.id).toBe('job_abc');
    expect(res.status).toBe('queued');
  });
});
