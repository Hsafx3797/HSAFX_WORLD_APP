'use client';

/**
 * File Executor
 * 
 * Handles all file conversion tools (image, PDF, video, audio converters).
 * Uses FileConverterLayout with file upload and download.
 */

import * as React from 'react';
import type { ToolMetadata } from '@/lib/tools/types';
import { FileConverterLayout } from '../file-converter-layout';

// ============================================================================
// TOOL IDS
// ============================================================================

/** File converter tool IDs */
export const FILE_TOOL_IDS = new Set([
  // Image converters
  'image-to-png', 'image-to-jpg', 'image-to-webp', 'image-to-gif', 'image-to-ico',
  'image-resize', 'image-compress', 'image-crop', 'image-rotate',
  // PDF tools
  'pdf-merge', 'pdf-split', 'pdf-compress', 'pdf-to-image', 'image-to-pdf',
  // Video tools
  'video-to-mp4', 'video-to-gif', 'video-compress', 'video-resize',
  // Audio tools
  'audio-to-mp3', 'audio-to-wav', 'audio-compress',
  // Archive tools
  'zip-files', 'unzip-files', 'tar-files', 'gzip-files',
]);

// ============================================================================
// TYPE CHECK
// ============================================================================

/** Check if a tool ID belongs to file converter category */
export function isFileTool(toolId: string): boolean {
  return FILE_TOOL_IDS.has(toolId);
}

// ============================================================================
// FILE TYPE CONFIG
// ============================================================================

/** Get accepted file types for a tool */
function getAcceptedFileTypes(toolId: string): string[] {
  const mapping: Record<string, string[]> = {
    // Image tools
    'image-to-png': ['image/*'],
    'image-to-jpg': ['image/*'],
    'image-to-webp': ['image/*'],
    'image-to-gif': ['image/*'],
    'image-to-ico': ['image/*'],
    'image-resize': ['image/*'],
    'image-compress': ['image/*'],
    'image-crop': ['image/*'],
    'image-rotate': ['image/*'],
    // PDF tools
    'pdf-merge': ['.pdf'],
    'pdf-split': ['.pdf'],
    'pdf-compress': ['.pdf'],
    'pdf-to-image': ['.pdf'],
    'image-to-pdf': ['image/*'],
    // Video tools
    'video-to-mp4': ['video/*'],
    'video-to-gif': ['video/*'],
    'video-compress': ['video/*'],
    'video-resize': ['video/*'],
    // Audio tools
    'audio-to-mp3': ['audio/*'],
    'audio-to-wav': ['audio/*'],
    'audio-compress': ['audio/*'],
    // Archive tools
    'zip-files': ['*/*'],
    'unzip-files': ['.zip', '.tar', '.gz', '.rar', '.7z'],
    'tar-files': ['*/*'],
    'gzip-files': ['*/*'],
  };
  
  return mapping[toolId] || ['*/*'];
}

/** Check if tool accepts multiple files */
function allowsMultipleFiles(toolId: string): boolean {
  return toolId.includes('merge') || toolId === 'zip-files' || toolId === 'tar-files';
}

/** Check if tool should show preview */
function shouldShowPreview(toolId: string): boolean {
  return toolId.startsWith('image-') || toolId === 'pdf-to-image';
}

/** Get preview type for a tool */
function getPreviewType(toolId: string): 'image' | 'text' | 'pdf' | undefined {
  if (toolId.startsWith('image-') || toolId === 'pdf-to-image') return 'image';
  if (toolId.includes('pdf')) return 'pdf';
  // Audio/video tools don't support preview in FileConverterLayout
  return undefined;
}

// ============================================================================
// PROPS
// ============================================================================

export interface FileExecutorProps {
  tool: ToolMetadata;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FileExecutor({ tool }: FileExecutorProps) {
  const acceptTypes = getAcceptedFileTypes(tool.id);
  const maxFiles = allowsMultipleFiles(tool.id) ? 10 : 1;
  const showPreview = shouldShowPreview(tool.id);
  const previewType = getPreviewType(tool.id);

  // Create convert function
  // NOTE: This is a placeholder - actual file conversion requires server-side processing
  const convert = React.useCallback(
    async (files: File[]) => {
      const file = files[0]!;
      // TODO: Implement actual file conversion via server API
      return { 
        blob: file, 
        filename: `converted-${file.name}`, 
        mimeType: file.type 
      };
    },
    []
  );

  return (
    <FileConverterLayout
      toolId={tool.id}
      toolName={tool.name}
      accept={acceptTypes}
      maxFiles={maxFiles}
      convert={convert}
      toolOptions={tool.options}
      showPreview={showPreview}
      previewType={previewType}
    />
  );
}

export default FileExecutor;
