/**
 * Billing & Transactions Page
 * View and manage coin transactions, webhooks, and billing history
 */

'use client';

import { useState, useCallback } from 'react';
import {
  DollarSign,
  Search,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { useTransactions, useWebhooks } from '@/lib/hooks';
import type { CoinTransaction, TransactionFilters, PaymentWebhook } from '@/lib/types';
import {
  DataTable,
  Card,
  CardContent,
  CardHeader,
  Button,
  Input,
  Select,
  Badge,
} from '@/components/ui';
import type { Column } from '@/components/ui';
import * as api from '@/lib/api';

type TransactionType = 'grant' | 'purchase' | 'spend' | 'refund' | 'adjustment' | 'reward' | 'referral';

export default function BillingPage() {
  const [filters, setFilters] = useState<TransactionFilters>({ page: 1, limit: 50 });
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'transactions' | 'webhooks'>('transactions');
  const [exporting, setExporting] = useState(false);
  const [webhookPage, setWebhookPage] = useState(1);

  const { transactions, pagination, isLoading } = useTransactions(filters);
  const { webhooks, pagination: webhookPagination, isLoading: webhooksLoading, retry: retryWebhook } = useWebhooks(webhookPage);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const handleSearch = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, search: query, page: 1 }));
  }, []);

  const handleFilterChange = useCallback((key: keyof TransactionFilters, value: string) => {
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
      const blob = await api.exportTransactions(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } finally {
      setExporting(false);
    }
  }, [filters]);

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case 'grant':
        return <ArrowUpRight className="h-4 w-4 text-chart-4" />;
      case 'purchase':
        return <ArrowUpRight className="h-4 w-4 text-success" />;
      case 'spend':
        return <ArrowDownRight className="h-4 w-4 text-destructive" />;
      case 'reward':
      case 'referral':
        return <CheckCircle className="h-4 w-4 text-primary" />;
      case 'refund':
        return <RefreshCw className="h-4 w-4 text-chart-3" />;
      case 'adjustment':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <DollarSign className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTransactionVariant = (type: TransactionType): 'success' | 'danger' | 'warning' | 'info' | 'default' => {
    switch (type) {
      case 'grant':
      case 'purchase':
      case 'reward':
      case 'referral':
        return 'success';
      case 'spend':
        return 'danger';
      case 'refund':
        return 'warning';
      case 'adjustment':
        return 'info';
      default:
        return 'default';
    }
  };

  const columns: Column<CoinTransaction>[] = [
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      width: '120px',
      render: (tx) => (
        <div className="flex items-center gap-2">
          {getTransactionIcon(tx.type as TransactionType)}
          <Badge variant={getTransactionVariant(tx.type as TransactionType)}>
            {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
          </Badge>
        </div>
      ),
    },
    {
      key: 'userId',
      header: 'User',
      sortable: true,
      render: (tx) => (
        <div>
          <p className="font-medium text-foreground">{tx.user?.email || tx.userId}</p>
          <p className="text-xs text-muted-foreground font-mono">{tx.id.slice(0, 8)}...</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      width: '120px',
      render: (tx) => (
        <span className={`font-mono font-medium ${(tx.amount ?? 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
          {(tx.amount ?? 0) >= 0 ? '+' : ''}{(tx.amount ?? 0).toLocaleString()} 🪙
        </span>
      ),
    },
    {
      key: 'balanceAfter',
      header: 'Balance After',
      sortable: true,
      width: '120px',
      render: (tx) => (
        <span className="font-mono text-sm text-muted-foreground">
          {(tx.balanceAfter ?? 0).toLocaleString()} 🪙
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (tx) => (
        <span className="text-sm text-muted-foreground truncate max-w-xs block">
          {tx.description || '-'}
        </span>
      ),
    },
    {
      key: 'metadata',
      header: 'Reference',
      width: '150px',
      render: (tx) => (
        <span className="text-xs font-mono text-muted-foreground">
          {(tx.metadata as any)?.toolId || (tx.metadata as any)?.subscriptionId || (tx.metadata as any)?.adId || '-'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      sortable: true,
      width: '160px',
      render: (tx) => (
        <div className="text-sm">
          <p className="text-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
          <p className="text-muted-foreground">{new Date(tx.createdAt).toLocaleTimeString()}</p>
        </div>
      ),
    },
  ];

  const stats = {
    totalPurchases: transactions.filter((t) => t.type === 'purchase').reduce((sum, t) => sum + t.amount, 0),
    totalUsage: transactions.filter((t) => t.type === 'spend').reduce((sum, t) => sum + Math.abs(t.amount), 0),
    totalRewards: transactions.filter((t) => t.type === 'reward' || t.type === 'referral' || t.type === 'grant').reduce((sum, t) => sum + t.amount, 0),
    totalRefunds: transactions.filter((t) => t.type === 'refund').reduce((sum, t) => sum + t.amount, 0),
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-success/10 rounded-lg">
            <DollarSign className="h-6 w-6 text-success" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Billing & Transactions</h1>
            <p className="text-sm text-muted-foreground">View coin transactions and billing history</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" icon={<Download className="h-4 w-4" />} onClick={handleExport} loading={exporting}>
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><ArrowUpRight className="h-5 w-5 text-success" /><p className="text-sm text-muted-foreground">Total Purchased</p></div><p className="text-2xl font-bold text-success">{stats.totalPurchases.toLocaleString()} 🪙</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><ArrowDownRight className="h-5 w-5 text-destructive" /><p className="text-sm text-muted-foreground">Total Used</p></div><p className="text-2xl font-bold text-destructive">{stats.totalUsage.toLocaleString()} 🪙</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" /><p className="text-sm text-muted-foreground">Total Rewards</p></div><p className="text-2xl font-bold text-primary">{stats.totalRewards.toLocaleString()} 🪙</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><RefreshCw className="h-5 w-5 text-chart-3" /><p className="text-sm text-muted-foreground">Total Refunds</p></div><p className="text-2xl font-bold text-chart-3">{stats.totalRefunds.toLocaleString()} 🪙</p></CardContent></Card>
      </div>

      <div className="border-b border-border">
        <nav className="flex gap-4">
          <button className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'transactions' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`} onClick={() => setActiveTab('transactions')}>Transactions</button>
          <button className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'webhooks' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`} onClick={() => setActiveTab('webhooks')}>Payment Webhooks</button>
        </nav>
      </div>

      {activeTab === 'transactions' && (
        <>
          <Card>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1"><Input placeholder="Search by user email or transaction ID..." icon={<Search className="h-4 w-4" />} onChange={(e) => handleSearch(e.target.value)} /></div>
                <Button variant={showFilters ? 'primary' : 'outline'} icon={<Filter className="h-4 w-4" />} onClick={() => setShowFilters(!showFilters)}>Filters</Button>
              </div>
              {showFilters && (
                <div className="mt-4 pt-4 border-t grid grid-cols-4 gap-4">
                  <Select label="Type" options={[{ value: '', label: 'All Types' },{ value: 'grant', label: 'Grant' },{ value: 'purchase', label: 'Purchase' },{ value: 'spend', label: 'Spend' },{ value: 'reward', label: 'Reward' },{ value: 'referral', label: 'Referral' },{ value: 'refund', label: 'Refund' },{ value: 'adjustment', label: 'Adjustment' }]} value={filters.type || ''} onChange={(e) => handleFilterChange('type', e.target.value)} />
                  <Input label="Date From" type="date" value={filters.dateFrom || ''} onChange={(e) => handleFilterChange('dateFrom', e.target.value)} />
                  <Input label="Date To" type="date" value={filters.dateTo || ''} onChange={(e) => handleFilterChange('dateTo', e.target.value)} />
                  <Select label="Sort By" options={[{ value: 'createdAt', label: 'Date' },{ value: 'amount', label: 'Amount' }]} value={filters.sortBy || 'createdAt'} onChange={(e) => handleFilterChange('sortBy', e.target.value)} />
                </div>
              )}
            </CardContent>
          </Card>
          <Card><CardContent noPadding><DataTable data={transactions} columns={columns} loading={isLoading} emptyMessage="No transactions found" pagination={pagination ? { ...pagination, onPageChange: handlePageChange } : undefined} /></CardContent></Card>
        </>
      )}

      {activeTab === 'webhooks' && (
        <Card>
          <CardHeader title="Payment Webhooks" description="Recent webhook events from payment providers" />
          <CardContent noPadding>
            <DataTable
              data={webhooks}
              columns={[
                {
                  key: 'provider',
                  header: 'Provider',
                  sortable: true,
                  width: '120px',
                  render: (wh: PaymentWebhook) => (
                    <Badge variant={wh.provider === 'stripe' ? 'info' : wh.provider === 'polar' ? 'primary' : 'default'}>
                      {wh.provider.charAt(0).toUpperCase() + wh.provider.slice(1)}
                    </Badge>
                  ),
                },
                {
                  key: 'eventType',
                  header: 'Event',
                  sortable: true,
                  render: (wh: PaymentWebhook) => (
                    <span className="text-sm font-mono text-foreground">{wh.eventType}</span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  sortable: true,
                  width: '120px',
                  render: (wh: PaymentWebhook) => (
                    <Badge variant={wh.status === 'success' ? 'success' : wh.status === 'failed' ? 'danger' : 'warning'}>
                      {wh.status === 'success' ? <CheckCircle className="h-3 w-3 mr-1 inline" /> : wh.status === 'failed' ? <AlertTriangle className="h-3 w-3 mr-1 inline" /> : <Clock className="h-3 w-3 mr-1 inline" />}
                      {wh.status.charAt(0).toUpperCase() + wh.status.slice(1)}
                    </Badge>
                  ),
                },
                {
                  key: 'statusCode',
                  header: 'Code',
                  width: '80px',
                  render: (wh: PaymentWebhook) => (
                    <span className={`font-mono text-sm ${wh.statusCode && wh.statusCode >= 200 && wh.statusCode < 300 ? 'text-success' : 'text-destructive'}`}>
                      {wh.statusCode || '—'}
                    </span>
                  ),
                },
                {
                  key: 'retryCount',
                  header: 'Retries',
                  width: '80px',
                  render: (wh: PaymentWebhook) => (
                    <span className="text-sm text-muted-foreground">{wh.retryCount}</span>
                  ),
                },
                {
                  key: 'createdAt',
                  header: 'Received',
                  sortable: true,
                  width: '160px',
                  render: (wh: PaymentWebhook) => (
                    <div className="text-sm">
                      <p className="text-foreground">{new Date(wh.createdAt).toLocaleDateString()}</p>
                      <p className="text-muted-foreground">{new Date(wh.createdAt).toLocaleTimeString()}</p>
                    </div>
                  ),
                },
              ] as Column<PaymentWebhook>[]}
              actions={[
                {
                  label: 'Retry',
                  icon: <RotateCcw className="h-4 w-4" />,
                  onClick: async (wh: PaymentWebhook) => {
                    setRetryingId(wh.id);
                    try {
                      await retryWebhook(wh.id);
                    } finally {
                      setRetryingId(null);
                    }
                  },
                  disabled: (wh: PaymentWebhook) => wh.status === 'success',
                },
              ]}
              loading={webhooksLoading}
              emptyMessage="No webhook events recorded"
              pagination={webhookPagination ? {
                ...webhookPagination,
                onPageChange: setWebhookPage,
              } : undefined}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
