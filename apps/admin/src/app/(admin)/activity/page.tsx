/**
 * Activity Logs / Audit Page
 * View and filter system audit logs
 */

'use client';

import { useState, useCallback } from 'react';
import {
  Activity,
  Search,
  Filter,
  Download,
  User,
  Shield,
  CreditCard,
  Wrench,
  Settings,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import { useAuditLogs } from '@/lib/hooks';
import type { AuditLog, AuditFilters } from '@/lib/types';
import {
  DataTable,
  Card,
  CardContent,
  Button,
  Input,
  Select,
  Badge,
  Modal,
} from '@/components/ui';
import type { Column } from '@/components/ui';
import * as api from '@/lib/api';

type ActionCategory = 'user' | 'subscription' | 'tool' | 'admin' | 'system' | 'billing';

export default function ActivityPage() {
  const [filters, setFilters] = useState<AuditFilters>({ page: 1, limit: 50 });
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { logs, pagination, isLoading } = useAuditLogs(filters);

  const handleSearch = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, search: query, page: 1 }));
  }, []);

  const handleFilterChange = useCallback((key: keyof AuditFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
      page: 1,
    }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const blob = await api.exportAuditLogs(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } finally {
      setExporting(false);
    }
  }, [filters]);

  const getCategoryIcon = (action: string) => {
    const category = action.split('.')[0] as ActionCategory;
    switch (category) {
      case 'user':
        return <User className="h-4 w-4 text-primary" />;
      case 'subscription':
        return <CreditCard className="h-4 w-4 text-success" />;
      case 'tool':
        return <Wrench className="h-4 w-4 text-chart-4" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-destructive" />;
      case 'billing':
        return <CreditCard className="h-4 w-4 text-chart-3" />;
      case 'system':
        return <Settings className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground/70" />;
    }
  };

  const getCategoryVariant = (action: string): 'success' | 'danger' | 'warning' | 'info' | 'primary' | 'default' => {
    const category = action.split('.')[0] as ActionCategory;
    switch (category) {
      case 'user':
        return 'info';
      case 'subscription':
        return 'success';
      case 'tool':
        return 'primary';
      case 'admin':
        return 'danger';
      case 'billing':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatAction = (action: string): string => {
    return action
      .replace(/\./g, ' › ')
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const columns: Column<AuditLog>[] = [
    {
      key: 'createdAt',
      header: 'Time',
      sortable: true,
      width: '180px',
      render: (log) => (
        <div className="text-sm">
          <p className="text-foreground">{new Date(log.createdAt).toLocaleDateString()}</p>
          <p className="text-muted-foreground font-mono text-xs">{new Date(log.createdAt).toLocaleTimeString()}</p>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      sortable: true,
      render: (log) => (
        <div className="flex items-center gap-2">
          {getCategoryIcon(log.action)}
          <div>
            <Badge variant={getCategoryVariant(log.action)} size="sm">
              {log.action.split('.')[0]}
            </Badge>
            <p className="text-sm text-muted-foreground mt-1">{formatAction(log.action.split('.').slice(1).join('.'))}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'adminId',
      header: 'Performed By',
      sortable: true,
      render: (log) => (
        <div>
          <p className="font-medium text-foreground">{log.admin?.email || 'System'}</p>
          <p className="text-xs text-muted-foreground">{log.adminId ? `Admin: ${log.adminId.slice(0, 8)}...` : 'Automated'}</p>
        </div>
      ),
    },
    {
      key: 'targetType',
      header: 'Target',
      render: (log) => (
        <div>
          <Badge variant="default" size="sm">{log.targetType}</Badge>
          <p className="text-xs font-mono text-muted-foreground mt-1">{log.targetId?.slice(0, 12)}...</p>
        </div>
      ),
    },
    {
      key: 'ipAddress',
      header: 'IP Address',
      width: '140px',
      render: (log) => (
        <span className="font-mono text-sm text-muted-foreground">{log.ipAddress || '-'}</span>
      ),
    },
    {
      key: 'changes',
      header: 'Details',
      width: '100px',
      render: (log) => (
        <Button
          variant="ghost"
          size="sm"
          icon={<Eye className="h-4 w-4" />}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedLog(log);
            setShowDetailsModal(true);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  // Action categories for filtering
  const actionCategories = [
    { value: '', label: 'All Actions' },
    { value: 'user', label: 'User Actions' },
    { value: 'subscription', label: 'Subscription' },
    { value: 'tool', label: 'Tool Management' },
    { value: 'admin', label: 'Admin Actions' },
    { value: 'billing', label: 'Billing' },
    { value: 'system', label: 'System' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-chart-5/10 rounded-lg">
            <Activity className="h-6 w-6 text-chart-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Activity Logs</h1>
            <p className="text-sm text-muted-foreground">
              View and audit system activity
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            icon={<Download className="h-4 w-4" />}
            onClick={handleExport}
            loading={exporting}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="text-xl font-bold text-foreground">{pagination?.total || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">User</span>
            </div>
            <p className="text-xl font-bold text-primary">
              {logs.filter((l) => l.action.startsWith('user.')).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-success" />
              <span className="text-sm text-muted-foreground">Subscription</span>
            </div>
            <p className="text-xl font-bold text-success">
              {logs.filter((l) => l.action.startsWith('subscription.')).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-chart-4" />
              <span className="text-sm text-muted-foreground">Tool</span>
            </div>
            <p className="text-xl font-bold text-chart-4">
              {logs.filter((l) => l.action.startsWith('tool.')).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-destructive" />
              <span className="text-sm text-muted-foreground">Admin</span>
            </div>
            <p className="text-xl font-bold text-destructive">
              {logs.filter((l) => l.action.startsWith('admin.')).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-chart-3" />
              <span className="text-sm text-muted-foreground">Billing</span>
            </div>
            <p className="text-xl font-bold text-chart-3">
              {logs.filter((l) => l.action.startsWith('billing.')).length}
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
                placeholder="Search by admin, target ID, or action..."
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
                label="Action Category"
                options={actionCategories}
                value={filters.action || ''}
                onChange={(e) => handleFilterChange('action', e.target.value)}
              />
              <Select
                label="Target Type"
                options={[
                  { value: '', label: 'All Types' },
                  { value: 'user', label: 'User' },
                  { value: 'subscription', label: 'Subscription' },
                  { value: 'tool', label: 'Tool' },
                  { value: 'category', label: 'Category' },
                  { value: 'feature_flag', label: 'Feature Flag' },
                  { value: 'system', label: 'System' },
                ]}
                value={filters.targetType || ''}
                onChange={(e) => handleFilterChange('targetType', e.target.value)}
              />
              <Input
                label="Date From"
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
              <Input
                label="Date To"
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
              <Input
                label="Admin ID"
                placeholder="Filter by admin..."
                value={filters.adminId || ''}
                onChange={(e) => handleFilterChange('adminId', e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent noPadding>
          <DataTable
            data={logs}
            columns={columns}
            loading={isLoading}
            emptyMessage="No activity logs found"
            pagination={pagination ? {
              ...pagination,
              onPageChange: handlePageChange,
            } : undefined}
          />
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Modal
        open={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedLog(null);
        }}
        title="Log Details"
        description={selectedLog ? formatAction(selectedLog.action) : ''}
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Action</p>
                <p className="font-mono text-sm">{selectedLog.action}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Timestamp</p>
                <p className="font-mono text-sm">{new Date(selectedLog.createdAt).toISOString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Admin</p>
                <p className="font-mono text-sm">{selectedLog.adminId || 'System'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">IP Address</p>
                <p className="font-mono text-sm">{selectedLog.ipAddress || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Target Type</p>
                <p className="font-mono text-sm">{selectedLog.targetType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Target ID</p>
                <p className="font-mono text-sm">{selectedLog.targetId}</p>
              </div>
            </div>
            
            {selectedLog.changes && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Changes</p>
                <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                  {JSON.stringify(selectedLog.changes, null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.metadata && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Additional Metadata</p>
                <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
