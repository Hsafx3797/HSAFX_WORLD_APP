/**
 * Error codes and messages
 * Reference: 24_ERROR_HANDLING.md, 47_ERROR_HANDLING_IMPLEMENTATION.md
 */

export const ErrorCode = {
  // Authentication & Authorization (1xxx)
  AUTH_INVALID_CREDENTIALS: 'AUTH_1001',
  AUTH_EXPIRED_SESSION: 'AUTH_1002',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_1003',
  AUTH_EMAIL_NOT_VERIFIED: 'AUTH_1004',
  AUTH_ACCOUNT_DISABLED: 'AUTH_1005',
  AUTH_INVALID_TOKEN: 'AUTH_1006',
  AUTH_TOKEN_EXPIRED: 'AUTH_1007',

  // User Management (2xxx)
  USER_NOT_FOUND: 'USER_2001',
  USER_ALREADY_EXISTS: 'USER_2002',
  USER_INVALID_INPUT: 'USER_2003',

  // Billing & Subscriptions (3xxx)
  BILLING_INSUFFICIENT_COINS: 'BILLING_3001',
  BILLING_PLAN_NOT_FOUND: 'BILLING_3002',
  BILLING_SUBSCRIPTION_INACTIVE: 'BILLING_3003',
  BILLING_PAYMENT_FAILED: 'BILLING_3004',
  BILLING_INVALID_PLAN: 'BILLING_3005',

  // Tool Execution (4xxx)
  TOOL_NOT_FOUND: 'TOOL_4001',
  TOOL_DISABLED: 'TOOL_4002',
  TOOL_LIMIT_EXCEEDED: 'TOOL_4003',
  TOOL_EXECUTION_FAILED: 'TOOL_4004',
  TOOL_INVALID_INPUT: 'TOOL_4005',
  TOOL_FILE_TOO_LARGE: 'TOOL_4006',
  TOOL_UNSUPPORTED_FORMAT: 'TOOL_4007',

  // Rate Limiting (5xxx)
  RATE_LIMIT_EXCEEDED: 'RATE_5001',
  QUOTA_EXCEEDED: 'RATE_5002',

  // File Operations (6xxx)
  FILE_NOT_FOUND: 'FILE_6001',
  FILE_UPLOAD_FAILED: 'FILE_6002',
  FILE_TOO_LARGE: 'FILE_6003',
  FILE_INVALID_TYPE: 'FILE_6004',
  FILE_EXPIRED: 'FILE_6005',

  // External Services (7xxx)
  SERVICE_UNAVAILABLE: 'SERVICE_7001',
  SERVICE_TIMEOUT: 'SERVICE_7002',
  SERVICE_INVALID_RESPONSE: 'SERVICE_7003',

  // Validation (8xxx)
  VALIDATION_FAILED: 'VALIDATION_8001',
  VALIDATION_REQUIRED_FIELD: 'VALIDATION_8002',
  VALIDATION_INVALID_FORMAT: 'VALIDATION_8003',

  // System (9xxx)
  INTERNAL_ERROR: 'SYSTEM_9001',
  NOT_IMPLEMENTED: 'SYSTEM_9002',
  MAINTENANCE_MODE: 'SYSTEM_9003',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Error messages for each code
 */
export const ErrorMessage: Record<ErrorCodeType, string> = {
  // Auth
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCode.AUTH_EXPIRED_SESSION]: 'Your session has expired. Please log in again',
  [ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS]: 'You do not have permission to perform this action',
  [ErrorCode.AUTH_EMAIL_NOT_VERIFIED]: 'Please verify your email address',
  [ErrorCode.AUTH_ACCOUNT_DISABLED]: 'Your account has been disabled',
  [ErrorCode.AUTH_INVALID_TOKEN]: 'Invalid authentication token',
  [ErrorCode.AUTH_TOKEN_EXPIRED]: 'Authentication token has expired',

  // User
  [ErrorCode.USER_NOT_FOUND]: 'User not found',
  [ErrorCode.USER_ALREADY_EXISTS]: 'A user with this email already exists',
  [ErrorCode.USER_INVALID_INPUT]: 'Invalid user data provided',

  // Billing
  [ErrorCode.BILLING_INSUFFICIENT_COINS]: 'Insufficient coins to perform this action',
  [ErrorCode.BILLING_PLAN_NOT_FOUND]: 'Subscription plan not found',
  [ErrorCode.BILLING_SUBSCRIPTION_INACTIVE]: 'Your subscription is inactive',
  [ErrorCode.BILLING_PAYMENT_FAILED]: 'Payment processing failed',
  [ErrorCode.BILLING_INVALID_PLAN]: 'Invalid subscription plan',

  // Tool
  [ErrorCode.TOOL_NOT_FOUND]: 'Tool not found',
  [ErrorCode.TOOL_DISABLED]: 'This tool is currently disabled',
  [ErrorCode.TOOL_LIMIT_EXCEEDED]: 'Tool usage limit exceeded',
  [ErrorCode.TOOL_EXECUTION_FAILED]: 'Tool execution failed',
  [ErrorCode.TOOL_INVALID_INPUT]: 'Invalid input provided to tool',
  [ErrorCode.TOOL_FILE_TOO_LARGE]: 'File size exceeds tool limit',
  [ErrorCode.TOOL_UNSUPPORTED_FORMAT]: 'Unsupported file format',

  // Rate Limit
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded. Please try again later',
  [ErrorCode.QUOTA_EXCEEDED]: 'Usage quota exceeded',

  // File
  [ErrorCode.FILE_NOT_FOUND]: 'File not found',
  [ErrorCode.FILE_UPLOAD_FAILED]: 'File upload failed',
  [ErrorCode.FILE_TOO_LARGE]: 'File size exceeds maximum allowed',
  [ErrorCode.FILE_INVALID_TYPE]: 'Invalid file type',
  [ErrorCode.FILE_EXPIRED]: 'File has expired and been deleted',

  // Service
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
  [ErrorCode.SERVICE_TIMEOUT]: 'Service request timed out',
  [ErrorCode.SERVICE_INVALID_RESPONSE]: 'Invalid response from service',

  // Validation
  [ErrorCode.VALIDATION_FAILED]: 'Validation failed',
  [ErrorCode.VALIDATION_REQUIRED_FIELD]: 'Required field missing',
  [ErrorCode.VALIDATION_INVALID_FORMAT]: 'Invalid format',

  // System
  [ErrorCode.INTERNAL_ERROR]: 'An internal error occurred',
  [ErrorCode.NOT_IMPLEMENTED]: 'Feature not yet implemented',
  [ErrorCode.MAINTENANCE_MODE]: 'System is under maintenance',
};

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCodeType,
    message?: string,
    public readonly statusCode: number = 500,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message || ErrorMessage[code]);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      metadata: this.metadata,
    };
  }
}

/**
 * Helper functions to throw specific errors
 */
export const throwAuthError = (code: ErrorCodeType, metadata?: Record<string, unknown>) => {
  throw new AppError(code, undefined, 401, metadata);
};

export const throwNotFoundError = (code: ErrorCodeType, metadata?: Record<string, unknown>) => {
  throw new AppError(code, undefined, 404, metadata);
};

export const throwValidationError = (
  code: ErrorCodeType,
  metadata?: Record<string, unknown>
) => {
  throw new AppError(code, undefined, 400, metadata);
};

export const throwRateLimitError = (code: ErrorCodeType, metadata?: Record<string, unknown>) => {
  throw new AppError(code, undefined, 429, metadata);
};

export const throwInternalError = (code: ErrorCodeType, metadata?: Record<string, unknown>) => {
  throw new AppError(code, undefined, 500, metadata);
};
