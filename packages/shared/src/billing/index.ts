/**
 * Billing Package Barrel Export
 * HSAFX WORLD - Unified billing system exports
 */

// Types
export type {
  TransactionType,
  CoinTransaction,
  BillableAction,
  ToolCostConfig,
  CoinPack,
  BillingResult,
  LoginRewardConfig,
  UsageRecord,
} from './types';

// Tool costs
export {
  FREE_TOOLS,
  DEFAULT_COSTS_BY_CATEGORY,
  calculateToolCost,
  isToolFree,
  getDefaultCostConfig,
} from './tool-costs';

// Coin packs
export {
  COIN_PACKS,
  LOGIN_REWARD_CONFIG,
  getCoinPack,
  getEffectiveCoins,
  getCostPerCoin,
  getBestValuePack,
} from './coin-packs';

// Validation
export {
  BillingErrorCodes,
  validateSufficientBalance,
  validatePositiveAmount,
  validateTransactionType,
  createBillingError,
  createBillingSuccess,
  formatCoinAmount,
  parseCoinCost,
  calculateTransactionSummary,
} from './validation';
export type { TransactionSummary } from './validation';
