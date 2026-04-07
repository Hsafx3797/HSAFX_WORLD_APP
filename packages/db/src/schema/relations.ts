import { relations } from 'drizzle-orm';

// ─── Table imports ───────────────────────────────────────────
import { users, userPreferences, userSettings } from './users';
import {
  sessions,
  oauthConnections,
  roles,
  userRoles,
  permissions,
  rolePermissions,
  activityLogs,
  passwordResetTokens,
  emailVerificationTokens,
  refreshTokens,
  userPermissionOverrides,
} from './auth';
import {
  plans,
  planLimits,
  subscriptions,
  coinTransactions,
  invoices,
  payments,
  userCoinWallets,
  coinPacks,
  toolCoinCosts,
  planFeatures,
  planCoinRules,
  loginRewardClaims,
  userDailyRewardCaps,
  processedWebhooks,
  referrals,
  coinEvents,
  userStreaks,
  usageCoinFallbacks,
  invoicePayments,
  paymentMethods,
  coinPurchasePayments,
  planMetadata,
  planUpgradeRules,
  planAuditLogs,
} from './billing';
import {
  toolCategories,
  tools,
  toolLimits,
  toolVersions,
  usageCounters,
  toolExecutions,
  apiKeys,
  anonymousUsage,
  apiRateLimits,
  dailyProTrials,
} from './tools';
import {
  fileUploads,
  asyncJobs,
  notifications,
  favorites,
  featureFlags,
  emailProviderConfig,
  emailTemplates,
  emailLogs,
  adminSettings,
  userOnboarding,
} from './misc';
import {
  apiRequestLogs,
  permissionAuditLogs,
} from './audit';
import {
  b2bPlans,
  b2bSubscriptions,
  b2bSuites,
  b2bPlanQuotas,
  b2bSuiteCategories,
  b2bToolSuiteOverrides,
  b2bUsage,
} from './b2b';
import {
  organizations,
  organizationMembers,
  organizationApiKeys,
} from './organizations';

// ═══════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════

export const usersRelations = relations(users, ({ one, many }) => ({
  // 1:1
  preferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.userId],
  }),
  settings: one(userSettings, {
    fields: [users.id],
    references: [userSettings.userId],
  }),
  coinWallet: one(userCoinWallets, {
    fields: [users.id],
    references: [userCoinWallets.userId],
  }),

  // 1:M auth
  sessions: many(sessions),
  oauthConnections: many(oauthConnections),
  passwordResetTokens: many(passwordResetTokens),
  emailVerificationTokens: many(emailVerificationTokens),
  refreshTokens: many(refreshTokens),

  // 1:M RBAC
  userRoles: many(userRoles),

  // 1:M billing
  subscriptions: many(subscriptions),
  coinTransactions: many(coinTransactions),
  invoices: many(invoices),
  payments: many(payments),
  loginRewardClaims: many(loginRewardClaims),
  userDailyRewardCaps: many(userDailyRewardCaps),
  referralsSent: many(referrals),
  paymentMethods: many(paymentMethods),
  planAuditLogs: many(planAuditLogs),

  // 1:1 billing
  streak: one(userStreaks, {
    fields: [users.id],
    references: [userStreaks.userId],
  }),

  // 1:M tools
  toolExecutions: many(toolExecutions),
  usageCounters: many(usageCounters),
  apiKeys: many(apiKeys),
  dailyProTrials: many(dailyProTrials),

  // 1:M misc
  fileUploads: many(fileUploads),
  asyncJobs: many(asyncJobs),
  notifications: many(notifications),
  favorites: many(favorites),
  activityLogs: many(activityLogs),
  emailLogs: many(emailLogs),

  // 1:1 misc
  onboarding: one(userOnboarding, {
    fields: [users.id],
    references: [userOnboarding.userId],
  }),

  // 1:M B2B
  b2bSubscriptions: many(b2bSubscriptions),
  b2bUsage: many(b2bUsage),

  // 1:M Organizations
  organizationMemberships: many(organizationMembers),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const oauthConnectionsRelations = relations(oauthConnections, ({ one }) => ({
  user: one(users, {
    fields: [oauthConnections.userId],
    references: [users.id],
  }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

export const emailVerificationTokensRelations = relations(emailVerificationTokens, ({ one }) => ({
  user: one(users, {
    fields: [emailVerificationTokens.userId],
    references: [users.id],
  }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

// ─── RBAC ────────────────────────────────────────────────────

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  rolePermissions: many(rolePermissions),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════
// BILLING
// ═══════════════════════════════════════════════════════════════

export const plansRelations = relations(plans, ({ many }) => ({
  limits: many(planLimits),
  features: many(planFeatures),
  coinRules: many(planCoinRules),
  subscriptions: many(subscriptions),
  metadata: many(planMetadata),
  upgradeRulesFrom: many(planUpgradeRules),
  usageCoinFallbacks: many(usageCoinFallbacks),
  auditLogs: many(planAuditLogs),
}));

export const planLimitsRelations = relations(planLimits, ({ one }) => ({
  plan: one(plans, {
    fields: [planLimits.planId],
    references: [plans.id],
  }),
}));

export const planFeaturesRelations = relations(planFeatures, ({ one }) => ({
  plan: one(plans, {
    fields: [planFeatures.planId],
    references: [plans.id],
  }),
}));

export const planCoinRulesRelations = relations(planCoinRules, ({ one }) => ({
  plan: one(plans, {
    fields: [planCoinRules.planId],
    references: [plans.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  plan: one(plans, {
    fields: [subscriptions.planId],
    references: [plans.id],
  }),
  invoices: many(invoices),
}));

export const coinTransactionsRelations = relations(coinTransactions, ({ one }) => ({
  user: one(users, {
    fields: [coinTransactions.userId],
    references: [users.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
  subscription: one(subscriptions, {
    fields: [invoices.subscriptionId],
    references: [subscriptions.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));

export const userCoinWalletsRelations = relations(userCoinWallets, ({ one }) => ({
  user: one(users, {
    fields: [userCoinWallets.userId],
    references: [users.id],
  }),
}));

export const toolCoinCostsRelations = relations(toolCoinCosts, ({ one }) => ({
  tool: one(tools, {
    fields: [toolCoinCosts.toolId],
    references: [tools.id],
  }),
}));

export const loginRewardClaimsRelations = relations(loginRewardClaims, ({ one }) => ({
  user: one(users, {
    fields: [loginRewardClaims.userId],
    references: [users.id],
  }),
  coinTransaction: one(coinTransactions, {
    fields: [loginRewardClaims.coinTransactionId],
    references: [coinTransactions.id],
  }),
}));

export const userDailyRewardCapsRelations = relations(userDailyRewardCaps, ({ one }) => ({
  user: one(users, {
    fields: [userDailyRewardCaps.userId],
    references: [users.id],
  }),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
    relationName: 'referralsSent',
  }),
  referredUser: one(users, {
    fields: [referrals.referredUserId],
    references: [users.id],
    relationName: 'referralsReceived',
  }),
}));

export const coinEventsRelations = relations(coinEvents, ({ one }) => ({
  createdByUser: one(users, {
    fields: [coinEvents.createdBy],
    references: [users.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════
// TOOLS
// ═══════════════════════════════════════════════════════════════

export const toolCategoriesRelations = relations(toolCategories, ({ many }) => ({
  tools: many(tools),
}));

export const toolsRelations = relations(tools, ({ one, many }) => ({
  category: one(toolCategories, {
    fields: [tools.categoryId],
    references: [toolCategories.id],
  }),
  limits: many(toolLimits),
  versions: many(toolVersions),
  executions: many(toolExecutions),
  coinCosts: many(toolCoinCosts),
  anonymousUsage: many(anonymousUsage),
  dailyProTrials: many(dailyProTrials),
  b2bSuiteOverride: many(b2bToolSuiteOverrides),
}));

export const toolLimitsRelations = relations(toolLimits, ({ one }) => ({
  tool: one(tools, {
    fields: [toolLimits.toolId],
    references: [tools.id],
  }),
}));

export const toolVersionsRelations = relations(toolVersions, ({ one }) => ({
  tool: one(tools, {
    fields: [toolVersions.toolId],
    references: [tools.id],
  }),
}));

export const toolExecutionsRelations = relations(toolExecutions, ({ one }) => ({
  user: one(users, {
    fields: [toolExecutions.userId],
    references: [users.id],
  }),
  tool: one(tools, {
    fields: [toolExecutions.toolId],
    references: [tools.id],
  }),
}));

export const usageCountersRelations = relations(usageCounters, ({ one }) => ({
  user: one(users, {
    fields: [usageCounters.userId],
    references: [users.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one, many }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
  rateLimits: many(apiRateLimits),
}));

export const apiRateLimitsRelations = relations(apiRateLimits, ({ one }) => ({
  apiKey: one(apiKeys, {
    fields: [apiRateLimits.apiKeyId],
    references: [apiKeys.id],
  }),
}));

export const anonymousUsageRelations = relations(anonymousUsage, ({ one }) => ({
  tool: one(tools, {
    fields: [anonymousUsage.toolId],
    references: [tools.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════
// MISC
// ═══════════════════════════════════════════════════════════════

export const fileUploadsRelations = relations(fileUploads, ({ one }) => ({
  user: one(users, {
    fields: [fileUploads.userId],
    references: [users.id],
  }),
}));

export const asyncJobsRelations = relations(asyncJobs, ({ one }) => ({
  user: one(users, {
    fields: [asyncJobs.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
}));

export const emailLogsRelations = relations(emailLogs, ({ one }) => ({
  user: one(users, {
    fields: [emailLogs.userId],
    references: [users.id],
  }),
  template: one(emailTemplates, {
    fields: [emailLogs.templateId],
    references: [emailTemplates.id],
  }),
}));

export const emailTemplatesRelations = relations(emailTemplates, ({ many }) => ({
  logs: many(emailLogs),
}));

// ═══════════════════════════════════════════════════════════════
// AUDIT
// ═══════════════════════════════════════════════════════════════

export const apiRequestLogsRelations = relations(apiRequestLogs, ({ one }) => ({
  user: one(users, {
    fields: [apiRequestLogs.userId],
    references: [users.id],
  }),
}));

export const permissionAuditLogsRelations = relations(permissionAuditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [permissionAuditLogs.actorId],
    references: [users.id],
    relationName: 'auditActor',
  }),
  targetUser: one(users, {
    fields: [permissionAuditLogs.targetUserId],
    references: [users.id],
    relationName: 'auditTarget',
  }),
}));

export const userPermissionOverridesRelations = relations(userPermissionOverrides, ({ one }) => ({
  user: one(users, {
    fields: [userPermissionOverrides.userId],
    references: [users.id],
  }),
  permission: one(permissions, {
    fields: [userPermissionOverrides.permissionId],
    references: [permissions.id],
  }),
  grantedByUser: one(users, {
    fields: [userPermissionOverrides.grantedBy],
    references: [users.id],
    relationName: 'overrideGrantor',
  }),
}));

export const adminSettingsRelations = relations(adminSettings, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [adminSettings.updatedBy],
    references: [users.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════
// B2B BILLING
// ═══════════════════════════════════════════════════════════════

export const b2bPlansRelations = relations(b2bPlans, ({ many }) => ({
  subscriptions: many(b2bSubscriptions),
  quotas: many(b2bPlanQuotas),
}));

export const b2bSubscriptionsRelations = relations(b2bSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [b2bSubscriptions.userId],
    references: [users.id],
  }),
  plan: one(b2bPlans, {
    fields: [b2bSubscriptions.b2bPlanId],
    references: [b2bPlans.id],
  }),
}));

export const b2bSuitesRelations = relations(b2bSuites, ({ many }) => ({
  quotas: many(b2bPlanQuotas),
  categories: many(b2bSuiteCategories),
  toolOverrides: many(b2bToolSuiteOverrides),
  usage: many(b2bUsage),
}));

export const b2bPlanQuotasRelations = relations(b2bPlanQuotas, ({ one }) => ({
  plan: one(b2bPlans, {
    fields: [b2bPlanQuotas.b2bPlanId],
    references: [b2bPlans.id],
  }),
  suite: one(b2bSuites, {
    fields: [b2bPlanQuotas.b2bSuiteId],
    references: [b2bSuites.id],
  }),
}));

export const b2bSuiteCategoriesRelations = relations(b2bSuiteCategories, ({ one }) => ({
  suite: one(b2bSuites, {
    fields: [b2bSuiteCategories.b2bSuiteId],
    references: [b2bSuites.id],
  }),
}));

export const b2bToolSuiteOverridesRelations = relations(b2bToolSuiteOverrides, ({ one }) => ({
  tool: one(tools, {
    fields: [b2bToolSuiteOverrides.toolId],
    references: [tools.id],
  }),
  suite: one(b2bSuites, {
    fields: [b2bToolSuiteOverrides.b2bSuiteId],
    references: [b2bSuites.id],
  }),
}));

export const b2bUsageRelations = relations(b2bUsage, ({ one }) => ({
  user: one(users, {
    fields: [b2bUsage.userId],
    references: [users.id],
  }),
  suite: one(b2bSuites, {
    fields: [b2bUsage.b2bSuiteId],
    references: [b2bSuites.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════
// MISSING RELATIONS (P2-14)
// ═══════════════════════════════════════════════════════════════

export const userStreaksRelations = relations(userStreaks, ({ one }) => ({
  user: one(users, {
    fields: [userStreaks.userId],
    references: [users.id],
  }),
}));

export const usageCoinFallbacksRelations = relations(usageCoinFallbacks, ({ one }) => ({
  plan: one(plans, {
    fields: [usageCoinFallbacks.planId],
    references: [plans.id],
  }),
}));

export const invoicePaymentsRelations = relations(invoicePayments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoicePayments.invoiceId],
    references: [invoices.id],
  }),
  payment: one(payments, {
    fields: [invoicePayments.paymentId],
    references: [payments.id],
  }),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({ one }) => ({
  user: one(users, {
    fields: [paymentMethods.userId],
    references: [users.id],
  }),
}));

export const coinPurchasePaymentsRelations = relations(coinPurchasePayments, ({ one }) => ({
  payment: one(payments, {
    fields: [coinPurchasePayments.paymentId],
    references: [payments.id],
  }),
  coinPack: one(coinPacks, {
    fields: [coinPurchasePayments.coinPackId],
    references: [coinPacks.id],
  }),
}));

export const planMetadataRelations = relations(planMetadata, ({ one }) => ({
  plan: one(plans, {
    fields: [planMetadata.planId],
    references: [plans.id],
  }),
}));

export const planUpgradeRulesRelations = relations(planUpgradeRules, ({ one }) => ({
  fromPlan: one(plans, {
    fields: [planUpgradeRules.fromPlanId],
    references: [plans.id],
    relationName: 'upgradeRulesFrom',
  }),
  toPlan: one(plans, {
    fields: [planUpgradeRules.toPlanId],
    references: [plans.id],
    relationName: 'upgradeRulesTo',
  }),
}));

export const planAuditLogsRelations = relations(planAuditLogs, ({ one }) => ({
  plan: one(plans, {
    fields: [planAuditLogs.planId],
    references: [plans.id],
  }),
  changedByUser: one(users, {
    fields: [planAuditLogs.changedBy],
    references: [users.id],
  }),
}));

export const dailyProTrialsRelations = relations(dailyProTrials, ({ one }) => ({
  user: one(users, {
    fields: [dailyProTrials.userId],
    references: [users.id],
  }),
  tool: one(tools, {
    fields: [dailyProTrials.toolId],
    references: [tools.id],
  }),
}));

export const userOnboardingRelations = relations(userOnboarding, ({ one }) => ({
  user: one(users, {
    fields: [userOnboarding.userId],
    references: [users.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════
// ORGANIZATIONS
// ═══════════════════════════════════════════════════════════════

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [organizations.createdBy],
    references: [users.id],
  }),
  members: many(organizationMembers),
  apiKeys: many(organizationApiKeys),
}));

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationMembers.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [organizationMembers.userId],
    references: [users.id],
  }),
}));

export const organizationApiKeysRelations = relations(organizationApiKeys, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationApiKeys.organizationId],
    references: [organizations.id],
  }),
  createdByUser: one(users, {
    fields: [organizationApiKeys.createdBy],
    references: [users.id],
  }),
}));
