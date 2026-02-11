/**
 * @hsafx/tool-definitions
 * 
 * Tool Definitions Package - Central repository for tool metadata
 * 
 * This package provides:
 * - Type definitions for tools (ToolMetadata, ToolOption, etc.)
 * - Complete tool registry with 446+ tools
 * - Helper functions for tool lookup
 * 
 * Used by both B2C (web app) and B2B (API) consumers.
 */

// Re-export all types
export * from './types';

// Re-export registry
export {
  toolRegistry,
  toolCounts,
  textToolsRegistry,
  dataToolsRegistry,
  mediaTools,
  generatorTools,
  calculatorTools,
  converterTools,
  specializedTools,
} from './registry';

// Import for helper functions
import { toolRegistry } from './registry';
import type { ToolMetadata, ToolCategory, ToolTier, ToolExecution } from './types';

// =====================================================
// Helper Functions
// =====================================================

/**
 * Get a tool by its unique ID
 */
export function getToolById(id: string): ToolMetadata | undefined {
  return toolRegistry.find(t => t.id === id);
}

/**
 * Get a tool by its URL slug (same as ID in this implementation)
 */
export function getToolBySlug(slug: string): ToolMetadata | undefined {
  // Slug is the same as id, or convert from URL-friendly slug
  return toolRegistry.find(t => t.id === slug || t.id === slug.replace(/-/g, '_'));
}

/**
 * Get all tools in a specific category
 */
export function getToolsByCategory(category: ToolCategory): ToolMetadata[] {
  return toolRegistry.filter(t => t.category === category);
}

/**
 * Get all tools in a specific subcategory
 */
export function getToolsBySubcategory(subcategory: string): ToolMetadata[] {
  return toolRegistry.filter(t => t.subcategory === subcategory);
}

/**
 * Get all tools at a specific tier
 */
export function getToolsByTier(tier: ToolTier): ToolMetadata[] {
  return toolRegistry.filter(t => t.tier === tier);
}

/**
 * Get all tools by execution location
 */
export function getToolsByExecution(execution: ToolExecution): ToolMetadata[] {
  return toolRegistry.filter(t => t.execution === execution);
}

/**
 * Get all tools (alias for toolRegistry)
 */
export function getAllTools(): ToolMetadata[] {
  return toolRegistry;
}

/**
 * Get all free tools (costType === 'free')
 */
export function getFreeTools(): ToolMetadata[] {
  return toolRegistry.filter(t => t.costType === 'free');
}

/**
 * Get all coin-based tools (costType === 'coin')
 */
export function getCoinTools(): ToolMetadata[] {
  return toolRegistry.filter(t => t.costType === 'coin');
}

/**
 * Search tools by name or description
 */
export function searchTools(query: string): ToolMetadata[] {
  const lowerQuery = query.toLowerCase();
  return toolRegistry.filter(t =>
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.id.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get unique categories from registry
 */
export const categories = [...new Set(toolRegistry.map(t => t.category))] as ToolCategory[];

/**
 * Get unique subcategories from registry
 */
export const subcategories = [...new Set(toolRegistry.map(t => t.subcategory).filter(Boolean))] as string[];
