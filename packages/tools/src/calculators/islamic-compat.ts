/**
 * Islamic Inheritance Calculator - Web Compatibility Layer
 * 
 * Comprehensive implementation with proper blocking rules according to Hanafi fiqh
 * Reference: docs/example/ISLAMIC_INHERITANCE_CALCULATOR.md
 */

export interface InheritanceData {
  estateValue: number;
  debts: number;
  funeralExpenses: number;
  bequests: number;
  // Spouse
  hasHusband: boolean;
  numberOfWives: number;
  // Children
  numberOfSons: number;
  numberOfDaughters: number;
  // Grandchildren (through sons only)
  numberOfGrandsons: number;
  numberOfGranddaughters: number;
  // Parents
  hasFather: boolean;
  hasMother: boolean;
  // Grandparents
  hasGrandfather: boolean; // Father's father only
  hasPaternalGrandmother: boolean;
  hasMaternalGrandmother: boolean;
  // Siblings
  numberOfFullBrothers: number;
  numberOfFullSisters: number;
  numberOfPaternalBrothers: number;
  numberOfPaternalSisters: number;
  numberOfMaternalBrothers: number;
  numberOfMaternalSisters: number;
}

interface Heir {
  name: string;
  fraction: string;
  amount: number;
  count: number;
  blocked: boolean;
  blockedBy?: string;
}

export interface InheritanceResult {
  netEstate: number;
  shares: Record<string, { fraction: string; amount: number; count: number }>;
  blockedHeirs: Record<string, string>;
  total: number;
  remainder: number;
}

export function calculateIslamicInheritance(data: InheritanceData): InheritanceResult {
  // STEP 1: Calculate net estate (after debts, funeral, wasiyyah)
  const maxBequest = (data.estateValue - data.debts - data.funeralExpenses) / 3;
  const actualBequest = Math.min(data.bequests, maxBequest);
  const netEstate = data.estateValue - data.debts - data.funeralExpenses - actualBequest;
  
  if (netEstate <= 0) {
    return { netEstate: 0, shares: {}, blockedHeirs: {}, total: 0, remainder: 0 };
  }

  const heirs: Record<string, Heir> = {};
  const blockedHeirs: Record<string, string> = {};
  
  // STEP 2: Apply blocking rules (Hajb) according to Sharia
  const hasChildren = data.numberOfSons > 0 || data.numberOfDaughters > 0;
  const hasGrandchildren = data.numberOfGrandsons > 0 || data.numberOfGranddaughters > 0;
  const hasMaleDescendant = data.numberOfSons > 0 || data.numberOfGrandsons > 0;
  
  // --- UNBLOCKABLE HEIRS (always inherit if present) ---
  // Husband, Wife, Father, Mother, Son, Daughter
  
  // --- DESCENDANT BLOCKING ---
  // Sons block: grandchildren, all siblings, nephews, uncles, cousins
  if (data.numberOfSons > 0) {
    if (data.numberOfGrandsons > 0) blockedHeirs['Grandsons'] = 'Sons';
    if (data.numberOfGranddaughters > 0) blockedHeirs['Granddaughters'] = 'Sons';
    if (data.numberOfFullBrothers > 0) blockedHeirs['Full Brothers'] = 'Sons';
    if (data.numberOfFullSisters > 0) blockedHeirs['Full Sisters'] = 'Sons';
    if (data.numberOfPaternalBrothers > 0) blockedHeirs['Paternal Brothers'] = 'Sons';
    if (data.numberOfPaternalSisters > 0) blockedHeirs['Paternal Sisters'] = 'Sons';
    if (data.numberOfMaternalBrothers > 0) blockedHeirs['Maternal Brothers'] = 'Sons';
    if (data.numberOfMaternalSisters > 0) blockedHeirs['Maternal Sisters'] = 'Sons';
  }
  
  // Grandsons block: all siblings (if no sons)
  if (data.numberOfGrandsons > 0 && data.numberOfSons === 0) {
    if (data.numberOfFullBrothers > 0 && !blockedHeirs['Full Brothers']) blockedHeirs['Full Brothers'] = 'Grandsons';
    if (data.numberOfFullSisters > 0 && !blockedHeirs['Full Sisters']) blockedHeirs['Full Sisters'] = 'Grandsons';
    if (data.numberOfPaternalBrothers > 0 && !blockedHeirs['Paternal Brothers']) blockedHeirs['Paternal Brothers'] = 'Grandsons';
    if (data.numberOfPaternalSisters > 0 && !blockedHeirs['Paternal Sisters']) blockedHeirs['Paternal Sisters'] = 'Grandsons';
  }
  
  // --- ASCENDANT BLOCKING ---
  // Father blocks: grandfather, all siblings
  if (data.hasFather) {
    if (data.hasGrandfather) blockedHeirs['Grandfather'] = 'Father';
    if (data.numberOfFullBrothers > 0 && !blockedHeirs['Full Brothers']) blockedHeirs['Full Brothers'] = 'Father';
    if (data.numberOfFullSisters > 0 && !blockedHeirs['Full Sisters']) blockedHeirs['Full Sisters'] = 'Father';
    if (data.numberOfPaternalBrothers > 0 && !blockedHeirs['Paternal Brothers']) blockedHeirs['Paternal Brothers'] = 'Father';
    if (data.numberOfPaternalSisters > 0 && !blockedHeirs['Paternal Sisters']) blockedHeirs['Paternal Sisters'] = 'Father';
  }
  
  // --- GRANDMOTHER BLOCKING ---
  // Mother blocks both grandmothers
  if (data.hasMother) {
    if (data.hasPaternalGrandmother) blockedHeirs['Paternal Grandmother'] = 'Mother';
    if (data.hasMaternalGrandmother) blockedHeirs['Maternal Grandmother'] = 'Mother';
  }
  
  // --- MATERNAL SIBLINGS BLOCKING ---
  // Blocked by: Son, Grandson, Father, Grandfather
  if (hasMaleDescendant || data.hasFather || data.hasGrandfather) {
    if (data.numberOfMaternalBrothers > 0 && !blockedHeirs['Maternal Brothers']) {
      blockedHeirs['Maternal Brothers'] = hasMaleDescendant ? 'Male Descendant' : (data.hasFather ? 'Father' : 'Grandfather');
    }
    if (data.numberOfMaternalSisters > 0 && !blockedHeirs['Maternal Sisters']) {
      blockedHeirs['Maternal Sisters'] = hasMaleDescendant ? 'Male Descendant' : (data.hasFather ? 'Father' : 'Grandfather');
    }
  }
  
  // --- SIBLING HIERARCHY ---
  // Full brothers block paternal brothers
  if (data.numberOfFullBrothers > 0 && !blockedHeirs['Full Brothers']) {
    if (data.numberOfPaternalBrothers > 0 && !blockedHeirs['Paternal Brothers']) {
      blockedHeirs['Paternal Brothers'] = 'Full Brothers';
    }
    if (data.numberOfPaternalSisters > 0 && !blockedHeirs['Paternal Sisters']) {
      blockedHeirs['Paternal Sisters'] = 'Full Brothers';
    }
  }

  // STEP 3: Calculate shares for non-blocked heirs
  let totalDistributed = 0;
  
  // --- SPOUSE SHARE (FARD - Fixed Share) ---
  if (data.hasHusband) {
    const husbandShare = hasChildren || hasGrandchildren ? 1/4 : 1/2;
    const amount = netEstate * husbandShare;
    heirs['Husband'] = {
      name: 'Husband',
      fraction: hasChildren || hasGrandchildren ? '1/4' : '1/2',
      amount: Math.round(amount * 100) / 100,
      count: 1,
      blocked: false,
    };
    totalDistributed += amount;
  }
  
  if (data.numberOfWives > 0) {
    const wifeShare = hasChildren || hasGrandchildren ? 1/8 : 1/4;
    const totalWifeAmount = netEstate * wifeShare;
    const perWifeAmount = totalWifeAmount / data.numberOfWives;
    heirs['Wife'] = {
      name: 'Wife',
      fraction: hasChildren || hasGrandchildren ? '1/8' : '1/4',
      amount: Math.round(perWifeAmount * 100) / 100,
      count: data.numberOfWives,
      blocked: false,
    };
    totalDistributed += totalWifeAmount;
  }
  
  // --- FATHER SHARE ---
  if (data.hasFather) {
    if (hasChildren || hasGrandchildren) {
      // With descendants: Father gets 1/6 fixed + residuary if no male descendants
      const fatherFixed = netEstate * (1/6);
      heirs['Father'] = {
        name: 'Father',
        fraction: '1/6',
        amount: Math.round(fatherFixed * 100) / 100,
        count: 1,
        blocked: false,
      };
      totalDistributed += fatherFixed;
    }
    // Without descendants: Father is residuary (asaba) - calculated later
  }
  
  // --- MOTHER SHARE ---
  if (data.hasMother) {
    const hasTwoOrMoreSiblings = (data.numberOfFullBrothers + data.numberOfFullSisters + 
      data.numberOfPaternalBrothers + data.numberOfPaternalSisters + 
      data.numberOfMaternalBrothers + data.numberOfMaternalSisters) >= 2;
    
    const motherShare = hasChildren || hasGrandchildren || hasTwoOrMoreSiblings ? 1/6 : 1/3;
    const amount = netEstate * motherShare;
    heirs['Mother'] = {
      name: 'Mother',
      fraction: hasChildren || hasGrandchildren || hasTwoOrMoreSiblings ? '1/6' : '1/3',
      amount: Math.round(amount * 100) / 100,
      count: 1,
      blocked: false,
    };
    totalDistributed += amount;
  }
  
  // --- GRANDMOTHERS (if not blocked) ---
  if (!blockedHeirs['Paternal Grandmother'] && data.hasPaternalGrandmother) {
    const amount = netEstate * (1/6);
    heirs['Paternal Grandmother'] = {
      name: 'Paternal Grandmother',
      fraction: '1/6',
      amount: Math.round(amount * 100) / 100,
      count: 1,
      blocked: false,
    };
    totalDistributed += amount;
  }
  
  if (!blockedHeirs['Maternal Grandmother'] && data.hasMaternalGrandmother && !data.hasPaternalGrandmother) {
    const amount = netEstate * (1/6);
    heirs['Maternal Grandmother'] = {
      name: 'Maternal Grandmother',
      fraction: '1/6',
      amount: Math.round(amount * 100) / 100,
      count: 1,
      blocked: false,
    };
    totalDistributed += amount;
  }
  
  // --- DAUGHTERS (if no sons) ---
  if (data.numberOfDaughters > 0 && data.numberOfSons === 0) {
    const daughterShare = data.numberOfDaughters === 1 ? 1/2 : 2/3;
    const totalAmount = netEstate * daughterShare;
    const perDaughter = totalAmount / data.numberOfDaughters;
    heirs['Daughters'] = {
      name: 'Daughters',
      fraction: data.numberOfDaughters === 1 ? '1/2' : '2/3',
      amount: Math.round(perDaughter * 100) / 100,
      count: data.numberOfDaughters,
      blocked: false,
    };
    totalDistributed += totalAmount;
  }
  
  // --- GRANDDAUGHTERS (if not blocked and no sons) ---
  if (!blockedHeirs['Granddaughters'] && data.numberOfGranddaughters > 0 && data.numberOfSons === 0) {
    // If daughters took 1/2, granddaughters get 1/6 to complete 2/3
    // If no daughters, granddaughters get 1/2 (one) or 2/3 (two+)
    let granddaughterShare = 0;
    if (data.numberOfDaughters === 0) {
      granddaughterShare = data.numberOfGranddaughters === 1 ? 1/2 : 2/3;
    } else if (data.numberOfDaughters === 1) {
      granddaughterShare = 1/6; // Complete the 2/3
    }
    // If 2+ daughters took 2/3, granddaughters get nothing (except with grandson)
    
    if (granddaughterShare > 0) {
      const totalAmount = netEstate * granddaughterShare;
      const perGranddaughter = totalAmount / data.numberOfGranddaughters;
      heirs['Granddaughters'] = {
        name: 'Granddaughters',
        fraction: granddaughterShare === 1/2 ? '1/2' : granddaughterShare === 2/3 ? '2/3' : '1/6',
        amount: Math.round(perGranddaughter * 100) / 100,
        count: data.numberOfGranddaughters,
        blocked: false,
      };
      totalDistributed += totalAmount;
    }
  }
  
  // --- FULL SISTERS (if not blocked and no male descendants/father) ---
  if (!blockedHeirs['Full Sisters'] && data.numberOfFullSisters > 0 && !hasMaleDescendant && !data.hasFather) {
    const sisterShare = data.numberOfFullSisters === 1 ? 1/2 : 2/3;
    const totalAmount = netEstate * sisterShare;
    const perSister = totalAmount / data.numberOfFullSisters;
    heirs['Full Sisters'] = {
      name: 'Full Sisters',
      fraction: data.numberOfFullSisters === 1 ? '1/2' : '2/3',
      amount: Math.round(perSister * 100) / 100,
      count: data.numberOfFullSisters,
      blocked: false,
    };
    totalDistributed += totalAmount;
  }
  
  // --- MATERNAL SIBLINGS (if not blocked) - Equal shares ---
  if (!blockedHeirs['Maternal Brothers'] && !blockedHeirs['Maternal Sisters']) {
    const totalMaternalSiblings = data.numberOfMaternalBrothers + data.numberOfMaternalSisters;
    if (totalMaternalSiblings > 0) {
      const maternalShare = totalMaternalSiblings === 1 ? 1/6 : 1/3;
      const totalAmount = netEstate * maternalShare;
      const perSibling = totalAmount / totalMaternalSiblings;
      
      if (data.numberOfMaternalBrothers > 0) {
        heirs['Maternal Brothers'] = {
          name: 'Maternal Brothers',
          fraction: maternalShare === 1/6 ? '1/6' : '1/3 (shared)',
          amount: Math.round(perSibling * 100) / 100,
          count: data.numberOfMaternalBrothers,
          blocked: false,
        };
      }
      if (data.numberOfMaternalSisters > 0) {
        heirs['Maternal Sisters'] = {
          name: 'Maternal Sisters',
          fraction: maternalShare === 1/6 ? '1/6' : '1/3 (shared)',
          amount: Math.round(perSibling * 100) / 100,
          count: data.numberOfMaternalSisters,
          blocked: false,
        };
      }
      totalDistributed += totalAmount;
    }
  }
  
  // --- RESIDUARY (ASABA) - What's left goes to male heirs in priority order ---
  let remainder = netEstate - totalDistributed;
  
  // Priority 1: Sons (with daughters getting half share)
  if (data.numberOfSons > 0 && remainder > 0) {
    const totalShares = (data.numberOfSons * 2) + data.numberOfDaughters;
    const shareUnit = remainder / totalShares;
    
    heirs['Sons'] = {
      name: 'Sons',
      fraction: 'Residuary (2:1)',
      amount: Math.round((shareUnit * 2) * 100) / 100,
      count: data.numberOfSons,
      blocked: false,
    };
    
    if (data.numberOfDaughters > 0) {
      // Override daughters' fixed share with residuary
      heirs['Daughters'] = {
        name: 'Daughters',
        fraction: 'Residuary (2:1)',
        amount: Math.round(shareUnit * 100) / 100,
        count: data.numberOfDaughters,
        blocked: false,
      };
    }
    remainder = 0;
  }
  
  // Priority 2: Grandsons (with granddaughters getting half share)
  if (!blockedHeirs['Grandsons'] && data.numberOfGrandsons > 0 && remainder > 0) {
    const eligibleGranddaughters = blockedHeirs['Granddaughters'] ? 0 : data.numberOfGranddaughters;
    const totalShares = (data.numberOfGrandsons * 2) + eligibleGranddaughters;
    const shareUnit = remainder / totalShares;
    
    heirs['Grandsons'] = {
      name: 'Grandsons',
      fraction: 'Residuary (2:1)',
      amount: Math.round((shareUnit * 2) * 100) / 100,
      count: data.numberOfGrandsons,
      blocked: false,
    };
    
    if (eligibleGranddaughters > 0) {
      heirs['Granddaughters'] = {
        name: 'Granddaughters',
        fraction: 'Residuary (2:1)',
        amount: Math.round(shareUnit * 100) / 100,
        count: eligibleGranddaughters,
        blocked: false,
      };
    }
    remainder = 0;
  }
  
  // Priority 3: Father (if no descendants)
  if (data.hasFather && !hasChildren && !hasGrandchildren && remainder > 0) {
    heirs['Father'] = {
      name: 'Father',
      fraction: 'Residuary',
      amount: Math.round(remainder * 100) / 100,
      count: 1,
      blocked: false,
    };
    remainder = 0;
  }
  
  // Priority 4: Full Brothers (with full sisters getting half share)
  if (!blockedHeirs['Full Brothers'] && data.numberOfFullBrothers > 0 && remainder > 0) {
    const eligibleSisters = blockedHeirs['Full Sisters'] ? 0 : data.numberOfFullSisters;
    const totalShares = (data.numberOfFullBrothers * 2) + eligibleSisters;
    const shareUnit = remainder / totalShares;
    
    heirs['Full Brothers'] = {
      name: 'Full Brothers',
      fraction: 'Residuary (2:1)',
      amount: Math.round((shareUnit * 2) * 100) / 100,
      count: data.numberOfFullBrothers,
      blocked: false,
    };
    
    if (eligibleSisters > 0 && !heirs['Full Sisters']) {
      heirs['Full Sisters'] = {
        name: 'Full Sisters',
        fraction: 'Residuary (2:1)',
        amount: Math.round(shareUnit * 100) / 100,
        count: eligibleSisters,
        blocked: false,
      };
    }
    remainder = 0;
  }
  
  // Priority 5: Paternal Brothers
  if (!blockedHeirs['Paternal Brothers'] && data.numberOfPaternalBrothers > 0 && remainder > 0) {
    const eligibleSisters = blockedHeirs['Paternal Sisters'] ? 0 : data.numberOfPaternalSisters;
    const totalShares = (data.numberOfPaternalBrothers * 2) + eligibleSisters;
    const shareUnit = remainder / totalShares;
    
    heirs['Paternal Brothers'] = {
      name: 'Paternal Brothers',
      fraction: 'Residuary (2:1)',
      amount: Math.round((shareUnit * 2) * 100) / 100,
      count: data.numberOfPaternalBrothers,
      blocked: false,
    };
    
    if (eligibleSisters > 0) {
      heirs['Paternal Sisters'] = {
        name: 'Paternal Sisters',
        fraction: 'Residuary (2:1)',
        amount: Math.round(shareUnit * 100) / 100,
        count: eligibleSisters,
        blocked: false,
      };
    }
    remainder = 0;
  }
  
  // Priority 6: Grandfather (if no father and no closer heirs)
  if (!blockedHeirs['Grandfather'] && data.hasGrandfather && remainder > 0) {
    heirs['Grandfather'] = {
      name: 'Grandfather',
      fraction: 'Residuary',
      amount: Math.round(remainder * 100) / 100,
      count: 1,
      blocked: false,
    };
    remainder = 0;
  }
  
  // Calculate total
  let total = 0;
  const finalShares: Record<string, { fraction: string; amount: number; count: number }> = {};
  
  for (const [key, heir] of Object.entries(heirs)) {
    if (!heir.blocked) {
      finalShares[key] = {
        fraction: heir.fraction,
        amount: heir.amount,
        count: heir.count,
      };
      total += heir.amount * heir.count;
    }
  }
  
  return {
    netEstate: Math.round(netEstate * 100) / 100,
    shares: finalShares,
    blockedHeirs,
    total: Math.round(total * 100) / 100,
    remainder: Math.round(remainder * 100) / 100,
  };
}
