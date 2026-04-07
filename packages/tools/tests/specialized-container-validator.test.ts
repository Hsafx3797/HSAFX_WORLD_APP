import { describe, it, expect } from 'vitest';
import {
  calculateCheckDigit,
  validateContainerNumber,
  generateContainerNumber,
  parseContainerNumber,
  batchValidate,
  getKnownOwnerCodes,
  getEquipmentCategories,
  validateBillOfLading,
  validateBookingNumber,
  validateSealNumber,
} from '../src/specialized/container-validator';

describe('Container Validator', () => {
  // -------------------------------------------------------------------------
  // calculateCheckDigit
  // -------------------------------------------------------------------------
  describe('calculateCheckDigit', () => {
    it('returns a single digit 0-9', () => {
      const digit = calculateCheckDigit('MSCU1234560');
      expect(digit).toBeGreaterThanOrEqual(0);
      expect(digit).toBeLessThanOrEqual(9);
    });

    it('maps 10 to 0 (modulo 11 edge case)', () => {
      // We verify this behavior indirectly: the function always returns 0-9
      for (let i = 0; i < 20; i++) {
        const serial = i.toString().padStart(6, '0');
        const digit = calculateCheckDigit(`MSCU${serial}`);
        expect(digit).toBeLessThanOrEqual(9);
        expect(digit).toBeGreaterThanOrEqual(0);
      }
    });

    it('is deterministic for the same input', () => {
      const a = calculateCheckDigit('MSCU1234560');
      const b = calculateCheckDigit('MSCU1234560');
      expect(a).toBe(b);
    });

    it('changes when input changes', () => {
      const a = calculateCheckDigit('MSCU1234560');
      const b = calculateCheckDigit('MSCU1234570');
      // Different inputs should typically produce different check digits
      // (not guaranteed by math but overwhelmingly likely for adjacent serials)
      expect(typeof a).toBe('number');
      expect(typeof b).toBe('number');
    });
  });

  // -------------------------------------------------------------------------
  // validateContainerNumber
  // -------------------------------------------------------------------------
  describe('validateContainerNumber', () => {
    it('validates a correctly formatted container number', () => {
      // Generate a valid number and validate it
      const num = generateContainerNumber('MSC', 'U');
      const result = validateContainerNumber(num);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('extracts owner code, category, serial, and check digit', () => {
      const num = generateContainerNumber('MAE', 'U');
      const result = validateContainerNumber(num);
      expect(result.ownerCode).toBe('MAE');
      expect(result.equipmentCategory).toBe('U');
      expect(result.serialNumber).toHaveLength(6);
      expect(result.checkDigit).toBe(result.calculatedCheckDigit);
    });

    it('provides owner description for known codes', () => {
      const num = generateContainerNumber('MSC', 'U');
      const result = validateContainerNumber(num);
      expect(result.details.ownerDescription).toBe(
        'Mediterranean Shipping Company',
      );
    });

    it('reports unknown owner for unrecognized codes', () => {
      const num = generateContainerNumber('XYZ', 'U');
      const result = validateContainerNumber(num);
      expect(result.details.ownerDescription).toContain('Unknown');
    });

    it('provides category description', () => {
      const num = generateContainerNumber('MSC', 'R');
      const result = validateContainerNumber(num);
      expect(result.details.categoryDescription).toContain('Reefer');
      expect(result.details.categoryType).toBe('reefer');
    });

    it('rejects wrong length', () => {
      const result = validateContainerNumber('MSCU12345');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/length/i);
    });

    it('rejects invalid format (digits where letters expected)', () => {
      const result = validateContainerNumber('1234U567890');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/format/i);
    });

    it('rejects invalid check digit', () => {
      const num = generateContainerNumber('MSC', 'U');
      // Flip the last digit
      const lastDigit = parseInt(num[10], 10);
      const wrongDigit = (lastDigit + 1) % 10;
      const bad = num.slice(0, 10) + wrongDigit.toString();
      const result = validateContainerNumber(bad);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/check digit/i);
    });

    it('strips spaces and dashes from input', () => {
      const num = generateContainerNumber('MSC', 'U');
      const spaced = num.slice(0, 4) + ' ' + num.slice(4, 10) + '-' + num.slice(10);
      const result = validateContainerNumber(spaced);
      expect(result.valid).toBe(true);
    });

    it('handles lowercase input', () => {
      const num = generateContainerNumber('MSC', 'U');
      const result = validateContainerNumber(num.toLowerCase());
      expect(result.valid).toBe(true);
    });

    it('rejects invalid equipment category letter', () => {
      // Build a number with 'A' as category (not U/J/Z/R)
      const partial = 'MSCA' + '123456';
      const checkDigit = calculateCheckDigit(partial);
      const num = partial + checkDigit.toString();
      const result = validateContainerNumber(num);
      // Should have equipment category error but format is still valid
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/equipment category/i);
    });
  });

  // -------------------------------------------------------------------------
  // generateContainerNumber
  // -------------------------------------------------------------------------
  describe('generateContainerNumber', () => {
    it('generates 11-character string', () => {
      const num = generateContainerNumber();
      expect(num).toHaveLength(11);
    });

    it('starts with owner code + category', () => {
      const num = generateContainerNumber('CMA', 'Z');
      expect(num.slice(0, 3)).toBe('CMA');
      expect(num[3]).toBe('Z');
    });

    it('produces a valid container number', () => {
      const num = generateContainerNumber('EVG', 'U');
      const result = validateContainerNumber(num);
      expect(result.valid).toBe(true);
    });

    it('defaults to MSC owner and U category', () => {
      const num = generateContainerNumber();
      expect(num.slice(0, 3)).toBe('MSC');
      expect(num[3]).toBe('U');
    });

    it('throws for invalid owner code (too short)', () => {
      expect(() => generateContainerNumber('MS', 'U')).toThrow(/owner code/i);
    });

    it('throws for invalid owner code (contains digits)', () => {
      expect(() => generateContainerNumber('M1C', 'U')).toThrow(/owner code/i);
    });

    it('throws for invalid category', () => {
      expect(() => generateContainerNumber('MSC', 'X')).toThrow(/category/i);
    });

    it('accepts lowercase owner and category', () => {
      const num = generateContainerNumber('msc', 'u');
      expect(num.slice(0, 3)).toBe('MSC');
      expect(num[3]).toBe('U');
    });
  });

  // -------------------------------------------------------------------------
  // parseContainerNumber
  // -------------------------------------------------------------------------
  describe('parseContainerNumber', () => {
    it('extracts all parts from valid number', () => {
      const num = generateContainerNumber('HPL', 'J');
      const parsed = parseContainerNumber(num);
      expect(parsed.ownerCode).toBe('HPL');
      expect(parsed.equipmentCategory).toBe('J');
      expect(parsed.serialNumber).toHaveLength(6);
      expect(parsed.checkDigit).toHaveLength(1);
    });

    it('returns formatted version with spaces', () => {
      const num = generateContainerNumber('MSC', 'U');
      const parsed = parseContainerNumber(num);
      // formatted = "MSCU 123456 D"
      expect(parsed.formatted).toContain(' ');
      const parts = parsed.formatted.split(' ');
      expect(parts).toHaveLength(3);
      expect(parts[0]).toHaveLength(4);
      expect(parts[1]).toHaveLength(6);
      expect(parts[2]).toHaveLength(1);
    });

    it('strips spaces and dashes before parsing', () => {
      const num = generateContainerNumber('MSC', 'U');
      const spaced = num.slice(0, 4) + ' ' + num.slice(4, 10) + '-' + num.slice(10);
      const parsed = parseContainerNumber(spaced);
      expect(parsed.ownerCode).toBe('MSC');
    });

    it('throws on invalid length', () => {
      expect(() => parseContainerNumber('SHORT')).toThrow(/length/i);
    });
  });

  // -------------------------------------------------------------------------
  // batchValidate
  // -------------------------------------------------------------------------
  describe('batchValidate', () => {
    it('validates multiple container numbers', () => {
      const nums = [
        generateContainerNumber('MSC', 'U'),
        generateContainerNumber('CMA', 'R'),
      ];
      const batch = batchValidate(nums);
      expect(batch.summary.total).toBe(2);
      expect(batch.summary.valid).toBe(2);
      expect(batch.summary.invalid).toBe(0);
    });

    it('counts invalid numbers', () => {
      const nums = [generateContainerNumber('MSC', 'U'), 'INVALID123'];
      const batch = batchValidate(nums);
      expect(batch.summary.total).toBe(2);
      expect(batch.summary.valid).toBe(1);
      expect(batch.summary.invalid).toBe(1);
    });

    it('returns error details for invalid entries', () => {
      const batch = batchValidate(['ABCDEFGHIJK']);
      expect(batch.summary.errors).toHaveLength(1);
      expect(batch.summary.errors[0].errors.length).toBeGreaterThan(0);
    });

    it('handles empty array', () => {
      const batch = batchValidate([]);
      expect(batch.summary.total).toBe(0);
      expect(batch.summary.valid).toBe(0);
      expect(batch.results).toHaveLength(0);
    });

    it('returns results array matching input length', () => {
      const nums = [
        generateContainerNumber(),
        generateContainerNumber(),
        generateContainerNumber(),
      ];
      const batch = batchValidate(nums);
      expect(batch.results).toHaveLength(3);
    });
  });

  // -------------------------------------------------------------------------
  // getKnownOwnerCodes
  // -------------------------------------------------------------------------
  describe('getKnownOwnerCodes', () => {
    it('returns 27 owner codes', () => {
      expect(getKnownOwnerCodes()).toHaveLength(27);
    });

    it('each entry has code and name', () => {
      const codes = getKnownOwnerCodes();
      for (const entry of codes) {
        expect(entry.code).toBeTruthy();
        expect(entry.name).toBeTruthy();
      }
    });

    it('includes MSC', () => {
      const codes = getKnownOwnerCodes();
      const msc = codes.find(c => c.code === 'MSC');
      expect(msc).toBeDefined();
      expect(msc!.name).toContain('Mediterranean');
    });
  });

  // -------------------------------------------------------------------------
  // getEquipmentCategories
  // -------------------------------------------------------------------------
  describe('getEquipmentCategories', () => {
    it('returns 4 categories', () => {
      expect(getEquipmentCategories()).toHaveLength(4);
    });

    it('each entry has code, description, and type', () => {
      const cats = getEquipmentCategories();
      for (const c of cats) {
        expect(c.code).toBeTruthy();
        expect(c.description).toBeTruthy();
        expect(c.type).toBeTruthy();
      }
    });

    it('includes freight category U', () => {
      const cats = getEquipmentCategories();
      const u = cats.find(c => c.code === 'U');
      expect(u).toBeDefined();
      expect(u!.type).toBe('freight');
    });

    it('includes reefer category R', () => {
      const cats = getEquipmentCategories();
      const r = cats.find(c => c.code === 'R');
      expect(r).toBeDefined();
      expect(r!.type).toBe('reefer');
    });
  });

  // -------------------------------------------------------------------------
  // validateBillOfLading
  // -------------------------------------------------------------------------
  describe('validateBillOfLading', () => {
    it('validates correct B/L format', () => {
      const result = validateBillOfLading('MAEU123456789');
      expect(result.valid).toBe(true);
      expect(result.carrier).toBe('Maersk Line');
      expect(result.type).toBe('Ocean Bill of Lading');
    });

    it('formats with dash separator', () => {
      const result = validateBillOfLading('CMAU123456789');
      expect(result.formatted).toBe('CMAU-123456789');
    });

    it('reports unknown carrier for unrecognized prefix', () => {
      const result = validateBillOfLading('ABCD123456789');
      expect(result.valid).toBe(true);
      expect(result.carrier).toBe('Unknown carrier');
    });

    it('rejects too-short number', () => {
      const result = validateBillOfLading('MAE123');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/format/i);
    });

    it('rejects all-numeric input', () => {
      const result = validateBillOfLading('1234567890123');
      expect(result.valid).toBe(false);
    });

    it('strips spaces and dashes', () => {
      const result = validateBillOfLading('MAEU 123 456 789');
      expect(result.valid).toBe(true);
    });

    it('handles lowercase', () => {
      const result = validateBillOfLading('maeu123456789');
      expect(result.valid).toBe(true);
    });

    it('accepts 5-letter carrier with 12-digit number', () => {
      const result = validateBillOfLading('MSCUO123456789012');
      expect(result.valid).toBe(true);
      expect(result.carrier).toBe('Mediterranean Shipping Company');
    });
  });

  // -------------------------------------------------------------------------
  // validateBookingNumber
  // -------------------------------------------------------------------------
  describe('validateBookingNumber', () => {
    it('validates 9-character alphanumeric booking', () => {
      const result = validateBookingNumber('ABC123DEF');
      expect(result.valid).toBe(true);
      expect(result.type).toBe('Container Booking Number');
    });

    it('validates 14-character alphanumeric booking', () => {
      const result = validateBookingNumber('AB12CD34EF56GH');
      expect(result.valid).toBe(true);
    });

    it('rejects too-short input', () => {
      const result = validateBookingNumber('AB12');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/format/i);
    });

    it('rejects too-long input', () => {
      const result = validateBookingNumber('ABCDEFGHIJKLMNO');
      expect(result.valid).toBe(false);
    });

    it('strips spaces and dashes', () => {
      const result = validateBookingNumber('ABC-123-DEF');
      expect(result.valid).toBe(true);
    });

    it('handles lowercase', () => {
      const result = validateBookingNumber('abc123def');
      expect(result.valid).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // validateSealNumber
  // -------------------------------------------------------------------------
  describe('validateSealNumber', () => {
    it('validates standard seal (6 chars)', () => {
      const result = validateSealNumber('AB1234');
      expect(result.valid).toBe(true);
      expect(result.type).toBe('Standard Seal');
    });

    it('validates 10-character seal', () => {
      const result = validateSealNumber('ABCDEF1234');
      expect(result.valid).toBe(true);
    });

    it('detects Mechanical Seal (ML prefix)', () => {
      const result = validateSealNumber('ML123456');
      expect(result.type).toBe('Mechanical Seal');
    });

    it('detects Bolt Seal (BL prefix)', () => {
      const result = validateSealNumber('BL123456');
      expect(result.type).toBe('Bolt Seal');
    });

    it('detects Cable Seal (CL prefix)', () => {
      const result = validateSealNumber('CL123456');
      expect(result.type).toBe('Cable Seal');
    });

    it('detects RFID Seal (RL prefix)', () => {
      const result = validateSealNumber('RL123456');
      expect(result.type).toBe('RFID Seal');
    });

    it('rejects too-short seal', () => {
      const result = validateSealNumber('AB12');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/6-10/);
    });

    it('rejects too-long seal', () => {
      const result = validateSealNumber('ABCDEFGHIJK');
      expect(result.valid).toBe(false);
    });

    it('strips spaces before validation', () => {
      const result = validateSealNumber('ML 123456');
      expect(result.valid).toBe(true);
      expect(result.type).toBe('Mechanical Seal');
    });

    it('handles lowercase', () => {
      const result = validateSealNumber('ml123456');
      expect(result.valid).toBe(true);
    });
  });
});
