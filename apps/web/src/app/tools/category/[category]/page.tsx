import { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { toolRegistry } from '@/lib/tools/registry';
import CategoryContent from './category-content';
import { categoryConfig } from './category-config';

type Props = {
  params: Promise<{ category: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const config = categoryConfig[category];
  
  if (!config) {
    return {
      title: 'Category Not Found - HSAFX World',
    };
  }
  
  return {
    title: `${config.name} - HSAFX World`,
    description: config.longDescription,
    keywords: [config.name, 'tools', 'online', 'free', category],
  };
}

export async function generateStaticParams() {
  return Object.keys(categoryConfig).map((category) => ({
    category,
  }));
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  
  // Redirect text category to unified text converter page
  if (category === 'text') {
    redirect('/tools/text-converter');
  }
  
  const config = categoryConfig[category];
  
  if (!config) {
    notFound();
  }
  
  // Get tools for this category using the registryCategory mapping
  const allTools = toolRegistry;
  const categoryTools = allTools.filter(
    (tool) => tool.category.toLowerCase() === config.registryCategory
  );
  
  // Group by subcategory if available
  const groupedTools: Record<string, typeof categoryTools> = {};
  for (const tool of categoryTools) {
    const group = tool.subcategory || 'General';
    if (!groupedTools[group]) {
      groupedTools[group] = [];
    }
    groupedTools[group]!.push(tool);
  }
  
  const sortedGroups = Object.keys(groupedTools).sort();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-12 md:py-16 border-b border-border/50 bg-linear-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to all tools
            </Link>
            
            <div className="flex items-center gap-4 mb-4">
              <span className="text-5xl">{config.emoji}</span>
              <h1 className="text-4xl md:text-5xl font-bold">{config.name}</h1>
            </div>
            
            <p className="text-lg text-muted-foreground mb-4">
              {config.longDescription}
            </p>
            
            <div className="flex items-center gap-4 text-sm">
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">
                {categoryTools.length} tools
              </span>
              <span className="text-muted-foreground">
                {sortedGroups.length} subcategories
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Content - uses CategoryContent client component */}
      <CategoryContent 
        category={category}
        config={config}
        groupedTools={groupedTools}
        sortedGroups={sortedGroups}
      />

      {/* Related Categories */}
      <section className="py-12 bg-muted/30 border-t border-border/50">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-semibold mb-6">Other Categories</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {Object.entries(categoryConfig)
              .filter(([key]) => key !== category)
              .slice(0, 6)
              .map(([key, value]) => (
                <Link
                  key={key}
                  href={`/tools/category/${key}`}
                  className="group p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-all text-center"
                >
                  <div className="text-3xl mb-2">{value.emoji}</div>
                  <div className="font-medium text-sm group-hover:text-primary transition-colors">
                    {value.name}
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}
