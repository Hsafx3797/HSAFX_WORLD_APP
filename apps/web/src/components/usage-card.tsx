'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Coins, Zap, TrendingUp } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  UsageCard — displays monthly/daily usage metrics                  */
/* ------------------------------------------------------------------ */

interface UsageStat {
  label: string;
  value: number;
  max?: number;
  icon: React.ReactNode;
  format?: 'number' | 'coins';
}

interface UsageCardProps {
  monthlyExecutions: number;
  monthlyCoinsSpent: number;
  currentBalance: number;
  executionLimit?: number;
  className?: string;
}

export function UsageCard({
  monthlyExecutions,
  monthlyCoinsSpent,
  currentBalance,
  executionLimit,
  className,
}: UsageCardProps) {
  const stats: UsageStat[] = [
    {
      label: 'Executions this month',
      value: monthlyExecutions,
      max: executionLimit,
      icon: <Zap className="h-4 w-4 text-primary" />,
    },
    {
      label: 'Coins spent this month',
      value: monthlyCoinsSpent,
      icon: <TrendingUp className="h-4 w-4 text-warning" />,
      format: 'coins',
    },
    {
      label: 'Current balance',
      value: currentBalance,
      icon: <Coins className="h-4 w-4 text-success" />,
      format: 'coins',
    },
  ];

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          Usage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.map((stat) => (
          <div key={stat.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                {stat.icon}
                {stat.label}
              </span>
              <span className="font-medium">
                {formatValue(stat.value, stat.format)}
                {stat.max != null && (
                  <span className="text-muted-foreground"> / {formatValue(stat.max)}</span>
                )}
              </span>
            </div>
            {stat.max != null && (
              <Progress
                value={stat.value}
                max={stat.max}
                variant={stat.value >= stat.max * 0.9 ? 'warning' : 'default'}
              />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function formatValue(value: number, format?: 'number' | 'coins') {
  if (format === 'coins') {
    return value.toLocaleString();
  }
  return value.toLocaleString();
}

/* ------------------------------------------------------------------ */
/*  UsageCardSkeleton                                                 */
/* ------------------------------------------------------------------ */

export function UsageCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-16" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-12" />
            </div>
            {i === 0 && <Skeleton className="h-2 w-full" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
