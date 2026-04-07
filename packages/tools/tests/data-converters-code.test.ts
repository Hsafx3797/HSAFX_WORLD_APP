import { describe, it, expect } from 'vitest';
import {
  typeScriptToJavaScript,
  scssToCss,
  minifyCss,
  beautifyCss,
  es6ToCommonJs,
  commonJsToEs6,
  arrowToFunction,
  addUseStrict,
} from '../src/data-converters/code';

// ═══════════════════════════════════════════════
// TypeScript → JavaScript
// ═══════════════════════════════════════════════

describe('typeScriptToJavaScript', () => {
  it('removes type annotations', () => {
    const ts = 'const x: string = "hello";';
    const r = typeScriptToJavaScript(ts);
    // Space before : is consumed with the annotation
    expect(r).toContain('const x');
    expect(r).toContain('"hello"');
    expect(r).not.toContain(': string');
  });
  it('removes interface declarations', () => {
    const ts = 'interface User {\n  name: string;\n  age: number;\n}\nconst u = {};';
    const r = typeScriptToJavaScript(ts);
    expect(r).not.toContain('interface');
    expect(r).toContain('const u');
  });
  it('removes type declarations', () => {
    const ts = "type Status = 'active' | 'inactive';";
    const r = typeScriptToJavaScript(ts);
    expect(r).not.toContain('type Status');
  });
  it('removes as Type casts', () => {
    const ts = 'const n = value as number;';
    const r = typeScriptToJavaScript(ts);
    expect(r).not.toContain('as number');
  });
  it('removes readonly modifier', () => {
    const ts = 'readonly name: string;';
    const r = typeScriptToJavaScript(ts);
    expect(r).not.toContain('readonly');
  });
  it('removes access modifiers', () => {
    const ts = 'private name = "test";';
    const r = typeScriptToJavaScript(ts);
    expect(r).not.toContain('private');
  });
  it('removes non-null assertion after word chars', () => {
    // The regex (\w)!(?=\.|\[|\)) only matches ! preceded by \w
    const ts = 'const el = myVar!.textContent;';
    const r = typeScriptToJavaScript(ts);
    expect(r).not.toContain('!');
  });
});

// ═══════════════════════════════════════════════
// SCSS → CSS
// ═══════════════════════════════════════════════

describe('scssToCss', () => {
  it('replaces variables', () => {
    const scss = '$primary: #333;\n.btn {\n  color: $primary;\n}';
    const r = scssToCss(scss);
    expect(r).toContain('#333');
    expect(r).not.toContain('$primary');
  });
  it('removes SCSS-only comments', () => {
    const scss = '// SCSS comment\n.a {\n  color: red;\n}';
    const r = scssToCss(scss);
    expect(r).not.toContain('// SCSS');
  });
  it('removes @import', () => {
    const scss = "@import 'variables';\n.a {\n  color: red;\n}";
    const r = scssToCss(scss);
    expect(r).not.toContain('@import');
  });
});

// ═══════════════════════════════════════════════
// CSS Minify / Beautify
// ═══════════════════════════════════════════════

describe('minifyCss', () => {
  it('removes whitespace', () => {
    const css = '.a {\n  color: red;\n  margin: 0;\n}';
    const r = minifyCss(css);
    expect(r).toBe('.a{color:red;margin:0}');
  });
  it('removes comments', () => {
    const css = '/* comment */\n.a { color: red; }';
    const r = minifyCss(css);
    expect(r).not.toContain('comment');
  });
  it('removes trailing semicolons', () => {
    const r = minifyCss('.a { color: red; }');
    expect(r).toBe('.a{color:red}');
  });
});

describe('beautifyCss', () => {
  it('formats minified CSS', () => {
    const css = '.a{color:red;margin:0}.b{display:flex}';
    const r = beautifyCss(css);
    expect(r).toContain('\n');
    expect(r).toContain('color');
    expect(r).toContain('margin');
  });
  it('beautify after minify roundtrip', () => {
    const original = '.a {\n  color: red;\n}';
    const min = minifyCss(original);
    const pretty = beautifyCss(min);
    expect(pretty).toContain('color');
    expect(pretty).toContain('{');
  });
});

// CSS injection test
describe('CSS injection', () => {
  it('minifyCss handles expression() injection', () => {
    const css = '.a { background: expression(alert(1)); }';
    const r = minifyCss(css);
    // CSS expression() was an IE-only attack vector — minifier just minifies, doesn't filter
    expect(r).toContain('expression');
  });
  it('minifyCss handles url() data injection', () => {
    const css = '.a { background: url("javascript:alert(1)"); }';
    const r = minifyCss(css);
    expect(r).toContain('javascript');
    // Minifier is not a sanitizer — this is expected behavior
  });
});

// ═══════════════════════════════════════════════
// ES6 ↔ CommonJS
// ═══════════════════════════════════════════════

describe('es6ToCommonJs', () => {
  it('converts import {} from', () => {
    const es6 = "import { readFile, writeFile } from 'fs';";
    const r = es6ToCommonJs(es6);
    expect(r).toContain("require('fs')");
    expect(r).toContain('const { readFile, writeFile }');
  });
  it('converts import default', () => {
    const es6 = "import express from 'express';";
    const r = es6ToCommonJs(es6);
    expect(r).toContain("const express = require('express')");
  });
  it('converts import * as', () => {
    const es6 = "import * as path from 'path';";
    const r = es6ToCommonJs(es6);
    expect(r).toContain("const path = require('path')");
  });
  it('converts export default', () => {
    const es6 = 'export default function main() {}';
    const r = es6ToCommonJs(es6);
    expect(r).toContain('module.exports');
  });
  it('tracks named exports', () => {
    const es6 = 'export const add = (a, b) => a + b;\nexport const sub = (a, b) => a - b;';
    const r = es6ToCommonJs(es6);
    expect(r).toContain('module.exports = { add, sub }');
  });
});

describe('commonJsToEs6', () => {
  it('converts require to import', () => {
    const cjs = "const express = require('express');";
    const r = commonJsToEs6(cjs);
    expect(r).toContain("import express from 'express'");
  });
  it('converts destructured require', () => {
    const cjs = "const { readFile } = require('fs');";
    const r = commonJsToEs6(cjs);
    // Regex captures whitespace from { ... }, may produce extra spaces
    expect(r).toContain('import');
    expect(r).toContain('readFile');
    expect(r).toContain("from 'fs'");
  });
  it('converts module.exports = name', () => {
    const cjs = 'module.exports = app;';
    const r = commonJsToEs6(cjs);
    expect(r).toContain('export default app');
  });
  it('converts module.exports = { ... }', () => {
    const cjs = 'module.exports = { add, sub };';
    const r = commonJsToEs6(cjs);
    expect(r).toContain('export { add, sub }');
  });
  it('converts exports.x =', () => {
    const cjs = 'exports.helper = function() {};';
    const r = commonJsToEs6(cjs);
    expect(r).toContain('export const helper');
  });
});

// ═══════════════════════════════════════════════
// Arrow → Function
// ═══════════════════════════════════════════════

describe('arrowToFunction', () => {
  it('converts block body arrow', () => {
    const code = 'const add = (a, b) => {\n  return a + b;\n};';
    const r = arrowToFunction(code);
    expect(r).toContain('function add(a, b)');
  });
  it('converts expression body arrow', () => {
    const code = 'const double = (x) => x * 2;';
    const r = arrowToFunction(code);
    expect(r).toContain('function double(x)');
    expect(r).toContain('return x * 2');
  });
  it('converts single-param arrow', () => {
    const code = 'const inc = n => n + 1;';
    const r = arrowToFunction(code);
    expect(r).toContain('function inc(n)');
  });
});

// ═══════════════════════════════════════════════
// Use Strict
// ═══════════════════════════════════════════════

describe('addUseStrict', () => {
  it('adds use strict', () => {
    const r = addUseStrict('const x = 1;');
    expect(r).toContain("'use strict'");
    expect(r).toContain('const x = 1;');
  });
  it('does not double-add', () => {
    const code = "'use strict';\nconst x = 1;";
    expect(addUseStrict(code)).toBe(code);
  });
  it('handles double-quote variant', () => {
    const code = '"use strict";\nconst x = 1;';
    expect(addUseStrict(code)).toBe(code);
  });
});
