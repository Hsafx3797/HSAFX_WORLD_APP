/**
 * Plan Access Hook
 * HSAFX WORLD - Check user's plan-based feature access
 *
 * PHASE 0: Replaced next-auth/react with better-auth.
 * Plan derivation uses better-auth session; tier will be accurate
 * once Phase 4 wires subscription data via tRPC.
 */

import * as React from 'react';
import { useAuth, type PlanTier } from './use-auth';

// Re-export for consumers
export type UserPlan = PlanTier;
// Feature keys that can be checked
export type FeatureKey =
  | 'file_upload'
  | 'png_export'
  | 'svg_export'
  | 'pdf_export'
  | 'bulk_csv'
  | 'bulk_container'
  | 'multi_terminal'
  | 'solid_presets'
  | 'stylized_presets'
  | 'flag_presets'
  | 'custom_primary'
  | 'custom_accent'
  | 'advanced_controls'
  | 'ad_free'
  | 'priority_execution'
  | 'api_access';

// Tool category for access checking
export type ToolCategory =
  | 'text'
  | 'code'
  | 'file'
  | 'generator'
  | 'calculator'
  | 'visualizer'
  | 'intelligence';

// Feature access matrix
const FEATURE_ACCESS: Record<FeatureKey, UserPlan[]> = {
  // File features
  file_upload: ['free', 'pro', 'advance'],
  png_export: ['free', 'pro', 'advance'],
  svg_export: ['pro', 'advance'],
  pdf_export: ['pro', 'advance'],
  
  // Bulk features
  bulk_csv: ['free', 'pro', 'advance'],
  bulk_container: ['free', 'pro', 'advance'],
  multi_terminal: ['pro', 'advance'],
  
  // Theme features
  solid_presets: ['free', 'pro', 'advance'],
  stylized_presets: ['free', 'pro', 'advance'],
  flag_presets: ['pro', 'advance'],
  custom_primary: ['pro', 'advance'],
  custom_accent: ['pro', 'advance'],
  advanced_controls: ['pro', 'advance'],
  
  // Premium features
  ad_free: ['pro', 'advance'],
  priority_execution: ['advance'],
  api_access: ['advance'],
};

// Tool category limits per plan (daily)
const TOOL_LIMITS: Record<ToolCategory, Record<UserPlan, number>> = {
  text: { guest: -1, free: -1, pro: -1, advance: -1 }, // -1 = unlimited
  code: { guest: 10, free: 50, pro: -1, advance: -1 },
  file: { guest: 3, free: 10, pro: -1, advance: -1 },
  generator: { guest: 5, free: 25, pro: -1, advance: -1 },
  calculator: { guest: -1, free: -1, pro: -1, advance: -1 },
  visualizer: { guest: 3, free: 10, pro: -1, advance: -1 },
  intelligence: { guest: 0, free: 5, pro: 20, advance: -1 },
};

// File size limits (MB)
const FILE_SIZE_LIMITS: Record<UserPlan, number> = {
  guest: 5,
  free: 10,
  pro: 100,
  advance: 100,
};

// Context value
interface PlanAccessContextValue {
  plan: UserPlan;
  isLoading: boolean;
  canAccess: (feature: FeatureKey) => boolean;
  getToolLimit: (category: ToolCategory) => number;
  getFileSizeLimit: () => number;
  requiresUpgrade: (feature: FeatureKey) => UserPlan | null;
  isUnlimited: (category: ToolCategory) => boolean;
}

// Create context
const PlanAccessContext = React.createContext<PlanAccessContextValue | null>(null);

// Provider props
interface PlanAccessProviderProps {
  children: React.ReactNode;
}

/**
 * Plan Access Provider
 */
export function PlanAccessProvider({ children }: PlanAccessProviderProps) {
  const { user, isLoading } = useAuth();
  
  const plan: UserPlan = React.useMemo(() => {
    if (isLoading) return 'guest';
    if (!user) return 'guest';
    
    // Plan tier comes from the auth session (populated by Phase 4 subscription lookup)
    const userPlan = user.tier;
    if (userPlan === 'pro' || userPlan === 'advance') {
      return userPlan;
    }
    return 'free';
  }, [user, isLoading]);
  
  const value = React.useMemo<PlanAccessContextValue>(() => ({
    plan,
    isLoading,
    
    canAccess: (feature: FeatureKey) => {
      const allowedPlans = FEATURE_ACCESS[feature];
      return allowedPlans?.includes(plan) ?? false;
    },
    
    getToolLimit: (category: ToolCategory) => {
      return TOOL_LIMITS[category]?.[plan] ?? 0;
    },
    
    getFileSizeLimit: () => {
      return FILE_SIZE_LIMITS[plan] ?? 5;
    },
    
    requiresUpgrade: (feature: FeatureKey) => {
      const allowedPlans = FEATURE_ACCESS[feature];
      if (!allowedPlans || allowedPlans.includes(plan)) {
        return null;
      }
      
      // Return minimum required plan
      const planOrder: UserPlan[] = ['guest', 'free', 'pro', 'advance'];
      for (const p of planOrder) {
        if (allowedPlans.includes(p)) {
          return p;
        }
      }
      return 'advance';
    },
    
    isUnlimited: (category: ToolCategory) => {
      return TOOL_LIMITS[category]?.[plan] === -1;
    },
  }), [plan, isLoading]);
  
  return (
    <PlanAccessContext.Provider value={value}>
      {children}
    </PlanAccessContext.Provider>
  );
}

/**
 * Hook to access plan context
 */
export function usePlanAccess(): PlanAccessContextValue {
  const context = React.useContext(PlanAccessContext);
  if (!context) {
    throw new Error('usePlanAccess must be used within a PlanAccessProvider');
  }
  return context;
}

/**
 * Hook to check single feature access
 */
export function useFeatureAccess(feature: FeatureKey): {
  canAccess: boolean;
  isLoading: boolean;
  requiredPlan: UserPlan | null;
} {
  const { canAccess, requiresUpgrade, isLoading } = usePlanAccess();
  
  return {
    canAccess: canAccess(feature),
    isLoading,
    requiredPlan: requiresUpgrade(feature),
  };
}

/**
 * Hook to get tool usage limits
 */
export function useToolLimits(category: ToolCategory): {
  dailyLimit: number;
  isUnlimited: boolean;
  isLoading: boolean;
} {
  const { getToolLimit, isUnlimited, isLoading } = usePlanAccess();
  
  return {
    dailyLimit: getToolLimit(category),
    isUnlimited: isUnlimited(category),
    isLoading,
  };
}

/**
 * Hook for current plan info
 */
export function useCurrentPlan(): {
  plan: UserPlan;
  isLoading: boolean;
  isPro: boolean;
  isAdvance: boolean;
  isFree: boolean;
  isGuest: boolean;
} {
  const { plan, isLoading } = usePlanAccess();
  
  return {
    plan,
    isLoading,
    isPro: plan === 'pro',
    isAdvance: plan === 'advance',
    isFree: plan === 'free',
    isGuest: plan === 'guest',
  };
}
