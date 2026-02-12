'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, ArrowUpRight, Crown } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  BillingCard — shows current plan, subscription status, actions    */
/* ------------------------------------------------------------------ */

interface BillingCardProps {
  planName: string;
  planSlug: 'free' | 'pro' | 'advance';
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'none';
  currentPeriodEnd?: string;
  coinBalance: number;
  onUpgrade?: () => void;
  onManage?: () => void;
  className?: string;
}

const planColors = {
  free: 'bg-secondary text-secondary-foreground',
  pro: 'bg-primary text-primary-foreground',
  advance: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
} as const;

const statusDisplay = {
  active: { label: 'Active', variant: 'success' as const },
  canceled: { label: 'Canceled', variant: 'destructive' as const },
  past_due: { label: 'Past Due', variant: 'warning' as const },
  trialing: { label: 'Trial', variant: 'info' as const },
  none: { label: 'Free', variant: 'secondary' as const },
} as const;

export function BillingCard({
  planName,
  planSlug,
  status,
  currentPeriodEnd,
  coinBalance,
  onUpgrade,
  onManage,
  className,
}: BillingCardProps) {
  const statusInfo = statusDisplay[status];

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" />
            Billing
          </CardTitle>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current plan badge */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              planColors[planSlug]
            )}
          >
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">{planName}</p>
            {currentPeriodEnd && (
              <p className="text-xs text-muted-foreground">
                {status === 'canceled' ? 'Access until' : 'Renews'}{' '}
                {new Date(currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Coin balance */}
        <div className="flex items-center justify-between rounded-md bg-muted p-3">
          <span className="text-sm text-muted-foreground">Coin Balance</span>
          <span className="text-lg font-bold">{coinBalance.toLocaleString()}</span>
        </div>
      </CardContent>

      <CardFooter className="gap-2">
        {planSlug === 'free' && onUpgrade && (
          <Button onClick={onUpgrade} className="flex-1">
            <ArrowUpRight className="mr-1 h-4 w-4" />
            Upgrade
          </Button>
        )}
        {planSlug !== 'free' && onManage && (
          <Button variant="outline" onClick={onManage} className="flex-1">
            Manage Subscription
          </Button>
        )}
        {planSlug !== 'free' && onUpgrade && planSlug !== 'advance' && (
          <Button variant="ghost" onClick={onUpgrade}>
            Upgrade
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  BillingCardSkeleton                                               */
/* ------------------------------------------------------------------ */

export function BillingCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-14" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <Skeleton className="h-12 w-full rounded-md" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  );
}
