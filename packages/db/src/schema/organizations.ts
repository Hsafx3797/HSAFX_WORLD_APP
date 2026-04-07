import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { users } from './users';

// ─── Organization Enums ──────────────────────────────────────

export const orgMemberRoleEnum = pgEnum('org_member_role', [
  'owner', 'admin', 'member', 'viewer',
]);

// ─── Organizations ───────────────────────────────────────────

/**
 * Organizations — team-based entity for shared B2B billing.
 * Multiple users share a subscription, usage quotas, and API keys.
 */
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  avatarUrl: text('avatar_url'),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  uniqueIndex('organizations_slug_idx').on(t.slug),
  index('organizations_created_by_idx').on(t.createdBy),
]);

// ─── Organization Members ────────────────────────────────────

/**
 * Organization Members — maps users to organizations with roles.
 * A user can belong to multiple organizations.
 */
export const organizationMembers = pgTable('organization_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: orgMemberRoleEnum('role').notNull().default('member'),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
}, (t) => [
  uniqueIndex('org_members_org_user_idx').on(t.organizationId, t.userId),
  index('org_members_user_idx').on(t.userId),
]);

// ─── Organization API Keys ──────────────────────────────────

/**
 * Organization API Keys — shared API keys scoped to an organization.
 * Separate from user-level apiKeys in tools.ts.
 */
export const organizationApiKeys = pgTable('organization_api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull(),
  keyPrefix: text('key_prefix').notNull(),
  scopes: text('scopes').array().notNull().default([]),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  rotatedAt: timestamp('rotated_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('org_api_keys_org_idx').on(t.organizationId),
  index('org_api_keys_prefix_idx').on(t.keyPrefix),
]);

// ─── Types ───────────────────────────────────────────────────

export type Organization = InferSelectModel<typeof organizations>;
export type NewOrganization = InferInsertModel<typeof organizations>;
export type OrganizationMember = InferSelectModel<typeof organizationMembers>;
export type NewOrganizationMember = InferInsertModel<typeof organizationMembers>;
export type OrganizationApiKey = InferSelectModel<typeof organizationApiKeys>;
export type NewOrganizationApiKey = InferInsertModel<typeof organizationApiKeys>;
