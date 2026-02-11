/**
 * Billing-related Zod schemas
 * @module @hsafx/schemas/billing
 */

import { z } from 'zod';

/**
 * Plan tier enum
 */
export const PlanTierSchema = z.enum(['guest', 'free', 'pro', 'advance']);
export type PlanTier = z.infer<typeof PlanTierSchema>;

/**
 * Billing interval enum
 */
export const BillingIntervalSchema = z.enum(['monthly', 'yearly']);
export type BillingInterval = z.infer<typeof BillingIntervalSchema>;

/**
 * Subscription status enum
 */
export const SubscriptionStatusSchema = z.enum([
  'active',
  'canceled',
  'past_due',
  'trialing',
  'paused',
]);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;

/**
 * Coin transaction type enum
 */
export const CoinTransactionTypeSchema = z.enum([
  'grant',
  'purchase',
  'spend',
  'refund',
  'adjustment',
  'daily_reward',
]);
export type CoinTransactionType = z.infer<typeof CoinTransactionTypeSchema>;

/**
 * Plan details schema
 */
export const PlanDetailsSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  pricing: z.object({
    monthly: z.number().min(0),
    yearly: z.number().min(0),
  }),
  features: z.object({
    coinGrant: z.number().int().min(0),
    maxFileSize: z.number().int().min(0),
    apiRateLimit: z.number().int().min(0),
    priority: z.string(),
    customDomain: z.boolean(),
    analytics: z.boolean(),
    support: z.string(),
  }),
  limits: z.record(z.number()),
});

export type PlanDetails = z.infer<typeof PlanDetailsSchema>;

/**
 * Wallet balance schema
 */
export const WalletBalanceSchema = z.object({
  userId: z.string().uuid(),
  balance: z.number().int().min(0),
  lastTransaction: z
    .object({
      id: z.string().uuid(),
      amount: z.number().int(),
      type: CoinTransactionTypeSchema,
      createdAt: z.string().datetime(),
    })
    .optional(),
});

export type WalletBalance = z.infer<typeof WalletBalanceSchema>;

/**
 * Coin purchase request schema
 */
export const CoinPurchaseRequestSchema = z.object({
  packId: z.string().uuid(),
  quantity: z.number().int().min(1).default(1),
});

export type CoinPurchaseRequest = z.infer<typeof CoinPurchaseRequestSchema>;
