/**
 * Container Number Validator
 * Validates ISO 6346 shipping container numbers
 */

export interface ContainerValidationResult {
  valid: boolean;
  containerNumber: string;
  ownerCode: string;
  equipmentCategory: string;
  serialNumber: string;
  checkDigit: number;
  calculatedCheckDigit: number;
  errors: string[];
  details: {
    ownerDescription: string;
    categoryDescription: string;
    categoryType: string;
  };
}

// ISO 6346 letter values (excluding vowels to avoid creating words)
const LETTER_VALUES: Record<string, number> = {
  'A': 10, 'B': 12, 'C': 13, 'D': 14, 'E': 15, 'F': 16, 'G': 17, 'H': 18, 'I': 19, 'J': 20,
  'K': 21, 'L': 23, 'M': 24, 'N': 25, 'O': 26, 'P': 27, 'Q': 28, 'R': 29, 'S': 30, 'T': 31,
  'U': 32, 'V': 34, 'W': 35, 'X': 36, 'Y': 37, 'Z': 38,
};

// Equipment category codes
const CATEGORY_CODES: Record<string, { description: string; type: string }> = {
  'U': { description: 'Freight Container', type: 'freight' },
  'J': { description: 'Detachable Freight Container', type: 'freight' },
  'Z': { description: 'Trailer and Chassis', type: 'trailer' },
  'R': { description: 'Reefer (Refrigerated) Container', type: 'reefer' },
};

// Known owner codes (sample - real database would have thousands)
const OWNER_CODES: Record<string, string> = {
  'MSC': 'Mediterranean Shipping Company',
  'MAE': 'Maersk Line',
  'CMA': 'CMA CGM',
  'CSL': 'China Shipping Container Lines',
  'ONE': 'Ocean Network Express',
  'EVG': 'Evergreen Marine',
  'HPL': 'Hapag-Lloyd',
  'YML': 'Yang Ming Marine Transport',
  'HMM': 'Hyundai Merchant Marine',
  'ZIM': 'ZIM Integrated Shipping',
  'PIL': 'Pacific International Lines',
  'WHL': 'Wan Hai Lines',
  'EMC': 'Evergreen Marine Corporation',
  'NYK': 'Nippon Yusen Kaisha',
  'MOL': 'Mitsui O.S.K. Lines',
  'KLI': 'K Line',
  'HLC': 'Hapag-Lloyd Container',
  'CGM': 'Compagnie Maritime',
  'APL': 'American President Lines',
  'OOC': 'Orient Overseas Container Line',
  'UAS': 'UASC',
  'TRI': 'Triton International',
  'SEA': 'Seaco Global',
  'TEX': 'Textainer',
  'FLO': 'Florens Container',
  'BEA': 'Beacon Intermodal',
  'CAI': 'CAI International',
};

export function calculateCheckDigit(containerNumber: string): number {
  const chars = containerNumber.slice(0, 10).toUpperCase();
  let sum = 0;
  
  for (let i = 0; i < 10; i++) {
    const char = chars[i];
    let value: number;
    
    if (/[A-Z]/.test(char)) {
      value = LETTER_VALUES[char];
    } else {
      value = parseInt(char, 10);
    }
    
    // Each position is weighted by 2^position
    sum += value * Math.pow(2, i);
  }
  
  // Check digit is remainder of division by 11, with 10 becoming 0
  const checkDigit = sum % 11;
  return checkDigit === 10 ? 0 : checkDigit;
}

export function validateContainerNumber(input: string): ContainerValidationResult {
  const errors: string[] = [];
  
  // Clean input
  const cleaned = input.replace(/[\s\-]/g, '').toUpperCase();
  
  // Initialize result
  const result: ContainerValidationResult = {
    valid: false,
    containerNumber: cleaned,
    ownerCode: '',
    equipmentCategory: '',
    serialNumber: '',
    checkDigit: 0,
    calculatedCheckDigit: 0,
    errors: [],
    details: {
      ownerDescription: '',
      categoryDescription: '',
      categoryType: '',
    },
  };
  
  // Check length
  if (cleaned.length !== 11) {
    errors.push(`Invalid length: expected 11 characters, got ${cleaned.length}`);
    result.errors = errors;
    return result;
  }
  
  // Check format: 4 letters + 7 digits
  if (!/^[A-Z]{4}\d{7}$/.test(cleaned)) {
    errors.push('Invalid format: should be 4 letters followed by 7 digits');
    result.errors = errors;
    return result;
  }
  
  // Extract parts
  const ownerCode = cleaned.slice(0, 3);
  const equipmentCategory = cleaned.slice(3, 4);
  const serialNumber = cleaned.slice(4, 10);
  const checkDigit = parseInt(cleaned.slice(10), 10);
  
  result.ownerCode = ownerCode;
  result.equipmentCategory = equipmentCategory;
  result.serialNumber = serialNumber;
  result.checkDigit = checkDigit;
  
  // Validate equipment category
  if (!CATEGORY_CODES[equipmentCategory]) {
    errors.push(`Invalid equipment category code: ${equipmentCategory}`);
  } else {
    result.details.categoryDescription = CATEGORY_CODES[equipmentCategory].description;
    result.details.categoryType = CATEGORY_CODES[equipmentCategory].type;
  }
  
  // Look up owner code
  if (OWNER_CODES[ownerCode]) {
    result.details.ownerDescription = OWNER_CODES[ownerCode];
  } else {
    result.details.ownerDescription = 'Unknown owner (not in database)';
  }
  
  // Calculate and validate check digit
  const calculatedCheckDigit = calculateCheckDigit(cleaned);
  result.calculatedCheckDigit = calculatedCheckDigit;
  
  if (checkDigit !== calculatedCheckDigit) {
    errors.push(`Invalid check digit: expected ${calculatedCheckDigit}, got ${checkDigit}`);
  }
  
  result.errors = errors;
  result.valid = errors.length === 0;
  
  return result;
}

export function generateContainerNumber(
  ownerCode: string = 'MSC',
  category: string = 'U'
): string {
  // Validate owner code
  if (!/^[A-Z]{3}$/.test(ownerCode.toUpperCase())) {
    throw new Error('Owner code must be 3 uppercase letters');
  }
  
  // Validate category
  if (!CATEGORY_CODES[category.toUpperCase()]) {
    throw new Error(`Invalid category code: ${category}`);
  }
  
  // Generate random serial number
  const serial = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  
  // Build number without check digit
  const partial = ownerCode.toUpperCase() + category.toUpperCase() + serial;
  
  // Calculate check digit
  const checkDigit = calculateCheckDigit(partial);
  
  return partial + checkDigit.toString();
}

export function parseContainerNumber(input: string): {
  ownerCode: string;
  equipmentCategory: string;
  serialNumber: string;
  checkDigit: string;
  formatted: string;
} {
  const cleaned = input.replace(/[\s\-]/g, '').toUpperCase();
  
  if (cleaned.length !== 11) {
    throw new Error(`Invalid container number length: ${cleaned.length}`);
  }
  
  return {
    ownerCode: cleaned.slice(0, 3),
    equipmentCategory: cleaned.slice(3, 4),
    serialNumber: cleaned.slice(4, 10),
    checkDigit: cleaned.slice(10),
    formatted: `${cleaned.slice(0, 4)} ${cleaned.slice(4, 10)} ${cleaned.slice(10)}`,
  };
}

export function batchValidate(containerNumbers: string[]): {
  results: ContainerValidationResult[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    errors: { containerNumber: string; errors: string[] }[];
  };
} {
  const results = containerNumbers.map(num => validateContainerNumber(num));
  
  const valid = results.filter(r => r.valid);
  const invalid = results.filter(r => !r.valid);
  
  return {
    results,
    summary: {
      total: results.length,
      valid: valid.length,
      invalid: invalid.length,
      errors: invalid.map(r => ({
        containerNumber: r.containerNumber,
        errors: r.errors,
      })),
    },
  };
}

export function getKnownOwnerCodes(): { code: string; name: string }[] {
  return Object.entries(OWNER_CODES).map(([code, name]) => ({ code, name }));
}

export function getEquipmentCategories(): { code: string; description: string; type: string }[] {
  return Object.entries(CATEGORY_CODES).map(([code, info]) => ({
    code,
    description: info.description,
    type: info.type,
  }));
}

// Shipping-related validators
export interface BillOfLadingResult {
  valid: boolean;
  formatted: string;
  carrier: string;
  type: string;
  errors: string[];
}

export function validateBillOfLading(input: string): BillOfLadingResult {
  const cleaned = input.replace(/[\s\-]/g, '').toUpperCase();
  
  // Common B/L formats: CARRIER (4-5 letters) + NUMBER (9-12 digits)
  const match = cleaned.match(/^([A-Z]{4,5})(\d{9,12})$/);
  
  if (!match) {
    return {
      valid: false,
      formatted: cleaned,
      carrier: '',
      type: 'unknown',
      errors: ['Invalid Bill of Lading format'],
    };
  }
  
  const carrier = match[1];
  const number = match[2];
  
  // Known carrier prefixes
  const carriers: Record<string, string> = {
    'MSCUO': 'Mediterranean Shipping Company',
    'MAEU': 'Maersk Line',
    'CMAU': 'CMA CGM',
    'COSU': 'COSCO',
    'EGLV': 'Evergreen',
    'HLCU': 'Hapag-Lloyd',
    'YMLU': 'Yang Ming',
    'ONEY': 'Ocean Network Express',
    'HDMU': 'Hyundai',
    'ZIMU': 'ZIM',
  };
  
  const carrierName = carriers[carrier] || 'Unknown carrier';
  
  return {
    valid: true,
    formatted: `${carrier}-${number}`,
    carrier: carrierName,
    type: 'Ocean Bill of Lading',
    errors: [],
  };
}

export interface BookingResult {
  valid: boolean;
  formatted: string;
  type: string;
  errors: string[];
}

export function validateBookingNumber(input: string): BookingResult {
  const cleaned = input.replace(/[\s\-]/g, '').toUpperCase();
  
  // Common booking number formats
  // Typically 9-14 alphanumeric characters
  if (/^[A-Z0-9]{9,14}$/.test(cleaned)) {
    return {
      valid: true,
      formatted: cleaned,
      type: 'Container Booking Number',
      errors: [],
    };
  }
  
  return {
    valid: false,
    formatted: cleaned,
    type: 'unknown',
    errors: ['Invalid booking number format'],
  };
}

export interface SealResult {
  valid: boolean;
  sealNumber: string;
  type: string;
  errors: string[];
}

export function validateSealNumber(input: string): SealResult {
  const cleaned = input.replace(/[\s]/g, '').toUpperCase();
  
  // Seal numbers vary widely but typically:
  // - 6-10 characters
  // - Alphanumeric
  if (/^[A-Z0-9]{6,10}$/.test(cleaned)) {
    // Try to determine type
    let type = 'Standard Seal';
    
    if (/^ML/.test(cleaned)) type = 'Mechanical Seal';
    if (/^BL/.test(cleaned)) type = 'Bolt Seal';
    if (/^CL/.test(cleaned)) type = 'Cable Seal';
    if (/^RL/.test(cleaned)) type = 'RFID Seal';
    
    return {
      valid: true,
      sealNumber: cleaned,
      type,
      errors: [],
    };
  }
  
  return {
    valid: false,
    sealNumber: cleaned,
    type: 'unknown',
    errors: ['Invalid seal number format (expected 6-10 alphanumeric characters)'],
  };
}
