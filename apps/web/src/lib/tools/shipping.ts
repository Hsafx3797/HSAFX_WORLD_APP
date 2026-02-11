// Shipping and Container Validation Tools
// Re-exports from @hsafx/tool-execution package

export {
  validateContainerNumber,
  calculateCheckDigit,
  generateContainerNumber,
  parseContainerNumber,
  batchValidate as batchValidateContainers,
  validateBillOfLading,
  validateBookingNumber,
  validateSealNumber,
  getKnownOwnerCodes as getOwnerCodes,
  getEquipmentCategories,
  type ContainerValidationResult,
  type BillOfLadingResult,
  type BookingResult,
  type SealResult,
} from '@hsafx/tool-execution/specialized';

// Carrier detection helper
export function detectCarrier(trackingNumber: string): {
  carrier: string;
  confidence: 'high' | 'medium' | 'low';
  format: string;
} {
  const cleaned = trackingNumber.replace(/[\s\-]/g, '').toUpperCase();
  
  // Shipping line prefixes
  const carriers: Record<string, { name: string; pattern: RegExp }> = {
    'MAERSK': { name: 'Maersk Line', pattern: /^MAEU|^MRKU|^MSKU/ },
    'MSC': { name: 'Mediterranean Shipping Company', pattern: /^MSCU|^MEDU/ },
    'CMA': { name: 'CMA CGM', pattern: /^CMAU|^CGMU/ },
    'COSCO': { name: 'COSCO Shipping', pattern: /^COSU|^CBHU/ },
    'EVERGREEN': { name: 'Evergreen Line', pattern: /^EGLV|^EGHU/ },
    'HAPAG': { name: 'Hapag-Lloyd', pattern: /^HLCU|^HLXU/ },
    'ONE': { name: 'Ocean Network Express', pattern: /^ONEY/ },
    'YANGMING': { name: 'Yang Ming', pattern: /^YMLU/ },
    'HMM': { name: 'Hyundai Merchant Marine', pattern: /^HDMU/ },
    'ZIM': { name: 'ZIM', pattern: /^ZIMU/ },
  };
  
  for (const [_key, { name, pattern }] of Object.entries(carriers)) {
    if (pattern.test(cleaned)) {
      return { carrier: name, confidence: 'high', format: 'Container Number' };
    }
  }
  
  // Check if it looks like a container number
  if (/^[A-Z]{4}\d{7}$/.test(cleaned)) {
    return { carrier: 'Unknown Carrier', confidence: 'medium', format: 'Container Number' };
  }
  
  // Check if it looks like a B/L
  if (/^[A-Z]{4,5}\d{9,12}$/.test(cleaned)) {
    return { carrier: 'Unknown Carrier', confidence: 'medium', format: 'Bill of Lading' };
  }
  
  return { carrier: 'Unknown', confidence: 'low', format: 'Unknown' };
}
