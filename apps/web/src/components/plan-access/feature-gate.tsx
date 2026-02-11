/**
 * Feature Gate Components
 * HSAFX WORLD - Plan-based feature gating UI components
 */

'use client';

import * as React from 'react';
import type { FeatureKey, ToolCategory, UserPlan } from '@/hooks/use-plan-access';
import { usePlanAccess, useFeatureAccess, useCurrentPlan } from '@/hooks/use-plan-access';

// ==================== FEATURE GATE ====================

interface FeatureGateProps {
  feature: FeatureKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * FeatureGate - Renders children only if feature is accessible
 */
export function FeatureGate({ feature, children, fallback = null }: FeatureGateProps) {
  const { canAccess, isLoading } = useFeatureAccess(feature);
  
  if (isLoading) {
    return null;
  }
  
  if (!canAccess) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

// ==================== PLAN GATE ====================

interface PlanGateProps {
  minPlan: UserPlan;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * PlanGate - Renders based on minimum plan requirement
 */
export function PlanGate({ minPlan, children, fallback = null }: PlanGateProps) {
  const { plan, isLoading } = useCurrentPlan();
  
  if (isLoading) {
    return null;
  }
  
  const planOrder: UserPlan[] = ['guest', 'free', 'pro', 'advance'];
  const userLevel = planOrder.indexOf(plan);
  const requiredLevel = planOrder.indexOf(minPlan);
  
  if (userLevel < requiredLevel) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

// ==================== UPGRADE PROMPT ====================

interface UpgradePromptProps {
  feature: FeatureKey;
  onUpgrade?: () => void;
  variant?: 'inline' | 'overlay' | 'modal';
  children?: React.ReactNode;
}

/**
 * UpgradePrompt - Shows upgrade prompt for locked features
 */
export function UpgradePrompt({
  feature,
  onUpgrade,
  variant = 'inline',
  children,
}: UpgradePromptProps) {
  const { canAccess, requiredPlan, isLoading } = useFeatureAccess(feature);
  
  if (isLoading || canAccess) {
    return <>{children}</>;
  }
  
  const planNames: Record<UserPlan, string> = {
    guest: 'Sign In',
    free: 'Free',
    pro: 'Pro',
    advance: 'Advance',
  };
  
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <LockIcon className="h-4 w-4" />
        <span>Requires {planNames[requiredPlan!]} plan</span>
        <button
          onClick={onUpgrade}
          className="text-primary hover:underline font-medium"
        >
          Upgrade
        </button>
      </div>
    );
  }
  
  if (variant === 'overlay') {
    return (
      <div className="relative">
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
          <div className="text-center p-4">
            <LockIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium mb-2">
              {planNames[requiredPlan!]} Feature
            </p>
            <button
              onClick={onUpgrade}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Upgrade to {planNames[requiredPlan!]}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Modal variant would need dialog implementation
  return <>{children}</>;
}

// ==================== USAGE LIMIT INDICATOR ====================

interface UsageLimitIndicatorProps {
  category: ToolCategory;
  current: number;
}

/**
 * UsageLimitIndicator - Shows usage progress for limited features
 */
export function UsageLimitIndicator({ category, current }: UsageLimitIndicatorProps) {
  const { getToolLimit, isUnlimited, isLoading } = usePlanAccess();
  
  if (isLoading) {
    return null;
  }
  
  const limit = getToolLimit(category);
  
  if (isUnlimited(category)) {
    return (
      <span className="text-xs text-muted-foreground">
        Unlimited uses
      </span>
    );
  }
  
  const remaining = Math.max(0, limit - current);
  const percentage = Math.min(100, (current / limit) * 100);
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            percentage > 80 ? 'bg-destructive' : percentage > 50 ? 'bg-warning' : 'bg-primary'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {remaining} left today
      </span>
    </div>
  );
}

// ==================== PRO BADGE ====================

interface ProBadgeProps {
  feature?: FeatureKey;
  minPlan?: UserPlan;
}

/**
 * ProBadge - Shows PRO/ADVANCE badge for premium features
 */
export function ProBadge({ feature, minPlan }: ProBadgeProps) {
  const { requiresUpgrade } = usePlanAccess();
  
  let requiredPlan: UserPlan | null = minPlan ?? null;
  
  if (feature) {
    requiredPlan = requiresUpgrade(feature);
  }
  
  if (!requiredPlan || requiredPlan === 'guest' || requiredPlan === 'free') {
    return null;
  }
  
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
        requiredPlan === 'advance'
          ? 'bg-chart-4/10 text-chart-4'
          : 'bg-warning/10 text-warning'
      }`}
    >
      {requiredPlan === 'advance' ? 'ADVANCE' : 'PRO'}
    </span>
  );
}

// ==================== LOCKED FEATURE OVERLAY ====================

interface LockedFeatureProps {
  feature: FeatureKey;
  children: React.ReactNode;
  showBadge?: boolean;
}

/**
 * LockedFeature - Wraps content with lock overlay if not accessible
 */
export function LockedFeature({ feature, children, showBadge = true }: LockedFeatureProps) {
  const { canAccess, requiredPlan, isLoading } = useFeatureAccess(feature);
  
  if (isLoading) {
    return <>{children}</>;
  }
  
  if (canAccess) {
    return <>{children}</>;
  }
  
  return (
    <div className="relative group">
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-background/90 border shadow-sm">
          <LockIcon className="h-3 w-3 text-muted-foreground" />
          {showBadge && <ProBadge minPlan={requiredPlan!} />}
        </div>
      </div>
    </div>
  );
}

// ==================== HELPER COMPONENTS ====================

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
