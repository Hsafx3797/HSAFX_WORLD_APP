'use client';

import * as React from 'react';
import Link from 'next/link';
import type { ToolMetadata } from '@/lib/tools/types';

// Category type definition
interface Category {
  id: string;
  registryCategory: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
  href?: string;
}

interface ToolsPageClientProps {
  categories: Category[];
  toolsByRegistryCategory: Record<string, ToolMetadata[]>;
  allTools: ToolMetadata[];
  totalTools: number;
}

export default function ToolsPageClient({
  categories,
  toolsByRegistryCategory,
  allTools,
  totalTools,
}: ToolsPageClientProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filteredTools, setFilteredTools] = React.useState<ToolMetadata[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  // Debounce search
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTools([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      const query = searchQuery.toLowerCase();
      const results = allTools.filter(tool =>
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.id.toLowerCase().includes(query) ||
        tool.category.toLowerCase().includes(query)
      );
      setFilteredTools(results);
    }, 150);

    return () => clearTimeout(timer);
  }, [searchQuery, allTools]);

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or / to focus search
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && document.activeElement?.tagName !== 'INPUT')) {
        e.preventDefault();
        document.getElementById('tools-search')?.focus();
      }
      // Escape to clear search
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-12 md:py-16 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              All Tools
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-6">
              Browse our collection of <span className="text-primary font-semibold">{totalTools}+</span> professional tools across {categories.length} categories
            </p>
            
            {/* Search Box - Now functional */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <input
                  id="tools-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tools... (Ctrl+K)"
                  className="w-full px-6 py-4 bg-muted/50 border border-border rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="p-1 hover:bg-muted rounded"
                      aria-label="Clear search"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  )}
                  <svg
                    className="w-6 h-6 text-muted-foreground"
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
              
              {/* Search results count */}
              {isSearching && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'} found
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Search Results */}
      {isSearching && filteredTools.length > 0 && (
        <section className="py-8 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-xl font-bold mb-6">Search Results</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTools.map((tool) => (
                <Link
                  key={tool.id}
                  href={`/tools/${tool.id}`}
                  className="group p-4 bg-card border border-border rounded-lg hover:border-primary/50 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium group-hover:text-primary transition-colors truncate">
                        {tool.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {tool.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                          {tool.category}
                        </span>
                        {tool.tier !== 'free' && (
                          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                            {tool.tier}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* No results message */}
      {isSearching && filteredTools.length === 0 && searchQuery.trim() && (
        <section className="py-12">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-md mx-auto">
              <p className="text-lg text-muted-foreground mb-4">
                No tools found for &quot;{searchQuery}&quot;
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-primary hover:underline"
              >
                Clear search
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Categories Grid - Hidden when searching */}
      {!isSearching && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">Browse by Category</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categories.map((category) => {
                const categoryTools = toolsByRegistryCategory[category.registryCategory] || [];
                const toolCount = categoryTools.length;
                const href = 'href' in category && category.href ? category.href : `/tools/category/${category.id}`;
                
                return (
                  <Link
                    key={category.id}
                    href={href}
                    className={`group p-6 rounded-xl border bg-gradient-to-br ${category.color} hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
                  >
                    <div className="text-4xl mb-3">{category.emoji}</div>
                    <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {category.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-primary">
                        {toolCount} tools
                      </span>
                      <svg
                        className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Popular Tools - Hidden when searching */}
      {!isSearching && (
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">Popular Tools</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {allTools.slice(0, 12).map((tool) => (
                <Link
                  key={tool.id}
                  href={`/tools/${tool.id}`}
                  className="group p-4 bg-card border border-border rounded-lg hover:border-primary/50 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium group-hover:text-primary transition-colors truncate">
                        {tool.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {tool.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                          {tool.category}
                        </span>
                        {tool.tier !== 'free' && (
                          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                            {tool.tier}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <Link
                href="#all-tools"
                className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
              >
                View all tools
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* All Tools List - Hidden when searching */}
      {!isSearching && (
        <section id="all-tools" className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">All {totalTools} Tools</h2>
            
            {categories.map((category) => {
              const categoryTools = toolsByRegistryCategory[category.registryCategory] || [];
              if (categoryTools.length === 0) return null;
              
              return (
                <div key={category.id} className="mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-2xl">{category.emoji}</span>
                    <h3 className="text-xl font-semibold">{category.name}</h3>
                    <span className="text-sm text-muted-foreground">
                      ({categoryTools.length} tools)
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {categoryTools.map((tool) => (
                      <Link
                        key={tool.id}
                        href={`/tools/${tool.id}`}
                        className="group flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:border-primary/50 hover:bg-muted/50 transition-all"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="font-medium group-hover:text-primary transition-colors block truncate">
                            {tool.name}
                          </span>
                          {tool.tier !== 'free' && (
                            <span className="text-xs text-primary">{tool.tier}</span>
                          )}
                        </div>
                        <svg
                          className="w-4 h-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-t border-border/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Can&apos;t find what you need?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            We&apos;re constantly adding new tools. Let us know what you&apos;d like to see!
          </p>
          <Link
            href="/feedback"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Request a Tool
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
