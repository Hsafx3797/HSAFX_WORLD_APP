/**
 * Subscription Hook
 * HSAFX WORLD - Manage user subscription state and billing actions.
 *
 * PHASE 4: Wired to tRPC billing routes:
 *   - billing.getMySubscription
 *   - billing.createCheckout  (Polar checkout → redirect to Polar hosted page)
 *   - billing.cancelSubscription (Polar cancel at period end)
 */
'use client';

import { useCallback } from 'react';
import { useAuth, type PlanTier } from './use-auth';
import { trpc } from '@/lib/trpc';

export interface Subscription {
  id: string;
  plan: PlanTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
}

export interface UseSubscriptionReturn {
  subscription: Subscription | null;
  isLoading: boolean;
  isPro: boolean;
  isAdvance: boolean;
  subscribe: (planSlug: 'pro' | 'advance', interval?: 'monthly' | 'yearly') => Promise<{ success: boolean; checkoutUrl?: string; error?: string }>;
  cancel: (immediately?: boolean) => Promise<{ success: boolean; error?: string }>;
  reactivate: () => Promise<{ success: boolean; error?: string }>;
  manageBilling: () => Promise<{ success: boolean; portalUrl?: string; error?: string }>;
  refreshSubscription: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const { user, isAuthenticated } = useAuth();

  // ── tRPC query: current subscription ──
  const subQuery = trpc.billing.getMySubscription.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const rawSub = subQuery.data;
  const isLoading = subQuery.isLoading;

  const subscription: Subscription | null = rawSub
    ? {
        id: rawSub.subscription.id,
        plan: (rawSub.plan?.slug ?? 'free') as PlanTier,
        status: rawSub.derivedStatus as Subscription['status'],
        currentPeriodStart: rawSub.subscription.currentPeriodStart
          ? new Date(rawSub.subscription.currentPeriodStart).toISOString()
          : undefined,
        currentPeriodEnd: rawSub.subscription.currentPeriodEnd
          ? new Date(rawSub.subscription.currentPeriodEnd).toISOString()
          : undefined,
        cancelAtPeriodEnd: rawSub.subscription.cancelAtPeriodEnd ?? false,
      }
    : null;

  const refreshSubscription = useCallback(async () => {
    if (!isAuthenticated) return;
    await subQuery.refetch();
  }, [isAuthenticated, subQuery]);

  // ── tRPC mutation: subscribe (Polar checkout) ──
  const checkoutMutation = trpc.billing.createCheckout.useMutation();

  const subscribe = async (planSlug: 'pro' | 'advance', interval: 'monthly' | 'yearly' = 'monthly'): Promise<{ success: boolean; checkoutUrl?: string; error?: string }> => {
    if (!isAuthenticated) return { success: false, error: 'Not authenticated' };
    try {
      const result = await checkoutMutation.mutateAsync({ planSlug, interval });
      // Redirect to Polar checkout if we got a URL
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
      return { success: true, checkoutUrl: result.checkoutUrl ?? undefined };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Checkout failed' };
    }
  };

  // ── tRPC mutation: cancel subscription ──
  const cancelMutation = trpc.billing.cancelSubscription.useMutation();

  const cancel = async (_immediately: boolean = false) => {
    if (!isAuthenticated) return { success: false, error: 'Not authenticated' };
    try {
      await cancelMutation.mutateAsync();
      await subQuery.refetch();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Cancellation failed' };
    }
  };

  // ── tRPC mutation: reactivate (resume) subscription ──
  const resumeMutation = trpc.billing.resumeSubscription.useMutation();

  const reactivate = async () => {
    if (!isAuthenticated) return { success: false, error: 'Not authenticated' };
    try {
      await resumeMutation.mutateAsync();
      await subQuery.refetch();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Reactivation failed' };
    }
  };

  // ── Billing portal: redirect to Polar customer portal or billing page ──
  const manageBilling = async () => {
    if (!isAuthenticated) return { success: false, error: 'Not authenticated' };
    try {
      // Polar does not offer an embeddable portal — redirect to billing page
      const portalUrl = '/billing';
      return { success: true, portalUrl };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to open billing' };
    }
  };

  // Tier checks
  const currentTier = subscription?.plan ?? user?.tier ?? 'guest';
  const isPro = currentTier === 'pro' || currentTier === 'advance';
  const isAdvance = currentTier === 'advance';

  return {
    subscription,
    isLoading,
    isPro,
    isAdvance,
    subscribe,
    cancel,
    reactivate,
    manageBilling,
    refreshSubscription,
  };
}
