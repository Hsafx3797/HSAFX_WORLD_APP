/**
 * Server-side utilities (Next.js server actions & server-only helpers)
 * @module server
 *
 * - jobs/   Redis-backed async job system (manager + worker)
 * - limits/ B2B quota enforcement
 */

// ─── Job System ───────────────────────────────────────────────
export {
  createJob,
  getJob,
  updateJob,
  setJobResult,
  getJobResult,
  setJobProgress,
  type Job,
  type JobStatus,
  type JobResult,
  type CreateJobInput,
} from './jobs/job-manager';

export { processJob } from './jobs/job-worker';

// ─── B2B Quota Service ────────────────────────────────────────
export {
  resolveB2bSuite,
  getActiveB2bSubscription,
  checkB2bQuota,
  incrementB2bUsage,
  getB2bUsageSummary,
  B2bQuotaExhaustedError,
  B2bNoSubscriptionError,
  B2bSuiteNotAvailableError,
  type B2bQuotaCheck,
  type B2bUsageIncrementResult,
  type B2bUsageSummary,
} from './limits/b2b-quota-service';
