import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SearchBar } from '@/components/search';
import { toolRegistry } from '@/lib/tools/registry';

// Category configuration - maps UI categories to registry categories
const categoryConfig = [
  {
    id: 'text',
    registryCategory: 'text', // Matches tool.category.toLowerCase() === 'text'
    name: 'Text Tools',
    description: 'Transform, encode, and manipulate text',
    icon: '✏️',
    color: 'bg-primary/10 text-primary',
    url: '/tools/text-converter',
  },
  {
    id: 'converters',
    registryCategory: 'data', // Data tools (converters, validators, formatters)
    name: 'Data Converters',
    description: 'Convert between JSON, XML, YAML, CSV',
    icon: '🔄',
    color: 'bg-success/10 text-success',
    url: '/tools/category/converters',
  },
  {
    id: 'media',
    registryCategory: 'media', // Media processing tools
    name: 'Media Tools',
    description: 'Process images, videos, audio, PDFs',
    icon: '🎬',
    color: 'bg-chart-4/10 text-chart-4',
    url: '/tools/category/media',
  },
  {
    id: 'generators',
    registryCategory: 'generator', // UUID, password, QR, etc.
    name: 'Generators',
    description: 'Create UUIDs, passwords, QR codes',
    icon: '⚡',
    color: 'bg-chart-3/10 text-chart-3',
    url: '/tools/category/generators',
  },
  {
    id: 'calculators',
    registryCategory: 'calculator', // Calculators
    name: 'Calculators',
    description: 'Math, finance, and utility calculators',
    icon: '🔢',
    color: 'bg-chart-1/10 text-chart-1',
    url: '/tools/category/calculators',
  },
  {
    id: 'unit-converters',
    registryCategory: 'converter', // Unit converters
    name: 'Unit Converters',
    description: 'Length, weight, temperature, and more',
    icon: '📐',
    color: 'bg-chart-2/10 text-chart-2',
    url: '/tools/category/unit-converters',
  },
  {
    id: 'specialized',
    registryCategory: 'specialized', // Specialized tools
    name: 'Specialized',
    description: 'Islamic calculators, cheques, and more',
    icon: '🎯',
    color: 'bg-warning/10 text-warning',
    url: '/tools/category/specialized',
  },
];

// Dynamically calculate category counts from registry
function getCategoriesWithCounts() {
  return categoryConfig.map(cat => {
    const count = toolRegistry.filter(
      tool => tool.category.toLowerCase() === cat.registryCategory
    ).length;
    return {
      ...cat,
      count,
      href: `${cat.url}`,
    };
  }).filter(cat => cat.count > 0); // Only show categories with tools
}

// Get popular tools from registry
function getPopularTools() {
  return toolRegistry
    .filter(tool => tool.popular)
    .slice(0, 8)
    .map(tool => ({
      name: tool.name,
      slug: tool.id,
      category: tool.category,
    }));
}

export default function HomePage() {
  const categories = getCategoriesWithCounts();
  const popularTools = getPopularTools();
  const totalTools = toolRegistry.length;

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-linear-to-b from-primary/5 to-background">
        <div className="container text-center">
          <Badge variant="secondary" className="mb-4">
            ✨ {totalTools}+ Free Tools Available
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-6">
            Developer Tools for{' '}
            <span className="text-primary">Every Need</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Free online tools for text transformation, data conversion, image processing,
            code generation, and more. Fast, secure, and privacy-focused.
          </p>
          
          <div className="max-w-xl mx-auto mb-8">
            <SearchBar
              placeholder={`Search ${totalTools} tools...`}
              suggestions={popularTools.map(t => t.name)}
              className="w-full"
            />
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/tools">Browse All Tools</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/api-docs">API Access</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Tool Categories</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Browse tools by category or use the search to find exactly what you need.
            </p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link key={category.id} href={category.href}>
                <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`text-3xl p-2 rounded-lg ${category.color}`}>
                        {category.icon}
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {category.name}
                          <Badge variant="secondary" className="text-xs">
                            {category.count}
                          </Badge>
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{category.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Button variant="outline" asChild>
              <Link href="/tools">View All Categories →</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Popular Tools Section */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Popular Tools</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Most used tools by our community. Quick access to everyday developer utilities.
            </p>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {popularTools.map((tool) => (
              <Link key={tool.slug} href={`/tools/${tool.slug}`}>
                <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{tool.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline">{tool.category}</Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Button variant="outline" asChild>
              <Link href="/tools/all">View All {totalTools} Tools →</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Our Tools?</h2>
          </div>
          
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-center">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Client-side processing with WebAssembly for instant results.
                No waiting for server responses.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2">Privacy First</h3>
              <p className="text-muted-foreground">
                Your data never leaves your browser. All processing happens locally.
                No data collection.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">💎</div>
              <h3 className="text-xl font-semibold mb-2">Free Forever</h3>
              <p className="text-muted-foreground">
                All basic tools are free with no limits. Premium features for power users.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🔌</div>
              <h3 className="text-xl font-semibold mb-2">API Access</h3>
              <p className="text-muted-foreground">
                Integrate our tools into your workflow with our REST API.
                Available for all tiers.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-2">Mobile Friendly</h3>
              <p className="text-muted-foreground">
                Responsive design works perfectly on any device.
                Use tools on the go.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold mb-2">Beautiful UI</h3>
              <p className="text-muted-foreground">
                Clean, modern interface with dark mode support.
                Customizable themes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Join thousands of developers using our tools every day.
            Create a free account to save your preferences and unlock premium features.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register">Create Free Account</Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
