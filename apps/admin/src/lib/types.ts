/**
 * Admin Panel Types
 * Type definitions for admin panel entities
 */

// ==================== RBAC ====================

export type AdminRole = 'super_admin' | 'admin' | 'support' | 'developer' | 'analyst' | 'billing';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  avatarUrl?: string;
  twoFactorEnabled: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSession {
  adminId: string;
  email: string;
  name: string;
  role: AdminRole;
  twoFactorVerified: boolean;
  expiresAt: string;
}

// ==================== PERMISSIONS ====================

export type PermissionCategory = 
  | 'users' | 'subscriptions' | 'billing' | 'tools' 
  | 'system' | 'admin' | 'audit';

export type Permission = 
  | 'users.view' | 'users.edit' | 'users.ban' | 'users.delete'
  | 'subscriptions.view' | 'subscriptions.manage' | 'subscriptions.refund'
  | 'billing.view' | 'billing.export' | 'billing.adjust'
  | 'tools.view' | 'tools.manage' | 'tools.deploy'
  | 'system.view' | 'system.config' | 'system.logs'
  | 'admin.view' | 'admin.manage' | 'admin.delete'
  | 'audit.view';

export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: ['users.view', 'users.edit', 'users.ban', 'users.delete', 'subscriptions.view', 'subscriptions.manage', 'subscriptions.refund', 'billing.view', 'billing.export', 'billing.adjust', 'tools.view', 'tools.manage', 'tools.deploy', 'system.view', 'system.config', 'system.logs', 'admin.view', 'admin.manage', 'admin.delete', 'audit.view'],
  admin: ['users.view', 'users.edit', 'users.ban', 'subscriptions.view', 'subscriptions.manage', 'billing.view', 'billing.export', 'tools.view', 'tools.manage', 'system.view', 'system.config', 'audit.view'],
  support: ['users.view', 'users.edit', 'subscriptions.view', 'subscriptions.manage', 'billing.view'],
  developer: ['tools.view', 'tools.manage', 'tools.deploy', 'system.view', 'system.config', 'system.logs', 'audit.view'],
  analyst: ['users.view', 'subscriptions.view', 'billing.view', 'billing.export', 'tools.view'],
  billing: ['subscriptions.view', 'billing.view', 'billing.export', 'billing.adjust'],
};

// ==================== USERS ====================

export type UserStatus = 'active' | 'suspended' | 'banned' | 'deleted';
export type UserTier = 'anonymous' | 'free' | 'pro' | 'advance';

export interface User {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  avatarUrl?: string;
  tier: UserTier;
  status: UserStatus;
  emailVerified: boolean;
  coinBalance: number;
  totalSpent: number;
  totalExecutions: number;
  usageCount?: number;
  subscription?: { plan: string };
  lastActiveAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserFilters {
  search?: string;
  status?: UserStatus;
  tier?: UserTier;
  plan?: string;
  authProvider?: string;
  sortBy?: 'createdAt' | 'lastActiveAt' | 'totalSpent' | 'coinBalance';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  toolId?: string;
  toolName?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

// ==================== SUBSCRIPTIONS ====================

export type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'paused' | 'past_due' | 'trialing';
export type SubscriptionPlan = 'free' | 'starter' | 'pro' | 'pro_monthly' | 'pro_yearly' | 'enterprise' | 'advance_monthly' | 'advance_yearly';
export type BillingCycle = 'monthly' | 'yearly' | 'lifetime';

export interface Subscription {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  user?: { name: string; email: string };
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingCycle?: BillingCycle;
  amount?: number;
  provider: 'polar' | 'manual';
  providerId?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  canceledAt?: string;
  pausedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionFilters {
  search?: string;
  status?: SubscriptionStatus;
  plan?: SubscriptionPlan;
  billingCycle?: BillingCycle;
  provider?: 'polar' | 'manual';
  sortBy?: 'createdAt' | 'currentPeriodEnd';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ==================== BILLING ====================

export type TransactionType = 'purchase' | 'reward' | 'deduction' | 'refund' | 'adjustment' | 'bonus' | 'usage';

export interface CoinTransaction {
  id: string;
  userId: string;
  userEmail: string;
  user?: { name: string; email: string };
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  toolId?: string;
  toolName?: string;
  adminId?: string;
  adminEmail?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface TransactionFilters {
  search?: string;
  type?: TransactionType;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'amount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaymentWebhook {
  id: string;
  provider: 'polar' | 'stripe' | 'uploadthing';
  eventType: string;
  status: 'success' | 'failed' | 'retrying';
  payload: Record<string, unknown>;
  response?: string;
  statusCode?: number;
  retryCount: number;
  createdAt: string;
  processedAt?: string;
}

// ==================== TOOLS ====================

export type ToolTier = 'free' | 'pro' | 'premium' | 'advance';
export type ToolCostType = 'free' | 'coin';
export type ToolExecution = 'client' | 'server' | 'hybrid';
export type ToolInputType = 'text' | 'json' | 'file';
export type ToolOutputType = 'text' | 'json' | 'file';

export interface Tool {
  id: string;
  name: string;
  displayName?: string;
  slug?: string;
  description: string;
  category: string;
  categoryId?: string;
  subcategory: string;
  tier: ToolTier;
  costType: ToolCostType;
  coinCost?: number;
  execution: ToolExecution;
  runtime?: string;
  inputType: ToolInputType;
  outputType: ToolOutputType;
  enabled: boolean;
  usageCount?: number;
  usageCount24h: number;
  usageCountTotal: number;
  errorRate: number;
  avgExecutionTime: number;
  createdAt: string;
  updatedAt: string;
}

export interface ToolFilters {
  search?: string;
  category?: string;
  categoryId?: string;
  tier?: ToolTier;
  runtime?: string;
  execution?: ToolExecution;
  enabled?: boolean;
  sortBy?: 'name' | 'usageCount24h' | 'errorRate';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ToolCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  toolCount: number;
  sortOrder?: number;
  order: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== FEATURE FLAGS ====================

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  tier?: UserTier;
  rolloutPercentage?: number;
  percentage?: number;
  targetUserIds?: string[];
  targetPlan?: SubscriptionPlan;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ==================== AUDIT LOG ====================

export type AuditAction = 
  | 'user.create' | 'user.edit' | 'user.ban' | 'user.unban' | 'user.delete'
  | 'subscription.upgrade' | 'subscription.downgrade' | 'subscription.cancel' | 'subscription.refund'
  | 'coin.adjust' | 'coin.refund'
  | 'tool.create' | 'tool.edit' | 'tool.enable' | 'tool.disable'
  | 'config.feature_flag' | 'config.rate_limit' | 'config.setting'
  | 'admin.create' | 'admin.role_change' | 'admin.delete'
  | 'system.deploy' | 'system.maintenance';

export interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  adminRole: AdminRole;
  admin?: { name: string; email: string };
  action: AuditAction;
  targetType: 'user' | 'subscription' | 'tool' | 'config' | 'admin' | 'system';
  targetId?: string;
  targetName?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  metadata?: Record<string, unknown>;
  ip?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditFilters {
  search?: string;
  adminId?: string;
  action?: AuditAction;
  targetType?: string;
  dateFrom?: string;
  dateTo?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// ==================== DASHBOARD METRICS ====================

export interface DashboardMetrics {
  users: {
    total: number;
    active24h: number;
    newToday: number;
    growth: number;
  };
  subscriptions: {
    active: number;
    mrr: number;
    churnRate: number;
    growth: number;
  };
  executions: {
    today: number;
    growth: number;
    errorRate: number;
    avgResponseTime?: number;
  };
  revenue: {
    today: number;
    growth: number;
    coins: number;
  };
  // Additional flattened properties for dashboard
  totalUsers?: number;
  userGrowth?: number;
  activeSubscriptions?: number;
  subscriptionGrowth?: number;
  todayExecutions?: number;
  executionGrowth?: number;
  todayRevenue?: number;
  revenueGrowth?: number;
  freeUsers?: number;
  paidUsers?: number;
  activeTools?: number;
  totalTools?: number;
  errorRate?: number;
  avgResponseTime?: number;
}

export interface TopTool {
  id: string;
  name: string;
  displayName?: string;
  slug?: string;
  category: string;
  executions: number;
  usageCount?: number;
}

export interface RecentError {
  id: string;
  code: string;
  message: string;
  toolId?: string;
  toolName?: string;
  timestamp: string;
}

export interface Alert {
  id: string;
  level: 'critical' | 'high' | 'medium' | 'low' | 'warning';
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'warning';
  title: string;
  message: string;
  acknowledged: boolean;
  createdAt: string;
}

// ==================== SYSTEM CONFIG ====================

export interface SystemConfig {
  siteName?: string;
  supportEmail?: string;
  adminEmail?: string;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  loginReward: {
    coinsPerReward: number;
    dailyCoinCap: number;
    hourlyCooldownMinutes: number;
  };
  anonymousLimits: {
    textTools: number;
    codeTools: number;
    fileTools: number;
    generators: number;
    requireCaptchaForVPN: boolean;
  };
  rateLimits: {
    global: number;
    anonymous: number;
    guest?: number;
    free: number;
    starter?: number;
    pro: number;
    enterprise?: number;
    lifetime?: number;
    advance: number;
  };
  coinRewards?: {
    enabled?: boolean;
    signup: number;
    referral: number;
    dailyLogin: number;
    adWatch: number;
    rewardPerAd?: number;
    dailyLimit?: number;
    cooldownSeconds?: number;
    signupBonus?: number;
  };
  notifications?: {
    email: boolean;
    push: boolean;
    slack: boolean;
    webhook: boolean;
    errorAlerts?: boolean;
    newUserAlerts?: boolean;
  };
  security?: {
    twoFactorRequired?: boolean;
    sessionTimeout?: number;
    maxLoginAttempts?: number;
    passwordMinLength?: number;
    ipAllowlist?: boolean;
    require2FA?: boolean;
  };
  maintenance: {
    enabled: boolean;
    message?: string;
    allowedIPs?: string[];
  };
}

// ==================== DASHBOARD ANALYTICS (Charts) ====================

export interface DashboardAnalytics {
  userGrowth: { date: string; users: number }[];
  executionTrend: { date: string; executions: number; errors: number }[];
  revenueTrend: { date: string; revenue: number }[];
  conversionFunnel: { name: string; value: number }[];
}

// ==================== API RESPONSES ====================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// ==================== PLANS ====================

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  priceMonthlyCents?: number;
  priceYearlyCents?: number;
  coinGrant: number;
  isActive: boolean;
  polarProductId?: string;
  metadata?: Record<string, unknown>;
  limits?: PlanLimit[];
  createdAt: string;
  updatedAt: string;
}

export interface PlanLimit {
  id: string;
  planId: string;
  limitKey: string;
  limitValue: number;
  unit?: string;
  description?: string;
}

// ==================== COIN PACKS ====================

export interface CoinPack {
  id: string;
  name: string;
  coins: number;
  priceInCents: number;
  bonusCoins: number;
  isActive: boolean;
  sortOrder: number;
}

// ==================== API KEYS ====================

export interface ApiKeyRecord {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  name: string;
  keyPrefix: string;
  lastUsed?: string;
  expiresAt?: string;
  isActive: boolean;
  rateLimitTier: string;
  createdAt: string;
  revokedAt?: string;
}

// ==================== STREAK TIERS ====================

export interface StreakTier {
  id: string;
  minDays: number;
  maxDays?: number | null;
  name: string;
  coinsReward: number;
  badgeIcon?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== REFERRAL CONFIG ====================

export interface ReferralConfigEntry {
  id: string;
  key: string;
  value: number;
  description?: string | null;
  isActive: boolean;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ==================== RATE LIMIT CONFIG ====================

export interface RateLimitConfigEntry {
  id: string;
  planSlug: string;
  endpoint: string;
  requestsPerMinute: number;
  requestsPerHour?: number | null;
  requestsPerDay?: number | null;
  burstLimit?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== PLAN FEATURE ====================

export interface PlanFeature {
  id: string;
  planId: string;
  featureKey: string;
  enabled: boolean;
  limitValue?: number | null;
  metadata?: Record<string, unknown> | null;
}

// ==================== ADMIN SETTING ====================

export interface AdminSetting {
  id: string;
  key: string;
  value: unknown;
  description?: string | null;
  category?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ==================== ANALYTICS ====================

export interface AnalyticsOverview {
  userGrowth: { total: number; newInRange: number };
  executions: { total: number; inRange: number };
  revenue: { total: number; inRange: number };
}

export interface CohortRow {
  cohort: string;
  users_count: number;
  active_users: number;
}

export interface FunnelData {
  steps: Array<{ name: string; count: number }>;
}

export interface ToolUsageRow {
  toolId: string;
  toolName: string;
  categoryName: string;
  count: number;
  uniqueUsers: number;
}

export interface RevenueRow {
  period: string;
  revenue: number;
  transactions: number;
}

export interface ChurnData {
  totalUsers: number;
  activeUsers: number;
  churnedUsers: number;
  churnRate: string;
  daysInactive: number;
}

export interface SystemHealth {
  recentExecutions: number;
  avgResponseTime: number;
  errorRate: string;
  timestamp: string;
}
