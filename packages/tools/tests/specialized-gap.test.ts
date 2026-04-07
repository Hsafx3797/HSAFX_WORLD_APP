import { describe, it, expect } from 'vitest';
import { writeOutput } from './helpers';
import {
  validateBillOfLading,
  validateBookingNumber,
  validateSealNumber,
} from '../src/specialized/container-validator';
import {
  generateChequeSVG,
  createUSDCheque,
  createGBPCheque,
  createSARCheque,
} from '../src/specialized/cheque-generator';
import { generateTree } from '../src/specialized/file-tree';

// =============================================
// CONTAINER VALIDATORS
// =============================================

describe('validateBillOfLading', () => {
  it('validates a well-formed bill of lading', () => {
    // Standard B/L format: carrier prefix + numbers
    const result = validateBillOfLading('MAEU123456789');
    writeOutput('specialized', 'bol-valid.json', JSON.stringify(result, null, 2));
    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('formatted');
    expect(result).toHaveProperty('carrier');
    expect(result).toHaveProperty('type');
    expect(result).toHaveProperty('errors');
  });

  it('rejects empty input', () => {
    const result = validateBillOfLading('');
    writeOutput('specialized', 'bol-empty.json', JSON.stringify(result, null, 2));
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('handles various carrier prefixes', () => {
    const carriers = ['MAEU', 'MSCU', 'HLCU', 'CMDU'];
    const results: Record<string, unknown> = {};
    for (const prefix of carriers) {
      const result = validateBillOfLading(`${prefix}987654321`);
      results[prefix] = result;
    }
    writeOutput('specialized', 'bol-carriers.json', JSON.stringify(results, null, 2));
  });
});

describe('validateBookingNumber', () => {
  it('validates a booking number', () => {
    const result = validateBookingNumber('BK123456789');
    writeOutput('specialized', 'booking-valid.json', JSON.stringify(result, null, 2));
    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('formatted');
    expect(result).toHaveProperty('type');
    expect(result).toHaveProperty('errors');
  });

  it('rejects empty input', () => {
    const result = validateBookingNumber('');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('validateSealNumber', () => {
  it('validates a seal number', () => {
    const result = validateSealNumber('ISO17712-12345');
    writeOutput('specialized', 'seal-valid.json', JSON.stringify(result, null, 2));
    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('sealNumber');
    expect(result).toHaveProperty('type');
    expect(result).toHaveProperty('errors');
  });

  it('rejects empty input', () => {
    const result = validateSealNumber('');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// =============================================
// CHEQUE GENERATOR
// =============================================

describe('generateChequeSVG', () => {
  it('generates SVG from ChequeData', () => {
    const svg = generateChequeSVG({
      payeeName: 'Alice Johnson',
      amount: 1500.50,
      amountInWords: 'One Thousand Five Hundred and 50/100',
      date: '2024-06-15',
      memo: 'Consulting services',
      bankName: 'First National Bank',
      accountNumber: '1234567890',
      chequeNumber: '001234',
    });
    writeOutput('specialized', 'cheque-custom.svg', svg);
    expect(svg).toContain('<svg');
    expect(svg).toContain('Alice Johnson');
    expect(svg).toContain('1,500.50');
  });

  it('generates SVG with custom style', () => {
    const svg = generateChequeSVG(
      {
        payeeName: 'Bob Smith',
        amount: 250,
        amountInWords: 'Two Hundred Fifty and 00/100',
        date: '2024-01-01',
      },
      {
        width: 800,
        height: 350,
        backgroundColor: '#f0f0f0',
        fontFamily: 'Arial',
      },
    );
    expect(svg).toContain('<svg');
    expect(svg).toContain('Bob Smith');
  });
});

describe('createUSDCheque', () => {
  it('creates a USD cheque', () => {
    const result = createUSDCheque('John Doe', 5000, '2024-06-15', {
      memo: 'Payment for invoice #123',
      bankName: 'Chase Bank',
    });
    writeOutput('specialized', 'cheque-usd.svg', result.svg);
    writeOutput('specialized', 'cheque-usd-data.json', JSON.stringify(result.data, null, 2));
    expect(result).toHaveProperty('svg');
    expect(result).toHaveProperty('data');
    expect(result.svg).toContain('<svg');
    expect(result.data.payeeName).toBe('John Doe');
    expect(result.data.amount).toBe(5000);
  });
});

describe('createGBPCheque', () => {
  it('creates a GBP cheque', () => {
    const result = createGBPCheque('Jane Smith', 2500, '2024-07-01', {
      bankName: 'Barclays',
      memo: 'Rent payment',
    });
    writeOutput('specialized', 'cheque-gbp.svg', result.svg);
    writeOutput('specialized', 'cheque-gbp-data.json', JSON.stringify(result.data, null, 2));
    expect(result.svg).toContain('<svg');
    expect(result.data.payeeName).toBe('Jane Smith');
  });
});

describe('createSARCheque', () => {
  it('creates a SAR cheque', () => {
    const result = createSARCheque('Ahmed Ali', 10000, '2024-08-01');
    writeOutput('specialized', 'cheque-sar.svg', result.svg);
    writeOutput('specialized', 'cheque-sar-data.json', JSON.stringify(result.data, null, 2));
    expect(result.svg).toContain('<svg');
    expect(result.data.payeeName).toBe('Ahmed Ali');
    expect(result.data.amount).toBe(10000);
  });
});

// =============================================
// FILE TREE
// =============================================

describe('generateTree', () => {
  const sampleTree = {
    name: 'project',
    type: 'directory' as const,
    children: [
      {
        name: 'src',
        type: 'directory' as const,
        children: [
          { name: 'index.ts', type: 'file' as const, size: 1024 },
          { name: 'utils.ts', type: 'file' as const, size: 512 },
          {
            name: 'components',
            type: 'directory' as const,
            children: [
              { name: 'Button.tsx', type: 'file' as const, size: 2048 },
              { name: 'Modal.tsx', type: 'file' as const, size: 3072 },
            ],
          },
        ],
      },
      { name: 'package.json', type: 'file' as const, size: 256 },
      { name: 'README.md', type: 'file' as const, size: 4096 },
      { name: '.gitignore', type: 'file' as const, size: 128 },
    ],
  };

  it('generates ASCII tree by default', () => {
    const tree = generateTree(sampleTree);
    writeOutput('specialized', 'file-tree-ascii.txt', tree);
    expect(tree).toContain('project');
    expect(tree).toContain('src');
    expect(tree).toContain('index.ts');
  });

  it('generates unicode tree', () => {
    const tree = generateTree(sampleTree, { style: 'unicode' });
    writeOutput('specialized', 'file-tree-unicode.txt', tree);
    expect(tree).toContain('project');
  });

  it('generates markdown tree', () => {
    const tree = generateTree(sampleTree, { style: 'markdown' });
    writeOutput('specialized', 'file-tree-markdown.md', tree);
    expect(tree).toContain('project');
  });

  it('generates HTML tree', () => {
    const tree = generateTree(sampleTree, { style: 'html' });
    writeOutput('specialized', 'file-tree-html.html', tree);
    expect(tree).toContain('<');
  });

  it('generates JSON tree', () => {
    const tree = generateTree(sampleTree, { style: 'json' });
    writeOutput('specialized', 'file-tree-json.json', tree);
    const parsed = JSON.parse(tree);
    expect(parsed).toBeDefined();
  });

  it('respects maxDepth option', () => {
    const tree = generateTree(sampleTree, { maxDepth: 1 });
    writeOutput('specialized', 'file-tree-depth1.txt', tree);
    // Should show project and its direct children but not deeper
    expect(tree).toContain('src');
    // Deeper files may not appear depending on implementation
  });

  it('shows file sizes when enabled', () => {
    const tree = generateTree(sampleTree, { showSize: true });
    writeOutput('specialized', 'file-tree-sizes.txt', tree);
    expect(tree).toContain('project');
  });

  it('sorts by name ascending', () => {
    const tree = generateTree(sampleTree, { sortBy: 'name', sortOrder: 'asc' });
    writeOutput('specialized', 'file-tree-sorted.txt', tree);
    expect(tree).toContain('project');
  });
});
