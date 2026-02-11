/**
 * Coin Packs Configuration
 * HSAFX WORLD - Available coin packages for purchase
 */

import type { CoinPack, AdRewardConfig, DailyRewardConfig } from './types';

// Available coin packs
export const COIN_PACKS: CoinPack[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    coins: 100,
    price: 4.99,
    bonusCoins: 0,
    isPopular: false,
  },
  {
    id: 'basic',
    name: 'Basic Pack',
    coins: 300,
    price: 9.99,
    bonusCoins: 30,
    isPopular: false,
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    coins: 700,
    price: 19.99,
    bonusCoins: 100,
    isPopular: true,
  },
  {
    id: 'value',
    name: 'Value Pack',
    coins: 1500,
    price: 39.99,
    bonusCoins: 300,
    isPopular: false,
    discount: 10,
  },
  {
    id: 'premium',
    name: 'Premium Pack',
    coins: 4000,
    price: 99.99,
    bonusCoins: 1000,
    isPopular: false,
    discount: 20,
  },
  {
    id: 'ultimate',
    name: 'Ultimate Pack',
    coins: 10000,
    price: 199.99,
    bonusCoins: 3000,
    isPopular: false,
    discount: 30,
  },
];

// Get coin pack by ID
export function getCoinPack(packId: string): CoinPack | undefined {
  return COIN_PACKS.find(pack => pack.id === packId);
}

// Calculate effective coins (including bonus)
export function getEffectiveCoins(pack: CoinPack): number {
  return pack.coins + pack.bonusCoins;
}

// Calculate cost per coin
export function getCostPerCoin(pack: CoinPack): number {
  const totalCoins = getEffectiveCoins(pack);
  return pack.price / totalCoins;
}

// Get best value pack
export function getBestValuePack(): CoinPack {
  let bestPack = COIN_PACKS[0]!;
  let lowestCostPerCoin = getCostPerCoin(bestPack);
  
  for (const pack of COIN_PACKS) {
    const costPerCoin = getCostPerCoin(pack);
    if (costPerCoin < lowestCostPerCoin) {
      lowestCostPerCoin = costPerCoin;
      bestPack = pack;
    }
  }
  
  return bestPack;
}

// Ad reward configuration
export const AD_REWARD_CONFIG: AdRewardConfig = {
  rewardAmount: 5,        // 5 coins per ad
  dailyLimit: 10,         // Max 10 ads per day (50 coins max)
  cooldownMinutes: 5,     // 5 minute cooldown between ads
};

// Daily reward configuration
export const DAILY_REWARD_CONFIG: DailyRewardConfig = {
  baseAmount: 10,         // 10 coins base
  streakBonus: 2,         // +2 per day streak
  maxStreakDays: 7,       // Max 7 day streak (10 + 14 = 24 coins max)
};

// Calculate daily reward based on streak
export function calculateDailyReward(streakDays: number): number {
  const clampedStreak = Math.min(streakDays, DAILY_REWARD_CONFIG.maxStreakDays);
  return DAILY_REWARD_CONFIG.baseAmount + (clampedStreak * DAILY_REWARD_CONFIG.streakBonus);
}

// Check if user can watch ad
export function canWatchAd(
  lastAdAt: Date | null, 
  adsWatchedToday: number
): { canWatch: boolean; reason?: string; waitMinutes?: number } {
  // Check daily limit
  if (adsWatchedToday >= AD_REWARD_CONFIG.dailyLimit) {
    return {
      canWatch: false,
      reason: 'Daily ad limit reached',
    };
  }
  
  // Check cooldown
  if (lastAdAt) {
    const cooldownEnd = new Date(lastAdAt.getTime() + AD_REWARD_CONFIG.cooldownMinutes * 60 * 1000);
    const now = new Date();
    
    if (now < cooldownEnd) {
      const waitMs = cooldownEnd.getTime() - now.getTime();
      const waitMinutes = Math.ceil(waitMs / 60000);
      return {
        canWatch: false,
        reason: 'Cooldown active',
        waitMinutes,
      };
    }
  }
  
  return { canWatch: true };
}
