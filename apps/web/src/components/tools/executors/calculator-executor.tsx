'use client';

/**
 * Calculator Executor
 * 
 * Handles all calculator and validator tools.
 * Uses CalculatorLayout with form inputs and results display.
 */

import * as React from 'react';
import type { ToolMetadata } from '@/lib/tools/types';
import { executeClientTool } from '@/lib/tools/executor';
import { CalculatorLayout } from '../calculator-layout';
import type { CalculatorResult } from '../calculator-layout';

// ============================================================================
// TOOL IDS
// ============================================================================

/** Calculator tool IDs */
export const CALCULATOR_TOOL_IDS = new Set([
  // Math calculators
  'percentage-calculator', 'expression-evaluator', 'factorial', 'gcd', 'lcm',
  'prime-checker', 'fibonacci',
  // Financial calculators
  'mortgage-calculator', 'tip-calculator', 'discount-calculator',
  'markup-calculator', 'profit-margin',
  // Health calculators
  'bmi-calculator', 'bmr-calculator', 'calorie-calculator',
  // Date/Time calculators
  'age-calculator', 'date-diff', 'date-add', 'unix-timestamp',
  // Education
  'gpa-calculator', 'timezone-converter',
]);

/** Validator tool IDs */
export const VALIDATOR_TOOL_IDS = new Set([
  'validate-email', 'validate-url', 'validate-uuid', 'validate-ip',
  'validate-credit-card', 'validate-phone', 'validate-iban', 'validate-isbn',
  // Shipping validators
  'container-validator', 'bill-of-lading-validator',
  'booking-number-validator', 'seal-number-validator',
]);

// ============================================================================
// TYPE CHECK
// ============================================================================

/** Check if a tool ID belongs to calculator category */
export function isCalculatorTool(toolId: string): boolean {
  return CALCULATOR_TOOL_IDS.has(toolId);
}

/** Check if a tool ID belongs to validator category */
export function isValidatorTool(toolId: string): boolean {
  return VALIDATOR_TOOL_IDS.has(toolId);
}

// ============================================================================
// PROPS
// ============================================================================

export interface CalculatorExecutorProps {
  tool: ToolMetadata;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CalculatorExecutor({ tool }: CalculatorExecutorProps) {
  // Get form options (use tool options or default input option)
  const formOptions = tool.options || [
    { name: 'value', type: 'string' as const, label: 'Input Value', required: true }
  ];

  // Create calculate function
  const calculate = React.useCallback(
    async (inputs: Record<string, unknown>): Promise<CalculatorResult[]> => {
      const input = JSON.stringify(inputs);
      const result = await executeClientTool(tool.id, input, inputs);
      
      if (!result.success) {
        throw new Error(result.error || 'Calculation failed');
      }

      // Parse output into CalculatorResult array
      if (typeof result.output === 'object' && result.output !== null) {
        const output = result.output as Record<string, unknown>;
        const results: CalculatorResult[] = [];
        
        for (const [key, value] of Object.entries(output)) {
          results.push({
            label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            value: typeof value === 'number' || typeof value === 'string' 
              ? value 
              : JSON.stringify(value),
            primary: key === 'result' || key === 'valid',
          });
        }
        
        return results;
      }
      
      return [{ 
        label: 'Result', 
        value: String(result.output), 
        primary: true 
      }];
    },
    [tool.id]
  );

  return (
    <CalculatorLayout
      toolId={tool.id}
      toolName={tool.name}
      formOptions={formOptions}
      calculate={calculate}
      description={tool.description}
    />
  );
}

export default CalculatorExecutor;
