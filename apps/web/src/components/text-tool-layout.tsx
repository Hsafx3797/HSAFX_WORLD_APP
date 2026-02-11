'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { useCopyToClipboard } from '@/hooks/use-utils';

interface TextToolLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function TextToolLayout({ children, className }: TextToolLayoutProps) {
  return (
    <div className={cn('grid gap-6 lg:grid-cols-2', className)}>
      {children}
    </div>
  );
}

interface TextToolInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  rows?: number;
  actions?: React.ReactNode;
}

export function TextToolInput({
  value,
  onChange,
  placeholder = 'Enter your text here...',
  label = 'Input',
  className,
  rows = 12,
  actions,
}: TextToolInputProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange(event.target?.result as string || '');
      };
      reader.readAsText(file);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onChange(text);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <div className="flex items-center gap-1">
          {actions}
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.json,.xml,.csv,.md,.yaml,.yml"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-7 text-xs"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5 mr-1"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" x2="12" y1="3" y2="15" />
            </svg>
            File
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePaste}
            className="h-7 text-xs"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5 mr-1"
            >
              <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            </svg>
            Paste
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-7 text-xs"
            disabled={!value}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5 mr-1"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
            Clear
          </Button>
        </div>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="font-mono text-sm"
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{value.length} characters</span>
        <span>{value.split(/\s+/).filter(Boolean).length} words</span>
        <span>{value.split('\n').length} lines</span>
      </div>
    </div>
  );
}

interface TextToolOutputProps {
  value: string;
  label?: string;
  className?: string;
  rows?: number;
  loading?: boolean;
  error?: string | null;
  onDownload?: () => void;
}

export function TextToolOutput({
  value,
  label = 'Output',
  className,
  rows = 12,
  loading,
  error,
  onDownload,
}: TextToolOutputProps) {
  const { copy, copied } = useCopyToClipboard();

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }

    const blob = new Blob([value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'output.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copy(value)}
            className="h-7 text-xs"
            disabled={!value || loading}
          >
            {copied ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5 mr-1"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5 mr-1"
                >
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
                Copy
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-7 text-xs"
            disabled={!value || loading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5 mr-1"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
            Download
          </Button>
        </div>
      </div>
      
      {error ? (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center rounded-md border bg-muted h-70">
          <svg
            className="animate-spin h-6 w-6 text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      ) : (
        <Textarea
          value={value}
          readOnly
          placeholder="Output will appear here..."
          rows={rows}
          className="font-mono text-sm bg-muted/50"
        />
      )}
      
      {value && !error && !loading && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{value.length} characters</span>
          <span>{value.split(/\s+/).filter(Boolean).length} words</span>
          <span>{value.split('\n').length} lines</span>
        </div>
      )}
    </div>
  );
}
