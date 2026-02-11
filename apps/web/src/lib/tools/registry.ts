/**
 * Tool Metadata Registry - Re-export from @hsafx/tool-definitions
 * 
 * This file re-exports the tool registry from the shared package.
 * The full registry is now maintained in packages/tool-definitions/
 * to support both B2C (web) and B2B (API) consumers.
 * 
 * Tool Categories:
 * - Text tools (191)
 * - Data tools (106)
 * - Media tools (83)
 * - Generator tools (38)
 * - Calculator tools (9)
 * - Converter tools (23)
 * - Specialized tools (4)
 */

// Re-export everything from the shared package
export {
  // Main registry
  toolRegistry,
  toolCounts,
  
  // Category-specific registries
  textToolsRegistry,
  dataToolsRegistry,
  mediaTools,
  generatorTools,
  calculatorTools,
  converterTools,
  specializedTools,
  
  // Helper functions
  getToolById,
  getToolBySlug,
  getToolsByCategory,
  getToolsBySubcategory,
  getToolsByTier,
  getToolsByExecution,
  getAllTools,
  getFreeTools,
  getCoinTools,
  searchTools,
  
  // Category/subcategory lists
  categories,
  subcategories,
} from '@hsafx/tool-definitions';
