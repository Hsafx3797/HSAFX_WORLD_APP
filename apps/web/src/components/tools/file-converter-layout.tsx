'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import type { ToolOption } from '@/lib/tools/types';

// Icons
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" x2="12" y1="3" y2="15" />
  </svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
);

const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const ImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// File type to icon mapping
function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'];
  
  if (imageExts.includes(ext)) {
    return <ImageIcon />;
  }
  return <FileIcon />;
}

// Tool option field component for dynamic form generation
interface ToolOptionFieldProps {
  option: ToolOption;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

function ToolOptionField({ option, value, onChange, disabled }: ToolOptionFieldProps) {
  const id = `opt-${option.name}`;
  
  if (option.type === 'select') {
    return (
      <div className="space-y-1.5">
        <label htmlFor={id} className="text-sm font-medium">
          {option.label}
          {option.required && <span className="text-destructive ml-1">*</span>}
        </label>
        <select
          id={id}
          value={(value as string | number) ?? option.default ?? option.defaultValue ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Select {option.label.toLowerCase()}...</option>
          {option.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {option.description && <p className="text-xs text-muted-foreground">{option.description}</p>}
      </div>
    );
  }
  
  if (option.type === 'boolean' || option.type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          id={id}
          checked={(value as boolean) ?? (option.default as boolean) ?? false}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="w-4 h-4 rounded border-input"
        />
        <span className="text-sm font-medium">{option.label}</span>
        {option.description && <span className="text-xs text-muted-foreground">({option.description})</span>}
      </label>
    );
  }
  
  if (option.type === 'number' || option.type === 'range') {
    return (
      <div className="space-y-1.5">
        <label htmlFor={id} className="text-sm font-medium">
          {option.label}
          {option.required && <span className="text-destructive ml-1">*</span>}
        </label>
        <Input
          id={id}
          type="number"
          value={(value as number) ?? option.default ?? option.defaultValue ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
          min={option.min}
          max={option.max}
          step={option.step || 1}
          placeholder={option.placeholder || option.description}
          disabled={disabled}
          className="font-mono"
        />
        {option.description && <p className="text-xs text-muted-foreground">{option.description}</p>}
      </div>
    );
  }

  if (option.type === 'color') {
    return (
      <div className="space-y-1.5">
        <label htmlFor={id} className="text-sm font-medium">
          {option.label}
          {option.required && <span className="text-destructive ml-1">*</span>}
        </label>
        <div className="flex gap-2">
          <input
            type="color"
            id={id}
            value={(value as string) ?? option.default ?? option.defaultValue ?? '#000000'}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="h-10 w-14 rounded border border-input cursor-pointer"
          />
          <Input
            type="text"
            value={(value as string) ?? option.default ?? option.defaultValue ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#000000"
            disabled={disabled}
            className="font-mono flex-1"
          />
        </div>
        {option.description && <p className="text-xs text-muted-foreground">{option.description}</p>}
      </div>
    );
  }
  
  // Default: string/text input
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {option.label}
        {option.required && <span className="text-destructive ml-1">*</span>}
      </label>
      <Input
        id={id}
        type="text"
        value={(value as string) ?? option.default ?? option.defaultValue ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={option.placeholder || option.description}
        disabled={disabled}
      />
      {option.description && <p className="text-xs text-muted-foreground">{option.description}</p>}
    </div>
  );
}

export interface FileConverterLayoutProps {
  toolId: string;
  toolName: string;
  accept: string[];
  maxSize?: number;
  maxFiles?: number;
  convert: (files: File[], options?: Record<string, unknown>) => Promise<{
    blob: Blob;
    filename: string;
    mimeType: string;
  } | { blob: Blob; filename: string; mimeType: string }[]>;
  /** Tool options from registry - will be rendered as dynamic form fields */
  toolOptions?: ToolOption[];
  /** Legacy: Custom options as ReactNode (deprecated, use toolOptions instead) */
  options?: React.ReactNode;
  showPreview?: boolean;
  previewType?: 'image' | 'pdf' | 'text';
  className?: string;
}

interface FileWithPreview extends File {
  preview?: string;
}

export function FileConverterLayout({
  toolId,
  toolName,
  accept,
  maxSize = 50 * 1024 * 1024, // 50MB default
  maxFiles = 10,
  convert,
  toolOptions,
  options,
  showPreview = false,
  previewType = 'image',
  className,
}: FileConverterLayoutProps) {
  const [files, setFiles] = React.useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isConverting, setIsConverting] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [results, setResults] = React.useState<{ blob: Blob; filename: string; mimeType: string }[]>([]);
  const [optionValues, setOptionValues] = React.useState<Record<string, unknown>>(() => {
    // Initialize options from defaults
    const defaults: Record<string, unknown> = {};
    toolOptions?.forEach(opt => {
      if (opt.default !== undefined) defaults[opt.name] = opt.default;
      else if (opt.defaultValue !== undefined) defaults[opt.name] = opt.defaultValue;
    });
    return defaults;
  });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Update option value
  const updateOptionValue = (name: string, value: unknown) => {
    setOptionValues(prev => ({ ...prev, [name]: value }));
  };

  // Cleanup previews on unmount
  React.useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  // Validate file
  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `File "${file.name}" exceeds ${formatBytes(maxSize)} limit`;
    }
    
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const mimeMatch = accept.some(a => {
      if (a.startsWith('.')) return ext === a.toLowerCase();
      if (a.endsWith('/*')) return file.type.startsWith(a.replace('/*', '/'));
      return file.type === a;
    });
    
    if (!mimeMatch && accept.length > 0 && !accept.includes('*/*')) {
      return `File type not accepted: ${file.name}`;
    }
    
    return null;
  };

  // Handle file selection
  const handleFiles = (newFiles: FileList | File[]) => {
    const validFiles: FileWithPreview[] = [];
    const errors: string[] = [];
    
    Array.from(newFiles).forEach(file => {
      if (files.length + validFiles.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        return;
      }
      
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(validationError);
        return;
      }
      
      // Create preview for images
      const fileWithPreview = file as FileWithPreview;
      if (showPreview && previewType === 'image' && file.type.startsWith('image/')) {
        fileWithPreview.preview = URL.createObjectURL(file);
      }
      
      validFiles.push(fileWithPreview);
    });
    
    if (errors.length > 0) {
      setError(errors.join('. '));
    } else {
      setError(null);
    }
    
    setFiles(prev => [...prev, ...validFiles]);
    setResults([]);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  // Remove file
  const removeFile = (index: number) => {
    setFiles(prev => {
      const file = prev[index];
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
    setResults([]);
  };

  // Clear all files
  const clearFiles = () => {
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
    setResults([]);
    setError(null);
  };

  // Handle convert
  const handleConvert = async () => {
    if (files.length === 0) return;
    
    setIsConverting(true);
    setProgress(0);
    setError(null);
    setResults([]);
    
    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 10, 90));
      }, 200);
      
      const result = await convert(files, optionValues);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      // Normalize result to array
      const resultsArray = Array.isArray(result) ? result : [result];
      setResults(resultsArray);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
    } finally {
      setIsConverting(false);
    }
  };

  // Download result
  const downloadResult = (result: { blob: Blob; filename: string; mimeType: string }) => {
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download all results
  const downloadAll = () => {
    results.forEach(result => downloadResult(result));
  };

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all cursor-pointer',
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30',
          isConverting && 'pointer-events-none opacity-60'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept.join(',')}
          multiple={maxFiles > 1}
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          disabled={isConverting}
        />
        
        <div className="p-4 rounded-full bg-primary/10 text-primary mb-4">
          <UploadIcon />
        </div>
        
        <p className="text-base font-medium text-foreground mb-1">
          Drop files here or click to browse
        </p>
        
        <p className="text-sm text-muted-foreground">
          {accept.length > 0 ? `Accepted: ${accept.join(', ')}` : 'All file types accepted'}
          {' • '}Max {formatBytes(maxSize)}
          {maxFiles > 1 && ` • Up to ${maxFiles} files`}
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {files.length} file{files.length > 1 ? 's' : ''} selected
            </span>
            <Button variant="ghost" size="sm" onClick={clearFiles} disabled={isConverting}>
              Clear all
            </Button>
          </div>
          
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
              >
                {/* Preview thumbnail */}
                {file.preview ? (
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded bg-muted flex items-center justify-center text-muted-foreground">
                    {getFileIcon(file.name)}
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  disabled={isConverting}
                >
                  <XIcon />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Dynamic options panel from toolOptions */}
      {(toolOptions && toolOptions.length > 0) && files.length > 0 && (
        <div className="p-4 rounded-lg border border-border bg-muted/30">
          <h3 className="text-sm font-medium mb-3">Conversion Options</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {toolOptions.map((opt) => (
              <ToolOptionField
                key={opt.name}
                option={opt}
                value={optionValues[opt.name]}
                onChange={(value) => updateOptionValue(opt.name, value)}
                disabled={isConverting}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Legacy options panel (deprecated) */}
      {options && !toolOptions && files.length > 0 && (
        <div className="p-4 rounded-lg border border-border bg-muted/30">
          <h3 className="text-sm font-medium mb-3">Options</h3>
          {options}
        </div>
      )}

      {/* Progress bar */}
      {isConverting && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Converting...</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Convert button */}
      {files.length > 0 && results.length === 0 && (
        <Button
          onClick={handleConvert}
          disabled={isConverting}
          size="lg"
          className="w-full sm:w-auto sm:mx-auto gap-2"
        >
          {isConverting ? 'Converting...' : `Convert to ${toolName}`}
        </Button>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4 p-6 rounded-xl border border-primary/20 bg-primary/5">
          <div className="flex items-center gap-2 text-primary">
            <CheckCircleIcon />
            <span className="font-medium">Conversion complete!</span>
          </div>
          
          <ul className="space-y-2">
            {results.map((result, index) => (
              <li
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-background border border-border"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-muted-foreground">
                    {getFileIcon(result.filename)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{result.filename}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(result.blob.size)}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadResult(result)}
                  className="gap-2 shrink-0"
                >
                  <DownloadIcon />
                  Download
                </Button>
              </li>
            ))}
          </ul>
          
          {results.length > 1 && (
            <Button onClick={downloadAll} className="w-full gap-2">
              <DownloadIcon />
              Download All
            </Button>
          )}
          
          <Button variant="outline" onClick={clearFiles} className="w-full">
            Convert more files
          </Button>
        </div>
      )}
    </div>
  );
}

export default FileConverterLayout;
