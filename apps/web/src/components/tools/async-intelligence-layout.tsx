'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

// Icons
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
);

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="9 12 12 15 16 10" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const LoaderIcon = () => (
  <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

// Job status types
type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface AsyncJob {
  id: string;
  identifier: string;
  status: JobStatus;
  progress: number;
  result?: Record<string, unknown>;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

// Status badge component
function StatusBadge({ status }: { status: JobStatus }) {
  const config = {
    pending: { icon: ClockIcon, color: 'bg-muted text-muted-foreground', label: 'Pending' },
    processing: { icon: LoaderIcon, color: 'bg-primary/10 text-primary', label: 'Processing' },
    completed: { icon: CheckCircleIcon, color: 'bg-chart-2/10 text-chart-2', label: 'Completed' },
    failed: { icon: XCircleIcon, color: 'bg-destructive/10 text-destructive', label: 'Failed' },
  };
  
  const { icon: Icon, color, label } = config[status];
  
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium', color)}>
      <Icon />
      {label}
    </span>
  );
}

// Result display component
function ResultDisplay({ result, identifier }: { result: Record<string, unknown>; identifier: string }) {
  const [copied, setCopied] = React.useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">Result for {identifier}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
          {copied ? <CheckIcon /> : <CopyIcon />}
        </Button>
      </div>
      <pre className="text-xs font-mono overflow-x-auto">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}

export interface AsyncIntelligenceLayoutProps {
  toolId: string;
  toolName: string;
  description?: string;
  identifierLabel?: string;
  identifierPlaceholder?: string;
  processIdentifier: (identifier: string) => Promise<Record<string, unknown>>;
  className?: string;
}

export function AsyncIntelligenceLayout({
  toolId,
  toolName,
  description,
  identifierLabel = 'Identifiers',
  identifierPlaceholder = 'Enter identifiers (one per line)',
  processIdentifier,
  className,
}: AsyncIntelligenceLayoutProps) {
  const [input, setInput] = React.useState('');
  const [jobs, setJobs] = React.useState<AsyncJob[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Parse identifiers from input
  const parseIdentifiers = (text: string): string[] => {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
  };

  // Process all identifiers
  const handleProcess = async () => {
    const identifiers = parseIdentifiers(input);
    if (identifiers.length === 0) {
      setError('Please enter at least one identifier');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    // Initialize jobs
    const newJobs: AsyncJob[] = identifiers.map((id, index) => ({
      id: `job-${Date.now()}-${index}`,
      identifier: id,
      status: 'pending',
      progress: 0,
      startedAt: new Date(),
    }));
    setJobs(newJobs);
    
    // Process each identifier
    for (let i = 0; i < newJobs.length; i++) {
      const job = newJobs[i]!;
      
      // Update to processing
      setJobs(prev => prev.map((j, idx) => 
        idx === i ? { ...j, status: 'processing' as JobStatus, progress: 0 } : j
      ));
      
      try {
        // Simulate progress
        for (let p = 0; p <= 80; p += 20) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setJobs(prev => prev.map((j, idx) => 
            idx === i ? { ...j, progress: p } : j
          ));
        }
        
        // Actual processing
        const result = await processIdentifier(job.identifier);
        
        // Update to completed
        setJobs(prev => prev.map((j, idx) => 
          idx === i ? { 
            ...j, 
            status: 'completed' as JobStatus, 
            progress: 100, 
            result,
            completedAt: new Date(),
          } : j
        ));
      } catch (err) {
        // Update to failed
        setJobs(prev => prev.map((j, idx) => 
          idx === i ? { 
            ...j, 
            status: 'failed' as JobStatus, 
            progress: 100,
            error: err instanceof Error ? err.message : 'Processing failed',
            completedAt: new Date(),
          } : j
        ));
      }
    }
    
    setIsProcessing(false);
  };

  // Retry failed job
  const handleRetry = async (jobIndex: number) => {
    const job = jobs[jobIndex];
    if (!job) return;
    
    setJobs(prev => prev.map((j, idx) => 
      idx === jobIndex ? { ...j, status: 'processing' as JobStatus, progress: 0, error: undefined } : j
    ));
    
    try {
      const result = await processIdentifier(job.identifier);
      setJobs(prev => prev.map((j, idx) => 
        idx === jobIndex ? { 
          ...j, 
          status: 'completed' as JobStatus, 
          progress: 100, 
          result,
          completedAt: new Date(),
        } : j
      ));
    } catch (err) {
      setJobs(prev => prev.map((j, idx) => 
        idx === jobIndex ? { 
          ...j, 
          status: 'failed' as JobStatus, 
          progress: 100,
          error: err instanceof Error ? err.message : 'Processing failed',
          completedAt: new Date(),
        } : j
      ));
    }
  };

  // Clear all jobs
  const handleClear = () => {
    setJobs([]);
    setInput('');
    setError(null);
  };

  // Export results as JSON
  const handleExport = () => {
    const results = jobs
      .filter(j => j.status === 'completed' && j.result)
      .map(j => ({ identifier: j.identifier, result: j.result }));
    
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${toolId}-results.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Stats
  const stats = {
    total: jobs.length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
    pending: jobs.filter(j => j.status === 'pending' || j.status === 'processing').length,
  };

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <SearchIcon />
        <h2 className="text-lg font-semibold">{toolName}</h2>
      </div>
      
      {description && (
        <p className="text-muted-foreground">{description}</p>
      )}

      {/* Input section */}
      <div className="p-6 rounded-xl border border-border bg-card">
        <label className="text-sm font-medium block mb-2">{identifierLabel}</label>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={identifierPlaceholder}
          className="min-h-30 font-mono text-sm"
          disabled={isProcessing}
        />
        <p className="text-xs text-muted-foreground mt-2">
          {parseIdentifiers(input).length} identifier(s) detected
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleProcess}
          disabled={isProcessing || !input.trim()}
          size="lg"
          className="gap-2"
        >
          <SearchIcon />
          {isProcessing ? 'Processing...' : 'Process All'}
        </Button>
        
        {jobs.length > 0 && (
          <>
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={isProcessing}
              className="gap-2"
            >
              Clear
            </Button>
            
            {stats.completed > 0 && (
              <Button
                variant="outline"
                onClick={handleExport}
                className="gap-2"
              >
                <DownloadIcon />
                Export Results
              </Button>
            )}
          </>
        )}
      </div>

      {/* Results section */}
      {jobs.length > 0 && (
        <div className="space-y-4">
          {/* Stats bar */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Progress</span>
                <span className="tabular-nums">{stats.completed + stats.failed}/{stats.total}</span>
              </div>
              <Progress value={((stats.completed + stats.failed) / stats.total) * 100} className="h-2" />
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1 text-chart-2">
                <CheckCircleIcon />
                {stats.completed}
              </span>
              <span className="flex items-center gap-1 text-destructive">
                <XCircleIcon />
                {stats.failed}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <ClockIcon />
                {stats.pending}
              </span>
            </div>
          </div>

          {/* Jobs list */}
          <div className="space-y-3">
            {jobs.map((job, index) => (
              <div
                key={job.id}
                className={cn(
                  'p-4 rounded-lg border transition-colors',
                  job.status === 'completed' && 'border-chart-2/20 bg-chart-2/5',
                  job.status === 'failed' && 'border-destructive/20 bg-destructive/5',
                  job.status === 'processing' && 'border-primary/20 bg-primary/5',
                  job.status === 'pending' && 'border-border bg-card'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <code className="text-sm font-mono truncate max-w-75">{job.identifier}</code>
                    <StatusBadge status={job.status} />
                  </div>
                  
                  {job.status === 'failed' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRetry(index)}
                      className="gap-1"
                    >
                      <RefreshIcon />
                      Retry
                    </Button>
                  )}
                </div>
                
                {job.status === 'processing' && (
                  <div className="mt-3">
                    <Progress value={job.progress} className="h-1.5" />
                  </div>
                )}
                
                {job.status === 'failed' && job.error && (
                  <p className="mt-2 text-sm text-destructive">{job.error}</p>
                )}
                
                {job.status === 'completed' && job.result && (
                  <ResultDisplay result={job.result} identifier={job.identifier} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help */}
      <p className="text-xs text-muted-foreground">
        Enter identifiers one per line. Lines starting with <code className="px-1 bg-muted rounded">#</code> are treated as comments.
      </p>
    </div>
  );
}

export default AsyncIntelligenceLayout;
