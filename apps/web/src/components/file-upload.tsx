'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useFileUpload } from '@/hooks/use-file-upload';
import { Button } from './ui/button';

interface FileUploadProps {
  accept?: string[];
  maxSize?: number;
  maxFiles?: number;
  onChange?: (files: File[]) => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

export function FileUpload({
  accept,
  maxSize = 10 * 1024 * 1024,
  maxFiles = 10,
  onChange,
  onError,
  className,
  disabled,
}: FileUploadProps) {
  const {
    files,
    isDragging,
    error,
    inputProps,
    dropZoneProps,
    removeFile,
    clearFiles,
    openFilePicker,
  } = useFileUpload({
    accept,
    maxSize,
    maxFiles,
    onUpload: onChange,
    onError,
  });

  return (
    <div className={cn('w-full', className)}>
      <div
        {...dropZoneProps}
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50',
          disabled && 'pointer-events-none opacity-50',
          error && 'border-destructive'
        )}
      >
        <input {...inputProps} disabled={disabled} />
        
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
          className="h-10 w-10 text-muted-foreground mb-4"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" x2="12" y1="3" y2="15" />
        </svg>
        
        <p className="text-sm text-muted-foreground mb-2">
          Drag & drop files here, or click to browse
        </p>
        
        <p className="text-xs text-muted-foreground">
          {accept ? `Accepted: ${accept.join(', ')}` : 'All file types accepted'}
          {' • '}
          Max {formatBytes(maxSize)}
          {maxFiles > 1 && ` • Up to ${maxFiles} files`}
        </p>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={openFilePicker}
          disabled={disabled}
        >
          Browse Files
        </Button>
      </div>

      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {files.length} file{files.length > 1 ? 's' : ''} selected
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFiles}
            >
              Clear all
            </Button>
          </div>
          
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileIcon filename={file.name} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => removeFile(index)}
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
                    className="h-4 w-4"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function FileIcon({ filename }: { filename: string }) {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const iconMap: Record<string, string> = {
    pdf: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
    doc: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
    docx: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
    xls: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
    xlsx: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
    png: 'M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2l1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z',
    jpg: 'M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2l1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z',
    jpeg: 'M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2l1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z',
    gif: 'M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2l1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z',
    mp4: 'M23 7l-7 5 7 5V7zM14 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z',
    mp3: 'M9 18V5l12-2v13',
    zip: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
  };
  
  return (
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
      className="h-5 w-5 text-muted-foreground"
    >
      <path d={iconMap[ext || ''] || 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'} />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
