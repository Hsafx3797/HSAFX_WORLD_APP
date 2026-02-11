/**
 * Islamic Calculators Library
 * Zakat and Inheritance (Faraid) calculations
 */

// ==================== ZAKAT CALCULATOR ====================

export interface ZakatAssets {
  // Cash and Bank Balances
  cashOnHand: number;
  bankBalance: number;
  savingsAccounts: number;
  
  // Investments
  stocks: number;
  mutualFunds: number;
  bonds: number;
  
  // Business Assets
  businessInventory: number;
  businessCash: number;
  accountsReceivable: number;
  
  // Precious Metals
  goldValue: number;
  silverValue: number;
  
  // Real Estate (for rent/investment only)
  rentalIncome: number;
  
  // Other
  otherAssets: number;
}

export interface ZakatLiabilities {
  debts: number;
  loans: number;
  unpaidBills: number;
  otherLiabilities: number;
}

export interface ZakatResult {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  nisabGold: number;
  nisabSilver: number;
  meetsNisab: boolean;
  zakatDue: number;
  breakdown: {
    category: string;
    amount: number;
    zakat: number;
  }[];
}

// Current nisab values (should be updated with live prices)
const GOLD_NISAB_GRAMS = 85; // 85 grams of gold
const SILVER_NISAB_GRAMS = 595; // 595 grams of silver
const ZAKAT_RATE = 0.025; // 2.5%

export function calculateZakat(
  assets: Partial<ZakatAssets>,
  liabilities: Partial<ZakatLiabilities>,
  goldPricePerGram: number,
  silverPricePerGram: number
): ZakatResult {
  // Calculate total assets
  const assetValues = {
    'Cash on Hand': assets.cashOnHand || 0,
    'Bank Balance': assets.bankBalance || 0,
    'Savings Accounts': assets.savingsAccounts || 0,
    'Stocks': assets.stocks || 0,
    'Mutual Funds': assets.mutualFunds || 0,
    'Bonds': assets.bonds || 0,
    'Business Inventory': assets.businessInventory || 0,
    'Business Cash': assets.businessCash || 0,
    'Accounts Receivable': assets.accountsReceivable || 0,
    'Gold': assets.goldValue || 0,
    'Silver': assets.silverValue || 0,
    'Rental Income': assets.rentalIncome || 0,
    'Other Assets': assets.otherAssets || 0,
  };
  
  const totalAssets = Object.values(assetValues).reduce((a, b) => a + b, 0);
  
  // Calculate total liabilities
  const totalLiabilities = (
    (liabilities.debts || 0) +
    (liabilities.loans || 0) +
    (liabilities.unpaidBills || 0) +
    (liabilities.otherLiabilities || 0)
  );
  
  // Calculate net worth
  const netWorth = totalAssets - totalLiabilities;
  
  // Calculate nisab thresholds
  const nisabGold = GOLD_NISAB_GRAMS * goldPricePerGram;
  const nisabSilver = SILVER_NISAB_GRAMS * silverPricePerGram;
  
  // Use lower nisab (silver) to determine eligibility
  const nisabThreshold = Math.min(nisabGold, nisabSilver);
  const meetsNisab = netWorth >= nisabThreshold;
  
  // Calculate zakat due
  const zakatDue = meetsNisab ? netWorth * ZAKAT_RATE : 0;
  
  // Generate breakdown
  const breakdown = Object.entries(assetValues)
    .filter(([_, amount]) => amount > 0)
    .map(([category, amount]) => ({
      category,
      amount,
      zakat: meetsNisab ? amount * ZAKAT_RATE : 0,
    }));
  
  return {
    totalAssets,
    totalLiabilities,
    netWorth,
    nisabGold,
    nisabSilver,
    meetsNisab,
    zakatDue,
    breakdown,
  };
}

// ==================== INHERITANCE (FARAID) CALCULATOR ====================

export type Gender = 'male' | 'female';

export interface Heir {
  relation: HeirRelation;
  gender: Gender;
  count: number;
}

export type HeirRelation = 
  | 'husband'
  | 'wife'
  | 'son'
  | 'daughter'
  | 'father'
  | 'mother'
  | 'grandfather'
  | 'grandmother'
  | 'brother'
  | 'sister'
  | 'halfBrotherPaternal'
  | 'halfSisterPaternal'
  | 'halfBrotherMaternal'
  | 'halfSisterMaternal'
  | 'grandson'
  | 'granddaughter'
  | 'uncle'
  | 'cousin';

export interface InheritanceResult {
  estate: number;
  debts: number;
  funeralCosts: number;
  bequests: number;
  distributableEstate: number;
  shares: {
    heir: string;
    relation: HeirRelation;
    count: number;
    shareType: string;
    fraction: string;
    percentage: number;
    amount: number;
    perPerson: number;
  }[];
  residue: number;
  notes: string[];
}

interface ShareRule {
  relation: HeirRelation;
  conditions: (heirs: Heir[]) => boolean;
  share: number | 'residue' | 'blocked';
  shareType: string;
}

// Simplified inheritance rules (real faraid is more complex)
const shareRules: ShareRule[] = [
  // Husband: 1/4 with children, 1/2 without
  {
    relation: 'husband',
    conditions: (heirs) => heirs.some(h => ['son', 'daughter', 'grandson', 'granddaughter'].includes(h.relation)),
    share: 1/4,
    shareType: 'Fixed Share (with descendants)',
  },
  {
    relation: 'husband',
    conditions: () => true,
    share: 1/2,
    shareType: 'Fixed Share (no descendants)',
  },
  // Wife: 1/8 with children, 1/4 without
  {
    relation: 'wife',
    conditions: (heirs) => heirs.some(h => ['son', 'daughter', 'grandson', 'granddaughter'].includes(h.relation)),
    share: 1/8,
    shareType: 'Fixed Share (with descendants)',
  },
  {
    relation: 'wife',
    conditions: () => true,
    share: 1/4,
    shareType: 'Fixed Share (no descendants)',
  },
  // Father: 1/6 with son, residue otherwise
  {
    relation: 'father',
    conditions: (heirs) => heirs.some(h => h.relation === 'son'),
    share: 1/6,
    shareType: 'Fixed Share (with son)',
  },
  {
    relation: 'father',
    conditions: () => true,
    share: 'residue',
    shareType: 'Residue',
  },
  // Mother: 1/6 with children, 1/3 without
  {
    relation: 'mother',
    conditions: (heirs) => heirs.some(h => ['son', 'daughter', 'grandson', 'granddaughter'].includes(h.relation)),
    share: 1/6,
    shareType: 'Fixed Share (with descendants)',
  },
  {
    relation: 'mother',
    conditions: () => true,
    share: 1/3,
    shareType: 'Fixed Share (no descendants)',
  },
  // Son: Residue (2x daughter's share)
  {
    relation: 'son',
    conditions: () => true,
    share: 'residue',
    shareType: 'Residue',
  },
  // Daughter: 1/2 alone, 2/3 together, residue with son
  {
    relation: 'daughter',
    conditions: (heirs) => heirs.some(h => h.relation === 'son'),
    share: 'residue',
    shareType: 'Residue (with brother)',
  },
  {
    relation: 'daughter',
    conditions: (heirs) => {
      const daughters = heirs.find(h => h.relation === 'daughter');
      return daughters ? daughters.count > 1 : false;
    },
    share: 2/3,
    shareType: 'Fixed Share (2+ daughters)',
  },
  {
    relation: 'daughter',
    conditions: () => true,
    share: 1/2,
    shareType: 'Fixed Share (1 daughter)',
  },
];

function fractionToString(decimal: number): string {
  const fractions: [number, string][] = [
    [1/2, '1/2'],
    [1/3, '1/3'],
    [1/4, '1/4'],
    [1/6, '1/6'],
    [1/8, '1/8'],
    [2/3, '2/3'],
    [1/12, '1/12'],
    [1/24, '1/24'],
  ];
  
  for (const [value, str] of fractions) {
    if (Math.abs(decimal - value) < 0.001) {
      return str;
    }
  }
  
  return `${(decimal * 100).toFixed(2)}%`;
}

export function calculateInheritance(
  estate: number,
  heirs: Heir[],
  debts: number = 0,
  funeralCosts: number = 0,
  bequests: number = 0 // Max 1/3 of estate
): InheritanceResult {
  const notes: string[] = [];
  
  // Limit bequests to 1/3
  const maxBequests = estate / 3;
  if (bequests > maxBequests) {
    bequests = maxBequests;
    notes.push('Bequests limited to 1/3 of estate');
  }
  
  // Calculate distributable estate
  const distributableEstate = estate - debts - funeralCosts - bequests;
  
  if (distributableEstate <= 0) {
    return {
      estate,
      debts,
      funeralCosts,
      bequests,
      distributableEstate: 0,
      shares: [],
      residue: 0,
      notes: ['Estate is insufficient to cover debts and expenses'],
    };
  }
  
  // Calculate shares
  const shares: InheritanceResult['shares'] = [];
  let totalFixedShares = 0;
  const residueHeirs: Heir[] = [];
  
  for (const heir of heirs) {
    // Find applicable rule
    const rule = shareRules.find(
      r => r.relation === heir.relation && r.conditions(heirs)
    );
    
    if (!rule) {
      notes.push(`No rule found for ${heir.relation}`);
      continue;
    }
    
    if (rule.share === 'blocked') {
      notes.push(`${heir.relation} is blocked from inheritance`);
      continue;
    }
    
    if (rule.share === 'residue') {
      residueHeirs.push(heir);
    } else {
      const shareAmount = distributableEstate * rule.share;
      totalFixedShares += rule.share;
      
      shares.push({
        heir: formatHeirName(heir.relation, heir.count),
        relation: heir.relation,
        count: heir.count,
        shareType: rule.shareType,
        fraction: fractionToString(rule.share),
        percentage: rule.share * 100,
        amount: shareAmount,
        perPerson: shareAmount / heir.count,
      });
    }
  }
  
  // Calculate residue
  const residue = distributableEstate * (1 - totalFixedShares);
  
  // Distribute residue among asaba (residuary heirs)
  if (residueHeirs.length > 0 && residue > 0) {
    // Calculate total parts (males get 2 parts, females get 1)
    let totalParts = 0;
    for (const heir of residueHeirs) {
      const partsPerPerson = heir.gender === 'male' ? 2 : 1;
      totalParts += partsPerPerson * heir.count;
    }
    
    const valuePerPart = residue / totalParts;
    
    for (const heir of residueHeirs) {
      const partsPerPerson = heir.gender === 'male' ? 2 : 1;
      const totalHeirParts = partsPerPerson * heir.count;
      const shareAmount = valuePerPart * totalHeirParts;
      const percentage = (shareAmount / distributableEstate) * 100;
      
      shares.push({
        heir: formatHeirName(heir.relation, heir.count),
        relation: heir.relation,
        count: heir.count,
        shareType: 'Residue',
        fraction: `${totalHeirParts}/${totalParts}`,
        percentage,
        amount: shareAmount,
        perPerson: shareAmount / heir.count,
      });
    }
  }
  
  // Check for aul (increase) or radd (decrease)
  const totalAllocated = shares.reduce((sum, s) => sum + s.amount, 0);
  if (Math.abs(totalAllocated - distributableEstate) > 0.01) {
    if (totalAllocated > distributableEstate) {
      notes.push('Aul (proportional reduction) applied due to shares exceeding estate');
      // Proportionally reduce all shares
      const factor = distributableEstate / totalAllocated;
      for (const share of shares) {
        share.amount *= factor;
        share.perPerson *= factor;
      }
    } else if (residueHeirs.length === 0) {
      notes.push('Radd (return) may apply - excess returned to eligible heirs');
    }
  }
  
  return {
    estate,
    debts,
    funeralCosts,
    bequests,
    distributableEstate,
    shares,
    residue: residue > 0 && residueHeirs.length === 0 ? residue : 0,
    notes,
  };
}

function formatHeirName(relation: HeirRelation, count: number): string {
  const names: Record<HeirRelation, [string, string]> = {
    husband: ['Husband', 'Husbands'],
    wife: ['Wife', 'Wives'],
    son: ['Son', 'Sons'],
    daughter: ['Daughter', 'Daughters'],
    father: ['Father', 'Fathers'],
    mother: ['Mother', 'Mothers'],
    grandfather: ['Grandfather', 'Grandfathers'],
    grandmother: ['Grandmother', 'Grandmothers'],
    brother: ['Brother', 'Brothers'],
    sister: ['Sister', 'Sisters'],
    halfBrotherPaternal: ['Half-Brother (Paternal)', 'Half-Brothers (Paternal)'],
    halfSisterPaternal: ['Half-Sister (Paternal)', 'Half-Sisters (Paternal)'],
    halfBrotherMaternal: ['Half-Brother (Maternal)', 'Half-Brothers (Maternal)'],
    halfSisterMaternal: ['Half-Sister (Maternal)', 'Half-Sisters (Maternal)'],
    grandson: ['Grandson', 'Grandsons'],
    granddaughter: ['Granddaughter', 'Granddaughters'],
    uncle: ['Uncle', 'Uncles'],
    cousin: ['Cousin', 'Cousins'],
  };
  
  const [singular, plural] = names[relation];
  return count === 1 ? singular : `${count} ${plural}`;
}
