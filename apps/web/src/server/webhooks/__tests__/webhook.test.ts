/**
 * Webhook Handler Tests
 * Tests for idempotency logic and webhook processing patterns.
 *
 * Since the actual route handlers require Stripe/Polar SDK verification,
 * these tests validate the idempotency utilities and error handling in isolation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock the DB module ──────────────────────────────────────

const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();
const mockValues = vi.fn();
const mockOnConflictDoNothing = vi.fn();

vi.mock('@hsafx/db', () => ({
  db: {
    select: (...args: unknown[]) => {
      mockSelect(...args);
      return {
        from: (...fArgs: unknown[]) => {
          mockFrom(...fArgs);
          return {
            where: (...wArgs: unknown[]) => {
              mockWhere(...wArgs);
              return {
                limit: (...lArgs: unknown[]) => {
                  mockLimit(...lArgs);
                  return (mockLimit as ReturnType<typeof vi.fn> & { _returnValue?: unknown[] })._returnValue ?? [];
                },
              };
            },
          };
        },
      };
    },
    insert: (...args: unknown[]) => {
      mockInsert(...args);
      return {
        values: (...vArgs: unknown[]) => {
          mockValues(...vArgs);
          return {
            onConflictDoNothing: (...cArgs: unknown[]) => {
              mockOnConflictDoNothing(...cArgs);
              return Promise.resolve();
            },
          };
        },
      };
    },
  },
  processedWebhooks: { id: 'id', eventId: 'eventId' },
  eq: vi.fn((_field, value) => value),
}));

// Import after mock setup
const { isWebhookProcessed, markWebhookProcessed } = await import(
  '../idempotency'
);

// ─── Tests ────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  // Default: no existing webhook
  (mockLimit as ReturnType<typeof vi.fn> & { _returnValue?: unknown[] })._returnValue = [];
});

describe('isWebhookProcessed', () => {
  it('should return false for new events', async () => {
    (mockLimit as ReturnType<typeof vi.fn> & { _returnValue?: unknown[] })._returnValue = [];
    const result = await isWebhookProcessed('evt_new');
    expect(result).toBe(false);
    expect(mockSelect).toHaveBeenCalled();
  });

  it('should return true for already-processed events', async () => {
    (mockLimit as ReturnType<typeof vi.fn> & { _returnValue?: unknown[] })._returnValue = [{ id: 'existing' }];
    const result = await isWebhookProcessed('evt_existing');
    expect(result).toBe(true);
  });
});

describe('markWebhookProcessed', () => {
  it('should insert a record with eventId, provider, and eventType', async () => {
    await markWebhookProcessed('evt_123', 'stripe', 'checkout.session.completed');
    expect(mockInsert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: 'evt_123',
        provider: 'stripe',
        eventType: 'checkout.session.completed',
      }),
    );
    expect(mockOnConflictDoNothing).toHaveBeenCalled();
  });

  it('should handle polar provider events', async () => {
    await markWebhookProcessed('wh_polar_1', 'polar', 'subscription.created');
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'polar',
        eventType: 'subscription.created',
      }),
    );
  });
});
