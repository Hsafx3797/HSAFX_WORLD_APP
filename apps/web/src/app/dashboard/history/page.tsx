'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const STATUS_OPTIONS = ['all', 'succeeded', 'failed', 'pending', 'running'] as const;

export default function HistoryPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [engineFilter, setEngineFilter] = useState('');
  const [selectedExec, setSelectedExec] = useState<string | null>(null);

  const { data, isLoading } = trpc.tools.getMyExecutions.useQuery(
    {
      page,
      pageSize: 20,
      ...(statusFilter !== 'all' ? { status: statusFilter as 'succeeded' | 'failed' | 'pending' | 'running' } : {}),
      ...(engineFilter ? { engineName: engineFilter } : {}),
    },
    { enabled: !!user }
  );

  const history = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  if (authLoading) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return null;

  const selectedRecord = selectedExec ? history.find((r) => r.id === selectedExec) : null;

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Usage History</h1>
        <p className="text-muted-foreground mt-1">
          View and filter your tool execution history
          {total > 0 && <span className="ml-1">({total.toLocaleString()} total)</span>}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {STATUS_OPTIONS.map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? 'default' : 'ghost'}
              size="sm"
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className="capitalize"
            >
              {s}
            </Button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Filter by engine name..."
          value={engineFilter}
          onChange={(e) => { setEngineFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-48"
        />
        {(statusFilter !== 'all' || engineFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setStatusFilter('all'); setEngineFilter(''); setPage(1); }}
          >
            Clear filters
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Executions</CardTitle>
          <CardDescription>Page {page} of {totalPages}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 opacity-50"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              <p>{statusFilter !== 'all' || engineFilter ? 'No matching executions' : 'No usage history yet'}</p>
              <p className="text-sm mt-1">
                {statusFilter !== 'all' || engineFilter ? 'Try adjusting your filters' : 'Start using tools to see your history here'}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {history.map((record) => {
                  const meta = record.metadata as Record<string, unknown> | null;
                  const engineName = meta?.engineName as string | undefined;
                  return (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedExec(selectedExec === record.id ? null : record.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">{engineName ?? record.toolId}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(record.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={record.status === 'succeeded' ? 'success' : record.status === 'failed' ? 'destructive' : 'secondary'}>
                          {record.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{record.executionTime ?? 0}ms</span>
                        {record.coinCost > 0 && (
                          <span className="text-sm font-medium">-{record.coinCost} coins</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Execution Details Panel */}
              {selectedRecord && (
                <div className="mt-4 p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Execution Details</h3>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedExec(null)}>Close</Button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 text-sm">
                    <div><span className="text-muted-foreground">ID:</span> <span className="font-mono text-xs">{selectedRecord.id}</span></div>
                    <div><span className="text-muted-foreground">Status:</span> {selectedRecord.status}</div>
                    <div><span className="text-muted-foreground">Duration:</span> {selectedRecord.executionTime ?? 0}ms</div>
                    <div><span className="text-muted-foreground">Coin Cost:</span> {selectedRecord.coinCost}</div>
                    <div><span className="text-muted-foreground">Input Size:</span> {selectedRecord.inputSize ? `${selectedRecord.inputSize} bytes` : '—'}</div>
                    <div><span className="text-muted-foreground">Output Size:</span> {selectedRecord.outputSize ? `${selectedRecord.outputSize} bytes` : '—'}</div>
                    <div><span className="text-muted-foreground">Created:</span> {new Date(selectedRecord.createdAt).toLocaleString()}</div>
                    <div><span className="text-muted-foreground">Completed:</span> {selectedRecord.completedAt ? new Date(selectedRecord.completedAt).toLocaleString() : '—'}</div>
                    {selectedRecord.errorMessage && (
                      <div className="sm:col-span-2">
                        <span className="text-muted-foreground">Error:</span>
                        <pre className="mt-1 p-2 bg-destructive/10 rounded text-xs overflow-auto">{selectedRecord.errorMessage}</pre>
                      </div>
                    )}
                    {selectedRecord.metadata && Object.keys(selectedRecord.metadata as object).length > 0 && (
                      <div className="sm:col-span-2">
                        <span className="text-muted-foreground">Metadata:</span>
                        <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                          {JSON.stringify(selectedRecord.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
