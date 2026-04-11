/**
 * Interactive API Explorer
 * Try engine executions with live code snippet generation
 */

'use client';

import { useState } from 'react';

const ENGINES = [
  { name: 'case', description: 'Case conversions', fields: [
    { key: 'separator', label: 'Separator', type: 'select', options: ['_', '-', '.', ' '], default: '_' },
    { key: 'wordCase', label: 'Word Case', type: 'select', options: ['upper', 'lower', 'title', 'sentence'], default: 'lower' },
  ]},
  { name: 'wrap', description: 'Text wrapping', fields: [
    { key: 'wrapper', label: 'Wrapper', type: 'select', options: ['quotes-single', 'quotes-double', 'parentheses', 'brackets', 'braces', 'angle'], default: 'quotes-double' },
  ]},
  { name: 'filter', description: 'Remove/extract/keep patterns', fields: [
    { key: 'action', label: 'Action', type: 'select', options: ['remove', 'extract', 'keep'], default: 'remove' },
    { key: 'pattern', label: 'Pattern', type: 'text', default: '' },
  ]},
  { name: 'transform', description: 'Reverse, sort, shuffle, pad, join', fields: [
    { key: 'operation', label: 'Operation', type: 'select', options: ['reverse', 'sort', 'shuffle', 'trim', 'deduplicate', 'pad-left', 'pad-right', 'join'], default: 'reverse' },
    { key: 'delimiter', label: 'Delimiter', type: 'text', default: '\\n' },
  ]},
  { name: 'encode', description: 'Base64, hex, URL, ROT13, morse', fields: [
    { key: 'format', label: 'Format', type: 'select', options: ['base64', 'hex', 'url', 'rot13', 'morse', 'binary', 'html-entities'], default: 'base64' },
    { key: 'action', label: 'Action', type: 'select', options: ['encode', 'decode'], default: 'encode' },
  ]},
  { name: 'hash', description: 'SHA, MD5, CRC hashing', fields: [
    { key: 'algorithm', label: 'Algorithm', type: 'select', options: ['sha256', 'sha512', 'sha1', 'md5', 'crc32'], default: 'sha256' },
  ]},
  { name: 'counter', description: 'Count words, chars, lines', fields: [
    { key: 'mode', label: 'Mode', type: 'select', options: ['words', 'characters', 'lines', 'sentences', 'frequency'], default: 'words' },
  ]},
  { name: 'unicode', description: 'Unicode transforms', fields: [
    { key: 'style', label: 'Style', type: 'select', options: ['fullwidth', 'bold', 'italic', 'monospace', 'circled', 'zalgo'], default: 'fullwidth' },
  ]},
  { name: 'generate-data', description: 'UUID, password, nanoid', fields: [
    { key: 'type', label: 'Type', type: 'select', options: ['uuid', 'nanoid', 'password', 'person', 'lorem'], default: 'uuid' },
    { key: 'count', label: 'Count', type: 'number', default: '1' },
  ]},
  { name: 'comment', description: 'Add/remove code comments', fields: [
    { key: 'language', label: 'Language', type: 'select', options: ['javascript', 'python', 'java', 'go', 'rust', 'c', 'cpp', 'csharp', 'ruby', 'php', 'html', 'css', 'sql', 'bash'], default: 'javascript' },
    { key: 'style', label: 'Style', type: 'select', options: ['line', 'block'], default: 'line' },
    { key: 'action', label: 'Action', type: 'select', options: ['add', 'remove', 'toggle'], default: 'add' },
  ]},
  { name: 'markup', description: 'HTML/Markdown/BBCode wrapping', fields: [
    { key: 'format', label: 'Format', type: 'select', options: ['html', 'markdown', 'bbcode', 'latex'], default: 'html' },
    { key: 'tag', label: 'Tag/Element', type: 'text', default: 'strong' },
  ]},
  { name: 'convert', description: 'JSON↔YAML↔XML↔CSV↔TOML', fields: [
    { key: 'from', label: 'From', type: 'select', options: ['json', 'yaml', 'xml', 'csv', 'toml'], default: 'json' },
    { key: 'to', label: 'To', type: 'select', options: ['json', 'yaml', 'xml', 'csv', 'toml'], default: 'yaml' },
  ]},
  { name: 'format', description: 'Format/minify SQL, JSON, CSS', fields: [
    { key: 'language', label: 'Language', type: 'select', options: ['json', 'sql', 'css', 'graphql', 'html', 'xml'], default: 'json' },
    { key: 'action', label: 'Action', type: 'select', options: ['format', 'minify'], default: 'format' },
  ]},
  { name: 'schema', description: 'JSON Schema↔TypeScript↔Zod', fields: [
    { key: 'from', label: 'From', type: 'select', options: ['json-schema', 'typescript', 'zod', 'joi'], default: 'json-schema' },
    { key: 'to', label: 'To', type: 'select', options: ['json-schema', 'typescript', 'zod', 'joi'], default: 'typescript' },
  ]},
  { name: 'diff', description: 'Text and schema diff', fields: [
    { key: 'mode', label: 'Mode', type: 'select', options: ['text', 'json', 'schema'], default: 'text' },
  ]},
  { name: 'api', description: 'cURL parse, JWT decode, URL parse', fields: [
    { key: 'operation', label: 'Operation', type: 'select', options: ['curl-parse', 'jwt-decode', 'url-parse'], default: 'jwt-decode' },
  ]},
  { name: 'generate-web', description: 'CSS generators, QR, lorem', fields: [
    { key: 'type', label: 'Type', type: 'select', options: ['lorem', 'qr', 'gradient', 'shadow', 'border-radius'], default: 'lorem' },
  ]},
  { name: 'validate', description: '39 format validators', fields: [
    { key: 'format', label: 'Format', type: 'select', options: ['email', 'url', 'uuid', 'ip', 'json', 'base64', 'credit-card', 'phone', 'hex-color'], default: 'email' },
  ]},
  { name: 'calculate', description: 'Expression and financial calcs', fields: [
    { key: 'mode', label: 'Mode', type: 'select', options: ['expression', 'percentage', 'financial', 'health'], default: 'expression' },
  ]},
  { name: 'unit', description: 'Unit conversions', fields: [
    { key: 'category', label: 'Category', type: 'select', options: ['length', 'weight', 'temperature', 'volume', 'speed', 'time', 'data'], default: 'length' },
    { key: 'from', label: 'From Unit', type: 'text', default: 'km' },
    { key: 'to', label: 'To Unit', type: 'text', default: 'mi' },
  ]},
  { name: 'image', description: 'Resize, crop, convert, watermark', fields: [
    { key: 'operation', label: 'Operation', type: 'select', options: ['resize', 'crop', 'convert', 'rotate', 'flip', 'watermark', 'compress'], default: 'resize' },
    { key: 'width', label: 'Width', type: 'number', default: '800' },
    { key: 'height', label: 'Height', type: 'number', default: '600' },
  ]},
  { name: 'video', description: 'Convert, trim, extract audio', fields: [
    { key: 'operation', label: 'Operation', type: 'select', options: ['convert', 'trim', 'extract-audio', 'thumbnail', 'compress'], default: 'convert' },
  ]},
  { name: 'audio', description: 'Convert, normalize, split', fields: [
    { key: 'operation', label: 'Operation', type: 'select', options: ['convert', 'normalize', 'split', 'trim', 'compress'], default: 'convert' },
  ]},
  { name: 'pdf', description: 'Merge, split, compress, OCR', fields: [
    { key: 'operation', label: 'Operation', type: 'select', options: ['merge', 'split', 'compress', 'ocr', 'watermark', 'encrypt', 'to-images'], default: 'compress' },
  ]},
  { name: 'document', description: 'DOCX↔PDF, EPUB, markdown', fields: [
    { key: 'operation', label: 'Operation', type: 'select', options: ['docx-to-pdf', 'pdf-to-docx', 'md-to-html', 'html-to-md', 'to-epub'], default: 'md-to-html' },
  ]},
  { name: 'archive', description: 'Zip, tar, 7z, extract', fields: [
    { key: 'operation', label: 'Operation', type: 'select', options: ['compress', 'extract', 'list'], default: 'compress' },
    { key: 'format', label: 'Format', type: 'select', options: ['zip', 'tar', 'tar.gz', '7z'], default: 'zip' },
  ]},
  { name: 'file', description: 'File metadata extraction', fields: [
    { key: 'operation', label: 'Operation', type: 'select', options: ['metadata', 'mime-type', 'checksum', 'size', 'preview'], default: 'metadata' },
  ]},
  { name: 'font', description: 'Convert, subset, WOFF2', fields: [
    { key: 'operation', label: 'Operation', type: 'select', options: ['convert', 'subset', 'to-woff2', 'info'], default: 'convert' },
  ]},
  { name: 'tracking', description: 'Container, vessel, flight tracking', fields: [
    { key: 'type', label: 'Tracking Type', type: 'select', options: ['container', 'vessel', 'flight'], default: 'container' },
  ]},
  { name: 'cheque', description: 'Multi-currency cheque generation', fields: [
    { key: 'currency', label: 'Currency', type: 'select', options: ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'INR'], default: 'USD' },
    { key: 'amount', label: 'Amount', type: 'number', default: '1000' },
    { key: 'payee', label: 'Payee Name', type: 'text', default: '' },
  ]},
] as const;

type FieldValue = string;

function generateCurl(engine: string, input: string, options: Record<string, FieldValue>) {
  const body = JSON.stringify({ input, options }, null, 2);
  return `curl -X POST https://api.hsafx.world/api/v1/engine/${engine} \\
  -H "X-API-Key: hsafx_live_YOUR_KEY_HERE" \\
  -H "Content-Type: application/json" \\
  -d '${body}'`;
}

function generateJS(engine: string, input: string, options: Record<string, FieldValue>) {
  const opts = JSON.stringify(options, null, 2).replace(/\n/g, '\n  ');
  return `const res = await fetch('https://api.hsafx.world/api/v1/engine/${engine}', {
  method: 'POST',
  headers: {
    'X-API-Key': process.env.HSAFX_API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    input: ${JSON.stringify(input)},
    options: ${opts},
  }),
});

const { jobId } = await res.json();
console.log('Job started:', jobId);`;
}

function generatePython(engine: string, input: string, options: Record<string, FieldValue>) {
  const opts = JSON.stringify(options, null, 4).replace(/\n/g, '\n    ');
  return `import requests, os

res = requests.post(
    f"https://api.hsafx.world/api/v1/engine/${engine}",
    headers={"X-API-Key": os.environ["HSAFX_API_KEY"]},
    json={
        "input": ${JSON.stringify(input)},
        "options": ${opts}
    }
)

data = res.json()
print("Job started:", data["jobId"])`;
}

function generateGo(engine: string, input: string, options: Record<string, FieldValue>) {
  const body = JSON.stringify({ input, options });
  return `package main

import (
	"fmt"
	"net/http"
	"strings"
	"io"
	"os"
)

func main() {
	body := strings.NewReader(\`${body}\`)
	req, _ := http.NewRequest("POST", "https://api.hsafx.world/api/v1/engine/${engine}", body)
	req.Header.Set("X-API-Key", os.Getenv("HSAFX_API_KEY"))
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	result, _ := io.ReadAll(resp.Body)
	fmt.Println(string(result))
}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="absolute top-2 right-2 px-2 py-1 text-xs bg-background/80 hover:bg-background border border-border rounded text-muted-foreground hover:text-foreground transition-colors">
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function ApiExplorerPage() {
  const [selectedEngine, setSelectedEngine] = useState(ENGINES[0].name);
  const [input, setInput] = useState('hello world');
  const [options, setOptions] = useState<Record<string, FieldValue>>({});
  const [apiKey, setApiKey] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeTab, setCodeTab] = useState<'curl' | 'javascript' | 'python' | 'go'>('curl');

  const engine = ENGINES.find((e) => e.name === selectedEngine) ?? ENGINES[0];

  const handleEngineChange = (name: string) => {
    setSelectedEngine(name);
    setOptions({});
    setResponse(null);
    setError(null);
  };

  const getOption = (key: string, defaultVal: string) => options[key] ?? defaultVal;

  const buildOptions = () => {
    const opts: Record<string, FieldValue> = {};
    for (const field of engine.fields) {
      opts[field.key] = getOption(field.key, field.default);
    }
    return opts;
  };

  const handleTryIt = async () => {
    if (!apiKey.trim()) {
      setError('Enter your API key to try the request');
      return;
    }
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const res = await fetch(`/api/v1/engine/${selectedEngine}`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input, options: buildOptions() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(`${res.status}: ${data.error?.message || JSON.stringify(data)}`);
      } else {
        setResponse(JSON.stringify(data, null, 2));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const builtOptions = buildOptions();
  const snippets = {
    curl: generateCurl(selectedEngine, input, builtOptions),
    javascript: generateJS(selectedEngine, input, builtOptions),
    python: generatePython(selectedEngine, input, builtOptions),
    go: generateGo(selectedEngine, input, builtOptions),
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border bg-gradient-to-b from-muted/50 to-background">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <a href="/api-docs" className="text-sm text-muted-foreground hover:text-foreground">&larr; API Docs</a>
          </div>
          <h1 className="text-3xl font-bold mb-2">Interactive API Explorer</h1>
          <p className="text-muted-foreground">Select an engine, configure options, and try it live.</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Request Builder */}
          <div className="space-y-6">
            {/* Engine Selector */}
            <div>
              <label className="block text-sm font-medium mb-2">Engine</label>
              <select
                value={selectedEngine}
                onChange={(e) => handleEngineChange(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {ENGINES.map((e) => (
                  <option key={e.name} value={e.name}>
                    {e.name} — {e.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Input</label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring resize-y"
                placeholder="Enter input text..."
              />
            </div>

            {/* Options */}
            <div>
              <label className="block text-sm font-medium mb-2">Options</label>
              <div className="space-y-3 bg-card border border-border rounded-lg p-4">
                {engine.fields.map((field) => (
                  <div key={field.key} className="flex items-center gap-3">
                    <label className="text-sm text-muted-foreground w-28 shrink-0">{field.label}</label>
                    {field.type === 'select' ? (
                      <select
                        value={getOption(field.key, field.default)}
                        onChange={(e) => setOptions({ ...options, [field.key]: e.target.value })}
                        className="flex-1 h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        {'options' in field && field.options.map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === 'number' ? (
                      <input
                        type="number"
                        value={getOption(field.key, field.default)}
                        onChange={(e) => setOptions({ ...options, [field.key]: e.target.value })}
                        className="flex-1 h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    ) : (
                      <input
                        type="text"
                        value={getOption(field.key, field.default)}
                        onChange={(e) => setOptions({ ...options, [field.key]: e.target.value })}
                        className="flex-1 h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        placeholder={field.label}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* API Key & Try It */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="hsafx_live_..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your key is sent directly to the API — never stored.
                </p>
              </div>
              <button
                onClick={handleTryIt}
                disabled={loading}
                className="w-full h-10 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? 'Executing...' : `Try POST /api/v1/engine/${selectedEngine}`}
              </button>
            </div>

            {/* Response */}
            {(response || error) && (
              <div>
                <label className="block text-sm font-medium mb-2">Response</label>
                {error ? (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive font-mono">
                    {error}
                  </div>
                ) : (
                  <div className="relative">
                    <CopyButton text={response!} />
                    <pre className="p-4 bg-muted border border-border rounded-lg text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
                      {response}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Code Snippets */}
          <div>
            <label className="block text-sm font-medium mb-2">Generated Code</label>
            <div className="bg-card border border-border rounded-xl overflow-hidden sticky top-4">
              <div className="flex border-b border-border">
                {(['curl', 'javascript', 'python', 'go'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setCodeTab(tab)}
                    className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                      codeTab === tab
                        ? 'bg-muted text-foreground border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab === 'curl' ? 'cURL' : tab === 'javascript' ? 'JavaScript' : tab === 'python' ? 'Python' : 'Go'}
                  </button>
                ))}
              </div>
              <div className="relative">
                <CopyButton text={snippets[codeTab]} />
                <pre className="p-4 text-xs font-mono overflow-x-auto max-h-[600px] overflow-y-auto">
                  <code>{snippets[codeTab]}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
