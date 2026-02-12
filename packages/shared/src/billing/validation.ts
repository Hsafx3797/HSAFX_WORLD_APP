/**
 * Billing Validation
 * HSAFX WORLD - Validation functions for billing operations
 */

import type { BillingResult, TransactionType } from './types';

// Validate sufficient balance
export function validateSufficientBalance(
  currentBalance: number,
  requiredAmount: number
): BillingResult {
  if (currentBalance < requiredAmount) {
    return {
      success: false,
      error: 'Insufficient coin balance',
      errorCode: 'BILLING_3001',
    };
  }
  
  return { success: true };
}

// Validate positive amount
export function validatePositiveAmount(amount: number): BillingResult {
  if (amount <= 0) {
    return {
      success: false,
      error: 'Amount must be positive',
      errorCode: 'VALIDATION_8001',
    };
  }
  
  return { success: true };
}

// Validate transaction type
export function validateTransactionType(type: string): type is TransactionType {
  const validTypes: TransactionType[] = [
    'grant', 'purchase', 'spend', 'refund', 
    'adjustment', 'reward', 'referral'
  ];
  return validTypes.includes(type as TransactionType);
}

// Billing error codes
export const BillingErrorCodes = {
  INSUFFICIENT_COINS: 'BILLING_3001',
  PLAN_NOT_FOUND: 'BILLING_3002',
  SUBSCRIPTION_INACTIVE: 'BILLING_3003',
  PAYMENT_FAILED: 'BILLING_3004',
  INVALID_PLAN: 'BILLING_3005',
  DAILY_LIMIT_REACHED: 'BILLING_3006',
  COOLDOWN_ACTIVE: 'BILLING_3007',
  INVALID_PACK: 'BILLING_3008',
  TRANSACTION_FAILED: 'BILLING_3009',
} as const;

// Create billing error
export function createBillingError(
  code: keyof typeof BillingErrorCodes,
  message: string
): BillingResult {
  return {
    success: false,
    error: message,
    errorCode: BillingErrorCodes[code],
  };
}

// Create billing success
export function createBillingSuccess(
  transactionId: string,
  newBalance: number
): BillingResult {
  return {
    success: true,
    transactionId,
    newBalance,
  };
}

// Format coin amount for display
export function formatCoinAmount(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toString();
}

// Parse coin cost string (e.g., "5 coins" -> 5)
export function parseCoinCost(costString: string): number {
  const match = costString.match(/(\d+)/);
  return match && match[1] ? parseInt(match[1], 10) : 0;
}

// Calculate transaction summary
export interface TransactionSummary {
  totalCredits: number;
  totalDebits: number;
  netChange: number;
  transactionCount: number;
}

export function calculateTransactionSummary(
  transactions: Array<{ amount: number }>
): TransactionSummary {
  let totalCredits = 0;
  let totalDebits = 0;
  
  for (const tx of transactions) {
    if (tx.amount > 0) {
      totalCredits += tx.amount;
    } else {
      totalDebits += Math.abs(tx.amount);
    }
  }
  
  return {
    totalCredits,
    totalDebits,
    netChange: totalCredits - totalDebits,
    transactionCount: transactions.length,
  };
}
