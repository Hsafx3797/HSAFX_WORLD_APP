/**
 * UI Store — sidebar, modals, notifications, responsive state
 */

import { create } from 'zustand';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number; // ms, default 5000
}

export interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Modals
  activeModal: string | null;
  modalData: Record<string, unknown> | null;

  // Toast notifications (queue)
  toasts: Toast[];

  // Global loading states
  globalLoading: boolean;
  loadingMessage: string | null;

  // Responsive
  isMobile: boolean;

  // Upgrade prompt
  showUpgradePrompt: boolean;
  upgradeReason: string | null;

  // Actions — sidebar
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Actions — modals
  openModal: (modal: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;

  // Actions — toasts
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Actions — loading
  setGlobalLoading: (loading: boolean, message?: string) => void;

  // Actions — responsive
  setIsMobile: (isMobile: boolean) => void;

  // Actions — upgrade prompt
  showUpgrade: (reason: string) => void;
  hideUpgrade: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  // Initial state
  sidebarOpen: true,
  sidebarCollapsed: false,
  activeModal: null,
  modalData: null,
  toasts: [],
  globalLoading: false,
  loadingMessage: null,
  isMobile: false,
  showUpgradePrompt: false,
  upgradeReason: null,

  // Sidebar
  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  // Modals
  openModal: (modal, data) =>
    set({ activeModal: modal, modalData: data ?? null }),
  closeModal: () => set({ activeModal: null, modalData: null }),

  // Toasts
  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { ...toast, id: crypto.randomUUID() },
      ].slice(-10), // max 10 toasts
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clearToasts: () => set({ toasts: [] }),

  // Loading
  setGlobalLoading: (loading, message) =>
    set({ globalLoading: loading, loadingMessage: message ?? null }),

  // Responsive
  setIsMobile: (isMobile) => set({ isMobile }),

  // Upgrade prompt
  showUpgrade: (reason) =>
    set({ showUpgradePrompt: true, upgradeReason: reason }),
  hideUpgrade: () =>
    set({ showUpgradePrompt: false, upgradeReason: null }),
}));
