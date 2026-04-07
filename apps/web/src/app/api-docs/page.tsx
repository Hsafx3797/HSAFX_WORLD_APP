/**
 * API Documentation Page
 * Professional B2B API reference for developer integrations
 */

'use client';

import { useState } from 'react';
import { Metadata } from 'next';

const apiEndpoints = [
  {
    category: 'Authentication',
    description: 'Secure API key management and OAuth 2.0 flows',
    endpoints: [
      {
        method: 'POST',
        path: '/v1/auth/token',
        description: 'Exchange API credentials for an access token',
        auth: false,
        request: {
          api_key: 'string (required)',
          api_secret: 'string (required)',
          grant_type: '"client_credentials"',
        },
        response: {
          access_token: 'string',
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'tools:execute tools:read',
        },
        example: `curl -X POST https://api.hsafx.world/v1/auth/token \\
  -H "Content-Type: application/json" \\
  -d '{"api_key": "ak_live_xxx", "api_secret": "sk_live_xxx", "grant_type": "client_credentials"}'`,
      },
      {
        method: 'POST',
        path: '/v1/auth/refresh',
        description: 'Refresh an expired access token',
        auth: true,
        request: { refresh_token: 'string (required)' },
        response: { access_token: 'string', expires_in: 3600 },
        example: `curl -X POST https://api.hsafx.world/v1/auth/refresh \\
  -H "Authorization: Bearer <token>" \\
  -d '{"refresh_token": "rt_xxx"}'`,
      },
      {
        method: 'DELETE',
        path: '/v1/auth/revoke',
        description: 'Revoke an API key or token',
        auth: true,
        request: { token: 'string (optional)' },
        response: { revoked: true },
        example: `curl -X DELETE https://api.hsafx.world/v1/auth/revoke \\
  -H "Authorization: Bearer <token>"`,
      },
    ],
  },
  {
    category: 'Tools',
    description: 'Core tool execution and discovery endpoints',
    endpoints: [
      {
        method: 'GET',
        path: '/v1/tools',
        description: 'List all available tools with filtering and pagination',
        auth: false,
        params: [
          { name: 'category', type: 'string', description: 'Filter by category (text, data, media, etc.)' },
          { name: 'tier', type: 'string', description: 'Filter by tier (free, pro, advance)' },
          { name: 'limit', type: 'number', description: 'Results per page (default: 50, max: 100)' },
          { name: 'offset', type: 'number', description: 'Pagination offset' },
        ],
        response: {
          tools: [{ id: 'string', name: 'string', category: 'string', tier: 'string' }],
          total: 446,
          limit: 50,
          offset: 0,
        },
        example: `curl https://api.hsafx.world/v1/tools?category=text&tier=free&limit=10 \\
  -H "Authorization: Bearer <token>"`,
      },
      {
        method: 'GET',
        path: '/v1/tools/:tool_id',
        description: 'Get detailed tool metadata and schema',
        auth: false,
        response: {
          id: 'json-formatter',
          name: 'JSON Formatter',
          description: 'Format and beautify JSON data',
          category: 'Data',
          tier: 'free',
          execution: 'client',
          input_schema: { type: 'object' },
          output_schema: { type: 'object' },
        },
        example: `curl https://api.hsafx.world/v1/tools/json-formatter \\
  -H "Authorization: Bearer <token>"`,
      },
      {
        method: 'POST',
        path: '/v1/tools/:tool_id/execute',
        description: 'Execute a tool with input data',
        auth: true,
        request: {
          input: 'string | object (required)',
          options: 'object (optional)',
          webhook_url: 'string (optional, for async jobs)',
        },
        response: {
          job_id: 'job_xxx (for async)',
          result: 'string | object',
          execution_time_ms: 42,
          credits_used: 1,
        },
        example: `curl -X POST https://api.hsafx.world/v1/tools/json-formatter/execute \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"input": "{\"name\":\"test\"}", "options": {"indent": 2}}'`,
      },
      {
        method: 'POST',
        path: '/v1/tools/batch',
        description: 'Execute multiple tools in a single request',
        auth: true,
        request: {
          operations: [{ tool_id: 'string', input: 'any', options: 'object' }],
          parallel: 'boolean (default: false)',
        },
        response: {
          results: [{ tool_id: 'string', success: true, result: 'any' }],
          total_execution_time_ms: 156,
          total_credits_used: 3,
        },
        example: `curl -X POST https://api.hsafx.world/v1/tools/batch \\
  -H "Authorization: Bearer <token>" \\
  -d '{"operations": [{"tool_id": "uppercase", "input": "hello"}, {"tool_id": "base64-encode", "input": "world"}], "parallel": true}'`,
      },
    ],
  },
  {
    category: 'Jobs',
    description: 'Async job management for long-running operations',
    endpoints: [
      {
        method: 'GET',
        path: '/v1/jobs/:job_id',
        description: 'Check the status of an async job',
        auth: true,
        response: {
          job_id: 'job_xxx',
          status: 'pending | processing | completed | failed',
          progress: 75,
          result: 'object (when completed)',
          error: 'string (when failed)',
          created_at: '2024-01-15T10:30:00Z',
          completed_at: '2024-01-15T10:30:05Z',
        },
        example: `curl https://api.hsafx.world/v1/jobs/job_abc123 \\
  -H "Authorization: Bearer <token>"`,
      },
      {
        method: 'DELETE',
        path: '/v1/jobs/:job_id',
        description: 'Cancel a pending or processing job',
        auth: true,
        response: { cancelled: true },
        example: `curl -X DELETE https://api.hsafx.world/v1/jobs/job_abc123 \\
  -H "Authorization: Bearer <token>"`,
      },
      {
        method: 'GET',
        path: '/v1/jobs/:job_id/result',
        description: 'Download the result of a completed job',
        auth: true,
        response: 'Binary file or JSON result',
        example: `curl https://api.hsafx.world/v1/jobs/job_abc123/result \\
  -H "Authorization: Bearer <token>" \\
  -o output.pdf`,
      },
    ],
  },
  {
    category: 'Usage & Billing',
    description: 'Monitor API usage and manage billing',
    endpoints: [
      {
        method: 'GET',
        path: '/v1/usage',
        description: 'Get current usage statistics',
        auth: true,
        params: [
          { name: 'start_date', type: 'string', description: 'ISO 8601 date' },
          { name: 'end_date', type: 'string', description: 'ISO 8601 date' },
          { name: 'granularity', type: 'string', description: 'hour | day | month' },
        ],
        response: {
          period: { start: '2024-01-01', end: '2024-01-31' },
          total_requests: 15420,
          total_credits_used: 8750,
          by_tool: [{ tool_id: 'json-formatter', requests: 5000, credits: 0 }],
          by_day: [{ date: '2024-01-15', requests: 520, credits: 280 }],
        },
        example: `curl "https://api.hsafx.world/v1/usage?start_date=2024-01-01&granularity=day" \\
  -H "Authorization: Bearer <token>"`,
      },
      {
        method: 'GET',
        path: '/v1/billing/credits',
        description: 'Get credit balance and transaction history',
        auth: true,
        response: {
          balance: 5000,
          transactions: [
            { id: 'txn_xxx', type: 'purchase', amount: 1000, date: '2024-01-10' },
            { id: 'txn_yyy', type: 'usage', amount: -50, tool_id: 'pdf-merge', date: '2024-01-11' },
          ],
        },
        example: `curl https://api.hsafx.world/v1/billing/credits \\
  -H "Authorization: Bearer <token>"`,
      },
    ],
  },
  {
    category: 'Webhooks',
    description: 'Real-time event notifications',
    endpoints: [
      {
        method: 'POST',
        path: '/v1/webhooks',
        description: 'Create a new webhook endpoint',
        auth: true,
        request: {
          url: 'https://your-server.com/webhook',
          events: ['job.completed', 'job.failed', 'credits.low'],
          secret: 'your_webhook_secret (optional)',
        },
        response: { id: 'wh_xxx', url: 'string', events: ['string'], active: true },
        example: `curl -X POST https://api.hsafx.world/v1/webhooks \\
  -H "Authorization: Bearer <token>" \\
  -d '{"url": "https://your-server.com/webhook", "events": ["job.completed"]}'`,
      },
      {
        method: 'GET',
        path: '/v1/webhooks',
        description: 'List all webhook endpoints',
        auth: true,
        response: { webhooks: [{ id: 'wh_xxx', url: 'string', events: ['string'], active: true }] },
        example: `curl https://api.hsafx.world/v1/webhooks \\
  -H "Authorization: Bearer <token>"`,
      },
      {
        method: 'DELETE',
        path: '/v1/webhooks/:webhook_id',
        description: 'Delete a webhook endpoint',
        auth: true,
        response: { deleted: true },
        example: `curl -X DELETE https://api.hsafx.world/v1/webhooks/wh_xxx \\
  -H "Authorization: Bearer <token>"`,
      },
    ],
  },
];

const sdkExamples = {
  typescript: `import { HSAFXClient } from '@hsafx/sdk';

const client = new HSAFXClient({
  apiKey: 'your-api-key-here',
  apiSecret: 'your-api-secret-here',
});

// Execute a tool
const result = await client.tools.execute('json-formatter', {
  input: '{"name":"John","age":30}',
  options: { indent: 2 },
});

console.log(result.output);

// Batch execution
const batchResults = await client.tools.batch([
  { toolId: 'uppercase', input: 'hello world' },
  { toolId: 'base64-encode', input: 'secret data' },
], { parallel: true });`,

  python: `from hsafx import HSAFXClient

client = HSAFXClient(
    api_key=os.environ["HSAFX_API_KEY"],
    api_secret=os.environ["HSAFX_API_SECRET"]
)

# Execute a tool
result = client.tools.execute("json-formatter", 
    input='{"name":"John","age":30}',
    options={"indent": 2}
)

print(result.output)

# Async job for large files
job = client.tools.execute_async("pdf-merge", 
    input=open("file.pdf", "rb"),
    webhook_url="https://your-server.com/webhook"
)

# Check job status
status = client.jobs.get(job.job_id)
print(f"Progress: {status.progress}%")`,

  curl: `# Authenticate
TOKEN=$(curl -s -X POST https://api.hsafx.world/v1/auth/token \\
  -H "Content-Type: application/json" \\
  -d '{"api_key": "ak_live_xxx", "api_secret": "sk_live_xxx", "grant_type": "client_credentials"}' \\
  | jq -r '.access_token')

# Execute a tool
curl -X POST https://api.hsafx.world/v1/tools/json-formatter/execute \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"input": "{\"name\":\"John\"}", "options": {"indent": 2}}'

# Upload file for processing
curl -X POST https://api.hsafx.world/v1/tools/pdf-compress/execute \\
  -H "Authorization: Bearer $TOKEN" \\
  -F "file=@document.pdf" \\
  -F "options={\"quality\": \"medium\"}"`,
};

const errorCodes = [
  { code: 400, name: 'Bad Request', description: 'Invalid request body or parameters' },
  { code: 401, name: 'Unauthorized', description: 'Missing or invalid authentication token' },
  { code: 403, name: 'Forbidden', description: 'Insufficient permissions or tier restriction' },
  { code: 404, name: 'Not Found', description: 'Resource or tool not found' },
  { code: 422, name: 'Unprocessable Entity', description: 'Valid request but failed validation' },
  { code: 429, name: 'Too Many Requests', description: 'Rate limit exceeded' },
  { code: 500, name: 'Internal Error', description: 'Server error, retry with exponential backoff' },
  { code: 503, name: 'Service Unavailable', description: 'Temporary maintenance or overload' },
];

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: 'bg-success/10 text-success border-success/20',
    POST: 'bg-primary/10 text-primary border-primary/20',
    PATCH: 'bg-warning/10 text-warning border-warning/20',
    PUT: 'bg-warning/10 text-warning border-warning/20',
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
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

export default function ApiDocsPage() {
  const [activeTab, setActiveTab] = useState('typescript');
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="border-b border-border bg-gradient-to-b from-muted/50 to-background">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
              v1.0 Stable
            </span>
            <span className="px-3 py-1 text-xs font-medium bg-success/10 text-success rounded-full">
              99.9% Uptime SLA
            </span>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            HSAFX World API
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mb-8">
            Production-grade API for 446+ text, data, and media transformation tools.
            Built for scale with batch processing, async jobs, and webhooks.
          </p>
          
          {/* Quick Start */}
          <div className="bg-card border border-border rounded-xl p-6 max-w-3xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Quick Start</h2>
              <a href="/dashboard/api-keys" className="text-sm text-primary hover:underline">
                Get API Keys →
              </a>
            </div>
            <div className="relative">
              <pre className="bg-muted/50 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                <code className="text-foreground">{`# Base URL
https://api.hsafx.world/v1

# Authentication Header
Authorization: Bearer <your_access_token>`}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Rate Limits & Plans */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">Rate Limits & Plans</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { tier: 'Free', requests: '100/min', concurrent: 5, features: ['Text tools', 'Basic support'], price: '$0' },
              { tier: 'Pro', requests: '1,000/min', concurrent: 25, features: ['All tools', 'Batch API', 'Priority support'], price: '$10/mo', popular: true },
              { tier: 'Advance', requests: '5,000/min', concurrent: 100, features: ['Everything in Pro', 'Webhooks', 'API access'], price: '$20/mo' },
            ].map((plan) => (
              <div key={plan.tier} className={`relative bg-card border rounded-xl p-6 ${plan.popular ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}>
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-foreground mb-1">{plan.tier}</h3>
                <p className="text-2xl font-bold text-foreground mb-4">{plan.price}</p>
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div><span className="font-medium text-foreground">{plan.requests}</span> requests</div>
                  <div><span className="font-medium text-foreground">{plan.concurrent}</span> concurrent</div>
                </div>
                <ul className="space-y-1 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-muted-foreground">
                      <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* SDK Examples */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">SDK Examples</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex border-b border-border">
              {['typescript', 'python', 'curl'].map((tab) => (
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
          <div className="flex gap-4 mt-4">
            <a href="https://npmjs.com/package/@hsafx/sdk" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331z"/></svg>
              npm install @hsafx/sdk
            </a>
            <a href="https://pypi.org/project/hsafx/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z"/></svg>
              pip install hsafx
            </a>
          </div>
        </section>

        {/* API Endpoints */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">API Reference</h2>
          <div className="space-y-8">
            {apiEndpoints.map((category) => (
              <div key={category.category} className="border border-border rounded-xl overflow-hidden">
                <div className="bg-muted/50 px-6 py-4 border-b border-border">
                  <h3 className="text-lg font-semibold text-foreground">{category.category}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
                <div className="divide-y divide-border">
                  {category.endpoints.map((endpoint, idx) => {
                    const endpointKey = `${category.category}-${idx}`;
                    const isExpanded = expandedEndpoint === endpointKey;
                    
                    return (
                      <div key={idx} className="bg-card">
                        <button
                          onClick={() => setExpandedEndpoint(isExpanded ? null : endpointKey)}
                          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <MethodBadge method={endpoint.method} />
                            <code className="text-sm font-mono text-foreground">{endpoint.path}</code>
                            {endpoint.auth && (
                              <span className="px-2 py-0.5 text-xs bg-warning/10 text-warning rounded">
                                Auth Required
                              </span>
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
                            
                            {'params' in endpoint && endpoint.params && (
                              <div>
                                <h4 className="text-sm font-semibold text-foreground mb-2">Query Parameters</h4>
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-left text-muted-foreground">
                                      <th className="pb-2 font-medium">Name</th>
                                      <th className="pb-2 font-medium">Type</th>
                                      <th className="pb-2 font-medium">Description</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border">
                                    {endpoint.params.map((param) => (
                                      <tr key={param.name}>
                                        <td className="py-2 font-mono text-foreground">{param.name}</td>
                                        <td className="py-2 text-muted-foreground">{param.type}</td>
                                        <td className="py-2 text-muted-foreground">{param.description}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                            
                            {'request' in endpoint && endpoint.request && (
                              <div>
                                <h4 className="text-sm font-semibold text-foreground mb-2">Request Body</h4>
                                <pre className="bg-muted p-4 rounded-lg text-xs font-mono overflow-x-auto">
                                  {JSON.stringify(endpoint.request, null, 2)}
                                </pre>
                              </div>
                            )}
                            
                            <div>
                              <h4 className="text-sm font-semibold text-foreground mb-2">Response</h4>
                              <pre className="bg-muted p-4 rounded-lg text-xs font-mono overflow-x-auto">
                                {typeof endpoint.response === 'string' 
                                  ? endpoint.response 
                                  : JSON.stringify(endpoint.response, null, 2)}
                              </pre>
                            </div>
                            
                            {'example' in endpoint && endpoint.example && (
                              <div>
                                <h4 className="text-sm font-semibold text-foreground mb-2">Example Request</h4>
                                <div className="relative">
                                  <CopyButton text={endpoint.example} />
                                  <pre className="bg-muted text-foreground p-4 rounded-lg text-xs font-mono overflow-x-auto">
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
                All errors return a consistent JSON structure: <code className="bg-muted px-2 py-0.5 rounded text-xs">{'{"error": {"code": "string", "message": "string", "details": {}}}'}</code>
              </p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="px-6 py-3 font-semibold text-foreground">Code</th>
                  <th className="px-6 py-3 font-semibold text-foreground">Name</th>
                  <th className="px-6 py-3 font-semibold text-foreground">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {errorCodes.map((err) => (
                  <tr key={err.code}>
                    <td className="px-6 py-3 font-mono text-foreground">{err.code}</td>
                    <td className="px-6 py-3 text-foreground">{err.name}</td>
                    <td className="px-6 py-3 text-muted-foreground">{err.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Support Section */}
        <section className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-border rounded-xl p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Need Help?</h2>
              <p className="text-muted-foreground">
                Get dedicated support and customization options.
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href="mailto:support@hsafx.world"
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Contact Sales
              </a>
              <a
                href="/docs"
                className="px-6 py-3 bg-card border border-border text-foreground rounded-lg font-medium hover:bg-muted transition-colors"
              >
                View Docs
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
