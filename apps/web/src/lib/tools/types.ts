/**
 * Tool Types - Re-export from @hsafx/tool-definitions
 * 
 * All tool-related types are now maintained in the shared package
 * to ensure consistency between B2C (web) and B2B (API) consumers.
 */

// Re-export all types from the shared package
export type {
  ToolCategory,
  ToolTier,
  ToolCostType,
  ToolExecution,
  ToolInputType,
  ToolOutputType,
  ToolOptionType,
  ToolOptionChoice,
  ToolOption,
  ToolExample,
  ToolMetadata,
  ToolExecutionResult,
  ToolExecutionContext,
  TextToolsModule,
} from '@hsafx/tool-definitions';
