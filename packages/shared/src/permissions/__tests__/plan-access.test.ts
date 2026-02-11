import { describe, it, expect } from 'vitest';
import {
  PLAN_FEATURES,
  PLAN_LIMITS,
  CATEGORY_FEATURE_MAP,
  hasPlanFeature,
  canAccessCategory,
  getPlanFeatures,
  getMinimumPlanForFeature,
  comparePlans,
  isPlanAtLeast,
  getPlanLimit,
  isUnlimited,
} from '../plan-access';
import type { UserPlan, FeatureKey, ToolCategory } from '../types';

// ─── Constants ───────────────────────────────────────────────────────

describe('PLAN_FEATURES', () => {
  it('should define features for all four plans', () => {
    expect(PLAN_FEATURES).toHaveProperty('guest');
    expect(PLAN_FEATURES).toHaveProperty('free');
    expect(PLAN_FEATURES).toHaveProperty('pro');
    expect(PLAN_FEATURES).toHaveProperty('advance');
  });

  it('should use Set instances for each plan', () => {
    for (const plan of ['guest', 'free', 'pro', 'advance'] as UserPlan[]) {
      expect(PLAN_FEATURES[plan]).toBeInstanceOf(Set);
    }
  });

  it('should have increasing feature counts up the hierarchy', () => {
    expect(PLAN_FEATURES.guest.size).toBeLessThan(PLAN_FEATURES.free.size);
    expect(PLAN_FEATURES.free.size).toBeLessThan(PLAN_FEATURES.pro.size);
    expect(PLAN_FEATURES.pro.size).toBeLessThan(PLAN_FEATURES.advance.size);
  });

  it('advance plan should be a superset of pro plan features', () => {
    for (const feature of PLAN_FEATURES.pro) {
      expect(PLAN_FEATURES.advance.has(feature)).toBe(true);
    }
  });

  it('pro plan should be a superset of free plan features', () => {
    for (const feature of PLAN_FEATURES.free) {
      expect(PLAN_FEATURES.pro.has(feature)).toBe(true);
    }
  });
});

describe('PLAN_LIMITS', () => {
  it('should define limits for all four plans', () => {
    for (const plan of ['guest', 'free', 'pro', 'advance'] as UserPlan[]) {
      expect(PLAN_LIMITS[plan]).toBeDefined();
      expect(PLAN_LIMITS[plan]).toHaveProperty('toolExecutions');
      expect(PLAN_LIMITS[plan]).toHaveProperty('fileUploads');
      expect(PLAN_LIMITS[plan]).toHaveProperty('maxFileSize');
      expect(PLAN_LIMITS[plan]).toHaveProperty('apiCalls');
      expect(PLAN_LIMITS[plan]).toHaveProperty('bulkOperations');
    }
  });

  it('advance plan should have unlimited (-1) toolExecutions', () => {
    expect(PLAN_LIMITS.advance.toolExecutions).toBe(-1);
  });

  it('guest plan should have the most restrictive limits', () => {
    expect(PLAN_LIMITS.guest.toolExecutions).toBeLessThan(PLAN_LIMITS.free.toolExecutions);
    expect(PLAN_LIMITS.guest.fileUploads).toBeLessThan(PLAN_LIMITS.free.fileUploads);
    expect(PLAN_LIMITS.guest.maxFileSize).toBeLessThan(PLAN_LIMITS.free.maxFileSize);
  });
});

describe('CATEGORY_FEATURE_MAP', () => {
  it('should map every ToolCategory to a FeatureKey', () => {
    const categories: ToolCategory[] = [
      'text.basic', 'text.advanced', 'data.converters',
      'media.image', 'media.video', 'media.audio',
      'pdf.editor', 'generators', 'calculators',
      'logistics', 'bulk', 'crypto', 'network', 'math', 'code',
    ];
    for (const cat of categories) {
      expect(CATEGORY_FEATURE_MAP[cat]).toBeDefined();
    }
  });
});

// ─── hasPlanFeature ──────────────────────────────────────────────────

describe('hasPlanFeature', () => {
  it('should return true for a feature the plan has', () => {
    expect(hasPlanFeature('guest', 'tools.text.basic')).toBe(true);
  });

  it('should return false for a feature the plan lacks', () => {
    expect(hasPlanFeature('guest', 'api.access')).toBe(false);
  });

  it('advance plan should have every defined feature', () => {
    const allFeatures: FeatureKey[] = [
      'tools.text.basic', 'tools.text.advanced', 'tools.data.converters',
      'tools.media.image', 'tools.media.video', 'tools.media.audio',
      'tools.pdf.editor', 'tools.generators', 'tools.calculators',
      'tools.logistics', 'tools.bulk', 'api.access',
      'coins.purchase', 'coins.earn_ads', 'experience.ad_free',
      'support.priority', 'theme.custom_colors', 'theme.advanced_controls',
    ];
    for (const f of allFeatures) {
      expect(hasPlanFeature('advance', f)).toBe(true);
    }
  });

  it('guest plan should not have pro-only features', () => {
    expect(hasPlanFeature('guest', 'tools.bulk')).toBe(false);
    expect(hasPlanFeature('guest', 'experience.ad_free')).toBe(false);
    expect(hasPlanFeature('guest', 'support.priority')).toBe(false);
  });

  it('free plan should have coins.purchase', () => {
    expect(hasPlanFeature('free', 'coins.purchase')).toBe(true);
  });

  it('free plan should not have api.access', () => {
    expect(hasPlanFeature('free', 'api.access')).toBe(false);
  });
});

// ─── canAccessCategory ───────────────────────────────────────────────

describe('canAccessCategory', () => {
  it('should allow guest to access calculators', () => {
    expect(canAccessCategory('guest', 'calculators')).toBe(true);
  });

  it('should deny guest access to logistics', () => {
    expect(canAccessCategory('guest', 'logistics')).toBe(false);
  });

  it('should allow pro to access bulk operations', () => {
    expect(canAccessCategory('pro', 'bulk')).toBe(true);
  });

  it('should allow free to access media.image', () => {
    expect(canAccessCategory('free', 'media.image')).toBe(true);
  });

  it('should resolve aliased categories (crypto → tools.text.advanced)', () => {
    // crypto maps to tools.text.advanced which is available from pro onward
    expect(canAccessCategory('free', 'crypto')).toBe(false);
    expect(canAccessCategory('pro', 'crypto')).toBe(true);
  });

  it('should resolve math → tools.calculators available from guest', () => {
    expect(canAccessCategory('guest', 'math')).toBe(true);
  });
});

// ─── getPlanFeatures ─────────────────────────────────────────────────

describe('getPlanFeatures', () => {
  it('should return an array', () => {
    expect(Array.isArray(getPlanFeatures('free'))).toBe(true);
  });

  it('advance should return more features than free', () => {
    expect(getPlanFeatures('advance').length).toBeGreaterThan(
      getPlanFeatures('free').length,
    );
  });

  it('guest should return fewer features than any other plan', () => {
    const guestCount = getPlanFeatures('guest').length;
    expect(guestCount).toBeLessThan(getPlanFeatures('free').length);
    expect(guestCount).toBeLessThan(getPlanFeatures('pro').length);
    expect(guestCount).toBeLessThan(getPlanFeatures('advance').length);
  });

  it('should include tools.text.basic for guest', () => {
    expect(getPlanFeatures('guest')).toContain('tools.text.basic');
  });

  it('should include support.priority only for advance', () => {
    expect(getPlanFeatures('advance')).toContain('support.priority');
    expect(getPlanFeatures('pro')).not.toContain('support.priority');
  });
});

// ─── getMinimumPlanForFeature ────────────────────────────────────────

describe('getMinimumPlanForFeature', () => {
  it('should return guest for tools.text.basic', () => {
    expect(getMinimumPlanForFeature('tools.text.basic')).toBe('guest');
  });

  it('should return free for coins.purchase', () => {
    expect(getMinimumPlanForFeature('coins.purchase')).toBe('free');
  });

  it('should return pro for api.access', () => {
    expect(getMinimumPlanForFeature('api.access')).toBe('pro');
  });

  it('should return advance for support.priority', () => {
    expect(getMinimumPlanForFeature('support.priority')).toBe('advance');
  });

  it('should return advance for theme.advanced_controls', () => {
    expect(getMinimumPlanForFeature('theme.advanced_controls')).toBe('advance');
  });

  it('should return guest for tools.calculators', () => {
    expect(getMinimumPlanForFeature('tools.calculators')).toBe('guest');
  });
});

// ─── comparePlans ────────────────────────────────────────────────────

describe('comparePlans', () => {
  it('should return negative when first plan is lower', () => {
    expect(comparePlans('free', 'pro')).toBeLessThan(0);
  });

  it('should return positive when first plan is higher', () => {
    expect(comparePlans('pro', 'free')).toBeGreaterThan(0);
  });

  it('should return 0 for equal plans', () => {
    expect(comparePlans('free', 'free')).toBe(0);
    expect(comparePlans('advance', 'advance')).toBe(0);
  });

  it('guest < free < pro < advance ordering', () => {
    expect(comparePlans('guest', 'free')).toBeLessThan(0);
    expect(comparePlans('free', 'pro')).toBeLessThan(0);
    expect(comparePlans('pro', 'advance')).toBeLessThan(0);
  });

  it('should handle non-adjacent comparisons', () => {
    expect(comparePlans('guest', 'advance')).toBeLessThan(0);
    expect(comparePlans('advance', 'guest')).toBeGreaterThan(0);
  });
});

// ─── isPlanAtLeast ───────────────────────────────────────────────────

describe('isPlanAtLeast', () => {
  it('should return true when current equals required', () => {
    expect(isPlanAtLeast('pro', 'pro')).toBe(true);
  });

  it('should return true when current is above required', () => {
    expect(isPlanAtLeast('pro', 'free')).toBe(true);
    expect(isPlanAtLeast('advance', 'guest')).toBe(true);
  });

  it('should return false when current is below required', () => {
    expect(isPlanAtLeast('free', 'pro')).toBe(false);
    expect(isPlanAtLeast('guest', 'advance')).toBe(false);
  });

  it('advance is at least every plan', () => {
    for (const plan of ['guest', 'free', 'pro', 'advance'] as UserPlan[]) {
      expect(isPlanAtLeast('advance', plan)).toBe(true);
    }
  });

  it('guest is only at least guest', () => {
    expect(isPlanAtLeast('guest', 'guest')).toBe(true);
    expect(isPlanAtLeast('guest', 'free')).toBe(false);
  });
});

// ─── getPlanLimit ────────────────────────────────────────────────────

describe('getPlanLimit', () => {
  it('should return correct toolExecutions for guest', () => {
    expect(getPlanLimit('guest', 'toolExecutions')).toBe(10);
  });

  it('should return correct toolExecutions for free', () => {
    expect(getPlanLimit('free', 'toolExecutions')).toBe(50);
  });

  it('should return -1 (unlimited) toolExecutions for advance', () => {
    expect(getPlanLimit('advance', 'toolExecutions')).toBe(-1);
  });

  it('should return maxFileSize for pro', () => {
    expect(getPlanLimit('pro', 'maxFileSize')).toBe(100);
  });

  it('should return 0 apiCalls for guest', () => {
    expect(getPlanLimit('guest', 'apiCalls')).toBe(0);
  });

  it('should return 1000 apiCalls for pro', () => {
    expect(getPlanLimit('pro', 'apiCalls')).toBe(1000);
  });

  it('should return -1 (unlimited) fileUploads for advance', () => {
    expect(getPlanLimit('advance', 'fileUploads')).toBe(-1);
  });

  it('should return 0 bulkOperations for free', () => {
    expect(getPlanLimit('free', 'bulkOperations')).toBe(0);
  });
});

// ─── isUnlimited ─────────────────────────────────────────────────────

describe('isUnlimited', () => {
  it('should return true for -1', () => {
    expect(isUnlimited(-1)).toBe(true);
  });

  it('should return false for 0', () => {
    expect(isUnlimited(0)).toBe(false);
  });

  it('should return false for a positive number', () => {
    expect(isUnlimited(500)).toBe(false);
  });

  it('should return false for Infinity', () => {
    // Implementation treats only -1 as unlimited
    expect(isUnlimited(Infinity)).toBe(false);
  });

  it('should return false for -2', () => {
    expect(isUnlimited(-2)).toBe(false);
  });

  it('should correctly identify advance plan unlimited limits', () => {
    expect(isUnlimited(getPlanLimit('advance', 'toolExecutions'))).toBe(true);
    expect(isUnlimited(getPlanLimit('advance', 'fileUploads'))).toBe(true);
    expect(isUnlimited(getPlanLimit('advance', 'bulkOperations'))).toBe(true);
  });

  it('should correctly identify advance plan finite limits', () => {
    expect(isUnlimited(getPlanLimit('advance', 'maxFileSize'))).toBe(false);
    expect(isUnlimited(getPlanLimit('advance', 'apiCalls'))).toBe(false);
  });
});
