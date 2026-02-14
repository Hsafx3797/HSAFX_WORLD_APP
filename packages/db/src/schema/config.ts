import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './users';

// ─── Streak Tiers ─────────────────────────────────────────────
// Configurable streak reward tiers — coins awarded at each milestone.

export const streakTiers = pgTable('streak_tiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  minDays: integer('min_days').notNull(),
  maxDays: integer('max_days'),
  name: varchar('name', { length: 100 }).notNull(),
  coinsReward: integer('coins_reward').notNull(),
  badgeIcon: text('badge_icon'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('st_min_days_idx').on(t.minDays),
  index('st_active_sort_idx').on(t.isActive, t.sortOrder),
]);

// ─── Referral Config ──────────────────────────────────────────
// Admin-configurable referral reward amounts and rules.

export const referralConfig = pgTable('referral_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: integer('value').notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Rate Limit Config ────────────────────────────────────────
// Per-plan rate limit thresholds stored in DB.

export const rateLimitConfig = pgTable('rate_limit_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  planSlug: varchar('plan_slug', { length: 50 }).notNull(),
  endpoint: varchar('endpoint', { length: 100 }).notNull().default('global'),
  requestsPerMinute: integer('requests_per_minute').notNull(),
  requestsPerHour: integer('requests_per_hour'),
  requestsPerDay: integer('requests_per_day'),
  burstLimit: integer('burst_limit'),
  isActive: boolean('is_active').notNull().default(true),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  uniqueIndex('rlc_plan_endpoint_idx').on(t.planSlug, t.endpoint),
]);

// ─── Notification Templates ───────────────────────────────────
// In-app notification templates (separate from email templates).

export const notificationTemplates = pgTable('notification_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: text('name').notNull(),
  type: varchar('type', { length: 20 }).notNull().default('info'),
  titleTemplate: text('title_template').notNull(),
  messageTemplate: text('message_template').notNull(),
  variables: text('variables').array().default([]),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Types
export type StreakTier = InferSelectModel<typeof streakTiers>;
export type NewStreakTier = InferInsertModel<typeof streakTiers>;
export type ReferralConfig = InferSelectModel<typeof referralConfig>;
export type NewReferralConfig = InferInsertModel<typeof referralConfig>;
export type RateLimitConfig = InferSelectModel<typeof rateLimitConfig>;
export type NewRateLimitConfig = InferInsertModel<typeof rateLimitConfig>;
export type NotificationTemplate = InferSelectModel<typeof notificationTemplates>;
export type NewNotificationTemplate = InferInsertModel<typeof notificationTemplates>;

// Zod schemas
export const insertStreakTierSchema = createInsertSchema(streakTiers) as unknown as z.ZodType<NewStreakTier>;
export const insertReferralConfigSchema = createInsertSchema(referralConfig) as unknown as z.ZodType<NewReferralConfig>;
export const insertRateLimitConfigSchema = createInsertSchema(rateLimitConfig) as unknown as z.ZodType<NewRateLimitConfig>;
export const insertNotificationTemplateSchema = createInsertSchema(notificationTemplates) as unknown as z.ZodType<NewNotificationTemplate>;
