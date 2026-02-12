// Main package entry point
export * from './types';
export * from './constants';
export * from './utils';
export * from './errors';
export * from './permissions';

// Environment helpers (migrated from @hsafx/config)
export { ENV, validateEnv, getEnv } from './env';

// Billing module
export {
  type TransactionType,
  type CoinTransaction,
  type BillableAction,
  type ToolCostConfig,
  type CoinPack,
  type BillingResult,
  type LoginRewardConfig,
  type UsageRecord,
  FREE_TOOLS,
  DEFAULT_COSTS_BY_CATEGORY,
  calculateToolCost,
  isToolFree,
  getDefaultCostConfig,
  COIN_PACKS,
  LOGIN_REWARD_CONFIG,
  getCoinPack,
  getEffectiveCoins,
  getCostPerCoin,
  getBestValuePack,
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

// Rewards module (replaces ads)
export {
  type RewardType,
  type LoginRewardConfig as SharedLoginRewardConfig,
  type ClaimRewardResult,
  type RewardStats,
  type CanClaimRewardResult,
  DEFAULT_LOGIN_REWARD_CONFIG,
  canClaimDailyReward,
  canClaimHourlyReward,
  getDailyCoinsRemaining,
} from './rewards';

// Feature flags & kill switch service
export {
  FlagService,
  getFlagService,
  type FlagType,
  type FeatureFlag,
  type FlagContext,
  type FlagEvaluationResult,
} from './flags';

// Pub/Sub event system
export {
  PubSubChannels,
  jobProgressChannel,
  type PubSubChannel,
  getEventBus,
  EventBus,
  publishAdminError,
  publishAdminAlert,
  publishAdminMetrics,
  publishAdminJob,
  publishAdminWebhook,
  publishCacheInvalidation,
  publishJobProgress,
  type PubSubEvent,
  type ChannelEventMap,
  type AdminErrorEvent,
  type AdminAlertEvent,
  type AdminMetricsEvent,
  type AdminJobEvent,
  type AdminWebhookEvent,
  type CacheInvalidationEvent,
  type JobProgressEvent,
} from './pubsub';
