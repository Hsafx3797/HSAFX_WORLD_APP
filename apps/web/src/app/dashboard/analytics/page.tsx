'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useSubscription } from '@/hooks/use-subscription';
import { trpc } from '@/lib/trpc';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { isPro } = useSubscription();

  const analyticsQuery = trpc.tools.getAnalytics.useQuery(undefined, {
    enabled: !!user && isPro,
  });

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

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Usage Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Your tool usage and coin activity over time
        </p>
      </div>

      {analyticsQuery.isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-muted rounded w-1/3" />
              </CardHeader>
              <CardContent>
                <div className="h-48 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Executions per Day */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Executions per Day</CardTitle>
              <CardDescription>Tool usage over the last 30 days</CardDescription>
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
                        <span className="text-lg font-bold text-muted-foreground w-6">
                          #{idx + 1}
                        </span>
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
                      <span className="text-sm font-mono text-muted-foreground w-20">
                        {month.month}
                      </span>
                      <div className="flex-1 flex gap-2 items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-green-600">Earned</span>
                            <span className="text-xs font-medium">{month.earned}</span>
                          </div>
                          <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{
                                width: `${Math.min((month.earned / Math.max(month.earned, month.spent, 1)) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-red-600">Spent</span>
                            <span className="text-xs font-medium">{month.spent}</span>
                          </div>
                          <div className="h-2 bg-red-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-red-500 rounded-full"
                              style={{
                                width: `${Math.min((month.spent / Math.max(month.earned, month.spent, 1)) * 100, 100)}%`,
                              }}
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
        </div>
      )}
    </div>
  );
}
