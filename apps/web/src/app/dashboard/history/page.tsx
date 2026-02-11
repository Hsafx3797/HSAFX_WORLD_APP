'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UsageRecord {
  id: string;
  toolId: string;
  toolName: string;
  executionTimeMs: number;
  coinsCharged: number;
  status: string;
  createdAt: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function HistoryPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [history, setHistory] = useState<UsageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user, page]);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE}/tools/history?page=${page}&per_page=20`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(
          data.history.map((h: Record<string, unknown>) => ({
            id: h.id,
            toolId: h.tool_id,
            toolName: h.tool_name,
            executionTimeMs: h.execution_time_ms,
            coinsCharged: h.coins_charged,
            status: h.status,
            createdAt: h.created_at,
          }))
        );
        setTotalPages(data.total_pages);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
              <Link href="/tools">
                <Button variant="outline" className="mt-4">
                  Browse Tools
                </Button>
              </Link>
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
                          href={`/tools/${record.toolId}`}
                          className="font-medium hover:text-primary"
                        >
                          {record.toolName || record.toolId}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {new Date(record.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={record.status === 'success' ? 'success' : 'destructive'}>
                        {record.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {record.executionTimeMs}ms
                      </span>
                      {record.coinsCharged > 0 && (
                        <span className="text-sm font-medium">-{record.coinsCharged} coins</span>
                      )}
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
