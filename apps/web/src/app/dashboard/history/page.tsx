'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function HistoryPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.tools.getMyExecutions.useQuery(
    { page, pageSize: 20 },
    { enabled: !!user }
  );

  const history = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((history.length === 20 ? page + 1 : page)));

  if (authLoading) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Usage History</h1>
        <p className="text-muted-foreground mt-1">View your tool execution history</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Executions</CardTitle>
          <CardDescription>Your tool usage for the past 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto mb-4 opacity-50"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <p>No usage history yet</p>
              <p className="text-sm mt-1">Start using tools to see your history here</p>
              {/* TODO: Link to /tools once tool browse page is built (Task 1000) */}
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {history.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <Link
                          href={`/dashboard/history`}
                          className="font-medium hover:text-primary"
                          // TODO: Link to /tools/${record.toolId} once tool routes are built (Task 1000)
                        >
                          {record.toolId}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {new Date(record.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={record.status === 'succeeded' ? 'success' : 'destructive'}>
                        {record.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {record.executionTime ?? 0}ms
                      </span>
                      {record.coinCost > 0 && (
                        <span className="text-sm font-medium">-{record.coinCost} coins</span>
                      )}
                      <Link href={`/dashboard/history`}>
                        {/* TODO: Link to /tools/${record.toolId} for re-run once tool routes are built (Task 1000) */}
                        <Button variant="ghost" size="sm" className="gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                          Re-run
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

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
                    disabled={page === totalPages}
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
