import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  jsonb,
  decimal,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel, sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './users';

// ─── Enums ────────────────────────────────────────────────────

export const identifierTypeEnum = pgEnum('identifier_type', [
  'ip_hash', 'fingerprint',
]);

/**
 * Tool Categories - Hierarchical organization of tools
 * Reference: 13_DATABASE_SCHEMA.md Section 4.8, 30_TOOLS_CATALOG.md
 */
export const toolCategories = pgTable('tool_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  parentId: uuid('parent_id'), // Self-referential handled via relation, not direct FK
  icon: text('icon'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Tools - Tool definitions and metadata
 * Reference: 13_DATABASE_SCHEMA.md Section 4.8, 40_TOOL_METADATA_STANDARD.md
 */
export const tools = pgTable('tools', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => toolCategories.id),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  longDescription: text('long_description'),
  toolGroup: integer('tool_group').notNull(), // 1-5 per 30_TOOLS_CATALOG.md
  toolClass: varchar('tool_class', { length: 50 }), // Derived class for billing rules
  runtime: text('runtime').notNull(), // 'wasm', 'node', 'python', 'browser'
  executionMode: text('execution_mode').notNull(), // 'client', 'server', 'hybrid'
  coinCost: integer('coin_cost').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  isPremium: boolean('is_premium').notNull().default(false),
  tags: text('tags').array().default([]),
  icon: text('icon'),
  sortOrder: integer('sort_order').notNull().default(0),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
}, (t) => [
  index('tools_category_id_idx').on(t.categoryId),
  index('tools_tool_group_idx').on(t.toolGroup),
  index('tools_is_active_idx').on(t.isActive),
  // Full-text search GIN index on name + description + tags
  index('tools_search_gin_idx').using(
    'gin',
    sql`to_tsvector('english', coalesce(${t.name}, '') || ' ' || coalesce(${t.description}, '') || ' ' || coalesce(array_to_string(${t.tags}, ' '), ''))`,
  ),
]);

/**
 * Tool Limits - Usage limits per tool
 * Reference: 13_DATABASE_SCHEMA.md Section 4.8
 */
export const toolLimits = pgTable('tool_limits', {
  id: uuid('id').primaryKey().defaultRandom(),
  toolId: uuid('tool_id')
    .notNull()
    .references(() => tools.id, { onDelete: 'cascade' }),
  limitKey: text('limit_key').notNull(), // 'max_file_size', 'max_duration', etc.
  limitValue: integer('limit_value').notNull(),
  unit: text('unit'), // 'MB', 'seconds', 'characters'
  description: text('description'),
});

/**
 * Tool Versions - Version history for tool implementations
 * Reference: 13_DATABASE_SCHEMA.md Section 4.8
 */
export const toolVersions = pgTable('tool_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  toolId: uuid('tool_id')
    .notNull()
    .references(() => tools.id, { onDelete: 'cascade' }),
  version: text('version').notNull(), // Semantic version e.g., '1.2.3'
  changelog: text('changelog'),
  isActive: boolean('is_active').notNull().default(false),
  wasmUrl: text('wasm_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * Usage Counters - Real-time usage tracking
 * Reference: 13_DATABASE_SCHEMA.md Section 4.9, 21_BILLING_LOGIC.md Section 6
 */
export const usageCounters = pgTable('usage_counters', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  resourceType: text('resource_type').notNull(), // 'tool', 'api', 'storage'
  resourceId: uuid('resource_id'), // Tool ID or other resource ID
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  count: integer('count').notNull().default(0),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  uniqueIndex('uc_user_resource_period_idx').on(t.userId, t.resourceType, t.periodStart),
]);

/**
 * Tool Executions - Audit log for tool usage
 * Reference: 13_DATABASE_SCHEMA.md Section 4.9
 */
export const toolExecutions = pgTable('tool_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  toolId: uuid('tool_id')
    .notNull()
    .references(() => tools.id),
  status: text('status').notNull(), // 'pending', 'running', 'succeeded', 'failed'
  coinCost: integer('coin_cost').notNull().default(0),
  executionTime: integer('execution_time'), // Milliseconds
  inputSize: integer('input_size'), // Bytes
  outputSize: integer('output_size'), // Bytes
  errorMessage: text('error_message'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
}, (t) => [
  index('te_user_id_idx').on(t.userId),
  index('te_tool_id_idx').on(t.toolId),
  index('te_created_at_idx').on(t.createdAt),
]);

/**
 * API Keys - User-generated API keys for programmatic access
 * Reference: 13_DATABASE_SCHEMA.md Section 4.10, 25_API_AUTHENTICATION_GUIDE.md
 */
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull().unique(),
  keyPrefix: text('key_prefix').notNull(), // First 8 chars for UI display
  scopes: text('scopes').array().default([]), // Allowed tool slugs or '*' for all
  lastUsed: timestamp('last_used'),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').notNull().default(true),
  rateLimitTier: text('rate_limit_tier').notNull().default('standard'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  revokedAt: timestamp('revoked_at'),
}, (t) => [
  index('ak_user_id_idx').on(t.userId),
  index('ak_is_active_idx').on(t.isActive),
  index('ak_user_active_idx').on(t.userId, t.isActive),
]);

/**
 * Anonymous Usage - Track guest/unauthenticated tool usage
 * Reference: SOLUTION_ROADMAP Task 2.1
 */
export const anonymousUsage = pgTable('anonymous_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  fingerprint: varchar('fingerprint', { length: 64 }).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }).notNull(),
  toolId: uuid('tool_id')
    .notNull()
    .references(() => tools.id),
  usedAt: timestamp('used_at').notNull().defaultNow(),
}, (t) => [
  index('au_fingerprint_tool_idx').on(t.fingerprint, t.toolId, t.usedAt),
  index('au_ip_tool_idx').on(t.ipAddress, t.toolId, t.usedAt),
]);

/**
 * API Rate Limits - Per-key configurable rate limits
 * Reference: SOLUTION_ROADMAP Task 2.1, 25_API_AUTHENTICATION_GUIDE.md
 */
export const apiRateLimits = pgTable('api_rate_limits', {
  id: uuid('id').primaryKey().defaultRandom(),
  apiKeyId: uuid('api_key_id')
    .notNull()
    .references(() => apiKeys.id, { onDelete: 'cascade' }),
  requestsPerHour: integer('requests_per_hour').notNull(),
  requestsPerDay: integer('requests_per_day').notNull(),
  burstPerMinute: integer('burst_per_minute').notNull(),
});

/**
 * Daily Pro Trials - Track free users' daily pro tool trial usage
 * Reference: IMPLEMENTATION_ROADMAP T2.6 "Try Before You Buy"
 *
 * Free users get 1 free Pro tool trial per day. Unique constraint ensures
 * each (user, tool, date) combination can only exist once.
 */
export const dailyProTrials = pgTable('daily_pro_trials', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  toolId: text('tool_id').notNull(),
  trialDate: text('trial_date').notNull(), // YYYY-MM-DD
  usedAt: timestamp('used_at').notNull().defaultNow(),
}, (t) => [
  index('dpt_user_date_idx').on(t.userId, t.trialDate),
  uniqueIndex('dpt_user_tool_date_idx').on(t.userId, t.toolId, t.trialDate),
]);

/**
 * Tool Class Policy - Billing behavior and execution requirements per tool class
 * Reference: 13_DATABASE_SCHEMA.dbml Section "tool_class_policy"
 *
 * Primary key is tool_class (varchar) — one policy row per tool class.
 * Determines BA weight multiplier and sync/async execution mode.
 */
export const toolClassPolicy = pgTable('tool_class_policy', {
  toolClass: varchar('tool_class', { length: 100 }).primaryKey(),
  baWeight: decimal('ba_weight', { precision: 5, scale: 2 }).notNull().default('1.0'),
  executionMode: varchar('execution_mode', { length: 20 }).notNull().default('sync'),
  asyncRequired: boolean('async_required').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Types inferred from tables using InferSelectModel and InferInsertModel for better compatibility
export type ToolCategory = InferSelectModel<typeof toolCategories>;
export type NewToolCategory = InferInsertModel<typeof toolCategories>;
export type Tool = InferSelectModel<typeof tools>;
export type NewTool = InferInsertModel<typeof tools>;
export type ToolLimit = InferSelectModel<typeof toolLimits>;
export type NewToolLimit = InferInsertModel<typeof toolLimits>;
export type ToolVersion = InferSelectModel<typeof toolVersions>;
export type NewToolVersion = InferInsertModel<typeof toolVersions>;
export type UsageCounter = InferSelectModel<typeof usageCounters>;
export type NewUsageCounter = InferInsertModel<typeof usageCounters>;
export type ToolExecution = InferSelectModel<typeof toolExecutions>;
export type NewToolExecution = InferInsertModel<typeof toolExecutions>;
export type ApiKey = InferSelectModel<typeof apiKeys>;
export type NewApiKey = InferInsertModel<typeof apiKeys>;
export type AnonymousUsage = InferSelectModel<typeof anonymousUsage>;
export type NewAnonymousUsage = InferInsertModel<typeof anonymousUsage>;
export type ApiRateLimit = InferSelectModel<typeof apiRateLimits>;
export type NewApiRateLimit = InferInsertModel<typeof apiRateLimits>;
export type DailyProTrial = InferSelectModel<typeof dailyProTrials>;
export type NewDailyProTrial = InferInsertModel<typeof dailyProTrials>;
export type ToolClassPolicyRow = InferSelectModel<typeof toolClassPolicy>;
export type NewToolClassPolicyRow = InferInsertModel<typeof toolClassPolicy>;

// Zod schemas - use 'as unknown as' for drizzle-zod compatibility
export const insertToolCategorySchema = createInsertSchema(toolCategories) as unknown as z.ZodType<NewToolCategory>;
export const insertToolSchema = createInsertSchema(tools) as unknown as z.ZodType<NewTool>;
export const insertToolLimitSchema = createInsertSchema(toolLimits) as unknown as z.ZodType<NewToolLimit>;
export const insertToolVersionSchema = createInsertSchema(toolVersions) as unknown as z.ZodType<NewToolVersion>;
export const insertUsageCounterSchema = createInsertSchema(usageCounters) as unknown as z.ZodType<NewUsageCounter>;
export const insertToolExecutionSchema = createInsertSchema(toolExecutions) as unknown as z.ZodType<NewToolExecution>;
export const insertApiKeySchema = createInsertSchema(apiKeys) as unknown as z.ZodType<NewApiKey>;
export const insertAnonymousUsageSchema = createInsertSchema(anonymousUsage) as unknown as z.ZodType<NewAnonymousUsage>;
export const insertApiRateLimitSchema = createInsertSchema(apiRateLimits) as unknown as z.ZodType<NewApiRateLimit>;
export const insertToolClassPolicySchema = createInsertSchema(toolClassPolicy) as unknown as z.ZodType<NewToolClassPolicyRow>;
export const insertDailyProTrialSchema = createInsertSchema(dailyProTrials) as unknown as z.ZodType<NewDailyProTrial>;
