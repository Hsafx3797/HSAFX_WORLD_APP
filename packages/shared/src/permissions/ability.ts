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
  ToolCategory,
} from './types';

import { CATEGORY_FEATURE_MAP, PLAN_FEATURES } from './plan-access';

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

// Check if user can use a specific tool based on category
export function canUseToolByCategory(
  ability: UserAbility, 
  category: ToolCategory,
  plan: UserPlan
): boolean {
  if (!ability.can('use', 'Tool')) return false;
  const featureKey = CATEGORY_FEATURE_MAP[category];
  return featureKey ? PLAN_FEATURES[plan].has(featureKey) : false;
}

// Re-export types
export type { UserSubjects, UserActions };
