/**
 * Session Hook — thin wrapper around better-auth useSession
 *
 * PHASE 2: Provides `useUser()` and `usePlanTier()` helpers that derive
 * clean user/plan data from the better-auth session.
 * PHASE 4: `usePlanTier()` now wired to tRPC billing.getMySubscription.
 */
'use client';

import { authClient } from '@/lib/auth-client';
import type { PlanTier } from './use-auth';
import { trpc } from '@/lib/trpc';

/**
 * Raw better-auth session hook — re-exported for direct access
 */
export const useSession = authClient.useSession;

/**
 * Derived user hook — provides user, session, and auth status
 */
export function useUser() {
  const { data, isPending, error } = useSession();
  return {
    user: data?.user ?? null,
    session: data?.session ?? null,
    isLoading: isPending,
    isAuthenticated: !!data?.user,
    error,
  };
}

/**
 * Derive plan tier from subscription via tRPC.
 * Returns 'guest' for unauthenticated users.
 */
export function usePlanTier(): PlanTier {
  const { user } = useUser();
  const subQuery = trpc.billing.getMySubscription.useQuery(undefined, {
    enabled: !!user,
    staleTime: 60_000,
  });
  if (!user) return 'guest' as const;
  const planSlug = subQuery.data?.plan?.slug;
  if (planSlug === 'pro' || planSlug === 'advance') return planSlug;
  return 'free' as const;
}
