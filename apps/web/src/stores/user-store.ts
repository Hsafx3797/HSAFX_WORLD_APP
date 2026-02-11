/**
 * User Store — session, plan, coin balance
 * Reference: SOLUTION_ROADMAP Task 4.3
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserPlan {
  id: string;
  slug: string;
  name: string;
  coinGrant: number;
  discountPercent: number;
}

export interface UserState {
  // Auth
  isAuthenticated: boolean;
  userId: string | null;
  fullName: string | null;
  email: string | null;
  role: string;
  avatarUrl: string | null;

  // Billing
  plan: UserPlan | null;
  coinBalance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;

  // Actions
  setUser: (user: {
    id: string;
    fullName: string | null;
    email: string;
    role: string;
    avatarUrl?: string | null;
  }) => void;
  setPlan: (plan: UserPlan | null) => void;
  setCoinBalance: (balance: number) => void;
  updateCoinBalance: (delta: number) => void;
  setLifetimeStats: (earned: number, spent: number) => void;
  clearUser: () => void;
}

const initialState = {
  isAuthenticated: false,
  userId: null as string | null,
  fullName: null as string | null,
  email: null as string | null,
  role: 'user',
  avatarUrl: null as string | null,
  plan: null as UserPlan | null,
  coinBalance: 0,
  lifetimeEarned: 0,
  lifetimeSpent: 0,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...initialState,

      setUser: (user) =>
        set({
          isAuthenticated: true,
          userId: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl ?? null,
        }),

      setPlan: (plan) => set({ plan }),

      setCoinBalance: (balance) => set({ coinBalance: balance }),

      updateCoinBalance: (delta) =>
        set((state) => ({ coinBalance: state.coinBalance + delta })),

      setLifetimeStats: (earned, spent) =>
        set({ lifetimeEarned: earned, lifetimeSpent: spent }),

      clearUser: () => set(initialState),
    }),
    {
      name: 'hsafx-user',
      partialize: (state) => ({
        // Only persist non-sensitive data
        userId: state.userId,
        fullName: state.fullName,
        plan: state.plan,
        coinBalance: state.coinBalance,
      }),
    },
  ),
);
