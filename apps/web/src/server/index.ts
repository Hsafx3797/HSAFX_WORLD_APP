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
 * - ads/              Login reward service (daily/hourly login rewards)
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

// ─── Login Rewards (Phase 4) ─────────────────────────────────
export {
  claimLoginReward,
  getLoginRewardStats,
} from './rewards/login-reward-service';
export { LoginRewardError } from './rewards/types';
export type { ClaimRewardResult, RewardStats } from './rewards/types';
