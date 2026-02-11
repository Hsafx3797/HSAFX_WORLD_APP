/**
 * Tests for packages/shared/src/errors
 * AppError class and error helpers
 */
import { describe, it, expect } from 'vitest';
import {
  AppError,
  ErrorCode,
  ErrorMessage,
  throwAuthError,
  throwNotFoundError,
  throwValidationError,
  throwRateLimitError,
  throwInternalError,
} from '../errors/index.ts';

describe('ErrorCode', () => {
  it('should have auth codes in 1xxx range', () => {
    expect(ErrorCode.AUTH_INVALID_CREDENTIALS).toBe('AUTH_1001');
    expect(ErrorCode.AUTH_TOKEN_EXPIRED).toBe('AUTH_1007');
  });

  it('should have billing codes in 3xxx range', () => {
    expect(ErrorCode.BILLING_INSUFFICIENT_COINS).toBe('BILLING_3001');
  });

  it('should have tool codes in 4xxx range', () => {
    expect(ErrorCode.TOOL_NOT_FOUND).toBe('TOOL_4001');
    expect(ErrorCode.TOOL_EXECUTION_FAILED).toBe('TOOL_4004');
  });

  it('should have system codes in 9xxx range', () => {
    expect(ErrorCode.INTERNAL_ERROR).toBe('SYSTEM_9001');
  });
});

describe('ErrorMessage', () => {
  it('should have a message for every error code', () => {
    for (const code of Object.values(ErrorCode)) {
      expect(ErrorMessage[code]).toBeDefined();
      expect(typeof ErrorMessage[code]).toBe('string');
      expect(ErrorMessage[code].length).toBeGreaterThan(0);
    }
  });
});

describe('AppError', () => {
  it('should create error with code and default message', () => {
    const err = new AppError(ErrorCode.TOOL_NOT_FOUND);
    expect(err.code).toBe('TOOL_4001');
    expect(err.message).toBe('Tool not found');
    expect(err.statusCode).toBe(500);
    expect(err.name).toBe('AppError');
  });

  it('should accept custom message', () => {
    const err = new AppError(ErrorCode.TOOL_NOT_FOUND, 'Custom message', 404);
    expect(err.message).toBe('Custom message');
    expect(err.statusCode).toBe(404);
  });

  it('should include metadata', () => {
    const err = new AppError(ErrorCode.TOOL_NOT_FOUND, undefined, 404, {
      toolId: 'test-123',
    });
    expect(err.metadata).toEqual({ toolId: 'test-123' });
  });

  it('should serialize to JSON', () => {
    const err = new AppError(ErrorCode.BILLING_INSUFFICIENT_COINS, 'Too poor', 402);
    const json = err.toJSON();
    expect(json.code).toBe('BILLING_3001');
    expect(json.message).toBe('Too poor');
    expect(json.statusCode).toBe(402);
  });

  it('should be an instance of Error', () => {
    const err = new AppError(ErrorCode.INTERNAL_ERROR);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });
});

describe('throwAuthError', () => {
  it('should throw AppError with 401', () => {
    expect(() => throwAuthError(ErrorCode.AUTH_INVALID_CREDENTIALS)).toThrow(AppError);
    try {
      throwAuthError(ErrorCode.AUTH_INVALID_CREDENTIALS);
    } catch (e) {
      expect((e as AppError).statusCode).toBe(401);
    }
  });
});

describe('throwNotFoundError', () => {
  it('should throw AppError with 404', () => {
    try {
      throwNotFoundError(ErrorCode.USER_NOT_FOUND);
    } catch (e) {
      expect((e as AppError).statusCode).toBe(404);
    }
  });
});

describe('throwValidationError', () => {
  it('should throw AppError with 400', () => {
    try {
      throwValidationError(ErrorCode.VALIDATION_FAILED, { field: 'email' });
    } catch (e) {
      expect((e as AppError).statusCode).toBe(400);
      expect((e as AppError).metadata).toEqual({ field: 'email' });
    }
  });
});

describe('throwRateLimitError', () => {
  it('should throw AppError with 429', () => {
    try {
      throwRateLimitError(ErrorCode.RATE_LIMIT_EXCEEDED);
    } catch (e) {
      expect((e as AppError).statusCode).toBe(429);
    }
  });
});

describe('throwInternalError', () => {
  it('should throw AppError with 500', () => {
    try {
      throwInternalError(ErrorCode.INTERNAL_ERROR);
    } catch (e) {
      expect((e as AppError).statusCode).toBe(500);
    }
  });
});
