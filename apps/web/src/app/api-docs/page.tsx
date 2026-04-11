/**
 * API Documentation Page
 * B2B Engine API reference for developer integrations
 */

'use client';

import { useState } from 'react';

const ENGINE_LIST = [
  { name: 'case', backend: 'Rust', description: 'Case conversions (snake, camel, kebab, etc.)' },
  { name: 'wrap', backend: 'Rust', description: 'Text wrapping (quotes, brackets, tags)' },
  { name: 'filter', backend: 'Rust', description: 'Remove/extract/keep text patterns' },
  { name: 'transform', backend: 'Rust', description: 'Reverse, sort, shuffle, pad, join' },
  { name: 'encode', backend: 'Rust', description: 'Base64, hex, URL, ROT13, morse encoding' },
  { name: 'hash', backend: 'Rust', description: 'SHA, MD5, CRC, HMAC hashing' },
  { name: 'counter', backend: 'Rust', description: 'Word, char, line, frequency counts' },
  { name: 'unicode', backend: 'Rust', description: 'Unicode transforms (zalgo, fullwidth)' },
  { name: 'generate-data', backend: 'Rust', description: 'UUID, password, nanoid, person data' },
  { name: 'comment', backend: 'Node.js', description: 'Add/remove code comments (37 languages)' },
  { name: 'markup', backend: 'Node.js', description: 'HTML/Markdown/BBCode/LaTeX wrapping' },
  { name: 'convert', backend: 'Node.js', description: 'JSON↔YAML↔XML↔CSV↔TOML conversion' },
  { name: 'format', backend: 'Node.js', description: 'Format/minify SQL, JSON, CSS, GraphQL' },
  { name: 'schema', backend: 'Node.js', description: 'JSON Schema↔TypeScript↔Zod↔Joi' },
  { name: 'diff', backend: 'Node.js', description: 'Text, schema, OpenAPI diff' },
  { name: 'api', backend: 'Node.js', description: 'cURL parse, JWT decode, URL parse' },
  { name: 'generate-web', backend: 'Node.js', description: 'CSS generators, QR, SEO, lorem' },
  { name: 'validate', backend: 'Node.js', description: '39 format validators (email, UUID, etc.)' },
  { name: 'calculate', backend: 'Node.js', description: 'Expression, financial, health calcs' },
  { name: 'unit', backend: 'Node.js', description: 'Unit conversions (length, weight, temp)' },
  { name: 'image', backend: 'FastAPI', description: 'Resize, crop, convert, watermark (19 ops)' },
  { name: 'video', backend: 'FastAPI', description: 'Convert, trim, extract audio (12 ops)' },
  { name: 'audio', backend: 'FastAPI', description: 'Convert, normalize, split (12 ops)' },
  { name: 'pdf', backend: 'FastAPI', description: 'Merge, split, compress, OCR (27 ops)' },
  { name: 'document', backend: 'FastAPI', description: 'DOCX↔PDF, EPUB, markdown (15 ops)' },
  { name: 'archive', backend: 'FastAPI', description: 'Zip, tar, 7z, extract (8 ops)' },
  { name: 'file', backend: 'FastAPI', description: 'File metadata extraction (5 ops)' },
  { name: 'font', backend: 'FastAPI', description: 'Convert, subset, WOFF2 (4 ops)' },
  { name: 'tracking', backend: 'FastAPI', description: 'Container, vessel, flight tracking' },
  { name: 'cheque', backend: 'FastAPI', description: 'Multi-currency cheque generation' },
];

const apiEndpoints = [
  {
    category: 'Engine Execution',
    description: 'Execute any of the 30 engines with direct parameter calls',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/engine/{name}',
        description: 'Execute an engine with input and options',
        auth: true,
        scopes: ['tools:execute'],
        request: {
          input: 'string | object (required)',
          options: 'object (engine-specific, see schema)',
        },
        response: {
          jobId: 'string',
          status: 'pending',
        },
        example: `curl -X POST https://api.hsafx.world/api/v1/engine/case \\
  -H "X-API-Key: hsafx_live_xxxxxxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"input": "hello world", "options": {"separator": "_", "wordCase": "upper"}}'`,
      },
    ],
  },
  {
    category: 'Engine Discovery',
    description: 'List available engines and their option schemas',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/engines',
        description: 'List all 30 engines with option schemas',
        auth: false,
        response: {
          engines: [
            {
              name: 'case',
              description: 'Case conversions',
              backend: 'rust',
              optionSchema: '{ ... }',
            },
          ],
          total: 30,
        },
        example: `curl https://api.hsafx.world/api/v1/engines \\
  -H "X-API-Key: hsafx_live_xxxxxxxxxxxxxxxxxxxx"`,
      },
      {
        method: 'GET',
        path: '/api/v1/engine/{name}/schema',
        description: 'Get the option schema for a specific engine',
        auth: false,
        response: {
          name: 'case',
          description: 'Case conversions (snake, camel, etc.)',
          optionSchema: {
            type: 'object',
            properties: {
              separator: { type: 'string' },
              wordCase: { type: 'string', enum: ['upper', 'lower', 'title'] },
            },
          },
        },
        example: `curl https://api.hsafx.world/api/v1/engine/case/schema`,
      },
    ],
  },
  {
    category: 'Jobs',
    description: 'Async job management for engine executions',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/jobs/{jobId}',
        description: 'Check the status of an engine execution job',
        auth: true,
        scopes: ['tools:read'],
        response: {
          jobId: 'string',
          status: 'pending | running | succeeded | failed',
          result: 'object (when succeeded)',
          error: 'string (when failed)',
          createdAt: '2024-01-15T10:30:00Z',
          completedAt: '2024-01-15T10:30:05Z',
        },
        example: `curl https://api.hsafx.world/api/v1/jobs/job_abc123 \\
  -H "X-API-Key: hsafx_live_xxxxxxxxxxxxxxxxxxxx"`,
      },
    ],
  },
  {
    category: 'Usage',
    description: 'Monitor API usage and quota',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/usage',
        description: 'Get current period usage by suite',
        auth: true,
        scopes: ['billing:read'],
        response: {
          plan: 'growth',
          period: { start: '2024-01-01', end: '2024-01-31' },
          suites: [
            { suite: 'text-tools', used: 4200, limit: 50000 },
            { suite: 'media-tools', used: 150, limit: 5000 },
          ],
        },
        example: `curl https://api.hsafx.world/api/v1/usage \\
  -H "X-API-Key: hsafx_live_xxxxxxxxxxxxxxxxxxxx"`,
      },
    ],
  },
];

const sdkExamples = {
  curl: `# Execute an engine
curl -X POST https://api.hsafx.world/api/v1/engine/case \\
  -H "X-API-Key: hsafx_live_xxxxxxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"input": "hello world", "options": {"separator": "_", "wordCase": "upper"}}'

# Response: { "jobId": "job_abc123", "status": "pending" }

# Check job result
curl https://api.hsafx.world/api/v1/jobs/job_abc123 \\
  -H "X-API-Key: hsafx_live_xxxxxxxxxxxxxxxxxxxx"

# List engines
curl https://api.hsafx.world/api/v1/engines

# Get engine schema
curl https://api.hsafx.world/api/v1/engine/convert/schema`,

  typescript: `// Install: npm install node-fetch (or use native fetch)

const API_KEY = process.env.HSAFX_API_KEY;
const BASE = 'https://api.hsafx.world/api/v1';

// Execute an engine
const res = await fetch(\`\${BASE}/engine/convert\`, {
  method: 'POST',
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    input: '{"name": "John", "age": 30}',
    options: { from: 'json', to: 'yaml' },
  }),
});

const { jobId } = await res.json();

// Poll for result
const job = await fetch(\`\${BASE}/jobs/\${jobId}\`, {
  headers: { 'X-API-Key': API_KEY },
}).then(r => r.json());

console.log(job.result);`,

  python: `import requests
import os

API_KEY = os.environ["HSAFX_API_KEY"]
BASE = "https://api.hsafx.world/api/v1"

# Execute an engine
res = requests.post(
    f"{BASE}/engine/hash",
    headers={"X-API-Key": API_KEY},
    json={
        "input": "hello world",
        "options": {"algorithm": "sha256"}
    }
)

job_id = res.json()["jobId"]

# Get result
job = requests.get(
    f"{BASE}/jobs/{job_id}",
    headers={"X-API-Key": API_KEY}
).json()

print(job["result"])`,
};

const errorCodes = [
  { code: 400, name: 'Bad Request', description: 'Invalid request body or engine options' },
  { code: 401, name: 'Unauthorized', description: 'Missing or invalid API key' },
  { code: 403, name: 'Forbidden', description: 'API key lacks required scope' },
  { code: 404, name: 'Not Found', description: 'Engine or job not found' },
  { code: 422, name: 'Unprocessable Entity', description: 'Valid request but engine validation failed' },
  { code: 429, name: 'Too Many Requests', description: 'Suite quota exceeded for billing period' },
  { code: 500, name: 'Internal Error', description: 'Server error — retry with exponential backoff' },
  { code: 503, name: 'Service Unavailable', description: 'Engine backend temporarily unavailable' },
];

const B2B_PLANS = [
  { name: 'Starter', price: '$49/mo', ops: '10,000', engines: '20 engines', support: 'Email' },
  { name: 'Growth', price: '$149/mo', ops: '50,000', engines: '30 engines', support: 'Priority', popular: true },
  { name: 'Scale', price: '$499/mo', ops: '250,000', engines: '30 engines', support: 'Dedicated' },
  { name: 'Enterprise', price: '$1,499/mo', ops: 'Unlimited', engines: '30 engines + custom', support: '24/7 SLA' },
];

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: 'bg-success/10 text-success border-success/20',
    POST: 'bg-primary/10 text-primary border-primary/20',
    DELETE: 'bg-destructive/10 text-destructive border-destructive/20',
  };
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${colors[method] || 'bg-muted text-muted-foreground'}`}>
      {method}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="absolute top-3 right-3 px-2 py-1 text-xs bg-background/80 hover:bg-background border border-border rounded text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function ApiDocsPage() {
  const [activeTab, setActiveTab] = useState('curl');
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [engineSearch, setEngineSearch] = useState('');

  const filteredEngines = ENGINE_LIST.filter(
    (e) =>
      e.name.includes(engineSearch.toLowerCase()) ||
      e.description.toLowerCase().includes(engineSearch.toLowerCase()) ||
      e.backend.toLowerCase().includes(engineSearch.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b border-border bg-linear-to-b from-muted/50 to-background">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">v1 API</span>
            <span className="px-3 py-1 text-xs font-medium bg-success/10 text-success rounded-full">30 Engines</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Engine API Reference</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mb-8">
            30 parameterized server-side engines for text, data, and media processing.
            All engines accept direct parameters — no presets, no tool IDs.
          </p>

          <div className="flex gap-3 mb-8">
            <a href="/api-docs/explorer" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:bg-primary/90 transition-colors">
              Interactive Explorer &rarr;
            </a>
            <a href="/dashboard/api" className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-md font-medium text-sm hover:bg-muted transition-colors">
              Get API Keys
            </a>
          </div>

          {/* Quick Start */}
          <div className="bg-card border border-border rounded-xl p-6 max-w-3xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Quick Start</h2>
            </div>
            <div className="relative">
              <CopyButton text={`curl -X POST https://api.hsafx.world/api/v1/engine/case \\\n  -H "X-API-Key: hsafx_live_xxxxxxxxxxxxxxxxxxxx" \\\n  -H "Content-Type: application/json" \\\n  -d '{"input": "hello world", "options": {"separator": "_", "wordCase": "upper"}}'`} />
              <pre className="bg-muted/50 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                <code className="text-foreground">{`# Base URL
https://api.hsafx.world/api/v1

# Authentication
X-API-Key: hsafx_live_xxxxxxxxxxxxxxxxxxxx

# Execute an engine
POST /api/v1/engine/{name}
Body: { "input": "...", "options": { ... } }`}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Authentication */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">Authentication</h2>
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <p className="text-muted-foreground">
              All API requests require an API key in the <code className="bg-muted px-2 py-0.5 rounded text-xs">X-API-Key</code> header.
            </p>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Key format:</span> <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">hsafx_live_{'<52 alphanumeric chars>'}</code></div>
              <div><span className="font-medium">Test keys:</span> <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">hsafx_test_{'<52 alphanumeric chars>'}</code> — sandbox, no billing</div>
            </div>
            <h3 className="text-sm font-semibold mt-4">API Key Scopes</h3>
            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              <div className="p-2 bg-muted/50 rounded"><code className="font-mono text-xs">tools:read</code> — List engines, view schemas</div>
              <div className="p-2 bg-muted/50 rounded"><code className="font-mono text-xs">tools:execute</code> — Execute engines</div>
              <div className="p-2 bg-muted/50 rounded"><code className="font-mono text-xs">billing:read</code> — View usage and quota</div>
              <div className="p-2 bg-muted/50 rounded"><code className="font-mono text-xs">billing:write</code> — Manage subscription</div>
            </div>
          </div>
        </section>

        {/* B2B Plans */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">Plans & Quotas</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {B2B_PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-card border rounded-xl p-6 ${plan.popular ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                    Popular
                  </span>
                )}
                <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                <p className="text-2xl font-bold mb-4">{plan.price}</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div><span className="font-medium text-foreground">{plan.ops}</span> ops/month</div>
                  <div>{plan.engines}</div>
                  <div>{plan.support} support</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Engine Reference */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Engine Reference</h2>
            <input
              type="text"
              placeholder="Search engines..."
              value={engineSearch}
              onChange={(e) => setEngineSearch(e.target.value)}
              className="h-9 px-3 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-48"
            />
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border bg-muted/50">
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Engine</th>
                  <th className="px-4 py-3 font-semibold">Backend</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEngines.map((engine, idx) => (
                  <tr key={engine.name} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono font-medium">{engine.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        engine.backend === 'Rust'
                          ? 'bg-orange-500/10 text-orange-600'
                          : engine.backend === 'Node.js'
                            ? 'bg-green-500/10 text-green-600'
                            : 'bg-blue-500/10 text-blue-600'
                      }`}>
                        {engine.backend}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{engine.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SDK Examples */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">Code Examples</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex border-b border-border">
              {(['curl', 'typescript', 'python'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-muted text-foreground border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab === 'typescript' ? 'TypeScript' : tab === 'python' ? 'Python' : 'cURL'}
                </button>
              ))}
            </div>
            <div className="relative">
              <CopyButton text={sdkExamples[activeTab as keyof typeof sdkExamples]} />
              <pre className="p-6 text-sm font-mono overflow-x-auto">
                <code className="text-foreground">{sdkExamples[activeTab as keyof typeof sdkExamples]}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* API Endpoints */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">API Endpoints</h2>
          <div className="space-y-8">
            {apiEndpoints.map((category) => (
              <div key={category.category} className="border border-border rounded-xl overflow-hidden">
                <div className="bg-muted/50 px-6 py-4 border-b border-border">
                  <h3 className="text-lg font-semibold">{category.category}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
                <div className="divide-y divide-border">
                  {category.endpoints.map((endpoint, idx) => {
                    const key = `${category.category}-${idx}`;
                    const isExpanded = expandedEndpoint === key;
                    return (
                      <div key={idx} className="bg-card">
                        <button
                          onClick={() => setExpandedEndpoint(isExpanded ? null : key)}
                          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <MethodBadge method={endpoint.method} />
                            <code className="text-sm font-mono">{endpoint.path}</code>
                            {endpoint.auth && (
                              <span className="px-2 py-0.5 text-xs bg-warning/10 text-warning rounded">Auth</span>
                            )}
                            {'scopes' in endpoint && endpoint.scopes && (
                              <span className="text-xs text-muted-foreground">{(endpoint.scopes as string[]).join(', ')}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground hidden sm:block">{endpoint.description}</span>
                            <svg className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="px-6 pb-6 space-y-4 border-t border-border bg-muted/20">
                            <p className="text-sm text-muted-foreground pt-4">{endpoint.description}</p>
                            {'request' in endpoint && endpoint.request && (
                              <div>
                                <h4 className="text-sm font-semibold mb-2">Request Body</h4>
                                <pre className="bg-muted p-4 rounded-lg text-xs font-mono overflow-x-auto">
                                  {JSON.stringify(endpoint.request, null, 2)}
                                </pre>
                              </div>
                            )}
                            <div>
                              <h4 className="text-sm font-semibold mb-2">Response</h4>
                              <pre className="bg-muted p-4 rounded-lg text-xs font-mono overflow-x-auto">
                                {typeof endpoint.response === 'string'
                                  ? endpoint.response
                                  : JSON.stringify(endpoint.response, null, 2)}
                              </pre>
                            </div>
                            {'example' in endpoint && endpoint.example && (
                              <div>
                                <h4 className="text-sm font-semibold mb-2">Example</h4>
                                <div className="relative">
                                  <CopyButton text={endpoint.example} />
                                  <pre className="bg-muted p-4 rounded-lg text-xs font-mono overflow-x-auto">
                                    {endpoint.example}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Error Codes */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">Error Handling</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-6 py-4 bg-muted/50 border-b border-border">
              <p className="text-sm text-muted-foreground">
                All errors return: <code className="bg-muted px-2 py-0.5 rounded text-xs">{'{"error": {"code": "string", "message": "string", "details": {}}}'}</code>
              </p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="px-6 py-3 font-semibold">Code</th>
                  <th className="px-6 py-3 font-semibold">Name</th>
                  <th className="px-6 py-3 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {errorCodes.map((err) => (
                  <tr key={err.code}>
                    <td className="px-6 py-3 font-mono">{err.code}</td>
                    <td className="px-6 py-3">{err.name}</td>
                    <td className="px-6 py-3 text-muted-foreground">{err.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Support */}
        <section className="bg-linear-to-r from-primary/10 via-primary/5 to-transparent border border-border rounded-xl p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="text-xl font-bold mb-2">Need Help?</h2>
              <p className="text-muted-foreground">Enterprise support, custom engines, and SLA guarantees.</p>
            </div>
            <div className="flex gap-3">
              <a href="mailto:support@hsafx.world" className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                Contact Sales
              </a>
              <a href="/dashboard/api" className="px-6 py-3 bg-card border border-border rounded-lg font-medium hover:bg-muted transition-colors">
                Get API Keys
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
