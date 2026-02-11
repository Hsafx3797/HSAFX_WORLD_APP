/**
 * CASL Ability Definitions
 * HSAFX WORLD - User and Admin ability builders using CASL
 */

import { 
  AbilityBuilder, 
  createMongoAbility,
  MongoAbility,
} from '@casl/ability';
import type { 
  UserPlan, 
  AdminRole, 
  ToolCategory,
  AdminPermission,
} from './types';
import { getCombinedPermissions } from './admin-rbac';

// Define subjects for user app
type UserSubjects = 
  | 'Tool'
  | 'Coins'
  | 'Feature'
  | 'Api'
  | 'Theme'
  | 'Support'
  | 'all';

// Define actions for user app
type UserActions = 'use' | 'view' | 'purchase' | 'earn' | 'access' | 'manage';

// User ability type
export type UserAbility = MongoAbility<[UserActions, UserSubjects]>;

// Build user abilities based on plan
export function buildUserAbility(plan: UserPlan): UserAbility {
  const { can, cannot, build } = new AbilityBuilder<UserAbility>(createMongoAbility);

  // Everyone can view tools
  can('view', 'Tool');
  
  // Guest abilities (most restricted)
  if (plan === 'guest') {
    can('use', 'Tool');
    cannot('purchase', 'Coins');
    cannot('earn', 'Coins');
    cannot('access', 'Api');
    cannot('access', 'Theme');
    return build();
  }

  // Free tier
  if (plan === 'free' || plan === 'pro' || plan === 'advance') {
    can('purchase', 'Coins');
    can('earn', 'Coins');
    can('use', 'Tool');
  }

  // Pro tier
  if (plan === 'pro' || plan === 'advance') {
    can('access', 'Api');
    can('access', 'Feature');
    can('access', 'Theme');
  }

  // Advance tier
  if (plan === 'advance') {
    can('access', 'Support');
    can('manage', 'all');
  }

  return build();
}

// Define subjects for admin panel
type AdminSubjects = 
  | 'User'
  | 'Subscription'
  | 'Coins'
  | 'Tool'
  | 'Plan'
  | 'System'
  | 'Role'
  | 'Audit'
  | 'Analytics'
  | 'Api'
  | 'all';

// Define actions for admin panel
type AdminActions = 
  | 'list'
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'ban'
  | 'impersonate'
  | 'modify'
  | 'cancel'
  | 'refund'
  | 'grant'
  | 'revoke'
  | 'toggle'
  | 'assign'
  | 'export'
  | 'manage';

// Admin ability type
export type AdminAbility = MongoAbility<[AdminActions, AdminSubjects]>;

// Permission to ability mapping
const PERMISSION_TO_ABILITY: Record<AdminPermission, [AdminActions, AdminSubjects]> = {
  // Users
  'users.list': ['list', 'User'],
  'users.view': ['view', 'User'],
  'users.create': ['create', 'User'],
  'users.update': ['update', 'User'],
  'users.delete': ['delete', 'User'],
  'users.ban': ['ban', 'User'],
  'users.impersonate': ['impersonate', 'User'],
  // Subscriptions
  'subscriptions.view': ['view', 'Subscription'],
  'subscriptions.modify': ['modify', 'Subscription'],
  'subscriptions.cancel': ['cancel', 'Subscription'],
  'subscriptions.refund': ['refund', 'Subscription'],
  // Coins
  'coins.view': ['view', 'Coins'],
  'coins.grant': ['grant', 'Coins'],
  'coins.revoke': ['revoke', 'Coins'],
  'coins.packs.manage': ['manage', 'Coins'],
  // Tools
  'tools.list': ['list', 'Tool'],
  'tools.view': ['view', 'Tool'],
  'tools.create': ['create', 'Tool'],
  'tools.update': ['update', 'Tool'],
  'tools.delete': ['delete', 'Tool'],
  'tools.toggle': ['toggle', 'Tool'],
  'tools.costs.manage': ['manage', 'Tool'],
  // Plans
  'plans.view': ['view', 'Plan'],
  'plans.modify': ['modify', 'Plan'],
  'plans.features.manage': ['manage', 'Plan'],
  'plans.limits.manage': ['manage', 'Plan'],
  // System
  'system.config.view': ['view', 'System'],
  'system.config.modify': ['modify', 'System'],
  'system.feature_flags.manage': ['manage', 'System'],
  'system.maintenance': ['manage', 'System'],
  // Roles
  'roles.view': ['view', 'Role'],
  'roles.assign': ['assign', 'Role'],
  'roles.modify': ['modify', 'Role'],
  'roles.permissions.manage': ['manage', 'Role'],
  // Audit
  'audit.view': ['view', 'Audit'],
  'audit.export': ['export', 'Audit'],
  'audit.retention.manage': ['manage', 'Audit'],
  // Analytics
  'analytics.dashboard': ['view', 'Analytics'],
  'analytics.reports': ['view', 'Analytics'],
  'analytics.export': ['export', 'Analytics'],
  // API
  'api.keys.view': ['view', 'Api'],
  'api.keys.create': ['create', 'Api'],
  'api.keys.revoke': ['revoke', 'Api'],
  'api.rate_limits.manage': ['manage', 'Api'],
};

// Build admin abilities based on roles
export function buildAdminAbility(roles: AdminRole[]): AdminAbility {
  const { can, build } = new AbilityBuilder<AdminAbility>(createMongoAbility);

  // Super admin can do everything
  if (roles.includes('super_admin')) {
    can('manage', 'all');
    return build();
  }

  // Get combined permissions for all roles
  const permissions = getCombinedPermissions(roles);

  // Map permissions to abilities
  for (const permission of permissions) {
    const abilityMapping = PERMISSION_TO_ABILITY[permission];
    if (abilityMapping) {
      const [action, subject] = abilityMapping;
      can(action, subject);
    }
  }

  return build();
}

// Check if user can use a specific tool based on category
export function canUseToolByCategory(
  ability: UserAbility, 
  category: ToolCategory
): boolean {
  // Simplified check - in production would check category restrictions
  return ability.can('use', 'Tool');
}

// Check if admin can perform an action
export function canAdminDo(
  ability: AdminAbility,
  action: AdminActions,
  subject: AdminSubjects
): boolean {
  return ability.can(action, subject);
}

// Re-export types
export type { UserSubjects, UserActions, AdminSubjects, AdminActions };
