/**
 * Comment Engine — Language-Aware Commenting
 *
 * Add, remove, or toggle comments for any supported language,
 * supporting line, block, and doc comment styles.
 */

import type { Engine, CommentEngineOptions, EngineInput, EngineResult, ValidationOutcome } from './types';

// ---------------------------------------------------------------------------
// Language comment syntax registry
// ---------------------------------------------------------------------------

interface CommentSyntax {
  line?: string;
  block?: [string, string];
  doc?: [string, string];
}

const LANGUAGES: Record<string, CommentSyntax> = {
  javascript:  { line: '//',  block: ['/*', '*/'],  doc: ['/**', ' */'] },
  typescript:  { line: '//',  block: ['/*', '*/'],  doc: ['/**', ' */'] },
  java:        { line: '//',  block: ['/*', '*/'],  doc: ['/**', ' */'] },
  c:           { line: '//',  block: ['/*', '*/'] },
  cpp:         { line: '//',  block: ['/*', '*/'] },
  csharp:      { line: '//',  block: ['/*', '*/'],  doc: ['///', ''] },
  go:          { line: '//',  block: ['/*', '*/'] },
  rust:        { line: '//',  block: ['/*', '*/'],  doc: ['///', ''] },
  swift:       { line: '//',  block: ['/*', '*/'] },
  kotlin:      { line: '//',  block: ['/*', '*/'],  doc: ['/**', ' */'] },
  scala:       { line: '//',  block: ['/*', '*/'],  doc: ['/**', ' */'] },
  php:         { line: '//',  block: ['/*', '*/'],  doc: ['/**', ' */'] },
  python:      { line: '#',   block: ['"""', '"""'], doc: ['"""', '"""'] },
  ruby:        { line: '#',   block: ['=begin', '=end'] },
  perl:        { line: '#' },
  bash:        { line: '#' },
  shell:       { line: '#' },
  powershell:  { line: '#',   block: ['<#', '#>'] },
  r:           { line: '#' },
  lua:         { line: '--',  block: ['--[[', ']]'] },
  haskell:     { line: '--',  block: ['{-', '-}'] },
  sql:         { line: '--',  block: ['/*', '*/'] },
  html:        { block: ['<!--', '-->'] },
  xml:         { block: ['<!--', '-->'] },
  css:         { block: ['/*', '*/'] },
  scss:        { line: '//',  block: ['/*', '*/'] },
  less:        { line: '//',  block: ['/*', '*/'] },
  yaml:        { line: '#' },
  toml:        { line: '#' },
  ini:         { line: ';' },
  matlab:      { line: '%',   block: ['%{', '%}'] },
  latex:       { line: '%' },
  lisp:        { line: ';',   block: ['#|', '|#'] },
  clojure:     { line: ';' },
  erlang:      { line: '%' },
  elixir:      { line: '#' },
  dart:        { line: '//',  block: ['/*', '*/'],  doc: ['///', ''] },
};

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const commentEngine: Engine<CommentEngineOptions> = {
  name: 'comment',
  description: 'Add, remove, or toggle comments for any language.',

  validate(options: CommentEngineOptions): ValidationOutcome {
    const errors: string[] = [];
    if (!LANGUAGES[options.language]) {
      errors.push(`Unsupported language "${options.language}". Supported: ${Object.keys(LANGUAGES).join(', ')}`);
    }
    const validStyles = ['line', 'block', 'doc'];
    if (!validStyles.includes(options.style)) {
      errors.push(`Invalid style "${options.style}". Must be one of: ${validStyles.join(', ')}`);
    }
    const validOps = ['add', 'remove', 'toggle'];
    if (!validOps.includes(options.operation)) {
      errors.push(`Invalid operation "${options.operation}". Must be one of: ${validOps.join(', ')}`);
    }
    // Check if the language supports the requested style
    if (options.language && LANGUAGES[options.language]) {
      const lang = LANGUAGES[options.language];
      if (options.style === 'line' && !lang.line) {
        errors.push(`Language "${options.language}" does not support line comments. Use "block" instead.`);
      }
      if (options.style === 'doc' && !lang.doc) {
        errors.push(`Language "${options.language}" does not support doc comments. Use "block" instead.`);
      }
    }
    return errors.length ? { valid: false, errors } : { valid: true };
  },

  execute(input: EngineInput, options: CommentEngineOptions): EngineResult {
    const text = typeof input === 'string' ? input : String(input);
    const { language, style, operation } = options;
    const syntax = LANGUAGES[language];

    if (style === 'line' && syntax.line) {
      return handleLineComment(text, syntax.line, operation);
    }

    const pair = style === 'doc' && syntax.doc ? syntax.doc : syntax.block;
    if (pair) {
      return handleBlockComment(text, pair, operation);
    }

    return { output: text, metadata: { error: 'No matching comment syntax' } };
  },
};

// ---------------------------------------------------------------------------
// Line comments
// ---------------------------------------------------------------------------

function handleLineComment(text: string, marker: string, op: string): EngineResult {
  const lines = text.split('\n');
  const commented = lines.every(l => l.trimStart().startsWith(marker));

  if (op === 'add' || (op === 'toggle' && !commented)) {
    const output = lines.map(l => `${marker} ${l}`).join('\n');
    return { output, metadata: { operation: 'added', linesAffected: lines.length } };
  }

  // remove
  const output = lines
    .map(l => {
      const trimmed = l.trimStart();
      if (trimmed.startsWith(`${marker} `)) {
        return l.replace(`${marker} `, '');
      }
      if (trimmed.startsWith(marker)) {
        return l.replace(marker, '');
      }
      return l;
    })
    .join('\n');

  return { output, metadata: { operation: 'removed', linesAffected: lines.length } };
}

// ---------------------------------------------------------------------------
// Block comments
// ---------------------------------------------------------------------------

function handleBlockComment(text: string, pair: [string, string], op: string): EngineResult {
  const [open, close] = pair;
  const trimmed = text.trim();
  const isCommented = trimmed.startsWith(open) && trimmed.endsWith(close);

  if (op === 'add' || (op === 'toggle' && !isCommented)) {
    const output = `${open}\n${text}\n${close}`;
    return { output, metadata: { operation: 'added' } };
  }

  // remove
  let output = trimmed;
  if (output.startsWith(open)) output = output.slice(open.length);
  if (output.endsWith(close)) output = output.slice(0, -close.length);
  output = output.trim();

  return { output, metadata: { operation: 'removed' } };
}
