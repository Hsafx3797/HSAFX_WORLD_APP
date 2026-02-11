/**
 * Card Component
 * Container component for admin panel sections
 * Tailwind v4 compatible with CSS variable theming
 */

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-card text-card-foreground rounded-lg border border-border shadow-sm ${className}`}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function CardHeader({ title, description, action }: CardHeaderProps) {
  return (
    <div className="px-6 py-4 border-b border-border flex items-start justify-between">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function CardContent({ children, className = '', noPadding = false }: CardContentProps) {
  return (
    <div className={`${noPadding ? '' : 'p-6'} ${className}`}>
      {children}
    </div>
  );
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`px-6 py-4 border-t border-border bg-muted/50 rounded-b-lg ${className}`}>
      {children}
    </div>
  );
}

// Stat Card for dashboard metrics
interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: 'up' | 'down' | 'neutral';
  };
  icon?: ReactNode;
  loading?: boolean;
}

export function StatCard({ title, value, change, icon, loading }: StatCardProps) {
  const trendColors = {
    up: 'text-success',
    down: 'text-destructive',
    neutral: 'text-muted-foreground',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {loading ? (
              <div className="mt-2 h-8 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
            )}
            {change && !loading && (
              <p className={`mt-1 text-sm ${trendColors[change.trend]}`}>
                {trendIcons[change.trend]} {Math.abs(change.value)}%
                <span className="text-muted-foreground"> vs last period</span>
              </p>
            )}
          </div>
          {icon && (
            <div className="p-3 bg-primary/10 rounded-lg text-primary">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
