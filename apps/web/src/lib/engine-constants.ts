/**
 * Shared engine constants for the 30-engine B2B API.
 *
 * Single source of truth for:
 * - ENGINE_RUNTIME     — execution backend per engine (rust/node/python)
 * - ENGINE_TOOL_CLASS  — billing toolClass per engine
 * - ENGINE_MIN_TIER    — plan gating per engine (currently empty)
 * - ENGINE_TO_CATEGORY — reverse mapping from engine → category
 * - CATEGORY_ENGINES   — forward mapping from category → engine list
 */

import type { UserPlan } from '@hsafx/shared/permissions';

// ─── Engine runtime map (30 engines → 3 backends) ────────────

export type EngineRuntime = 'rust' | 'node' | 'python';

export const ENGINE_RUNTIME: Record<string, EngineRuntime> = {
  // Rust native (text processing, encoding, hashing, data generation)
  case: 'rust',
  wrap: 'rust',
  filter: 'rust',
  transform: 'rust',
  encode: 'rust',
  hash: 'rust',
  counter: 'rust',
  unicode: 'rust',
  'generate-data': 'rust',

  // Node.js (complex data processing, web generation, language-aware ops)
  comment: 'node',
  markup: 'node',
  convert: 'node',
  format: 'node',
  schema: 'node',
  diff: 'node',
  api: 'node',
  'generate-web': 'node',
  validate: 'node',
  calculate: 'node',
  unit: 'node',

  // Python/FastAPI (media processing — 8 engines + tracking + cheque)
  image: 'python',
  video: 'python',
  audio: 'python',
  pdf: 'python',
  document: 'python',
  archive: 'python',
  file: 'python',
  font: 'python',
  tracking: 'python',
  cheque: 'python',
};

/** All 30 engine names */
export const ALL_ENGINE_NAMES = Object.keys(ENGINE_RUNTIME);

// ─── Category → engine list ───────────────────────────────────

export const CATEGORY_ENGINES: Record<string, string[]> = {
  text: ['case', 'wrap', 'comment', 'markup', 'filter', 'transform', 'encode', 'hash', 'counter', 'unicode'],
  data: ['convert', 'format', 'schema', 'diff', 'api'],
  generate: ['generate-data', 'generate-web'],
  validate: ['validate'],
  calculate: ['calculate'],
  convert: ['unit'],
  media: ['image', 'video', 'audio', 'pdf', 'document', 'archive', 'file', 'font'],
  tracking: ['tracking'],
  cheque: ['cheque'],
};

// ─── Engine → billing toolClass ───────────────────────────────

export const ENGINE_TOOL_CLASS: Record<string, string> = {
  case: 'text_transform',
  wrap: 'text_transform',
  comment: 'text_transform',
  markup: 'text_transform',
  filter: 'text_transform',
  transform: 'text_transform',
  encode: 'text_transform',
  hash: 'text_transform',
  counter: 'text_transform',
  unicode: 'text_transform',
  convert: 'structured_conversion',
  format: 'structured_conversion',
  schema: 'structured_conversion',
  diff: 'structured_conversion',
  api: 'structured_conversion',
  'generate-data': 'generator',
  'generate-web': 'generator',
  validate: 'text_transform',
  unit: 'calculator',
  calculate: 'calculator',
  image: 'media_processing',
  video: 'media_processing',
  audio: 'media_processing',
  pdf: 'media_processing',
  document: 'media_processing',
  archive: 'media_processing',
  file: 'media_processing',
  font: 'media_processing',
  tracking: 'data_processing',
  cheque: 'generator',
};

/**
 * Engine minimum tier requirements.
 * Engines not listed here are accessible to all tiers (including free).
 * Media engines and advanced data engines require 'pro' tier.
 */
export const ENGINE_MIN_TIER: Record<string, UserPlan> = {
  // Media engines — pro tier required
  image: 'pro',
  video: 'pro',
  audio: 'pro',
  pdf: 'pro',
  document: 'pro',
  archive: 'pro',
  font: 'pro',
  file: 'pro',
  // Advanced data engines — pro tier required
  schema: 'pro',
  diff: 'pro',
};

// ─── Engine → category (reverse mapping) ──────────────────────

export const ENGINE_TO_CATEGORY: Record<string, string> = {
  case: 'text', wrap: 'text', comment: 'text', markup: 'text',
  filter: 'text', transform: 'text', encode: 'text', hash: 'text',
  counter: 'text', unicode: 'text',
  validate: 'validate',
  convert: 'data', format: 'data', schema: 'data', diff: 'data', api: 'data',
  'generate-data': 'generate', 'generate-web': 'generate',
  unit: 'convert',
  calculate: 'calculate',
  image: 'media', video: 'media', audio: 'media', pdf: 'media',
  document: 'media', archive: 'media', file: 'media', font: 'media',
  tracking: 'tracking',
  cheque: 'cheque',
};
