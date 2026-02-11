/**
 * Tool Cost Definitions
 * HSAFX WORLD - Coin costs per tool based on documentation
 */

import type { ToolCostConfig } from './types';

// Tool Group 1: Always Free (Calculator/Reference)
export const FREE_TOOLS: string[] = [
  'gpa-calculator',
  'islamic-inheritance-calculator',
  'islamic-zakat-calculator',
  'timezone-converter',
  'unit-converter',
  'color-converter',
  'number-base-converter',
  'percentage-calculator',
  'bmi-calculator',
  'age-calculator',
  'date-difference-calculator',
  'currency-converter',
  'tip-calculator',
  'mortgage-calculator',
  'loan-calculator',
  'compound-interest-calculator',
  'discount-calculator',
  'fuel-cost-calculator',
  'password-strength-checker',
  'regex-tester',
  'json-validator',
  'xml-validator',
  'yaml-validator',
  'csv-viewer',
  'markdown-previewer',
  'html-previewer',
  'word-counter',
  'character-counter',
  'line-counter',
  'reading-time-estimator',
];

// Default tool costs by category
export const DEFAULT_COSTS_BY_CATEGORY: Record<string, Partial<ToolCostConfig>> = {
  // Text Tools - Lightweight
  'text.basic': {
    baseCost: 0,
    perUnitCost: 0,
    unitType: 'none',
    maxCost: 0,
    freeQuota: -1, // Unlimited
  },
  
  // Text Tools - Advanced
  'text.advanced': {
    baseCost: 1,
    perUnitCost: 0,
    unitType: 'none',
    maxCost: 5,
    freeQuota: 10,
  },
  
  // Data Converters
  'data.converters': {
    baseCost: 1,
    perUnitCost: 1,
    unitType: 'mb',
    maxCost: 10,
    freeQuota: 5,
  },
  
  // Image Processing
  'media.image': {
    baseCost: 2,
    perUnitCost: 1,
    unitType: 'file',
    maxCost: 20,
    freeQuota: 3,
  },
  
  // Video Processing
  'media.video': {
    baseCost: 5,
    perUnitCost: 2,
    unitType: 'mb',
    maxCost: 50,
    freeQuota: 1,
  },
  
  // Audio Processing
  'media.audio': {
    baseCost: 3,
    perUnitCost: 1,
    unitType: 'mb',
    maxCost: 30,
    freeQuota: 2,
  },
  
  // PDF Tools
  'pdf.editor': {
    baseCost: 2,
    perUnitCost: 1,
    unitType: 'page',
    maxCost: 25,
    freeQuota: 5,
  },
  
  // Generators (ID, Code, etc.)
  'generators': {
    baseCost: 1,
    perUnitCost: 0,
    unitType: 'none',
    maxCost: 5,
    freeQuota: 20,
  },
  
  // Calculators - Always Free
  'calculators': {
    baseCost: 0,
    perUnitCost: 0,
    unitType: 'none',
    maxCost: 0,
    freeQuota: -1,
  },
  
  // Logistics/Shipping
  'logistics': {
    baseCost: 5,
    perUnitCost: 1,
    unitType: 'operation',
    maxCost: 50,
    freeQuota: 0,
  },
  
  // Bulk Operations
  'bulk': {
    baseCost: 10,
    perUnitCost: 0.5,
    unitType: 'file',
    maxCost: 100,
    freeQuota: 0,
  },
  
  // Crypto Tools
  'crypto': {
    baseCost: 1,
    perUnitCost: 0,
    unitType: 'none',
    maxCost: 5,
    freeQuota: 10,
  },
  
  // Network Tools
  'network': {
    baseCost: 2,
    perUnitCost: 0,
    unitType: 'none',
    maxCost: 10,
    freeQuota: 5,
  },
  
  // Code Tools
  'code': {
    baseCost: 1,
    perUnitCost: 0,
    unitType: 'none',
    maxCost: 10,
    freeQuota: 10,
  },
};

// Calculate actual cost for a tool execution
export function calculateToolCost(
  config: ToolCostConfig,
  units: number = 1,
  usageCount: number = 0
): number {
  // Check free quota
  if (config.freeQuota === -1) {
    return 0; // Unlimited free
  }
  
  if (usageCount < config.freeQuota) {
    return 0; // Within free quota
  }
  
  // Calculate cost
  let cost = config.baseCost;
  
  if (config.unitType !== 'none' && config.perUnitCost > 0) {
    cost += config.perUnitCost * units;
  }
  
  // Apply cap
  return Math.min(cost, config.maxCost);
}

// Check if tool is free
export function isToolFree(toolSlug: string): boolean {
  return FREE_TOOLS.includes(toolSlug);
}

// Get default cost config for a category
export function getDefaultCostConfig(category: string): Partial<ToolCostConfig> {
  return DEFAULT_COSTS_BY_CATEGORY[category] || {
    baseCost: 1,
    perUnitCost: 0,
    unitType: 'none',
    maxCost: 10,
    freeQuota: 5,
  };
}
