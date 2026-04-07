/**
 * Admin Panel React Hooks
 * SWR-based data fetching hooks for admin operations
 */

'use client';

import useSWR, { mutate } from 'swr';
import { useState, useCallback } from 'react';
import type {
  User, UserFilters, UserActivity,
  Subscription, SubscriptionFilters,
  CoinTransaction, TransactionFilters, PaymentWebhook,
  Tool, ToolFilters, ToolCategory,
  FeatureFlag,
  AuditLog, AuditFilters,
  DashboardMetrics, DashboardAnalytics, TopTool, RecentError, Alert,
  SystemConfig,
  AdminUser,
  Plan, CoinPack, ApiKeyRecord,
  PaginatedResponse,
  StreakTier, ReferralConfigEntry, PlanFeature, PlanLimit,
  AnalyticsOverview, CohortRow, FunnelData, ToolUsageRow, RevenueRow, ChurnData, SystemHealth,
  AdminSetting, RateLimitConfigEntry,
  B2bPlan, B2bSuite, B2bPlanQuota, B2bSubscription, B2bUsageRow,
  EmailTemplate,
} from './types';
import * as api from './api';

// ==================== DASHBOARD ====================

export function useDashboardMetrics() {
  const { data, error, isLoading } = useSWR<DashboardMetrics>(
    '/admin/dashboard/metrics',
    async () => {
      const res = await api.getDashboardMetrics();
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    },
    { refreshInterval: 30000 }
  );
  return { metrics: data, error, isLoading };
}

export function useTopTools(limit = 5) {
  const { data, error, isLoading } = useSWR<TopTool[]>(
    `/admin/dashboard/top-tools?limit=${limit}`,
    async () => {
      const res = await api.getTopTools(limit);
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    }
  );
  return { topTools: data, error, isLoading };
}

export function useRecentErrors(limit = 10) {
  const { data, error, isLoading } = useSWR<RecentError[]>(
    `/admin/dashboard/recent-errors?limit=${limit}`,
    async () => {
      const res = await api.getRecentErrors(limit);
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    }
  );
  return { recentErrors: data, error, isLoading };
}

export function useAlerts() {
  const { data, error, isLoading, mutate: refresh } = useSWR<Alert[]>(
    '/admin/dashboard/alerts',
    async () => {
      const res = await api.getAlerts();
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    }
  );

  const acknowledge = useCallback(async (id: string) => {
    await api.acknowledgeAlert(id);
    refresh();
  }, [refresh]);

  return { alerts: data, error, isLoading, acknowledge };
}

export function useDashboardAnalytics(days = 30) {
  const { data, error, isLoading } = useSWR<DashboardAnalytics>(
    `/admin/dashboard/analytics?days=${days}`,
    async () => {
      const res = await api.getDashboardAnalytics(days);
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    },
    { refreshInterval: 60000 }
  );
  return { analytics: data, error, isLoading };
}

// ==================== USERS ====================

export function useUsers(filters: UserFilters = {}) {
  const key = `/admin/users?${JSON.stringify(filters)}`;
  const { data, error, isLoading, mutate: refresh } = useSWR<PaginatedResponse<User>>(
    key,
    async () => {
      const res = await api.getUsers(filters);
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    }
  );

  return { 
    users: data?.data || [], 
    pagination: data ? { page: data.page, limit: data.limit, total: data.total, totalPages: data.totalPages } : null,
    error, 
    isLoading,
    refresh,
  };
}

export function useUser(id: string | null) {
  const { data, error, isLoading, mutate: refresh } = useSWR<User>(
    id ? `/admin/users/${id}` : null,
    async () => {
      const res = await api.getUser(id!);
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    }
  );
  return { user: data, error, isLoading, refresh };
}

export function useUserMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (id: string, data: Partial<User>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.updateUser(id, data);
      if (!res.success) throw new Error(res.error?.message);
      mutate(`/admin/users/${id}`);
      return res.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update user');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const ban = useCallback(async (id: string, reason: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.banUser(id, reason);
      if (!res.success) throw new Error(res.error?.message);
      mutate(`/admin/users/${id}`);
      return res.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to ban user');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const unban = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.unbanUser(id);
      if (!res.success) throw new Error(res.error?.message);
      mutate(`/admin/users/${id}`);
      return res.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to unban user');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: string, totpCode: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.deleteUser(id, totpCode);
      if (!res.success) throw new Error(res.error?.message);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete user');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.resetUserPassword(id);
      if (!res.success) throw new Error(res.error?.message);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reset password');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const adjustCoins = useCallback(async (id: string, amount: number, reason: string, totpCode: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.adjustUserCoins(id, amount, reason, totpCode);
      if (!res.success) throw new Error(res.error?.message);
      mutate(`/admin/users/${id}`);
      return res.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to adjust coins');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, update, ban, unban, remove, resetPassword, adjustCoins };
}

export function useUserActivity(id: string | null) {
  const { data, error, isLoading } = useSWR<UserActivity[]>(
    id ? `/admin/users/${id}/activity` : null,
    async () => {
      const res = await api.getUserActivity(id!);
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    }
  );
  return { activity: data, error, isLoading };
}

// ==================== SUBSCRIPTIONS ====================

export function useSubscriptions(filters: SubscriptionFilters = {}) {
  const key = `/admin/subscriptions?${JSON.stringify(filters)}`;
  const { data, error, isLoading, mutate: refresh } = useSWR<PaginatedResponse<Subscription>>(
    key,
    async () => {
      const res = await api.getSubscriptions(filters);
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    }
  );

  return { 
    subscriptions: data?.data || [], 
    pagination: data ? { page: data.page, limit: data.limit, total: data.total, totalPages: data.totalPages } : null,
    error, 
    isLoading,
    refresh,
  };
}

export function useSubscription(id: string | null) {
  const { data, error, isLoading, mutate: refresh } = useSWR<Subscription>(
    id ? `/admin/subscriptions/${id}` : null,
    async () => {
      const res = await api.getSubscription(id!);
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    }
  );
  return { subscription: data, error, isLoading, refresh };
}

export function useSubscriptionMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upgrade = useCallback(async (id: string, plan: string, immediate: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.upgradeSubscription(id, plan, immediate);
      if (!res.success) throw new Error(res.error?.message);
      mutate(`/admin/subscriptions/${id}`);
      return res.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to upgrade subscription');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const downgrade = useCallback(async (id: string, plan: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.downgradeSubscription(id, plan);
      if (!res.success) throw new Error(res.error?.message);
      mutate(`/admin/subscriptions/${id}`);
      return res.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to downgrade subscription');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancel = useCallback(async (id: string, immediate: boolean, totpCode?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.cancelSubscription(id, immediate, totpCode);
      if (!res.success) throw new Error(res.error?.message);
      mutate(`/admin/subscriptions/${id}`);
      return res.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to cancel subscription');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const pause = useCallback(async (id: string, months: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.pauseSubscription(id, months);
      if (!res.success) throw new Error(res.error?.message);
      mutate(`/admin/subscriptions/${id}`);
      return res.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to pause subscription');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const resume = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.resumeSubscription(id);
      if (!res.success) throw new Error(res.error?.message);
      mutate(`/admin/subscriptions/${id}`);
      return res.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to resume subscription');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const refund = useCallback(async (id: string, amount: number, reason: string, totpCode: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.refundSubscription(id, amount, reason, totpCode);
      if (!res.success) throw new Error(res.error?.message);
      mutate(`/admin/subscriptions/${id}`);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to process refund');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, upgrade, downgrade, cancel, pause, resume, refund };
}

// ==================== BILLING ====================

export function useTransactions(filters: TransactionFilters = {}) {
  const key = `/admin/billing/transactions?${JSON.stringify(filters)}`;
  const { data, error, isLoading } = useSWR<PaginatedResponse<CoinTransaction>>(
    key,
    async () => {
      const res = await api.getTransactions(filters);
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    }
  );

  return { 
    transactions: data?.data || [], 
    pagination: data ? { page: data.page, limit: data.limit, total: data.total, totalPages: data.totalPages } : null,
    error, 
    isLoading,
  };
}

export function useWebhooks(page = 1, limit = 50) {
  const key = `/admin/billing/webhooks?page=${page}&limit=${limit}`;
  const { data, error, isLoading, mutate: refresh } = useSWR<PaginatedResponse<PaymentWebhook>>(
    key,
    async () => {
      const res = await api.getWebhooks(page, limit);
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    }
  );

  const retry = useCallback(async (id: string) => {
    const res = await api.retryWebhook(id);
    if (!res.success) throw new Error(res.error?.message);
    refresh();
    return true;
  }, [refresh]);

  return {
    webhooks: data?.data || [],
    pagination: data ? { page: data.page, limit: data.limit, total: data.total, totalPages: data.totalPages } : null,
    error,
    isLoading,
    refresh,
    retry,
  };
}

// ==================== TOOLS ====================

export function useTools(filters: ToolFilters = {}) {
  const key = `/admin/tools?${JSON.stringify(filters)}`;
  const { data, error, isLoading, mutate: refresh } = useSWR<PaginatedResponse<Tool>>(
    key,
    async () => {
      const res = await api.getTools(filters);
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    }
  );

  return { 
    tools: data?.data || [], 
    pagination: data ? { page: data.page, limit: data.limit, total: data.total, totalPages: data.totalPages } : null,
    error, 
    isLoading,
    refresh,
  };
}

export function useTool(id: string | null) {
  const { data, error, isLoading, mutate: refresh } = useSWR<Tool>(
    id ? `/admin/tools/${id}` : null,
    async () => {
      const res = await api.getTool(id!);
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    }
  );
  return { tool: data, error, isLoading, refresh };
}

export type ToolAnalyticsData = {
  executions: { date: string; count: number }[];
  errors: { date: string; count: number }[];
  avgTime: { date: string; ms: number }[];
};

export function useToolAnalytics(id: string | null, period: '24h' | '7d' | '30d' = '7d') {
  const { data, error, isLoading, mutate: refresh } = useSWR<ToolAnalyticsData>(
    id ? `/admin/tools/${id}/analytics?period=${period}` : null,
    async () => {
      const res = await api.getToolAnalytics(id!, period);
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    }
  );
  return { analytics: data, error, isLoading, refresh };
}

export function useToolMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (id: string, data: Partial<Tool>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.updateTool(id, data);
      if (!res.success) throw new Error(res.error?.message);
      mutate(`/admin/tools/${id}`);
      return res.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update tool');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const enable = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.enableTool(id);
      if (!res.success) throw new Error(res.error?.message);
      mutate(`/admin/tools/${id}`);
      return res.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to enable tool');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const disable = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.disableTool(id);
      if (!res.success) throw new Error(res.error?.message);
      mutate(`/admin/tools/${id}`);
      return res.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to disable tool');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, update, enable, disable };
}

// ==================== CATEGORIES ====================

export function useCategories() {
  const { data, error, isLoading, mutate: refresh } = useSWR<ToolCategory[]>(
    '/admin/categories',
    async () => {
      const res = await api.getCategories();
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    }
  );
  return { categories: data || [], error, isLoading, refresh };
}

export function useCategoryMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: Partial<ToolCategory>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.createCategory(data);
      if (!res.success) throw new Error(res.error?.message);
      mutate('/admin/categories');
      return res.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create category');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (id: string, data: Partial<ToolCategory>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.updateCategory(id, data);
      if (!res.success) throw new Error(res.error?.message);
      mutate('/admin/categories');
      return res.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update category');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.deleteCategory(id);
      if (!res.success) throw new Error(res.error?.message);
      mutate('/admin/categories');
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete category');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const reorder = useCallback(async (ids: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.reorderCategories(ids);
      if (!res.success) throw new Error(res.error?.message);
      mutate('/admin/categories');
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reorder categories');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, create, update, remove, reorder };
}

// ==================== FEATURE FLAGS ====================

export function useFeatureFlags() {
  const { data, error, isLoading, mutate: refresh } = useSWR<FeatureFlag[]>(
    '/admin/feature-flags',
    async () => {
      const res = await api.getFeatureFlags();
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    }
  );
  return { featureFlags: data || [], error, isLoading, refresh };
}

export function useFeatureFlagMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (id: string, data: Partial<FeatureFlag>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.updateFeatureFlag(id, data);
      if (!res.success) throw new Error(res.error?.message);
      mutate('/admin/feature-flags');
      return res.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update feature flag');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (data: Partial<FeatureFlag>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.createFeatureFlag(data);
      if (!res.success) throw new Error(res.error?.message);
      mutate('/admin/feature-flags');
      return res.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create feature flag');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.deleteFeatureFlag(id);
      if (!res.success) throw new Error(res.error?.message);
      mutate('/admin/feature-flags');
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete feature flag');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, update, create, remove };
}

// ==================== SYSTEM CONFIG ====================

export function useSystemConfig() {
  const { data, error, isLoading, mutate: refresh } = useSWR<SystemConfig>(
    '/admin/config',
    async () => {
      const res = await api.getSystemConfig();
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    }
  );

  const update = useCallback(async (newConfig: Partial<SystemConfig>) => {
    const res = await api.updateSystemConfig(newConfig);
    if (!res.success) throw new Error(res.error?.message);
    refresh();
    return res.data;
  }, [refresh]);

  return { config: data, error, isLoading, update, refresh };
}

// ==================== AUDIT LOG ====================

export function useAuditLogs(filters: AuditFilters = {}) {
  const key = `/admin/audit?${JSON.stringify(filters)}`;
  const { data, error, isLoading } = useSWR<PaginatedResponse<AuditLog>>(
    key,
    async () => {
      const res = await api.getAuditLogs(filters);
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    }
  );

  return { 
    logs: data?.data || [], 
    pagination: data ? { page: data.page, limit: data.limit, total: data.total, totalPages: data.totalPages } : null,
    error, 
    isLoading,
  };
}

// ==================== ADMIN USERS ====================

export function useAdmins() {
  const { data, error, isLoading, mutate: refresh } = useSWR<AdminUser[]>(
    '/admin/admins',
    async () => {
      const res = await api.getAdmins();
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    }
  );
  return { admins: data || [], error, isLoading, refresh };
}

export function useAdminMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invite = useCallback(async (email: string, role: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.inviteAdmin(email, role);
      if (!res.success) throw new Error(res.error?.message);
      mutate('/admin/admins');
      return res.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to invite admin');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRole = useCallback(async (id: string, role: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.updateAdminRole(id, role);
      if (!res.success) throw new Error(res.error?.message);
      mutate('/admin/admins');
      return res.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update admin role');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: string, totpCode: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.deleteAdmin(id, totpCode);
      if (!res.success) throw new Error(res.error?.message);
      mutate('/admin/admins');
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete admin');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, invite, updateRole, remove };
}

// ==================== PLANS ====================

export function usePlans() {
  const { data, error, isLoading, mutate: refresh } = useSWR<Plan[]>(
    '/admin/plans',
    async () => {
      const res = await api.getPlans();
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    }
  );
  return { plans: data || [], error, isLoading, refresh };
}

export function usePlanMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: Partial<Plan>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.createPlan(data);
      if (!res.success) throw new Error(res.error?.message);
      mutate('/admin/plans');
      return res.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create plan');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (id: string, data: Partial<Plan>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.updatePlan(id, data);
      if (!res.success) throw new Error(res.error?.message);
      mutate('/admin/plans');
      return res.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update plan');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, create, update };
}

// ==================== COIN PACKS ====================

export function useCoinPacks() {
  const { data, error, isLoading, mutate: refresh } = useSWR<CoinPack[]>(
    '/admin/coin-packs',
    async () => {
      const res = await api.getCoinPacks();
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    }
  );
  return { coinPacks: data || [], error, isLoading, refresh };
}

export function useCoinPackMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: Partial<CoinPack>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.createCoinPack(data);
      if (!res.success) throw new Error(res.error?.message);
      mutate('/admin/coin-packs');
      return res.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create coin pack');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (id: string, data: Partial<CoinPack>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.updateCoinPack(id, data);
      if (!res.success) throw new Error(res.error?.message);
      mutate('/admin/coin-packs');
      return res.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update coin pack');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.deleteCoinPack(id);
      if (!res.success) throw new Error(res.error?.message);
      mutate('/admin/coin-packs');
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete coin pack');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, create, update, remove };
}

// ==================== API KEYS ====================

export function useApiKeys(page = 1, limit = 25, search?: string) {
  const key = `/admin/api-keys?page=${page}&limit=${limit}${search ? `&search=${search}` : ''}`;
  const { data, error, isLoading, mutate: refresh } = useSWR<PaginatedResponse<ApiKeyRecord>>(
    key,
    async () => {
      const res = await api.getApiKeys(page, limit, search);
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    }
  );

  return {
    apiKeys: data?.data || [],
    pagination: data ? { page: data.page, limit: data.limit, total: data.total, totalPages: data.totalPages } : null,
    error,
    isLoading,
    refresh,
  };
}

export function useApiKeyMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const revoke = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.revokeApiKey(id);
      if (!res.success) throw new Error(res.error?.message);
      mutate((key: string) => typeof key === 'string' && key.startsWith('/admin/api-keys'), undefined, { revalidate: true });
      return res.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to revoke API key');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, revoke };
}

// ==================== 2FA TOTP ====================

export function use2FAStatus() {
  const { data, error, isLoading, mutate: refresh } = useSWR<{ enabled: boolean }>(
    '/admin/2fa/status',
    async () => {
      const res = await api.get2FAStatus();
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    }
  );
  return { enabled: data?.enabled ?? false, error, isLoading, refresh };
}

export function use2FAMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setup = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.setup2FA();
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to setup 2FA');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const enable = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.enable2FA(code);
      if (!res.success) throw new Error(res.error?.message);
      mutate('/admin/2fa/status', undefined, { revalidate: true });
      return res.data!;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to enable 2FA');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const verify = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.verify2FA(code);
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const disable = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.disable2FA(code);
      if (!res.success) throw new Error(res.error?.message);
      mutate('/admin/2fa/status', undefined, { revalidate: true });
      return res.data!;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to disable 2FA');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, setup, enable, verify, disable };
}

// ==================== STREAK TIERS ====================

export function useStreakTiers() {
  const { data, error, isLoading, mutate: refresh } = useSWR<StreakTier[]>(
    '/admin/streak-tiers',
    async () => {
      const res = await api.getStreakTiers();
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    }
  );
  return { tiers: data || [], error, isLoading, refresh };
}

export function useStreakTierMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: Partial<StreakTier>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.createStreakTier(data);
      if (!res.success) throw new Error(res.error?.message);
      mutate('/admin/streak-tiers');
      return res.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create streak tier');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (id: string, data: Partial<StreakTier>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.updateStreakTier(id, data);
      if (!res.success) throw new Error(res.error?.message);
      mutate('/admin/streak-tiers');
      return res.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update streak tier');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.deleteStreakTier(id);
      if (!res.success) throw new Error(res.error?.message);
      mutate('/admin/streak-tiers');
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete streak tier');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, create, update, remove };
}

// ==================== REFERRAL CONFIG ====================

export function useReferralConfig() {
  const { data, error, isLoading, mutate: refresh } = useSWR<ReferralConfigEntry[]>(
    '/admin/referral-config',
    async () => {
      const res = await api.getReferralConfig();
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    }
  );

  const upsert = useCallback(async (entry: Partial<ReferralConfigEntry>) => {
    const res = await api.upsertReferralConfig(entry);
    if (!res.success) throw new Error(res.error?.message);
    refresh();
    return res.data;
  }, [refresh]);

  return { config: data || [], error, isLoading, refresh, upsert };
}

// ==================== PLAN LIMITS & FEATURES ====================

export function usePlanLimits(planId: string | null) {
  const { data, error, isLoading, mutate: refresh } = useSWR<PlanLimit[]>(
    planId ? `/admin/plans/${planId}/limits` : null,
    async () => {
      const res = await api.getPlanLimits(planId!);
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    }
  );
  return { limits: data || [], error, isLoading, refresh };
}

export function usePlanFeatures(planId: string | null) {
  const { data, error, isLoading, mutate: refresh } = useSWR<PlanFeature[]>(
    planId ? `/admin/plans/${planId}/features` : null,
    async () => {
      const res = await api.getPlanFeatures(planId!);
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    }
  );
  return { features: data || [], error, isLoading, refresh };
}

export function usePlanLimitMutations() {
  const [loading, setLoading] = useState(false);

  const create = useCallback(async (data: Partial<PlanLimit>) => {
    setLoading(true);
    try {
      const res = await api.createPlanLimit(data);
      if (!res.success) throw new Error(res.error?.message);
      mutate((key: string) => typeof key === 'string' && key.includes('/limits'), undefined, { revalidate: true });
      return res.data;
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (id: string, data: Partial<PlanLimit>) => {
    setLoading(true);
    try {
      const res = await api.updatePlanLimit(id, data);
      if (!res.success) throw new Error(res.error?.message);
      mutate((key: string) => typeof key === 'string' && key.includes('/limits'), undefined, { revalidate: true });
      return res.data;
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await api.deletePlanLimit(id);
      if (!res.success) throw new Error(res.error?.message);
      mutate((key: string) => typeof key === 'string' && key.includes('/limits'), undefined, { revalidate: true });
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, create, update, remove };
}

export function usePlanFeatureMutations() {
  const [loading, setLoading] = useState(false);

  const upsert = useCallback(async (data: Partial<PlanFeature>) => {
    setLoading(true);
    try {
      const res = await api.upsertPlanFeature(data);
      if (!res.success) throw new Error(res.error?.message);
      mutate((key: string) => typeof key === 'string' && key.includes('/features'), undefined, { revalidate: true });
      return res.data;
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await api.deletePlanFeature(id);
      if (!res.success) throw new Error(res.error?.message);
      mutate((key: string) => typeof key === 'string' && key.includes('/features'), undefined, { revalidate: true });
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, upsert, remove };
}

// ==================== ANALYTICS ====================

export function useAnalyticsOverview(startDate: string, endDate: string) {
  const { data, error, isLoading } = useSWR<AnalyticsOverview>(
    `/admin/analytics/overview?${startDate}-${endDate}`,
    async () => {
      const res = await api.getAnalyticsOverview(startDate, endDate);
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    }
  );
  return { overview: data, error, isLoading };
}

export function useCohortAnalysis(startDate: string, endDate: string, interval = 'week') {
  const { data, error, isLoading } = useSWR<CohortRow[]>(
    `/admin/analytics/cohorts?${startDate}-${endDate}-${interval}`,
    async () => {
      const res = await api.getCohortAnalysis(startDate, endDate, interval);
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    }
  );
  return { cohorts: data || [], error, isLoading };
}

export function useFunnelAnalysis() {
  const { data, error, isLoading } = useSWR<FunnelData>(
    '/admin/analytics/funnel',
    async () => {
      const res = await api.getFunnelAnalysis();
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    }
  );
  return { funnel: data, error, isLoading };
}

export function useToolUsageBreakdown(startDate: string, endDate: string, limit = 20) {
  const { data, error, isLoading } = useSWR<ToolUsageRow[]>(
    `/admin/analytics/tool-usage?${startDate}-${endDate}`,
    async () => {
      const res = await api.getToolUsageBreakdown(startDate, endDate, limit);
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    }
  );
  return { breakdown: data || [], error, isLoading };
}

export function useRevenueTimeSeries(startDate: string, endDate: string, interval = 'day') {
  const { data, error, isLoading } = useSWR<RevenueRow[]>(
    `/admin/analytics/revenue?${startDate}-${endDate}-${interval}`,
    async () => {
      const res = await api.getRevenueTimeSeries(startDate, endDate, interval);
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    }
  );
  return { series: data || [], error, isLoading };
}

export function useChurnAnalysis(daysInactive = 30) {
  const { data, error, isLoading } = useSWR<ChurnData>(
    `/admin/analytics/churn?days=${daysInactive}`,
    async () => {
      const res = await api.getChurnAnalysis(daysInactive);
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    }
  );
  return { churn: data, error, isLoading };
}

export function useSystemHealth() {
  const { data, error, isLoading } = useSWR<SystemHealth>(
    '/admin/analytics/health',
    async () => {
      const res = await api.getSystemHealth();
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    },
    { refreshInterval: 10000 }
  );
  return { health: data, error, isLoading };
}

// ==================== B2B PLANS ====================

export function useB2bPlans() {
  const { data, error, isLoading, mutate: refresh } = useSWR<B2bPlan[]>(
    '/admin/b2b/plans',
    async () => {
      const res = await api.getB2bPlans(1, 100);
      if (!res.success) throw new Error(res.error?.message);
      return (res.data as unknown as { data: B2bPlan[] }).data;
    }
  );
  return { plans: data || [], error, isLoading, refresh };
}

export function useB2bPlanMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: Partial<B2bPlan>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.createB2bPlan(data);
      if (!res.success) throw new Error(res.error?.message);
      mutate('/admin/b2b/plans');
      return res.data!;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create B2B plan';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (id: string, data: Partial<B2bPlan>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.updateB2bPlan(id, data);
      if (!res.success) throw new Error(res.error?.message);
      mutate('/admin/b2b/plans');
      return res.data!;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to update B2B plan';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, create, update };
}

// ==================== B2B SUITES ====================

export function useB2bSuites() {
  const { data, error, isLoading, mutate: refresh } = useSWR<B2bSuite[]>(
    '/admin/b2b/suites',
    async () => {
      const res = await api.getB2bSuites(1, 100);
      if (!res.success) throw new Error(res.error?.message);
      return (res.data as unknown as { data: B2bSuite[] }).data;
    }
  );
  return { suites: data || [], error, isLoading, refresh };
}

export function useB2bSuiteMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: Partial<B2bSuite>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.createB2bSuite(data);
      if (!res.success) throw new Error(res.error?.message);
      mutate('/admin/b2b/suites');
      return res.data!;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create B2B suite';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (id: string, data: Partial<B2bSuite>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.updateB2bSuite(id, data);
      if (!res.success) throw new Error(res.error?.message);
      mutate('/admin/b2b/suites');
      return res.data!;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to update B2B suite';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, create, update };
}

// ==================== B2B QUOTAS ====================

export function useB2bQuotas(planId?: string, suiteId?: string) {
  const key = `/admin/b2b/quotas?planId=${planId || ''}&suiteId=${suiteId || ''}`;
  const { data, error, isLoading, mutate: refresh } = useSWR<B2bPlanQuota[]>(
    key,
    async () => {
      const res = await api.getB2bQuotas({ planId, suiteId, limit: 500 });
      if (!res.success) throw new Error(res.error?.message);
      return (res.data as unknown as { data: B2bPlanQuota[] }).data;
    }
  );
  return { quotas: data || [], error, isLoading, refresh };
}

export function useB2bQuotaMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upsert = useCallback(async (data: { b2bPlanId: string; b2bSuiteId: string; monthlyLimit: number }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.upsertB2bQuota(data);
      if (!res.success) throw new Error(res.error?.message);
      mutate((key: string) => typeof key === 'string' && key.startsWith('/admin/b2b/quotas'), undefined, { revalidate: true });
      return res.data!;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save quota';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (id: string, monthlyLimit: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.updateB2bQuota(id, monthlyLimit);
      if (!res.success) throw new Error(res.error?.message);
      mutate((key: string) => typeof key === 'string' && key.startsWith('/admin/b2b/quotas'), undefined, { revalidate: true });
      return res.data!;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to update quota';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, upsert, update };
}

// ==================== B2B SUBSCRIPTIONS ====================

export function useB2bSubscriptions(params?: { page?: number; limit?: number; status?: string; search?: string }) {
  const key = `/admin/b2b/subscriptions?${JSON.stringify(params || {})}`;
  const { data, error, isLoading, mutate: refresh } = useSWR<{ items: B2bSubscription[]; total: number; page: number; limit: number; totalPages: number }>(
    key,
    async () => {
      const res = await api.getB2bSubscriptions(params);
      if (!res.success) throw new Error(res.error?.message);
      const paged = res.data as unknown as { data: B2bSubscription[]; total: number; page: number; limit: number; totalPages: number };
      return { items: paged.data, total: paged.total, page: paged.page, limit: paged.limit, totalPages: paged.totalPages };
    }
  );
  return {
    subscriptions: data?.items || [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    totalPages: data?.totalPages ?? 1,
    error,
    isLoading,
    refresh,
  };
}

export function useB2bSubscriptionMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: { userId: string; b2bPlanId: string; billingCycle: string; currentPeriodStart: string; currentPeriodEnd: string; resetDayOfMonth?: number }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.createB2bSubscription(data);
      if (!res.success) throw new Error(res.error?.message);
      mutate((key: string) => typeof key === 'string' && key.startsWith('/admin/b2b/subscriptions'), undefined, { revalidate: true });
      return res.data!;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create subscription';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (id: string, data: Partial<B2bSubscription>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.updateB2bSubscription(id, data);
      if (!res.success) throw new Error(res.error?.message);
      mutate((key: string) => typeof key === 'string' && key.startsWith('/admin/b2b/subscriptions'), undefined, { revalidate: true });
      return res.data!;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to update subscription';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, create, update };
}

// ==================== B2B USAGE ====================

export function useB2bUsage(params?: { userId?: string; suiteId?: string; from?: string; to?: string; page?: number; limit?: number }) {
  const key = `/admin/b2b/usage?${JSON.stringify(params || {})}`;
  const { data, error, isLoading, mutate: refresh } = useSWR<{ items: B2bUsageRow[]; total: number; page: number; totalPages: number }>(
    key,
    async () => {
      const res = await api.getB2bUsage(params);
      if (!res.success) throw new Error(res.error?.message);
      const paged = res.data as unknown as { data: B2bUsageRow[]; total: number; page: number; limit: number; totalPages: number };
      return { items: paged.data, total: paged.total, page: paged.page, totalPages: paged.totalPages };
    }
  );
  return {
    usage: data?.items || [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    totalPages: data?.totalPages ?? 1,
    error,
    isLoading,
    refresh,
  };
}

// ==================== EMAIL TEMPLATES ====================

export function useEmailTemplates() {
  const { data, error, isLoading, mutate: refresh } = useSWR<EmailTemplate[]>(
    '/admin/email-templates',
    async () => {
      const res = await api.getEmailTemplates();
      if (!res.success) throw new Error(res.error?.message);
      return res.data as unknown as EmailTemplate[];
    }
  );
  return { templates: data || [], error, isLoading, refresh };
}

export function useEmailTemplateMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async (data: {
    slug: string;
    name: string;
    subject: string;
    htmlBody: string;
    textBody?: string;
    variables?: string[];
    isActive?: boolean;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.saveEmailTemplate(data);
      if (!res.success) throw new Error(res.error?.message || 'Failed to save template');
      await mutate('/admin/email-templates');
      return res.data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, save };
}

