/**
 * Billing Store — checkout flow, plan selection, billing UI state
 * Complements tRPC hooks (useCoins, useSubscription) which handle server state.
 * This store manages client-only billing UI coordination.
 */

import { create } from 'zustand';

export interface BillingState {
  // Checkout flow
  selectedPlanSlug: string | null;
  selectedInterval: 'month' | 'year';
  checkoutLoading: boolean;

  // Coin purchase flow
  selectedCoinPackId: string | null;
  coinPurchaseLoading: boolean;

  // Active billing page tab
  activeTab: 'overview' | 'transactions' | 'plans' | 'invoices';

  // Plan comparison modal
  showPlanComparison: boolean;

  // Actions
  selectPlan: (slug: string, interval?: 'month' | 'year') => void;
  clearPlanSelection: () => void;
  setCheckoutLoading: (loading: boolean) => void;

  selectCoinPack: (packId: string) => void;
  clearCoinPackSelection: () => void;
  setCoinPurchaseLoading: (loading: boolean) => void;

  setActiveTab: (tab: BillingState['activeTab']) => void;

  setShowPlanComparison: (show: boolean) => void;

  reset: () => void;
}

const initialState = {
  selectedPlanSlug: null as string | null,
  selectedInterval: 'month' as const,
  checkoutLoading: false,
  selectedCoinPackId: null as string | null,
  coinPurchaseLoading: false,
  activeTab: 'overview' as const,
  showPlanComparison: false,
};

export const useBillingStore = create<BillingState>()((set) => ({
  ...initialState,

  selectPlan: (slug, interval) =>
    set({
      selectedPlanSlug: slug,
      selectedInterval: interval ?? 'month',
    }),

  clearPlanSelection: () =>
    set({ selectedPlanSlug: null, checkoutLoading: false }),

  setCheckoutLoading: (loading) => set({ checkoutLoading: loading }),

  selectCoinPack: (packId) => set({ selectedCoinPackId: packId }),

  clearCoinPackSelection: () =>
    set({ selectedCoinPackId: null, coinPurchaseLoading: false }),

  setCoinPurchaseLoading: (loading) => set({ coinPurchaseLoading: loading }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  setShowPlanComparison: (show) => set({ showPlanComparison: show }),

  reset: () => set(initialState),
}));
