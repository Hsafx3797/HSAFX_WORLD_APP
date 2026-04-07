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

// CASL Abilities
export {
  buildUserAbility,
  canUseToolByCategory,
} from './ability';
export type {
  UserAbility,
  UserSubjects,
  UserActions,
} from './ability';
