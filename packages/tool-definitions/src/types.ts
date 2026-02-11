/**
 * Tool Definitions Package - Core Types
 * 
 * This package provides type definitions and metadata for all 446+ tools
 * in the HSAFX World App. It's shared between B2C (web) and B2B (API).
 */

// =====================================================
// Tool Category Types
// =====================================================

export type ToolCategory =
  | 'Text'
  | 'Data'
  | 'Media'
  | 'Generator'
  | 'Calculator'
  | 'Converter'
  | 'Validator'
  | 'Specialized';

export type ToolTier = 'free' | 'pro' | 'advance';

export type ToolCostType = 'free' | 'coin' | 'subscription';

export type ToolExecution = 'client' | 'server' | 'hybrid';

export type ToolInputType = 'text' | 'file' | 'url' | 'json' | 'multiple';

export type ToolOutputType = 'text' | 'file' | 'json' | 'preview';

// =====================================================
// Tool Option Types
// =====================================================

export type ToolOptionType =
  | 'string'
  | 'text'
  | 'number'
  | 'boolean'
  | 'checkbox'
  | 'select'
  | 'range'
  | 'textarea'
  | 'date'
  | 'color';

export interface ToolOptionChoice {
  value: string | number;
  label: string;
}

export interface ToolOption {
  name: string;
  type: ToolOptionType;
  label: string;
  description?: string;
  placeholder?: string;
  default?: unknown;
  defaultValue?: unknown;
  required?: boolean;
  options?: ToolOptionChoice[];
  min?: number;
  max?: number;
  step?: number;
  maxLength?: number;
}

// =====================================================
// Tool Example Types
// =====================================================

export interface ToolExample {
  input: string;
  output: string;
  options?: Record<string, unknown>;
}

// =====================================================
// Tool Metadata Interface
// =====================================================

export interface ToolMetadata {
  /** Unique tool identifier (e.g., 'text-uppercase', 'json-to-yaml') */
  id: string;
  
  /** Display name (e.g., 'Uppercase Converter') */
  name: string;
  
  /** Short description for listings */
  description: string;
  
  /** Main category for routing */
  category: ToolCategory;
  
  /** Subcategory for organization */
  subcategory?: string;
  
  /** Access tier: free, pro, advance */
  tier: ToolTier;
  
  /** Billing type: free, coin, subscription */
  costType: ToolCostType;
  
  /** Coin cost if costType is 'coin' */
  coinCost?: number;
  
  /** Execution location: client, server, hybrid */
  execution: ToolExecution;
  
  /** Expected input type */
  inputType: ToolInputType;
  
  /** Expected output type */
  outputType: ToolOutputType;
  
  /** Tool-specific options/configuration */
  options?: ToolOption[];
  
  /** Usage examples */
  examples?: ToolExample[];
  
  /** Flag for new tools */
  isNew?: boolean;
  
  /** Flag for popular tools */
  popular?: boolean;
  
  /** SEO keywords for search */
  keywords?: string[];
  
  /** Related tool IDs */
  relatedTools?: string[];
}

// =====================================================
// Tool Execution Types (for consumers)
// =====================================================

export interface ToolExecutionResult {
  success: boolean;
  output?: string | ArrayBuffer | Record<string, unknown>;
  error?: string;
  duration?: number;
  coinCost?: number;
}

export interface ToolExecutionContext {
  userId?: string;
  isAuthenticated: boolean;
  tier: 'guest' | 'free' | 'pro' | 'advance';
  coinsAvailable: number;
}

// =====================================================
// WASM Module Interface (for Text tools)
// =====================================================

export interface TextToolsModule {
  uppercase: (text: string) => string;
  lowercase: (text: string) => string;
  title_case: (text: string) => string;
  camel_case: (text: string) => string;
  pascal_case: (text: string) => string;
  snake_case: (text: string) => string;
  kebab_case: (text: string) => string;
  constant_case: (text: string) => string;
  [key: string]: ((text: string, ...args: unknown[]) => string | number | boolean) | undefined;
}
