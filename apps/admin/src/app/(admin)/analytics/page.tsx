/**
 * Admin Analytics Dashboard
 * Date-range driven analytics: cohort analysis, funnel, tool usage,
 * revenue time-series, churn, system health. CSV export.
 */

'use client';

import { useState, useMemo } from 'react';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import {
  useAnalyticsOverview,
  useCohortAnalysis,
  useFunnelAnalysis,
  useToolUsageBreakdown,
  useRevenueTimeSeries,
  useChurnAnalysis,
  useSystemHealth,
} from '@/lib/hooks';
import { exportAnalyticsCSV } from '@/lib/api';
import {
  Card, CardHeader, CardContent,
  Button, StatCard, Badge, FormGroup, Input,
} from '@/components/ui';
import { Download, Activity, Users, TrendingDown, Cpu } from 'lucide-react';
import { toast } from 'sonner';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export default function AnalyticsPage() {
  const [range, setRange] = useState(defaultRange);
  const [interval, setInterval] = useState<string>('week');

  const { overview, isLoading: loadingOverview } = useAnalyticsOverview(range.start, range.end);
  const { cohorts, isLoading: loadingCohorts } = useCohortAnalysis(range.start, range.end, interval);
  const { funnel } = useFunnelAnalysis();
  const { breakdown } = useToolUsageBreakdown(range.start, range.end, 15);
  const { series } = useRevenueTimeSeries(range.start, range.end, interval);
  const { churn } = useChurnAnalysis(30);
  const { health } = useSystemHealth();

  const handleExportCSV = async (type: 'cohorts' | 'tool-usage' | 'revenue') => {
    try {
      await exportAnalyticsCSV(type, range.start, range.end);
      toast.success('CSV downloaded');
    } catch {
      toast.error('Export failed');
    }
  };

  // Funnel chart data
  const funnelChartData = useMemo(() => {
    if (!funnel?.steps) return [];
    return funnel.steps.map((s, i) => ({
      name: s.name,
      value: s.count,
      fill: COLORS[i % COLORS.length],
    }));
  }, [funnel]);

  const pieData = useMemo(() => {
    return breakdown.slice(0, 8).map((row, i) => ({
      name: row.toolName,
      value: row.count,
      fill: COLORS[i % COLORS.length],
    }));
  }, [breakdown]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Deep-dive into user, revenue and system metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <FormGroup className="mb-0">
            <Input type="date" value={range.start} onChange={(e) => setRange({ ...range, start: e.target.value })} />
          </FormGroup>
          <span className="text-muted-foreground">to</span>
          <FormGroup className="mb-0">
            <Input type="date" value={range.end} onChange={(e) => setRange({ ...range, end: e.target.value })} />
          </FormGroup>
          <select
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={overview?.userGrowth.total ?? '—'}
          change={overview ? { value: overview.userGrowth.newInRange, trend: 'up' } : undefined}
          icon={<Users className="h-4 w-4" />}
          loading={loadingOverview}
        />
        <StatCard
          title="Executions"
          value={overview?.executions.total ?? '—'}
          change={overview ? { value: overview.executions.inRange, trend: 'up' } : undefined}
          icon={<Activity className="h-4 w-4" />}
          loading={loadingOverview}
        />
        <StatCard
          title="Revenue (coins)"
          value={overview?.revenue.total ?? '—'}
          change={overview ? { value: overview.revenue.inRange, trend: 'up' } : undefined}
          icon={<TrendingDown className="h-4 w-4" />}
          loading={loadingOverview}
        />
        <StatCard
          title="System Health"
          value={health ? `${(100 - parseFloat(health.errorRate)).toFixed(1)}%` : '—'}
          icon={<Cpu className="h-4 w-4" />}
        />
      </div>

      {/* Row: Cohort + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cohort Analysis */}
        <Card>
          <CardHeader
            title="Cohort Analysis"
            description="User sign-ups vs active users by cohort"
            action={
              <Button variant="ghost" size="sm" onClick={() => handleExportCSV('cohorts')}>
                <Download className="h-4 w-4" />
              </Button>
            }
          />
          <CardContent>
            {loadingCohorts ? (
              <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={cohorts}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="cohort" fontSize={12} tickFormatter={(v) => v.slice(0, 10)} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="users_count" name="Signed Up" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="active_users" name="Active" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader title="Conversion Funnel" description="Registered → Verified → Used Tool → Subscribed" />
          <CardContent>
            <div className="space-y-3">
              {funnelChartData.map((step, i) => {
                const max = funnelChartData[0]?.value || 1;
                const pct = ((step.value / max) * 100).toFixed(1);
                return (
                  <div key={step.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{step.name}</span>
                      <span className="font-mono">{step.value.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div className="h-6 rounded bg-muted overflow-hidden">
                      <div
                        className="h-full rounded transition-all"
                        style={{ width: `${pct}%`, backgroundColor: step.fill }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row: Revenue Time-Series + Tool Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue */}
        <Card>
          <CardHeader
            title="Revenue Time-Series"
            description="Coin purchase revenue over time"
            action={
              <Button variant="ghost" size="sm" onClick={() => handleExportCSV('revenue')}>
                <Download className="h-4 w-4" />
              </Button>
            }
          />
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={series}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="period" fontSize={12} tickFormatter={(v) => v.slice(0, 10)} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tool Usage Breakdown */}
        <Card>
          <CardHeader
            title="Tool Usage"
            description="Most-used tools in the selected range"
            action={
              <Button variant="ghost" size="sm" onClick={() => handleExportCSV('tool-usage')}>
                <Download className="h-4 w-4" />
              </Button>
            }
          />
          <CardContent>
            <div className="flex gap-4">
              <ResponsiveContainer width="50%" height={280}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={false}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2 overflow-auto max-h-70">
                {breakdown.slice(0, 10).map((row, i) => (
                  <div key={row.toolId} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="truncate flex-1">{row.toolName}</span>
                    <span className="font-mono text-muted-foreground">{row.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row: Churn + System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Churn Analysis */}
        <Card>
          <CardHeader title="Churn Analysis" description="Users inactive for 30+ days" />
          <CardContent>
            {churn ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-3xl font-bold">{churn.activeUsers.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Active Users</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-3xl font-bold text-destructive">{churn.churnedUsers.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Churned</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50 col-span-2">
                  <div className="text-3xl font-bold">{churn.churnRate}%</div>
                  <div className="text-sm text-muted-foreground">Churn Rate ({churn.daysInactive}d inactive)</div>
                </div>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
            )}
          </CardContent>
        </Card>

        {/* System Health (live) */}
        <Card>
          <CardHeader
            title="System Health"
            description="Real-time (10s refresh)"
            action={<Badge variant="success">Live</Badge>}
          />
          <CardContent>
            {health ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-3xl font-bold">{health.recentExecutions}</div>
                  <div className="text-sm text-muted-foreground">Requests (5 min)</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-3xl font-bold">{health.avgResponseTime}<span className="text-base font-normal">ms</span></div>
                  <div className="text-sm text-muted-foreground">Avg Response</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50 col-span-2">
                  <div className={`text-3xl font-bold ${parseFloat(health.errorRate) > 5 ? 'text-destructive' : 'text-green-500'}`}>
                    {health.errorRate}%
                  </div>
                  <div className="text-sm text-muted-foreground">Error Rate</div>
                </div>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
