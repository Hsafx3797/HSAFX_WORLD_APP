import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  timestamp,
  integer,
  decimal,
  boolean,
  jsonb,
  bigint,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './users';
import { tools } from './tools';

// ─── Enums ────────────────────────────────────────────────────

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active', 'canceled', 'past_due', 'trialing', 'incomplete', 'paused',
]);

export const coinTransactionTypeEnum = pgEnum('coin_transaction_type', [
  'grant', 'purchase', 'spend', 'refund', 'adjustment', 'reward', 'referral',
]);

export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft', 'open', 'partially_paid', 'paid', 'void', 'uncollectible',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending', 'succeeded', 'failed', 'refunded',
]);

export const billingIntervalEnum = pgEnum('billing_interval', [
  'monthly', 'yearly',
]);

export const planLimitTypeEnum = pgEnum('plan_limit_type', [
  'integer', 'size', 'duration', 'boolean', 'complex',
]);

export const resetPeriodEnum = pgEnum('reset_period', [
  'hourly', 'daily', 'monthly', 'yearly', 'never',
]);

export const planChangeTypeEnum = pgEnum('plan_change_type', [
  'feature_toggle', 'limit_update', 'metadata_add', 'metadata_remove',
]);

export const referralStatusEnum = pgEnum('referral_status', [
  'pending', 'activated', 'rewarded',
]);

/**
 * Plans Table - Subscription tier definitions
 * Reference: 13_DATABASE_SCHEMA.md Section 4.5, 20_BILLING_SYSTEM.md
 */
export const plans = pgTable('plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(), // 'Free', 'Pro', 'Advance'
  slug: text('slug').notNull().unique(), // 'free', 'pro', 'advance'
  description: text('description'),
  priceMonthlyCents: bigint('price_monthly_cents', { mode: 'number' }),
  priceYearlyCents: bigint('price_yearly_cents', { mode: 'number' }),
  coinGrant: integer('coin_grant').notNull().default(0), // Coins granted per billing cycle
  isActive: boolean('is_active').notNull().default(true),
  polarProductId: text('polar_product_id').unique(), // Polar product mapping
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('plans_slug_idx').on(t.slug),
]);

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
}, (t) => [
  uniqueIndex('pl_plan_key_idx').on(t.planId, t.limitKey),
]);

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
  status: subscriptionStatusEnum('status').notNull(),
  billingCycle: billingIntervalEnum('billing_cycle').notNull(),
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
}, (t) => [
  index('sub_user_id_idx').on(t.userId),
  index('sub_status_idx').on(t.status),
  index('sub_plan_id_idx').on(t.planId),
  index('sub_period_end_idx').on(t.currentPeriodEnd),
  index('sub_polar_sub_id_idx').on(t.polarSubscriptionId),
]);

/**
 * Coin Transactions - Immutable ledger for coin movements
 * Reference: 13_DATABASE_SCHEMA.md Section 4.7, 21_BILLING_LOGIC.md
 */
export const coinTransactions = pgTable('coin_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  amount: bigint('amount', { mode: 'number' }).notNull(), // Positive for credit, negative for debit
  type: coinTransactionTypeEnum('type').notNull(),
  reason: text('reason').notNull(), // Human-readable reason
  resourceType: text('resource_type'), // 'tool', 'api', 'subscription', 'coin_pack'
  resourceId: uuid('resource_id'), // ID of related resource
  balanceAfter: bigint('balance_after', { mode: 'number' }).notNull(), // Snapshot balance after tx
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('coin_tx_user_id_idx').on(t.userId),
  index('coin_tx_type_idx').on(t.type),
  index('coin_tx_created_idx').on(t.createdAt),
]);

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
  status: invoiceStatusEnum('status').notNull(),
  amountCents: bigint('amount_cents', { mode: 'number' }).notNull(),
  currency: text('currency').notNull().default('USD'),
  dueDate: timestamp('due_date'),
  paidAt: timestamp('paid_at'),
  stripeInvoiceId: text('stripe_invoice_id').unique(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('inv_user_id_idx').on(t.userId),
  index('inv_status_idx').on(t.status),
  index('inv_subscription_id_idx').on(t.subscriptionId),
  index('inv_due_date_idx').on(t.dueDate),
]);

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
  amountCents: bigint('amount_cents', { mode: 'number' }).notNull(),
  currency: text('currency').notNull().default('USD'),
  status: paymentStatusEnum('status').notNull(),
  paymentMethod: text('payment_method').notNull(), // 'card', 'bank_transfer', 'coins'
  stripePaymentIntentId: text('stripe_payment_intent_id').unique(),
  failureReason: text('failure_reason'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('pay_user_id_idx').on(t.userId),
  index('pay_status_idx').on(t.status),
  index('pay_invoice_id_idx').on(t.invoiceId),
  index('pay_stripe_pi_idx').on(t.stripePaymentIntentId),
  index('pay_user_created_idx').on(t.userId, t.createdAt),
  index('pay_sub_status_idx').on(t.invoiceId, t.status),
]);

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
  balance: bigint('balance', { mode: 'number' }).notNull().default(0),
  lifetimeEarned: bigint('lifetime_earned', { mode: 'number' }).notNull().default(0),
  lifetimeSpent: bigint('lifetime_spent', { mode: 'number' }).notNull().default(0),
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
  priceInCents: bigint('price_in_cents', { mode: 'number' }).notNull(),
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
}, (t) => [
  uniqueIndex('tcc_tool_id_idx').on(t.toolId),
]);

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
}, (t) => [
  uniqueIndex('pf_plan_feature_idx').on(t.planId, t.featureKey),
]);

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
}, (t) => [
  uniqueIndex('pcr_plan_class_idx').on(t.planId, t.toolClass),
]);

/**
 * Login Reward Claims - Immutable log of every claimed login reward
 * Reference: 20_BILLING_SYSTEM.md Section 8 (replaced ad rewards)
 */
export const loginRewardClaims = pgTable('login_reward_claims', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  rewardType: varchar('reward_type', { length: 20 }).notNull(), // 'daily' | 'hourly'
  coinsAwarded: integer('coins_awarded').notNull(),
  coinTransactionId: uuid('coin_transaction_id').references(() => coinTransactions.id),
  claimedAt: timestamp('claimed_at').notNull().defaultNow(),
}, (t) => [
  index('lrc_user_id_idx').on(t.userId),
  index('lrc_claimed_at_idx').on(t.claimedAt),
  index('lrc_reward_type_idx').on(t.rewardType),
]);

/**
 * User Daily Reward Caps - Single row per user per day, reset daily at midnight UTC
 * Reference: 20_BILLING_SYSTEM.md Section 8.5 (replaced ad daily caps)
 */
export const userDailyRewardCaps = pgTable('user_daily_reward_caps', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  date: timestamp('date').notNull(), // Date at midnight UTC
  totalCoinsEarned: integer('total_coins_earned').notNull().default(0),
  claimsCount: integer('claims_count').notNull().default(0),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  uniqueIndex('udrc_user_date_idx').on(t.userId, t.date),
]);

/**
 * User Streaks - Track consecutive daily login streaks for reward multipliers
 * Reference: IMPLEMENTATION_ROADMAP.md T2.2
 *
 * Multiplier tiers: 3-day=1.5×, 7-day=2×, 14-day=3×, 30-day=5×
 */
export const userStreaks = pgTable('user_streaks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  currentStreak: integer('current_streak').notNull().default(0),
  longestStreak: integer('longest_streak').notNull().default(0),
  lastActiveDate: timestamp('last_active_date'), // Midnight UTC of last daily claim
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Processed Webhooks - Idempotency tracking for Stripe/Polar webhooks (C-11)
 * Reference: 15_SECURITY_MODEL.md, 24_ERROR_HANDLING.md
 */
export const processedWebhooks = pgTable('processed_webhooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: varchar('event_id', { length: 255 }).notNull().unique(),
  provider: varchar('provider', { length: 20 }).notNull(), // 'stripe' | 'polar'
  eventType: varchar('event_type', { length: 100 }),
  processedAt: timestamp('processed_at').notNull().defaultNow(),
}, (t) => [
  index('pw_provider_idx').on(t.provider),
]);

/**
 * Usage Coin Fallbacks - Over-limit fallback discount rates per plan/tool class
 * Reference: 13_DATABASE_SCHEMA.dbml Section "usage_coin_fallbacks"
 *
 * When a user exceeds their plan limit, they can still use tools by paying coins
 * at a (less favorable) fallback discount rate.
 * Formula: coins = ceil(ba_charged × (1 - discount/100))
 */
export const usageCoinFallbacks = pgTable('usage_coin_fallbacks', {
  id: uuid('id').primaryKey().defaultRandom(),
  planId: uuid('plan_id')
    .notNull()
    .references(() => plans.id, { onDelete: 'cascade' }),
  toolClass: varchar('tool_class', { length: 100 }).notNull(),
  coinDiscountPercent: decimal('coin_discount_percent', { precision: 5, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  uniqueIndex('ucf_plan_class_idx').on(t.planId, t.toolClass),
]);

/**
 * Invoice Payments - Links payments to invoices (supports partial payments)
 * Reference: 13_DATABASE_SCHEMA.dbml Section "invoice_payments"
 */
export const invoicePayments = pgTable('invoice_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id')
    .notNull()
    .references(() => invoices.id, { onDelete: 'cascade' }),
  paymentId: uuid('payment_id')
    .notNull()
    .references(() => payments.id, { onDelete: 'cascade' }),
  amountCents: bigint('amount_cents', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('ip_invoice_id_idx').on(t.invoiceId),
  index('ip_payment_id_idx').on(t.paymentId),
]);

/**
 * Payment Methods - Stored payment methods for recurring billing
 * Reference: 13_DATABASE_SCHEMA.dbml Section "payment_methods"
 *
 * Security: provider_method_id is a tokenized reference from the payment provider.
 */
export const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(), // 'stripe', 'paypal'
  providerMethodId: text('provider_method_id').notNull(),
  type: text('type').notNull(), // 'card', 'bank_account'
  last4: text('last4'),
  brand: text('brand'), // 'visa', 'mastercard', etc.
  expiryMonth: text('expiry_month'),
  expiryYear: text('expiry_year'),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
}, (t) => [
  index('pm_user_id_idx').on(t.userId),
  index('pm_user_default_idx').on(t.userId, t.isDefault),
]);

/**
 * Coin Purchase Payments - Maps successful payments to coin credits
 * Reference: 13_DATABASE_SCHEMA.dbml Section "coin_purchase_payments"
 */
export const coinPurchasePayments = pgTable('coin_purchase_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentId: uuid('payment_id')
    .notNull()
    .references(() => payments.id, { onDelete: 'cascade' }),
  coinPackId: uuid('coin_pack_id')
    .notNull()
    .references(() => coinPacks.id),
  coinsCredited: bigint('coins_credited', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * Plan Metadata - Extensible key-value storage for plan configuration
 * Reference: 13_DATABASE_SCHEMA.dbml Section "plan_metadata"
 */
export const planMetadata = pgTable('plan_metadata', {
  id: uuid('id').primaryKey().defaultRandom(),
  planId: uuid('plan_id')
    .notNull()
    .references(() => plans.id, { onDelete: 'cascade' }),
  metaKey: text('meta_key').notNull(),
  metaValue: jsonb('meta_value').$type<unknown>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  uniqueIndex('pmd_plan_key_idx').on(t.planId, t.metaKey),
]);

/**
 * Plan Upgrade Rules - Automated plan upgrade conditions
 * Reference: 13_DATABASE_SCHEMA.dbml Section "plan_upgrade_rules"
 */
export const planUpgradeRules = pgTable('plan_upgrade_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  fromPlanId: uuid('from_plan_id')
    .notNull()
    .references(() => plans.id, { onDelete: 'cascade' }),
  toPlanId: uuid('to_plan_id')
    .notNull()
    .references(() => plans.id, { onDelete: 'cascade' }),
  autoUpgrade: boolean('auto_upgrade').notNull().default(false),
  conditions: jsonb('conditions').$type<Record<string, unknown>>().default({}),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Plan Audit Logs - Tracks plan configuration changes
 * Reference: 13_DATABASE_SCHEMA.dbml Section "plan_audit_logs"
 */
export const planAuditLogs = pgTable('plan_audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  planId: uuid('plan_id')
    .notNull()
    .references(() => plans.id, { onDelete: 'cascade' }),
  changedBy: uuid('changed_by')
    .notNull()
    .references(() => users.id, { onDelete: 'set null' }),
  changeType: planChangeTypeEnum('change_type').notNull(),
  changes: jsonb('changes').$type<Record<string, unknown>>().notNull(),
  reason: text('reason'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * Referrals - Track user referral invitations and rewards
 * Reference: IMPLEMENTATION_ROADMAP T3.1
 *
 * Status flow: pending → activated (referred user signs up) → rewarded (coins granted)
 */
export const referrals = pgTable('referrals', {
  id: uuid('id').primaryKey().defaultRandom(),
  referrerId: uuid('referrer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  referredUserId: uuid('referred_user_id')
    .references(() => users.id, { onDelete: 'set null' }),
  referralCode: text('referral_code').notNull(),
  status: referralStatusEnum('status').notNull().default('pending'),
  coinsEarned: integer('coins_earned').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  activatedAt: timestamp('activated_at'),
  rewardedAt: timestamp('rewarded_at'),
}, (t) => [
  index('ref_referrer_id_idx').on(t.referrerId),
  index('ref_referred_user_idx').on(t.referredUserId),
  uniqueIndex('ref_code_unique_idx').on(t.referralCode),
]);

/**
 * Coin Events - Time-limited coin multiplier events
 * Reference: IMPLEMENTATION_ROADMAP T3.7
 *
 * Admins create events that multiply coin rewards for a period.
 * Backend checks for active events when granting coins.
 */
export const coinEvents = pgTable('coin_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  multiplier: decimal('multiplier', { precision: 4, scale: 2 }).notNull().default('1.0'),
  startsAt: timestamp('starts_at').notNull(),
  endsAt: timestamp('ends_at').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: uuid('created_by')
    .references(() => users.id, { onDelete: 'set null' }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('ce_active_period_idx').on(t.isActive, t.startsAt, t.endsAt),
]);

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
export type LoginRewardClaim = InferSelectModel<typeof loginRewardClaims>;
export type NewLoginRewardClaim = InferInsertModel<typeof loginRewardClaims>;
export type UserDailyRewardCap = InferSelectModel<typeof userDailyRewardCaps>;
export type NewUserDailyRewardCap = InferInsertModel<typeof userDailyRewardCaps>;
export type UserStreak = InferSelectModel<typeof userStreaks>;
export type NewUserStreak = InferInsertModel<typeof userStreaks>;
export type ProcessedWebhook = InferSelectModel<typeof processedWebhooks>;
export type NewProcessedWebhook = InferInsertModel<typeof processedWebhooks>;
export type UsageCoinFallback = InferSelectModel<typeof usageCoinFallbacks>;
export type NewUsageCoinFallback = InferInsertModel<typeof usageCoinFallbacks>;
export type InvoicePayment = InferSelectModel<typeof invoicePayments>;
export type NewInvoicePayment = InferInsertModel<typeof invoicePayments>;
export type PaymentMethod = InferSelectModel<typeof paymentMethods>;
export type NewPaymentMethod = InferInsertModel<typeof paymentMethods>;
export type CoinPurchasePayment = InferSelectModel<typeof coinPurchasePayments>;
export type NewCoinPurchasePayment = InferInsertModel<typeof coinPurchasePayments>;
export type PlanMetadataRow = InferSelectModel<typeof planMetadata>;
export type NewPlanMetadataRow = InferInsertModel<typeof planMetadata>;
export type PlanUpgradeRule = InferSelectModel<typeof planUpgradeRules>;
export type NewPlanUpgradeRule = InferInsertModel<typeof planUpgradeRules>;
export type PlanAuditLog = InferSelectModel<typeof planAuditLogs>;
export type NewPlanAuditLog = InferInsertModel<typeof planAuditLogs>;
export type Referral = InferSelectModel<typeof referrals>;
export type NewReferral = InferInsertModel<typeof referrals>;
export type CoinEvent = InferSelectModel<typeof coinEvents>;
export type NewCoinEvent = InferInsertModel<typeof coinEvents>;

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
export const insertLoginRewardClaimSchema = createInsertSchema(loginRewardClaims) as unknown as z.ZodType<NewLoginRewardClaim>;
export const insertUserDailyRewardCapSchema = createInsertSchema(userDailyRewardCaps) as unknown as z.ZodType<NewUserDailyRewardCap>;
export const insertUserStreakSchema = createInsertSchema(userStreaks) as unknown as z.ZodType<NewUserStreak>;
export const insertProcessedWebhookSchema = createInsertSchema(processedWebhooks) as unknown as z.ZodType<NewProcessedWebhook>;
export const insertUsageCoinFallbackSchema = createInsertSchema(usageCoinFallbacks) as unknown as z.ZodType<NewUsageCoinFallback>;
export const insertInvoicePaymentSchema = createInsertSchema(invoicePayments) as unknown as z.ZodType<NewInvoicePayment>;
export const insertPaymentMethodSchema = createInsertSchema(paymentMethods) as unknown as z.ZodType<NewPaymentMethod>;
export const insertCoinPurchasePaymentSchema = createInsertSchema(coinPurchasePayments) as unknown as z.ZodType<NewCoinPurchasePayment>;
export const insertPlanMetadataSchema = createInsertSchema(planMetadata) as unknown as z.ZodType<NewPlanMetadataRow>;
export const insertPlanUpgradeRuleSchema = createInsertSchema(planUpgradeRules) as unknown as z.ZodType<NewPlanUpgradeRule>;
export const insertPlanAuditLogSchema = createInsertSchema(planAuditLogs) as unknown as z.ZodType<NewPlanAuditLog>;
export const insertReferralSchema = createInsertSchema(referrals) as unknown as z.ZodType<NewReferral>;
export const insertCoinEventSchema = createInsertSchema(coinEvents) as unknown as z.ZodType<NewCoinEvent>;
