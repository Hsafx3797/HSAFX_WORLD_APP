'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function B2bUsagePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { data: sub } = trpc.b2b.getMySubscription.useQuery(undefined, { enabled: !!user });
  const { data: usage, isLoading: usageLoading } = trpc.b2b.getMyUsage.useQuery(undefined, { enabled: !!user });

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="container py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">API Usage</h1>
          <p className="text-muted-foreground mt-1">Detailed analytics for your API subscription</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">No API Subscription</h3>
            <p className="text-muted-foreground mb-4">Subscribe to a B2B API plan to view usage analytics.</p>
            <Button asChild><Link href="/pricing">View Plans</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Period countdown
  const periodEnd = usage?.periodEnd ? new Date(usage.periodEnd) : (sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null);
  const daysUntilReset = periodEnd ? Math.max(0, Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;

  // Totals
  const totalUsed = usage?.usage.reduce((sum, u) => sum + u.usageCount, 0) ?? 0;
  const totalLimit = usage?.usage.reduce((sum, u) => sum + u.monthlyLimit, 0) ?? 0;
  const overallPct = totalLimit > 0 ? Math.min((totalUsed / totalLimit) * 100, 100) : 0;

  // Find top suite by usage percentage
  const sortedByUsage = [...(usage?.usage ?? [])].sort((a, b) => {
    const pctA = a.monthlyLimit > 0 ? a.usageCount / a.monthlyLimit : 0;
    const pctB = b.monthlyLimit > 0 ? b.usageCount / b.monthlyLimit : 0;
    return pctB - pctA;
  });

  return (
    <div className="container py-8 max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Usage Analytics</h1>
          <p className="text-muted-foreground mt-1">
            {sub.planName} plan — {sub.billingCycle} billing
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/api">← Back to Dashboard</Link>
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Operations</p>
            <p className="text-3xl font-bold">{totalUsed.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">of {totalLimit.toLocaleString()} total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Overall Utilization</p>
            <p className="text-3xl font-bold">{overallPct.toFixed(1)}%</p>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full ${overallPct >= 80 ? 'bg-destructive' : 'bg-primary'}`}
                style={{ width: `${overallPct}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Reset In</p>
            <p className="text-3xl font-bold">{daysUntilReset !== null ? `${daysUntilReset}d` : '—'}</p>
            <p className="text-xs text-muted-foreground">
              {periodEnd ? periodEnd.toLocaleDateString() : 'Unknown'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Per-Suite Usage Gauges */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Per-Suite Usage</CardTitle>
          <CardDescription>Operations used vs monthly quota per suite</CardDescription>
        </CardHeader>
        <CardContent>
          {usageLoading ? (
            <div className="space-y-4">
              {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
            </div>
          ) : !usage || usage.usage.length === 0 ? (
            <p className="text-sm text-muted-foreground">No usage data for this period yet.</p>
          ) : (
            <div className="space-y-5">
              {sortedByUsage.map((u) => {
                const pct = u.monthlyLimit > 0 ? Math.min((u.usageCount / u.monthlyLimit) * 100, 100) : 0;
                const remaining = Math.max(0, u.monthlyLimit - u.usageCount);
                const isOver = u.usageCount > u.monthlyLimit;
                const isHigh = pct >= 80;

                return (
                  <div key={u.suiteId}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium capitalize">{u.suiteName}</span>
                        {isOver && <Badge variant="destructive" className="text-xs">Over quota</Badge>}
                        {!isOver && isHigh && <Badge variant="outline" className="text-xs">High usage</Badge>}
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-mono">
                          {u.usageCount.toLocaleString()} / {u.monthlyLimit.toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({remaining.toLocaleString()} remaining)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${isOver ? 'bg-destructive' : isHigh ? 'bg-yellow-500' : 'bg-primary'}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{pct.toFixed(1)}% used</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-1">Need More Capacity?</h3>
            <p className="text-sm text-muted-foreground mb-3">Upgrade to a higher plan for increased quotas.</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/pricing">Upgrade Plan</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-1">API Keys</h3>
            <p className="text-sm text-muted-foreground mb-3">Manage your API access credentials.</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/api-keys">Manage Keys</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
