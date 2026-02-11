/**
 * HSAFX Schemas Package
 * @module @hsafx/schemas
 *
 * Centralized Zod schemas for validation across the monorepo.
 * All schemas export both the Zod schema and inferred TypeScript types.
 */

// Tool schemas
export {
  ToolExecutionRequestSchema,
  ToolInputSchema,
  ToolOutputSchema,
  ToolMetadataSchema,
  type ToolExecutionRequest,
  type ToolInput,
  type ToolOutput,
  type ToolMetadata,
} from './tool';

// API schemas
export {
  PaginationQuerySchema,
  IdParamSchema,
  SlugParamSchema,
  ApiErrorSchema,
  createApiResponseSchema,
  createPaginatedResponseSchema,
  type PaginationQuery,
  type IdParam,
  type SlugParam,
  type ApiError,
} from './api';

// Billing schemas
export {
  PlanTierSchema,
  BillingIntervalSchema,
  SubscriptionStatusSchema,
  CoinTransactionTypeSchema,
  PlanDetailsSchema,
  WalletBalanceSchema,
  CoinPurchaseRequestSchema,
  type PlanTier,
  type BillingInterval,
  type SubscriptionStatus,
  type CoinTransactionType,
  type PlanDetails,
  type WalletBalance,
  type CoinPurchaseRequest,
} from './billing';
