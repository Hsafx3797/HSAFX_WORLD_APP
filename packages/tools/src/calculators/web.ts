/**
 * Web Calculators - Exact copy from apps/web/src/lib/tools/calculators.ts
 * This is the canonical source for all calculator implementations used by the web app.
 */

// GPA Calculator (reference: docs/example/GPA_CALCULATOR.md)
export interface GradeEntry {
  course: string;
  grade: string;
  credits: number;
}

const GRADE_POINTS: Record<string, number> = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'D-': 0.7,
  'F': 0.0,
};

export function calculateGpa(grades: GradeEntry[]): {
  gpa: number;
  totalCredits: number;
  totalPoints: number;
  letterGrade: string;
} {
  let totalPoints = 0;
  let totalCredits = 0;
  
  for (const entry of grades) {
    const gradePoint = GRADE_POINTS[entry.grade.toUpperCase()];
    if (gradePoint !== undefined) {
      totalPoints += gradePoint * entry.credits;
      totalCredits += entry.credits;
    }
  }
  
  const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
  
  let letterGrade = 'F';
  if (gpa >= 3.7) letterGrade = 'A';
  else if (gpa >= 3.3) letterGrade = 'A-';
  else if (gpa >= 3.0) letterGrade = 'B+';
  else if (gpa >= 2.7) letterGrade = 'B';
  else if (gpa >= 2.3) letterGrade = 'B-';
  else if (gpa >= 2.0) letterGrade = 'C+';
  else if (gpa >= 1.7) letterGrade = 'C';
  else if (gpa >= 1.3) letterGrade = 'C-';
  else if (gpa >= 1.0) letterGrade = 'D';
  
  return {
    gpa: Math.round(gpa * 100) / 100,
    totalCredits,
    totalPoints: Math.round(totalPoints * 100) / 100,
    letterGrade,
  };
}

// Islamic Zakat Calculator (reference: docs/example/ISLAMIC_ZAKAT_CALCULATOR.md)
export interface ZakatInput {
  cash?: number;
  bankBalance?: number;
  goldGrams?: number;
  goldPricePerGram?: number;
  silverGrams?: number;
  silverPricePerGram?: number;
  gold?: { grams: number; pricePerGram: number };
  silver?: { grams: number; pricePerGram: number };
  stocks?: number;
  businessInventory?: number;
  receivables?: number;
  realEstate?: number;
  otherAssets?: number;
  liabilities?: number;
}

const NISAB_GOLD_GRAMS = 87.48;
const NISAB_SILVER_GRAMS = 612.36;
const ZAKAT_RATE = 0.025;

export function calculateZakat(input: ZakatInput): {
  totalAssets: number;
  netAssets: number;
  nisabGold: number;
  nisabSilver: number;
  zakatDue: number;
  isZakatApplicable: boolean;
  breakdown: Record<string, number>;
} {
  const goldGrams = input.goldGrams ?? input.gold?.grams ?? 0;
  const goldPricePerGram = input.goldPricePerGram ?? input.gold?.pricePerGram ?? 0;
  const silverGrams = input.silverGrams ?? input.silver?.grams ?? 0;
  const silverPricePerGram = input.silverPricePerGram ?? input.silver?.pricePerGram ?? 0;
  
  const goldValue = goldGrams * goldPricePerGram;
  const silverValue = silverGrams * silverPricePerGram;
  
  const breakdown = {
    cash: input.cash ?? 0,
    bankBalance: input.bankBalance ?? 0,
    goldValue,
    silverValue,
    stocks: input.stocks ?? 0,
    businessInventory: input.businessInventory ?? 0,
    receivables: input.receivables ?? 0,
    realEstate: input.realEstate ?? 0,
    otherAssets: input.otherAssets ?? 0,
  };
  
  const totalAssets = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
  const netAssets = totalAssets - (input.liabilities ?? 0);
  
  const effectiveGoldPrice = goldPricePerGram > 0 ? goldPricePerGram : 60;
  const effectiveSilverPrice = silverPricePerGram > 0 ? silverPricePerGram : 0.75;
  
  const nisabGold = NISAB_GOLD_GRAMS * effectiveGoldPrice;
  const nisabSilver = NISAB_SILVER_GRAMS * effectiveSilverPrice;
  const nisabThreshold = Math.min(nisabGold, nisabSilver);
  
  const isZakatApplicable = netAssets >= nisabThreshold;
  const zakatDue = isZakatApplicable ? netAssets * ZAKAT_RATE : 0;
  
  return {
    totalAssets: Math.round(totalAssets * 100) / 100,
    netAssets: Math.round(netAssets * 100) / 100,
    nisabGold: Math.round(nisabGold * 100) / 100,
    nisabSilver: Math.round(nisabSilver * 100) / 100,
    zakatDue: Math.round(zakatDue * 100) / 100,
    isZakatApplicable,
    breakdown,
  };
}

// Islamic Inheritance Calculator (reference: docs/example/ISLAMIC_INHERITANCE_CALCULATOR.md)
export interface InheritanceData {
  estateValue: number;
  debts: number;
  funeralExpenses: number;
  bequests: number;
  hasHusband: boolean;
  numberOfWives: number;
  numberOfSons: number;
  numberOfDaughters: number;
  numberOfGrandsons: number;
  numberOfGranddaughters: number;
  hasFather: boolean;
  hasMother: boolean;
  hasGrandfather: boolean;
  hasPaternalGrandmother: boolean;
  hasMaternalGrandmother: boolean;
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

export function calculateIslamicInheritance(data: InheritanceData): {
  netEstate: number;
  shares: Record<string, { fraction: string; amount: number; count: number }>;
  blockedHeirs: Record<string, string>;
  total: number;
  remainder: number;
} {
  const maxBequest = (data.estateValue - data.debts - data.funeralExpenses) / 3;
  const actualBequest = Math.min(data.bequests, maxBequest);
  const netEstate = data.estateValue - data.debts - data.funeralExpenses - actualBequest;
  
  if (netEstate <= 0) {
    return { netEstate: 0, shares: {}, blockedHeirs: {}, total: 0, remainder: 0 };
  }

  const heirs: Record<string, Heir> = {};
  const blockedHeirs: Record<string, string> = {};
  
  const hasChildren = data.numberOfSons > 0 || data.numberOfDaughters > 0;
  const hasGrandchildren = data.numberOfGrandsons > 0 || data.numberOfGranddaughters > 0;
  const hasMaleDescendant = data.numberOfSons > 0 || data.numberOfGrandsons > 0;
  
  // DESCENDANT BLOCKING
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
  
  if (data.numberOfGrandsons > 0 && data.numberOfSons === 0) {
    if (data.numberOfFullBrothers > 0 && !blockedHeirs['Full Brothers']) blockedHeirs['Full Brothers'] = 'Grandsons';
    if (data.numberOfFullSisters > 0 && !blockedHeirs['Full Sisters']) blockedHeirs['Full Sisters'] = 'Grandsons';
    if (data.numberOfPaternalBrothers > 0 && !blockedHeirs['Paternal Brothers']) blockedHeirs['Paternal Brothers'] = 'Grandsons';
    if (data.numberOfPaternalSisters > 0 && !blockedHeirs['Paternal Sisters']) blockedHeirs['Paternal Sisters'] = 'Grandsons';
  }
  
  // ASCENDANT BLOCKING
  if (data.hasFather) {
    if (data.hasGrandfather) blockedHeirs['Grandfather'] = 'Father';
    if (data.numberOfFullBrothers > 0 && !blockedHeirs['Full Brothers']) blockedHeirs['Full Brothers'] = 'Father';
    if (data.numberOfFullSisters > 0 && !blockedHeirs['Full Sisters']) blockedHeirs['Full Sisters'] = 'Father';
    if (data.numberOfPaternalBrothers > 0 && !blockedHeirs['Paternal Brothers']) blockedHeirs['Paternal Brothers'] = 'Father';
    if (data.numberOfPaternalSisters > 0 && !blockedHeirs['Paternal Sisters']) blockedHeirs['Paternal Sisters'] = 'Father';
  }
  
  // GRANDMOTHER BLOCKING
  if (data.hasMother) {
    if (data.hasPaternalGrandmother) blockedHeirs['Paternal Grandmother'] = 'Mother';
    if (data.hasMaternalGrandmother) blockedHeirs['Maternal Grandmother'] = 'Mother';
  }
  
  // MATERNAL SIBLINGS BLOCKING
  if (hasMaleDescendant || data.hasFather || data.hasGrandfather) {
    if (data.numberOfMaternalBrothers > 0 && !blockedHeirs['Maternal Brothers']) {
      blockedHeirs['Maternal Brothers'] = hasMaleDescendant ? 'Male Descendant' : (data.hasFather ? 'Father' : 'Grandfather');
    }
    if (data.numberOfMaternalSisters > 0 && !blockedHeirs['Maternal Sisters']) {
      blockedHeirs['Maternal Sisters'] = hasMaleDescendant ? 'Male Descendant' : (data.hasFather ? 'Father' : 'Grandfather');
    }
  }
  
  // SIBLING HIERARCHY
  if (data.numberOfFullBrothers > 0 && !blockedHeirs['Full Brothers']) {
    if (data.numberOfPaternalBrothers > 0 && !blockedHeirs['Paternal Brothers']) {
      blockedHeirs['Paternal Brothers'] = 'Full Brothers';
    }
    if (data.numberOfPaternalSisters > 0 && !blockedHeirs['Paternal Sisters']) {
      blockedHeirs['Paternal Sisters'] = 'Full Brothers';
    }
  }

  let totalDistributed = 0;
  
  // SPOUSE SHARE
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
  
  // FATHER SHARE
  if (data.hasFather) {
    if (hasChildren || hasGrandchildren) {
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
  }
  
  // MOTHER SHARE
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
  
  // GRANDMOTHERS
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
  
  // DAUGHTERS (if no sons)
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
  
  // GRANDDAUGHTERS
  if (!blockedHeirs['Granddaughters'] && data.numberOfGranddaughters > 0 && data.numberOfSons === 0) {
    let granddaughterShare = 0;
    if (data.numberOfDaughters === 0) {
      granddaughterShare = data.numberOfGranddaughters === 1 ? 1/2 : 2/3;
    } else if (data.numberOfDaughters === 1) {
      granddaughterShare = 1/6;
    }
    
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
  
  // FULL SISTERS
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
  
  // MATERNAL SIBLINGS
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
  
  // RESIDUARY (ASABA)
  let remainder = netEstate - totalDistributed;
  
  // Priority 1: Sons
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
  
  // Priority 2: Grandsons
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
  
  // Priority 3: Father
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
  
  // Priority 4: Full Brothers
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
  
  // Priority 6: Grandfather
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

// Unit Converters
export const unitConversions = {
  length: {
    meter: 1,
    kilometer: 0.001,
    centimeter: 100,
    millimeter: 1000,
    mile: 0.000621371,
    yard: 1.09361,
    foot: 3.28084,
    inch: 39.3701,
    nauticalMile: 0.000539957,
    lightYear: 1.057e-16,
  },
  
  weight: {
    kilogram: 1,
    gram: 1000,
    milligram: 1000000,
    pound: 2.20462,
    ounce: 35.274,
    ton: 0.001,
    tonne: 0.001,
    stone: 0.157473,
    troyOunce: 32.1507,
    carat: 5000,
  },
  
  temperature: {
    celsius: (c: number) => c,
    fahrenheit: (c: number) => (c * 9/5) + 32,
    kelvin: (c: number) => c + 273.15,
    rankine: (c: number) => (c + 273.15) * 1.8,
    reaumur: (c: number) => c * 0.8,
  },
  
  volume: {
    liter: 1,
    milliliter: 1000,
    cubicMeter: 0.001,
    gallon: 0.264172,
    quart: 1.05669,
    pint: 2.11338,
    cup: 4.22675,
    fluidOunce: 33.814,
    tablespoon: 67.628,
    teaspoon: 202.884,
  },
  
  area: {
    squareMeter: 1,
    squareKilometer: 0.000001,
    squareFoot: 10.7639,
    squareYard: 1.19599,
    acre: 0.000247105,
    hectare: 0.0001,
    squareInch: 1550,
    squareMile: 3.861e-7,
    squareCentimeter: 10000,
    squareMillimeter: 1000000,
  },
  
  speed: {
    meterPerSecond: 1,
    kilometerPerHour: 3.6,
    milePerHour: 2.23694,
    knot: 1.94384,
    footPerSecond: 3.28084,
    mach: 0.00293858,
  },
  
  data: {
    byte: 1,
    kilobyte: 0.001,
    megabyte: 0.000001,
    gigabyte: 0.000000001,
    terabyte: 0.000000000001,
    bit: 8,
    kilobit: 0.008,
    megabit: 0.000008,
  },
  
  time: {
    second: 1,
    millisecond: 1000,
    microsecond: 1000000,
    nanosecond: 1000000000,
    minute: 1/60,
    hour: 1/3600,
    day: 1/86400,
    week: 1/604800,
    month: 1/2592000,
    year: 1/31536000,
    decade: 1/315360000,
  },
  
  pressure: {
    pascal: 1,
    kilopascal: 0.001,
    bar: 0.00001,
    psi: 0.000145038,
    atmosphere: 0.00000986923,
    mmHg: 0.00750062,
    torr: 0.00750062,
  },
  
  energy: {
    joule: 1,
    kilojoule: 0.001,
    calorie: 0.239006,
    kilocalorie: 0.000239006,
    wattHour: 0.000277778,
    kilowattHour: 0.000000277778,
    electronvolt: 6.242e+18,
    btu: 0.000947817,
    footPound: 0.737562,
  },
  
  power: {
    watt: 1,
    kilowatt: 0.001,
    megawatt: 0.000001,
    horsepower: 0.00134102,
    btuPerHour: 3.41214,
    footPoundPerSecond: 0.737562,
  },
  
  frequency: {
    hertz: 1,
    kilohertz: 0.001,
    megahertz: 0.000001,
    gigahertz: 0.000000001,
    rpm: 60,
  },
  
  dataStorage: {
    byte: 1,
    kilobyte: 1/1000,
    megabyte: 1/1000000,
    gigabyte: 1/1000000000,
    terabyte: 1/1000000000000,
    petabyte: 1/1000000000000000,
    kibibyte: 1/1024,
    mebibyte: 1/1048576,
    gibibyte: 1/1073741824,
    bit: 8,
  },
  
  electric: {
    ampere: 1,
    milliampere: 1000,
    microampere: 1000000,
    volt: 1,
    millivolt: 1000,
    kilovolt: 0.001,
    ohm: 1,
    kilohm: 0.001,
    megohm: 0.000001,
  },
  
  angle: {
    degree: 1,
    radian: 0.0174533,
    gradian: 1.11111,
    turn: 0.00277778,
    arcMinute: 60,
    arcSecond: 3600,
  },
  
  force: {
    newton: 1,
    kilonewton: 0.001,
    poundForce: 0.224809,
    kilogramForce: 0.101972,
    dyne: 100000,
  },
  
  torque: {
    newtonMeter: 1,
    kilonewtonMeter: 0.001,
    footPound: 0.737562,
    inchPound: 8.85075,
  },
  
  fuelConsumption: {
    kilometerPerLiter: 1,
    milePerGallon: 2.35215,
    literPer100km: 100,
    gallonPer100miles: 62.1371,
  },
  
  radiation: {
    becquerel: 1,
    curie: 2.7e-11,
    gray: 1,
    sievert: 1,
    roentgen: 258,
  },
  
  density: {
    kilogramPerCubicMeter: 1,
    gramPerCubicCentimeter: 0.001,
    poundPerCubicFoot: 0.0624279,
    specificGravity: 0.001,
  },
  
  illumination: {
    lux: 1,
    lumen: 1,
    candela: 1,
    footCandle: 0.0929030,
  },
  
  magnetic: {
    tesla: 1,
    gauss: 10000,
    weber: 1,
    maxwell: 100000000,
    henry: 1,
  },
  
  cooking: {
    cup: 1,
    tablespoon: 16,
    teaspoon: 48,
    fluidOunce: 8,
    milliliter: 236.588,
    liter: 0.236588,
    stick: 2,
  },
  
  paperSize: {
    a0: 841,
    a1: 594,
    a2: 420,
    a3: 297,
    a4: 210,
    a5: 148,
    a6: 105,
    letter: 216,
    legal: 216,
    tabloid: 279,
    points: 0.352778,
    picas: 4.23333,
  },
};

export function convertUnit(value: number, fromUnit: string, toUnit: string, category: keyof typeof unitConversions): number {
  const conversions = unitConversions[category];
  
  if (category === 'temperature') {
    const tempConversions = conversions as { 
      celsius: (c: number) => number; 
      fahrenheit: (c: number) => number; 
      kelvin: (c: number) => number;
      rankine: (c: number) => number;
      reaumur: (c: number) => number;
    };
    
    let celsius: number;
    switch (fromUnit) {
      case 'fahrenheit': celsius = (value - 32) * 5/9; break;
      case 'kelvin': celsius = value - 273.15; break;
      case 'rankine': celsius = (value - 491.67) * 5/9; break;
      case 'reaumur': celsius = value * 1.25; break;
      default: celsius = value;
    }
    
    return tempConversions[toUnit as keyof typeof tempConversions](celsius);
  }
  
  const factors = conversions as Record<string, number>;
  const fromFactor = factors[fromUnit];
  const toFactor = factors[toUnit];
  if (fromFactor === undefined || toFactor === undefined) {
    throw new Error(`Invalid unit: ${fromUnit} or ${toUnit}`);
  }
  const baseValue = value / fromFactor;
  return baseValue * toFactor;
}

// Percentage calculator
export function calculatePercentage(value: number, percentage: number): number {
  return (value * percentage) / 100;
}

export function percentageOf(part: number, whole: number): number {
  return (part / whole) * 100;
}

export function percentageChange(oldValue: number, newValue: number): number {
  return ((newValue - oldValue) / oldValue) * 100;
}

// Compound interest calculator
export function calculateCompoundInterest(
  principal: number,
  rate: number,
  time: number,
  n: number = 12
): { total: number; interest: number } {
  const total = principal * Math.pow((1 + rate / (100 * n)), n * time);
  return {
    total: Math.round(total * 100) / 100,
    interest: Math.round((total - principal) * 100) / 100,
  };
}

// Loan/EMI calculator
export function calculateEmi(
  principal: number,
  annualRate: number,
  months: number
): { emi: number; totalPayment: number; totalInterest: number } {
  const monthlyRate = annualRate / (12 * 100);
  const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
  const totalPayment = emi * months;
  
  return {
    emi: Math.round(emi * 100) / 100,
    totalPayment: Math.round(totalPayment * 100) / 100,
    totalInterest: Math.round((totalPayment - principal) * 100) / 100,
  };
}

// BMI calculator
export function calculateBmi(weightKg: number, heightM: number): { bmi: number; category: string } {
  const bmi = weightKg / (heightM * heightM);
  
  let category: string;
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi < 25) category = 'Normal weight';
  else if (bmi < 30) category = 'Overweight';
  else category = 'Obese';
  
  return {
    bmi: Math.round(bmi * 10) / 10,
    category,
  };
}

// Age calculator
export function calculateAge(birthDate: Date): { years: number; months: number; days: number } {
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();
  
  if (days < 0) {
    months--;
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += lastMonth.getDate();
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return { years, months, days };
}

// Date difference calculator
export function calculateDateDifference(date1: Date, date2: Date): {
  days: number;
  weeks: number;
  months: number;
  years: number;
} {
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffMs = Math.abs(date2.getTime() - date1.getTime());
  const days = Math.floor(diffMs / msPerDay);
  
  return {
    days,
    weeks: Math.floor(days / 7),
    months: Math.floor(days / 30.44),
    years: Math.floor(days / 365.25),
  };
}

// Scientific calculator operations
export const scientific = {
  factorial: (n: number): number => {
    if (n < 0) throw new Error('Factorial of negative number');
    if (n === 0 || n === 1) return 1;
    return n * scientific.factorial(n - 1);
  },
  
  power: (base: number, exp: number): number => Math.pow(base, exp),
  sqrt: (n: number): number => Math.sqrt(n),
  cbrt: (n: number): number => Math.cbrt(n),
  log10: (n: number): number => Math.log10(n),
  ln: (n: number): number => Math.log(n),
  sin: (deg: number): number => Math.sin(deg * Math.PI / 180),
  cos: (deg: number): number => Math.cos(deg * Math.PI / 180),
  tan: (deg: number): number => Math.tan(deg * Math.PI / 180),
  asin: (n: number): number => Math.asin(n) * 180 / Math.PI,
  acos: (n: number): number => Math.acos(n) * 180 / Math.PI,
  atan: (n: number): number => Math.atan(n) * 180 / Math.PI,
};

// Expression evaluator
export function evaluateExpression(expr: string): number {
  const cleaned = expr.replace(/\s/g, '');
  
  if (!/^[\d+\-*/().]+$/.test(cleaned)) {
    throw new Error('Invalid expression');
  }
  
  try {
    const result = new Function(`return ${cleaned}`)();
    if (typeof result !== 'number' || !isFinite(result)) {
      throw new Error('Invalid result');
    }
    return result;
  } catch {
    throw new Error('Failed to evaluate expression');
  }
}
