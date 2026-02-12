/**
 * Coin Packs Configuration
 * HSAFX WORLD - Available coin packages for purchase
 */

import type { CoinPack, LoginRewardConfig } from './types';

// Available coin packs
export const COIN_PACKS: CoinPack[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    coins: 100,
    priceInCents: 499,
    bonusCoins: 0,
    isPopular: false,
  },
  {
    id: 'basic',
    name: 'Basic Pack',
    coins: 300,
    priceInCents: 999,
    bonusCoins: 30,
    isPopular: false,
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    coins: 700,
    priceInCents: 1999,
    bonusCoins: 100,
    isPopular: true,
  },
  {
    id: 'value',
    name: 'Value Pack',
    coins: 1500,
    priceInCents: 3999,
    bonusCoins: 300,
    isPopular: false,
    discount: 10,
  },
  {
    id: 'premium',
    name: 'Premium Pack',
    coins: 4000,
    priceInCents: 9999,
    bonusCoins: 1000,
    isPopular: false,
    discount: 20,
  },
  {
    id: 'ultimate',
    name: 'Ultimate Pack',
    coins: 10000,
    priceInCents: 19999,
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

// Calculate cost per coin (in cents)
export function getCostPerCoin(pack: CoinPack): number {
  const totalCoins = getEffectiveCoins(pack);
  return pack.priceInCents / totalCoins;
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

// Login reward configuration
export const LOGIN_REWARD_CONFIG: LoginRewardConfig = {
  coinsPerReward: 10,          // 10 coins per login reward
  dailyCoinCap: 50,            // 50 coins per day max
  hourlyCooldownMinutes: 60,   // 1 hour cooldown between hourly claims
};
