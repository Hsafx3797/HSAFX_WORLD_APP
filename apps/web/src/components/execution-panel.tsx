'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useExecutionStore, type ExecutionRecord } from '@/stores/execution-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Download,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Coins,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  ExecutionPanel — shows status, output, and history for tool runs  */
/* ------------------------------------------------------------------ */

interface ExecutionPanelProps {
  toolId: string;
  onExecute?: () => void;
  onRetry?: () => void;
  loading?: boolean;
  className?: string;
}

const statusConfig = {
  idle: { label: 'Ready', icon: Play, variant: 'secondary' as const, color: 'text-muted-foreground' },
  running: { label: 'Running...', icon: Loader2, variant: 'default' as const, color: 'text-primary' },
  completed: { label: 'Completed', icon: CheckCircle2, variant: 'success' as const, color: 'text-success' },
  failed: { label: 'Failed', icon: XCircle, variant: 'destructive' as const, color: 'text-destructive' },
  queued: { label: 'Queued', icon: Clock, variant: 'warning' as const, color: 'text-warning' },
} as const;

export function ExecutionPanel({
  toolId,
  onExecute,
  onRetry,
  loading,
  className,
}: ExecutionPanelProps) {
  const {
    currentStatus,
    currentOutput,
    currentError,
    currentCoinsCharged,
    currentJobId,
    getHistory,
  } = useExecutionStore();

  const [showHistory, setShowHistory] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const history = getHistory(toolId);
  const config = statusConfig[currentStatus];
  const StatusIcon = config.icon;

  const handleCopy = React.useCallback(async () => {
    if (!currentOutput) return;
    await navigator.clipboard.writeText(currentOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [currentOutput]);

  const handleDownload = React.useCallback(() => {
    if (!currentOutput) return;
    const blob = new Blob([currentOutput], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${toolId}-output.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentOutput, toolId]);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Execution</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={config.variant} className="gap-1">
              <StatusIcon className={cn('h-3 w-3', currentStatus === 'running' && 'animate-spin')} />
              {config.label}
            </Badge>
            {currentCoinsCharged > 0 && (
              <Badge variant="outline" className="gap-1">
                <Coins className="h-3 w-3" />
                {currentCoinsCharged}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Progress bar while running */}
        {currentStatus === 'running' && (
          <Progress value={undefined} className="animate-pulse" />
        )}

        {/* Error message */}
        {currentStatus === 'failed' && currentError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {currentError}
          </div>
        )}

        {/* Queued info */}
        {currentStatus === 'queued' && currentJobId && (
          <div className="rounded-md bg-warning/10 p-3 text-sm text-warning-foreground">
            Job queued. ID: <code className="text-xs">{currentJobId}</code>
          </div>
        )}

        {/* Output display */}
        {currentOutput && (
          <div className="relative">
            <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-sm whitespace-pre-wrap break-words">
              {currentOutput}
            </pre>
            <div className="absolute right-2 top-2 flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
                <Copy className="h-3.5 w-3.5" />
                <span className="sr-only">{copied ? 'Copied' : 'Copy'}</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDownload}>
                <Download className="h-3.5 w-3.5" />
                <span className="sr-only">Download</span>
              </Button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {onExecute && (
            <Button
              onClick={onExecute}
              disabled={currentStatus === 'running' || loading}
              loading={currentStatus === 'running' || loading}
              className="flex-1"
            >
              {currentStatus === 'running' ? 'Executing...' : 'Execute'}
            </Button>
          )}
          {currentStatus === 'failed' && onRetry && (
            <Button variant="outline" onClick={onRetry}>
              <RotateCcw className="mr-1 h-4 w-4" />
              Retry
            </Button>
          )}
        </div>

        {/* History toggle */}
        {history.length > 0 && (
          <div>
            <button
              className="flex w-full items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
              onClick={() => setShowHistory(!showHistory)}
            >
              <span>History ({history.length})</span>
              {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showHistory && (
              <div className="mt-2 max-h-48 space-y-2 overflow-auto">
                {history.map((record) => (
                  <HistoryItem key={record.id} record={record} />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HistoryItem({ record }: { record: ExecutionRecord }) {
  const date = new Date(record.timestamp);
  const Icon = record.status === 'completed' ? CheckCircle2 : XCircle;

  return (
    <div className="flex items-start gap-2 rounded-md border p-2 text-xs">
      <Icon
        className={cn(
          'mt-0.5 h-3.5 w-3.5 shrink-0',
          record.status === 'completed' ? 'text-success' : 'text-destructive'
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">
            {date.toLocaleTimeString()}
          </span>
          {record.coinsCharged > 0 && (
            <span className="text-muted-foreground">{record.coinsCharged} coins</span>
          )}
        </div>
        {record.duration != null && (
          <span className="text-muted-foreground">{record.duration}ms</span>
        )}
        <p className="truncate text-foreground">
          {record.status === 'failed' ? record.error : record.output.slice(0, 80)}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ExecutionPanelSkeleton — loading placeholder                      */
/* ------------------------------------------------------------------ */

export function ExecutionPanelSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}
