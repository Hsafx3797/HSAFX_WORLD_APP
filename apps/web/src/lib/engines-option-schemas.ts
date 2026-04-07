/**
 * ENGINE_OPTION_SCHEMAS — runtime-available option documentation for all 28 engines.
 *
 * Hand-maintained because TypeScript interfaces aren't available at runtime.
 * Used by GET /api/v1/engines and GET /api/v1/engine/{name}/schema.
 */

export const ENGINE_OPTION_SCHEMAS: Record<string, object> = {
  case: {
    separator: { type: 'string', description: 'Character(s) between words', examples: ['_', '-', '.', ' ', '::'] },
    wordCase: { type: 'string', enum: ['lower', 'upper', 'title', 'capitalize', 'preserve'], description: 'Case applied to each word' },
    firstWordCase: { type: 'string', enum: ['lower', 'upper', 'title', 'capitalize', 'preserve'], description: 'Override case for the first word only' },
    charTransform: { type: 'string', enum: ['alternating', 'inverse-alternating', 'swap', 'random'], description: 'Character-level transform (bypasses word split)' },
    wordWrap: { type: 'object', properties: { left: 'string', right: 'string' }, description: 'Wrap each word instead of joining with separator' },
  },
  wrap: {
    scope: { type: 'string', enum: ['word', 'line', 'sentence', 'selection'], required: true },
    left: { type: 'string', required: true, description: 'Left wrapper string' },
    right: { type: 'string', required: true, description: 'Right wrapper string' },
    style: { type: 'string', description: 'Named wrapping style' },
  },
  comment: {
    language: { type: 'string', required: true, description: 'Programming language', examples: ['javascript', 'python', 'rust', 'sql'] },
    style: { type: 'string', enum: ['line', 'block', 'doc'], required: true },
    operation: { type: 'string', enum: ['add', 'remove', 'toggle'], required: true },
  },
  markup: {
    format: { type: 'string', enum: ['html', 'markdown', 'bbcode', 'latex'], required: true },
    tag: { type: 'string', required: true, description: 'Tag or element name', examples: ['bold', 'italic', 'heading', 'link', 'code'] },
    level: { type: 'number', description: 'Heading level (1-6)' },
    scope: { type: 'string', enum: ['word', 'line', 'selection'] },
    operation: { type: 'string', enum: ['wrap', 'unwrap', 'convert'] },
    convertTo: { type: 'string', enum: ['html', 'markdown'] },
    attributes: { type: 'object', description: 'HTML attributes as key-value pairs' },
  },
  filter: {
    operation: { type: 'string', enum: ['remove', 'extract', 'keep', 'replace', 'count'], required: true },
    target: { type: 'string', required: true, description: 'What to target', examples: ['empty-lines', 'duplicates', 'numbers', 'emails', 'urls', 'custom'] },
    scope: { type: 'string', enum: ['characters', 'words', 'lines'] },
    customPattern: { type: 'string', description: 'Regex pattern for target=custom' },
    replacement: { type: 'string', description: 'Replacement string for operation=replace' },
    flags: { type: 'string', description: 'Regex flags', examples: ['gi', 'gm'] },
  },
  transform: {
    operation: { type: 'string', enum: ['reverse', 'sort', 'shuffle', 'unique', 'repeat', 'truncate', 'pad', 'join', 'split', 'trim', 'pad-lines', 'normalize-length', 'indent', 'dedent', 'replace-breaks', 'split-by-length', 'scramble-letters', 'pick-random'], required: true },
    scope: { type: 'string', enum: ['characters', 'words', 'lines', 'sentences', 'paragraphs'], required: true },
    direction: { type: 'string', enum: ['asc', 'desc'] },
    caseSensitive: { type: 'boolean' },
    numeric: { type: 'boolean' },
    count: { type: 'number' },
    separator: { type: 'string' },
    maxLength: { type: 'number' },
    suffix: { type: 'string' },
    padChar: { type: 'string' },
    padSide: { type: 'string', enum: ['left', 'right', 'both'] },
    targetLength: { type: 'number' },
  },
  encode: {
    codec: { type: 'string', required: true, description: 'Encoding codec', examples: ['base64', 'url', 'html', 'hex', 'binary', 'morse', 'caesar', 'rot13', 'atbash', 'vigenere', 'rail-fence'] },
    operation: { type: 'string', enum: ['encode', 'decode'], required: true },
    shift: { type: 'number', description: 'Caesar shift amount' },
    key: { type: 'string', description: 'Vigenère key' },
    rails: { type: 'number', description: 'Rail fence rail count' },
  },
  hash: {
    algorithm: { type: 'string', required: true, examples: ['md5', 'sha1', 'sha256', 'sha512', 'crc32', 'adler32'] },
    output: { type: 'string', enum: ['hex', 'base64', 'binary'] },
    hmac: { type: 'boolean', description: 'Use HMAC mode' },
    key: { type: 'string', description: 'HMAC key' },
  },
  counter: {
    metrics: { type: 'array', items: 'string', required: true, examples: [['characters', 'words', 'lines', 'sentences', 'paragraphs', 'bytes', 'frequency', 'density', 'readability']] },
    options: {
      type: 'object',
      properties: {
        excludeSpaces: 'boolean',
        caseSensitive: 'boolean',
        excludeStopWords: 'boolean',
        topN: 'number',
      },
    },
  },
  unicode: {
    operation: { type: 'string', required: true, examples: ['to-fullwidth', 'to-halfwidth', 'normalize-nfc', 'strip-diacritics', 'to-circled', 'to-math-bold'] },
  },
  convert: {
    from: { type: 'string', required: true, examples: ['json', 'yaml', 'xml', 'csv', 'toml', 'ini', 'properties'] },
    to: { type: 'string', required: true, examples: ['json', 'yaml', 'xml', 'csv', 'toml', 'ini', 'properties'] },
    options: {
      type: 'object',
      properties: {
        indent: 'number',
        rootElement: 'string',
        delimiter: 'string',
        hasHeaders: 'boolean',
        sortKeys: 'boolean',
      },
    },
  },
  format: {
    language: { type: 'string', required: true, examples: ['json', 'xml', 'html', 'css', 'sql', 'yaml'] },
    operation: { type: 'string', enum: ['format', 'minify', 'validate', 'sort-keys'], required: true },
    options: {
      type: 'object',
      properties: {
        indent: 'number or "tab"',
        sortKeys: 'boolean',
        quoteStyle: 'single | double',
        trailingComma: 'boolean',
      },
    },
  },
  schema: {
    from: { type: 'string', required: true, examples: ['json-schema', 'typescript', 'zod', 'graphql'] },
    to: { type: 'string', required: true, examples: ['json-schema', 'typescript', 'zod', 'graphql'] },
    options: { type: 'object', properties: { name: 'string', exportStyle: 'named | default', strict: 'boolean' } },
  },
  diff: {
    mode: { type: 'string', enum: ['line', 'word', 'character'], required: true },
    format: { type: 'string', enum: ['unified', 'inline', 'json'] },
    contextLines: { type: 'number' },
    ignoreWhitespace: { type: 'boolean' },
    ignoreCase: { type: 'boolean' },
  },
  api: {
    operation: { type: 'string', enum: ['convert', 'parse'], required: true },
    from: { type: 'string', examples: ['curl', 'fetch', 'axios', 'http'] },
    to: { type: 'string', examples: ['curl', 'fetch', 'axios', 'http'] },
    parseType: { type: 'string', examples: ['jwt', 'url', 'query-string', 'headers'] },
  },
  'generate-data': {
    type: { type: 'string', required: true, examples: ['uuid', 'uuid-v4', 'nanoid', 'password', 'passphrase', 'person', 'company', 'credit-card', 'color', 'random-number', 'timestamp', 'username', 'hash', 'jwt'] },
    count: { type: 'number', description: 'Number of items to generate (1-100)' },
    options: { type: 'object', description: 'Generator-specific options (length, charset, format, etc.)' },
  },
  'generate-web': {
    type: { type: 'string', required: true, examples: ['slug', 'lorem', 'quote', 'emoji', 'gradient', 'box-shadow', 'border-radius', 'filter', 'transform', 'flexbox', 'grid', 'clip-path', 'typography', 'meta-tags', 'og-meta', 'sitemap', 'robots-txt', 'qr'] },
    count: { type: 'number', description: 'Number of items to generate' },
    options: { type: 'object', description: 'Generator-specific options' },
  },
  validate: {
    type: { type: 'string', required: true, examples: ['email', 'url', 'uuid', 'ip', 'json', 'credit-card', 'phone', 'isbn'] },
    strict: { type: 'boolean' },
    version: { type: 'string', description: 'Version constraint (e.g. uuid version)' },
  },
  unit: {
    category: { type: 'string', required: true, examples: ['length', 'weight', 'temperature', 'area', 'volume', 'speed', 'time', 'data'] },
    from: { type: 'string', required: true, description: 'Source unit' },
    to: { type: 'string', required: true, description: 'Target unit' },
    value: { type: 'number', required: true },
  },
  calculate: {
    type: { type: 'string', required: true, examples: ['expression', 'percentage', 'date-diff', 'compound-interest', 'bmi'] },
    inputs: { type: 'object', required: true, description: 'Calculator-specific inputs' },
  },
  // Media engines (FastAPI)
  image: {
    operation: { type: 'string', required: true, examples: ['resize', 'crop', 'rotate', 'flip', 'compress', 'watermark', 'convert', 'thumbnail'] },
    width: { type: 'number', description: 'Target width in pixels' },
    height: { type: 'number', description: 'Target height in pixels' },
    quality: { type: 'number', description: 'Output quality (1-100)' },
    outputFormat: { type: 'string', description: 'Output format override', examples: ['png', 'jpg', 'webp', 'avif'] },
  },
  video: {
    operation: { type: 'string', required: true, examples: ['transcode', 'trim', 'resize', 'compress', 'extract-audio', 'extract-frames', 'to-gif', 'thumbnail'] },
    crf: { type: 'number', description: 'Constant Rate Factor (quality)' },
    preset: { type: 'string', description: 'Encoding preset', examples: ['ultrafast', 'fast', 'medium', 'slow'] },
    codec: { type: 'string', description: 'Video codec', examples: ['h264', 'h265', 'vp9'] },
    start: { type: 'number', description: 'Start time in seconds' },
    end: { type: 'number', description: 'End time in seconds' },
    outputFormat: { type: 'string', examples: ['mp4', 'webm', 'mkv'] },
  },
  audio: {
    operation: { type: 'string', required: true, examples: ['convert', 'trim', 'normalize', 'compress', 'fade', 'speed', 'reverse'] },
    bitrate: { type: 'string', description: 'Audio bitrate', examples: ['128k', '192k', '320k'] },
    sampleRate: { type: 'number', description: 'Sample rate in Hz' },
    channels: { type: 'number', description: 'Number of audio channels' },
    outputFormat: { type: 'string', examples: ['mp3', 'wav', 'ogg', 'flac', 'aac'] },
  },
  pdf: {
    operation: { type: 'string', required: true, examples: ['merge', 'split', 'extract', 'compress', 'watermark', 'protect', 'unlock', 'rotate', 'to-pdfa'] },
    pageRange: { type: 'string', description: 'Page range (e.g. "1-3,5,7-10")' },
    password: { type: 'string', description: 'PDF password for protect/unlock' },
    watermarkText: { type: 'string', description: 'Watermark text' },
    rotation: { type: 'number', description: 'Rotation degrees', examples: [90, 180, 270] },
  },
  document: {
    operation: { type: 'string', required: true, examples: ['docx-to-pdf', 'txt-to-pdf', 'markdown-to-pdf', 'epub-to-pdf', 'xlsx-to-csv'] },
    outputFormat: { type: 'string', description: 'Output format override' },
  },
  archive: {
    operation: { type: 'string', required: true, examples: ['compress', 'decompress'] },
    format: { type: 'string', required: true, examples: ['zip', 'tar', '7z', 'gz', 'bz2'] },
    password: { type: 'string', description: 'Archive password' },
  },
  file: {
    operation: { type: 'string', required: true, examples: ['bulk-rename', 'batch-extension', 'hash-generator', 'metadata-viewer'] },
  },
  font: {
    operation: { type: 'string', required: true, examples: ['to-ttf', 'to-otf', 'to-woff', 'to-woff2'] },
  },
};
