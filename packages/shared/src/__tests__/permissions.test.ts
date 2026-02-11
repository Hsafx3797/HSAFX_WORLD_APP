/**
 * Tests for packages/shared/src/permissions
 * Plan-based access control — pure functions
 */
import { describe, it, expect } from 'vitest';
import {
  hasPlanFeature,
  canAccessCategory,
  getPlanFeatures,
  getMinimumPlanForFeature,
  comparePlans,
  isPlanAtLeast,
  getPlanLimit,
  isUnlimited,
  PLAN_FEATURES,
  PLAN_LIMITS,
} from '../permissions/plan-access.ts';

// ─── hasPlanFeature ──────────────────────────────────────
describe('hasPlanFeature', () => {
  it('should grant guest access to basic text and calculators', () => {
    expect(hasPlanFeature('guest', 'tools.text.basic')).toBe(true);
    expect(hasPlanFeature('guest', 'tools.calculators')).toBe(true);
  });

  it('should deny guest access to advanced features', () => {
    expect(hasPlanFeature('guest', 'tools.logistics')).toBe(false);
    expect(hasPlanFeature('guest', 'api.access')).toBe(false);
    expect(hasPlanFeature('guest', 'coins.purchase')).toBe(false);
  });

  it('should grant free plan access to media tools', () => {
    expect(hasPlanFeature('free', 'tools.media.image')).toBe(true);
    expect(hasPlanFeature('free', 'tools.media.video')).toBe(true);
    expect(hasPlanFeature('free', 'coins.purchase')).toBe(true);
  });

  it('should deny free plan access to logistics/bulk', () => {
    expect(hasPlanFeature('free', 'tools.logistics')).toBe(false);
    expect(hasPlanFeature('free', 'tools.bulk')).toBe(false);
  });

  it('should grant pro plan access to logistics and API', () => {
    expect(hasPlanFeature('pro', 'tools.logistics')).toBe(true);
    expect(hasPlanFeature('pro', 'api.access')).toBe(true);
    expect(hasPlanFeature('pro', 'experience.ad_free')).toBe(true);
  });

  it('should grant advance plan priority support', () => {
    expect(hasPlanFeature('advance', 'support.priority')).toBe(true);
    expect(hasPlanFeature('advance', 'theme.advanced_controls')).toBe(true);
  });
});

// ─── canAccessCategory ───────────────────────────────────
describe('canAccessCategory', () => {
  it('should allow guest access to calculators', () => {
    expect(canAccessCategory('guest', 'calculators')).toBe(true);
  });

  it('should deny guest access to media', () => {
    expect(canAccessCategory('guest', 'media.image')).toBe(false);
  });

  it('should allow free tier to access data converters', () => {
    expect(canAccessCategory('free', 'data.converters')).toBe(true);
  });

  it('should allow pro to access logistics', () => {
    expect(canAccessCategory('pro', 'logistics')).toBe(true);
  });
});

// ─── getPlanFeatures ─────────────────────────────────────
describe('getPlanFeatures', () => {
  it('should return array of features for a plan', () => {
    const guestFeatures = getPlanFeatures('guest');
    expect(guestFeatures).toContain('tools.text.basic');
    expect(guestFeatures).toContain('tools.calculators');
    expect(guestFeatures.length).toBe(2);
  });

  it('should return more features for higher plans', () => {
    const freeFeatures = getPlanFeatures('free');
    const proFeatures = getPlanFeatures('pro');
    expect(proFeatures.length).toBeGreaterThan(freeFeatures.length);
  });
});

// ─── getMinimumPlanForFeature ────────────────────────────
describe('getMinimumPlanForFeature', () => {
  it('should return guest for basic text', () => {
    expect(getMinimumPlanForFeature('tools.text.basic')).toBe('guest');
  });

  it('should return free for coins.purchase', () => {
    expect(getMinimumPlanForFeature('coins.purchase')).toBe('free');
  });

  it('should return pro for api.access', () => {
    expect(getMinimumPlanForFeature('api.access')).toBe('pro');
  });

  it('should return advance for priority support', () => {
    expect(getMinimumPlanForFeature('support.priority')).toBe('advance');
  });
});

// ─── comparePlans ────────────────────────────────────────
describe('comparePlans', () => {
  it('should return 0 for same plans', () => {
    expect(comparePlans('pro', 'pro')).toBe(0);
  });

  it('should return negative when first is lower', () => {
    expect(comparePlans('free', 'pro')).toBeLessThan(0);
  });

  it('should return positive when first is higher', () => {
    expect(comparePlans('advance', 'free')).toBeGreaterThan(0);
  });
});

// ─── isPlanAtLeast ───────────────────────────────────────
describe('isPlanAtLeast', () => {
  it('should return true when current meets required', () => {
    expect(isPlanAtLeast('pro', 'free')).toBe(true);
    expect(isPlanAtLeast('advance', 'pro')).toBe(true);
    expect(isPlanAtLeast('pro', 'pro')).toBe(true);
  });

  it('should return false when current is below required', () => {
    expect(isPlanAtLeast('guest', 'free')).toBe(false);
    expect(isPlanAtLeast('free', 'pro')).toBe(false);
  });
});

// ─── getPlanLimit ────────────────────────────────────────
describe('getPlanLimit', () => {
  it('should return correct limits for guest', () => {
    expect(getPlanLimit('guest', 'toolExecutions')).toBe(10);
    expect(getPlanLimit('guest', 'maxFileSize')).toBe(5);
    expect(getPlanLimit('guest', 'apiCalls')).toBe(0);
  });

  it('should return unlimited (-1) for advance plan', () => {
    expect(getPlanLimit('advance', 'toolExecutions')).toBe(-1);
    expect(getPlanLimit('advance', 'fileUploads')).toBe(-1);
  });
});

// ─── isUnlimited ─────────────────────────────────────────
describe('isUnlimited', () => {
  it('should return true for -1', () => {
    expect(isUnlimited(-1)).toBe(true);
  });

  it('should return false for any other value', () => {
    expect(isUnlimited(0)).toBe(false);
    expect(isUnlimited(100)).toBe(false);
  });
});
