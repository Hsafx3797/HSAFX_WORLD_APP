import { pgTable, uuid, text, boolean, timestamp, jsonb, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

/**
 * Users Table - Central identity table
 * Reference: 13_DATABASE_SCHEMA.md Section 4.1
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  username: text('username'),
  passwordHash: text('password_hash'),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  phoneNumber: text('phone_number'),
  isActive: boolean('is_active').notNull().default(true),
  isEmailVerified: boolean('is_email_verified').notNull().default(false),
  twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
  referralCode: text('referral_code').unique(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at'),
}, (t) => [
  uniqueIndex('users_email_idx').on(t.email),
  uniqueIndex('users_username_idx').on(t.username),
]);

/**
 * User Preferences - UI/UX settings
 * Reference: 13_DATABASE_SCHEMA.md Section 4.2
 */
export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  theme: text('theme').notNull().default('system'),
  language: text('language').notNull().default('en'),
  timezone: text('timezone').notNull().default('UTC'),
  preferences: jsonb('preferences').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

/**
 * User Settings - Communication preferences
 * Reference: 13_DATABASE_SCHEMA.md Section 4.2
 */
export const userSettings = pgTable('user_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  emailNotifications: boolean('email_notifications').notNull().default(true),
  pushNotifications: boolean('push_notifications').notNull().default(false),
  marketingEmails: boolean('marketing_emails').notNull().default(false),
  settings: jsonb('settings').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

// Types inferred from tables using InferSelectModel and InferInsertModel
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type UserPreferences = InferSelectModel<typeof userPreferences>;
export type NewUserPreferences = InferInsertModel<typeof userPreferences>;
export type UserSettings = InferSelectModel<typeof userSettings>;
export type NewUserSettings = InferInsertModel<typeof userSettings>;

// Zod schemas for validation - simplified to avoid drizzle-zod compatibility issues
const baseInsertUserSchema = createInsertSchema(users);
const baseSelectUserSchema = createSelectSchema(users);
const baseInsertUserPreferencesSchema = createInsertSchema(userPreferences);
const baseInsertUserSettingsSchema = createInsertSchema(userSettings);

// Export schemas - use 'as unknown as' for drizzle-zod compatibility
export const insertUserSchema = baseInsertUserSchema as unknown as z.ZodType<NewUser>;
export const selectUserSchema = baseSelectUserSchema as unknown as z.ZodType<User>;
export const insertUserPreferencesSchema = baseInsertUserPreferencesSchema as unknown as z.ZodType<NewUserPreferences>;
export const insertUserSettingsSchema = baseInsertUserSettingsSchema as unknown as z.ZodType<NewUserSettings>;
