import { pgTable, uuid, text, varchar, timestamp, integer, boolean, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './users';

/**
 * File Uploads - Temporary file storage tracking
 * Reference: 13_DATABASE_SCHEMA.md Section 4.11, 70_FILE_PROCESSING_FLOW.md
 */
export const fileUploads = pgTable('file_uploads', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSize: integer('file_size').notNull(), // Bytes
  storageKey: text('storage_key').notNull().unique(), // R2 object key
  storageUrl: text('storage_url').notNull(),
  status: text('status').notNull().default('pending'), // 'pending', 'uploaded', 'processing', 'completed', 'failed'
  expiresAt: timestamp('expires_at').notNull(), // Auto-delete after TTL
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

/**
 * Async Jobs - Background job tracking
 * Reference: 13_DATABASE_SCHEMA.md Section 4.12, 71_ASYNC_JOB_SPEC.md
 */
export const asyncJobs = pgTable('async_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  jobType: text('job_type').notNull(), // 'media_process', 'bulk_convert', 'scrape', etc.
  status: text('status').notNull().default('pending'), // 'pending', 'running', 'succeeded', 'failed', 'canceled'
  progress: integer('progress').notNull().default(0), // 0-100%
  result: jsonb('result').$type<Record<string, unknown>>(),
  errorMessage: text('error_message'),
  externalJobId: text('external_job_id'), // Simple queue job reference
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
}, (t) => [
  index('aj_user_id_idx').on(t.userId),
  index('aj_status_idx').on(t.status),
]);

/**
 * Notifications - User notification queue
 * Reference: 13_DATABASE_SCHEMA.md Section 4.13
 */
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'info', 'success', 'warning', 'error'
  title: text('title').notNull(),
  message: text('message').notNull(),
  actionUrl: text('action_url'),
  isRead: boolean('is_read').notNull().default(false),
  readAt: timestamp('read_at'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at'),
}, (t) => [
  index('notif_user_id_idx').on(t.userId),
  index('notif_is_read_idx').on(t.userId, t.isRead),
]);

/**
 * Favorites - User bookmarked tools
 * Reference: 13_DATABASE_SCHEMA.md Section 4.14
 */
export const favorites = pgTable('favorites', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  resourceType: text('resource_type').notNull(), // 'tool', 'category'
  resourceId: uuid('resource_id').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  uniqueIndex('fav_user_resource_idx').on(t.userId, t.resourceType, t.resourceId),
]);

/**
 * Feature Flags - Dynamic feature toggling & kill switches
 * Reference: 13_DATABASE_SCHEMA.md Section 4.15, 03_FEATURE_FLAGS.md, SOLUTION_ROADMAP Sprint 5.4
 */
export const featureFlags = pgTable('feature_flags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  description: text('description'),
  flagType: text('flag_type').notNull().default('toggle'), // 'toggle', 'kill_switch', 'experiment', 'rollout'
  isEnabled: boolean('is_enabled').notNull().default(false),
  rolloutPercentage: integer('rollout_percentage').notNull().default(0), // 0-100
  targetUsers: text('target_users').array().default([]), // Specific user IDs
  targetRoles: text('target_roles').array().default([]), // Specific roles
  killSwitchActivatedAt: timestamp('kill_switch_activated_at'), // When kill switch was triggered
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Email Provider Config - Email service provider settings
 * Reference: 13_DATABASE_SCHEMA.md Section 14, SOLUTION_ROADMAP Task 2.5
 */
export const emailProviderConfig = pgTable('email_provider_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  provider: varchar('provider', { length: 50 }).notNull().unique(), // 'resend', 'smtp'
  apiKey: text('api_key'), // Encrypted
  smtpHost: text('smtp_host'),
  smtpPort: integer('smtp_port'),
  smtpUser: text('smtp_user'),
  smtpPassword: text('smtp_password'), // Encrypted
  fromEmail: text('from_email').notNull(),
  fromName: text('from_name').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Email Templates - Reusable email template storage
 * Reference: 13_DATABASE_SCHEMA.md Section 14, SOLUTION_ROADMAP Task 2.5
 */
export const emailTemplates = pgTable('email_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 100 }).notNull().unique(), // 'welcome', 'password-reset', 'email-verification', 'invoice-receipt', 'usage-alert'
  name: text('name').notNull(),
  subject: text('subject').notNull(),
  htmlBody: text('html_body').notNull(),
  textBody: text('text_body'),
  variables: text('variables').array().default([]), // Template variable names: ['userName', 'resetLink', ...]
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Email Logs - Delivery tracking for sent emails
 * Reference: 13_DATABASE_SCHEMA.md Section 14, SOLUTION_ROADMAP Task 2.5
 */
export const emailLogs = pgTable('email_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  templateId: uuid('template_id').references(() => emailTemplates.id, { onDelete: 'set null' }),
  toEmail: text('to_email').notNull(),
  subject: text('subject').notNull(),
  status: text('status').notNull(), // 'queued', 'sent', 'delivered', 'bounced', 'failed'
  provider: varchar('provider', { length: 50 }).notNull(), // 'resend', 'smtp'
  providerMessageId: text('provider_message_id'), // ID from the email provider
  errorMessage: text('error_message'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  sentAt: timestamp('sent_at'),
  deliveredAt: timestamp('delivered_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('el_user_id_idx').on(t.userId),
  index('el_status_idx').on(t.status),
]);

/**
 * Admin Settings - Key-value configuration store for admin panel
 * Reference: 13_DATABASE_SCHEMA.md Section 4.15, SOLUTION_ROADMAP Sprint 3.1
 */
export const adminSettings = pgTable('admin_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  value: jsonb('value').$type<unknown>().notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }), // 'general', 'billing', 'tools', 'security', etc.
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Types inferred from tables using InferSelectModel and InferInsertModel
export type FileUpload = InferSelectModel<typeof fileUploads>;
export type NewFileUpload = InferInsertModel<typeof fileUploads>;
export type AsyncJob = InferSelectModel<typeof asyncJobs>;
export type NewAsyncJob = InferInsertModel<typeof asyncJobs>;
export type Notification = InferSelectModel<typeof notifications>;
export type NewNotification = InferInsertModel<typeof notifications>;
export type Favorite = InferSelectModel<typeof favorites>;
export type NewFavorite = InferInsertModel<typeof favorites>;
export type FeatureFlag = InferSelectModel<typeof featureFlags>;
export type NewFeatureFlag = InferInsertModel<typeof featureFlags>;
export type EmailProviderConfig = InferSelectModel<typeof emailProviderConfig>;
export type NewEmailProviderConfig = InferInsertModel<typeof emailProviderConfig>;
export type EmailTemplate = InferSelectModel<typeof emailTemplates>;
export type NewEmailTemplate = InferInsertModel<typeof emailTemplates>;
export type EmailLog = InferSelectModel<typeof emailLogs>;
export type NewEmailLog = InferInsertModel<typeof emailLogs>;
export type AdminSetting = InferSelectModel<typeof adminSettings>;
export type NewAdminSetting = InferInsertModel<typeof adminSettings>;

// Zod schemas - use 'as unknown as' for drizzle-zod compatibility
export const insertFileUploadSchema = createInsertSchema(fileUploads) as unknown as z.ZodType<NewFileUpload>;
export const insertAsyncJobSchema = createInsertSchema(asyncJobs) as unknown as z.ZodType<NewAsyncJob>;
export const insertNotificationSchema = createInsertSchema(notifications) as unknown as z.ZodType<NewNotification>;
export const insertFavoriteSchema = createInsertSchema(favorites) as unknown as z.ZodType<NewFavorite>;
export const insertFeatureFlagSchema = createInsertSchema(featureFlags) as unknown as z.ZodType<NewFeatureFlag>;
export const insertEmailProviderConfigSchema = createInsertSchema(emailProviderConfig) as unknown as z.ZodType<NewEmailProviderConfig>;
export const insertEmailTemplateSchema = createInsertSchema(emailTemplates) as unknown as z.ZodType<NewEmailTemplate>;
export const insertEmailLogSchema = createInsertSchema(emailLogs) as unknown as z.ZodType<NewEmailLog>;
export const insertAdminSettingSchema = createInsertSchema(adminSettings) as unknown as z.ZodType<NewAdminSetting>;
