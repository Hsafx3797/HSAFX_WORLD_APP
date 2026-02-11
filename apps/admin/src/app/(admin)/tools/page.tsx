/**
 * Tools Management Page
 * Full CRUD for tool management with enable/disable, analytics, and metadata
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wrench,
  Search,
  Filter,
  Download,
  Play,
  Pause,
  Eye,
  Edit2,
  BarChart2,
  Cpu,
  Cloud,
} from 'lucide-react';
import { useTools, useToolMutations, useCategories, useToolAnalytics } from '@/lib/hooks';
import type { Tool, ToolFilters } from '@/lib/types';
import {
  DataTable,
  Card,
  CardContent,
  Button,
  Input,
  Select,
  StatusBadge,
  TierBadge,
  Badge,
  Modal,
  FormGroup,
  Textarea,
  Toggle,
} from '@/components/ui';
import type { Column, Action } from '@/components/ui';

export default function ToolsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<ToolFilters>({ page: 1, limit: 25 });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'24h' | '7d' | '30d'>('7d');
  const [editForm, setEditForm] = useState({
    displayName: '',
    description: '',
    coinCost: 0,
    enabled: true,
  });

  const { tools, pagination, isLoading, refresh } = useTools(filters);
  const { categories } = useCategories();
  const mutations = useToolMutations();
  const { analytics: toolAnalytics, isLoading: analyticsLoading } = useToolAnalytics(
    showAnalyticsModal ? selectedTool?.id ?? null : null,
    analyticsPeriod,
  );

  const handleSearch = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, search: query, page: 1 }));
  }, []);

  const handleFilterChange = useCallback((key: keyof ToolFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
      page: 1,
    }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handleViewTool = useCallback((tool: Tool) => {
    router.push(`/tools/${tool.id}`);
  }, [router]);

  const handleEnableTool = useCallback(async (tool: Tool) => {
    await mutations.enable(tool.id);
    refresh();
  }, [mutations, refresh]);

  const handleDisableTool = useCallback(async (tool: Tool) => {
    await mutations.disable(tool.id);
    refresh();
  }, [mutations, refresh]);

  const openEditModal = useCallback((tool: Tool) => {
    setSelectedTool(tool);
    setEditForm({
      displayName: tool.displayName,
      description: tool.description,
      coinCost: tool.coinCost,
      enabled: tool.enabled,
    });
    setShowEditModal(true);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!selectedTool) return;
    await mutations.update(selectedTool.id, editForm);
    setShowEditModal(false);
    setSelectedTool(null);
    refresh();
  }, [selectedTool, editForm, mutations, refresh]);

  const getRuntimeIcon = (runtime: string) => {
    switch (runtime) {
      case 'wasm':
        return <Cpu className="h-4 w-4 text-chart-4" />;
      case 'api':
        return <Cloud className="h-4 w-4 text-primary" />;
      default:
        return <Wrench className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const columns: Column<Tool>[] = [
    {
      key: 'displayName',
      header: 'Tool',
      sortable: true,
      render: (tool) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">
            {getRuntimeIcon(tool.runtime)}
          </div>
          <div>
            <p className="font-medium text-foreground">{tool.displayName}</p>
            <p className="text-xs text-muted-foreground font-mono">{tool.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'categoryId',
      header: 'Category',
      sortable: true,
      width: '140px',
      render: (tool) => (
        <Badge variant="default">
          {categories.find((c) => c.id === tool.categoryId)?.name || tool.categoryId}
        </Badge>
      ),
    },
    {
      key: 'runtime',
      header: 'Runtime',
      sortable: true,
      width: '100px',
      render: (tool) => (
        <Badge variant={tool.runtime === 'wasm' ? 'info' : 'primary'}>
          {tool.runtime.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'tier',
      header: 'Tier',
      sortable: true,
      width: '100px',
      render: (tool) => <TierBadge tier={tool.tier} />,
    },
    {
      key: 'coinCost',
      header: 'Cost',
      sortable: true,
      width: '80px',
      render: (tool) => (
        <span className="font-mono text-sm">{tool.coinCost} 🪙</span>
      ),
    },
    {
      key: 'usageCount',
      header: 'Usage',
      sortable: true,
      width: '100px',
      render: (tool) => <span>{(tool.usageCount ?? 0).toLocaleString()}</span>,
    },
    {
      key: 'enabled',
      header: 'Status',
      sortable: true,
      width: '100px',
      render: (tool) => (
        <StatusBadge status={tool.enabled ? 'enabled' : 'disabled'} />
      ),
    },
  ];

  const actions: Action<Tool>[] = [
    {
      label: 'View Details',
      icon: <Eye className="h-4 w-4" />,
      onClick: handleViewTool,
    },
    {
      label: 'Edit Metadata',
      icon: <Edit2 className="h-4 w-4" />,
      onClick: openEditModal,
    },
    {
      label: 'View Analytics',
      icon: <BarChart2 className="h-4 w-4" />,
      onClick: (tool) => {
        setSelectedTool(tool);
        setShowAnalyticsModal(true);
      },
    },
    {
      label: 'Enable Tool',
      icon: <Play className="h-4 w-4" />,
      onClick: handleEnableTool,
      disabled: (tool) => tool.enabled,
    },
    {
      label: 'Disable Tool',
      icon: <Pause className="h-4 w-4" />,
      onClick: handleDisableTool,
      variant: 'danger',
      disabled: (tool) => !tool.enabled,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-chart-4/10 rounded-lg">
            <Wrench className="h-6 w-6 text-chart-4" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tools</h1>
            <p className="text-sm text-muted-foreground">
              Manage tool metadata, pricing, and availability
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" icon={<Download className="h-4 w-4" />}>
            Export
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Tools</p>
            <p className="text-2xl font-bold text-foreground">{pagination?.total || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-success">
              {tools.filter((t) => t.enabled).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">WASM</p>
            <p className="text-2xl font-bold text-chart-4">
              {tools.filter((t) => t.runtime === 'wasm').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">API</p>
            <p className="text-2xl font-bold text-primary">
              {tools.filter((t) => t.runtime === 'api').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Card */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name or slug..."
                icon={<Search className="h-4 w-4" />}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <Button
              variant={showFilters ? 'primary' : 'outline'}
              icon={<Filter className="h-4 w-4" />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-5 gap-4">
              <Select
                label="Category"
                options={[
                  { value: '', label: 'All Categories' },
                  ...categories.map((c) => ({ value: c.id, label: c.name })),
                ]}
                value={filters.categoryId || ''}
                onChange={(e) => handleFilterChange('categoryId', e.target.value)}
              />
              <Select
                label="Runtime"
                options={[
                  { value: '', label: 'All Runtimes' },
                  { value: 'wasm', label: 'WASM' },
                  { value: 'api', label: 'API' },
                ]}
                value={filters.runtime || ''}
                onChange={(e) => handleFilterChange('runtime', e.target.value)}
              />
              <Select
                label="Tier"
                options={[
                  { value: '', label: 'All Tiers' },
                  { value: 'free', label: 'Free' },
                  { value: 'premium', label: 'Premium' },
                ]}
                value={filters.tier || ''}
                onChange={(e) => handleFilterChange('tier', e.target.value)}
              />
              <Select
                label="Status"
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'true', label: 'Enabled' },
                  { value: 'false', label: 'Disabled' },
                ]}
                value={filters.enabled?.toString() || ''}
                onChange={(e) => handleFilterChange('enabled', e.target.value)}
              />
              <Select
                label="Sort By"
                options={[
                  { value: 'displayName', label: 'Name' },
                  { value: 'usageCount', label: 'Usage' },
                  { value: 'coinCost', label: 'Cost' },
                  { value: 'createdAt', label: 'Created Date' },
                ]}
                value={filters.sortBy || 'displayName'}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tools Table */}
      <Card>
        <CardContent noPadding>
          <DataTable
            data={tools}
            columns={columns}
            actions={actions}
            loading={isLoading}
            emptyMessage="No tools found"
            onRowClick={handleViewTool}
            pagination={pagination ? {
              ...pagination,
              onPageChange: handlePageChange,
            } : undefined}
          />
        </CardContent>
      </Card>

      {/* Edit Tool Modal */}
      <Modal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTool(null);
        }}
        title="Edit Tool"
        description={selectedTool?.slug}
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
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} loading={mutations.loading}>
              Save Changes
            </Button>
          </div>
        </FormGroup>
      </Modal>

      {/* Analytics Modal */}
      <Modal
        open={showAnalyticsModal}
        onClose={() => {
          setShowAnalyticsModal(false);
          setSelectedTool(null);
          setAnalyticsPeriod('7d');
        }}
        title={`Analytics: ${selectedTool?.displayName}`}
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="grid grid-cols-3 gap-4 flex-1">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">Total Executions</p>
                  <p className="text-2xl font-bold text-foreground">{(selectedTool?.usageCount ?? 0).toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">Avg. Execution Time</p>
                  <p className="text-2xl font-bold text-foreground">{selectedTool?.avgExecutionTime || 0}ms</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">Error Rate</p>
                  <p className="text-2xl font-bold text-foreground">{selectedTool?.errorRate || 0}%</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Period selector */}
          <div className="flex items-center gap-2">
            {(['24h', '7d', '30d'] as const).map((p) => (
              <button
                key={p}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  analyticsPeriod === p
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setAnalyticsPeriod(p)}
              >
                {p === '24h' ? 'Last 24h' : p === '7d' ? 'Last 7 days' : 'Last 30 days'}
              </button>
            ))}
          </div>

          {/* Charts */}
          {analyticsLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : toolAnalytics ? (
            <div className="space-y-6">
              {/* Executions chart */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Executions</p>
                <div className="flex items-end gap-1 h-24 p-2 bg-muted/30 rounded-lg">
                  {toolAnalytics.executions.map((d, i) => {
                    const max = Math.max(...toolAnalytics.executions.map((e) => e.count), 1);
                    const height = (d.count / max) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div
                          className="w-full bg-primary/30 hover:bg-primary/60 rounded-t transition-colors"
                          style={{ height: `${Math.max(height, 3)}%` }}
                        />
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-1.5 py-0.5 rounded hidden group-hover:block whitespace-nowrap z-10">
                          {d.date}: {d.count}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total: {toolAnalytics.executions.reduce((s, d) => s + d.count, 0).toLocaleString()}
                </p>
              </div>

              {/* Errors chart */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Errors</p>
                <div className="flex items-end gap-1 h-24 p-2 bg-muted/30 rounded-lg">
                  {toolAnalytics.errors.map((d, i) => {
                    const max = Math.max(...toolAnalytics.errors.map((e) => e.count), 1);
                    const height = (d.count / max) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div
                          className="w-full bg-destructive/30 hover:bg-destructive/60 rounded-t transition-colors"
                          style={{ height: `${Math.max(height, 3)}%` }}
                        />
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-1.5 py-0.5 rounded hidden group-hover:block whitespace-nowrap z-10">
                          {d.date}: {d.count}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total: {toolAnalytics.errors.reduce((s, d) => s + d.count, 0).toLocaleString()}
                </p>
              </div>

              {/* Avg time chart */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Avg. Response Time (ms)</p>
                <div className="flex items-end gap-1 h-24 p-2 bg-muted/30 rounded-lg">
                  {toolAnalytics.avgTime.map((d, i) => {
                    const max = Math.max(...toolAnalytics.avgTime.map((e) => e.ms), 1);
                    const height = (d.ms / max) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div
                          className="w-full bg-chart-4/30 hover:bg-chart-4/60 rounded-t transition-colors"
                          style={{ height: `${Math.max(height, 3)}%` }}
                        />
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-1.5 py-0.5 rounded hidden group-hover:block whitespace-nowrap z-10">
                          {d.date}: {d.ms}ms
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg: {Math.round(toolAnalytics.avgTime.reduce((s, d) => s + d.ms, 0) / (toolAnalytics.avgTime.length || 1))}ms
                </p>
              </div>
            </div>
          ) : (
            <div className="h-64 bg-muted/50 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">No analytics data available for this period</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
