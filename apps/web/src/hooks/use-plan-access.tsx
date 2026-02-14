/**
 * Plan Access Hook
 * HSAFX WORLD - Check user's plan-based feature access
 *
 * Plan tier is resolved server-side from the user's active subscription
 * via the user.getMyPlan tRPC query.
 */

import * as React from 'react';
import { useAuth } from './use-auth';
import { trpc } from '@/lib/trpc';

// Plan tiers
export type UserPlan = 'guest' | 'free' | 'pro' | 'advance';
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

// Static fallback tool limits per plan (daily, -1 = unlimited).
// Overridden by DB-backed limits from planLimits table when available.
const DEFAULT_TOOL_LIMITS: Record<ToolCategory, Record<UserPlan, number>> = {
  text: { guest: -1, free: -1, pro: -1, advance: -1 },
  code: { guest: 10, free: 50, pro: -1, advance: -1 },
  file: { guest: 3, free: 10, pro: -1, advance: -1 },
  generator: { guest: 5, free: 25, pro: -1, advance: -1 },
  calculator: { guest: -1, free: -1, pro: -1, advance: -1 },
  visualizer: { guest: 3, free: 10, pro: -1, advance: -1 },
  intelligence: { guest: 0, free: 5, pro: 20, advance: -1 },
};

// Static fallback file size limits (MB).
const DEFAULT_FILE_SIZE_LIMITS: Record<UserPlan, number> = {
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
  const { user, isLoading: authLoading } = useAuth();
  const isAuthenticated = !!user;

  // Fetch real plan from server; only fires when authenticated
  const { data: planData, isLoading: planLoading } = trpc.user.getMyPlan.useQuery(
    undefined,
    { enabled: isAuthenticated },
  );

  const isLoading = authLoading || (isAuthenticated && planLoading);
  
  const plan: UserPlan = React.useMemo(() => {
    if (authLoading) return 'guest';
    if (!user) return 'guest';
    
    // Use server-derived plan from tRPC query
    const serverPlan = planData?.plan;
    if (serverPlan === 'pro' || serverPlan === 'advance') {
      return serverPlan;
    }
    // Authenticated but no active paid subscription → 'free'
    return serverPlan === 'free' ? 'free' : (isAuthenticated ? 'free' : 'guest');
  }, [user, authLoading, planData, isAuthenticated]);
  
  const value = React.useMemo<PlanAccessContextValue>(() => {
    // DB-backed limits (Record<string, number>) from getMyPlan query
    const dbLimits = planData?.limits;

    return {
      plan,
      isLoading,

      canAccess: (feature: FeatureKey) => {
        const allowedPlans = FEATURE_ACCESS[feature];
        return allowedPlans?.includes(plan) ?? false;
      },

      getToolLimit: (category: ToolCategory) => {
        // DB key format: "daily_{category}", fallback to hardcoded
        const dbVal = dbLimits?.[`daily_${category}`];
        return dbVal !== undefined ? dbVal : (DEFAULT_TOOL_LIMITS[category]?.[plan] ?? 0);
      },

      getFileSizeLimit: () => {
        const dbVal = dbLimits?.max_file_size;
        return dbVal !== undefined ? dbVal : (DEFAULT_FILE_SIZE_LIMITS[plan] ?? 5);
      },

      requiresUpgrade: (feature: FeatureKey) => {
        const allowedPlans = FEATURE_ACCESS[feature];
        if (!allowedPlans || allowedPlans.includes(plan)) {
          return null;
        }

        const planOrder: UserPlan[] = ['guest', 'free', 'pro', 'advance'];
        for (const p of planOrder) {
          if (allowedPlans.includes(p)) {
            return p;
          }
        }
        return 'advance';
      },

      isUnlimited: (category: ToolCategory) => {
        const dbVal = dbLimits?.[`daily_${category}`];
        const limit = dbVal !== undefined ? dbVal : (DEFAULT_TOOL_LIMITS[category]?.[plan] ?? 0);
        return limit === -1;
      },
    };
  }, [plan, isLoading, planData]);
  
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
