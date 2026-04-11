/**
 * Admin Dashboard Page
 * Real-time metrics, alerts, and system overview
 */

'use client';

import Link from 'next/link';
import {
  Users,
  CreditCard,
  Wrench,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  ArrowRight,
  Bell,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { useDashboardMetrics, useDashboardAnalytics, useTopTools, useRecentErrors, useAlerts } from '@/lib/hooks';
import { StatCard, Card, CardHeader, CardContent, Badge, Button } from '@/components/ui';

export default function DashboardPage() {
  const { metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { analytics, isLoading: analyticsLoading } = useDashboardAnalytics(30);
  const { topTools, isLoading: toolsLoading } = useTopTools(5);
  const { recentErrors, isLoading: errorsLoading } = useRecentErrors(5);
  const { alerts, acknowledge, isLoading: alertsLoading } = useAlerts();

  const CHART_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--destructive)', 'var(--warning)'];
  const PIE_COLORS = ['var(--chart-1)', 'var(--chart-2)'];

  const formatNumber = (num: number | undefined | null): string => {
    if (num == null) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (cents: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back. Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" icon={<RefreshCw className="h-4 w-4" />} size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Alerts Banner */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 3).map((alert) => (
            <div
              key={alert.id}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                alert.severity === 'critical'
                  ? 'bg-destructive/10 border-destructive/30'
                  : alert.severity === 'warning'
                  ? 'bg-warning/10 border-warning/30'
                  : 'bg-primary/10 border-primary/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle
                  className={`h-5 w-5 ${
                    alert.severity === 'critical'
                      ? 'text-destructive'
                      : alert.severity === 'warning'
                      ? 'text-warning'
                      : 'text-primary'
                  }`}
                />
                <div>
                  <p className="font-medium text-foreground">{alert.title}</p>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => acknowledge(alert.id)}
              >
                Dismiss
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={formatNumber(metrics?.totalUsers || 0)}
          change={metrics?.userGrowth ? { value: metrics.userGrowth, trend: metrics.userGrowth >= 0 ? 'up' : 'down' } : undefined}
          icon={<Users className="h-6 w-6" />}
          loading={metricsLoading}
        />
        <StatCard
          title="Active Subscriptions"
          value={formatNumber(metrics?.activeSubscriptions || 0)}
          change={metrics?.subscriptionGrowth ? { value: metrics.subscriptionGrowth, trend: metrics.subscriptionGrowth >= 0 ? 'up' : 'down' } : undefined}
          icon={<CreditCard className="h-6 w-6" />}
          loading={metricsLoading}
        />
        <StatCard
          title="Today's Executions"
          value={formatNumber(metrics?.todayExecutions || 0)}
          change={metrics?.executionGrowth ? { value: metrics.executionGrowth, trend: metrics.executionGrowth >= 0 ? 'up' : 'down' } : undefined}
          icon={<Wrench className="h-6 w-6" />}
          loading={metricsLoading}
        />
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(metrics?.todayRevenue || 0)}
          change={metrics?.revenueGrowth ? { value: metrics.revenueGrowth, trend: metrics.revenueGrowth >= 0 ? 'up' : 'down' } : undefined}
          icon={<TrendingUp className="h-6 w-6" />}
          loading={metricsLoading}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Free Users</p>
            <p className="text-xl font-bold text-foreground">{formatNumber(metrics?.freeUsers || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Paid Users</p>
            <p className="text-xl font-bold text-success">{formatNumber(metrics?.paidUsers || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active Tools</p>
            <p className="text-xl font-bold text-foreground">{metrics?.activeTools || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Tools</p>
            <p className="text-xl font-bold text-foreground">{metrics?.totalTools || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Error Rate</p>
            <p className="text-xl font-bold text-destructive">{metrics?.errorRate?.toFixed(2) || 0}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Avg Response</p>
            <p className="text-xl font-bold text-foreground">{metrics?.avgResponseTime || 0}ms</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card>
          <CardHeader title="User Growth" description="New signups over the last 30 days" />
          <CardContent>
            {analyticsLoading ? (
              <div className="h-64 bg-muted animate-pulse rounded" />
            ) : analytics?.userGrowth?.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={analytics.userGrowth}>
                  <defs>
                    <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                    tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--popover-foreground)' }}
                    labelFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  />
                  <Area type="monotone" dataKey="users" stroke={CHART_COLORS[0]} fill="url(#userGrad)" strokeWidth={2} name="New Users" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-12">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Execution Trend Chart */}
        <Card>
          <CardHeader title="Tool Executions" description="Daily executions and errors" />
          <CardContent>
            {analyticsLoading ? (
              <div className="h-64 bg-muted animate-pulse rounded" />
            ) : analytics?.executionTrend?.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={analytics.executionTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                    tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--popover-foreground)' }}
                    labelFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  />
                  <Legend wrapperStyle={{ color: 'var(--muted-foreground)' }} />
                  <Bar dataKey="executions" fill={CHART_COLORS[1]} name="Executions" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="errors" fill={CHART_COLORS[2]} name="Errors" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-12">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader title="Revenue Trend" description="Daily coin purchase revenue" />
          <CardContent>
            {analyticsLoading ? (
              <div className="h-64 bg-muted animate-pulse rounded" />
            ) : analytics?.revenueTrend?.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={analytics.revenueTrend}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS[1]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS[1]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                    tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--popover-foreground)' }}
                    labelFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    formatter={(value: number) => [`$${value}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke={CHART_COLORS[1]} fill="url(#revGrad)" strokeWidth={2} name="Revenue" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-12">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader title="User Breakdown" description="Free vs Paid distribution" />
          <CardContent>
            {analyticsLoading ? (
              <div className="h-64 bg-muted animate-pulse rounded" />
            ) : analytics?.conversionFunnel?.length ? (
              <div className="flex items-center justify-center gap-8">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={analytics.conversionFunnel}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      dataKey="value"
                      nameKey="name"
                      strokeWidth={0}
                    >
                      {analytics.conversionFunnel.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--popover-foreground)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {analytics.conversionFunnel.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">{entry.name}</p>
                        <p className="text-lg font-bold text-foreground">
                          {entry.value.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {analytics.conversionFunnel.length >= 2 && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground">Conversion Rate</p>
                      <p className="text-sm font-bold text-success">
                        {(
                          (analytics.conversionFunnel[1].value /
                            Math.max(analytics.conversionFunnel[0].value + analytics.conversionFunnel[1].value, 1)) *
                          100
                        ).toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-12">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Top Tools */}
        <Card>
          <CardHeader
            title="Top Tools"
            description="Most used tools today"
            action={
              <Link href="/tools">
                <Button variant="ghost" size="sm" icon={<ArrowRight className="h-4 w-4" />} iconPosition="right">
                  View All
                </Button>
              </Link>
            }
          />
          <CardContent>
            {toolsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : topTools?.length ? (
              <div className="space-y-3">
                {topTools.map((tool, index) => (
                  <div key={tool.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-muted-foreground">#{index + 1}</span>
                      <div>
                        <p className="font-medium text-foreground">{tool.displayName}</p>
                        <p className="text-xs text-muted-foreground">{tool.slug}</p>
                      </div>
                    </div>
                    <Badge variant="primary">{formatNumber(tool.usageCount)} uses</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No tool usage data</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Errors */}
        <Card>
          <CardHeader
            title="Recent Errors"
            description="Latest execution failures"
            action={
              <Link href="/activity">
                <Button variant="ghost" size="sm" icon={<ArrowRight className="h-4 w-4" />} iconPosition="right">
                  View All
                </Button>
              </Link>
            }
          />
          <CardContent>
            {errorsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : recentErrors?.length ? (
              <div className="space-y-3">
                {recentErrors.map((error) => (
                  <div key={error.id} className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg">
                    <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{error.toolName}</p>
                      <p className="text-xs text-destructive truncate">{error.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(error.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-muted-foreground">No recent errors</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader title="Quick Actions" description="Common admin tasks" />
          <CardContent>
            <div className="space-y-2">
              <Link
                href="/users"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium text-foreground">Manage Users</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Link
                href="/tools"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-chart-3/20 rounded-lg">
                    <Wrench className="h-4 w-4 text-chart-3" />
                  </div>
                  <span className="font-medium text-foreground">Manage Tools</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Link
                href="/subscriptions"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/20 rounded-lg">
                    <CreditCard className="h-4 w-4 text-success" />
                  </div>
                  <span className="font-medium text-foreground">View Subscriptions</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Link
                href="/feature-flags"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-warning/20 rounded-lg">
                    <Bell className="h-4 w-4 text-warning" />
                  </div>
                  <span className="font-medium text-foreground">Feature Flags</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Link
                href="/activity"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-chart-4/20 rounded-lg">
                    <Activity className="h-4 w-4 text-chart-4" />
                  </div>
                  <span className="font-medium text-foreground">Activity Logs</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
