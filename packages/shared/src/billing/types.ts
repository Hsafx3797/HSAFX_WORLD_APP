/**
 * Billing Types
 * HSAFX WORLD - Types for coin and billing operations
 */

// Transaction types
export type TransactionType = 
  | 'grant'        // Coins granted (subscription, admin)
  | 'purchase'     // Coins purchased via payment
  | 'spend'        // Coins spent on tool execution
  | 'refund'       // Coins refunded
  | 'adjustment'   // Manual admin adjustment
  | 'reward'       // Earned from login rewards (daily/hourly)
  | 'referral';    // Referral bonus

// Coin transaction record
export interface CoinTransaction {
  id: string;
  userId: string;
  amount: number;          // Positive for credit, negative for debit
  balanceAfter: number;    // Balance snapshot after transaction
  type: TransactionType;
  reason: string;          // Human-readable description
  resourceType?: string;   // 'tool', 'subscription', 'api', etc.
  resourceId?: string;     // ID of related resource
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// Billable action definition
export interface BillableAction {
  type: 'tool_execution' | 'api_call' | 'file_upload' | 'bulk_operation';
  resourceId: string;
  coinCost: number;
  description: string;
}

// Tool cost configuration
export interface ToolCostConfig {
  toolId: string;
  toolName: string;
  baseCost: number;         // Base coin cost
  perUnitCost: number;      // Additional cost per unit (files, MB, etc.)
  unitType: 'file' | 'mb' | 'page' | 'operation' | 'none';
  maxCost: number;          // Maximum cost cap
  freeQuota: number;        // Free executions before charging
}

// Coin pack for purchase
export interface CoinPack {
  id: string;
  name: string;
  coins: number;
  priceInCents: number;     // Price in cents (e.g. 499 = $4.99)
  bonusCoins: number;       // Extra coins included
  isPopular: boolean;
  discount?: number;        // Percentage discount
}

// Billing result
export interface BillingResult {
  success: boolean;
  transactionId?: string;
  newBalance?: number;
  error?: string;
  errorCode?: string;
}

// Login reward configuration (re-exported from @hsafx/shared/rewards)
export interface LoginRewardConfig {
  coinsPerReward: number;       // Coins per login reward
  dailyCoinCap: number;         // Max coins per day
  hourlyCooldownMinutes: number; // Cooldown between hourly claims
}

// Usage tracking
export interface UsageRecord {
  userId: string;
  resourceType: string;
  resourceId?: string;
  count: number;
  period: 'daily' | 'monthly' | 'lifetime';
  periodStart: Date;
  periodEnd: Date;
}
