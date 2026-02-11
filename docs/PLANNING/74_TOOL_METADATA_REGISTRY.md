# 📋 Tool Metadata Registry Specification

**Package:** `packages/tool-definitions/`  
**Purpose:** Centralized, auto-generated registry of all 446 tools with complete metadata

---

## 1. Overview

This registry is **auto-generated** from planning documents and provides runtime access to tool metadata for:
- Tool execution routing ([73_TOOL_EXECUTION_ROUTER.md](73_TOOL_EXECUTION_ROUTER.md))
- Permission checks
- Coin deduction
- UI rendering
- Search/filtering

**Generation Sources:**
- `30_TOOLS_CATALOG.md` → Tool IDs, Names, Categories
- `31_TOOLS_CLASSIFICATION_GUIDE.md` → Technology, Execution Type
- `TOOLS_UI_DESIGN.md` → Tool Options, Input Types
- `40_TOOL_METADATA_STANDARD.md` → SEO metadata

---

## 2. TypeScript Interface

```typescript
// packages/tool-definitions/types.ts

export type ToolCategory =
  | 'TEXT_CONVERTER'
  | 'CODE_EDITOR'
  | 'FILE_CONVERTER'
  | 'GENERATOR'
  | 'CALCULATOR'
  | 'DOCUMENT_GENERATION'
  | 'ASYNC_INTELLIGENCE';

export type ToolTechnology = 'WASM' | 'Node.js' | 'Native' | 'Python';

export type ExecutionType = 'sync' | 'async';

export interface ToolOption {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect';
  label: string;
  description?: string;
  required: boolean;
  default?: unknown;
  options?: Array<{ value: string | number; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: Array<string | number>;
  };
}

export interface ToolExample {
  title: string;
  input: string;
  options?: Record<string, unknown>;
  expectedOutput?: string;
}

export interface ToolMetadata {
  // Identification
  id: number;
  name: string;
  slug: string;
  category: ToolCategory;
  
  // Execution
  technology: ToolTechnology;
  executionType: ExecutionType;
  deterministic: boolean;
  cacheable: boolean;
  
  // Access Control
  globalLevel: number; // 0-11 (0 = Public, 11 = SuperAdmin)
  tier: 'A' | 'B' | 'C' | 'D';
  permissionKey: string; // e.g., 'tools:text:uppercase'
  coinCost: number;
  
  // UI/UX
  description: string;
  shortDescription: string;
  icon?: string;
  color?: string;
  inputType: 'text' | 'file' | 'form' | 'monaco';
  outputType: 'text' | 'file' | 'json' | 'table';
  options: ToolOption[];
  examples: ToolExample[];
  
  // SEO
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  
  // Features
  features: {
    undo?: boolean; // Supports undo/redo
    copy?: boolean; // Has copy-to-clipboard
    download?: boolean; // Can download result
    monaco?: boolean; // Uses Monaco editor
    diff?: boolean; // Supports diff mode
  };
}

export interface ToolRegistry {
  tools: ToolMetadata[];
  categories: Map<ToolCategory, ToolMetadata[]>;
  byId: Map<number, ToolMetadata>;
  bySlug: Map<string, ToolMetadata>;
}
```

---

## 3. Generation Script

```typescript
// scripts/generate-tool-registry.ts

import fs from 'fs/promises';
import path from 'path';
import { marked } from 'marked';

interface ParsedTool {
  id: number;
  name: string;
  category: string;
  technology: string;
  // ... more fields
}

async function generateToolRegistry() {
  console.log('Generating tool registry...');
  
  // Step 1: Parse 30_TOOLS_CATALOG.md
  const catalogPath = 'docs/planning/30_TOOLS_CATALOG.md';
  const catalogContent = await fs.readFile(catalogPath, 'utf-8');
  const tools = parseCatalog(catalogContent);
  
  // Step 2: Enrich with 31_TOOLS_CLASSIFICATION_GUIDE.md
  const classificationPath = 'docs/planning/31_TOOLS_CLASSIFICATION_GUIDE.md';
  const classificationContent = await fs.readFile(classificationPath, 'utf-8');
  enrichWithClassification(tools, classificationContent);
  
  // Step 3: Add UI options from TOOLS_UI_DESIGN.md
  const uiDesignPath = 'docs/planning/TOOLS_UI_DESIGN.md';
  const uiDesignContent = await fs.readFile(uiDesignPath, 'utf-8');
  enrichWithUIDesign(tools, uiDesignContent);
  
  // Step 4: Add SEO metadata from 40_TOOL_METADATA_STANDARD.md
  const metadataPath = 'docs/planning/40_TOOL_METADATA_STANDARD.md';
  const metadataContent = await fs.readFile(metadataPath, 'utf-8');
  enrichWithSEO(tools, metadataContent);
  
  // Step 5: Generate TypeScript file
  const registryCode = generateRegistryCode(tools);
  const outputPath = 'packages/tool-definitions/generated/tool-registry.ts';
  await fs.writeFile(outputPath, registryCode);
  
  // Step 6: Generate JSON for static export
  const jsonPath = 'packages/tool-definitions/generated/tool-registry.json';
  await fs.writeFile(jsonPath, JSON.stringify(tools, null, 2));
  
  console.log(`✅ Generated ${tools.length} tools`);
  console.log(`   TypeScript: ${outputPath}`);
  console.log(`   JSON: ${jsonPath}`);
}

function parseCatalog(markdown: string): ParsedTool[] {
  const tools: ParsedTool[] = [];
  
  // Regex: Match tool entries like "1. **Text Uppercase** (TEXT_CONVERTER)"
  const toolRegex = /^(\d+)\.\s+\*\*(.+?)\*\*\s+\((.+?)\)/gm;
  
  let match;
  while ((match = toolRegex.exec(markdown)) !== null) {
    const [, idStr, name, category] = match;
    tools.push({
      id: parseInt(idStr, 10),
      name: name.trim(),
      category: category.trim(),
      slug: slugify(name),
      // Defaults (will be enriched later)
      technology: 'WASM',
      executionType: 'sync',
      globalLevel: 0,
      tier: 'A',
      coinCost: 0,
      options: [],
      examples: []
    });
  }
  
  return tools;
}

function enrichWithClassification(tools: ParsedTool[], markdown: string) {
  // Parse table: | Tool ID | Technology | Execution | Deterministic | Cacheable |
  const tableRegex = /\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|/g;
  
  let match;
  while ((match = tableRegex.exec(markdown)) !== null) {
    const [, idStr, tech, exec, det, cache] = match;
    const tool = tools.find(t => t.id === parseInt(idStr, 10));
    
    if (tool) {
      tool.technology = tech.trim() as ToolTechnology;
      tool.executionType = exec.trim().toLowerCase() as ExecutionType;
      tool.deterministic = det.trim().toLowerCase() === 'yes';
      tool.cacheable = cache.trim().toLowerCase() === 'yes';
    }
  }
}

function enrichWithUIDesign(tools: ParsedTool[], markdown: string) {
  // Extract tool options from markdown sections
  // Example: ## Tool 1: Text Uppercase
  //          **Options:**
  //          - Locale (select): ...
  
  for (const tool of tools) {
    const sectionRegex = new RegExp(
      `##\\s+Tool\\s+${tool.id}:\\s+${escapeRegex(tool.name)}.*?\\n(.*?)(?=\\n##|$)`,
      'is'
    );
    
    const match = markdown.match(sectionRegex);
    if (match) {
      const sectionContent = match[1];
      tool.options = parseToolOptions(sectionContent);
      tool.examples = parseToolExamples(sectionContent);
    }
  }
}

function parseToolOptions(content: string): ToolOption[] {
  const options: ToolOption[] = [];
  
  // Example: - **Locale** (select): Choose locale for case conversion
  const optionRegex = /-\s+\*\*(.+?)\*\*\s+\((.+?)\):\s+(.+?)(?:\n|$)/g;
  
  let match;
  while ((match = optionRegex.exec(content)) !== null) {
    const [, name, type, description] = match;
    options.push({
      name: name.trim().toLowerCase().replace(/\s+/g, '_'),
      type: type.trim() as ToolOption['type'],
      label: name.trim(),
      description: description.trim(),
      required: false,
      default: getDefaultForType(type.trim())
    });
  }
  
  return options;
}

function generateRegistryCode(tools: ParsedTool[]): string {
  return `// Auto-generated on ${new Date().toISOString()}
// DO NOT EDIT MANUALLY

import type { ToolMetadata, ToolRegistry } from '../types';

export const tools: ToolMetadata[] = ${JSON.stringify(tools, null, 2)};

// Index by ID
export const toolsById = new Map<number, ToolMetadata>(
  tools.map(t => [t.id, t])
);

// Index by slug
export const toolsBySlug = new Map<string, ToolMetadata>(
  tools.map(t => [t.slug, t])
);

// Index by category
export const toolsByCategory = new Map<string, ToolMetadata[]>();
tools.forEach(tool => {
  if (!toolsByCategory.has(tool.category)) {
    toolsByCategory.set(tool.category, []);
  }
  toolsByCategory.get(tool.category)!.push(tool);
});

// Registry object
export const toolRegistry: ToolRegistry = {
  tools,
  byId: toolsById,
  bySlug: toolsBySlug,
  categories: toolsByCategory
};

// Convenience functions
export function getToolById(id: number): ToolMetadata | undefined {
  return toolsById.get(id);
}

export function getToolBySlug(slug: string): ToolMetadata | undefined {
  return toolsBySlug.get(slug);
}

export function getToolsByCategory(category: string): ToolMetadata[] {
  return toolsByCategory.get(category) || [];
}

export function searchTools(query: string): ToolMetadata[] {
  const lowerQuery = query.toLowerCase();
  return tools.filter(tool =>
    tool.name.toLowerCase().includes(lowerQuery) ||
    tool.description.toLowerCase().includes(lowerQuery) ||
    tool.keywords.some(k => k.toLowerCase().includes(lowerQuery))
  );
}
`;
}

// Helper functions
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Run generation
generateToolRegistry().catch(console.error);
```

---

## 4. Package.json Integration

```json
{
  "name": "@productivity-app/tool-definitions",
  "version": "1.0.0",
  "type": "module",
  "main": "./generated/tool-registry.ts",
  "types": "./types.ts",
  "scripts": {
    "generate": "tsx scripts/generate-tool-registry.ts",
    "watch": "tsx scripts/generate-tool-registry.ts --watch"
  },
  "devDependencies": {
    "tsx": "^4.0.0",
    "marked": "^11.0.0"
  }
}
```

**Run Generation:**
```bash
cd packages/tool-definitions
npm run generate
```

---

## 5. Usage in Application

### 5.1 Tool Page Rendering

```typescript
// app/tools/[slug]/page.tsx

import { getToolBySlug } from '@/tool-definitions/generated/tool-registry';
import { ToolContainer } from '@/components/tools/ToolContainer';

export async function generateStaticParams() {
  const { tools } = await import('@/tool-definitions/generated/tool-registry');
  return tools.map(tool => ({ slug: tool.slug }));
}

export default function ToolPage({ params }: { params: { slug: string } }) {
  const tool = getToolBySlug(params.slug);
  
  if (!tool) {
    notFound();
  }
  
  return (
    <ToolContainer
      tool={tool}
      inputType={tool.inputType}
      outputType={tool.outputType}
      options={tool.options}
    />
  );
}
```

### 5.2 Tool Search

```typescript
// app/api/tools/search/route.ts

import { searchTools } from '@/tool-definitions/generated/tool-registry';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';
  
  const results = searchTools(query);
  
  return Response.json({
    results: results.slice(0, 20),
    total: results.length
  });
}
```

### 5.3 Permission Checks

```typescript
// lib/permissions.ts

import { getToolById } from '@/tool-definitions/generated/tool-registry';
import { can } from '@/packages/permissions';

export function canUseTool(userId: string, toolId: number): boolean {
  const tool = getToolById(toolId);
  if (!tool) return false;
  
  return can(userId, tool.permissionKey);
}
```

---

## 6. Sample Generated Output

```typescript
// packages/tool-definitions/generated/tool-registry.ts (excerpt)

export const tools: ToolMetadata[] = [
  {
    id: 1,
    name: 'Text Uppercase',
    slug: 'text-uppercase',
    category: 'TEXT_CONVERTER',
    technology: 'WASM',
    executionType: 'sync',
    deterministic: true,
    cacheable: true,
    globalLevel: 0,
    tier: 'A',
    permissionKey: 'tools:text:uppercase',
    coinCost: 0,
    description: 'Convert text to uppercase letters',
    shortDescription: 'Uppercase converter',
    inputType: 'text',
    outputType: 'text',
    options: [
      {
        name: 'locale',
        type: 'select',
        label: 'Locale',
        description: 'Locale for case conversion',
        required: false,
        default: 'en',
        options: [
          { value: 'en', label: 'English' },
          { value: 'tr', label: 'Turkish' }
        ]
      }
    ],
    examples: [
      {
        title: 'Basic Example',
        input: 'hello world',
        expectedOutput: 'HELLO WORLD'
      }
    ],
    metaTitle: 'Text Uppercase Converter - Free Online Tool',
    metaDescription: 'Convert text to uppercase instantly...',
    keywords: ['uppercase', 'text', 'case', 'converter'],
    features: {
      undo: true,
      copy: true,
      download: false,
      monaco: false,
      diff: false
    }
  },
  
  {
    id: 192,
    name: 'JSON Formatter',
    slug: 'json-formatter',
    category: 'CODE_EDITOR',
    technology: 'Node.js',
    executionType: 'sync',
    deterministic: true,
    cacheable: true,
    globalLevel: 0,
    tier: 'A',
    permissionKey: 'tools:code:json-formatter',
    coinCost: 0,
    description: 'Format and validate JSON code',
    shortDescription: 'JSON formatter',
    inputType: 'monaco',
    outputType: 'monaco',
    options: [
      {
        name: 'indent',
        type: 'number',
        label: 'Indent Size',
        description: 'Number of spaces for indentation',
        required: false,
        default: 2,
        validation: { min: 2, max: 8 }
      },
      {
        name: 'sortKeys',
        type: 'boolean',
        label: 'Sort Keys',
        description: 'Sort object keys alphabetically',
        required: false,
        default: false
      }
    ],
    examples: [
      {
        title: 'Format JSON',
        input: '{"name":"John","age":30}',
        options: { indent: 2 },
        expectedOutput: '{\n  "name": "John",\n  "age": 30\n}'
      }
    ],
    metaTitle: 'JSON Formatter & Validator - Online Tool',
    metaDescription: 'Format, minify, and validate JSON...',
    keywords: ['json', 'formatter', 'validator', 'prettify'],
    features: {
      undo: true,
      copy: true,
      download: true,
      monaco: true,
      diff: true
    }
  },
  
  {
    id: 446,
    name: 'Seaport Terminal Container Tracker',
    slug: 'seaport-terminal-container-tracker',
    category: 'ASYNC_INTELLIGENCE',
    technology: 'Python',
    executionType: 'async',
    deterministic: false,
    cacheable: true,
    globalLevel: 0,
    tier: 'B',
    permissionKey: 'tools:async:seaport-tracker',
    coinCost: 10,
    description: 'Track shipping containers across Pakistan terminals',
    shortDescription: 'Container tracker',
    inputType: 'form',
    outputType: 'table',
    options: [
      {
        name: 'containers',
        type: 'text',
        label: 'Container Numbers',
        description: 'Comma-separated list of container numbers',
        required: true
      },
      {
        name: 'terminals',
        type: 'multiselect',
        label: 'Terminals',
        description: 'Select terminals to search',
        required: false,
        default: ['KICT', 'QICT', 'KGTL', 'SAPT'],
        options: [
          { value: 'KICT', label: 'KICT - Karachi International' },
          { value: 'QICT', label: 'QICT - Qasim International' },
          { value: 'KGTL', label: 'KGTL - Gateway Terminal' },
          { value: 'SAPT', label: 'SAPT - South Asia' }
        ]
      }
    ],
    examples: [],
    metaTitle: 'Container Tracking - Pakistan Seaport Terminals',
    metaDescription: 'Track containers at KICT, QICT, KGTL, SAPT...',
    keywords: ['container', 'tracking', 'seaport', 'karachi', 'pakistan'],
    features: {
      undo: false,
      copy: false,
      download: true,
      monaco: false,
      diff: false
    }
  }
];
```

---

## 7. CI/CD Integration

```yaml
# .github/workflows/generate-registry.yml

name: Generate Tool Registry

on:
  push:
    paths:
      - 'docs/planning/**'
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd packages/tool-definitions
          npm install
      
      - name: Generate registry
        run: |
          cd packages/tool-definitions
          npm run generate
      
      - name: Commit changes
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add packages/tool-definitions/generated/
          git commit -m "chore: regenerate tool registry" || echo "No changes"
          git push
```

---

## 8. Validation Script

```typescript
// scripts/validate-tool-registry.ts

import { tools } from '../packages/tool-definitions/generated/tool-registry';

function validateRegistry() {
  console.log('Validating tool registry...');
  
  const errors: string[] = [];
  
  // Check for duplicate IDs
  const ids = new Set<number>();
  for (const tool of tools) {
    if (ids.has(tool.id)) {
      errors.push(`Duplicate tool ID: ${tool.id}`);
    }
    ids.add(tool.id);
  }
  
  // Check for duplicate slugs
  const slugs = new Set<string>();
  for (const tool of tools) {
    if (slugs.has(tool.slug)) {
      errors.push(`Duplicate slug: ${tool.slug}`);
    }
    slugs.add(tool.slug);
  }
  
  // Check required fields
  for (const tool of tools) {
    if (!tool.name) errors.push(`Tool ${tool.id} missing name`);
    if (!tool.category) errors.push(`Tool ${tool.id} missing category`);
    if (!tool.technology) errors.push(`Tool ${tool.id} missing technology`);
    if (tool.coinCost < 0) errors.push(`Tool ${tool.id} has negative coin cost`);
  }
  
  // Check for missing descriptions
  for (const tool of tools) {
    if (!tool.description || tool.description.length < 10) {
      errors.push(`Tool ${tool.id} has insufficient description`);
    }
  }
  
  if (errors.length > 0) {
    console.error('❌ Validation failed:');
    errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }
  
  console.log(`✅ Validated ${tools.length} tools`);
}

validateRegistry();
```

---

**This registry provides a single source of truth for all 446 tools, auto-generated from planning documents to ensure consistency.**
