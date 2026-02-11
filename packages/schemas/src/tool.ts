/**
 * Tool-related Zod schemas
 * @module @hsafx/schemas/tool
 */

import { z } from 'zod';

/**
 * Tool execution request schema
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

export type ToolExecutionRequest = z.infer<typeof ToolExecutionRequestSchema>;

/**
 * Tool input validation schema
 */
export const ToolInputSchema = z.object({
  name: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'file', 'array', 'object']),
  label: z.string(),
  description: z.string().optional(),
  required: z.boolean(),
  default: z.unknown().optional(),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
      enum: z.array(z.string()).optional(),
      mimeTypes: z.array(z.string()).optional(),
    })
    .optional(),
});

export type ToolInput = z.infer<typeof ToolInputSchema>;

/**
 * Tool output schema
 */
export const ToolOutputSchema = z.object({
  name: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'file', 'array', 'object']),
  description: z.string().optional(),
  mimeType: z.string().optional(),
});

export type ToolOutput = z.infer<typeof ToolOutputSchema>;

/**
 * Tool metadata schema
 */
export const ToolMetadataSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  category: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  }),
  group: z.number().int().min(1).max(5),
  runtime: z.enum(['wasm', 'node', 'python', 'browser']),
  executionMode: z.enum(['client', 'server', 'hybrid']),
  coinCost: z.number().int().min(0),
  isPremium: z.boolean(),
  inputs: z.array(ToolInputSchema),
  outputs: z.array(ToolOutputSchema),
  limits: z.object({
    maxFileSize: z.number().optional(),
    maxDuration: z.number().optional(),
    maxInputLength: z.number().optional(),
  }),
  examples: z
    .array(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        inputs: z.record(z.unknown()),
        expectedOutput: z.unknown().optional(),
      })
    )
    .optional(),
});

export type ToolMetadata = z.infer<typeof ToolMetadataSchema>;
