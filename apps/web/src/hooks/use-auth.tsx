/**
 * Auth Hook — wraps better-auth client
 *
 * PHASE 0: Replaced custom JWT/FastAPI auth with better-auth.
 * Keeps the same export surface (AuthProvider, useAuth) for backward compat
 * with dashboard pages and use-subscription.ts.
 *
 * better-auth manages sessions via httpOnly cookies — no more localStorage tokens.
 */
'use client';

import { createContext, useContext, useMemo, ReactNode } from 'react';
import { authClient } from '@/lib/auth-client';

// Plan tiers per planning spec (20_BILLING_SYSTEM.md)
export type PlanTier = 'guest' | 'free' | 'pro' | 'advance';

export interface User {
  id: string;
  email: string;
  name: string;
  tier: PlanTier;
  avatarUrl?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending, error, refetch } = authClient.useSession();

  const user: User | null = useMemo(() => {
    if (!session?.user) return null;
    const u = session.user;
    return {
      id: u.id,
      email: u.email,
      name: u.name ?? u.email.split('@')[0],
      // Tier is populated by Zustand stores / tRPC queries
      // in use-session.ts. This default is only the initial value before hydration.
      tier: 'free' as PlanTier,
      avatarUrl: u.image ?? undefined,
      role: undefined,
    };
  }, [session]);

  const value = useMemo<AuthContextType>(() => ({
    user,
    isLoading: isPending,
    isAuthenticated: !!session?.user,

    login: async (email: string, password: string) => {
      try {
        const result = await authClient.signIn.email({ email, password });
        if (result.error) {
          return { success: false, error: result.error.message ?? 'Login failed' };
        }
        return { success: true };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Network error' };
      }
    },

    register: async (email: string, password: string, name?: string) => {
      try {
        const result = await authClient.signUp.email({
          email,
          password,
          name: name || email.split('@')[0] || 'User',
        });
        if (result.error) {
          return { success: false, error: result.error.message ?? 'Registration failed' };
        }
        return { success: true };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Network error' };
      }
    },

    logout: async () => {
      await authClient.signOut();
    },

    refreshUser: async () => {
      await refetch();
    },

    // Session is the source of truth; use useUserStore for derived coin/tier state.
    updateUser: (_data: Partial<User>) => {
      // No-op — session refetch handles auth state updates.
    },

    // Update profile via better-auth updateUser endpoint
    updateProfile: async (data: Partial<User>) => {
      try {
        const payload: Record<string, string> = {};
        if (data.name) payload.name = data.name;
        if (data.avatarUrl) payload.image = data.avatarUrl;

        await authClient.updateUser(payload);
        await refetch();
        return { success: true };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Profile update failed' };
      }
    },
  }), [user, isPending, session, refetch]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
