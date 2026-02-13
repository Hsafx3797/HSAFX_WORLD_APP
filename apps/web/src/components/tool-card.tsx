'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import Link from 'next/link';

export interface ToolCardProps {
  id: string;
  name: string;
  description: string;
  slug: string;
  category: string;
  tier: 'free' | 'pro' | 'advance';
  icon?: React.ReactNode;
  popular?: boolean;
  isNew?: boolean;
  isFavorite?: boolean;
  executionCount?: number;
  onFavoriteToggle?: (id: string) => void;
  className?: string;
}

export function ToolCard({
  id,
  name,
  description,
  slug,
  category,
  tier,
  icon,
  popular,
  isNew,
  isFavorite,
  executionCount,
  onFavoriteToggle,
  className,
}: ToolCardProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFavoriteToggle?.(id);
  };

  return (
    <Link href={`/tools/${slug}`}>
      <Card
        className={cn(
          'group cursor-pointer transition-all hover:shadow-md hover:border-primary/50',
          className
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {icon}
                </div>
              )}
              <div>
                <CardTitle className="text-base group-hover:text-primary transition-colors">
                  {name}
                </CardTitle>
                <span className="text-xs text-muted-foreground">{category}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {onFavoriteToggle && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleFavoriteClick}
                  aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill={isFavorite ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={cn(
                      'h-4 w-4 transition-colors',
                      isFavorite ? 'text-red-500' : 'text-muted-foreground'
                    )}
                  >
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                </Button>
              )}
              {isNew && <Badge variant="success">New</Badge>}
              {popular && <Badge variant="warning">Popular</Badge>}
              {tier === 'pro' && <Badge variant="secondary">Pro</Badge>}
              {tier === 'advance' && <Badge variant="info">Advance</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <CardDescription className="line-clamp-2">{description}</CardDescription>
            {executionCount != null && executionCount > 0 && (
              <span className="ml-2 shrink-0 text-xs text-muted-foreground tabular-nums">
                {executionCount.toLocaleString()} uses
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

interface ToolGridProps {
  children?: React.ReactNode;
  tools?: ToolCardProps[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  className?: string;
}

export function ToolGrid({ children, tools, isLoading, emptyState, className }: ToolGridProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
          className
        )}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <ToolCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (tools && tools.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div
      className={cn(
        'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className
      )}
    >
      {tools
        ? tools.map((tool) => <ToolCard key={tool.id} {...tool} />)
        : children}
    </div>
  );
}

function ToolCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-3 w-16 rounded bg-muted" />
            </div>
          </div>
          <div className="h-5 w-12 rounded-full bg-muted" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-muted" />
          <div className="h-3 w-3/4 rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

interface CategorySectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  count?: number;
  children: React.ReactNode;
  className?: string;
}

export function CategorySection({
  title,
  description,
  icon,
  count,
  children,
  className,
}: CategorySectionProps) {
  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            {title}
            {count !== undefined && (
              <Badge variant="secondary" className="text-xs">
                {count} tools
              </Badge>
            )}
          </h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}
