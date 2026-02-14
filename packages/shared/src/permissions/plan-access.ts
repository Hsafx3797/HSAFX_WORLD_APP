/**
 * Plan-Based Feature Access
 * HSAFX WORLD - Defines what features each plan can access
 *
 * Supports both static fallbacks and dynamic DB-backed lookups.
 * Static values are used as defaults; DB overrides take precedence.
 */

import type { UserPlan, FeatureKey, ToolCategory } from './types';

// ════════════════════════════════════════════════════════════════
// STATIC DEFAULTS (used when DB is unavailable or as seed values)
// ════════════════════════════════════════════════════════════════

export const DEFAULT_PLAN_FEATURES: Record<UserPlan, Set<FeatureKey>> = {
  guest: new Set([
    'tools.text.basic',
    'tools.calculators',
  ]),
  free: new Set([
    'tools.text.basic',
    'tools.data.converters',
    'tools.media.image',
    'tools.media.video',
    'tools.media.audio',
    'tools.pdf.editor',
    'tools.generators',
    'tools.calculators',
    'coins.purchase',
    'coins.earn_ads',
  ]),
  pro: new Set([
    'tools.text.basic',
    'tools.text.advanced',
    'tools.data.converters',
    'tools.media.image',
    'tools.media.video',
    'tools.media.audio',
    'tools.pdf.editor',
    'tools.generators',
    'tools.calculators',
    'tools.logistics',
    'tools.bulk',
    'api.access',
    'coins.purchase',
    'coins.earn_ads',
    'experience.ad_free',
    'theme.custom_colors',
  ]),
  advance: new Set([
    'tools.text.basic',
    'tools.text.advanced',
    'tools.data.converters',
    'tools.media.image',
    'tools.media.video',
    'tools.media.audio',
    'tools.pdf.editor',
    'tools.generators',
    'tools.calculators',
    'tools.logistics',
    'tools.bulk',
    'api.access',
    'coins.purchase',
    'coins.earn_ads',
    'experience.ad_free',
    'support.priority',
    'theme.custom_colors',
    'theme.advanced_controls',
  ]),
};

// Keep backward-compatible alias
export const PLAN_FEATURES = DEFAULT_PLAN_FEATURES;

// Tool category to feature key mapping
export const CATEGORY_FEATURE_MAP: Record<ToolCategory, FeatureKey> = {
  'text.basic': 'tools.text.basic',
  'text.advanced': 'tools.text.advanced',
  'data.converters': 'tools.data.converters',
  'media.image': 'tools.media.image',
  'media.video': 'tools.media.video',
  'media.audio': 'tools.media.audio',
  'pdf.editor': 'tools.pdf.editor',
  'generators': 'tools.generators',
  'calculators': 'tools.calculators',
  'logistics': 'tools.logistics',
  'bulk': 'tools.bulk',
  'crypto': 'tools.text.advanced',
  'network': 'tools.text.advanced',
  'math': 'tools.calculators',
  'code': 'tools.text.advanced',
};

// Default usage limits per plan (daily unless specified)
export interface UsageLimits {
  toolExecutions: number;
  fileUploads: number;
  maxFileSize: number; // in MB
  apiCalls: number;
  bulkOperations: number;
}

export const DEFAULT_PLAN_LIMITS: Record<UserPlan, UsageLimits> = {
  guest: {
    toolExecutions: 10,
    fileUploads: 3,
    maxFileSize: 5,
    apiCalls: 0,
    bulkOperations: 0,
  },
  free: {
    toolExecutions: 50,
    fileUploads: 10,
    maxFileSize: 25,
    apiCalls: 0,
    bulkOperations: 0,
  },
  pro: {
    toolExecutions: 500,
    fileUploads: 100,
    maxFileSize: 100,
    apiCalls: 1000,
    bulkOperations: 10,
  },
  advance: {
    toolExecutions: -1, // Unlimited
    fileUploads: -1,
    maxFileSize: 500,
    apiCalls: 10000,
    bulkOperations: -1,
  },
};

// Keep backward-compatible alias
export const PLAN_LIMITS = DEFAULT_PLAN_LIMITS;

// ════════════════════════════════════════════════════════════════
// IN-MEMORY CACHE (populated from DB by server at startup)
// ════════════════════════════════════════════════════════════════

interface PlanAccessCache {
  features: Record<string, Set<string>> | null;
  limits: Record<string, Record<string, number>> | null;
  lastUpdated: number;
}

const cache: PlanAccessCache = {
  features: null,
  limits: null,
  lastUpdated: 0,
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Load plan features from DB rows into cache.
 * Call from server startup or admin update handler.
 */
export function loadPlanFeaturesCache(
  rows: Array<{ planSlug: string; featureKey: string; enabled: boolean }>
): void {
  const map: Record<string, Set<string>> = {};
  for (const row of rows) {
    if (!row.enabled) continue;
    if (!map[row.planSlug]) map[row.planSlug] = new Set();
    map[row.planSlug]!.add(row.featureKey);
  }
  cache.features = map;
  cache.lastUpdated = Date.now();
}

/**
 * Load plan limits from DB rows into cache.
 * Call from server startup or admin update handler.
 */
export function loadPlanLimitsCache(
  rows: Array<{ planSlug: string; limitKey: string; limitValue: number }>
): void {
  const map: Record<string, Record<string, number>> = {};
  for (const row of rows) {
    if (!map[row.planSlug]) map[row.planSlug] = {};
    map[row.planSlug]![row.limitKey] = row.limitValue;
  }
  cache.limits = map;
  cache.lastUpdated = Date.now();
}

/**
 * Invalidate cache (force next access to use static or re-fetch).
 */
export function invalidatePlanCache(): void {
  cache.features = null;
  cache.limits = null;
  cache.lastUpdated = 0;
}

function isCacheValid(): boolean {
  return cache.lastUpdated > 0 && Date.now() - cache.lastUpdated < CACHE_TTL_MS;
}

// ════════════════════════════════════════════════════════════════
// PUBLIC API — reads from cache, falls back to static defaults
// ════════════════════════════════════════════════════════════════

// Check if plan has access to a feature
export function hasPlanFeature(plan: UserPlan, feature: FeatureKey): boolean {
  if (isCacheValid() && cache.features) {
    const cached = cache.features[plan];
    if (cached) return cached.has(feature);
  }
  return DEFAULT_PLAN_FEATURES[plan]?.has(feature) ?? false;
}

// Check if plan can access a tool category
export function canAccessCategory(plan: UserPlan, category: ToolCategory): boolean {
  const featureKey = CATEGORY_FEATURE_MAP[category];
  if (!featureKey) return false;
  return hasPlanFeature(plan, featureKey);
}

// Get all features available for a plan
export function getPlanFeatures(plan: UserPlan): FeatureKey[] {
  if (isCacheValid() && cache.features) {
    const cached = cache.features[plan];
    if (cached) return Array.from(cached) as FeatureKey[];
  }
  return Array.from(DEFAULT_PLAN_FEATURES[plan] || []);
}

// Get the minimum plan required for a feature
export function getMinimumPlanForFeature(feature: FeatureKey): UserPlan {
  const planOrder: UserPlan[] = ['guest', 'free', 'pro', 'advance'];
  for (const plan of planOrder) {
    if (hasPlanFeature(plan, feature)) return plan;
  }
  return 'advance';
}

// Plan hierarchy for comparison
const PLAN_HIERARCHY: Record<UserPlan, number> = {
  guest: 0,
  free: 1,
  pro: 2,
  advance: 3,
};

export function comparePlans(plan1: UserPlan, plan2: UserPlan): number {
  return PLAN_HIERARCHY[plan1] - PLAN_HIERARCHY[plan2];
}

export function isPlanAtLeast(current: UserPlan, required: UserPlan): boolean {
  return comparePlans(current, required) >= 0;
}

// Get usage limit for a plan
export function getPlanLimit(plan: UserPlan, limitType: keyof UsageLimits): number {
  if (isCacheValid() && cache.limits) {
    const cached = cache.limits[plan];
    if (cached && limitType in cached) return cached[limitType] as number;
  }
  return DEFAULT_PLAN_LIMITS[plan]?.[limitType] ?? 0;
}

// Check if limit is unlimited
export function isUnlimited(limit: number): boolean {
  return limit === -1;
}
