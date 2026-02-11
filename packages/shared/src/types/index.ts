import { z } from 'zod';

/**
 * Common utility types
 */

/**
 * API Response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    metadata?: Record<string, unknown>;
  };
  metadata?: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Tool execution request
 */
export interface ToolExecutionRequest {
  toolId: string;
  toolSlug: string;
  inputs: Record<string, unknown>;
  options?: {
    async?: boolean;
    priority?: 'low' | 'normal' | 'high';
  };
}

/**
 * Tool execution response
 */
export interface ToolExecutionResponse {
  executionId: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  result?: unknown;
  error?: string;
  metadata: {
    coinCost: number;
    executionTime?: number;
    startedAt: string;
    completedAt?: string;
  };
}

/**
 * Wallet balance
 */
export interface WalletBalance {
  userId: string;
  balance: number;
  lastTransaction?: {
    id: string;
    amount: number;
    type: string;
    createdAt: string;
  };
}

/**
 * User session context
 */
export interface SessionContext {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  subscription: {
    planId: string;
    planSlug: string;
    status: string;
  };
}

/**
 * Tool metadata (from 40_TOOL_METADATA_STANDARD.md)
 */
export interface ToolMetadata {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  group: number;
  runtime: 'wasm' | 'node' | 'python' | 'browser';
  executionMode: 'client' | 'server' | 'hybrid';
  coinCost: number;
  isPremium: boolean;
  inputs: ToolInput[];
  outputs: ToolOutput[];
  limits: {
    maxFileSize?: number;
    maxDuration?: number;
    maxInputLength?: number;
  };
  examples?: ToolExample[];
}

export interface ToolInput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'file' | 'array' | 'object';
  label: string;
  description?: string;
  required: boolean;
  default?: unknown;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
    mimeTypes?: string[];
  };
}

export interface ToolOutput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'file' | 'array' | 'object';
  description?: string;
  mimeType?: string;
}

export interface ToolExample {
  title: string;
  description?: string;
  inputs: Record<string, unknown>;
  expectedOutput?: unknown;
}

/**
 * Billing plan details
 */
export interface PlanDetails {
  id: string;
  name: string;
  slug: string;
  description: string;
  pricing: {
    monthly: number;
    yearly: number;
  };
  features: {
    coinGrant: number;
    maxFileSize: number;
    apiRateLimit: number;
    priority: string;
    customDomain: boolean;
    analytics: boolean;
    support: string;
  };
  limits: Record<string, number>;
}

/**
 * Usage statistics
 */
export interface UsageStats {
  period: {
    start: string;
    end: string;
  };
  toolExecutions: {
    total: number;
    byGroup: Record<number, number>;
    topTools: Array<{
      toolId: string;
      toolName: string;
      count: number;
    }>;
  };
  coinUsage: {
    spent: number;
    granted: number;
    purchased: number;
    balance: number;
  };
  fileUploads: {
    count: number;
    totalSize: number;
  };
}

/**
 * Zod schemas for validation
 */

export const ToolExecutionRequestSchema = z.object({
  toolId: z.string().uuid(),
  toolSlug: z.string(),
  inputs: z.record(z.unknown()),
  options: z
    .object({
      async: z.boolean().optional(),
      priority: z.enum(['low', 'normal', 'high']).optional(),
    })
    .optional(),
});

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const IdParamSchema = z.object({
  id: z.string().uuid(),
});

export const SlugParamSchema = z.object({
  slug: z.string().min(1),
});
