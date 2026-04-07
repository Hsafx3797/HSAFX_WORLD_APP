/**
 * Tests for specialized/file-tree.ts
 * generateASCIITree, generateMarkdownTree, generateHTMLTree, generateJSONTree,
 * parseDirectoryStructure, generateTree, textToTree
 */
import { describe, it, expect } from 'vitest';

import {
  generateASCIITree,
  generateMarkdownTree,
  generateHTMLTree,
  generateJSONTree,
  parseDirectoryStructure,
  generateTree,
  textToTree,
} from '../src/specialized/file-tree';
import type { TreeNode } from '../src/specialized/file-tree';

// =====================================================================
// SHARED FIXTURES
// =====================================================================
const simpleTree: TreeNode = {
  name: 'project',
  type: 'directory',
  children: [
    { name: 'src', type: 'directory', children: [
      { name: 'index.ts', type: 'file', extension: 'ts' },
      { name: 'utils.ts', type: 'file', extension: 'ts' },
    ]},
    { name: 'package.json', type: 'file', extension: 'json' },
    { name: 'README.md', type: 'file', extension: 'md' },
  ],
};

const treeWithSizes: TreeNode = {
  name: 'root',
  type: 'directory',
  children: [
    { name: 'large.bin', type: 'file', size: 1048576 },
    { name: 'small.txt', type: 'file', size: 256 },
  ],
};

const deepTree: TreeNode = {
  name: 'a',
  type: 'directory',
  children: [
    { name: 'b', type: 'directory', children: [
      { name: 'c', type: 'directory', children: [
        { name: 'd.txt', type: 'file' },
      ]},
    ]},
  ],
};

const treeWithHidden: TreeNode = {
  name: 'project',
  type: 'directory',
  children: [
    { name: '.gitignore', type: 'file' },
    { name: '.env', type: 'file' },
    { name: 'src', type: 'directory', children: [] },
    { name: 'node_modules', type: 'directory', children: [
      { name: 'lodash', type: 'directory', children: [] },
    ]},
  ],
};

// =====================================================================
// generateASCIITree
// =====================================================================
describe('generateASCIITree', () => {
  it('generates tree with unicode chars by default', () => {
    const result = generateASCIITree(simpleTree);
    expect(result).toContain('project');
    expect(result).toContain('src');
    expect(result).toContain('index.ts');
    expect(result).toContain('├──');
    expect(result).toContain('└──');
  });

  it('generates tree with ASCII style', () => {
    const result = generateASCIITree(simpleTree, { style: 'ascii' });
    expect(result).toContain('|--');
    expect(result).toContain('`--');
  });

  it('shows sizes when option is set', () => {
    const result = generateASCIITree(treeWithSizes, { showSize: true });
    expect(result).toContain('1.0 MB');
    expect(result).toContain('256 B');
  });

  it('respects maxDepth', () => {
    const result = generateASCIITree(deepTree, { maxDepth: 1 });
    expect(result).toContain('a');
    expect(result).toContain('b');
    expect(result).not.toContain('c');
  });

  it('filters hidden files by default', () => {
    const result = generateASCIITree(treeWithHidden);
    expect(result).not.toContain('.gitignore');
    expect(result).not.toContain('.env');
  });

  it('shows hidden files when showHidden is true', () => {
    const result = generateASCIITree(treeWithHidden, { showHidden: true });
    expect(result).toContain('.gitignore');
    expect(result).toContain('.env');
  });

  it('excludes node_modules by default', () => {
    const result = generateASCIITree(treeWithHidden);
    expect(result).not.toContain('node_modules');
  });

  it('handles empty directory', () => {
    const empty: TreeNode = { name: 'empty', type: 'directory', children: [] };
    const result = generateASCIITree(empty);
    expect(result).toContain('empty');
  });
});

// =====================================================================
// generateMarkdownTree
// =====================================================================
describe('generateMarkdownTree', () => {
  it('generates markdown list', () => {
    const result = generateMarkdownTree(simpleTree);
    expect(result).toContain('- 📁 **project**');
    expect(result).toContain('- 📁 **src**');
    expect(result).toContain('- 📄 index.ts');
  });

  it('indents nested levels', () => {
    const result = generateMarkdownTree(simpleTree);
    const lines = result.split('\n');
    const srcLine = lines.find(l => l.includes('index.ts'));
    expect(srcLine).toMatch(/^\s{4}/); // 2 levels of indent
  });

  it('shows sizes when option set', () => {
    const result = generateMarkdownTree(treeWithSizes, { showSize: true });
    expect(result).toContain('1.0 MB');
  });
});

// =====================================================================
// generateHTMLTree
// =====================================================================
describe('generateHTMLTree', () => {
  it('generates HTML with style block', () => {
    const result = generateHTMLTree(simpleTree);
    expect(result).toContain('<style>');
    expect(result).toContain('file-tree');
    expect(result).toContain('<ul>');
    expect(result).toContain('<li');
  });

  it('contains node names', () => {
    const result = generateHTMLTree(simpleTree);
    expect(result).toContain('project');
    expect(result).toContain('index.ts');
    expect(result).toContain('package.json');
  });

  it('has directory CSS class', () => {
    const result = generateHTMLTree(simpleTree);
    expect(result).toContain('class="directory"');
  });

  it('has file CSS class', () => {
    const result = generateHTMLTree(simpleTree);
    expect(result).toContain('class="file"');
  });
});

// =====================================================================
// generateJSONTree
// =====================================================================
describe('generateJSONTree', () => {
  it('returns valid JSON', () => {
    const result = generateJSONTree(simpleTree);
    const parsed = JSON.parse(result);
    expect(parsed.name).toBe('project');
    expect(parsed.type).toBe('directory');
  });

  it('includes children', () => {
    const parsed = JSON.parse(generateJSONTree(simpleTree));
    expect(parsed.children).toHaveLength(3);
  });

  it('includes extensions', () => {
    const parsed = JSON.parse(generateJSONTree(simpleTree));
    const indexFile = parsed.children[0].children.find((c: TreeNode) => c.name === 'index.ts');
    expect(indexFile.extension).toBe('ts');
  });

  it('includes sizes when option set', () => {
    const parsed = JSON.parse(generateJSONTree(treeWithSizes, { showSize: true }));
    expect(parsed.children[0].size).toBe(1048576);
  });
});

// =====================================================================
// parseDirectoryStructure
// =====================================================================
describe('parseDirectoryStructure', () => {
  it('parses simple indented text', () => {
    const input = `project/
  src/
    index.ts
    utils.ts
  README.md`;
    const result = parseDirectoryStructure(input);
    expect(result.name).toBe('project');
    expect(result.type).toBe('directory');
    expect(result.children).toHaveLength(2);
  });

  it('parses unicode tree drawing chars', () => {
    const input = `root/
├── src/
│   ├── index.ts
│   └── utils.ts
└── package.json`;
    const result = parseDirectoryStructure(input);
    expect(result.name).toBe('root');
    expect(result.children!.length).toBeGreaterThanOrEqual(2);
  });

  it('detects file extensions', () => {
    const input = `root/
  app.tsx
  styles.css`;
    const result = parseDirectoryStructure(input);
    const tsx = result.children!.find(c => c.name === 'app.tsx');
    expect(tsx?.extension).toBe('tsx');
  });

  it('skips empty lines', () => {
    const input = `root/

  a.txt

  b.txt`;
    const result = parseDirectoryStructure(input);
    expect(result.children).toHaveLength(2);
  });
});

// =====================================================================
// generateTree (convenience dispatcher)
// =====================================================================
describe('generateTree', () => {
  it('dispatches to ASCII by default', () => {
    const result = generateTree(simpleTree);
    expect(result).toContain('├──');
  });

  it('dispatches to ASCII style', () => {
    const result = generateTree(simpleTree, { style: 'ascii' });
    expect(result).toContain('|--');
  });

  it('dispatches to markdown', () => {
    const result = generateTree(simpleTree, { style: 'markdown' });
    expect(result).toContain('- 📁 **');
  });

  it('dispatches to HTML', () => {
    const result = generateTree(simpleTree, { style: 'html' });
    expect(result).toContain('<ul>');
  });

  it('dispatches to JSON', () => {
    const result = generateTree(simpleTree, { style: 'json' });
    const parsed = JSON.parse(result);
    expect(parsed.name).toBe('project');
  });
});

// =====================================================================
// textToTree
// =====================================================================
describe('textToTree', () => {
  it('parses text and generates default tree', () => {
    const input = `myapp/
  src/
    main.ts
  package.json`;
    const result = textToTree(input);
    expect(result).toContain('myapp');
    expect(result).toContain('main.ts');
    expect(result).toContain('├──');
  });

  it('parses text and generates markdown tree', () => {
    const input = `myapp/
  src/
    main.ts`;
    const result = textToTree(input, { style: 'markdown' });
    expect(result).toContain('- 📁 **');
  });

  it('parses text and generates JSON tree', () => {
    const input = `myapp/
  index.ts`;
    const result = textToTree(input, { style: 'json' });
    const parsed = JSON.parse(result);
    expect(parsed.name).toBe('myapp');
  });
});
