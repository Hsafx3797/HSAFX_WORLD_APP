import { pgTable, uuid, text, varchar, timestamp, boolean, integer, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './users';

/**
 * Sessions Table - User authentication sessions
 * Reference: 13_DATABASE_SCHEMA.md Section 4.3
 */
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  sessionToken: text('session_token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('sess_user_id_idx').on(t.userId),
  index('sess_expires_idx').on(t.expiresAt),
]);

/**
 * OAuth Connections - External provider links
 * Reference: 13_DATABASE_SCHEMA.md Section 4.3
 */
export const oauthConnections = pgTable('oauth_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(), // 'google', 'github', 'facebook'
  providerUserId: text('provider_user_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  uniqueIndex('oauth_user_provider_idx').on(t.userId, t.provider),
  uniqueIndex('oauth_provider_uid_idx').on(t.provider, t.providerUserId),
]);

/**
 * Roles Table - RBAC role definitions
 * Reference: 13_DATABASE_SCHEMA.md Section 4.4
 */
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(), // 'admin', 'moderator', 'user', 'guest'
  description: text('description'),
  roleType: varchar('role_type', { length: 20 }).notNull().default('custom'), // 'system' | 'custom'
  isDefault: boolean('is_default').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

/**
 * User Roles - M:N relationship between users and roles
 * Reference: 13_DATABASE_SCHEMA.md Section 4.4
 */
export const userRoles = pgTable('user_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at').notNull().defaultNow(),
}, (t) => [
  uniqueIndex('ur_user_role_idx').on(t.userId, t.roleId),
]);

/**
 * Permissions Table - Granular permission definitions
 * Reference: 13_DATABASE_SCHEMA.md Section 4.4
 */
export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(), // 'tools.create', 'billing.view', etc.
  description: text('description'),
  category: text('category').notNull(), // 'tools', 'billing', 'admin', etc.
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * Role Permissions - M:N relationship between roles and permissions
 * Reference: 13_DATABASE_SCHEMA.md Section 4.4
 */
export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  roleId: uuid('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id')
    .notNull()
    .references(() => permissions.id, { onDelete: 'cascade' }),
  grantedAt: timestamp('granted_at').notNull().defaultNow(),
}, (t) => [
  uniqueIndex('rp_role_perm_idx').on(t.roleId, t.permissionId),
]);

/**
 * Activity Logs - Audit trail
 * Reference: 13_DATABASE_SCHEMA.md Section 4.6
 */
export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(), // 'login', 'tool_execute', 'subscription_change'
  resource: text('resource'), // Resource type affected
  resourceId: uuid('resource_id'), // ID of affected resource
  metadata: text('metadata').$type<Record<string, unknown>>(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('al_user_id_idx').on(t.userId),
  index('al_action_idx').on(t.action),
  index('al_created_at_idx').on(t.createdAt),
]);

/**
 * Password Reset Tokens - Time-limited tokens for password recovery
 * Reference: 13_DATABASE_SCHEMA.md Section 4.3, SOLUTION_ROADMAP Task 2.1
 */
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * Email Verification Tokens - Tokens for confirming email ownership
 * Reference: 13_DATABASE_SCHEMA.md Section 4.3, SOLUTION_ROADMAP Task 2.1
 */
export const emailVerificationTokens = pgTable('email_verification_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * Refresh Tokens - JWT token rotation for secure session renewal
 * Reference: 13_DATABASE_SCHEMA.md Section 4.3, SOLUTION_ROADMAP Task 2.1
 */
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  revokedAt: timestamp('revoked_at'),
  replacedBy: uuid('replaced_by'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * User Permission Overrides - Per-user permission grants/denials bypassing role defaults
 * Reference: 13_DATABASE_SCHEMA.md Section 4.14, SOLUTION_ROADMAP Sprint 3.1
 */
export const userPermissionOverrides = pgTable('user_permission_overrides', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id')
    .notNull()
    .references(() => permissions.id, { onDelete: 'cascade' }),
  granted: boolean('granted').notNull(), // true = explicitly grant, false = explicitly deny
  reason: text('reason'),
  grantedBy: uuid('granted_by').references(() => users.id, { onDelete: 'set null' }),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Types inferred from tables using InferSelectModel and InferInsertModel
export type Session = InferSelectModel<typeof sessions>;
export type NewSession = InferInsertModel<typeof sessions>;
export type OauthConnection = InferSelectModel<typeof oauthConnections>;
export type NewOauthConnection = InferInsertModel<typeof oauthConnections>;
export type Role = InferSelectModel<typeof roles>;
export type NewRole = InferInsertModel<typeof roles>;
export type Permission = InferSelectModel<typeof permissions>;
export type NewPermission = InferInsertModel<typeof permissions>;
export type ActivityLog = InferSelectModel<typeof activityLogs>;
export type NewActivityLog = InferInsertModel<typeof activityLogs>;
export type PasswordResetToken = InferSelectModel<typeof passwordResetTokens>;
export type NewPasswordResetToken = InferInsertModel<typeof passwordResetTokens>;
export type EmailVerificationToken = InferSelectModel<typeof emailVerificationTokens>;
export type NewEmailVerificationToken = InferInsertModel<typeof emailVerificationTokens>;
export type RefreshToken = InferSelectModel<typeof refreshTokens>;
export type NewRefreshToken = InferInsertModel<typeof refreshTokens>;
export type UserPermissionOverride = InferSelectModel<typeof userPermissionOverrides>;
export type NewUserPermissionOverride = InferInsertModel<typeof userPermissionOverrides>;

// Zod schemas - use 'as unknown as' for drizzle-zod compatibility
export const insertSessionSchema = createInsertSchema(sessions) as unknown as z.ZodType<NewSession>;
export const insertOauthConnectionSchema = createInsertSchema(oauthConnections) as unknown as z.ZodType<NewOauthConnection>;
export const insertRoleSchema = createInsertSchema(roles) as unknown as z.ZodType<NewRole>;
export const insertPermissionSchema = createInsertSchema(permissions) as unknown as z.ZodType<NewPermission>;
export const insertActivityLogSchema = createInsertSchema(activityLogs) as unknown as z.ZodType<NewActivityLog>;
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens) as unknown as z.ZodType<NewPasswordResetToken>;
export const insertEmailVerificationTokenSchema = createInsertSchema(emailVerificationTokens) as unknown as z.ZodType<NewEmailVerificationToken>;
export const insertRefreshTokenSchema = createInsertSchema(refreshTokens) as unknown as z.ZodType<NewRefreshToken>;
export const insertUserPermissionOverrideSchema = createInsertSchema(userPermissionOverrides) as unknown as z.ZodType<NewUserPermissionOverride>;
