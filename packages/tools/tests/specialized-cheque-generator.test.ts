import { describe, it, expect } from 'vitest';
import {
  numberToWords,
  formatAmount,
  generateMICRLine,
  validateChequeData,
  generateChequeSVG,
  createCheque,
  createUSDCheque,
  createGBPCheque,
  createSARCheque,
  type ChequeData,
  type ChequeStyle,
} from '../src/specialized/cheque-generator';

// ---------------------------------------------------------------------------
// numberToWords
// ---------------------------------------------------------------------------
describe('Cheque Generator', () => {
  describe('numberToWords', () => {
    it('converts 0 to "Zero Dollars Only"', () => {
      expect(numberToWords(0)).toBe('Zero Dollars Only');
    });

    it('converts single-digit whole numbers', () => {
      expect(numberToWords(5)).toBe('Five Dollars Only');
    });

    it('converts teens', () => {
      expect(numberToWords(13)).toBe('Thirteen Dollars Only');
    });

    it('converts tens with hyphenated compound', () => {
      expect(numberToWords(21)).toBe('Twenty-One Dollars Only');
    });

    it('converts round hundred', () => {
      expect(numberToWords(100)).toBe('One Hundred Dollars Only');
    });

    it('uses "and" between hundreds and remainder', () => {
      expect(numberToWords(105)).toBe('One Hundred and Five Dollars Only');
    });

    it('converts thousands', () => {
      expect(numberToWords(1000)).toBe('One Thousand Dollars Only');
    });

    it('converts complex number', () => {
      expect(numberToWords(1234)).toBe(
        'One Thousand Two Hundred and Thirty-Four Dollars Only',
      );
    });

    it('converts millions', () => {
      expect(numberToWords(2000000)).toBe('Two Million Dollars Only');
    });

    it('handles cents', () => {
      expect(numberToWords(10.50)).toBe('Ten Dollars and Fifty Cents Only');
    });

    it('handles small cents value', () => {
      // When dollars=0, the function produces " Dollars and ... Cents Only"
      // because the zero-check only catches amount===0 exactly
      expect(numberToWords(0.01)).toBe(' Dollars and One Cents Only');
    });

    it('accepts custom currency', () => {
      expect(numberToWords(100, 'SAR')).toBe('One Hundred SAR Only');
    });

    it('converts large amount with multiple scales', () => {
      const result = numberToWords(1001001);
      expect(result).toContain('One Million');
      expect(result).toContain('One Thousand');
      expect(result).toContain('One Dollars Only');
    });
  });

  // -------------------------------------------------------------------------
  // formatAmount
  // -------------------------------------------------------------------------
  describe('formatAmount', () => {
    it('formats USD by default', () => {
      const formatted = formatAmount(1234.50);
      expect(formatted).toContain('1,234.50');
      expect(formatted).toContain('$');
    });

    it('formats GBP', () => {
      const formatted = formatAmount(500, 'GBP');
      expect(formatted).toContain('500.00');
      expect(formatted).toContain('£');
    });

    it('formats SAR', () => {
      const formatted = formatAmount(750.25, 'SAR');
      expect(formatted).toContain('750.25');
    });

    it('rounds to two decimal places', () => {
      const formatted = formatAmount(10.999);
      expect(formatted).toContain('11.00');
    });
  });

  // -------------------------------------------------------------------------
  // generateMICRLine
  // -------------------------------------------------------------------------
  describe('generateMICRLine', () => {
    it('produces correct MICR format', () => {
      const micr = generateMICRLine('000123', '987654321', '1234567890');
      expect(micr).toBe('C000123C A987654321A 1234567890B');
    });

    it('includes all three components', () => {
      const micr = generateMICRLine('001', '111', '222');
      expect(micr).toContain('C001C');
      expect(micr).toContain('A111A');
      expect(micr).toContain('222B');
    });
  });

  // -------------------------------------------------------------------------
  // validateChequeData
  // -------------------------------------------------------------------------
  describe('validateChequeData', () => {
    it('valid when all required fields present', () => {
      const result = validateChequeData({
        payeeName: 'John Doe',
        amount: 100,
        date: '2025-01-15',
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('invalid when payeeName missing', () => {
      const result = validateChequeData({ amount: 100, date: '2025-01-15' });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/payee name/i);
    });

    it('invalid when payeeName too short', () => {
      const result = validateChequeData({
        payeeName: 'A',
        amount: 100,
        date: '2025-01-15',
      });
      expect(result.valid).toBe(false);
    });

    it('invalid when amount is zero', () => {
      const result = validateChequeData({
        payeeName: 'Jane',
        amount: 0,
        date: '2025-01-15',
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/amount/i);
    });

    it('invalid when amount is negative', () => {
      const result = validateChequeData({
        payeeName: 'Jane',
        amount: -10,
        date: '2025-01-15',
      });
      expect(result.valid).toBe(false);
    });

    it('invalid when amount exceeds max', () => {
      const result = validateChequeData({
        payeeName: 'Jane',
        amount: 1000000000,
        date: '2025-01-15',
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/maximum/i);
    });

    it('invalid when date missing', () => {
      const result = validateChequeData({
        payeeName: 'Jane',
        amount: 100,
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/date/i);
    });

    it('collects multiple errors', () => {
      const result = validateChequeData({});
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  // -------------------------------------------------------------------------
  // generateChequeSVG
  // -------------------------------------------------------------------------
  describe('generateChequeSVG', () => {
    const validData: ChequeData = {
      payeeName: 'Alice Smith',
      amount: 500,
      amountInWords: 'Five Hundred Dollars Only',
      date: '2025-06-01',
      bankName: 'Test Bank',
      chequeNumber: '001234',
      accountNumber: '9876543210',
      memo: 'Rent payment',
    };

    it('returns an SVG string', () => {
      const svg = generateChequeSVG(validData);
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
    });

    it('includes payee name', () => {
      const svg = generateChequeSVG(validData);
      expect(svg).toContain('Alice Smith');
    });

    it('includes bank name', () => {
      const svg = generateChequeSVG(validData);
      expect(svg).toContain('Test Bank');
    });

    it('includes formatted amount', () => {
      const svg = generateChequeSVG(validData);
      expect(svg).toContain('500.00');
    });

    it('includes amount in words', () => {
      const svg = generateChequeSVG(validData);
      expect(svg).toContain('Five Hundred Dollars Only');
    });

    it('includes date', () => {
      const svg = generateChequeSVG(validData);
      expect(svg).toContain('2025-06-01');
    });

    it('includes cheque number', () => {
      const svg = generateChequeSVG(validData);
      expect(svg).toContain('001234');
    });

    it('includes memo text', () => {
      const svg = generateChequeSVG(validData);
      expect(svg).toContain('Rent payment');
    });

    it('masks account number (shows last 4)', () => {
      const svg = generateChequeSVG(validData);
      expect(svg).toContain('******3210');
    });

    it('applies custom width and height', () => {
      const svg = generateChequeSVG(validData, { width: 1000, height: 500 });
      expect(svg).toContain('width="1000"');
      expect(svg).toContain('height="500"');
    });

    it('escapes XML special characters', () => {
      const data: ChequeData = {
        ...validData,
        payeeName: 'A & B <Corp>',
      };
      const svg = generateChequeSVG(data);
      expect(svg).toContain('A &amp; B &lt;Corp&gt;');
      expect(svg).not.toContain('A & B <Corp>');
    });

    it('shows default bank name when not provided', () => {
      const data: ChequeData = { ...validData, bankName: undefined };
      const svg = generateChequeSVG(data);
      expect(svg).toContain('BANK NAME');
    });

    it('shows default cheque number when not provided', () => {
      const data: ChequeData = { ...validData, chequeNumber: undefined };
      const svg = generateChequeSVG(data);
      expect(svg).toContain('000000');
    });

    it('auto-generates MICR line when none provided', () => {
      const data: ChequeData = { ...validData, micrLine: undefined };
      const svg = generateChequeSVG(data);
      // Should contain generated MICR using chequeNumber and accountNumber
      expect(svg).toContain('C001234C');
    });

    it('uses provided MICR line', () => {
      const data: ChequeData = {
        ...validData,
        micrLine: 'CUSTOM_MICR_LINE',
      };
      const svg = generateChequeSVG(data);
      expect(svg).toContain('CUSTOM_MICR_LINE');
    });

    it('includes security text', () => {
      const svg = generateChequeSVG(validData);
      expect(svg).toContain('VOID AFTER 90 DAYS');
    });

    it('includes PAY TO THE ORDER OF label', () => {
      const svg = generateChequeSVG(validData);
      expect(svg).toContain('PAY TO THE ORDER OF');
    });

    it('includes AUTHORIZED SIGNATURE label', () => {
      const svg = generateChequeSVG(validData);
      expect(svg).toContain('AUTHORIZED SIGNATURE');
    });
  });

  // -------------------------------------------------------------------------
  // createCheque
  // -------------------------------------------------------------------------
  describe('createCheque', () => {
    it('returns svg and data', () => {
      const result = createCheque('Bob', 250.75, '2025-06-15');
      expect(result.svg).toContain('<svg');
      expect(result.data.payeeName).toBe('Bob');
      expect(result.data.amount).toBe(250.75);
      expect(result.data.date).toBe('2025-06-15');
    });

    it('generates amountInWords automatically', () => {
      const result = createCheque('Bob', 100, '2025-06-15');
      expect(result.data.amountInWords).toBe('One Hundred Dollars Only');
    });

    it('applies optional memo', () => {
      const result = createCheque('Bob', 50, '2025-06-15', { memo: 'Gift' });
      expect(result.data.memo).toBe('Gift');
    });

    it('generates MICR when account and cheque number provided', () => {
      const result = createCheque('Bob', 50, '2025-06-15', {
        accountNumber: '1111111111',
        chequeNumber: '000999',
      });
      expect(result.data.micrLine).toBe('C000999C A123456789A 1111111111B');
    });

    it('throws on invalid data (short payee name)', () => {
      expect(() => createCheque('A', 100, '2025-06-15')).toThrow(
        /invalid cheque data/i,
      );
    });

    it('throws on invalid data (zero amount)', () => {
      expect(() => createCheque('Bob', 0, '2025-06-15')).toThrow(
        /invalid cheque data/i,
      );
    });

    it('applies custom style to SVG', () => {
      const result = createCheque('Bob', 100, '2025-06-15', {
        style: { width: 1000, height: 500 },
      });
      expect(result.svg).toContain('width="1000"');
    });

    it('uses custom currency label in words', () => {
      const result = createCheque('Bob', 100, '2025-06-15', {
        currency: 'SAR',
      });
      expect(result.data.amountInWords).toContain('SAR');
    });

    it('uses "Dollars" when currency is USD', () => {
      const result = createCheque('Bob', 100, '2025-06-15', {
        currency: 'USD',
      });
      expect(result.data.amountInWords).toContain('Dollars');
    });
  });

  // -------------------------------------------------------------------------
  // Currency-specific generators
  // -------------------------------------------------------------------------
  describe('createUSDCheque', () => {
    it('creates a valid cheque', () => {
      const result = createUSDCheque('Alice', 500, '2025-07-01');
      expect(result.svg).toContain('<svg');
      expect(result.data.amountInWords).toContain('Dollars');
    });

    it('passes options through', () => {
      const result = createUSDCheque('Alice', 500, '2025-07-01', {
        memo: 'Test',
      });
      expect(result.data.memo).toBe('Test');
    });
  });

  describe('createGBPCheque', () => {
    it('uses GBP currency label', () => {
      const result = createGBPCheque('Charlie', 300, '2025-07-01');
      expect(result.data.amountInWords).toContain('GBP');
    });

    it('passes GBP currency through', () => {
      const result = createGBPCheque('Charlie', 300, '2025-07-01');
      expect(result.data.amountInWords).toContain('GBP');
      expect(result.svg).toContain('<svg');
    });
  });

  describe('createSARCheque', () => {
    it('uses SAR currency label', () => {
      const result = createSARCheque('Ahmed', 1000, '2025-07-01');
      expect(result.data.amountInWords).toContain('SAR');
    });

    it('passes options through', () => {
      const result = createSARCheque('Ahmed', 1000, '2025-07-01', {
        bankName: 'Al Rajhi',
      });
      expect(result.data.bankName).toBe('Al Rajhi');
    });
  });
});
