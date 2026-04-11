'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, CheckCircle2, XCircle, Clock, Zap } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  ActivityFeed — recent tool execution history                      */
/* ------------------------------------------------------------------ */

export interface ActivityItem {
  id: string;
  toolId: string;
  toolName: string;
  status: 'completed' | 'failed' | 'running';
  coinsCharged: number;
  duration?: number;
  timestamp: string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
  loading?: boolean;
  maxItems?: number;
  className?: string;
}

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    color: 'text-success',
    bg: 'bg-success/10',
    label: 'Done',
  },
  failed: {
    icon: XCircle,
    color: 'text-destructive',
    bg: 'bg-destructive/10',
    label: 'Failed',
  },
  running: {
    icon: Clock,
    color: 'text-info',
    bg: 'bg-info/10',
    label: 'Running',
  },
} as const;

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function ActivityFeed({ items, loading, maxItems = 10, className }: ActivityFeedProps) {
  if (loading) return <ActivityFeedSkeleton className={className} />;

  const visible = items.slice(0, maxItems);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {visible.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No recent activity
          </p>
        ) : (
          <div className="relative space-y-0">
            {/* Timeline line */}
            <div className="absolute left-3.75 top-2 bottom-2 w-px bg-border" />

            {visible.map((item, i) => {
              const cfg = statusConfig[item.status];
              const StatusIcon = cfg.icon;
              return (
                <div
                  key={item.id}
                  className="relative flex gap-3 py-2 pl-0"
                >
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      cfg.bg
                    )}
                  >
                    <StatusIcon className={cn('h-4 w-4', cfg.color)} />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {item.toolName}
                      </p>
                      {item.coinsCharged > 0 && (
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          <Zap className="mr-0.5 h-3 w-3" />
                          {item.coinsCharged}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{timeAgo(item.timestamp)}</span>
                      {item.duration != null && (
                        <>
                          <span>·</span>
                          <span>{formatDuration(item.duration)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  ActivityFeedSkeleton                                              */
/* ------------------------------------------------------------------ */

export function ActivityFeedSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
