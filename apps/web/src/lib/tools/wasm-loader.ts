/**
 * WASM Loader with Progressive Enhancement
 *
 * Strategy:
 * 1. Lazily load the WASM module on first text tool execution
 * 2. If WASM loads → use native Rust functions (fast, 154 exports)
 * 3. If WASM fails → gracefully fall back to JS implementations (wasm-fallback.ts)
 *
 * The JS fallback contains the full 191-tool set and is always available.
 * WASM adds ~1.2 MB upfront but executes ~10-100x faster for text transforms.
 */

import type { TextToolsModule } from './wasm-fallback';

// ─── Types ─────────────────────────────────────────────────────────────

/** A WASM module is just a bag of named exports after initialization. */
type WasmExports = Record<string, ((...args: unknown[]) => unknown) | unknown>;

// ─── WASM Module Singleton ─────────────────────────────────────────────

let wasmModule: WasmExports | null = null;
let wasmLoadAttempted = false;
let wasmLoadPromise: Promise<WasmExports | null> | null = null;

/**
 * Lazily initialize the WASM module. Only attempts loading once.
 * Returns the module on success, null on failure.
 */
async function loadWasm(): Promise<WasmExports | null> {
  // Already loaded
  if (wasmModule) return wasmModule;

  // Already failed
  if (wasmLoadAttempted && !wasmLoadPromise) return null;

  // In-flight — deduplicate
  if (wasmLoadPromise) return wasmLoadPromise;

  wasmLoadAttempted = true;

  wasmLoadPromise = (async () => {
    try {
      // SSR guard — WASM only works in the browser
      if (typeof window === 'undefined') return null;

      // Dynamic import of the wasm-pack generated JS glue
      // webpackIgnore: true → the file is in /public/wasm/, served statically
      // @ts-expect-error — runtime URL served from /public, not a TS module
      const wasm = await import(/* webpackIgnore: true */ '/wasm/text_tools.js');

      // Initialize the WASM module by pointing to the .wasm binary
      await wasm.default('/wasm/text_tools_bg.wasm');

      wasmModule = wasm as unknown as WasmExports;
      console.info('[WASM] text-tools loaded successfully (154 functions)');
      return wasmModule;
    } catch (err) {
      console.warn('[WASM] Failed to load text-tools, using JS fallback:', err);
      wasmModule = null;
      return null;
    } finally {
      wasmLoadPromise = null;
    }
  })();

  return wasmLoadPromise;
}

// ─── JS Fallback (lazy import) ─────────────────────────────────────────

let fallbackModule: typeof import('./wasm-fallback') | null = null;

async function getFallback() {
  if (!fallbackModule) {
    fallbackModule = await import('./wasm-fallback');
  }
  return fallbackModule;
}

// ─── Tool ID → WASM function name mapping ──────────────────────────────
// The WASM module exports snake_case function names.
// The tool registry uses kebab-case tool IDs.

/**
 * Simple 1:1 tools — single string argument, returns string.
 */
const WASM_FUNCTION_MAP: Record<string, string> = {
  // ── Case converters (IDs 1-21) ──
  'uppercase': 'uppercase',
  'lowercase': 'lowercase',
  'title-case': 'title_case',
  'camel-case': 'camel_case',
  'pascal-case': 'pascal_case',
  'snake-case': 'snake_case',
  'kebab-case': 'kebab_case',
  'constant-case': 'constant_case',
  'dot-case': 'dot_case',
  'path-case': 'path_case',
  'train-case': 'train_case',
  'swap-case': 'swap_case',
  'sentence-case': 'sentence_case',
  'alternating-case': 'alternating_case',
  'inverse-case': 'inverse_case',
  'screaming-snake-case': 'screaming_snake_case',
  'flat-case': 'flat_case',
  'capitalized-case': 'capitalized_case',
  'spongebob-case': 'spongebob_case',
  'leet-speak': 'leet_speak',
  'studly-case': 'studly_case',

  // ── Wrappers (IDs 22-55) ──
  'wrap-backticks': 'wrap_backticks',
  'wrap-single-quotes': 'wrap_single_quotes',
  'wrap-double-quotes': 'wrap_double_quotes',
  'wrap-triple-single-quotes': 'wrap_triple_single_quotes',
  'wrap-triple-double-quotes': 'wrap_triple_double_quotes',
  'wrap-parentheses': 'wrap_parentheses',
  'wrap-square-brackets': 'wrap_square_brackets',
  'wrap-curly-braces': 'wrap_curly_braces',
  'wrap-angle-brackets': 'wrap_angle_brackets',
  'wrap-double-angle-brackets': 'wrap_double_angle_brackets',
  'wrap-md-inline-code': 'wrap_md_inline_code',
  'line-comment': 'line_comment',
  'block-comment': 'block_comment',
  'bold-html': 'bold_html',
  'italic-html': 'italic_html',
  'underline-html': 'underline_html',
  'strikethrough-html': 'strikethrough_html',
  'highlight-html': 'highlight_html',
  'bold-md': 'bold_md',
  'italic-md': 'italic_md',
  'strikethrough-md': 'strikethrough_md',
  'blockquote': 'blockquote',
  'heading-h1': 'heading_h1',
  'heading-h2': 'heading_h2',
  'heading-h3': 'heading_h3',
  'heading-h4': 'heading_h4',
  'heading-h5': 'heading_h5',
  'heading-h6': 'heading_h6',

  // ── Unicode styles (IDs 56-80) ──
  'small-caps': 'small_caps',
  'subscript': 'subscript_text',
  'superscript': 'superscript_text',
  'mirror-text': 'mirror_text',
  'fullwidth-text': 'fullwidth_text',
  'circled-letters': 'circled_text',
  'squared-letters': 'squared_text',
  'sparkle-text': 'sparkle_text',
  'clap-text': 'clap_text',
  'monospace': 'monospace_text',
  'bold-unicode': 'bold_unicode_text',
  'italic-unicode': 'italic_unicode_text',
  'upside-down-text': 'upside_down_text',

  // ── Encodings (single-arg) ──
  'hex-decode': 'hex_decode',
  'hex-encode': 'hex_encode',
  'binary-decode': 'binary_decode',
  'binary-encode': 'binary_encode',
  'base64-decode': 'base64_decode',
  'base64-encode': 'base64_encode',
  'base32-decode': 'base32_decode',
  'base32-encode': 'base32_encode',
  'url-decode': 'url_decode',
  'url-encode': 'url_encode',
  'morse-decode': 'morse_decode',
  'morse-encode': 'morse_encode',
  'octal-decode': 'octal_decode',
  'octal-encode': 'octal_encode',
  'rot13': 'rot13',
  'rot47': 'rot47',
  'nato-phonetic': 'nato_encode',
  'pig-latin': 'pig_latin',
  'html-escape': 'html_escape',
  'html-unescape': 'html_unescape',
  'ascii-code': 'ascii_encode',
  'ascii-decode': 'ascii_decode',
  'json-escape': 'json_escape',
  'xml-escape': 'xml_escape',
  'atbash-cipher': 'atbash_cipher',

  // ── Hashes ──
  'md5': 'md5_hash',
  'sha256': 'sha256_hash',
  'sha512': 'sha512_hash',

  // ── Counters (return number → toString) ──
  'char-count': 'char_count',
  'word-count': 'word_count',
  'line-count': 'line_count',

  // ── Format / single-arg ──
  'trim-whitespace': 'trim_whitespace',
  'remove-extra-spaces': 'remove_extra_spaces',
  'remove-all-whitespace': 'remove_all_whitespace',
  'add-line-numbers': 'add_line_numbers',
  'remove-line-numbers': 'remove_line_numbers',
  'reverse-text': 'reverse_text',
  'reverse-words': 'reverse_words',
  'remove-duplicate-lines': 'remove_duplicate_lines',

  // ── Manipulation / single-arg ──
  'remove-vowels': 'remove_vowels',
  'remove-consonants': 'remove_consonants',
  'remove-numbers': 'remove_numbers',
  'remove-symbols': 'remove_symbols',
  'remove-empty-lines': 'remove_empty_lines',
  'remove-leading-zeros': 'remove_leading_zeros',
  'keep-only-letters': 'keep_only_letters',
  'keep-only-numbers': 'keep_only_numbers',
  'extract-emails': 'extract_emails',
  'extract-urls': 'extract_urls',
  'extract-numbers': 'extract_numbers',
  'extract-hashtags': 'extract_hashtags',
  'extract-mentions': 'extract_mentions',
  'trim-lines': 'trim_lines',
  'dedent': 'dedent_text',
  'shuffle-lines': 'shuffle_lines',
  'scramble-letters': 'scramble_words',
  'url-slug': 'url_slug',
  'url-slug-generator': 'url_slug',
  'escape-regex': 'escape_regex',
  'pick-random-line': 'pick_random_line',

  // ── Generators (no-input or single-arg) ──
  'generate-uuid': 'generate_uuid',
};

// ─── Tools that need multi-arg calls ───────────────────────────────────
type OptionMapper = (
  wasm: WasmExports,
  input: string,
  opts?: Record<string, unknown>,
) => string;

/** Helper to safely call a wasm function. */
function callWasm(wasm: WasmExports, fn: string, ...args: unknown[]): unknown {
  const f = wasm[fn];
  if (typeof f !== 'function') throw new Error(`WASM fn '${fn}' not found`);
  return f(...args);
}

const WASM_OPTION_MAP: Record<string, OptionMapper> = {
  'caesar-cipher': (w, input, opts) =>
    callWasm(w, 'caesar_cipher', input, (opts?.shift as number) ?? 3) as string,

  'zalgo-text': (w, input, opts) =>
    callWasm(w, 'zalgo_text', input, (opts?.intensity as number) ?? 3) as string,

  'sort-lines': (w, input, opts) =>
    callWasm(w, 'sort_lines', input, (opts?.ascending as boolean) ?? true) as string,

  'wrap-html-tag': (w, input, opts) =>
    callWasm(w, 'wrap_html_tag', input, (opts?.tag as string) ?? 'div') as string,

  'wrap-md-code-block': (w, input, opts) =>
    callWasm(w, 'wrap_md_code_block', input, (opts?.language as string) ?? '') as string,

  'prefix-lines': (w, input, opts) =>
    callWasm(w, 'prefix_lines', input, (opts?.prefix as string) ?? '') as string,

  'suffix-lines': (w, input, opts) =>
    callWasm(w, 'suffix_lines', input, (opts?.suffix as string) ?? '') as string,

  'add-prefix': (w, input, opts) =>
    callWasm(w, 'prefix_lines', input, (opts?.prefix as string) ?? '') as string,

  'add-suffix': (w, input, opts) =>
    callWasm(w, 'suffix_lines', input, (opts?.suffix as string) ?? '') as string,

  'indent': (w, input, opts) =>
    callWasm(w, 'indent_text', input, (opts?.spaces as number) ?? 2) as string,

  'pad-lines': (w, input, opts) =>
    callWasm(w, 'pad_lines', input, (opts?.width as number) ?? 80, (opts?.padChar as string) ?? ' ') as string,

  'split-lines-by-length': (w, input, opts) =>
    callWasm(w, 'split_lines_by_length', input, (opts?.maxLength as number) ?? 80) as string,

  'replace-line-breaks': (w, input, opts) =>
    callWasm(w, 'replace_line_breaks', input, (opts?.replacement as string) ?? ' ') as string,

  'number-lines': (w, input, opts) =>
    callWasm(w, 'number_lines', input, (opts?.start as number) ?? 1, (opts?.separator as string) ?? ': ') as string,

  'find-replace': (w, input, opts) =>
    callWasm(w, 'find_replace', input, (opts?.find as string) ?? '', (opts?.replace as string) ?? '') as string,

  'find-replace-case-insensitive': (w, input, opts) =>
    callWasm(w, 'find_replace_case_insensitive', input, (opts?.find as string) ?? '', (opts?.replace as string) ?? '') as string,

  'regex-replace': (w, input, opts) =>
    callWasm(w, 'regex_replace', input, (opts?.pattern as string) ?? '', (opts?.replacement as string) ?? '') as string,

  'truncate': (w, input, opts) =>
    callWasm(w, 'truncate_text', input, (opts?.maxLength as number) ?? 100, (opts?.ellipsis as string) ?? '...') as string,

  'center-text': (w, input, opts) =>
    callWasm(w, 'center_text', input, (opts?.width as number) ?? 80) as string,

  'right-align': (w, input, opts) =>
    callWasm(w, 'right_align_text', input, (opts?.width as number) ?? 80) as string,

  'repeat-text': (w, input, opts) =>
    callWasm(w, 'repeat_text', input, (opts?.count as number) ?? 1, (opts?.separator as string) ?? '\n') as string,

  'simple-diff': (w, input, opts) =>
    callWasm(w, 'simple_diff', input, (opts?.compare as string) ?? '') as string,

  'wrap-text': (w, input, opts) =>
    callWasm(w, 'wrap_text', input, (opts?.width as number) ?? 80) as string,

  'lorem-ipsum': (w, _input, opts) =>
    callWasm(w, 'lorem_ipsum', (opts?.paragraphs as number) ?? 3) as string,

  'generate-password': (w, _input, opts) =>
    callWasm(
      w,
      'generate_password',
      (opts?.length as number) ?? 16,
      (opts?.includeSymbols as boolean) ?? true,
      (opts?.includeNumbers as boolean) ?? true,
    ) as string,

  'count-occurrences': (w, input, opts) =>
    String(
      callWasm(
        w,
        'count_occurrences',
        input,
        (opts?.search as string) ?? '',
        (opts?.caseSensitive as boolean) ?? true,
      ),
    ),

  'text-stats': (w, input) => {
    const stats = callWasm(w, 'text_stats', input);
    return typeof stats === 'string' ? stats : JSON.stringify(stats);
  },

  'regex-match': (w, input, opts) => {
    const matches = callWasm(w, 'regex_match', input, (opts?.pattern as string) ?? '');
    return typeof matches === 'string' ? matches : JSON.stringify(matches);
  },

  'regex-test': (w, input, opts) =>
    String(callWasm(w, 'regex_test', input, (opts?.pattern as string) ?? '')),
};

// ─── Main API ──────────────────────────────────────────────────────────

/**
 * Execute a text tool by its tool ID.
 *
 * Resolution order:
 * 1. WASM (if loaded) — native Rust, fast
 * 2. JS fallback — always available
 *
 * @param toolId  - kebab-case tool identifier (e.g. "base64-encode")
 * @param input   - the text to process
 * @param options - optional parameters (e.g. { shift: 3 } for caesar cipher)
 * @returns the transformed text
 */
export async function executeTextTool(
  toolId: string,
  input: string,
  options?: Record<string, unknown>,
): Promise<string> {
  // ── Attempt WASM execution first ──────────────────────────────────
  const wasm = await loadWasm();

  if (wasm) {
    // Multi-arg tools (with options)
    const optionMapper = WASM_OPTION_MAP[toolId];
    if (optionMapper) {
      try {
        return optionMapper(wasm, input, options);
      } catch (err) {
        console.warn(`[WASM] Error in ${toolId}, falling back to JS:`, err);
      }
    }

    // Simple 1:1 tools
    const wasmFnName = WASM_FUNCTION_MAP[toolId];
    if (wasmFnName) {
      const fn = wasm[wasmFnName];
      if (typeof fn === 'function') {
        try {
          // Some WASM functions return numbers (counters) — always stringify
          const result = fn(input);
          return String(result);
        } catch (err) {
          console.warn(`[WASM] Error in ${toolId} (${wasmFnName}), falling back to JS:`, err);
        }
      }
    }
  }

  // ── Fall back to JS implementation ────────────────────────────────
  const fb = await getFallback();
  return fb.executeTextTool(toolId, input, options);
}

// ─── Backward-compatible exports ───────────────────────────────────────
// executor.ts only imports executeTextTool, but expose these for any
// future consumer that needs direct module access.

/**
 * Load the text tools module object (JS fallback implementation).
 * Use this when you need direct access to individual functions.
 */
export async function loadTextTools(): Promise<TextToolsModule> {
  const fb = await getFallback();
  return fb.loadTextTools();
}

/**
 * Get current WASM status for diagnostics / admin panel.
 */
export function getWasmStatus(): {
  loaded: boolean;
  attempted: boolean;
  functionCount: number;
} {
  return {
    loaded: wasmModule !== null,
    attempted: wasmLoadAttempted,
    functionCount: wasmModule
      ? Object.values(wasmModule).filter((v) => typeof v === 'function').length
      : 0,
  };
}
