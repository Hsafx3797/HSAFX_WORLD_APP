// Main package entry point
export * from './types';
export * from './constants';
export * from './utils';
export * from './errors';
export * from './permissions';

// Environment helpers (migrated from @hsafx/config)
export { ENV, validateEnv, getEnv } from './env';

// Billing module - rename conflicting AdRewardConfig
export {
  type TransactionType,
  type CoinTransaction,
  type BillableAction,
  type ToolCostConfig,
  type CoinPack,
  type BillingResult,
  type AdRewardConfig as BillingAdRewardConfig,
  type DailyRewardConfig,
  type UsageRecord,
  FREE_TOOLS,
  DEFAULT_COSTS_BY_CATEGORY,
  calculateToolCost,
  isToolFree,
  getDefaultCostConfig,
  COIN_PACKS,
  AD_REWARD_CONFIG,
  DAILY_REWARD_CONFIG,
  getCoinPack,
  getEffectiveCoins,
  getCostPerCoin,
  getBestValuePack,
  calculateDailyReward,
  canWatchAd,
  BillingErrorCodes,
  validateSufficientBalance,
  validatePositiveAmount,
  validateTransactionType,
  createBillingError,
  createBillingSuccess,
  formatCoinAmount,
  parseCoinCost,
  calculateTransactionSummary,
  type TransactionSummary,
} from './billing';

// Execution module
export {
  type ExecutionMode,
  type ToolRuntime,
  type ToolExecutionDef,
  type ExecutionContext,
  type ExecutionInput,
  type ExecutionResult,
  type PreExecutionCheck,
  type ExecutionRecord,
  checkCanExecuteTool,
  determineExecutionPath,
  createExecutionRecord,
  formatExecutionError,
  formatExecutionSuccess,
} from './execution/service';

export {
  type WorkerStatus,
  type WorkerInfo,
  type JobPriority,
  type JobStatus,
  type ExecutionJob,
  type PoolConfig,
  type PoolStats,
  DEFAULT_POOL_CONFIG,
  createJob,
  generateWorkerId,
  calculatePriorityScore,
  isJobTimedOut,
  canRetryJob,
  formatJobResponse,
} from './execution/worker-pool';

export {
  type CacheEntry,
  type CacheStats,
  type CacheConfig,
  DEFAULT_CACHE_CONFIG,
  TOOL_CACHE_TTL,
  generateCacheKey,
  calculateSize,
  shouldCache,
  getToolTTL,
  createCacheEntry,
  isExpired,
  shouldEvict,
  CACHE_REDIS_KEYS,
} from './execution/cache';

// Ads module - AdRewardConfig kept as canonical
export {
  type AdProvider,
  type AdUnitType,
  type AdTransactionStatus,
  type ValidationStatus as AdValidationStatus,
  type AdRewardConfig,
  type AdRewardTransaction,
  type UserAdDailyCap,
  type AdWatchResult,
  type AdAvailability,
  type FingerprintData,
  type PenaltyLevel,
  type AdPenaltyRecord,
  type FraudFlags,
  type AdProviderCallback,
  DEFAULT_AD_REWARD_CONFIG,
} from './ads/types';

export {
  type CanWatchAdResult,
  canUserWatchAd,
  isIpRateLimited,
  isValidWatchDuration,
  getDailyRemaining,
  generateFingerprintHash,
  detectFraudIndicators,
  determinePenaltyLevel,
  calculatePenaltyExpiration,
  isPenaltyActive,
  calculateCooldownEnd,
  calculateTransactionExpiration,
} from './ads/validation';

export {
  generateTransactionId,
  getTodayDateString,
  checkAdAvailability,
  createAdTransaction,
  processAdCallback,
  updateDailyCap,
  formatAdWatchResult,
  AD_REWARD_REDIS_KEYS,
} from './ads/service';

// Feature flags & kill switch service
export {
  FlagService,
  getFlagService,
  type FlagType,
  type FeatureFlag,
  type FlagContext,
  type FlagEvaluationResult,
} from './flags';
