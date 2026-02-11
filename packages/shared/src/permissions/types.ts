/**
 * CASL Ability Types
 * HSAFX WORLD - Type definitions for permission system
 */

// User plan types
export type UserPlan = 'guest' | 'free' | 'pro' | 'advance';

// Admin roles
export type AdminRole = 
  | 'super_admin'
  | 'admin'
  | 'support_manager'
  | 'support_agent'
  | 'content_manager'
  | 'analyst'
  | 'auditor';

// Tool categories
export type ToolCategory =
  | 'text.basic'
  | 'text.advanced'
  | 'data.converters'
  | 'media.image'
  | 'media.video'
  | 'media.audio'
  | 'pdf.editor'
  | 'generators'
  | 'calculators'
  | 'logistics'
  | 'bulk'
  | 'crypto'
  | 'network'
  | 'math'
  | 'code';

// Feature keys for plan-based access
export type FeatureKey =
  | 'tools.text.basic'
  | 'tools.text.advanced'
  | 'tools.data.converters'
  | 'tools.media.image'
  | 'tools.media.video'
  | 'tools.media.audio'
  | 'tools.pdf.editor'
  | 'tools.generators'
  | 'tools.calculators'
  | 'tools.logistics'
  | 'tools.bulk'
  | 'api.access'
  | 'coins.purchase'
  | 'coins.earn_ads'
  | 'experience.ad_free'
  | 'support.priority'
  | 'theme.custom_colors'
  | 'theme.advanced_controls';

// Admin permission keys
export type AdminPermission =
  // User Management
  | 'users.list'
  | 'users.view'
  | 'users.create'
  | 'users.update'
  | 'users.delete'
  | 'users.ban'
  | 'users.impersonate'
  // Subscription Management
  | 'subscriptions.view'
  | 'subscriptions.modify'
  | 'subscriptions.cancel'
  | 'subscriptions.refund'
  // Coin Management
  | 'coins.view'
  | 'coins.grant'
  | 'coins.revoke'
  | 'coins.packs.manage'
  // Tool Management
  | 'tools.list'
  | 'tools.view'
  | 'tools.create'
  | 'tools.update'
  | 'tools.delete'
  | 'tools.toggle'
  | 'tools.costs.manage'
  // Plan Management
  | 'plans.view'
  | 'plans.modify'
  | 'plans.features.manage'
  | 'plans.limits.manage'
  // System Configuration
  | 'system.config.view'
  | 'system.config.modify'
  | 'system.feature_flags.manage'
  | 'system.maintenance'
  // Role Management
  | 'roles.view'
  | 'roles.assign'
  | 'roles.modify'
  | 'roles.permissions.manage'
  // Audit & Analytics
  | 'audit.view'
  | 'audit.export'
  | 'audit.retention.manage'
  | 'analytics.dashboard'
  | 'analytics.reports'
  | 'analytics.export'
  // API Management
  | 'api.keys.view'
  | 'api.keys.create'
  | 'api.keys.revoke'
  | 'api.rate_limits.manage';

// Subject types for CASL
export interface Tool {
  id: string;
  category: ToolCategory;
  tier: UserPlan;
  coinCost: number;
}

export interface User {
  id: string;
  email: string;
  plan: UserPlan;
  role?: AdminRole;
  isBanned: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: UserPlan;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';
}

export interface Coins {
  userId: string;
  balance: number;
}

export interface AdminUser {
  id: string;
  email: string;
  roles: AdminRole[];
  permissions: AdminPermission[];
}

// CASL subject types union
export type AppSubjects = 
  | 'Tool'
  | 'User'
  | 'Subscription'
  | 'Coins'
  | 'Plan'
  | 'System'
  | 'Role'
  | 'Audit'
  | 'Analytics'
  | 'Api'
  | 'all'
  | Tool
  | User
  | Subscription;

// Action types
export type UserAction = 
  | 'use'
  | 'view'
  | 'purchase'
  | 'earn'
  | 'access';

export type AdminAction =
  | 'list'
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'ban'
  | 'impersonate'
  | 'modify'
  | 'cancel'
  | 'refund'
  | 'grant'
  | 'revoke'
  | 'toggle'
  | 'assign'
  | 'export'
  | 'manage';

export type AppAction = UserAction | AdminAction;
