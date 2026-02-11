/**
 * Admin Role Permissions
 * HSAFX WORLD - RBAC permissions matrix for admin panel
 */

import type { AdminRole, AdminPermission } from './types';

// Role hierarchy levels
export const ROLE_LEVELS: Record<AdminRole, number> = {
  super_admin: 100,
  admin: 80,
  support_manager: 60,
  support_agent: 40,
  content_manager: 40,
  analyst: 20,
  auditor: 20,
};

// Permissions per role
export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  super_admin: [
    // All permissions
    'users.list', 'users.view', 'users.create', 'users.update', 'users.delete', 'users.ban', 'users.impersonate',
    'subscriptions.view', 'subscriptions.modify', 'subscriptions.cancel', 'subscriptions.refund',
    'coins.view', 'coins.grant', 'coins.revoke', 'coins.packs.manage',
    'tools.list', 'tools.view', 'tools.create', 'tools.update', 'tools.delete', 'tools.toggle', 'tools.costs.manage',
    'plans.view', 'plans.modify', 'plans.features.manage', 'plans.limits.manage',
    'system.config.view', 'system.config.modify', 'system.feature_flags.manage', 'system.maintenance',
    'roles.view', 'roles.assign', 'roles.modify', 'roles.permissions.manage',
    'audit.view', 'audit.export', 'audit.retention.manage',
    'analytics.dashboard', 'analytics.reports', 'analytics.export',
    'api.keys.view', 'api.keys.create', 'api.keys.revoke', 'api.rate_limits.manage',
  ],
  
  admin: [
    'users.list', 'users.view', 'users.create', 'users.update', 'users.delete', 'users.ban',
    'subscriptions.view', 'subscriptions.modify', 'subscriptions.cancel', 'subscriptions.refund',
    'coins.view', 'coins.grant', 'coins.revoke', 'coins.packs.manage',
    'tools.list', 'tools.view', 'tools.create', 'tools.update', 'tools.delete', 'tools.toggle', 'tools.costs.manage',
    'plans.view', 'plans.modify', 'plans.features.manage', 'plans.limits.manage',
    'system.config.view', 'system.feature_flags.manage',
    'roles.view', 'roles.assign',
    'audit.view', 'audit.export',
    'analytics.dashboard', 'analytics.reports', 'analytics.export',
    'api.keys.view', 'api.keys.create', 'api.keys.revoke', 'api.rate_limits.manage',
  ],
  
  support_manager: [
    'users.list', 'users.view', 'users.create', 'users.update', 'users.ban',
    'subscriptions.view', 'subscriptions.modify', 'subscriptions.cancel',
    'coins.view', 'coins.grant',
    'tools.list', 'tools.view',
    'plans.view',
    'audit.view',
    'analytics.dashboard',
    'api.keys.view',
  ],
  
  support_agent: [
    'users.list', 'users.view', 'users.update', // Limited update
    'subscriptions.view',
    'coins.view',
    'tools.list', 'tools.view',
    'plans.view',
    'api.keys.view',
  ],
  
  content_manager: [
    'users.list', // For reference only
    'tools.list', 'tools.view', 'tools.create', 'tools.update', 'tools.toggle',
    'plans.view',
  ],
  
  analyst: [
    'users.list', 'users.view',
    'subscriptions.view',
    'coins.view',
    'tools.list', 'tools.view',
    'plans.view',
    'analytics.dashboard', 'analytics.reports', 'analytics.export',
  ],
  
  auditor: [
    'users.list', 'users.view',
    'subscriptions.view',
    'coins.view',
    'tools.list', 'tools.view',
    'plans.view',
    'roles.view',
    'audit.view', 'audit.export',
    'api.keys.view',
  ],
};

// Check if role has permission
export function hasRolePermission(role: AdminRole, permission: AdminPermission): boolean {
  // Super admin has all permissions
  if (role === 'super_admin') return true;
  
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

// Check if any of the roles has permission
export function hasAnyRolePermission(roles: AdminRole[], permission: AdminPermission): boolean {
  return roles.some(role => hasRolePermission(role, permission));
}

// Get all permissions for a role
export function getAllRolePermissions(role: AdminRole): AdminPermission[] {
  return ROLE_PERMISSIONS[role] || [];
}

// Get combined permissions for multiple roles
export function getCombinedPermissions(roles: AdminRole[]): AdminPermission[] {
  const permissionSet = new Set<AdminPermission>();
  
  for (const role of roles) {
    const permissions = ROLE_PERMISSIONS[role] || [];
    for (const permission of permissions) {
      permissionSet.add(permission);
    }
  }
  
  return Array.from(permissionSet);
}

// Role assignment rules
export const ROLE_ASSIGNMENT_RULES: Record<AdminRole, {
  assignableBy: AdminRole[];
  maxPerOrg: number;
  requiresMFA: boolean;
}> = {
  super_admin: {
    assignableBy: ['super_admin'],
    maxPerOrg: 2,
    requiresMFA: true,
  },
  admin: {
    assignableBy: ['super_admin'],
    maxPerOrg: 5,
    requiresMFA: true,
  },
  support_manager: {
    assignableBy: ['super_admin', 'admin'],
    maxPerOrg: 10,
    requiresMFA: false,
  },
  support_agent: {
    assignableBy: ['super_admin', 'admin', 'support_manager'],
    maxPerOrg: 50,
    requiresMFA: false,
  },
  content_manager: {
    assignableBy: ['super_admin', 'admin'],
    maxPerOrg: 10,
    requiresMFA: false,
  },
  analyst: {
    assignableBy: ['super_admin', 'admin'],
    maxPerOrg: 20,
    requiresMFA: false,
  },
  auditor: {
    assignableBy: ['super_admin'],
    maxPerOrg: 5,
    requiresMFA: true,
  },
};

// Check if role can assign another role
export function canAssignRole(assignerRole: AdminRole, targetRole: AdminRole): boolean {
  const rules = ROLE_ASSIGNMENT_RULES[targetRole];
  return rules?.assignableBy.includes(assignerRole) ?? false;
}

// Get the highest role level from a list of roles
export function getHighestRoleLevel(roles: AdminRole[]): number {
  return Math.max(...roles.map(role => ROLE_LEVELS[role] || 0));
}

// Check if role level is higher than another
export function isRoleLevelHigher(role1: AdminRole, role2: AdminRole): boolean {
  return ROLE_LEVELS[role1] > ROLE_LEVELS[role2];
}

// Destructive operations requiring 2FA
export const DESTRUCTIVE_OPERATIONS: AdminPermission[] = [
  'users.delete',
  'users.ban',
  'users.impersonate',
  'subscriptions.refund',
  'coins.revoke',
  'tools.delete',
  'system.config.modify',
  'system.maintenance',
  'roles.modify',
];

// Check if permission requires 2FA
export function requiresTwoFactor(permission: AdminPermission): boolean {
  return DESTRUCTIVE_OPERATIONS.includes(permission);
}

// Role display names
export const ROLE_DISPLAY_NAMES: Record<AdminRole, string> = {
  super_admin: 'Super Administrator',
  admin: 'Administrator',
  support_manager: 'Support Manager',
  support_agent: 'Support Agent',
  content_manager: 'Content Manager',
  analyst: 'Data Analyst',
  auditor: 'Auditor',
};

// Role descriptions
export const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  super_admin: 'Full system access with all administrative permissions',
  admin: 'General administration with user and system management capabilities',
  support_manager: 'Customer support lead with user and subscription management',
  support_agent: 'Front-line support with limited user management',
  content_manager: 'Tool and content management for the platform',
  analyst: 'Read-only access to analytics and reporting',
  auditor: 'Read-only access to audit logs and compliance data',
};
