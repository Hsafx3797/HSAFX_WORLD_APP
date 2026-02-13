/**
 * Tool Store — favorites, recents, current tool selection
 * Execution lifecycle state lives in execution-store.ts
 * Reference: SOLUTION_ROADMAP Task 4.3
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ToolState {
  // Current tool selection
  currentToolId: string | null;

  // Favorites & recents
  favorites: string[]; // tool IDs
  recentTools: string[]; // tool IDs, most recent first

  // Actions
  setCurrentTool: (toolId: string) => void;

  // Favorites
  toggleFavorite: (toolId: string) => void;
  isFavorite: (toolId: string) => boolean;

  // Recents
  addRecent: (toolId: string) => void;

  // Reset
  reset: () => void;
}

const MAX_RECENTS = 20;

const initialState = {
  currentToolId: null as string | null,
  favorites: [] as string[],
  recentTools: [] as string[],
};

export const useToolStore = create<ToolState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentTool: (toolId) => set({ currentToolId: toolId }),

      toggleFavorite: (toolId) =>
        set((state) => ({
          favorites: state.favorites.includes(toolId)
            ? state.favorites.filter((id) => id !== toolId)
            : [...state.favorites, toolId],
        })),

      isFavorite: (toolId) => get().favorites.includes(toolId),

      addRecent: (toolId) =>
        set((state) => ({
          recentTools: [
            toolId,
            ...state.recentTools.filter((id) => id !== toolId),
          ].slice(0, MAX_RECENTS),
        })),

      reset: () => set(initialState),
    }),
    {
      name: 'hsafx-tools',
      partialize: (state) => ({
        favorites: state.favorites,
        recentTools: state.recentTools,
      }),
    },
  ),
);
