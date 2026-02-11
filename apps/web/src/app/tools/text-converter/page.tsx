import { Metadata } from 'next';
import { TextConverterUnified } from '@/components/tools/text-converter-unified';

export const metadata: Metadata = {
  title: 'Text Converter & Transformer | HSAFX Tools',
  description: 'All-in-one text converter with 60+ transformations. Convert case, encode/decode, format text, and more. Supports camelCase, snake_case, Base64, URL encoding, and many more formats.',
  keywords: ['text converter', 'case converter', 'camelCase', 'snake_case', 'Base64', 'URL encode', 'text transformer', 'online tool'],
  openGraph: {
    title: 'Text Converter & Transformer | HSAFX Tools',
    description: 'All-in-one text converter with 60+ transformations including case conversion, encoding, formatting and more.',
  },
};

export default function TextConverterPage() {
  return (
    <div className="container py-8">
      {/* Hero Section */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">✏️ Text Converter & Transformer</h1>
            <p className="text-muted-foreground max-w-2xl">
              All-in-one text converter with 60+ transformations. Convert case, encode/decode, format text, and more.
              Runs entirely in your browser — your data never leaves your device.
            </p>
          </div>
        </div>
      </div>

      {/* Text Converter Interface */}
      <TextConverterUnified />

      {/* SEO Content */}
      {/* <div className="mt-12 prose prose-sm dark:prose-invert max-w-none">
        <h2>About Text Converter</h2>
        <p>
          The HSAFX Text Converter is a comprehensive, all-in-one tool for transforming text in countless ways.
          Whether you need to convert between programming naming conventions, encode data, or apply creative text effects,
          this tool has you covered.
        </p>
        
        <h3>Available Transformations</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 not-prose">
          <div className="p-4 rounded-lg border bg-card">
            <h4 className="font-semibold mb-2">🔤 Basic Cases</h4>
            <p className="text-sm text-muted-foreground">UPPERCASE, lowercase, Title Case, Sentence case, Capitalize Each, Swap Case</p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <h4 className="font-semibold mb-2">💻 Programming Cases</h4>
            <p className="text-sm text-muted-foreground">camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, dot.case</p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <h4 className="font-semibold mb-2">🔗 Symbol Separators</h4>
            <p className="text-sm text-muted-foreground">Underscore, Hyphen, Space, Colon, Pipe, Plus separators</p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <h4 className="font-semibold mb-2">✨ Text Effects</h4>
            <p className="text-sm text-muted-foreground">Reverse, Mirror, Zalgo, Wide Text, Small Text, Upside Down</p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <h4 className="font-semibold mb-2">🔐 Encoding & Ciphers</h4>
            <p className="text-sm text-muted-foreground">Base64, URL Encode, HTML Encode, ROT13, Binary, Hex, ASCII</p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <h4 className="font-semibold mb-2">🔄 Transformations</h4>
            <p className="text-sm text-muted-foreground">Remove Whitespace, Remove Duplicates, Sort Lines, Unique Lines, Wrap Lines</p>
          </div>
        </div>

        <h3>Features</h3>
        <ul>
          <li><strong>Real-time Preview:</strong> See transformations as you type</li>
          <li><strong>Undo/Redo:</strong> Full history support with keyboard shortcuts</li>
          <li><strong>Text Analysis:</strong> Character, word, and line counts</li>
          <li><strong>One-click Copy:</strong> Copy transformed text to clipboard</li>
          <li><strong>Download Option:</strong> Save results as a text file</li>
          <li><strong>Privacy First:</strong> All processing happens in your browser</li>
        </ul>

        <h3>How to Use</h3>
        <ol>
          <li>Enter or paste your text in the input area</li>
          <li>Browse transformation categories or use the search</li>
          <li>Click any transformation button to apply it</li>
          <li>Copy the result or download as a file</li>
          <li>Use Ctrl+Z/Ctrl+Y for undo/redo</li>
        </ol>

        <h3>Common Use Cases</h3>
        <ul>
          <li><strong>Developers:</strong> Convert variable names between camelCase, snake_case, and kebab-case</li>
          <li><strong>Content Writers:</strong> Fix capitalization and formatting issues</li>
          <li><strong>Data Processing:</strong> Encode/decode Base64, URL, and HTML entities</li>
          <li><strong>Fun & Creative:</strong> Create zalgo text, wide text, or upside-down text</li>
        </ul>
      </div> */}
    </div>
  );
}
