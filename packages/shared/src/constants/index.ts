/**
 * Application-wide constants
 * Reference: Multiple planning documents
 */

/**
 * User Roles
 * Reference: 01_USER_ROLES_PERMISSIONS.md
 */
export const UserRole = {
  GUEST: 'guest',
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

/**
 * Subscription Plans
 * Canonical: free ($0), pro ($10/mo), advance ($20/mo)
 */
export const SubscriptionPlan = {
  FREE: 'free',
  PRO: 'pro',
  ADVANCE: 'advance',
} as const;

export type SubscriptionPlanType = (typeof SubscriptionPlan)[keyof typeof SubscriptionPlan];

/**
 * Billing Cycles
 */
export const BillingCycle = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const;

export type BillingCycleType = (typeof BillingCycle)[keyof typeof BillingCycle];

/**
 * Subscription Status
 */
export const SubscriptionStatus = {
  ACTIVE: 'active',
  CANCELED: 'canceled',
  PAST_DUE: 'past_due',
  TRIALING: 'trialing',
  PAUSED: 'paused',
} as const;

export type SubscriptionStatusType = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

/**
 * Tool Groups
 * Reference: 30_TOOLS_CATALOG.md
 */
export const ToolGroup = {
  TEXT_TOOLS: 1, // Rust/WASM - 191 tools
  DATA_CONVERTERS: 2, // Node.js - 100+ tools
  MEDIA_PROCESSORS: 3, // Python - 100+ tools
  GENERATORS_CALCULATORS: 4, // JS/Rust - 100 tools
  LOGISTICS_TOOLS: 5, // Python - 10+ tools
} as const;

export type ToolGroupType = (typeof ToolGroup)[keyof typeof ToolGroup];

/**
 * Tool Runtimes (server-side only)
 */
export const ToolRuntime = {
  NODE: 'node',
  PYTHON: 'python',
} as const;

export type ToolRuntimeType = (typeof ToolRuntime)[keyof typeof ToolRuntime];

/**
 * Payment Status
 */
export const PaymentStatus = {
  PENDING: 'pending',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export type PaymentStatusType = (typeof PaymentStatus)[keyof typeof PaymentStatus];

/**
 * File Upload Status
 */
export const FileUploadStatus = {
  PENDING: 'pending',
  UPLOADED: 'uploaded',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type FileUploadStatusType = (typeof FileUploadStatus)[keyof typeof FileUploadStatus];

/**
 * Async Job Status
 * Reference: 71_ASYNC_JOB_SPEC.md
 */
export const AsyncJobStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  CANCELED: 'canceled',
} as const;

export type AsyncJobStatusType = (typeof AsyncJobStatus)[keyof typeof AsyncJobStatus];

/**
 * Rate Limit Tiers
 * Reference: 20_BILLING_SYSTEM.md Section 4, 16_NON_FUNCTIONAL_REQUIREMENTS.md
 */
export const RateLimitTier = {
  GUEST: 'guest', // 10 req/min
  FREE: 'free', // 30 req/min
  PRO: 'pro', // 100 req/min
  ADVANCE: 'advance', // 2000 req/min
} as const;

export type RateLimitTierType = (typeof RateLimitTier)[keyof typeof RateLimitTier];

/**
 * Rate limits per tier (requests per minute)
 */
export const RATE_LIMITS: Record<RateLimitTierType, number> = {
  [RateLimitTier.GUEST]: 10,
  [RateLimitTier.FREE]: 30,
  [RateLimitTier.PRO]: 100,
  [RateLimitTier.ADVANCE]: 2000,
};

/**
 * File size limits (in bytes)
 */
export const FILE_SIZE_LIMITS = {
  FREE: 10 * 1024 * 1024, // 10 MB
  PRO: 100 * 1024 * 1024, // 100 MB
  ADVANCE: 1024 * 1024 * 1024, // 1 GB
} as const;

/**
 * Session expiry times
 */
export const SESSION_EXPIRY = {
  DEFAULT: 7 * 24 * 60 * 60 * 1000, // 7 days
  REMEMBER_ME: 30 * 24 * 60 * 60 * 1000, // 30 days
  API_KEY: 365 * 24 * 60 * 60 * 1000, // 1 year
} as const;

/**
 * File TTL (time to live)
 */
export const FILE_TTL = {
  TEMPORARY: 24 * 60 * 60 * 1000, // 24 hours
  RESULT: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * Cache TTLs (in seconds)
 */
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
} as const;
