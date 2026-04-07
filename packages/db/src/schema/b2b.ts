import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  bigint,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel, sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './users';
import { tools } from './tools';
import { billingIntervalEnum } from './billing';

// ─── B2B Enums ────────────────────────────────────────────────

export const b2bSubscriptionStatusEnum = pgEnum('b2b_subscription_status', [
  'active', 'canceled', 'past_due', 'suspended',
]);

// ─── B2B Plans ────────────────────────────────────────────────

/**
 * B2B Plans — subscription tier definitions for API customers.
 * Separate from B2C plans (which use coin grants).
 * B2B plans define per-suite ops quotas via b2bPlanQuotas.
 */
export const b2bPlans = pgTable('b2b_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  priceMonthlyCents: bigint('price_monthly_cents', { mode: 'number' }),
  priceYearlyCents: bigint('price_yearly_cents', { mode: 'number' }),
  isActive: boolean('is_active').notNull().default(true),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  index('b2b_plans_slug_idx').on(t.slug),
]);

// ─── B2B Subscriptions ───────────────────────────────────────

/**
 * B2B Subscriptions — one active subscription per user.
 * Tracks billing cycle, period boundaries, and reset day.
 * 1 user = 1 API key = 1 B2B subscription (no org model).
 */
export const b2bSubscriptions = pgTable('b2b_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  b2bPlanId: uuid('b2b_plan_id')
    .notNull()
    .references(() => b2bPlans.id, { onDelete: 'restrict' }),
  status: b2bSubscriptionStatusEnum('status').notNull(),
  billingCycle: billingIntervalEnum('billing_cycle').notNull(),
  currentPeriodStart: timestamp('current_period_start').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  resetDayOfMonth: integer('reset_day_of_month').notNull().default(1),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  canceledAt: timestamp('canceled_at'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  uniqueIndex('b2b_sub_user_active_idx')
    .on(t.userId)
    .where(sql`status = 'active'`),
  index('b2b_sub_user_id_idx').on(t.userId),
  index('b2b_sub_status_idx').on(t.status),
  index('b2b_sub_plan_id_idx').on(t.b2bPlanId),
  index('b2b_sub_period_end_idx').on(t.currentPeriodEnd),
  check('b2b_sub_reset_day_check', sql`reset_day_of_month >= 1 AND reset_day_of_month <= 28`),
]);

// ─── B2B Suites ──────────────────────────────────────────────

/**
 * B2B Suites — admin-managed groupings of tool categories.
 * Each suite has its own ops quota per plan tier.
 * Examples: "text", "data", "media", "generator", "calculator", "specific"
 */
export const b2bSuites = pgTable('b2b_suites', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  index('b2b_suites_is_active_idx').on(t.isActive),
]);

// ─── B2B Plan Quotas ─────────────────────────────────────────

/**
 * B2B Plan Quotas — per-suite monthly ops limit per plan tier.
 * E.g., Basic plan → text suite → 5,000 ops/month.
 */
export const b2bPlanQuotas = pgTable('b2b_plan_quotas', {
  id: uuid('id').primaryKey().defaultRandom(),
  b2bPlanId: uuid('b2b_plan_id')
    .notNull()
    .references(() => b2bPlans.id, { onDelete: 'cascade' }),
  b2bSuiteId: uuid('b2b_suite_id')
    .notNull()
    .references(() => b2bSuites.id, { onDelete: 'cascade' }),
  monthlyLimit: integer('monthly_limit').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  uniqueIndex('b2b_pq_plan_suite_idx').on(t.b2bPlanId, t.b2bSuiteId),
  check('b2b_pq_limit_positive', sql`monthly_limit > 0`),
]);

// ─── B2B Suite Categories ────────────────────────────────────

/**
 * B2B Suite Categories — maps API route category strings to suites.
 * E.g., category "text" → text suite, category "validate" → text suite.
 * One category belongs to exactly one suite.
 */
export const b2bSuiteCategories = pgTable('b2b_suite_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  b2bSuiteId: uuid('b2b_suite_id')
    .notNull()
    .references(() => b2bSuites.id, { onDelete: 'cascade' }),
  category: text('category').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('b2b_sc_suite_id_idx').on(t.b2bSuiteId),
]);

// ─── B2B Tool Suite Overrides ────────────────────────────────

/**
 * B2B Tool Suite Overrides — per-tool exception to the default category→suite mapping.
 * If a tool needs to be billed under a different suite than its category implies,
 * add a row here. One tool can only be overridden to one suite.
 */
export const b2bToolSuiteOverrides = pgTable('b2b_tool_suite_overrides', {
  id: uuid('id').primaryKey().defaultRandom(),
  toolId: uuid('tool_id')
    .notNull()
    .references(() => tools.id, { onDelete: 'cascade' }),
  b2bSuiteId: uuid('b2b_suite_id')
    .notNull()
    .references(() => b2bSuites.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  uniqueIndex('b2b_tso_tool_id_idx').on(t.toolId),
]);

// ─── B2B Usage ───────────────────────────────────────────────

/**
 * B2B Usage — ops counter per user per suite per billing period.
 * Only successful executions increment usageCount.
 * Atomic increment: UPDATE SET usage_count = usage_count + 1 WHERE usage_count < limit.
 */
export const b2bUsage = pgTable('b2b_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  b2bSuiteId: uuid('b2b_suite_id')
    .notNull()
    .references(() => b2bSuites.id, { onDelete: 'cascade' }),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  usageCount: integer('usage_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  uniqueIndex('b2b_usage_user_suite_period_idx').on(t.userId, t.b2bSuiteId, t.periodStart),
  index('b2b_usage_user_id_idx').on(t.userId),
  index('b2b_usage_period_idx').on(t.periodStart, t.periodEnd),
  check('b2b_usage_count_nonneg', sql`usage_count >= 0`),
]);

// ─── Types ───────────────────────────────────────────────────

export type B2bPlan = InferSelectModel<typeof b2bPlans>;
export type NewB2bPlan = InferInsertModel<typeof b2bPlans>;
export type B2bSubscription = InferSelectModel<typeof b2bSubscriptions>;
export type NewB2bSubscription = InferInsertModel<typeof b2bSubscriptions>;
export type B2bSuite = InferSelectModel<typeof b2bSuites>;
export type NewB2bSuite = InferInsertModel<typeof b2bSuites>;
export type B2bPlanQuota = InferSelectModel<typeof b2bPlanQuotas>;
export type NewB2bPlanQuota = InferInsertModel<typeof b2bPlanQuotas>;
export type B2bSuiteCategory = InferSelectModel<typeof b2bSuiteCategories>;
export type NewB2bSuiteCategory = InferInsertModel<typeof b2bSuiteCategories>;
export type B2bToolSuiteOverride = InferSelectModel<typeof b2bToolSuiteOverrides>;
export type NewB2bToolSuiteOverride = InferInsertModel<typeof b2bToolSuiteOverrides>;
export type B2bUsage = InferSelectModel<typeof b2bUsage>;
export type NewB2bUsage = InferInsertModel<typeof b2bUsage>;

// ─── Zod Schemas ─────────────────────────────────────────────

export const insertB2bPlanSchema = createInsertSchema(b2bPlans) as unknown as z.ZodType<NewB2bPlan>;
export const insertB2bSubscriptionSchema = createInsertSchema(b2bSubscriptions) as unknown as z.ZodType<NewB2bSubscription>;
export const insertB2bSuiteSchema = createInsertSchema(b2bSuites) as unknown as z.ZodType<NewB2bSuite>;
export const insertB2bPlanQuotaSchema = createInsertSchema(b2bPlanQuotas) as unknown as z.ZodType<NewB2bPlanQuota>;
export const insertB2bSuiteCategorySchema = createInsertSchema(b2bSuiteCategories) as unknown as z.ZodType<NewB2bSuiteCategory>;
export const insertB2bToolSuiteOverrideSchema = createInsertSchema(b2bToolSuiteOverrides) as unknown as z.ZodType<NewB2bToolSuiteOverride>;
export const insertB2bUsageSchema = createInsertSchema(b2bUsage) as unknown as z.ZodType<NewB2bUsage>;
