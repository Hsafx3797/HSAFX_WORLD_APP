import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getToolById, getToolBySlug } from '@/lib/tools/registry';
import { TextToolLayout, TextToolInput, TextToolOutput } from '@/components/text-tool-layout';
import { FileUpload } from '@/components/file-upload';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ToolExecutor } from './tool-executor';
import { ToolPageContent } from './tool-page-content';

// Tools that should have individual pages (not redirected)
const INDIVIDUAL_PAGE_TOOLS = new Set([
  'text-converter',           // Unified text converter
  'db-schema-visualizer',     // Interactive diagram
  'file-tree-generator',      // Directory tree visualization
  'cheque-generator',         // Full cheque preview
  'container-vessel-tracker', // Live container/vessel tracking with maps
]);

// Category to redirect URL mapping
const CATEGORY_REDIRECTS: Record<string, string> = {
  'text': '/tools/text-converter',
  'data': '/tools/category/converters',
  'media': '/tools/category/media',
  'generator': '/tools/category/generators',
  'calculator': '/tools/category/calculators',
  'converter': '/tools/category/unit-converters',
};

interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  
  if (!tool) {
    return { title: 'Tool Not Found' };
  }
  
  return {
    title: tool.name,
    description: tool.description,
    openGraph: {
      title: `${tool.name} | HSAFX Tools`,
      description: tool.description,
    },
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  
  if (!tool) {
    notFound();
  }
  
  // Check if this tool should be redirected to a category page
  if (!INDIVIDUAL_PAGE_TOOLS.has(slug)) {
    const categoryKey = tool.category.toLowerCase();
    const redirectUrl = CATEGORY_REDIRECTS[categoryKey];
    
    if (redirectUrl) {
      redirect(redirectUrl);
    }
  }

  const isTextTool = tool.category === 'Text' || tool.category === 'Data';
  const isFileTool = tool.execution === 'server' || tool.category === 'Media';

  return (
    <div className="container py-8">
      {/* Tool Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">{tool.name}</h1>
              {tool.tier === 'pro' && <Badge variant="secondary">Pro</Badge>}
              {tool.tier === 'advance' && <Badge variant="info">Advance</Badge>}
              {tool.isNew && <Badge variant="success">New</Badge>}
              {tool.popular && <Badge variant="warning">Popular</Badge>}
            </div>
            <p className="text-muted-foreground max-w-2xl">{tool.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              Save
            </Button>
            <Button variant="outline" size="sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
              Share
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Category: <Badge variant="outline">{tool.category}</Badge></span>
          {tool.execution === 'client' && (
            <Badge variant="secondary" className="gap-1">
              <span>⚡</span> Processed locally
            </Badge>
          )}
          {tool.execution === 'server' && (
            <Badge variant="secondary" className="gap-1">
              <span>🔒</span> Encrypted server
            </Badge>
          )}
          {tool.execution === 'hybrid' && (
            <Badge variant="secondary" className="gap-1">
              <span>⚡🔒</span> Hybrid
            </Badge>
          )}
          {tool.costType === 'coin' && tool.coinCost && (
            <span>Cost: <Badge variant="outline">{tool.coinCost} coins</Badge></span>
          )}
        </div>
      </div>

      {/* Tool Interface with Trial Banner */}
      <ToolPageContent tool={tool} />

      {/* Related Tools */} 
      {/* Todo remaining make this dynamic */}
      {/* Placeholder for related tools */}
      {/* <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Related Tools</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">JSON Formatter</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="line-clamp-2">Format and beautify JSON data</CardDescription>
            </CardContent>
          </Card>
        </div>
      </div> */}

      {/* SEO Content */}
      {/* <div className="mt-12 prose prose-sm max-w-none">
        <h2>About {tool.name}</h2>
        <p>
          {tool.name} is a free online tool that helps developers and users with their daily tasks.
          This tool runs entirely in your browser, ensuring your data stays private and secure.
        </p>
        <h3>Features</h3>
        <ul>
          <li>Fast and efficient processing</li>
          <li>No data uploaded to servers</li>
          <li>Works offline once loaded</li>
          <li>Free to use with no limits</li>
        </ul>
        <h3>How to Use</h3>
        <ol>
          <li>Enter or paste your input in the text area</li>
          <li>The tool will automatically process your input</li>
          <li>Copy the output or download as a file</li>
        </ol>
      </div> */}
    </div>
  );
}
