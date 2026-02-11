/**
 * Coins Hook
 * HSAFX WORLD - Manage user coin balance, transactions, daily bonus, purchases.
 *
 * PHASE 4: Wired to tRPC billing routes:
 *   - billing.getWalletBalance
 *   - billing.getTransactionHistory
 *   - billing.purchaseCoinPack
 */
'use client';

import { useCallback } from 'react';
import { useAuth } from './use-auth';
import { trpc } from '@/lib/trpc';

export interface CoinTransaction {
  id: string;
  amount: number;
  balanceAfter: number;
  transactionType: string;
  description?: string;
  createdAt: string;
}

export interface UseCoinsReturn {
  balance: number;
  isLoading: boolean;
  transactions: CoinTransaction[];
  dailyBonusAvailable: boolean;
  claimDailyBonus: () => Promise<{ success: boolean; error?: string }>;
  purchaseCoins: (packId: string) => Promise<{ success: boolean; checkoutUrl?: string; error?: string }>;
  refreshBalance: () => Promise<void>;
  canAfford: (cost: number) => boolean;
}

export function useCoins(): UseCoinsReturn {
  const { isAuthenticated } = useAuth();

  // ── tRPC queries ──
  const walletQuery = trpc.billing.getWalletBalance.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 30_000, // 30s cache
  });

  const txQuery = trpc.billing.getTransactionHistory.useQuery(
    { page: 1, pageSize: 50 },
    { enabled: isAuthenticated, staleTime: 60_000 },
  );

  const balance = walletQuery.data?.balance ?? 0;
  const isLoading = walletQuery.isLoading || txQuery.isLoading;

  const transactions: CoinTransaction[] = (txQuery.data?.items ?? []).map((tx) => ({
    id: tx.id,
    amount: tx.amount,
    balanceAfter: tx.balanceAfter ?? 0,
    transactionType: tx.type,
    description: tx.reason ?? undefined,
    createdAt: typeof tx.createdAt === 'string' ? tx.createdAt : new Date(tx.createdAt).toISOString(),
  }));

  const refreshBalance = useCallback(async () => {
    if (!isAuthenticated) return;
    await walletQuery.refetch();
    await txQuery.refetch();
  }, [isAuthenticated, walletQuery, txQuery]);

  // ── tRPC mutation: claim daily bonus ──
  const dailyBonusMutation = trpc.billing.claimDailyBonus.useMutation();

  const claimDailyBonus = async () => {
    if (!isAuthenticated) return { success: false, error: 'Not authenticated' };
    try {
      const result = await dailyBonusMutation.mutateAsync();
      await walletQuery.refetch();
      await txQuery.refetch();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to claim daily bonus' };
    }
  };

  // ── tRPC mutation: purchase coin pack via Stripe ──
  const purchaseMutation = trpc.billing.purchaseCoinPack.useMutation();

  const purchaseCoins = async (packId: string): Promise<{ success: boolean; checkoutUrl?: string; error?: string }> => {
    if (!isAuthenticated) return { success: false, error: 'Not authenticated' };
    try {
      const result = await purchaseMutation.mutateAsync({ packId });
      return { success: true, checkoutUrl: result.checkoutUrl ?? undefined };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Purchase failed' };
    }
  };

  const canAfford = (cost: number) => balance >= cost;

  // Check if daily bonus was already claimed today by looking at transactions
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const dailyBonusAvailable = isAuthenticated && !transactions.some(
    (tx) => tx.transactionType === 'grant' && tx.description === 'daily_bonus' && new Date(tx.createdAt) >= todayStart,
  );

  return {
    balance,
    isLoading,
    transactions,
    dailyBonusAvailable,
    claimDailyBonus,
    purchaseCoins,
    refreshBalance,
    canAfford,
  };
}
