'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useSubscription } from '@/hooks/use-subscription';
import { trpc } from '@/lib/trpc';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const TIME_RANGES = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
] as const;

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { isPro } = useSubscription();
  const [days, setDays] = useState(30);

  const analyticsQuery = trpc.tools.getAnalytics.useQuery(
    { days },
    { enabled: !!user && isPro }
  );

  const { data: b2bUsage } = trpc.b2b.getMyUsage.useQuery(undefined, { enabled: !!user });

  if (authLoading) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  if (!isPro) {
    return (
      <div className="container py-8">
        <div className="text-center py-16">
          <h1 className="text-3xl font-bold mb-4">Usage Analytics</h1>
          <p className="text-muted-foreground mb-6">
            Detailed analytics are available for Pro and Advance subscribers.
          </p>
          <Link href="/pricing">
            <Button size="lg">Upgrade to Pro</Button>
          </Link>
        </div>
      </div>
    );
  }

  const data = analyticsQuery.data;

  // Aggregate error rate
  const totalExecs = data?.errorRate?.reduce((s, r) => s + r.total, 0) ?? 0;
  const totalFailed = data?.errorRate?.reduce((s, r) => s + r.failed, 0) ?? 0;
  const overallErrorRate = totalExecs > 0 ? ((totalFailed / totalExecs) * 100).toFixed(1) : '0.0';

  return (
    <div className="container py-8">
      {/* Header + Time Range Selector */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Usage Analytics</h1>
          <p className="text-muted-foreground mt-1">Your tool usage and coin activity over time</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {TIME_RANGES.map((r) => (
            <Button
              key={r.days}
              variant={days === r.days ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDays(r.days)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      {analyticsQuery.isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader><div className="h-5 bg-muted rounded w-1/3" /></CardHeader>
              <CardContent><div className="h-48 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 sm:grid-cols-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Executions</p>
                <p className="text-3xl font-bold">{totalExecs.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <p className="text-3xl font-bold">{data?.responseStats?.avg ?? 0}ms</p>
                <p className="text-xs text-muted-foreground">p95: {data?.responseStats?.p95 ?? 0}ms</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Error Rate</p>
                <p className="text-3xl font-bold">{overallErrorRate}%</p>
                <p className="text-xs text-muted-foreground">{totalFailed} failed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Peak Hour</p>
                <p className="text-3xl font-bold">
                  {data?.peakHours && data.peakHours.length > 0
                    ? `${data.peakHours.reduce((max, h) => h.count > max!.count ? h : max!, data.peakHours[0]!).hour}:00`
                    : '—'}
                </p>
                <p className="text-xs text-muted-foreground">Most active hour</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Executions per Day */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Executions per Day</CardTitle>
                <CardDescription>Tool usage over the last {days} days</CardDescription>
              </CardHeader>
              <CardContent>
                {data?.executionsPerDay && data.executionsPerDay.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-end gap-1 h-48">
                      {data.executionsPerDay.map((day) => {
                        const maxCount = Math.max(...data.executionsPerDay.map((d) => d.count), 1);
                        const height = Math.max((day.count / maxCount) * 100, 4);
                        return (
                          <div
                            key={day.date}
                            className="flex-1 bg-primary/80 rounded-t hover:bg-primary transition-colors"
                            style={{ height: `${height}%` }}
                            title={`${day.date}: ${day.count} executions`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{data.executionsPerDay[0]?.date}</span>
                      <span>{data.executionsPerDay[data.executionsPerDay.length - 1]?.date}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-12">
                    No executions yet. Start using tools to see your analytics!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
                <CardDescription>Which tool categories you use most</CardDescription>
              </CardHeader>
              <CardContent>
                {data?.categoryBreakdown && data.categoryBreakdown.length > 0 ? (
                  <div className="space-y-3">
                    {data.categoryBreakdown.map((cat) => {
                      const maxCount = Math.max(...data.categoryBreakdown.map((c) => c.count), 1);
                      const width = (cat.count / maxCount) * 100;
                      return (
                        <div key={cat.name}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">{cat.name}</span>
                            <span className="text-muted-foreground">{cat.count}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No data yet</p>
                )}
              </CardContent>
            </Card>

            {/* Top Tools */}
            <Card>
              <CardHeader>
                <CardTitle>Top Tools</CardTitle>
                <CardDescription>Your most frequently used tools</CardDescription>
              </CardHeader>
              <CardContent>
                {data?.topTools && data.topTools.length > 0 ? (
                  <div className="space-y-3">
                    {data.topTools.map((tool, idx) => (
                      <div
                        key={tool.name}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-muted-foreground w-6">#{idx + 1}</span>
                          <span className="font-medium">{tool.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{tool.count} uses</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No data yet</p>
                )}
              </CardContent>
            </Card>

            {/* Peak Usage Hours */}
            <Card>
              <CardHeader>
                <CardTitle>Peak Usage Hours</CardTitle>
                <CardDescription>When you use tools most (UTC)</CardDescription>
              </CardHeader>
              <CardContent>
                {data?.peakHours && data.peakHours.length > 0 ? (
                  <div className="flex items-end gap-0.5 h-32">
                    {Array.from({ length: 24 }, (_, h) => {
                      const entry = data.peakHours.find((p) => p.hour === h);
                      const count = entry?.count ?? 0;
                      const maxCount = Math.max(...data.peakHours.map((p) => p.count), 1);
                      const height = count > 0 ? Math.max((count / maxCount) * 100, 8) : 4;
                      return (
                        <div
                          key={h}
                          className={`flex-1 rounded-t ${count > 0 ? 'bg-chart-3/80 hover:bg-chart-3' : 'bg-muted'} transition-colors`}
                          style={{ height: `${height}%` }}
                          title={`${h}:00 — ${count} executions`}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No data yet</p>
                )}
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0:00</span>
                  <span>12:00</span>
                  <span>23:00</span>
                </div>
              </CardContent>
            </Card>

            {/* Error Rate Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Error Rate Trend</CardTitle>
                <CardDescription>Daily failure rate</CardDescription>
              </CardHeader>
              <CardContent>
                {data?.errorRate && data.errorRate.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-end gap-1 h-32">
                      {data.errorRate.map((day) => {
                        const pct = day.rate * 100;
                        const height = Math.max(pct, 4);
                        return (
                          <div
                            key={day.date}
                            className={`flex-1 rounded-t transition-colors ${pct > 10 ? 'bg-destructive/80 hover:bg-destructive' : 'bg-chart-2/80 hover:bg-chart-2'}`}
                            style={{ height: `${Math.min(height, 100)}%` }}
                            title={`${day.date}: ${pct.toFixed(1)}% (${day.failed}/${day.total})`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{data.errorRate[0]?.date}</span>
                      <span>{data.errorRate[data.errorRate.length - 1]?.date}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No data yet</p>
                )}
              </CardContent>
            </Card>

            {/* Coin Flow */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Coin Flow</CardTitle>
                <CardDescription>Coins earned vs spent by month</CardDescription>
              </CardHeader>
              <CardContent>
                {data?.coinFlow && data.coinFlow.length > 0 ? (
                  <div className="space-y-3">
                    {data.coinFlow.map((month) => (
                      <div key={month.month} className="flex items-center gap-4">
                        <span className="text-sm font-mono text-muted-foreground w-20">{month.month}</span>
                        <div className="flex-1 flex gap-2 items-center">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-success">Earned</span>
                              <span className="text-xs font-medium">{month.earned}</span>
                            </div>
                            <div className="h-2 bg-success/20 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-success rounded-full"
                                style={{ width: `${Math.min((month.earned / Math.max(month.earned, month.spent, 1)) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-destructive">Spent</span>
                              <span className="text-xs font-medium">{month.spent}</span>
                            </div>
                            <div className="h-2 bg-destructive/20 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-destructive rounded-full"
                                style={{ width: `${Math.min((month.spent / Math.max(month.earned, month.spent, 1)) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No coin activity yet</p>
                )}
              </CardContent>
            </Card>

            {/* B2B Suite Usage */}
            {b2bUsage && b2bUsage.usage.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>API Suite Usage</CardTitle>
                      <CardDescription>B2B operations used vs quota</CardDescription>
                    </div>
                    <Link href="/dashboard/api/usage">
                      <Button variant="ghost" size="sm">View Details</Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {b2bUsage.usage.map((u) => {
                      const pct = u.monthlyLimit > 0 ? Math.min((u.usageCount / u.monthlyLimit) * 100, 100) : 0;
                      return (
                        <div key={u.suiteId} className="p-3 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium capitalize">{u.suiteName}</span>
                            {pct >= 80 && <Badge variant="destructive" className="text-xs">High</Badge>}
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${pct >= 80 ? 'bg-destructive' : 'bg-primary'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {u.usageCount.toLocaleString()} / {u.monthlyLimit.toLocaleString()} ({pct.toFixed(0)}%)
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
