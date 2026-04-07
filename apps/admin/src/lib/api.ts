/**
 * Admin API Client
 * API functions for admin panel operations
 */

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
  PaginatedResponse, ApiResponse,
  StreakTier, ReferralConfigEntry, PlanFeature, PlanLimit,
  AnalyticsOverview, CohortRow, FunnelData, ToolUsageRow, RevenueRow, ChurnData, SystemHealth,
  AdminSetting, RateLimitConfigEntry,
  B2bPlan, B2bSuite, B2bPlanQuota, B2bSubscription, B2bUsageRow,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/admin';

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      return {
        success: false,
        error: {
          code: data.code || 'UNKNOWN_ERROR',
          message: data.message || 'An unexpected error occurred',
        },
      };
    }
    
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error',
      },
    };
  }
}

// ==================== DASHBOARD ====================

export async function getDashboardMetrics(): Promise<ApiResponse<DashboardMetrics>> {
  return fetchApi('/dashboard/metrics');
}

export async function getDashboardAnalytics(days = 30): Promise<ApiResponse<DashboardAnalytics>> {
  return fetchApi(`/dashboard/analytics?days=${days}`);
}

export async function getTopTools(limit = 5): Promise<ApiResponse<TopTool[]>> {
  return fetchApi(`/dashboard/top-tools?limit=${limit}`);
}

export async function getRecentErrors(limit = 10): Promise<ApiResponse<RecentError[]>> {
  return fetchApi(`/dashboard/recent-errors?limit=${limit}`);
}

export async function getAlerts(): Promise<ApiResponse<Alert[]>> {
  return fetchApi('/dashboard/alerts');
}

export async function acknowledgeAlert(id: string): Promise<ApiResponse<void>> {
  return fetchApi(`/dashboard/alerts/${id}/acknowledge`, { method: 'POST' });
}

// ==================== USERS ====================

export async function getUsers(filters: UserFilters = {}): Promise<ApiResponse<PaginatedResponse<User>>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });
  return fetchApi(`/users?${params}`);
}

export async function getUser(id: string): Promise<ApiResponse<User>> {
  return fetchApi(`/users/${id}`);
}

export async function updateUser(id: string, data: Partial<User>): Promise<ApiResponse<User>> {
  return fetchApi(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function banUser(id: string, reason: string): Promise<ApiResponse<User>> {
  return fetchApi(`/users/${id}/ban`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function unbanUser(id: string): Promise<ApiResponse<User>> {
  return fetchApi(`/users/${id}/unban`, { method: 'POST' });
}

export async function deleteUser(id: string, totpCode: string): Promise<ApiResponse<void>> {
  return fetchApi(`/users/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ totpCode }),
  });
}

export async function resetUserPassword(id: string): Promise<ApiResponse<void>> {
  return fetchApi(`/users/${id}/reset-password`, { method: 'POST' });
}

export async function getUserActivity(id: string, limit = 50): Promise<ApiResponse<UserActivity[]>> {
  return fetchApi(`/users/${id}/activity?limit=${limit}`);
}

export async function adjustUserCoins(
  id: string,
  amount: number,
  reason: string,
  totpCode: string
): Promise<ApiResponse<User>> {
  return fetchApi(`/users/${id}/coins`, {
    method: 'POST',
    body: JSON.stringify({ amount, reason, totpCode }),
  });
}

// ==================== SUBSCRIPTIONS ====================

export async function getSubscriptions(
  filters: SubscriptionFilters = {}
): Promise<ApiResponse<PaginatedResponse<Subscription>>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });
  return fetchApi(`/subscriptions?${params}`);
}

export async function getSubscription(id: string): Promise<ApiResponse<Subscription>> {
  return fetchApi(`/subscriptions/${id}`);
}

export async function upgradeSubscription(
  id: string,
  plan: string,
  immediate: boolean
): Promise<ApiResponse<Subscription>> {
  return fetchApi(`/subscriptions/${id}/upgrade`, {
    method: 'POST',
    body: JSON.stringify({ plan, immediate }),
  });
}

export async function downgradeSubscription(id: string, plan: string): Promise<ApiResponse<Subscription>> {
  return fetchApi(`/subscriptions/${id}/downgrade`, {
    method: 'POST',
    body: JSON.stringify({ plan }),
  });
}

export async function cancelSubscription(
  id: string,
  immediate: boolean,
  totpCode?: string
): Promise<ApiResponse<Subscription>> {
  return fetchApi(`/subscriptions/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ immediate, totpCode }),
  });
}

export async function pauseSubscription(id: string, months: number): Promise<ApiResponse<Subscription>> {
  return fetchApi(`/subscriptions/${id}/pause`, {
    method: 'POST',
    body: JSON.stringify({ months }),
  });
}

export async function resumeSubscription(id: string): Promise<ApiResponse<Subscription>> {
  return fetchApi(`/subscriptions/${id}/resume`, { method: 'POST' });
}

export async function refundSubscription(
  id: string,
  amount: number,
  reason: string,
  totpCode: string
): Promise<ApiResponse<void>> {
  return fetchApi(`/subscriptions/${id}/refund`, {
    method: 'POST',
    body: JSON.stringify({ amount, reason, totpCode }),
  });
}

// ==================== BILLING ====================

export async function getTransactions(
  filters: TransactionFilters = {}
): Promise<ApiResponse<PaginatedResponse<CoinTransaction>>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });
  return fetchApi(`/billing/transactions?${params}`);
}

export async function getWebhooks(page = 1, limit = 50): Promise<ApiResponse<PaginatedResponse<PaymentWebhook>>> {
  return fetchApi(`/billing/webhooks?page=${page}&limit=${limit}`);
}

export async function retryWebhook(id: string): Promise<ApiResponse<void>> {
  return fetchApi(`/billing/webhooks/${id}/retry`, { method: 'POST' });
}

export async function exportTransactions(filters: TransactionFilters = {}): Promise<Blob> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });
  
  const res = await fetch(`${API_BASE}/billing/transactions/export?${params}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Export failed: ${res.status} ${res.statusText}`);
  return res.blob();
}

// ==================== TOOLS ====================

export async function getTools(filters: ToolFilters = {}): Promise<ApiResponse<PaginatedResponse<Tool>>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });
  return fetchApi(`/tools?${params}`);
}

export async function getTool(id: string): Promise<ApiResponse<Tool>> {
  return fetchApi(`/tools/${id}`);
}

export async function updateTool(id: string, data: Partial<Tool>): Promise<ApiResponse<Tool>> {
  return fetchApi(`/tools/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function enableTool(id: string): Promise<ApiResponse<Tool>> {
  return fetchApi(`/tools/${id}/enable`, { method: 'POST' });
}

export async function disableTool(id: string): Promise<ApiResponse<Tool>> {
  return fetchApi(`/tools/${id}/disable`, { method: 'POST' });
}

export async function getToolAnalytics(id: string, period: '24h' | '7d' | '30d' = '7d'): Promise<ApiResponse<{
  executions: { date: string; count: number }[];
  errors: { date: string; count: number }[];
  avgTime: { date: string; ms: number }[];
}>> {
  return fetchApi(`/tools/${id}/analytics?period=${period}`);
}

// ==================== CATEGORIES ====================

export async function getCategories(): Promise<ApiResponse<ToolCategory[]>> {
  return fetchApi('/categories');
}

export async function createCategory(data: Partial<ToolCategory>): Promise<ApiResponse<ToolCategory>> {
  return fetchApi('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCategory(id: string, data: Partial<ToolCategory>): Promise<ApiResponse<ToolCategory>> {
  return fetchApi(`/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(id: string): Promise<ApiResponse<void>> {
  return fetchApi(`/categories/${id}`, { method: 'DELETE' });
}

export async function reorderCategories(ids: string[]): Promise<ApiResponse<void>> {
  return fetchApi('/categories/reorder', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

// ==================== FEATURE FLAGS ====================

export async function getFeatureFlags(): Promise<ApiResponse<FeatureFlag[]>> {
  return fetchApi('/feature-flags');
}

export async function updateFeatureFlag(id: string, data: Partial<FeatureFlag>): Promise<ApiResponse<FeatureFlag>> {
  return fetchApi(`/feature-flags/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function createFeatureFlag(data: Partial<FeatureFlag>): Promise<ApiResponse<FeatureFlag>> {
  return fetchApi('/feature-flags', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteFeatureFlag(id: string): Promise<ApiResponse<void>> {
  return fetchApi(`/feature-flags/${id}`, { method: 'DELETE' });
}

// ==================== SYSTEM CONFIG ====================

export async function getSystemConfig(): Promise<ApiResponse<SystemConfig>> {
  return fetchApi('/config');
}

export async function updateSystemConfig(data: Partial<SystemConfig>): Promise<ApiResponse<SystemConfig>> {
  return fetchApi('/config', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ==================== AUDIT LOG ====================

export async function getAuditLogs(
  filters: AuditFilters = {}
): Promise<ApiResponse<PaginatedResponse<AuditLog>>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });
  return fetchApi(`/audit?${params}`);
}

export async function exportAuditLogs(filters: AuditFilters = {}): Promise<Blob> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });
  
  const res = await fetch(`${API_BASE}/audit/export?${params}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Export failed: ${res.status} ${res.statusText}`);
  return res.blob();
}

// ==================== ADMIN USERS ====================

export async function getAdmins(): Promise<ApiResponse<AdminUser[]>> {
  return fetchApi('/admins');
}

export async function inviteAdmin(email: string, role: string): Promise<ApiResponse<AdminUser>> {
  return fetchApi('/admins/invite', {
    method: 'POST',
    body: JSON.stringify({ email, role }),
  });
}

export async function updateAdminRole(id: string, role: string): Promise<ApiResponse<AdminUser>> {
  return fetchApi(`/admins/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function deleteAdmin(id: string, totpCode: string): Promise<ApiResponse<void>> {
  return fetchApi(`/admins/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ totpCode }),
  });
}

// ==================== PLANS ====================

export async function getPlans(): Promise<ApiResponse<Plan[]>> {
  return fetchApi('/plans');
}

export async function createPlan(data: Partial<Plan>): Promise<ApiResponse<Plan>> {
  return fetchApi('/plans', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePlan(id: string, data: Partial<Plan>): Promise<ApiResponse<Plan>> {
  return fetchApi('/plans', {
    method: 'PATCH',
    body: JSON.stringify({ id, ...data }),
  });
}

// ==================== COIN PACKS ====================

export async function getCoinPacks(): Promise<ApiResponse<CoinPack[]>> {
  return fetchApi('/coin-packs');
}

export async function createCoinPack(data: Partial<CoinPack>): Promise<ApiResponse<CoinPack>> {
  return fetchApi('/coin-packs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCoinPack(id: string, data: Partial<CoinPack>): Promise<ApiResponse<CoinPack>> {
  return fetchApi('/coin-packs', {
    method: 'PATCH',
    body: JSON.stringify({ id, ...data }),
  });
}

export async function deleteCoinPack(id: string): Promise<ApiResponse<void>> {
  return fetchApi('/coin-packs', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
}

// ==================== API KEYS ====================

export async function getApiKeys(page = 1, limit = 25, search?: string): Promise<ApiResponse<PaginatedResponse<ApiKeyRecord>>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set('search', search);
  return fetchApi(`/api-keys?${params}`);
}

export async function revokeApiKey(id: string): Promise<ApiResponse<ApiKeyRecord>> {
  return fetchApi('/api-keys', {
    method: 'PATCH',
    body: JSON.stringify({ id, revokedAt: new Date().toISOString() }),
  });
}

// ==================== 2FA TOTP ====================

export async function setup2FA(): Promise<ApiResponse<{ secret: string; otpauthUrl: string; qrDataUrl: string }>> {
  return fetchApi('/2fa', {
    method: 'POST',
    body: JSON.stringify({ action: 'setup' }),
  });
}

export async function enable2FA(code: string): Promise<ApiResponse<{ enabled: boolean }>> {
  return fetchApi('/2fa', {
    method: 'POST',
    body: JSON.stringify({ action: 'enable', code }),
  });
}

export async function verify2FA(code: string): Promise<ApiResponse<{ verified: boolean }>> {
  return fetchApi('/2fa', {
    method: 'POST',
    body: JSON.stringify({ action: 'verify', code }),
  });
}

export async function disable2FA(code: string): Promise<ApiResponse<{ disabled: boolean }>> {
  return fetchApi('/2fa', {
    method: 'POST',
    body: JSON.stringify({ action: 'disable', code }),
  });
}

export async function get2FAStatus(): Promise<ApiResponse<{ enabled: boolean }>> {
  return fetchApi('/2fa', {
    method: 'POST',
    body: JSON.stringify({ action: 'status' }),
  });
}

// ==================== STREAK TIERS ====================

export async function getStreakTiers(): Promise<ApiResponse<StreakTier[]>> {
  return fetchApi('/streak-tiers');
}

export async function createStreakTier(data: Partial<StreakTier>): Promise<ApiResponse<StreakTier>> {
  return fetchApi('/streak-tiers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateStreakTier(id: string, data: Partial<StreakTier>): Promise<ApiResponse<StreakTier>> {
  return fetchApi(`/streak-tiers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteStreakTier(id: string): Promise<ApiResponse<void>> {
  return fetchApi(`/streak-tiers/${id}`, { method: 'DELETE' });
}

// ==================== REFERRAL CONFIG ====================

export async function getReferralConfig(): Promise<ApiResponse<ReferralConfigEntry[]>> {
  return fetchApi('/referral-config');
}

export async function upsertReferralConfig(data: Partial<ReferralConfigEntry>): Promise<ApiResponse<ReferralConfigEntry>> {
  return fetchApi('/referral-config', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ==================== PLAN LIMITS ====================

export async function getPlanLimits(planId: string): Promise<ApiResponse<PlanLimit[]>> {
  return fetchApi(`/plans/${planId}/limits`);
}

export async function createPlanLimit(data: Partial<PlanLimit>): Promise<ApiResponse<PlanLimit>> {
  return fetchApi('/plan-limits', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePlanLimit(id: string, data: Partial<PlanLimit>): Promise<ApiResponse<PlanLimit>> {
  return fetchApi(`/plan-limits/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deletePlanLimit(id: string): Promise<ApiResponse<void>> {
  return fetchApi(`/plan-limits/${id}`, { method: 'DELETE' });
}

// ==================== PLAN FEATURES ====================

export async function getPlanFeatures(planId: string): Promise<ApiResponse<PlanFeature[]>> {
  return fetchApi(`/plans/${planId}/features`);
}

export async function upsertPlanFeature(data: Partial<PlanFeature>): Promise<ApiResponse<PlanFeature>> {
  return fetchApi('/plan-features', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deletePlanFeature(id: string): Promise<ApiResponse<void>> {
  return fetchApi(`/plan-features/${id}`, { method: 'DELETE' });
}

// ==================== ADMIN SETTINGS ====================

export async function getAdminSettings(category?: string): Promise<ApiResponse<AdminSetting[]>> {
  const params = category ? `?category=${category}` : '';
  return fetchApi(`/admin-settings${params}`);
}

export async function upsertAdminSetting(data: { key: string; value: unknown; description?: string; category?: string }): Promise<ApiResponse<AdminSetting>> {
  return fetchApi('/admin-settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ==================== RATE LIMIT CONFIG ====================

export async function getRateLimitConfigs(): Promise<ApiResponse<RateLimitConfigEntry[]>> {
  return fetchApi('/rate-limit-config');
}

export async function upsertRateLimitConfig(data: Partial<RateLimitConfigEntry>): Promise<ApiResponse<RateLimitConfigEntry>> {
  return fetchApi('/rate-limit-config', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ==================== ANALYTICS ====================

// ==================== B2B PLANS ====================

export async function getB2bPlans(page = 1, limit = 50): Promise<ApiResponse<PaginatedResponse<B2bPlan>>> {
  return fetchApi(`/b2b/plans?page=${page}&limit=${limit}`);
}

export async function createB2bPlan(data: Partial<B2bPlan>): Promise<ApiResponse<B2bPlan>> {
  return fetchApi('/b2b/plans', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateB2bPlan(id: string, data: Partial<B2bPlan>): Promise<ApiResponse<B2bPlan>> {
  return fetchApi('/b2b/plans', { method: 'PATCH', body: JSON.stringify({ id, ...data }) });
}

// ==================== B2B SUITES ====================

export async function getB2bSuites(page = 1, limit = 50): Promise<ApiResponse<PaginatedResponse<B2bSuite>>> {
  return fetchApi(`/b2b/suites?page=${page}&limit=${limit}`);
}

export async function createB2bSuite(data: Partial<B2bSuite>): Promise<ApiResponse<B2bSuite>> {
  return fetchApi('/b2b/suites', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateB2bSuite(id: string, data: Partial<B2bSuite>): Promise<ApiResponse<B2bSuite>> {
  return fetchApi('/b2b/suites', { method: 'PATCH', body: JSON.stringify({ id, ...data }) });
}

// ==================== B2B QUOTAS ====================

export async function getB2bQuotas(params?: { planId?: string; suiteId?: string; page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<B2bPlanQuota>>> {
  const sp = new URLSearchParams();
  if (params?.planId) sp.set('planId', params.planId);
  if (params?.suiteId) sp.set('suiteId', params.suiteId);
  sp.set('page', String(params?.page ?? 1));
  sp.set('limit', String(params?.limit ?? 100));
  return fetchApi(`/b2b/quotas?${sp.toString()}`);
}

export async function upsertB2bQuota(data: { b2bPlanId: string; b2bSuiteId: string; monthlyLimit: number }): Promise<ApiResponse<B2bPlanQuota>> {
  return fetchApi('/b2b/quotas', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateB2bQuota(id: string, monthlyLimit: number): Promise<ApiResponse<B2bPlanQuota>> {
  return fetchApi('/b2b/quotas', { method: 'PATCH', body: JSON.stringify({ id, monthlyLimit }) });
}

// ==================== B2B SUBSCRIPTIONS ====================

export async function getB2bSubscriptions(params?: { page?: number; limit?: number; status?: string; search?: string }): Promise<ApiResponse<PaginatedResponse<B2bSubscription>>> {
  const sp = new URLSearchParams();
  sp.set('page', String(params?.page ?? 1));
  sp.set('limit', String(params?.limit ?? 20));
  if (params?.status) sp.set('status', params.status);
  if (params?.search) sp.set('search', params.search);
  return fetchApi(`/b2b/subscriptions?${sp.toString()}`);
}

export async function createB2bSubscription(data: { userId: string; b2bPlanId: string; billingCycle: string; currentPeriodStart: string; currentPeriodEnd: string; resetDayOfMonth?: number }): Promise<ApiResponse<B2bSubscription>> {
  return fetchApi('/b2b/subscriptions', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateB2bSubscription(id: string, data: Partial<B2bSubscription>): Promise<ApiResponse<B2bSubscription>> {
  return fetchApi('/b2b/subscriptions', { method: 'PATCH', body: JSON.stringify({ id, ...data }) });
}

// ==================== B2B USAGE ====================

export async function getB2bUsage(params?: { userId?: string; suiteId?: string; from?: string; to?: string; page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<B2bUsageRow>>> {
  const sp = new URLSearchParams();
  if (params?.userId) sp.set('userId', params.userId);
  if (params?.suiteId) sp.set('suiteId', params.suiteId);
  if (params?.from) sp.set('from', params.from);
  if (params?.to) sp.set('to', params.to);
  sp.set('page', String(params?.page ?? 1));
  sp.set('limit', String(params?.limit ?? 50));
  return fetchApi(`/b2b/usage?${sp.toString()}`);
}

export async function getAnalyticsOverview(startDate: string, endDate: string): Promise<ApiResponse<AnalyticsOverview>> {
  return fetchApi(`/analytics/overview?startDate=${startDate}&endDate=${endDate}`);
}

export async function getCohortAnalysis(startDate: string, endDate: string, interval: string = 'week'): Promise<ApiResponse<CohortRow[]>> {
  return fetchApi(`/analytics/cohorts?startDate=${startDate}&endDate=${endDate}&interval=${interval}`);
}

export async function getFunnelAnalysis(): Promise<ApiResponse<FunnelData>> {
  return fetchApi('/analytics/funnel');
}

export async function getToolUsageBreakdown(startDate: string, endDate: string, limit = 20): Promise<ApiResponse<ToolUsageRow[]>> {
  return fetchApi(`/analytics/tool-usage?startDate=${startDate}&endDate=${endDate}&limit=${limit}`);
}

export async function getRevenueTimeSeries(startDate: string, endDate: string, interval: string = 'day'): Promise<ApiResponse<RevenueRow[]>> {
  return fetchApi(`/analytics/revenue?startDate=${startDate}&endDate=${endDate}&interval=${interval}`);
}

export async function getChurnAnalysis(daysInactive = 30): Promise<ApiResponse<ChurnData>> {
  return fetchApi(`/analytics/churn?daysInactive=${daysInactive}`);
}

export async function getSystemHealth(): Promise<ApiResponse<SystemHealth>> {
  return fetchApi('/analytics/health');
}

// ==================== CSV EXPORT ====================

export async function exportAnalyticsCSV(
  type: 'cohorts' | 'tool-usage' | 'revenue',
  startDate: string,
  endDate: string,
): Promise<Blob> {
  const res = await fetch(`${API_BASE}/analytics/${type}/export?startDate=${startDate}&endDate=${endDate}&format=csv`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Export failed: ${res.status} ${res.statusText}`);
  return res.blob();
}
