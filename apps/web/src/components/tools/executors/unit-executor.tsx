'use client';

/**
 * Unit Executor
 * 
 * Handles all unit conversion tools.
 * Uses UnitConverterLayout with category-based conversion.
 */

import * as React from 'react';
import type { ToolMetadata } from '@/lib/tools/types';
import { UnitConverterLayout } from '../unit-converter-layout';

// ============================================================================
// TOOL IDS
// ============================================================================

/** Unit converter tool IDs */
export const UNIT_TOOL_IDS = new Set([
  'length-converter', 'weight-converter', 'temperature-converter', 'volume-converter',
  'area-converter', 'speed-converter', 'data-storage-converter', 'time-converter',
  'pressure-converter', 'energy-converter', 'power-converter', 'frequency-converter',
  'electric-converter', 'angle-converter', 'force-converter', 'torque-converter',
  'fuel-consumption-converter', 'radiation-converter', 'density-converter',
  'illumination-converter', 'magnetic-converter', 'cooking-converter', 'paper-size-converter',
]);

// ============================================================================
// TYPE CHECK
// ============================================================================

/** Check if a tool ID belongs to unit converter category */
export function isUnitTool(toolId: string): boolean {
  return UNIT_TOOL_IDS.has(toolId);
}

// ============================================================================
// CATEGORY MAPPING
// ============================================================================

/** Map tool ID to unit category */
const UNIT_CATEGORY_MAP: Record<string, string> = {
  'length-converter': 'length',
  'weight-converter': 'weight',
  'temperature-converter': 'temperature',
  'volume-converter': 'volume',
  'area-converter': 'area',
  'speed-converter': 'speed',
  'data-storage-converter': 'data',
  'time-converter': 'time',
  'pressure-converter': 'pressure',
  'energy-converter': 'energy',
  'power-converter': 'power',
  'frequency-converter': 'frequency',
  'electric-converter': 'electric',
  'angle-converter': 'angle',
  'force-converter': 'force',
  'torque-converter': 'torque',
  'fuel-consumption-converter': 'fuel',
  'radiation-converter': 'radiation',
  'density-converter': 'density',
  'illumination-converter': 'illumination',
  'magnetic-converter': 'magnetic',
  'cooking-converter': 'cooking',
  'paper-size-converter': 'paper',
};

/** Get unit category for a tool */
export function getUnitCategory(toolId: string): string {
  return UNIT_CATEGORY_MAP[toolId] || 'length';
}

// ============================================================================
// PROPS
// ============================================================================

export interface UnitExecutorProps {
  tool: ToolMetadata;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function UnitExecutor({ tool }: UnitExecutorProps) {
  const category = getUnitCategory(tool.id);

  return (
    <UnitConverterLayout defaultCategory={category} />
  );
}

export default UnitExecutor;
