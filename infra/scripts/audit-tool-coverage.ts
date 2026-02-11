#!/usr/bin/env tsx
/**
 * Tool Coverage Audit Script
 * 
 * Statically analyzes the codebase to determine which of the 454
 * registered tools have real implementations vs stubs/missing.
 * 
 * Usage:
 *   npx tsx infra/scripts/audit-tool-coverage.ts
 * 
 * Prerequisites:
 *   - pnpm install (packages must be installed)
 *   - tsx installed (pnpm add -g tsx)
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '../..');

// ─── Collect all tool IDs from registry ────────────────────────────────

const REGISTRY_DIR = path.join(ROOT, 'packages/tool-definitions/src/registry');
const registryFiles = fs.readdirSync(REGISTRY_DIR).filter(f => f.endsWith('.ts') && f !== 'index.ts');

interface ToolEntry {
  id: string;
  file: string;
  category: string;
}

const allTools: ToolEntry[] = [];
const ID_REGEX = /id:\s*['"`]([^'"`]+)['"`]/g;

for (const file of registryFiles) {
  const content = fs.readFileSync(path.join(REGISTRY_DIR, file), 'utf-8');
  const category = file.replace('-tools.ts', '').replace(/-/g, ' ');
  let match: RegExpExecArray | null;
  while ((match = ID_REGEX.exec(content)) !== null) {
    allTools.push({ id: match[1], file, category });
  }
}

console.log(`\n📦 Tool Registry: ${allTools.length} tools across ${registryFiles.length} files`);
console.log('──────────────────────────────────────────────────');

// ─── Group by category ─────────────────────────────────────────────────

const byCategory = new Map<string, ToolEntry[]>();
for (const t of allTools) {
  const arr = byCategory.get(t.category) ?? [];
  arr.push(t);
  byCategory.set(t.category, arr);
}

for (const [cat, tools] of byCategory) {
  console.log(`  ${cat}: ${tools.length} tools`);
}

// ─── Check executor coverage ───────────────────────────────────────────

const EXECUTOR_FILE = path.join(ROOT, 'apps/web/src/lib/tools/executor.ts');
const executorContent = fs.readFileSync(EXECUTOR_FILE, 'utf-8');

// Extract all case strings from the executor
const CASE_REGEX = /case\s+['"`]([^'"`]+)['"`]/g;
const executorCases = new Set<string>();
let caseMatch: RegExpExecArray | null;
while ((caseMatch = CASE_REGEX.exec(executorContent)) !== null) {
  executorCases.add(caseMatch[1]);
}

// ─── Check WASM coverage ──────────────────────────────────────────────

const WASM_LOADER_FILE = path.join(ROOT, 'apps/web/src/lib/tools/wasm-loader.ts');
const wasmContent = fs.readFileSync(WASM_LOADER_FILE, 'utf-8');
const wasmMappedTools = new Set<string>();
const WASM_MAP_REGEX = /'([^']+)':\s*'[^']+'/g;
let wasmMatch: RegExpExecArray | null;
while ((wasmMatch = WASM_MAP_REGEX.exec(wasmContent)) !== null) {
  wasmMappedTools.add(wasmMatch[1]);
}

// ─── Check JS fallback coverage ────────────────────────────────────────

const FALLBACK_FILE = path.join(ROOT, 'apps/web/src/lib/tools/wasm-fallback.ts');
const fallbackContent = fs.readFileSync(FALLBACK_FILE, 'utf-8');
const fallbackTools = new Set<string>();
const FALLBACK_REGEX = /'([^']+)':\s*(?:\(|tools\.)/g;
let fbMatch: RegExpExecArray | null;
while ((fbMatch = FALLBACK_REGEX.exec(fallbackContent)) !== null) {
  fallbackTools.add(fbMatch[1]);
}

// ─── Check packages/tools/ implementations ─────────────────────────────

const TOOL_IMPL_DIR = path.join(ROOT, 'packages/tools/src');
const implFiles: string[] = [];

function collectTsFiles(dir: string) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      collectTsFiles(path.join(dir, entry.name));
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      implFiles.push(path.join(dir, entry.name));
    }
  }
}
collectTsFiles(TOOL_IMPL_DIR);

// Scan for exported function names
const exportedFunctions = new Set<string>();
const EXPORT_REGEX = /export\s+(?:async\s+)?function\s+(\w+)/g;
for (const file of implFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  let expMatch: RegExpExecArray | null;
  while ((expMatch = EXPORT_REGEX.exec(content)) !== null) {
    exportedFunctions.add(expMatch[1]);
  }
}

// ─── Report ────────────────────────────────────────────────────────────

console.log(`\n🔍 Coverage Analysis`);
console.log('──────────────────────────────────────────────────');
console.log(`  Executor case statements: ${executorCases.size}`);
console.log(`  WASM mapped tools: ${wasmMappedTools.size}`);
console.log(`  JS fallback tools: ${fallbackTools.size}`);
console.log(`  Exported impl functions: ${exportedFunctions.size}`);

// Classify each tool
interface CoverageResult {
  id: string;
  category: string;
  hasExecutorCase: boolean;
  hasWasm: boolean;
  hasFallback: boolean;
}

const results: CoverageResult[] = allTools.map(t => ({
  id: t.id,
  category: t.category,
  hasExecutorCase: executorCases.has(t.id),
  hasWasm: wasmMappedTools.has(t.id),
  hasFallback: fallbackTools.has(t.id),
}));

const routed = results.filter(r => r.hasExecutorCase || r.hasWasm || r.hasFallback);
const unrouted = results.filter(r => !r.hasExecutorCase && !r.hasWasm && !r.hasFallback);

console.log(`\n✅ Routed tools: ${routed.length}/${results.length}`);
console.log(`❌ Unrouted tools: ${unrouted.length}`);

if (unrouted.length > 0) {
  console.log('\n📋 Unrouted tools (no case in executor, no WASM map, no fallback):');
  for (const t of unrouted) {
    console.log(`  • [${t.category}] ${t.id}`);
  }
}

// Category breakdown
console.log('\n📊 Per-category routing:');
for (const [cat, tools] of byCategory) {
  const catResults = results.filter(r => r.category === cat);
  const catRouted = catResults.filter(r => r.hasExecutorCase || r.hasWasm || r.hasFallback);
  const pct = ((catRouted.length / catResults.length) * 100).toFixed(0);
  const icon = catRouted.length === catResults.length ? '✅' : '⚠️';
  console.log(`  ${icon} ${cat}: ${catRouted.length}/${catResults.length} (${pct}%)`);
}

// WASM-specific report for text tools
const textTools = results.filter(r => r.category === 'text');
const textWithWasm = textTools.filter(r => r.hasWasm);
console.log(`\n🦀 WASM text tools: ${textWithWasm.length}/${textTools.length} mapped to native Rust`);

console.log('\n✨ Audit complete.\n');
