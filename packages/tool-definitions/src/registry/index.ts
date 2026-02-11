/**
 * Tool Registry Index - Combined exports for all tool categories
 * 
 * This module re-exports all category-specific tool registries and provides
 * unified access to the complete tool catalog.
 */

// Import category-specific registries
import { textToolsRegistry } from './text-tools';
import { dataToolsRegistry } from './data-tools';
import { mediaTools } from './media-tools';
import { generatorTools } from './generator-tools';
import { calculatorTools } from './calculator-tools';
import { converterTools } from './converter-tools';
import { specializedTools } from './specialized-tools';

// Re-export individual registries
export { textToolsRegistry } from './text-tools';
export { dataToolsRegistry } from './data-tools';
export { mediaTools } from './media-tools';
export { generatorTools } from './generator-tools';
export { calculatorTools } from './calculator-tools';
export { converterTools } from './converter-tools';
export { specializedTools } from './specialized-tools';

// Combined tool registry array
export const toolRegistry = [
  ...textToolsRegistry,      // 191 Text tools
  ...dataToolsRegistry,      // 106 Data tools
  ...mediaTools,             // 83 Media tools
  ...generatorTools,         // 38 Generator tools
  ...calculatorTools,        // 9 Calculator tools
  ...converterTools,         // 23 Converter tools
  ...specializedTools,       // 4 Specialized tools
];

// Tool counts by category
export const toolCounts = {
  Text: textToolsRegistry.length,
  Data: dataToolsRegistry.length,
  Media: mediaTools.length,
  Generator: generatorTools.length,
  Calculator: calculatorTools.length,
  Converter: converterTools.length,
  Specialized: specializedTools.length,
  total: toolRegistry.length,
} as const;
