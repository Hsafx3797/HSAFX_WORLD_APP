import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'API Documentation - HSAFX World',
  description: 'Complete API documentation for integrating HSAFX World tools into your applications',
};

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-2">API Documentation</h1>
          <p className="text-muted-foreground">
            Integrate HSAFX World tools into your applications
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="sticky top-8 space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Getting Started</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="#introduction" className="text-primary hover:underline">Introduction</a>
                  </li>
                  <li>
                    <a href="#authentication" className="text-muted-foreground hover:text-foreground">Authentication</a>
                  </li>
                  <li>
                    <a href="#rate-limits" className="text-muted-foreground hover:text-foreground">Rate Limits</a>
                  </li>
                  <li>
                    <a href="#errors" className="text-muted-foreground hover:text-foreground">Error Handling</a>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">Endpoints</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="#text-tools" className="text-muted-foreground hover:text-foreground">Text Tools</a>
                  </li>
                  <li>
                    <a href="#converters" className="text-muted-foreground hover:text-foreground">Converters</a>
                  </li>
                  <li>
                    <a href="#generators" className="text-muted-foreground hover:text-foreground">Generators</a>
                  </li>
                  <li>
                    <a href="#media" className="text-muted-foreground hover:text-foreground">Media Tools</a>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">SDKs</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="#sdk-js" className="text-muted-foreground hover:text-foreground">JavaScript</a>
                  </li>
                  <li>
                    <a href="#sdk-python" className="text-muted-foreground hover:text-foreground">Python</a>
                  </li>
                </ul>
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 prose prose-neutral dark:prose-invert max-w-none">
            {/* Introduction */}
            <section id="introduction" className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Introduction</h2>
              <p className="text-muted-foreground mb-4">
                The HSAFX World API allows you to integrate our 446+ tools directly into your applications. 
                Use our RESTful API to process text, convert data, generate content, and more.
              </p>
              
              <div className="not-prose bg-card border border-border rounded-lg p-4 mb-4">
                <p className="text-sm font-medium mb-2">Base URL</p>
                <code className="text-sm bg-muted px-3 py-2 rounded block">
                  https://api.hsafx.world/v1
                </code>
              </div>
            </section>

            {/* Authentication */}
            <section id="authentication" className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Authentication</h2>
              <p className="text-muted-foreground mb-4">
                All API requests require an API key. Include your key in the Authorization header:
              </p>
              
              <div className="not-prose bg-muted rounded-lg p-4 mb-4 overflow-x-auto">
                <pre className="text-sm text-foreground">
{`curl -X POST https://api.hsafx.world/v1/tools/uppercase \\
  -H "Authorization: Bearer sk_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"text": "hello world"}'`}
                </pre>
              </div>
              
              <div className="not-prose p-4 bg-warning/10 border border-warning/30 rounded-lg">
                <p className="text-sm">
                  <strong>⚠️ Security:</strong> Never expose your API key in client-side code. 
                  Always make API calls from your backend server.
                </p>
              </div>
            </section>

            {/* Rate Limits */}
            <section id="rate-limits" className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Rate Limits</h2>
              <p className="text-muted-foreground mb-4">
                API rate limits depend on your plan:
              </p>
              
              <div className="not-prose overflow-x-auto">
                <table className="w-full border border-border rounded-lg">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Plan</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Requests/minute</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Requests/day</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border">
                      <td className="px-4 py-3 text-sm">Free</td>
                      <td className="px-4 py-3 text-sm">10</td>
                      <td className="px-4 py-3 text-sm">100</td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="px-4 py-3 text-sm">Pro</td>
                      <td className="px-4 py-3 text-sm">100</td>
                      <td className="px-4 py-3 text-sm">10,000</td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="px-4 py-3 text-sm">Advance</td>
                      <td className="px-4 py-3 text-sm">Unlimited</td>
                      <td className="px-4 py-3 text-sm">Unlimited</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Error Handling */}
            <section id="errors" className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Error Handling</h2>
              <p className="text-muted-foreground mb-4">
                The API returns standard HTTP status codes and JSON error responses:
              </p>
              
              <div className="not-prose bg-muted rounded-lg p-4 mb-4">
                <pre className="text-sm text-foreground">
{`{
  "error": {
    "code": "invalid_input",
    "message": "The 'text' field is required",
    "status": 400
  }
}`}
                </pre>
              </div>
              
              <div className="not-prose overflow-x-auto">
                <table className="w-full border border-border rounded-lg">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border">
                      <td className="px-4 py-3 text-sm font-mono">400</td>
                      <td className="px-4 py-3 text-sm">Bad Request - Invalid input</td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="px-4 py-3 text-sm font-mono">401</td>
                      <td className="px-4 py-3 text-sm">Unauthorized - Invalid API key</td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="px-4 py-3 text-sm font-mono">403</td>
                      <td className="px-4 py-3 text-sm">Forbidden - Insufficient permissions</td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="px-4 py-3 text-sm font-mono">429</td>
                      <td className="px-4 py-3 text-sm">Too Many Requests - Rate limit exceeded</td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="px-4 py-3 text-sm font-mono">500</td>
                      <td className="px-4 py-3 text-sm">Internal Server Error</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Text Tools */}
            <section id="text-tools" className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Text Tools</h2>
              
              <div className="not-prose space-y-6">
                {/* Uppercase */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-2 py-1 bg-success/20 text-success text-xs font-bold rounded">POST</span>
                    <code className="text-sm">/tools/text/uppercase</code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Convert text to uppercase
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">REQUEST</p>
                      <div className="bg-muted rounded-lg p-3">
                        <pre className="text-xs text-foreground">
{`{
  "text": "hello world"
}`}
                        </pre>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">RESPONSE</p>
                      <div className="bg-muted rounded-lg p-3">
                        <pre className="text-xs text-foreground">
{`{
  "result": "HELLO WORLD"
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Word Count */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-2 py-1 bg-success/20 text-success text-xs font-bold rounded">POST</span>
                    <code className="text-sm">/tools/text/word-count</code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Count words, characters, sentences, and paragraphs
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">REQUEST</p>
                      <div className="bg-muted rounded-lg p-3">
                        <pre className="text-xs text-foreground">
{`{
  "text": "Hello world. This is a test."
}`}
                        </pre>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">RESPONSE</p>
                      <div className="bg-muted rounded-lg p-3">
                        <pre className="text-xs text-foreground">
{`{
  "characters": 28,
  "words": 6,
  "sentences": 2,
  "paragraphs": 1,
  "reading_time_minutes": 0.03
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Converters */}
            <section id="converters" className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Converters</h2>
              
              <div className="not-prose space-y-6">
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-2 py-1 bg-success/20 text-success text-xs font-bold rounded">POST</span>
                    <code className="text-sm">/tools/convert/json-to-yaml</code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Convert JSON to YAML format
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">REQUEST</p>
                      <div className="bg-muted rounded-lg p-3">
                        <pre className="text-xs text-foreground">
{`{
  "data": "{\\"name\\": \\"John\\", \\"age\\": 30}"
}`}
                        </pre>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">RESPONSE</p>
                      <div className="bg-muted rounded-lg p-3">
                        <pre className="text-xs text-foreground">
{`{
  "result": "name: John\\nage: 30"
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SDKs */}
            <section id="sdk-js" className="mb-12">
              <h2 className="text-2xl font-bold mb-4">JavaScript SDK</h2>
              <p className="text-muted-foreground mb-4">
                Install the official JavaScript SDK:
              </p>
              
              <div className="not-prose bg-muted rounded-lg p-4 mb-4">
                <pre className="text-sm text-foreground">npm install @hsafx/tools</pre>
              </div>
              
              <div className="not-prose bg-muted rounded-lg p-4">
                <pre className="text-sm text-foreground">
{`import { HSAFXTools } from '@hsafx/tools';

const tools = new HSAFXTools('sk_your_api_key');

// Convert text to uppercase
const result = await tools.text.uppercase('hello world');
console.log(result); // HELLO WORLD

// Convert JSON to YAML
const yaml = await tools.convert.jsonToYaml({ name: 'John' });
console.log(yaml);`}
                </pre>
              </div>
            </section>

            <section id="sdk-python" className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Python SDK</h2>
              <p className="text-muted-foreground mb-4">
                Install the official Python SDK:
              </p>
              
              <div className="not-prose bg-muted rounded-lg p-4 mb-4">
                <pre className="text-sm text-foreground">pip install hsafx-tools</pre>
              </div>
              
              <div className="not-prose bg-muted rounded-lg p-4">
                <pre className="text-sm text-foreground">
{`from hsafx_tools import HSAFXTools

tools = HSAFXTools(api_key="sk_your_api_key")

# Convert text to uppercase
result = tools.text.uppercase("hello world")
print(result)  # HELLO WORLD

# Convert JSON to YAML
yaml = tools.convert.json_to_yaml({"name": "John"})
print(yaml)`}
                </pre>
              </div>
            </section>

            {/* Need Help */}
            <div className="not-prose p-6 bg-primary/10 border border-primary/30 rounded-lg">
              <h3 className="font-semibold mb-2">Need Help?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Check out our guides or contact support for assistance.
              </p>
              <div className="flex gap-4">
                <Link
                  href="/support"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Contact Support
                </Link>
                <Link
                  href="/docs"
                  className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                >
                  View Guides
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
