/**
 * User Store — session, plan, preferences
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserPlan {
  id: string;
  slug: string;
  name: string;
  discountPercent: number;
}

export interface UserPreferences {
  themeMode: 'light' | 'dark' | 'system';
  locale: string;
  notificationsEnabled: boolean;
  compactMode: boolean;
}

export interface UserSession {
  id: string;
  device: string;
  lastActive: number; // timestamp
  current: boolean;
}

export interface UserState {
  // Auth
  isAuthenticated: boolean;
  userId: string | null;
  name: string | null;
  email: string | null;
  role: string;
  image: string | null;

  // Billing
  plan: UserPlan | null;

  // Preferences & sessions
  preferences: UserPreferences | null;
  sessions: UserSession[];

  // Actions
  setUser: (user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    image?: string | null;
  }) => void;
  setPlan: (plan: UserPlan | null) => void;
  setPreferences: (preferences: UserPreferences) => void;
  setSessions: (sessions: UserSession[]) => void;
  clearUser: () => void;
}

const initialState = {
  isAuthenticated: false,
  userId: null as string | null,
  name: null as string | null,
  email: null as string | null,
  role: 'user',
  image: null as string | null,
  plan: null as UserPlan | null,
  preferences: null as UserPreferences | null,
  sessions: [] as UserSession[],
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...initialState,

      setUser: (user) =>
        set({
          isAuthenticated: true,
          userId: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.image ?? null,
        }),

      setPlan: (plan) => set({ plan }),

      setPreferences: (preferences) => set({ preferences }),

      setSessions: (sessions) => set({ sessions }),

      clearUser: () => set(initialState),
    }),
    {
      name: 'hsafx-user',
      partialize: (state) => ({
        // Only persist non-sensitive data
        userId: state.userId,
        name: state.name,
        plan: state.plan,
        preferences: state.preferences,
      }),
    },
  ),
);
