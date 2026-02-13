import { pgTable, pgEnum, serial, uuid, text, varchar, timestamp, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './users';
import { tools } from './tools';

// ─── Enums ────────────────────────────────────────────────────

export const auditActionEnum = pgEnum('audit_action', [
  'create', 'update', 'delete', 'grant', 'revoke', 'login', 'logout', 'payment', 'refund',
]);

export const permissionTargetEnum = pgEnum('permission_target', [
  'role_permission', 'user_override', 'plan_feature',
]);

/**
 * API Request Logs - High-volume append-only request audit trail
 * Reference: 13_DATABASE_SCHEMA.md Section 4.12, SOLUTION_ROADMAP Sprint 3.1
 *
 * Uses serial PK for efficient inserts on high-volume tables.
 */
export const apiRequestLogs = pgTable('api_request_logs', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  toolId: uuid('tool_id').references(() => tools.id, { onDelete: 'set null' }),
  method: varchar('method', { length: 10 }).notNull(), // GET, POST, etc.
  path: text('path').notNull(),
  statusCode: integer('status_code').notNull(),
  durationMs: integer('duration_ms'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  requestBody: jsonb('request_body').$type<Record<string, unknown>>(),
  responseBody: jsonb('response_body').$type<Record<string, unknown>>(),
  errorMessage: text('error_message'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('arl_user_id_idx').on(t.userId),
  index('arl_tool_id_idx').on(t.toolId),
  index('arl_created_at_idx').on(t.createdAt),
]);

/**
 * Permission Audit Logs - Tracks permission changes for compliance
 * Reference: 13_DATABASE_SCHEMA.md Section 4.13, SOLUTION_ROADMAP Sprint 3.1
 *
 * Uses serial PK for efficient inserts on high-volume tables.
 */
export const permissionAuditLogs = pgTable('permission_audit_logs', {
  id: serial('id').primaryKey(),
  actorId: uuid('actor_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  targetUserId: uuid('target_user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 50 }).notNull(), // 'grant', 'revoke', 'override', 'role_assign', 'role_remove'
  resourceType: varchar('resource_type', { length: 50 }).notNull(), // 'permission', 'role', 'override'
  resourceId: text('resource_id').notNull(), // ID of the permission/role affected
  previousValue: jsonb('previous_value').$type<Record<string, unknown>>(),
  newValue: jsonb('new_value').$type<Record<string, unknown>>(),
  reason: text('reason'),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('pal_actor_id_idx').on(t.actorId),
  index('pal_created_at_idx').on(t.createdAt),
]);

/**
 * Audit Logs - System-wide audit trail for sensitive operations
 * Reference: 13_DATABASE_SCHEMA.dbml Section "audit_logs"
 *
 * Used for impersonation, role changes, plan changes, etc.
 * The impersonation route already writes to this table via raw SQL.
 */
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  targetUserId: uuid('target_user_id').references(() => users.id, { onDelete: 'set null' }),
  action: auditActionEnum('action').notNull(),
  actionDetail: text('action_detail'),
  resource: text('resource'), // 'user', 'plan', 'tool', 'subscription', etc.
  resourceId: uuid('resource_id'),
  changes: jsonb('changes').$type<Record<string, unknown>>(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('al_user_id_idx').on(t.userId),
  index('al_created_at_idx').on(t.createdAt),
]);

// Types inferred from tables using InferSelectModel and InferInsertModel
export type ApiRequestLog = InferSelectModel<typeof apiRequestLogs>;
export type NewApiRequestLog = InferInsertModel<typeof apiRequestLogs>;
export type PermissionAuditLog = InferSelectModel<typeof permissionAuditLogs>;
export type NewPermissionAuditLog = InferInsertModel<typeof permissionAuditLogs>;
export type AuditLog = InferSelectModel<typeof auditLogs>;
export type NewAuditLog = InferInsertModel<typeof auditLogs>;

// Zod schemas - use 'as unknown as' for drizzle-zod compatibility
export const insertApiRequestLogSchema = createInsertSchema(apiRequestLogs) as unknown as z.ZodType<NewApiRequestLog>;
export const insertPermissionAuditLogSchema = createInsertSchema(permissionAuditLogs) as unknown as z.ZodType<NewPermissionAuditLog>;
export const insertAuditLogSchema = createInsertSchema(auditLogs) as unknown as z.ZodType<NewAuditLog>;
