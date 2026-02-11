import { describe, it, expect } from 'vitest';

// ─── GPA Calculator ───────────────────────────────────────────────────────────
import {
  calculateGPA,
  calculateCGPA,
  convertGPA,
  getRequiredGPA,
  getGradeScale,
  getSupportedSystems,
} from '../gpa-calculator';
import type { Course } from '../gpa-calculator';

// ─── File Tree ────────────────────────────────────────────────────────────────
import {
  generateASCIITree,
  generateMarkdownTree,
  generateHTMLTree,
  generateJSONTree,
  parseDirectoryStructure,
  textToTree,
} from '../file-tree';
import type { TreeNode } from '../file-tree';

// ─── Container Validator ──────────────────────────────────────────────────────
import {
  validateContainerNumber,
  calculateCheckDigit,
  generateContainerNumber,
  parseContainerNumber,
  batchValidate,
  getKnownOwnerCodes,
  getEquipmentCategories,
} from '../container-validator';

// ─── Cheque Generator ─────────────────────────────────────────────────────────
import {
  numberToWords,
  formatAmount,
  generateMICRLine,
  validateChequeData,
  createCheque,
} from '../cheque-generator';

// ═══════════════════════════════════════════════════════════════════════════════
// GPA Calculator Tests
// ═══════════════════════════════════════════════════════════════════════════════
describe('GPA Calculator', () => {
  describe('calculateGPA', () => {
    it('should compute GPA on US 4.0 scale for A and B grades', () => {
      const courses: Course[] = [
        { name: 'Math', credits: 3, grade: 'A' },
        { name: 'English', credits: 3, grade: 'B' },
      ];
      const result = calculateGPA(courses, 'us-4.0');
      // A=4.0, B=3.0 → (12+9)/6 = 3.5
      expect(result.gpa).toBe(3.5);
      expect(result.totalCredits).toBe(6);
    });

    it('should return GPA between 3.0 and 4.0 for A/B mix', () => {
      const courses: Course[] = [
        { name: 'Math', credits: 3, grade: 'A' },
        { name: 'English', credits: 3, grade: 'B' },
      ];
      const result = calculateGPA(courses, 'us-4.0');
      expect(result.gpa).toBeGreaterThanOrEqual(3.0);
      expect(result.gpa).toBeLessThanOrEqual(4.0);
    });

    it('should return 4.0 for all A grades on US 4.0 scale', () => {
      const courses: Course[] = [
        { name: 'Math', credits: 3, grade: 'A' },
        { name: 'Science', credits: 4, grade: 'A' },
      ];
      const result = calculateGPA(courses, 'us-4.0');
      expect(result.gpa).toBe(4.0);
    });

    it('should return 0 for all F grades', () => {
      const courses: Course[] = [
        { name: 'Math', credits: 3, grade: 'F' },
        { name: 'English', credits: 3, grade: 'F' },
      ];
      const result = calculateGPA(courses, 'us-4.0');
      expect(result.gpa).toBe(0);
    });

    it('should handle us-4.3 scale with A+ giving 4.3', () => {
      const courses: Course[] = [
        { name: 'Math', credits: 3, grade: 'A+' },
      ];
      const result = calculateGPA(courses, 'us-4.3');
      expect(result.gpa).toBe(4.3);
    });

    it('should return classification for US 4.0 scale', () => {
      const courses: Course[] = [
        { name: 'Math', credits: 3, grade: 'A' },
        { name: 'English', credits: 3, grade: 'A-' },
      ];
      const result = calculateGPA(courses, 'us-4.0');
      expect(result.classification).toBeDefined();
      expect(typeof result.classification).toBe('string');
    });

    it('should include system in result', () => {
      const result = calculateGPA(
        [{ name: 'X', credits: 3, grade: 'A' }],
        'us-4.0',
      );
      expect(result.system).toBe('us-4.0');
    });

    it('should handle empty courses array', () => {
      const result = calculateGPA([], 'us-4.0');
      expect(result.gpa).toBe(0);
      expect(result.totalCredits).toBe(0);
    });

    it('should support Saudi 5.0 scale', () => {
      const courses: Course[] = [
        { name: 'Arabic', credits: 3, grade: 'A+' },
      ];
      const result = calculateGPA(courses, 'saudi');
      expect(result.gpa).toBe(5.0);
    });

    it('should handle India percentage system with numeric grade', () => {
      const courses: Course[] = [
        { name: 'Physics', credits: 4, grade: 95 },
      ];
      const result = calculateGPA(courses, 'india-percentage');
      expect(result.gpa).toBe(10.0);
    });

    it('should weight credits correctly', () => {
      // 4-credit A (4.0*4=16) + 1-credit F (0*1=0) → 16/5 = 3.2
      const courses: Course[] = [
        { name: 'Major', credits: 4, grade: 'A' },
        { name: 'Minor', credits: 1, grade: 'F' },
      ];
      const result = calculateGPA(courses, 'us-4.0');
      expect(result.gpa).toBe(3.2);
      expect(result.totalCredits).toBe(5);
    });
  });

  describe('calculateCGPA', () => {
    it('should merge multiple semesters', () => {
      const semesters = [
        {
          courses: [
            { name: 'Math', credits: 3, grade: 'A' },
          ],
        },
        {
          courses: [
            { name: 'English', credits: 3, grade: 'B' },
          ],
        },
      ];
      const result = calculateCGPA(semesters, 'us-4.0');
      // (4*3 + 3*3) / 6 = 3.5
      expect(result.cgpa).toBe(3.5);
      expect(result.totalCredits).toBe(6);
      expect(result.semesterResults).toHaveLength(2);
    });

    it('should include classification in CGPA result', () => {
      const semesters = [
        { courses: [{ name: 'X', credits: 3, grade: 'A' }] },
      ];
      const result = calculateCGPA(semesters, 'us-4.0');
      expect(result.classification).toBeDefined();
    });

    it('should handle single semester CGPA', () => {
      const semesters = [
        {
          courses: [
            { name: 'Y', credits: 3, grade: 'B+' },
            { name: 'Z', credits: 3, grade: 'B+' },
          ],
        },
      ];
      const result = calculateCGPA(semesters, 'us-4.0');
      expect(result.cgpa).toBe(3.3);
    });
  });

  describe('convertGPA', () => {
    it('should convert between US 4.0 and Australian 7-point scale', () => {
      const result = convertGPA(4.0, 'us-4.0', 'australia');
      expect(result.convertedGPA).toBe(7.0);
      expect(result.approximateGrade).toBeDefined();
    });

    it('should convert zero GPA', () => {
      const result = convertGPA(0, 'us-4.0', 'australia');
      expect(result.convertedGPA).toBe(0);
    });

    it('should return approximate grade string', () => {
      const result = convertGPA(3.0, 'us-4.0', 'uk');
      expect(typeof result.approximateGrade).toBe('string');
      expect(result.approximateGrade.length).toBeGreaterThan(0);
    });
  });

  describe('getRequiredGPA', () => {
    it('should compute needed GPA for a target CGPA', () => {
      // target 3.5, current 3.0, 60 credits done, 30 remaining
      const result = getRequiredGPA(3.5, 3.0, 60, 30);
      // needed = (3.5*90 - 3.0*60) / 30 = (315-180)/30 = 4.5
      expect(result.requiredGPA).toBe(4.5);
      expect(result.achievable).toBe(false); // > 4.0
    });

    it('should mark achievable when required GPA <= 4.0', () => {
      const result = getRequiredGPA(3.5, 3.0, 30, 30);
      // needed = (3.5*60 - 3.0*30) / 30 = (210-90)/30 = 4.0
      expect(result.requiredGPA).toBe(4.0);
      expect(result.achievable).toBe(true);
    });
  });

  describe('getGradeScale', () => {
    it('should return array of {grade, points} for US 4.0', () => {
      const scale = getGradeScale('us-4.0');
      expect(Array.isArray(scale)).toBe(true);
      expect(scale.length).toBeGreaterThan(0);
      expect(scale[0]).toHaveProperty('grade');
      expect(scale[0]).toHaveProperty('points');
    });

    it('should be sorted descending by points', () => {
      const scale = getGradeScale('us-4.0');
      for (let i = 0; i < scale.length - 1; i++) {
        expect(scale[i].points).toBeGreaterThanOrEqual(scale[i + 1].points);
      }
    });
  });

  describe('getSupportedSystems', () => {
    it('should return array with id, name, country', () => {
      const systems = getSupportedSystems();
      expect(Array.isArray(systems)).toBe(true);
      expect(systems.length).toBeGreaterThanOrEqual(10);
      systems.forEach((sys) => {
        expect(sys).toHaveProperty('id');
        expect(sys).toHaveProperty('name');
        expect(sys).toHaveProperty('country');
      });
    });

    it('should include US 4.0 system', () => {
      const systems = getSupportedSystems();
      const us40 = systems.find((s) => s.id === 'us-4.0');
      expect(us40).toBeDefined();
      expect(us40!.country).toBe('United States');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// File Tree Tests
// ═══════════════════════════════════════════════════════════════════════════════
describe('File Tree', () => {
  const sampleTree: TreeNode = {
    name: 'src',
    type: 'directory',
    children: [
      { name: 'index.ts', type: 'file', extension: 'ts' },
      { name: 'utils.ts', type: 'file', extension: 'ts' },
      {
        name: 'components',
        type: 'directory',
        children: [
          { name: 'Button.tsx', type: 'file', extension: 'tsx' },
        ],
      },
    ],
  };

  describe('generateASCIITree', () => {
    it('should contain unicode tree characters by default', () => {
      const result = generateASCIITree(sampleTree);
      expect(result).toMatch(/[├└─│]/);
    });

    it('should contain ascii tree chars when style is ascii', () => {
      const result = generateASCIITree(sampleTree, { style: 'ascii' });
      expect(result).toMatch(/[|`\-]/);
    });

    it('should include all file names', () => {
      const result = generateASCIITree(sampleTree);
      expect(result).toContain('index.ts');
      expect(result).toContain('utils.ts');
      expect(result).toContain('Button.tsx');
    });

    it('should include root directory name', () => {
      const result = generateASCIITree(sampleTree);
      expect(result).toContain('src');
    });

    it('should respect maxDepth option', () => {
      const result = generateASCIITree(sampleTree, { maxDepth: 1 });
      expect(result).toContain('components');
      expect(result).not.toContain('Button.tsx');
    });
  });

  describe('generateMarkdownTree', () => {
    it('should contain markdown list items', () => {
      const result = generateMarkdownTree(sampleTree);
      expect(result).toContain('- ');
    });

    it('should bold directory names', () => {
      const result = generateMarkdownTree(sampleTree);
      expect(result).toMatch(/\*\*.*\*\*/);
    });

    it('should include all files', () => {
      const result = generateMarkdownTree(sampleTree);
      expect(result).toContain('index.ts');
      expect(result).toContain('utils.ts');
    });
  });

  describe('generateHTMLTree', () => {
    it('should contain <ul> tag', () => {
      const result = generateHTMLTree(sampleTree);
      expect(result).toContain('<ul>');
    });

    it('should contain <li> tag', () => {
      const result = generateHTMLTree(sampleTree);
      expect(result).toContain('<li');
    });

    it('should include CSS styling', () => {
      const result = generateHTMLTree(sampleTree);
      expect(result).toContain('<style>');
      expect(result).toContain('file-tree');
    });
  });

  describe('generateJSONTree', () => {
    it('should return valid JSON string', () => {
      const result = generateJSONTree(sampleTree);
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('should preserve tree structure in JSON', () => {
      const result = JSON.parse(generateJSONTree(sampleTree));
      expect(result.name).toBe('src');
      expect(result.type).toBe('directory');
      expect(Array.isArray(result.children)).toBe(true);
    });
  });

  describe('parseDirectoryStructure', () => {
    it('should parse indented text into TreeNode', () => {
      const input = 'src/\n  index.ts\n  utils.ts';
      const tree = parseDirectoryStructure(input);
      expect(tree.name).toBe('src');
      expect(tree.type).toBe('directory');
      expect(tree.children).toBeDefined();
      expect(tree.children!.length).toBe(2);
    });

    it('should handle empty input gracefully', () => {
      const tree = parseDirectoryStructure('');
      expect(tree).toBeDefined();
    });
  });

  describe('textToTree', () => {
    it('should convert text to unicode tree string', () => {
      const input = 'project/\n  src/\n    index.ts';
      const result = textToTree(input, { style: 'unicode' });
      expect(result).toContain('index.ts');
    });

    it('should convert text to markdown tree', () => {
      const input = 'project/\n  README.md';
      const result = textToTree(input, { style: 'markdown' });
      expect(result).toContain('- ');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Container Validator Tests
// ═══════════════════════════════════════════════════════════════════════════════
describe('Container Validator', () => {
  describe('validateContainerNumber', () => {
    it('should validate CSQU3054383 as valid', () => {
      const result = validateContainerNumber('CSQU3054383');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should extract owner code', () => {
      const result = validateContainerNumber('CSQU3054383');
      expect(result.ownerCode).toBe('CSQ');
    });

    it('should extract equipment category', () => {
      const result = validateContainerNumber('CSQU3054383');
      expect(result.equipmentCategory).toBe('U');
    });

    it('should fail for invalid check digit', () => {
      // Change last digit to make it invalid
      const result = validateContainerNumber('CSQU3054380');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should fail for wrong format (too short)', () => {
      const result = validateContainerNumber('CSQU305');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('length'))).toBe(true);
    });

    it('should fail for wrong format (letters where digits expected)', () => {
      const result = validateContainerNumber('CSQUABCDEFG');
      expect(result.valid).toBe(false);
    });

    it('should strip spaces and hyphens from input', () => {
      const result = validateContainerNumber('CSQU 305438-3');
      expect(result.containerNumber).toBe('CSQU3054383');
    });

    it('should be case-insensitive', () => {
      const result = validateContainerNumber('csqu3054383');
      expect(result.valid).toBe(true);
    });

    it('should provide category description for valid number', () => {
      const result = validateContainerNumber('CSQU3054383');
      expect(result.details.categoryDescription).toBe('Freight Container');
    });
  });

  describe('calculateCheckDigit', () => {
    it('should calculate correct check digit for CSQU305438', () => {
      const digit = calculateCheckDigit('CSQU305438');
      expect(digit).toBe(3);
    });

    it('should return a single digit (0-10 mapped to 0-9 or 0)', () => {
      const digit = calculateCheckDigit('MSCU1234560');
      expect(digit).toBeGreaterThanOrEqual(0);
      expect(digit).toBeLessThanOrEqual(10);
    });
  });

  describe('generateContainerNumber', () => {
    it('should generate an 11-character container number', () => {
      const num = generateContainerNumber('MSC', 'U');
      expect(num).toHaveLength(11);
    });

    it('should generate a valid container number', () => {
      const num = generateContainerNumber('MSC', 'U');
      const result = validateContainerNumber(num);
      expect(result.valid).toBe(true);
    });

    it('should throw for invalid owner code', () => {
      expect(() => generateContainerNumber('AB', 'U')).toThrow();
    });

    it('should throw for invalid category code', () => {
      expect(() => generateContainerNumber('MSC', 'X')).toThrow();
    });
  });

  describe('parseContainerNumber', () => {
    it('should parse parts of a valid container number', () => {
      const parsed = parseContainerNumber('CSQU3054383');
      expect(parsed.ownerCode).toBe('CSQ');
      expect(parsed.equipmentCategory).toBe('U');
      expect(parsed.serialNumber).toBe('305438');
      expect(parsed.checkDigit).toBe('3');
    });

    it('should provide formatted output', () => {
      const parsed = parseContainerNumber('CSQU3054383');
      expect(parsed.formatted).toBe('CSQU 305438 3');
    });
  });

  describe('batchValidate', () => {
    it('should validate multiple containers and return summary', () => {
      const result = batchValidate(['CSQU3054383', 'INVALID123']);
      expect(result.summary.total).toBe(2);
      expect(result.summary.valid).toBe(1);
      expect(result.summary.invalid).toBe(1);
    });
  });

  describe('getKnownOwnerCodes', () => {
    it('should return array of {code, name}', () => {
      const codes = getKnownOwnerCodes();
      expect(Array.isArray(codes)).toBe(true);
      expect(codes.length).toBeGreaterThan(0);
      expect(codes[0]).toHaveProperty('code');
      expect(codes[0]).toHaveProperty('name');
    });
  });

  describe('getEquipmentCategories', () => {
    it('should return array of {code, description, type}', () => {
      const cats = getEquipmentCategories();
      expect(Array.isArray(cats)).toBe(true);
      expect(cats.length).toBeGreaterThan(0);
      expect(cats[0]).toHaveProperty('code');
      expect(cats[0]).toHaveProperty('description');
      expect(cats[0]).toHaveProperty('type');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Cheque Generator Tests
// ═══════════════════════════════════════════════════════════════════════════════
describe('Cheque Generator', () => {
  describe('numberToWords', () => {
    it('should convert 0 to "Zero Dollars Only"', () => {
      expect(numberToWords(0)).toBe('Zero Dollars Only');
    });

    it('should convert 1 to "One Dollars Only"', () => {
      expect(numberToWords(1)).toBe('One Dollars Only');
    });

    it('should convert 100 to "One Hundred Dollars Only"', () => {
      expect(numberToWords(100)).toBe('One Hundred Dollars Only');
    });

    it('should convert 1234 to words', () => {
      const result = numberToWords(1234);
      expect(result).toContain('One Thousand');
      expect(result).toContain('Two Hundred');
      expect(result).toContain('Thirty');
      expect(result).toContain('Four');
    });

    it('should convert 1000000 to "One Million Dollars Only"', () => {
      expect(numberToWords(1000000)).toBe('One Million Dollars Only');
    });

    it('should handle decimal amounts (cents)', () => {
      const result = numberToWords(99.99);
      expect(result).toContain('Ninety');
      expect(result).toContain('Cents');
    });

    it('should use custom currency label', () => {
      expect(numberToWords(50, 'SAR')).toContain('SAR');
    });

    it('should convert 19 correctly (teens)', () => {
      const result = numberToWords(19);
      expect(result).toContain('Nineteen');
    });

    it('should convert 20 correctly', () => {
      const result = numberToWords(20);
      expect(result).toContain('Twenty');
    });

    it('should handle very large number (billion)', () => {
      const result = numberToWords(1000000000);
      expect(result).toContain('One Billion');
    });
  });

  describe('formatAmount', () => {
    it('should format USD amount correctly', () => {
      const result = formatAmount(1234.56, 'USD');
      expect(result).toContain('1,234.56');
    });

    it('should format zero amount', () => {
      const result = formatAmount(0, 'USD');
      expect(result).toContain('0.00');
    });
  });

  describe('generateMICRLine', () => {
    it('should include cheque number', () => {
      const micr = generateMICRLine('000123', '123456789', '0000001234');
      expect(micr).toContain('000123');
    });

    it('should include routing number', () => {
      const micr = generateMICRLine('000123', '123456789', '0000001234');
      expect(micr).toContain('123456789');
    });
  });

  describe('validateChequeData', () => {
    it('should validate correct cheque data', () => {
      const result = validateChequeData({
        payeeName: 'John Doe',
        amount: 500,
        date: '2026-01-01',
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing payee name', () => {
      const result = validateChequeData({ amount: 500, date: '2026-01-01' });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject zero amount', () => {
      const result = validateChequeData({
        payeeName: 'John',
        amount: 0,
        date: '2026-01-01',
      });
      expect(result.valid).toBe(false);
    });

    it('should reject amount exceeding limit', () => {
      const result = validateChequeData({
        payeeName: 'John',
        amount: 9999999999,
        date: '2026-01-01',
      });
      expect(result.valid).toBe(false);
    });

    it('should reject missing date', () => {
      const result = validateChequeData({ payeeName: 'John', amount: 500 });
      expect(result.valid).toBe(false);
    });
  });

  describe('createCheque', () => {
    it('should return svg and data', () => {
      const result = createCheque('Jane Doe', 250, '2026-02-11');
      expect(result).toHaveProperty('svg');
      expect(result).toHaveProperty('data');
      expect(result.svg).toContain('<svg');
    });

    it('should include payee name in SVG', () => {
      const result = createCheque('Jane Doe', 250, '2026-02-11');
      expect(result.svg).toContain('Jane Doe');
    });

    it('should set amountInWords in data', () => {
      const result = createCheque('Jane Doe', 250, '2026-02-11');
      expect(result.data.amountInWords).toContain('Two Hundred');
    });
  });
});
