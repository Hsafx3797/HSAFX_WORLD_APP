/**
 * Server-side utilities (Next.js server actions & server-only helpers)
 * @module server
 *
 * Phase 3 deliverables:
 * - jobs/             Redis-backed async job system (manager + worker)
 *
 * Phase 4 deliverables:
 * - tool-execution/   Server execution layer (coin reservation, sync/async routing)
 * - limits/           CoinService (atomic wallet ops) + anonymous usage tracking
 * - ads/              Ad reward service (watch, verify, credit coins)
 */

// ─── Job System (Phase 3) ─────────────────────────────────────
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

// ─── Coin Service (Phase 4) ──────────────────────────────────
export {
  calculateCoinCost,
  getToolCoinCost,
  getBalance,
  reserveCoins,
  confirmReservation,
  releaseReservation,
  deductCoins,
  grantCoins,
  InsufficientCoinsError,
} from './limits/coin-service';

// ─── Tool Execution (Phase 4) ────────────────────────────────
export { executeToolServer } from './tool-execution';

// ─── Anonymous Usage (Phase 4) ────────────────────────────────
export {
  checkAnonymousLimit,
  trackAnonymousUsage,
  getAnonymousUsageSummary,
  type ToolClass,
  type AnonUsageCheckResult,
} from './limits/anon-usage-service';

// ─── Ad Rewards (Phase 4) ────────────────────────────────────
export {
  initiateAdWatch,
  completeAdWatch,
  getAdWatchStats,
} from './ads/ad-reward-service';
export { AdRewardError } from './ads/types';
export type { AdWatchInitResult, AdWatchCompleteResult } from './ads/types';
