/**
 * Tests for packages/schemas — Zod schema validation
 * Verifies that validation schemas accept valid data and reject invalid data
 */
import { describe, it, expect } from 'vitest';
import {
  PaginationQuerySchema,
  IdParamSchema,
  SlugParamSchema,
  ApiErrorSchema,
  createApiResponseSchema,
} from '../api';
import {
  PlanTierSchema,
  BillingIntervalSchema,
  SubscriptionStatusSchema,
  CoinTransactionTypeSchema,
  PlanDetailsSchema,
} from '../billing';
import { z } from 'zod';

// ══════════════════════════════════════════════════════════
// API Schemas
// ══════════════════════════════════════════════════════════

describe('PaginationQuerySchema', () => {
  it('should accept valid pagination params', () => {
    const result = PaginationQuerySchema.parse({ page: 1, pageSize: 20 });
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.sortOrder).toBe('desc'); // default
  });

  it('should coerce string numbers', () => {
    const result = PaginationQuerySchema.parse({ page: '3', pageSize: '50' });
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(50);
  });

  it('should apply defaults', () => {
    const result = PaginationQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.sortOrder).toBe('desc');
  });

  it('should reject page < 1', () => {
    expect(() => PaginationQuerySchema.parse({ page: 0 })).toThrow();
  });

  it('should reject pageSize > 100', () => {
    expect(() => PaginationQuerySchema.parse({ pageSize: 200 })).toThrow();
  });
});

describe('IdParamSchema', () => {
  it('should accept valid UUID', () => {
    const result = IdParamSchema.parse({ id: '550e8400-e29b-41d4-a716-446655440000' });
    expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('should reject non-UUID', () => {
    expect(() => IdParamSchema.parse({ id: 'not-a-uuid' })).toThrow();
  });
});

describe('SlugParamSchema', () => {
  it('should accept non-empty slug', () => {
    const result = SlugParamSchema.parse({ slug: 'my-tool' });
    expect(result.slug).toBe('my-tool');
  });

  it('should reject empty slug', () => {
    expect(() => SlugParamSchema.parse({ slug: '' })).toThrow();
  });
});

describe('ApiErrorSchema', () => {
  it('should accept valid error', () => {
    const result = ApiErrorSchema.parse({ code: 'AUTH_1001', message: 'Unauthorized' });
    expect(result.code).toBe('AUTH_1001');
  });

  it('should accept error with metadata', () => {
    const result = ApiErrorSchema.parse({
      code: 'AUTH_1001',
      message: 'Unauthorized',
      metadata: { field: 'email' },
    });
    expect(result.metadata).toEqual({ field: 'email' });
  });
});

describe('createApiResponseSchema', () => {
  it('should create a response schema with data', () => {
    const ResponseSchema = createApiResponseSchema(z.object({ id: z.string() }));
    const result = ResponseSchema.parse({
      success: true,
      data: { id: 'test-123' },
    });
    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('test-123');
  });
});

// ══════════════════════════════════════════════════════════
// Billing Schemas
// ══════════════════════════════════════════════════════════

describe('PlanTierSchema', () => {
  it('should accept valid tiers', () => {
    expect(PlanTierSchema.parse('guest')).toBe('guest');
    expect(PlanTierSchema.parse('free')).toBe('free');
    expect(PlanTierSchema.parse('pro')).toBe('pro');
    expect(PlanTierSchema.parse('advance')).toBe('advance');
  });

  it('should reject invalid tier', () => {
    expect(() => PlanTierSchema.parse('enterprise')).toThrow();
    expect(() => PlanTierSchema.parse('')).toThrow();
  });
});

describe('BillingIntervalSchema', () => {
  it('should accept monthly and yearly', () => {
    expect(BillingIntervalSchema.parse('monthly')).toBe('monthly');
    expect(BillingIntervalSchema.parse('yearly')).toBe('yearly');
  });

  it('should reject invalid intervals', () => {
    expect(() => BillingIntervalSchema.parse('weekly')).toThrow();
  });
});

describe('SubscriptionStatusSchema', () => {
  it('should accept valid statuses', () => {
    expect(SubscriptionStatusSchema.parse('active')).toBe('active');
    expect(SubscriptionStatusSchema.parse('canceled')).toBe('canceled');
    expect(SubscriptionStatusSchema.parse('past_due')).toBe('past_due');
    expect(SubscriptionStatusSchema.parse('trialing')).toBe('trialing');
    expect(SubscriptionStatusSchema.parse('paused')).toBe('paused');
  });

  it('should reject invalid status', () => {
    expect(() => SubscriptionStatusSchema.parse('expired')).toThrow();
  });
});

describe('CoinTransactionTypeSchema', () => {
  it('should accept valid types', () => {
    expect(CoinTransactionTypeSchema.parse('grant')).toBe('grant');
    expect(CoinTransactionTypeSchema.parse('spend')).toBe('spend');
    expect(CoinTransactionTypeSchema.parse('daily_reward')).toBe('daily_reward');
  });

  it('should reject invalid types', () => {
    expect(() => CoinTransactionTypeSchema.parse('bonus')).toThrow();
  });
});
