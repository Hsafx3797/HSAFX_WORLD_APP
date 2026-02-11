/**
 * Tool Execution Service
 * HSAFX WORLD - Unified service for executing tools with billing integration
 */

import type { UserPlan } from '../permissions/types';
import type { ToolCostConfig, BillingResult } from '../billing/types';
import { 
  calculateToolCost, 
  isToolFree, 
  getDefaultCostConfig 
} from '../billing/tool-costs';
import { 
  validateSufficientBalance,
  createBillingError,
  createBillingSuccess 
} from '../billing/validation';
import { canAccessCategory } from '../permissions/plan-access';

// Execution modes
export type ExecutionMode = 'client' | 'server' | 'hybrid';

// Tool runtime environments
export type ToolRuntime = 'wasm' | 'node' | 'python' | 'browser';

// Tool definition for execution
export interface ToolExecutionDef {
  id: string;
  slug: string;
  name: string;
  category: string;
  runtime: ToolRuntime;
  executionMode: ExecutionMode;
  coinCost: number;
  isActive: boolean;
  isPremium: boolean;
}

// Execution context
export interface ExecutionContext {
  userId?: string;
  userPlan: UserPlan;
  coinBalance: number;
  usageCount: number;
  requestId: string;
  timestamp: number;
}

// Execution input
export interface ExecutionInput {
  toolId: string;
  data: string | Record<string, unknown>;
  options?: Record<string, unknown>;
  files?: File[];
}

// Execution result
export interface ExecutionResult {
  success: boolean;
  output?: unknown;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metrics: {
    executionTime: number;
    inputSize: number;
    outputSize: number;
    coinsCost: number;
  };
  billing?: BillingResult;
}

// Pre-execution check result
export interface PreExecutionCheck {
  canExecute: boolean;
  reason?: string;
  coinsCost: number;
  requiresServer: boolean;
  upgradeRequired?: UserPlan;
}

/**
 * Check if user can execute a tool before actually running it
 */
export function checkCanExecuteTool(
  tool: ToolExecutionDef,
  context: ExecutionContext,
  units: number = 1
): PreExecutionCheck {
  // Check if tool is active
  if (!tool.isActive) {
    return {
      canExecute: false,
      reason: 'Tool is currently disabled',
      coinsCost: 0,
      requiresServer: tool.executionMode === 'server',
    };
  }

  // Check plan access
  if (!canAccessCategory(context.userPlan, tool.category as never)) {
    const requiredPlan = getRequiredPlanForTool(tool);
    return {
      canExecute: false,
      reason: `This tool requires ${requiredPlan} plan or higher`,
      coinsCost: 0,
      requiresServer: tool.executionMode === 'server',
      upgradeRequired: requiredPlan,
    };
  }

  // Check if tool is free
  if (isToolFree(tool.slug) || tool.coinCost === 0) {
    return {
      canExecute: true,
      coinsCost: 0,
      requiresServer: tool.executionMode === 'server',
    };
  }

  // Calculate cost
  const costConfig: ToolCostConfig = {
    toolId: tool.id,
    toolName: tool.name,
    baseCost: tool.coinCost,
    perUnitCost: 0,
    unitType: 'none',
    maxCost: tool.coinCost * 10,
    freeQuota: 0,
  };

  const coinsCost = calculateToolCost(costConfig, units, context.usageCount);

  // Check balance
  const balanceCheck = validateSufficientBalance(context.coinBalance, coinsCost);
  if (!balanceCheck.success) {
    return {
      canExecute: false,
      reason: `Insufficient coins. Need ${coinsCost}, have ${context.coinBalance}`,
      coinsCost,
      requiresServer: tool.executionMode === 'server',
    };
  }

  return {
    canExecute: true,
    coinsCost,
    requiresServer: tool.executionMode === 'server',
  };
}

/**
 * Determine required plan for a tool
 */
function getRequiredPlanForTool(tool: ToolExecutionDef): UserPlan {
  if (tool.isPremium) {
    return 'pro';
  }
  
  // Check category requirements
  const advanceCategories = ['logistics', 'bulk'];
  const proCategories = ['text.advanced', 'media.video', 'pdf.editor'];
  
  if (advanceCategories.some(cat => tool.category.includes(cat))) {
    return 'advance';
  }
  
  if (proCategories.some(cat => tool.category.includes(cat))) {
    return 'pro';
  }
  
  return 'free';
}

/**
 * Route tool to appropriate executor
 */
export function determineExecutionPath(
  tool: ToolExecutionDef
): {
  executor: 'client' | 'api' | 'worker';
  endpoint?: string;
} {
  switch (tool.executionMode) {
    case 'client':
      // Client-side execution for WASM and browser tools
      if (tool.runtime === 'wasm' || tool.runtime === 'browser') {
        return { executor: 'client' };
      }
      // Node.js tools still run on client in Next.js API routes
      return { executor: 'api', endpoint: '/api/tools/execute' };

    case 'server':
      // Server-side execution
      if (tool.runtime === 'python') {
        return { executor: 'api', endpoint: '/api/tools/python' };
      }
      return { executor: 'api', endpoint: '/api/tools/execute' };

    case 'hybrid':
      // Hybrid: prefer client for speed, fallback to server
      if (tool.runtime === 'wasm') {
        return { executor: 'client' };
      }
      return { executor: 'api', endpoint: '/api/tools/execute' };

    default:
      return { executor: 'api', endpoint: '/api/tools/execute' };
  }
}

/**
 * Create execution record for tracking
 */
export interface ExecutionRecord {
  id: string;
  toolId: string;
  userId?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  coinsCost: number;
  startTime: number;
  endTime?: number;
  inputHash: string;
  error?: string;
}

export function createExecutionRecord(
  tool: ToolExecutionDef,
  context: ExecutionContext,
  coinsCost: number
): ExecutionRecord {
  return {
    id: context.requestId,
    toolId: tool.id,
    userId: context.userId,
    status: 'pending',
    coinsCost,
    startTime: context.timestamp,
    inputHash: '', // Will be set when executing
  };
}

/**
 * Format tool execution error
 */
export function formatExecutionError(
  code: string,
  message: string,
  details?: unknown
): ExecutionResult {
  return {
    success: false,
    error: { code, message, details },
    metrics: {
      executionTime: 0,
      inputSize: 0,
      outputSize: 0,
      coinsCost: 0,
    },
  };
}

/**
 * Format successful execution result
 */
export function formatExecutionSuccess(
  output: unknown,
  metrics: ExecutionResult['metrics'],
  billing?: BillingResult
): ExecutionResult {
  return {
    success: true,
    output,
    metrics,
    billing,
  };
}
