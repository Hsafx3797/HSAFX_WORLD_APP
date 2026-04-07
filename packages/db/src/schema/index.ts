// Re-export all schemas and types
//
// TODO [G2]: Add organization/team schema (new file: organizations.ts).
//   - Tables needed: organizations, organizationMembers, organizationApiKeys.
//   - Enables team-based B2B access with shared billing, usage, and api key scopes.
//   - See: docs/PLANNING/01_USER_ROLES_PERMISSIONS.md, docs/PLANNING/13_DATABASE_SCHEMA.md
//
export * from './users';
export * from './auth';
export * from './billing';
export * from './b2b';
export * from './tools';
export * from './misc';
export * from './audit';
export * from './config';
export * from './relations';

// Re-export Drizzle utilities
export { sql, eq, ne, and, or, not, isNull, isNotNull, desc, asc, gte, gt, lte, lt, like, ilike, inArray, notInArray, between } from 'drizzle-orm';
