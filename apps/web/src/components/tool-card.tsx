'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import Link from 'next/link';

interface ToolCardProps {
  id: string;
  name: string;
  description: string;
  slug: string;
  category: string;
  tier: 'free' | 'pro' | 'advance';
  icon?: React.ReactNode;
  popular?: boolean;
  isNew?: boolean;
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
  className,
}: ToolCardProps) {
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
            <div className="flex gap-1">
              {isNew && <Badge variant="success">New</Badge>}
              {popular && <Badge variant="warning">Popular</Badge>}
              {tier === 'pro' && <Badge variant="secondary">Pro</Badge>}
              {tier === 'advance' && <Badge variant="info">Advance</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="line-clamp-2">{description}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
}

interface ToolGridProps {
  children: React.ReactNode;
  className?: string;
}

export function ToolGrid({ children, className }: ToolGridProps) {
  return (
    <div
      className={cn(
        'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className
      )}
    >
      {children}
    </div>
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
