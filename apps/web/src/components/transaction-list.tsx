'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowDownLeft, ArrowUpRight, Coins, Gift, ShoppingCart, Zap } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  TransactionList — paginated list of coin transactions             */
/* ------------------------------------------------------------------ */

export interface Transaction {
  id: string;
  amount: number;
  balanceAfter: number;
  transactionType: string;
  description?: string;
  createdAt: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  loading?: boolean;
  className?: string;
}

const typeIcons: Record<string, React.ElementType> = {
  grant: Gift,
  spend: Zap,
  purchase: ShoppingCart,
  refund: ArrowDownLeft,
};

const typeColors: Record<string, string> = {
  grant: 'text-emerald-500',
  spend: 'text-orange-500',
  purchase: 'text-blue-500',
  refund: 'text-purple-500',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

/** Group transactions by date label */
function groupByDate(txs: Transaction[]): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>();
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86_400_000).toDateString();

  for (const tx of txs) {
    const ds = new Date(tx.createdAt).toDateString();
    let label: string;
    if (ds === today) label = 'Today';
    else if (ds === yesterday) label = 'Yesterday';
    else label = formatDate(tx.createdAt);

    const list = groups.get(label) ?? [];
    list.push(tx);
    groups.set(label, list);
  }
  return groups;
}

export function TransactionList({ transactions, loading, className }: TransactionListProps) {
  if (loading) return <TransactionListSkeleton className={className} />;

  const grouped = groupByDate(transactions);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Coins className="h-4 w-4" />
          Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No transactions yet
          </p>
        ) : (
          <div className="space-y-4">
            {Array.from(grouped.entries()).map(([dateLabel, txs]) => (
              <div key={dateLabel}>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {dateLabel}
                </p>
                <div className="space-y-1">
                  {txs.map((tx) => (
                    <TransactionRow key={tx.id} tx={tx} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  TransactionRow                                                    */
/* ------------------------------------------------------------------ */

function TransactionRow({ tx }: { tx: Transaction }) {
  const Icon = typeIcons[tx.transactionType] ?? Coins;
  const color = typeColors[tx.transactionType] ?? 'text-muted-foreground';
  const isPositive = tx.amount > 0;

  return (
    <div className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50">
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted', color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium capitalize">
          {tx.description ?? tx.transactionType}
        </p>
        <p className="text-xs text-muted-foreground">{formatTime(tx.createdAt)}</p>
      </div>
      <div className="text-right">
        <p
          className={cn(
            'text-sm font-semibold tabular-nums',
            isPositive ? 'text-emerald-500' : 'text-red-500'
          )}
        >
          {isPositive ? '+' : ''}
          {tx.amount.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground tabular-nums">
          bal {tx.balanceAfter.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TransactionListSkeleton                                           */
/* ------------------------------------------------------------------ */

export function TransactionListSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-28" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="space-y-1 text-right">
              <Skeleton className="ml-auto h-4 w-12" />
              <Skeleton className="ml-auto h-3 w-16" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
