import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  integer,
  decimal,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './users';
import { tools } from './tools';

/**
 * Plans Table - Subscription tier definitions
 * Reference: 13_DATABASE_SCHEMA.md Section 4.5, 20_BILLING_SYSTEM.md
 */
export const plans = pgTable('plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(), // 'Free', 'Pro', 'Advance'
  slug: text('slug').notNull().unique(), // 'free', 'pro', 'advance'
  description: text('description'),
  priceMonthly: decimal('price_monthly', { precision: 10, scale: 2 }),
  priceYearly: decimal('price_yearly', { precision: 10, scale: 2 }),
  coinGrant: integer('coin_grant').notNull().default(0), // Coins granted per billing cycle
  isActive: boolean('is_active').notNull().default(true),
  polarProductId: text('polar_product_id').unique(), // Polar product mapping
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Plan Limits - Feature limits per plan
 * Reference: 13_DATABASE_SCHEMA.md Section 4.5, 20_BILLING_SYSTEM.md Section 4
 */
export const planLimits = pgTable('plan_limits', {
  id: uuid('id').primaryKey().defaultRandom(),
  planId: uuid('plan_id')
    .notNull()
    .references(() => plans.id, { onDelete: 'cascade' }),
  limitKey: text('limit_key').notNull(), // 'max_file_size', 'api_rate_limit', etc.
  limitValue: integer('limit_value').notNull(),
  unit: text('unit'), // 'MB', 'requests/min', 'executions/day'
  description: text('description'),
});

/**
 * Subscriptions Table - User subscription records
 * Reference: 13_DATABASE_SCHEMA.md Section 4.5, 20_BILLING_SYSTEM.md Section 5
 */
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  planId: uuid('plan_id')
    .notNull()
    .references(() => plans.id),
  status: text('status').notNull(), // 'active', 'canceled', 'past_due', 'trialing'
  billingCycle: text('billing_cycle').notNull(), // 'monthly', 'yearly'
  currentPeriodStart: timestamp('current_period_start').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  canceledAt: timestamp('canceled_at'),
  trialStart: timestamp('trial_start'),
  trialEnd: timestamp('trial_end'),
  polarSubscriptionId: text('polar_subscription_id').unique(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Coin Transactions - Immutable ledger for coin movements
 * Reference: 13_DATABASE_SCHEMA.md Section 4.7, 21_BILLING_LOGIC.md
 */
export const coinTransactions = pgTable('coin_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(), // Positive for credit, negative for debit
  type: text('type').notNull(), // 'grant', 'purchase', 'spend', 'refund', 'adjustment'
  reason: text('reason').notNull(), // Human-readable reason
  resourceType: text('resource_type'), // 'tool', 'api', 'subscription'
  resourceId: uuid('resource_id'), // ID of related resource
  balanceAfter: integer('balance_after').notNull(), // Snapshot balance after tx
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * Invoices Table - Billing invoices
 * Reference: 13_DATABASE_SCHEMA.md Section 4.5, 20_BILLING_SYSTEM.md Section 7
 */
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id),
  invoiceNumber: text('invoice_number').notNull().unique(),
  status: text('status').notNull(), // 'draft', 'open', 'paid', 'void', 'uncollectible'
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  dueDate: timestamp('due_date'),
  paidAt: timestamp('paid_at'),
  stripeInvoiceId: text('stripe_invoice_id').unique(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Payments Table - Payment transaction records
 * Reference: 13_DATABASE_SCHEMA.md Section 4.5, 20_BILLING_SYSTEM.md Section 8
 */
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  invoiceId: uuid('invoice_id').references(() => invoices.id),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  status: text('status').notNull(), // 'pending', 'succeeded', 'failed', 'refunded'
  paymentMethod: text('payment_method').notNull(), // 'card', 'bank_transfer', 'coins'
  stripePaymentIntentId: text('stripe_payment_intent_id').unique(),
  failureReason: text('failure_reason'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * User Coin Wallets - Cached balance derived from coin_transactions
 * Reference: SOLUTION_ROADMAP Task 2.1, 21_BILLING_LOGIC.md
 */
export const userCoinWallets = pgTable('user_coin_wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  balance: integer('balance').notNull().default(0),
  lifetimeEarned: integer('lifetime_earned').notNull().default(0),
  lifetimeSpent: integer('lifetime_spent').notNull().default(0),
  lastRecalculatedAt: timestamp('last_recalculated_at'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Coin Packs - Purchasable coin bundles
 * Reference: SOLUTION_ROADMAP Task 2.1, 21_BILLING_LOGIC.md
 */
export const coinPacks = pgTable('coin_packs', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  coins: integer('coins').notNull(),
  priceInCents: integer('price_in_cents').notNull(),
  bonusCoins: integer('bonus_coins').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
});

/**
 * Tool Coin Costs - Admin-configurable per-tool pricing
 * Reference: SOLUTION_ROADMAP Task 2.1, 21_BILLING_LOGIC.md
 */
export const toolCoinCosts = pgTable('tool_coin_costs', {
  id: uuid('id').primaryKey().defaultRandom(),
  toolId: uuid('tool_id')
    .notNull()
    .references(() => tools.id),
  baWeight: decimal('ba_weight', { precision: 4, scale: 2 }).notNull().default('1.0'),
  overrideCost: integer('override_cost'), // null = use BA weight formula
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Plan Features - Admin-configurable feature flags per plan
 * Reference: SOLUTION_ROADMAP Task 2.1, 20_BILLING_SYSTEM.md
 */
export const planFeatures = pgTable('plan_features', {
  id: uuid('id').primaryKey().defaultRandom(),
  planId: uuid('plan_id')
    .notNull()
    .references(() => plans.id, { onDelete: 'cascade' }),
  featureKey: varchar('feature_key', { length: 100 }).notNull(),
  enabled: boolean('enabled').notNull().default(false),
  limitValue: integer('limit_value'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
});

/**
 * Plan Coin Rules - Discount percentages per tool class per plan
 * Reference: SOLUTION_ROADMAP Task 2.1, 21_BILLING_LOGIC.md
 */
export const planCoinRules = pgTable('plan_coin_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  planId: uuid('plan_id')
    .notNull()
    .references(() => plans.id, { onDelete: 'cascade' }),
  toolClass: varchar('tool_class', { length: 50 }).notNull(),
  discountPercent: integer('discount_percent').notNull().default(0),
});

/**
 * Ad Reward Transactions - Track every ad watch attempt (immutable audit log)
 * Reference: 20_BILLING_SYSTEM.md Section 8, SOLUTION_ROADMAP Task 4.9
 */
export const adRewardTransactions = pgTable('ad_reward_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  adProvider: varchar('ad_provider', { length: 50 }).notNull().default('google_adsense'),
  adUnitId: text('ad_unit_id'), // Provider ad unit identifier
  coinsAwarded: integer('coins_awarded').notNull().default(0),
  watchDurationMs: integer('watch_duration_ms'), // Actual watch time in ms
  validationStatus: varchar('validation_status', { length: 20 }).notNull().default('pending'),
  // 'pending', 'verified', 'expired', 'fraud'
  ipAddress: varchar('ip_address', { length: 45 }).notNull(),
  fingerprint: varchar('fingerprint', { length: 64 }),
  expiresAt: timestamp('expires_at').notNull(), // Verification window (5 min)
  verifiedAt: timestamp('verified_at'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * User Ad Daily Caps - Single row per user per day, reset daily at midnight UTC
 * Reference: 20_BILLING_SYSTEM.md Section 8.5
 */
export const userAdDailyCaps = pgTable('user_ad_daily_caps', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  date: timestamp('date').notNull(), // Date at midnight UTC
  adsWatched: integer('ads_watched').notNull().default(0),
  coinsEarned: integer('coins_earned').notNull().default(0),
  fraudAttempts: integer('fraud_attempts').notNull().default(0),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Types inferred from tables using InferSelectModel and InferInsertModel
export type Plan = InferSelectModel<typeof plans>;
export type NewPlan = InferInsertModel<typeof plans>;
export type PlanLimit = InferSelectModel<typeof planLimits>;
export type NewPlanLimit = InferInsertModel<typeof planLimits>;
export type Subscription = InferSelectModel<typeof subscriptions>;
export type NewSubscription = InferInsertModel<typeof subscriptions>;
export type CoinTransaction = InferSelectModel<typeof coinTransactions>;
export type NewCoinTransaction = InferInsertModel<typeof coinTransactions>;
export type Invoice = InferSelectModel<typeof invoices>;
export type NewInvoice = InferInsertModel<typeof invoices>;
export type Payment = InferSelectModel<typeof payments>;
export type NewPayment = InferInsertModel<typeof payments>;
export type UserCoinWallet = InferSelectModel<typeof userCoinWallets>;
export type NewUserCoinWallet = InferInsertModel<typeof userCoinWallets>;
export type CoinPack = InferSelectModel<typeof coinPacks>;
export type NewCoinPack = InferInsertModel<typeof coinPacks>;
export type ToolCoinCost = InferSelectModel<typeof toolCoinCosts>;
export type NewToolCoinCost = InferInsertModel<typeof toolCoinCosts>;
export type PlanFeature = InferSelectModel<typeof planFeatures>;
export type NewPlanFeature = InferInsertModel<typeof planFeatures>;
export type PlanCoinRule = InferSelectModel<typeof planCoinRules>;
export type NewPlanCoinRule = InferInsertModel<typeof planCoinRules>;
export type AdRewardTransaction = InferSelectModel<typeof adRewardTransactions>;
export type NewAdRewardTransaction = InferInsertModel<typeof adRewardTransactions>;
export type UserAdDailyCap = InferSelectModel<typeof userAdDailyCaps>;
export type NewUserAdDailyCap = InferInsertModel<typeof userAdDailyCaps>;

// Zod schemas - use 'as unknown as' for drizzle-zod compatibility
export const insertPlanSchema = createInsertSchema(plans) as unknown as z.ZodType<NewPlan>;
export const insertPlanLimitSchema = createInsertSchema(planLimits) as unknown as z.ZodType<NewPlanLimit>;
export const insertSubscriptionSchema = createInsertSchema(subscriptions) as unknown as z.ZodType<NewSubscription>;
export const insertCoinTransactionSchema = createInsertSchema(coinTransactions) as unknown as z.ZodType<NewCoinTransaction>;
export const insertInvoiceSchema = createInsertSchema(invoices) as unknown as z.ZodType<NewInvoice>;
export const insertPaymentSchema = createInsertSchema(payments) as unknown as z.ZodType<NewPayment>;
export const insertUserCoinWalletSchema = createInsertSchema(userCoinWallets) as unknown as z.ZodType<NewUserCoinWallet>;
export const insertCoinPackSchema = createInsertSchema(coinPacks) as unknown as z.ZodType<NewCoinPack>;
export const insertToolCoinCostSchema = createInsertSchema(toolCoinCosts) as unknown as z.ZodType<NewToolCoinCost>;
export const insertPlanFeatureSchema = createInsertSchema(planFeatures) as unknown as z.ZodType<NewPlanFeature>;
export const insertPlanCoinRuleSchema = createInsertSchema(planCoinRules) as unknown as z.ZodType<NewPlanCoinRule>;
export const insertAdRewardTransactionSchema = createInsertSchema(adRewardTransactions) as unknown as z.ZodType<NewAdRewardTransaction>;
export const insertUserAdDailyCapSchema = createInsertSchema(userAdDailyCaps) as unknown as z.ZodType<NewUserAdDailyCap>;
