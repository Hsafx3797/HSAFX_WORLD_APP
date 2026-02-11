'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { toolRegistry } from '@/lib/tools/registry';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Category display names and emojis
const categoryDisplay: Record<string, { name: string; emoji: string }> = {
  text: { name: 'Text Tools', emoji: '✏️' },
  data: { name: 'Data Converters', emoji: '🔄' },
  media: { name: 'Media', emoji: '🎬' },
  generator: { name: 'Generators', emoji: '⚡' },
  calculator: { name: 'Calculators', emoji: '🔢' },
  converter: { name: 'Unit Converters', emoji: '📐' },
  specialized: { name: 'Specialized', emoji: '🎯' },
};

// Tier display
const tierDisplay: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  free: { label: 'Free', variant: 'outline' },
  pro: { label: 'Pro', variant: 'secondary' },
  advance: { label: 'Advance', variant: 'default' },
};

// Items per page
const ITEMS_PER_PAGE = 48;

export default function AllToolsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Get unique categories from registry
  const categories = useMemo(() => {
    const cats = new Set(toolRegistry.map(t => t.category.toLowerCase()));
    return Array.from(cats).sort();
  }, []);

  // Filter tools based on search and filters
  const filteredTools = useMemo(() => {
    return toolRegistry.filter(tool => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        tool.name.toLowerCase().includes(searchLower) ||
        tool.description.toLowerCase().includes(searchLower) ||
        tool.id.toLowerCase().includes(searchLower);

      // Category filter
      const matchesCategory = selectedCategory === 'all' || 
        tool.category.toLowerCase() === selectedCategory;

      // Tier filter
      const matchesTier = selectedTier === 'all' || 
        tool.tier === selectedTier;

      return matchesSearch && matchesCategory && matchesTier;
    });
  }, [searchQuery, selectedCategory, selectedTier]);

  // Pagination
  const totalPages = Math.ceil(filteredTools.length / ITEMS_PER_PAGE);
  const paginatedTools = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTools.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTools, currentPage]);

  // Reset page when filters change
  const handleFilterChange = (type: 'category' | 'tier' | 'search', value: string) => {
    setCurrentPage(1);
    if (type === 'category') setSelectedCategory(value);
    else if (type === 'tier') setSelectedTier(value);
    else setSearchQuery(value);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-12 border-b border-border/50 bg-linear-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Tools
            </Link>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              All {toolRegistry.length} Tools
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Browse and search through our complete collection of professional tools
            </p>

            {/* Search */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, description, or ID..."
                  value={searchQuery}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full px-6 py-4 bg-muted/50 border border-border rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
                <svg
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {categoryDisplay[cat]?.emoji || '📦'} {categoryDisplay[cat]?.name || cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Tier Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Tier:</span>
              <select
                value={selectedTier}
                onChange={(e) => handleFilterChange('tier', e.target.value)}
                className="px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="all">All Tiers</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="advance">Advance</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="ml-auto text-sm text-muted-foreground">
              Showing {paginatedTools.length} of {filteredTools.length} tools
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {paginatedTools.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">No tools found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or filters
              </p>
              <Button variant="outline" onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedTier('all');
              }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedTools.map((tool) => {
                  const catLower = tool.category.toLowerCase();
                  const catInfo = categoryDisplay[catLower];
                  const tierInfo = tierDisplay[tool.tier];

                  return (
                    <Link
                      key={tool.id}
                      href={`/tools/${tool.id}`}
                      className="group p-4 bg-card border border-border rounded-lg hover:border-primary/50 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{catInfo?.emoji || '📦'}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium group-hover:text-primary transition-colors line-clamp-1">
                            {tool.name}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {tool.description}
                          </p>
                          <div className="flex items-center flex-wrap gap-2 mt-3">
                            <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                              {catInfo?.name || tool.category}
                            </span>
                            {tool.tier !== 'free' && (
                              <Badge variant={tierInfo?.variant || 'default'}>
                                {tierInfo?.label || tool.tier}
                              </Badge>
                            )}
                            {tool.isNew && (
                              <Badge variant="success" className="text-xs">New</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    ← Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    Next →
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
