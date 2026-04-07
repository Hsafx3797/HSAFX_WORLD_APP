/**
 * Markup Engine — HTML / Markdown / BBCode / LaTeX Tag Engine
 *
 * Wraps text with format-specific semantic tags (bold, italic, heading, etc.)
 * and can convert between markup formats.
 */

import type { Engine, MarkupEngineOptions, EngineInput, EngineResult, ValidationOutcome } from './types';

// ---------------------------------------------------------------------------
// Tag definitions per format
// ---------------------------------------------------------------------------

interface TagDef {
  open: (opts: MarkupEngineOptions) => string;
  close: (opts: MarkupEngineOptions) => string;
}

type TagMap = Record<string, TagDef>;

const HTML_TAGS: TagMap = {
  bold:          { open: () => '<b>',       close: () => '</b>' },
  italic:        { open: () => '<i>',       close: () => '</i>' },
  underline:     { open: () => '<u>',       close: () => '</u>' },
  strikethrough: { open: () => '<s>',       close: () => '</s>' },
  code:          { open: () => '<code>',    close: () => '</code>' },
  pre:           { open: () => '<pre>',     close: () => '</pre>' },
  blockquote:    { open: () => '<blockquote>', close: () => '</blockquote>' },
  superscript:   { open: () => '<sup>',     close: () => '</sup>' },
  subscript:     { open: () => '<sub>',     close: () => '</sub>' },
  heading:       {
    open: (o) => `<h${o.level ?? 1}>`,
    close: (o) => `</h${o.level ?? 1}>`,
  },
  link:          {
    open: (o) => `<a href="${o.attributes?.href ?? '#'}">`,
    close: () => '</a>',
  },
  span:          {
    open: (o) => {
      const attrs = o.attributes
        ? Object.entries(o.attributes).map(([k, v]) => `${k}="${v}"`).join(' ')
        : '';
      return attrs ? `<span ${attrs}>` : '<span>';
    },
    close: () => '</span>',
  },
};

const MARKDOWN_TAGS: TagMap = {
  bold:          { open: () => '**',  close: () => '**' },
  italic:        { open: () => '_',   close: () => '_' },
  underline:     { open: () => '<u>', close: () => '</u>' },
  strikethrough: { open: () => '~~',  close: () => '~~' },
  code:          { open: () => '`',   close: () => '`' },
  pre:           { open: () => '```\n', close: () => '\n```' },
  blockquote:    { open: () => '> ',  close: () => '' },
  highlight:     { open: () => '==',  close: () => '==' },
  heading:       {
    open: (o) => '#'.repeat(o.level ?? 1) + ' ',
    close: () => '',
  },
  link:          {
    open: () => '[',
    close: (o) => `](${o.attributes?.href ?? '#'})`,
  },
};

const BBCODE_TAGS: TagMap = {
  bold:          { open: () => '[b]',    close: () => '[/b]' },
  italic:        { open: () => '[i]',    close: () => '[/i]' },
  underline:     { open: () => '[u]',    close: () => '[/u]' },
  strikethrough: { open: () => '[s]',    close: () => '[/s]' },
  code:          { open: () => '[code]', close: () => '[/code]' },
  heading:       {
    open: (o) => `[h${o.level ?? 1}]`,
    close: (o) => `[/h${o.level ?? 1}]`,
  },
  link:          {
    open: (o) => `[url=${o.attributes?.href ?? '#'}]`,
    close: () => '[/url]',
  },
};

const LATEX_TAGS: TagMap = {
  bold:          { open: () => '\\textbf{', close: () => '}' },
  italic:        { open: () => '\\textit{', close: () => '}' },
  underline:     { open: () => '\\underline{', close: () => '}' },
  strikethrough: { open: () => '\\sout{',   close: () => '}' },
  code:          { open: () => '\\texttt{',  close: () => '}' },
  heading:       {
    open: (o) => {
      const levels = ['section', 'subsection', 'subsubsection', 'paragraph', 'subparagraph'];
      return `\\${levels[Math.min((o.level ?? 1) - 1, levels.length - 1)]}{`;
    },
    close: () => '}',
  },
};

const FORMAT_MAP: Record<string, TagMap> = {
  html: HTML_TAGS,
  markdown: MARKDOWN_TAGS,
  bbcode: BBCODE_TAGS,
  latex: LATEX_TAGS,
};

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const markupEngine: Engine<MarkupEngineOptions> = {
  name: 'markup',
  description: 'Wrap text with format-specific semantic tags (HTML, Markdown, BBCode, LaTeX).',

  validate(options: MarkupEngineOptions): ValidationOutcome {
    const errors: string[] = [];
    const validFormats = Object.keys(FORMAT_MAP);
    if (!validFormats.includes(options.format)) {
      errors.push(`Invalid format "${options.format}". Must be one of: ${validFormats.join(', ')}`);
    }
    if (!options.tag) {
      errors.push('tag is required');
    }
    if (options.level !== undefined && (options.level < 1 || options.level > 6)) {
      errors.push('level must be between 1 and 6');
    }
    // Check tag exists in the format
    const tags = FORMAT_MAP[options.format];
    if (tags && !tags[options.tag]) {
      errors.push(`Tag "${options.tag}" not available for format "${options.format}". Available: ${Object.keys(tags).join(', ')}`);
    }
    return errors.length ? { valid: false, errors } : { valid: true };
  },

  execute(input: EngineInput, options: MarkupEngineOptions): EngineResult {
    const text = typeof input === 'string' ? input : String(input);
    const tags = FORMAT_MAP[options.format];
    const tagDef = tags[options.tag];

    if (!tagDef) {
      return { output: text, metadata: { error: `Unknown tag: ${options.tag}` } };
    }

    const open = tagDef.open(options);
    const close = tagDef.close(options);

    if (options.operation === 'unwrap') {
      let result = text;
      if (result.startsWith(open)) result = result.slice(open.length);
      if (result.endsWith(close)) result = result.slice(0, -close.length);
      return { output: result.trim(), metadata: { operation: 'unwrap' } };
    }

    // Default: wrap
    const output = `${open}${text}${close}`;
    return { output, metadata: { format: options.format, tag: options.tag } };
  },
};
