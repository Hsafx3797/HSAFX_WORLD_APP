'use client';

import { useState, useCallback, useRef } from 'react';

interface UseFileUploadOptions {
  maxSize?: number; // bytes
  maxFiles?: number;
  accept?: string[];
  onUpload?: (files: File[]) => void;
  onError?: (error: string) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    maxFiles = 10,
    accept,
    onUpload,
    onError,
  } = options;
  
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxSize) {
      return `File "${file.name}" exceeds maximum size of ${formatBytes(maxSize)}`;
    }
    
    if (accept && accept.length > 0) {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      const mimeType = file.type;
      
      const isValid = accept.some(type => {
        if (type.startsWith('.')) {
          return extension === type.toLowerCase();
        }
        if (type.endsWith('/*')) {
          return mimeType.startsWith(type.slice(0, -1));
        }
        return mimeType === type;
      });
      
      if (!isValid) {
        return `File type "${extension}" is not allowed`;
      }
    }
    
    return null;
  }, [maxSize, accept]);
  
  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    
    // Check max files
    if (files.length + fileArray.length > maxFiles) {
      const err = `Maximum ${maxFiles} files allowed`;
      setError(err);
      onError?.(err);
      return;
    }
    
    // Validate each file
    const validFiles: File[] = [];
    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        onError?.(validationError);
        return;
      }
      validFiles.push(file);
    }
    
    const updatedFiles = [...files, ...validFiles];
    setFiles(updatedFiles);
    setError(null);
    onUpload?.(updatedFiles);
  }, [files, maxFiles, validateFile, onError, onUpload]);
  
  const removeFile = useCallback((index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
  }, [files]);
  
  const clearFiles = useCallback(() => {
    setFiles([]);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);
  
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);
  
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
  }, [addFiles]);
  
  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);
  
  return {
    files,
    isDragging,
    error,
    inputRef,
    addFiles,
    removeFile,
    clearFiles,
    openFilePicker,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleInputChange,
    inputProps: {
      ref: inputRef,
      type: 'file' as const,
      multiple: maxFiles > 1,
      accept: accept?.join(','),
      onChange: handleInputChange,
      style: { display: 'none' },
    },
    dropZoneProps: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
