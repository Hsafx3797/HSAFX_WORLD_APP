/**
 * Admin Panel Permissions
 * RBAC implementation for admin panel
 */

import { AdminRole, Permission, ROLE_PERMISSIONS } from './types';

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: AdminRole, permission: Permission): boolean {
  if (role === 'super_admin') return true;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: AdminRole, permissions: Permission[]): boolean {
  if (role === 'super_admin') return true;
  return permissions.some(p => hasPermission(role, p));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: AdminRole, permissions: Permission[]): boolean {
  if (role === 'super_admin') return true;
  return permissions.every(p => hasPermission(role, p));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: AdminRole): Permission[] {
  if (role === 'super_admin') {
    return [...new Set(Object.values(ROLE_PERMISSIONS).flat())] as Permission[];
  }
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Operations that require 2FA verification
 */
export const DESTRUCTIVE_OPERATIONS = [
  'users.delete',
  'users.ban',
  'subscriptions.refund',
  'billing.adjust',
  'admin.delete',
] as const;

/**
 * Check if an operation requires 2FA
 */
export function requiresTwoFactor(permission: Permission): boolean {
  return (DESTRUCTIVE_OPERATIONS as readonly string[]).includes(permission);
}

/**
 * Route permissions mapping
 */
export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  '/dashboard': 'users.view',
  '/users': 'users.view',
  '/users/[id]': 'users.view',
  '/users/[id]/edit': 'users.edit',
  '/subscriptions': 'subscriptions.view',
  '/subscriptions/[id]': 'subscriptions.view',
  '/billing': 'billing.view',
  '/billing/transactions': 'billing.view',
  '/billing/webhooks': 'billing.view',
  '/tools': 'tools.view',
  '/tools/[id]': 'tools.view',
  '/tools/[id]/edit': 'tools.manage',
  '/tools/pricing': 'tools.manage',
  '/categories': 'tools.view',
  '/plans': 'system.config',
  '/plans/[id]': 'system.config',
  '/coin-packs': 'system.config',
  '/api-keys': 'system.config',
  '/webhooks': 'billing.view',
  '/feature-flags': 'system.config',
  '/settings': 'system.config',
  '/settings/rate-limits': 'system.config',
  '/settings/login-rewards': 'system.config',
  '/activity': 'audit.view',
  '/admins': 'admin.view',
};

/**
 * Get required permission for a route
 */
export function getRoutePermission(route: string): Permission | null {
  // Exact match
  if (ROUTE_PERMISSIONS[route]) {
    return ROUTE_PERMISSIONS[route];
  }
  
  // Pattern match for dynamic routes
  for (const [pattern, permission] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pattern.includes('[')) {
      const regex = new RegExp('^' + pattern.replace(/\[.*?\]/g, '[^/]+') + '$');
      if (regex.test(route)) {
        return permission;
      }
    }
  }
  
  return null;
}

/**
 * Role display names
 */
export const ROLE_DISPLAY_NAMES: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  support: 'Support',
  developer: 'Developer',
  analyst: 'Analyst',
  billing: 'Billing',
};

/**
 * Role descriptions
 */
export const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  super_admin: 'Full system access with all permissions',
  admin: 'General administration with user and system management',
  support: 'Customer support with user and subscription access',
  developer: 'Development team with tool and system access',
  analyst: 'Data analysis with read-only access to analytics',
  billing: 'Finance team with billing and transaction access',
};

/**
 * Permission display names
 */
export const PERMISSION_DISPLAY_NAMES: Record<Permission, string> = {
  'users.view': 'View Users',
  'users.edit': 'Edit Users',
  'users.ban': 'Ban/Suspend Users',
  'users.delete': 'Delete Users',
  'subscriptions.view': 'View Subscriptions',
  'subscriptions.manage': 'Manage Subscriptions',
  'subscriptions.refund': 'Issue Refunds',
  'billing.view': 'View Billing',
  'billing.export': 'Export Reports',
  'billing.adjust': 'Manual Adjustments',
  'tools.view': 'View Tools',
  'tools.manage': 'Manage Tools',
  'tools.deploy': 'Deploy Tools',
  'system.view': 'View System',
  'system.config': 'Configure System',
  'system.logs': 'View Logs',
  'admin.view': 'View Admins',
  'admin.manage': 'Manage Admins',
  'admin.delete': 'Delete Admins',
  'audit.view': 'View Audit Log',
};
