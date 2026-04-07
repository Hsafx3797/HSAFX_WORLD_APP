/**
 * B2B Usage Dashboard Page
 * Table view of usage data with date range and suite filters.
 */

'use client';

import { useState } from 'react';
import { useB2bUsage, useB2bSuites } from '@/lib/hooks';
import type { B2bUsageRow } from '@/lib/types';
import { DataTable, type Column } from '@/components/ui';

export default function B2bUsagePage() {
  const { suites } = useB2bSuites();
  const [page, setPage] = useState(1);
  const [suiteFilter, setSuiteFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { usage, total, totalPages, isLoading } = useB2bUsage({
    page,
    limit: 50,
    suiteId: suiteFilter || undefined,
    from: from || undefined,
    to: to || undefined,
  });

  const columns: Column<B2bUsageRow>[] = [
    {
      key: 'userName',
      header: 'User',
      render: (r) => (
        <div>
          <div className="font-medium">{r.userName}</div>
          <div className="text-xs text-muted-foreground">{r.userEmail}</div>
        </div>
      ),
    },
    {
      key: 'suiteName',
      header: 'Suite',
      render: (r) => (
        <div>
          <div>{r.suiteName}</div>
          <div className="text-xs text-muted-foreground font-mono">{r.suiteSlug}</div>
        </div>
      ),
    },
    {
      key: 'usageCount',
      header: 'Operations',
      sortable: true,
      render: (r) => <span className="font-semibold tabular-nums">{r.usageCount.toLocaleString()}</span>,
    },
    {
      key: 'periodStart',
      header: 'Period',
      render: (r) => (
        <span className="text-sm">
          {new Date(r.periodStart).toLocaleDateString()} — {new Date(r.periodEnd).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Last Updated',
      sortable: true,
      render: (r) => new Date(r.updatedAt).toLocaleString(),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">B2B Usage</h1>
        <p className="text-sm text-muted-foreground">View engine usage per user per suite per billing period</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={suiteFilter}
          onChange={(e) => { setSuiteFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-input bg-background text-foreground rounded-lg text-sm"
        >
          <option value="">All suites</option>
          {suites.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">From:</label>
          <input
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-input bg-background text-foreground rounded-lg text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">To:</label>
          <input
            type="date"
            value={to}
            onChange={(e) => { setTo(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-input bg-background text-foreground rounded-lg text-sm"
          />
        </div>
        {(suiteFilter || from || to) && (
          <button
            onClick={() => { setSuiteFilter(''); setFrom(''); setTo(''); setPage(1); }}
            className="text-sm text-primary hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <DataTable
        data={usage}
        columns={columns}
        loading={isLoading}
        pagination={{ page, limit: 50, total, totalPages, onPageChange: setPage }}
        emptyMessage="No usage data found"
      />
    </div>
  );
}
