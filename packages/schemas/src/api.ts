/**
 * API-related Zod schemas
 * @module @hsafx/schemas/api
 */

import { z } from 'zod';

/**
 * Pagination query parameters schema
 */
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

/**
 * ID parameter schema
 */
export const IdParamSchema = z.object({
  id: z.string().uuid(),
});

export type IdParam = z.infer<typeof IdParamSchema>;

/**
 * Slug parameter schema
 */
export const SlugParamSchema = z.object({
  slug: z.string().min(1),
});

export type SlugParam = z.infer<typeof SlugParamSchema>;

/**
 * API error schema
 */
export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

/**
 * API response wrapper schema factory
 */
export const createApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: ApiErrorSchema.optional(),
    metadata: z
      .object({
        timestamp: z.string(),
        requestId: z.string().optional(),
      })
      .optional(),
  });

/**
 * Paginated response schema factory
 */
export const createPaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    pagination: z.object({
      page: z.number(),
      pageSize: z.number(),
      totalItems: z.number(),
      totalPages: z.number(),
      hasNext: z.boolean(),
      hasPrev: z.boolean(),
    }),
  });
