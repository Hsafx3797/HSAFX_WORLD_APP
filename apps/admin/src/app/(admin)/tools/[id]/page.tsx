/**
 * Tool Detail Page
 * View and manage individual tool: metadata, execution stats, analytics, actions
 */

'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Wrench,
  Cpu,
  Cloud,
  Play,
  Pause,
  Edit2,
  BarChart2,
  Zap,
  AlertTriangle,
  Clock,
  Hash,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { useTool, useToolMutations, useToolAnalytics } from '@/lib/hooks';
import type { ToolAnalyticsData } from '@/lib/hooks';
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Input,
  Badge,
  StatusBadge,
  TierBadge,
  Modal,
  FormGroup,
  Textarea,
  Toggle,
  Select,
} from '@/components/ui';

export default function ToolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { tool, isLoading, error, refresh } = useTool(id);
  const mutations = useToolMutations();

  const [analyticsPeriod, setAnalyticsPeriod] = useState<'24h' | '7d' | '30d'>('7d');
  const { analytics, isLoading: analyticsLoading } = useToolAnalytics(id, analyticsPeriod);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    description: '',
    coinCost: 0,
    enabled: true,
  });

  const openEditModal = useCallback(() => {
    if (!tool) return;
    setEditForm({
      displayName: tool.displayName || tool.name,
      description: tool.description,
      coinCost: tool.coinCost || 0,
      enabled: tool.enabled,
    });
    setShowEditModal(true);
  }, [tool]);

  const handleSaveEdit = useCallback(async () => {
    if (!tool) return;
    await mutations.update(tool.id, editForm);
    setShowEditModal(false);
    refresh();
  }, [tool, editForm, mutations, refresh]);

  const handleEnable = useCallback(async () => {
    if (!tool) return;
    await mutations.enable(tool.id);
    refresh();
  }, [tool, mutations, refresh]);

  const handleDisable = useCallback(async () => {
    if (!tool) return;
    await mutations.disable(tool.id);
    refresh();
  }, [tool, mutations, refresh]);

  const getRuntimeIcon = (runtime: string) => {
    switch (runtime) {
      case 'wasm': return <Cpu className="h-5 w-5 text-chart-4" />;
      case 'api': return <Cloud className="h-5 w-5 text-primary" />;
      default: return <Wrench className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !tool) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <p className="text-lg font-medium text-foreground">Tool not found</p>
            <p className="text-sm text-muted-foreground mt-1">The tool may have been removed or the ID is invalid.</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push('/tools')}>
              Back to Tools
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => router.push('/tools')}>
          Back
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <div className="p-3 bg-muted rounded-lg">
            {getRuntimeIcon(tool.runtime || 'wasm')}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{tool.displayName || tool.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground font-mono">{tool.slug}</span>
              <StatusBadge status={tool.enabled ? 'enabled' : 'disabled'} />
              <TierBadge tier={tool.tier} />
              <Badge variant="default">{tool.category}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" icon={<Edit2 className="h-4 w-4" />} onClick={openEditModal}>
            Edit
          </Button>
          {tool.enabled ? (
            <Button variant="destructive" icon={<Pause className="h-4 w-4" />} onClick={handleDisable} loading={mutations.loading}>
              Disable
            </Button>
          ) : (
            <Button variant="primary" icon={<Play className="h-4 w-4" />} onClick={handleEnable} loading={mutations.loading}>
              Enable
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Total Usage</p>
            <p className="text-2xl font-bold text-foreground">{(tool.usageCountTotal || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Usage (24h)</p>
            <p className="text-2xl font-bold text-primary">{(tool.usageCount24h || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Avg. Exec Time</p>
            <p className="text-2xl font-bold text-chart-4">{tool.avgExecutionTime || 0}ms</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Error Rate</p>
            <p className={`text-2xl font-bold ${tool.errorRate > 5 ? 'text-destructive' : 'text-success'}`}>
              {tool.errorRate || 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Coin Cost</p>
            <p className="text-2xl font-bold text-chart-3">{tool.coinCost || 0} 🪙</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Tool Metadata */}
        <Card>
          <CardHeader title="Tool Information" action={<Wrench className="h-5 w-5 text-muted-foreground" />} />
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Tool ID</p>
                  <p className="text-foreground font-mono text-sm">{tool.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Internal Name</p>
                  <p className="text-foreground">{tool.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Runtime / Execution</p>
                  <p className="text-foreground">{(tool.runtime || 'wasm').toUpperCase()} / {tool.execution}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Input → Output</p>
                  <p className="text-foreground">{tool.inputType} → {tool.outputType}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-foreground">{new Date(tool.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              {tool.description && (
                <div className="pt-2 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-foreground text-sm">{tool.description}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Analytics Section */}
        <Card>
          <CardHeader
            title="Usage Analytics"
            description={`Period: ${analyticsPeriod}`}
            action={
              <Select
                options={[
                  { value: '24h', label: 'Last 24h' },
                  { value: '7d', label: 'Last 7 days' },
                  { value: '30d', label: 'Last 30 days' },
                ]}
                value={analyticsPeriod}
                onChange={(e) => setAnalyticsPeriod(e.target.value as '24h' | '7d' | '30d')}
              />
            }
          />
          <CardContent>
            {analyticsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : analytics ? (
              <div className="space-y-4">
                {/* Executions mini-chart */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" /> Executions
                  </p>
                  <div className="flex items-end gap-1 h-16">
                    {analytics.executions.map((d, i) => {
                      const max = Math.max(...analytics.executions.map((e) => e.count), 1);
                      const height = (d.count / max) * 100;
                      return (
                        <div
                          key={i}
                          className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t transition-colors relative group"
                          style={{ height: `${Math.max(height, 4)}%` }}
                          title={`${d.date}: ${d.count}`}
                        >
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-1.5 py-0.5 rounded hidden group-hover:block whitespace-nowrap">
                            {d.count}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total: {analytics.executions.reduce((s, d) => s + d.count, 0).toLocaleString()}
                  </p>
                </div>

                {/* Errors mini-chart */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" /> Errors
                  </p>
                  <div className="flex items-end gap-1 h-16">
                    {analytics.errors.map((d, i) => {
                      const max = Math.max(...analytics.errors.map((e) => e.count), 1);
                      const height = (d.count / max) * 100;
                      return (
                        <div
                          key={i}
                          className="flex-1 bg-destructive/20 hover:bg-destructive/40 rounded-t transition-colors relative group"
                          style={{ height: `${Math.max(height, 4)}%` }}
                          title={`${d.date}: ${d.count}`}
                        >
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-1.5 py-0.5 rounded hidden group-hover:block whitespace-nowrap">
                            {d.count}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total: {analytics.errors.reduce((s, d) => s + d.count, 0).toLocaleString()}
                  </p>
                </div>

                {/* Avg time mini-chart */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-chart-4" /> Avg. Response Time
                  </p>
                  <div className="flex items-end gap-1 h-16">
                    {analytics.avgTime.map((d, i) => {
                      const max = Math.max(...analytics.avgTime.map((e) => e.ms), 1);
                      const height = (d.ms / max) * 100;
                      return (
                        <div
                          key={i}
                          className="flex-1 bg-chart-4/20 hover:bg-chart-4/40 rounded-t transition-colors relative group"
                          style={{ height: `${Math.max(height, 4)}%` }}
                          title={`${d.date}: ${d.ms}ms`}
                        >
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-1.5 py-0.5 rounded hidden group-hover:block whitespace-nowrap">
                            {d.ms}ms
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Avg: {Math.round(analytics.avgTime.reduce((s, d) => s + d.ms, 0) / (analytics.avgTime.length || 1))}ms
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                <p>No analytics data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Tool"
        description={tool.slug}
        size="lg"
      >
        <FormGroup>
          <Input
            label="Display Name"
            value={editForm.displayName}
            onChange={(e) => setEditForm((prev) => ({ ...prev, displayName: e.target.value }))}
            required
          />
          <Textarea
            label="Description"
            value={editForm.description}
            onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
            rows={3}
          />
          <Input
            label="Coin Cost"
            type="number"
            min={0}
            value={editForm.coinCost}
            onChange={(e) => setEditForm((prev) => ({ ...prev, coinCost: parseInt(e.target.value) || 0 }))}
          />
          <Toggle
            label="Enabled"
            description="When disabled, users cannot access this tool"
            checked={editForm.enabled}
            onChange={(checked) => setEditForm((prev) => ({ ...prev, enabled: checked }))}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} loading={mutations.loading}>Save Changes</Button>
          </div>
        </FormGroup>
      </Modal>
    </div>
  );
}
