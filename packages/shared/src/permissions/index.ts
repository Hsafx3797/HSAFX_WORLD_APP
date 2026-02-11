/**
 * Permissions Package Barrel Export
 * HSAFX WORLD - Unified permissions system
 */

// Types
export type {
  UserPlan,
  AdminRole,
  ToolCategory,
  FeatureKey,
  AdminPermission,
  Tool,
  User,
  Subscription,
  Coins,
  AdminUser,
  AppSubjects,
  UserAction,
  AdminAction,
  AppAction,
} from './types';

// Plan-based access
export {
  PLAN_FEATURES,
  CATEGORY_FEATURE_MAP,
  PLAN_LIMITS,
  hasPlanFeature,
  canAccessCategory,
  getPlanFeatures,
  getMinimumPlanForFeature,
  comparePlans,
  isPlanAtLeast,
  getPlanLimit,
  isUnlimited,
} from './plan-access';
export type { UsageLimits } from './plan-access';

// Admin RBAC
export {
  ROLE_LEVELS,
  ROLE_PERMISSIONS,
  ROLE_ASSIGNMENT_RULES,
  DESTRUCTIVE_OPERATIONS,
  ROLE_DISPLAY_NAMES,
  ROLE_DESCRIPTIONS,
  hasRolePermission,
  hasAnyRolePermission,
  getAllRolePermissions,
  getCombinedPermissions,
  canAssignRole,
  getHighestRoleLevel,
  isRoleLevelHigher,
  requiresTwoFactor,
} from './admin-rbac';

// CASL Abilities
export {
  buildUserAbility,
  buildAdminAbility,
  canUseToolByCategory,
  canAdminDo,
} from './ability';
export type {
  UserAbility,
  AdminAbility,
  UserSubjects,
  UserActions,
  AdminSubjects,
  AdminActions,
} from './ability';
