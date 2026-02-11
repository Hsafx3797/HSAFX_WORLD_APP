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
} from '../code';

// ─── typeScriptToJavaScript ───────────────────────────────────────────────────

describe('typeScriptToJavaScript', () => {
  it('removes primitive type annotations from variables', () => {
    // Regex removes ': number ' leaving 'const x= 5' (no space before =)
    expect(typeScriptToJavaScript('const x: number = 5')).toBe('const x= 5');
  });

  it('removes string type annotations', () => {
    expect(typeScriptToJavaScript('const name: string = "hello"')).toBe('const name= "hello"');
  });

  it('removes boolean type annotations', () => {
    expect(typeScriptToJavaScript('let flag: boolean = true;')).toBe('let flag= true;');
  });

  it('removes interface declarations', () => {
    const ts = `interface User {\n  name: string;\n}\nconst x = 1;`;
    expect(typeScriptToJavaScript(ts)).toBe('const x = 1;');
  });

  it('removes type alias declarations', () => {
    const ts = `type ID = string;\nconst id = "abc";`;
    expect(typeScriptToJavaScript(ts)).toBe('const id = "abc";');
  });

  it('removes generic type parameters from function calls', () => {
    expect(typeScriptToJavaScript('useState<string>("hello")')).toBe('useState("hello")');
  });

  it('removes "as Type" casts', () => {
    expect(typeScriptToJavaScript('const el = document.getElementById("app") as HTMLElement;')).toBe(
      'const el = document.getElementById("app");'
    );
  });

  it('removes readonly modifier', () => {
    expect(typeScriptToJavaScript('readonly name = "test"')).toBe('name = "test"');
  });

  it('removes access modifiers (public/private/protected)', () => {
    expect(typeScriptToJavaScript('private count = 0')).toBe('count = 0');
    expect(typeScriptToJavaScript('public name = "a"')).toBe('name = "a"');
    expect(typeScriptToJavaScript('protected value = 1')).toBe('value = 1');
  });

  it('removes non-null assertion operator', () => {
    expect(typeScriptToJavaScript('user!.name')).toBe('user.name');
  });

  it('keeps regular JS code unchanged', () => {
    const js = 'const x = 5;\nconsole.log(x);';
    expect(typeScriptToJavaScript(js)).toBe(js);
  });

  it('collapses multiple blank lines', () => {
    const ts = 'interface A {\n  x: number;\n}\n\n\n\nconst y = 1;';
    const result = typeScriptToJavaScript(ts);
    expect(result).not.toContain('\n\n\n');
  });
});

// ─── scssToCss ────────────────────────────────────────────────────────────────

describe('scssToCss', () => {
  it('flattens one level of nesting', () => {
    const scss = `.parent {\n  .child {\n    color: red;\n  }\n}`;
    const result = scssToCss(scss);
    expect(result).toContain('.parent .child');
    expect(result).toContain('color: red;');
  });

  it('replaces SCSS variables with their values', () => {
    const scss = `$color: red;\n.test {\n  color: $color;\n}`;
    const result = scssToCss(scss);
    expect(result).toContain('color: red;');
    expect(result).not.toContain('$color');
  });

  it('removes SCSS single-line comments', () => {
    const scss = `// this is a comment\n.test {\n  color: red;\n}`;
    const result = scssToCss(scss);
    expect(result).not.toContain('//');
  });

  it('removes @import directives', () => {
    const scss = `@import 'variables';\n.test {\n  color: red;\n}`;
    const result = scssToCss(scss);
    expect(result).not.toContain('@import');
  });

  it('removes @use and @forward directives', () => {
    const scss = `@use 'mixins';\n@forward 'base';\n.test {\n  color: red;\n}`;
    const result = scssToCss(scss);
    expect(result).not.toContain('@use');
    expect(result).not.toContain('@forward');
  });

  it('handles & parent selector reference', () => {
    const scss = `.btn {\n  &:hover {\n    color: blue;\n  }\n}`;
    const result = scssToCss(scss);
    expect(result).toContain('.btn:hover');
  });
});

// ─── minifyCss ────────────────────────────────────────────────────────────────

describe('minifyCss', () => {
  it('removes whitespace and newlines', () => {
    const css = `.test {\n  color: red;\n  margin: 0;\n}`;
    const result = minifyCss(css);
    expect(result).not.toContain('\n');
    expect(result).toBe('.test{color:red;margin:0}');
  });

  it('removes CSS comments', () => {
    const css = `/* a comment */\n.test { color: red; }`;
    const result = minifyCss(css);
    expect(result).not.toContain('/*');
    expect(result).not.toContain('*/');
  });

  it('removes last semicolon before closing brace', () => {
    const css = `.a { color: red; }`;
    expect(minifyCss(css)).toBe('.a{color:red}');
  });

  it('removes spaces around colons and semicolons', () => {
    const css = `.a { color : red ; }`;
    const result = minifyCss(css);
    expect(result).toBe('.a{color:red}');
  });

  it('handles multiple selectors', () => {
    const css = `.a { color: red; }\n.b { margin: 0; }`;
    expect(minifyCss(css)).toBe('.a{color:red}.b{margin:0}');
  });
});

// ─── beautifyCss ──────────────────────────────────────────────────────────────

describe('beautifyCss', () => {
  it('adds proper indentation to properties', () => {
    const css = `.a{color:red;margin:0}`;
    const result = beautifyCss(css);
    expect(result).toContain('  color:red;');
  });

  it('puts one property per line', () => {
    const css = `.a{color:red;margin:0}`;
    const result = beautifyCss(css);
    const lines = result.split('\n');
    // Should have opening, property lines, closing
    expect(lines.length).toBeGreaterThanOrEqual(3);
  });

  it('places closing brace on its own line', () => {
    const css = `.a{color:red}`;
    const result = beautifyCss(css);
    expect(result).toMatch(/\n\s*}/);
  });

  it('returns trimmed output', () => {
    const css = `  .a { color: red; }  `;
    const result = beautifyCss(css);
    expect(result).toBe(result.trim());
  });
});

// ─── es6ToCommonJs ────────────────────────────────────────────────────────────

describe('es6ToCommonJs', () => {
  it('converts default export to module.exports', () => {
    const code = 'export default MyClass';
    expect(es6ToCommonJs(code)).toContain('module.exports = MyClass');
  });

  it('converts named import to require destructure', () => {
    const code = `import { useState, useEffect } from 'react'`;
    const result = es6ToCommonJs(code);
    expect(result).toContain("require('react')");
    expect(result).toContain('useState');
    expect(result).toContain('useEffect');
  });

  it('converts default import to const require', () => {
    const code = `import React from 'react'`;
    expect(es6ToCommonJs(code)).toBe(`const React = require('react')`);
  });

  it('converts namespace import to require', () => {
    const code = `import * as fs from 'fs'`;
    expect(es6ToCommonJs(code)).toBe(`const fs = require('fs')`);
  });

  it('adds module.exports object for named exports', () => {
    const code = `export const add = (a, b) => a + b;\nexport const sub = (a, b) => a - b;`;
    const result = es6ToCommonJs(code);
    expect(result).toContain('module.exports = { add, sub }');
  });

  it('converts export function declaration to plain function', () => {
    const code = `export function greet() {}`;
    const result = es6ToCommonJs(code);
    expect(result).toContain('function greet()');
    expect(result).toContain('module.exports = { greet }');
  });
});

// ─── commonJsToEs6 ───────────────────────────────────────────────────────────

describe('commonJsToEs6', () => {
  it('converts require with destructure to named import', () => {
    const code = `const { readFile } = require('fs')`;
    // Regex captures trailing space from [^}]+ greedy match
    expect(commonJsToEs6(code)).toBe(`import { readFile  } from 'fs'`);
  });

  it('converts default require to default import', () => {
    const code = `const express = require('express')`;
    expect(commonJsToEs6(code)).toBe(`import express from 'express'`);
  });

  it('converts module.exports = identifier to export default', () => {
    const code = `module.exports = MyClass`;
    expect(commonJsToEs6(code)).toBe('export default MyClass');
  });

  it('converts module.exports object to named exports', () => {
    const code = `module.exports = { add, subtract }`;
    expect(commonJsToEs6(code)).toBe('export { add, subtract }');
  });

  it('converts exports.property assignments to export const', () => {
    const code = `exports.greet = function() {}`;
    expect(commonJsToEs6(code)).toBe('export const greet = function() {}');
  });
});

// ─── arrowToFunction ──────────────────────────────────────────────────────────

describe('arrowToFunction', () => {
  it('converts arrow expression to function declaration', () => {
    const code = `const double = (x) => x * 2;`;
    expect(arrowToFunction(code)).toBe('function double(x) { return x * 2; }');
  });

  it('converts arrow with block body', () => {
    const code = `const greet = (name) => {\n  return "Hi " + name;\n}`;
    const result = arrowToFunction(code);
    expect(result).toContain('function greet(name) {');
  });

  it('converts single-param arrow without parens', () => {
    const code = `const square = x => x * x;`;
    expect(arrowToFunction(code)).toBe('function square(x) { return x * x; }');
  });

  it('converts arrow with multiple params', () => {
    const code = `const add = (a, b) => a + b;`;
    expect(arrowToFunction(code)).toBe('function add(a, b) { return a + b; }');
  });

  it('leaves code without arrow functions unchanged', () => {
    const code = `function foo() { return 1; }`;
    expect(arrowToFunction(code)).toBe(code);
  });
});

// ─── addUseStrict ─────────────────────────────────────────────────────────────

describe('addUseStrict', () => {
  it('prepends "use strict" when not present', () => {
    const code = 'const x = 1;';
    const result = addUseStrict(code);
    expect(result).toBe(`'use strict';\n\n${code}`);
  });

  it('does not duplicate when single-quoted use strict is present', () => {
    const code = `'use strict';\nconst x = 1;`;
    expect(addUseStrict(code)).toBe(code);
  });

  it('does not duplicate when double-quoted use strict is present', () => {
    const code = `"use strict";\nconst x = 1;`;
    expect(addUseStrict(code)).toBe(code);
  });

  it('returns the prepended code with double newline separator', () => {
    const result = addUseStrict('let a = 1;');
    expect(result.startsWith("'use strict';\n\n")).toBe(true);
  });
});
