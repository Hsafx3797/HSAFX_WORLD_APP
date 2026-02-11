/**
 * Admin RBAC Tests
 * Comprehensive tests for admin-rbac.ts exports
 */

import { describe, it, expect } from 'vitest';
import {
  ROLE_LEVELS,
  ROLE_PERMISSIONS,
  hasRolePermission,
  hasAnyRolePermission,
  getAllRolePermissions,
  getCombinedPermissions,
  ROLE_ASSIGNMENT_RULES,
  canAssignRole,
  getHighestRoleLevel,
  isRoleLevelHigher,
  DESTRUCTIVE_OPERATIONS,
  requiresTwoFactor,
  ROLE_DISPLAY_NAMES,
  ROLE_DESCRIPTIONS,
} from '../admin-rbac';

// ─── 1. ROLE_LEVELS ────────────────────────────────────────────────────────────

describe('ROLE_LEVELS', () => {
  it('should assign super_admin level 100', () => {
    expect(ROLE_LEVELS.super_admin).toBe(100);
  });

  it('should assign admin level 80', () => {
    expect(ROLE_LEVELS.admin).toBe(80);
  });

  it('should assign support_manager level 60', () => {
    expect(ROLE_LEVELS.support_manager).toBe(60);
  });

  it('should assign support_agent level 40', () => {
    expect(ROLE_LEVELS.support_agent).toBe(40);
  });

  it('should assign content_manager level 40', () => {
    expect(ROLE_LEVELS.content_manager).toBe(40);
  });

  it('should assign analyst level 20', () => {
    expect(ROLE_LEVELS.analyst).toBe(20);
  });

  it('should assign auditor level 20', () => {
    expect(ROLE_LEVELS.auditor).toBe(20);
  });

  it('should contain exactly 7 roles', () => {
    expect(Object.keys(ROLE_LEVELS)).toHaveLength(7);
  });

  it('should have super_admin as highest level', () => {
    const max = Math.max(...Object.values(ROLE_LEVELS));
    expect(ROLE_LEVELS.super_admin).toBe(max);
  });
});

// ─── 2. ROLE_PERMISSIONS ────────────────────────────────────────────────────────

describe('ROLE_PERMISSIONS', () => {
  it('should give super_admin the most permissions', () => {
    const superLen = ROLE_PERMISSIONS.super_admin.length;
    for (const role of Object.keys(ROLE_PERMISSIONS) as Array<keyof typeof ROLE_PERMISSIONS>) {
      if (role !== 'super_admin') {
        expect(ROLE_PERMISSIONS[role].length).toBeLessThan(superLen);
      }
    }
  });

  it('should include users.impersonate for super_admin', () => {
    expect(ROLE_PERMISSIONS.super_admin).toContain('users.impersonate');
  });

  it('should NOT include users.impersonate for admin', () => {
    expect(ROLE_PERMISSIONS.admin).not.toContain('users.impersonate');
  });

  it('should give support_agent limited permissions', () => {
    const expected = [
      'users.list', 'users.view', 'users.update',
      'subscriptions.view', 'coins.view',
      'tools.list', 'tools.view', 'plans.view', 'api.keys.view',
    ];
    expect(ROLE_PERMISSIONS.support_agent).toEqual(expect.arrayContaining(expected));
    expect(ROLE_PERMISSIONS.support_agent).toHaveLength(expected.length);
  });

  it('should NOT give support_agent users.delete', () => {
    expect(ROLE_PERMISSIONS.support_agent).not.toContain('users.delete');
  });

  it('should let content_manager manage tools', () => {
    expect(ROLE_PERMISSIONS.content_manager).toContain('tools.create');
    expect(ROLE_PERMISSIONS.content_manager).toContain('tools.update');
    expect(ROLE_PERMISSIONS.content_manager).toContain('tools.toggle');
  });

  it('should NOT give content_manager user management beyond list', () => {
    expect(ROLE_PERMISSIONS.content_manager).toContain('users.list');
    expect(ROLE_PERMISSIONS.content_manager).not.toContain('users.view');
    expect(ROLE_PERMISSIONS.content_manager).not.toContain('users.update');
    expect(ROLE_PERMISSIONS.content_manager).not.toContain('users.delete');
  });

  it('should give analyst analytics permissions', () => {
    expect(ROLE_PERMISSIONS.analyst).toContain('analytics.dashboard');
    expect(ROLE_PERMISSIONS.analyst).toContain('analytics.reports');
    expect(ROLE_PERMISSIONS.analyst).toContain('analytics.export');
  });

  it('should give auditor audit.view and audit.export', () => {
    expect(ROLE_PERMISSIONS.auditor).toContain('audit.view');
    expect(ROLE_PERMISSIONS.auditor).toContain('audit.export');
  });

  it('should NOT give auditor audit.retention.manage', () => {
    expect(ROLE_PERMISSIONS.auditor).not.toContain('audit.retention.manage');
  });

  it('should define permissions for all 7 roles', () => {
    expect(Object.keys(ROLE_PERMISSIONS)).toHaveLength(7);
  });
});

// ─── 3. hasRolePermission ───────────────────────────────────────────────────────

describe('hasRolePermission', () => {
  it('should return true for super_admin with users.impersonate', () => {
    expect(hasRolePermission('super_admin', 'users.impersonate')).toBe(true);
  });

  it('should return true for super_admin with any permission (wildcard)', () => {
    // super_admin short-circuits to true for any permission
    expect(hasRolePermission('super_admin', 'system.maintenance')).toBe(true);
  });

  it('should return true for admin with users.delete', () => {
    expect(hasRolePermission('admin', 'users.delete')).toBe(true);
  });

  it('should return false for admin with users.impersonate', () => {
    expect(hasRolePermission('admin', 'users.impersonate')).toBe(false);
  });

  it('should return false for support_agent with users.delete', () => {
    expect(hasRolePermission('support_agent', 'users.delete')).toBe(false);
  });

  it('should return true for content_manager with tools.create', () => {
    expect(hasRolePermission('content_manager', 'tools.create')).toBe(true);
  });

  it('should return true for analyst with analytics.reports', () => {
    expect(hasRolePermission('analyst', 'analytics.reports')).toBe(true);
  });

  it('should return false for analyst with users.delete', () => {
    expect(hasRolePermission('analyst', 'users.delete')).toBe(false);
  });

  it('should return false for auditor with system.config.modify', () => {
    expect(hasRolePermission('auditor', 'system.config.modify')).toBe(false);
  });
});

// ─── 4. hasAnyRolePermission ────────────────────────────────────────────────────

describe('hasAnyRolePermission', () => {
  it('should return true when analyst in list has analytics.reports', () => {
    expect(hasAnyRolePermission(['support_agent', 'analyst'], 'analytics.reports')).toBe(true);
  });

  it('should return false when no role has system.config.modify', () => {
    expect(hasAnyRolePermission(['support_agent'], 'system.config.modify')).toBe(false);
  });

  it('should return false for empty roles array', () => {
    expect(hasAnyRolePermission([], 'users.list')).toBe(false);
  });

  it('should return true when first role already has the permission', () => {
    expect(hasAnyRolePermission(['admin', 'analyst'], 'users.delete')).toBe(true);
  });

  it('should return true for super_admin in roles for any permission', () => {
    expect(hasAnyRolePermission(['super_admin'], 'roles.permissions.manage')).toBe(true);
  });
});

// ─── 5. getAllRolePermissions ────────────────────────────────────────────────────

describe('getAllRolePermissions', () => {
  it('should return an array', () => {
    expect(Array.isArray(getAllRolePermissions('admin'))).toBe(true);
  });

  it('should return the longest array for super_admin', () => {
    const superLen = getAllRolePermissions('super_admin').length;
    for (const role of Object.keys(ROLE_LEVELS) as Array<keyof typeof ROLE_LEVELS>) {
      expect(getAllRolePermissions(role).length).toBeLessThanOrEqual(superLen);
    }
  });

  it('should return a short array for support_agent', () => {
    const agentPerms = getAllRolePermissions('support_agent');
    const adminPerms = getAllRolePermissions('admin');
    expect(agentPerms.length).toBeLessThan(adminPerms.length);
  });

  it('should match ROLE_PERMISSIONS directly', () => {
    expect(getAllRolePermissions('auditor')).toEqual(ROLE_PERMISSIONS.auditor);
  });
});

// ─── 6. getCombinedPermissions ──────────────────────────────────────────────────

describe('getCombinedPermissions', () => {
  it('should combine unique permissions from multiple roles', () => {
    const combined = getCombinedPermissions(['support_agent', 'analyst']);
    // Should contain permissions from both roles
    expect(combined).toContain('users.update'); // support_agent
    expect(combined).toContain('analytics.reports'); // analyst
    expect(combined).toContain('analytics.dashboard'); // analyst
  });

  it('should contain no duplicates', () => {
    const combined = getCombinedPermissions(['support_agent', 'analyst']);
    const unique = [...new Set(combined)];
    expect(combined).toHaveLength(unique.length);
  });

  it('should be a superset of each individual role', () => {
    const combined = getCombinedPermissions(['support_agent', 'analyst']);
    const agentPerms = getAllRolePermissions('support_agent');
    const analystPerms = getAllRolePermissions('analyst');
    for (const p of agentPerms) {
      expect(combined).toContain(p);
    }
    for (const p of analystPerms) {
      expect(combined).toContain(p);
    }
  });

  it('should return empty array for empty roles', () => {
    expect(getCombinedPermissions([])).toEqual([]);
  });

  it('should equal the role permissions when given a single role', () => {
    const combined = getCombinedPermissions(['admin']);
    expect(combined).toEqual(ROLE_PERMISSIONS.admin);
  });
});

// ─── 7. ROLE_ASSIGNMENT_RULES ───────────────────────────────────────────────────

describe('ROLE_ASSIGNMENT_RULES', () => {
  it('should only allow super_admin to assign super_admin', () => {
    expect(ROLE_ASSIGNMENT_RULES.super_admin.assignableBy).toEqual(['super_admin']);
  });

  it('should require MFA for super_admin assignment', () => {
    expect(ROLE_ASSIGNMENT_RULES.super_admin.requiresMFA).toBe(true);
  });

  it('should allow support_manager to assign support_agent', () => {
    expect(ROLE_ASSIGNMENT_RULES.support_agent.assignableBy).toContain('support_manager');
  });

  it('should require MFA for admin assignment', () => {
    expect(ROLE_ASSIGNMENT_RULES.admin.requiresMFA).toBe(true);
  });

  it('should NOT require MFA for support_agent assignment', () => {
    expect(ROLE_ASSIGNMENT_RULES.support_agent.requiresMFA).toBe(false);
  });

  it('should require MFA for auditor assignment', () => {
    expect(ROLE_ASSIGNMENT_RULES.auditor.requiresMFA).toBe(true);
  });

  it('should limit super_admin maxPerOrg to 2', () => {
    expect(ROLE_ASSIGNMENT_RULES.super_admin.maxPerOrg).toBe(2);
  });

  it('should define rules for all 7 roles', () => {
    expect(Object.keys(ROLE_ASSIGNMENT_RULES)).toHaveLength(7);
  });
});

// ─── 8. canAssignRole ───────────────────────────────────────────────────────────

describe('canAssignRole', () => {
  it('should allow super_admin to assign admin', () => {
    expect(canAssignRole('super_admin', 'admin')).toBe(true);
  });

  it('should NOT allow admin to assign super_admin', () => {
    expect(canAssignRole('admin', 'super_admin')).toBe(false);
  });

  it('should allow support_manager to assign support_agent', () => {
    expect(canAssignRole('support_manager', 'support_agent')).toBe(true);
  });

  it('should NOT allow support_agent to assign admin', () => {
    expect(canAssignRole('support_agent', 'admin')).toBe(false);
  });

  it('should allow admin to assign content_manager', () => {
    expect(canAssignRole('admin', 'content_manager')).toBe(true);
  });

  it('should NOT allow analyst to assign anyone', () => {
    for (const role of Object.keys(ROLE_LEVELS) as Array<keyof typeof ROLE_LEVELS>) {
      expect(canAssignRole('analyst', role)).toBe(false);
    }
  });
});

// ─── 9. getHighestRoleLevel ─────────────────────────────────────────────────────

describe('getHighestRoleLevel', () => {
  it('should return 80 for [admin, analyst]', () => {
    expect(getHighestRoleLevel(['admin', 'analyst'])).toBe(80);
  });

  it('should return 40 for [support_agent]', () => {
    expect(getHighestRoleLevel(['support_agent'])).toBe(40);
  });

  it('should return 100 when super_admin is in the list', () => {
    expect(getHighestRoleLevel(['analyst', 'super_admin'])).toBe(100);
  });

  it('should return 60 for [support_manager, auditor]', () => {
    expect(getHighestRoleLevel(['support_manager', 'auditor'])).toBe(60);
  });
});

// ─── 10. isRoleLevelHigher ──────────────────────────────────────────────────────

describe('isRoleLevelHigher', () => {
  it('should return true when super_admin vs admin', () => {
    expect(isRoleLevelHigher('super_admin', 'admin')).toBe(true);
  });

  it('should return false when admin vs super_admin', () => {
    expect(isRoleLevelHigher('admin', 'super_admin')).toBe(false);
  });

  it('should return false when both are same level (support_agent vs content_manager)', () => {
    expect(isRoleLevelHigher('support_agent', 'content_manager')).toBe(false);
  });

  it('should return false when analyst vs auditor (both 20)', () => {
    expect(isRoleLevelHigher('analyst', 'auditor')).toBe(false);
  });

  it('should return true when admin vs support_agent', () => {
    expect(isRoleLevelHigher('admin', 'support_agent')).toBe(true);
  });
});

// ─── 11. DESTRUCTIVE_OPERATIONS ─────────────────────────────────────────────────

describe('DESTRUCTIVE_OPERATIONS', () => {
  it('should contain users.delete', () => {
    expect(DESTRUCTIVE_OPERATIONS).toContain('users.delete');
  });

  it('should contain users.ban', () => {
    expect(DESTRUCTIVE_OPERATIONS).toContain('users.ban');
  });

  it('should contain system.config.modify', () => {
    expect(DESTRUCTIVE_OPERATIONS).toContain('system.config.modify');
  });

  it('should contain users.impersonate', () => {
    expect(DESTRUCTIVE_OPERATIONS).toContain('users.impersonate');
  });

  it('should contain system.maintenance', () => {
    expect(DESTRUCTIVE_OPERATIONS).toContain('system.maintenance');
  });

  it('should NOT contain users.list', () => {
    expect(DESTRUCTIVE_OPERATIONS).not.toContain('users.list');
  });

  it('should be an array of 9 destructive permissions', () => {
    expect(DESTRUCTIVE_OPERATIONS).toHaveLength(9);
  });
});

// ─── 12. requiresTwoFactor ──────────────────────────────────────────────────────

describe('requiresTwoFactor', () => {
  it('should return true for users.delete', () => {
    expect(requiresTwoFactor('users.delete')).toBe(true);
  });

  it('should return false for users.list', () => {
    expect(requiresTwoFactor('users.list')).toBe(false);
  });

  it('should return true for system.maintenance', () => {
    expect(requiresTwoFactor('system.maintenance')).toBe(true);
  });

  it('should return true for users.impersonate', () => {
    expect(requiresTwoFactor('users.impersonate')).toBe(true);
  });

  it('should return false for analytics.dashboard', () => {
    expect(requiresTwoFactor('analytics.dashboard')).toBe(false);
  });

  it('should return true for every entry in DESTRUCTIVE_OPERATIONS', () => {
    for (const op of DESTRUCTIVE_OPERATIONS) {
      expect(requiresTwoFactor(op)).toBe(true);
    }
  });
});

// ─── 13. ROLE_DISPLAY_NAMES & ROLE_DESCRIPTIONS (bonus coverage) ────────────────

describe('ROLE_DISPLAY_NAMES', () => {
  it('should map super_admin to Super Administrator', () => {
    expect(ROLE_DISPLAY_NAMES.super_admin).toBe('Super Administrator');
  });

  it('should have entries for all 7 roles', () => {
    expect(Object.keys(ROLE_DISPLAY_NAMES)).toHaveLength(7);
  });
});

describe('ROLE_DESCRIPTIONS', () => {
  it('should have entries for all 7 roles', () => {
    expect(Object.keys(ROLE_DESCRIPTIONS)).toHaveLength(7);
  });

  it('should describe analyst as read-only analytics', () => {
    expect(ROLE_DESCRIPTIONS.analyst).toMatch(/analytics/i);
  });
});
