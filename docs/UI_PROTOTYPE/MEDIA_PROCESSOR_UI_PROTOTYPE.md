### FILE CONVERTER (Upload & Processing)

**UI Pattern:**
`[Dropzone / Upload] → [Settings / Options] → ([Canvas / Preview / Controls] optional) → [Download]`

```page.tsx
'use client';

import { useState, useEffect } from 'react';
import { FileConverterGrid } from '@/components/custom-ui/converters/file-format-converter/FileConverterGrid';
import { FILE_CONVERTERS } from '@/serverSide/fileFormatConverter/registry';
import type { FileConverter, SubscriptionTier } from '@/serverSide/fileFormatConverter/types';
import { SUBSCRIPTION_LIMITS } from '@/serverSide/fileFormatConverter/types';
import dynamic from 'next/dynamic';
import { useSession } from '@/contexts/SessionContext';
import { UpgradeModal } from '@/components/modals/UpgradeModal';

// Dynamic import for the dialog to reduce initial bundle size
const FileConverterDialog = dynamic(
  () => import('@/components/custom-ui/converters/file-format-converter/FileConverterDialog').then(mod => ({ default: mod.FileConverterDialog })),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse bg-muted h-96 rounded-lg" />
  }
);

export default function FileFormatConverterPage() {
  const [selectedConverter, setSelectedConverter] = useState<FileConverter | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [limitInfo, setLimitInfo] = useState<{ current?: number; max?: number | null } | null>(null);
  
  const { user } = useSession();
  
  const [userTier, setUserTier] = useState<SubscriptionTier>('guest');
  const [remainingConversions, setRemainingConversions] = useState<number | undefined>(undefined);
  
  // Load user subscription info and usage
  useEffect(() => {
    async function loadUserInfo() {
      if (!user?.id) {
        // Guest user - use localStorage for tracking
        setUserTier('guest');
        const guestUsage = localStorage.getItem('fileConverterGuestUsage');
        const currentMonth = new Date().toISOString().slice(0, 7);
        
        if (guestUsage) {
          try {
            const usage = JSON.parse(guestUsage);
            if (usage.month === currentMonth) {
              const remaining = SUBSCRIPTION_LIMITS.guest.maxUploadsPerMonth - usage.count;
              setRemainingConversions(Math.max(0, remaining));
            } else {
              localStorage.setItem('fileConverterGuestUsage', JSON.stringify({ month: currentMonth, count: 0 }));
              setRemainingConversions(SUBSCRIPTION_LIMITS.guest.maxUploadsPerMonth);
            }
          } catch {
            setRemainingConversions(SUBSCRIPTION_LIMITS.guest.maxUploadsPerMonth);
          }
        } else {
          setRemainingConversions(SUBSCRIPTION_LIMITS.guest.maxUploadsPerMonth);
        }
        return;
      }
      
      // Authenticated user - get tier from database
      try {
        const subResponse = await fetch(`/api/subscription/current?userId=${user.id}`);
        if (subResponse.ok) {
          const subData = await subResponse.json();
          const tier = subData.tier || 'free';
          setUserTier(tier);
          console.log('[FILE-CONVERTER] User tier:', tier, 'Subscription data:', subData);
          
          // Get usage from database via API
          const usageResponse = await fetch(`/api/usage/current?userId=${user.id}&feature=file-conversion`);
          if (usageResponse.ok) {
            const usageData = await usageResponse.json();
            setRemainingConversions(usageData.remaining ?? undefined);
          }
        }
      } catch (error) {
        console.error('Failed to load subscription:', error);
      }
    }
    
    loadUserInfo();
  }, [user]);

  const handleConverterSelect = (converter: FileConverter) => {
    setSelectedConverter(converter);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setTimeout(() => setSelectedConverter(null), 300);
    
    // Refresh usage after closing
    if (user?.id) {
      fetch(`/api/usage/current?userId=${user.id}&feature=file-conversion`)
        .then(res => res.json())
        .then((usageData) => {
          setRemainingConversions(usageData.remaining ?? undefined);
        })
        .catch(err => console.error('Failed to refresh usage:', err));
    } else {
      // Guest user - update from localStorage
      const guestUsage = localStorage.getItem('fileConverterGuestUsage');
      if (guestUsage) {
        const usage = JSON.parse(guestUsage);
        const remaining = SUBSCRIPTION_LIMITS.guest.maxUploadsPerMonth - usage.count;
        setRemainingConversions(Math.max(0, remaining));
      }
    }
  };

  const handleUpgradeRequired = (limit: { current?: number; max?: number | null }) => {
    setLimitInfo(limit);
    setShowUpgradeModal(true);
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 py-4">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-4xl font-bold mb-2">File Format Converter</h1>
      </div>

      {/* Converter Grid */}
      <FileConverterGrid
        converters={FILE_CONVERTERS}
        onConverterSelect={handleConverterSelect}
        userTier={userTier}
      />

      {/* Converter Dialog */}
      {selectedConverter && (
        <FileConverterDialog
          converter={selectedConverter}
          isOpen={isDialogOpen}
          onClose={handleCloseDialog}
          userTier={userTier}
          userId={user?.id}
          remainingConversions={remainingConversions}
          onUpgradeRequired={handleUpgradeRequired}
        />
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentTier={userTier}
        feature="File Converter"
        currentUsage={limitInfo?.current}
        maxLimit={limitInfo?.max === null ? undefined : limitInfo?.max}
      />
    </div>
  );
}

```

```FileConverterGrid.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Image,
  Video,
  Music,
  FileText,
  Film,
  Camera,
  Layers,
  Pen,
  Binary,
  Smartphone,
  Headphones,
  Disc,
  BookOpen,
  Table,
  Search,
  Crown,
} from 'lucide-react';
import type { FileConverter } from '@/serverSide/fileFormatConverter/types';

// Icon mapping
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Image,
  Video,
  Music,
  FileText,
  Film,
  Camera,
  Layers,
  Pen,
  Binary,
  Smartphone,
  Headphones,
  Disc,
  BookOpen,
  Table,
  Presentation: FileText, // Fallback
};

// Category icons
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  image: Image,
  video: Video,
  audio: Music,
  document: FileText,
};

interface FileConverterGridProps {
  converters: FileConverter[];
  onConverterSelect: (converter: FileConverter) => void;
  userTier?: 'guest' | 'free' | 'pro' | 'advance';
}

export function FileConverterGrid({ converters, onConverterSelect, userTier = 'guest' }: FileConverterGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(converters.map(c => c.category)))];

  // Filter converters
  const filteredConverters = converters.filter(converter => {
    const matchesSearch =
      converter.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      converter.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      converter.inputFormat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      converter.outputFormat.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || converter.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Group by category
  const groupedConverters = filteredConverters.reduce((acc, converter) => {
    const category = converter.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(converter);
    return acc;
  }, {} as Record<string, FileConverter[]>);

  // Check if user can access converter
  const canAccessConverter = (converter: FileConverter): boolean => {
    if (!converter.requiresPro) return true;
    return userTier === 'pro' || userTier === 'advance';
  };

  // Category display names
  const categoryNames: Record<string, string> = {
    all: 'All Converters',
    image: 'Image Converters',
    video: 'Video Converters',
    audio: 'Audio Converters',
    'video & audio': 'Video & Audio Converters',
    document: 'Document Converters',
  };

  return (
    <div className="space-y-4 border border-secondary-foreground rounded-lg p-4">
      {/* Search and Filter */}
      <div className="grid grid-cols-[33%_67%] gap-4">
        <div className="relative w-auto">
          <Search className="absolute left-3 top-[18px] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search file converters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(category => {
            const CategoryIcon = CATEGORY_ICONS[category] || FileText;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {category !== 'all' && <CategoryIcon className="h-4 w-4" />}
                {categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Converters Grid */}
      {Object.entries(groupedConverters).map(([category, categoryConverters]) => {
        const CategoryIcon = CATEGORY_ICONS[category] || Video;
        return (
          <div key={category} className="space-y-4">
            <h2 className="text-2xl font-bold capitalize flex items-center gap-2">
              <CategoryIcon className="h-6 w-6 text-primary" />
              {categoryNames[category] || category.replace(/-/g, ' ')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
              {categoryConverters.map(converter => {
                const IconComponent = ICON_MAP[converter.icon] || FileText;
                const hasAccess = canAccessConverter(converter);

                return (
                  <Card
                    key={converter.id}
                    className={`cursor-pointer transition-all duration-200 ${
                      hasAccess
                        ? 'hover:shadow-lg hover:border-primary/50'
                        : 'opacity-75 hover:opacity-100'
                    }`}
                    onClick={() => onConverterSelect(converter)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex gap-1 flex-wrap justify-end">
                          {converter.popular && (
                            <Badge variant="secondary" className="text-xs">
                              Popular
                            </Badge>
                          )}
                          {converter.requiresPro && (
                            <Badge className="text-xs bg-gradient-to-r from-amber-500 to-orange-500 flex items-center gap-1">
                              <Crown className="h-3 w-3" />
                              Pro
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardTitle className="text-base mt-2">{converter.title}</CardTitle>
                      <CardDescription className="text-xs line-clamp-2">
                        {converter.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs uppercase">
                          {converter.inputFormat}
                        </Badge>
                        <span>→</span>
                        <Badge variant="outline" className="text-xs uppercase">
                          {converter.outputFormat}
                        </Badge>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Max size: {converter.maxFileSizeMB} MB
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {filteredConverters.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No converters found matching your search.</p>
          <p className="text-sm mt-1">Try a different search term or category.</p>
        </div>
      )}
    </div>
  );
}
```

```FileConverterDialog.tsx
'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Upload,
  X,
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileUp,
  Crown,
  ImageIcon,
  ArrowLeftRight,
//   Info,
} from 'lucide-react';
import type { FileConverter, SubscriptionTier, FileConversionResponse } from '@/serverSide/fileFormatConverter/types';
import { SUBSCRIPTION_LIMITS } from '@/serverSide/fileFormatConverter/types';

interface TierLimit {
  current?: number;
  max?: number | null;
}

interface FileConverterDialogProps {
  converter: FileConverter;
  isOpen: boolean;
  onClose: () => void;
  userTier: SubscriptionTier;
  userId?: string;
  remainingConversions?: number;
  onUpgradeRequired?: (limit: TierLimit) => void;
}

type ConversionStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

// Image preview component with hover to enlarge
function ImagePreview({ url, filename }: { url: string; filename: string }) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div className="flex items-center gap-2 p-2 bg-muted rounded">
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Preview not available</span>
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      {/* Thumbnail */}
      <div
        className="relative cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={filename}
          className="h-16 w-16 object-cover rounded border border-border shadow-sm transition-transform duration-200 hover:scale-105"
          onError={() => setImageError(true)}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded opacity-0 hover:opacity-100 transition-opacity">
          <span className="text-white text-xs font-medium">Preview</span>
        </div>
      </div>

      {/* Enlarged preview on hover */}
      {isHovered && (
        <div className="absolute z-50 left-20 -bottom-20 p-1 bg-background border border-border rounded-lg shadow-2xl">
          {/* <p className="text-xs text-muted-foreground mb-1 text-center truncate max-w-[300px]">
            {filename}
          </p> */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={filename}
            className="max-w-[300px] max-h-[300px] object-contain rounded"
            onError={() => setImageError(true)}
          />
        </div>
      )}
    </div>
  );
}

// Check if the output format is an image that can be previewed
function isPreviewableImage(format: string | undefined): boolean {
  if (!format) return false;
  const previewableFormats = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'ico', 'avif'];
  return previewableFormats.includes(format.toLowerCase());
}

export function FileConverterDialog({
  converter,
  isOpen,
  onClose,
  userTier,
  userId,
  remainingConversions,
  onUpgradeRequired,
}: FileConverterDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [options, setOptions] = useState<Record<string, string | number | boolean>>(() => {
    // Initialize with default values
    const defaults: Record<string, string | number | boolean> = {};
    converter.options?.forEach(opt => {
      defaults[opt.id] = opt.defaultValue;
    });
    return defaults;
  });
  const [status, setStatus] = useState<ConversionStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<FileConversionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Bidirectional toggle state
  const [isReversed, setIsReversed] = useState(false);

  // Reset state when converter changes - use key prop on dialog instead of effect
  // The parent component should remount this dialog when converter changes

  // Get current API endpoint based on direction
  const currentApiEndpoint = isReversed && converter.reverseApiEndpoint 
    ? converter.reverseApiEndpoint 
    : converter.apiEndpoint;

  // Get current accepted formats based on direction
  const currentAcceptedExtensions = isReversed && converter.reverseAcceptedExtensions 
    ? converter.reverseAcceptedExtensions 
    : converter.acceptedExtensions;

  // Get current input/output formats based on direction
  const currentInputFormat = isReversed && converter.reverseInputFormat 
    ? converter.reverseInputFormat 
    : converter.inputFormat;
  
  const currentOutputFormat = isReversed && converter.reverseOutputFormat 
    ? converter.reverseOutputFormat 
    : converter.outputFormat;

  // Get dynamic title for bidirectional converters
  const getDynamicTitle = () => {
    if (!converter.bidirectional) return converter.title;
    return `${currentInputFormat} ⟶ ${currentOutputFormat}`;
  };

  // Handle toggle direction
  const handleToggleDirection = () => {
    setIsReversed(!isReversed);
    // Clear file and state on swap
    setSelectedFile(null);
    setStatus('idle');
    setResult(null);
    setError(null);
  };

  // Filter options based on current direction
  const getCurrentOptions = useCallback(() => {
    if (!converter.options) return [];
    const currentDirection = isReversed ? 'reverse' : 'forward';
    return converter.options.filter(option => {
      const optionDirection = option.direction ?? 'both';
      return optionDirection === 'both' || optionDirection === currentDirection;
    });
  }, [converter.options, isReversed]);

  const limits = SUBSCRIPTION_LIMITS[userTier];
  const canAccess = !converter.requiresPro || userTier === 'pro' || userTier === 'advance';
  const isWithinSizeLimit = !selectedFile || selectedFile.size <= limits.maxFileSizeMB * 1024 * 1024;
  const hasRemainingConversions = remainingConversions === undefined || remainingConversions > 0 || limits.maxUploadsPerMonth === -1;

  // Reset state when dialog closes
  const handleClose = useCallback(() => {
    setSelectedFile(null);
    setStatus('idle');
    setProgress(0);
    setResult(null);
    setError(null);
    onClose();
  }, [onClose]);

  // File selection handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!currentAcceptedExtensions.includes(extension)) {
      return `Invalid file type. Accepted formats: ${currentAcceptedExtensions.join(', ')}`;
    }

    // Check file size
    const maxSize = Math.min(converter.maxFileSizeMB, limits.maxFileSizeMB) * 1024 * 1024;
    if (file.size > maxSize) {
      return `File too large. Maximum size: ${Math.min(converter.maxFileSizeMB, limits.maxFileSizeMB)} MB`;
    }

    return null;
  }, [currentAcceptedExtensions, converter.maxFileSizeMB, limits.maxFileSizeMB]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  }, [validateFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  }, [validateFile]);

  const handleOptionChange = useCallback((optionId: string, value: string | number | boolean) => {
    setOptions(prev => ({ ...prev, [optionId]: value }));
  }, []);

  // Conversion handler
  const handleConvert = useCallback(async () => {
    if (!selectedFile || !canAccess || !hasRemainingConversions) return;

    setStatus('uploading');
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Add options to form data - only include options for current direction
      const currentOptions = getCurrentOptions();
      currentOptions.forEach(opt => {
        const value = options[opt.id];
        if (value !== undefined && value !== '') {
          formData.append(opt.formFieldName, String(value));
        }
      });

      // Add user info
      if (userId) {
        formData.append('userId', userId);
      }
      formData.append('subscriptionTier', userTier);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      setStatus('processing');

      const response = await fetch('/api/file-convert', {
        method: 'POST',
        body: formData,
        headers: {
          'X-Converter-Id': converter.id,
          'X-API-Endpoint': currentApiEndpoint,
        },
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data: FileConversionResponse = await response.json();

      if (response.status === 429) {
        // Tier limit exceeded
        setStatus('error');
        setError(typeof data.error === 'string' ? data.error : JSON.stringify(data.error) || 'Usage limit exceeded');
        const limitData = (data as unknown as Record<string, unknown>).limit;
        if (onUpgradeRequired && limitData) {
          onUpgradeRequired(limitData as TierLimit);
        }
        return;
      }

      if (data.success) {
        setStatus('success');
        setResult(data);
      } else {
        setStatus('error');
        // Handle error - could be string, object, or array (Pydantic validation errors)
        let errorMessage = 'Conversion failed';
        if (data.error) {
          if (typeof data.error === 'string') {
            errorMessage = data.error;
          } else if (Array.isArray(data.error)) {
            // Pydantic validation errors array
            errorMessage = data.error
              .map((e: { msg?: string; message?: string }) => e.msg || e.message || JSON.stringify(e))
              .join(', ');
          } else if (typeof data.error === 'object') {
            // Single error object
            errorMessage = (data.error as { msg?: string; message?: string; detail?: string }).msg 
              || (data.error as { msg?: string; message?: string; detail?: string }).message 
              || (data.error as { msg?: string; message?: string; detail?: string }).detail 
              || JSON.stringify(data.error);
          }
        }
        setError(errorMessage);
      }
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  }, [selectedFile, converter.id, currentApiEndpoint, options, userId, userTier, canAccess, hasRemainingConversions, getCurrentOptions, onUpgradeRequired]);

  // Download handler
  const handleDownload = useCallback(async () => {
    if (!result?.download_url) return;

    try {
      const response = await fetch(result.download_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Build filename with correct extension
      let filename = 'converted_file';
      if (result.original_filename && result.output_format) {
        // Check if original filename already has the correct extension
        const hasExtension = result.original_filename.includes('.');
        if (hasExtension) {
          filename = result.original_filename.replace(/\.[^/.]+$/, `.${result.output_format}`);
        } else {
          filename = `${result.original_filename}.${result.output_format}`;
        }
      } else if (result.output_format) {
        filename = `converted_file.${result.output_format}`;
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setError('Failed to download file');
    }
  }, [result]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="min-w-4xl min-h-auto overflow-y-auto [scrollbar-gutter:stable]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getDynamicTitle()}
            {converter.bidirectional && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleDirection}
                className="relative mx-2 gap-2"
              >
                <ArrowLeftRight className="h-4 w-4" />
                Swap
              </Button>
            )}
            {converter.requiresPro && (
              <Badge className="bg-linear-to-r from-amber-500 to-orange-500 flex items-center gap-1">
                <Crown className="h-3 w-3" />
                Pro
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>{converter.description}</DialogDescription>
        </DialogHeader>

        {/* Access Check */}
        {!canAccess && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Pro Feature</AlertTitle>
            <AlertDescription>
              This converter requires a Pro or Advanced subscription.
              <Button variant="link" className="p-0 ml-1 h-auto text-primary">
                Upgrade now
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Usage Limit Warning */}
        {canAccess && !hasRemainingConversions && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Monthly Limit Reached</AlertTitle>
            <AlertDescription>
              You have used all your conversions for this month.
              {userTier !== 'advance' && (
                <Button variant="link" className="p-0 ml-1 h-auto text-primary">
                  Upgrade for more
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Subscription Info */}
        {/* <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <Info className="h-4 w-4" />
          <span>
            Your tier: <strong className="capitalize">{userTier}</strong> •
            Max file size: <strong>{limits.maxFileSizeMB} MB</strong>
            {remainingConversions !== undefined && limits.maxUploadsPerMonth !== -1 && (
              <> • Remaining: <strong>{remainingConversions}</strong> conversions</>
            )}
            {limits.maxUploadsPerMonth === -1 && (
              <> • <strong>Unlimited</strong> conversions</>
            )}
          </span>
        </div> */}

        {/* File Upload Zone */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : selectedFile
              ? 'border-green-500 bg-green-500/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          } ${!canAccess || !hasRemainingConversions ? 'opacity-50 pointer-events-none' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={currentAcceptedExtensions.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            disabled={!canAccess || !hasRemainingConversions}
          />

          {selectedFile ? (
            <div className="space-y-2">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedFile(null);
                  setStatus('idle');
                  setResult(null);
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-lg font-medium">
                Drop your file here or{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary focus:outline-none"
                >
                <span className='p-1 border-2 rounded-[6px] border-primary  hover:text-secondary hover:bg-primary '>browse</span>
                </button>
              </p>
              <p className="text-sm text-muted-foreground">
                Supported formats: {currentAcceptedExtensions.join(', ')}
              </p>
              <p className="text-xs text-muted-foreground">
                Maximum file size: {Math.min(converter.maxFileSizeMB, limits.maxFileSizeMB)} MB
              </p>
            </div>
          )}
        </div>

        {/* Options - filtered by current direction, hidden when no options */}
        {getCurrentOptions().length > 0 && (
          <div className="pt-2 border-t">
            <div className="space-y-4">
              <h3 className="font-medium">Conversion Options</h3>
              <div className="grid grid-cols-2 gap-4">
                {getCurrentOptions().map(option => (
                  <div key={option.id} className="space-y-2">
                    <Label htmlFor={option.id}>{option.label}</Label>
                    {option.type === 'select' && option.options ? (
                      <Select
                        value={String(options[option.id])}
                        onValueChange={(value) => handleOptionChange(option.id, value)}
                        disabled={!canAccess || !hasRemainingConversions}
                      >
                        <SelectTrigger id={option.id}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {option.options.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : option.type === 'number' ? (
                      <Input
                        id={option.id}
                        type="number"
                        min={option.min}
                        max={option.max}
                        step={option.step}
                        value={options[option.id] as number}
                        onChange={(e) => handleOptionChange(option.id, Number(e.target.value))}
                        disabled={!canAccess || !hasRemainingConversions}
                      />
                    ) : (
                      <Input
                        id={option.id}
                        type="text"
                        value={options[option.id] as string}
                        onChange={(e) => handleOptionChange(option.id, e.target.value)}
                        placeholder={option.description}
                        disabled={!canAccess || !hasRemainingConversions}
                      />
                    )}
                    {option.description && (
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Progress */}
        {(status === 'uploading' || status === 'processing') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{status === 'uploading' ? 'Uploading...' : 'Converting...'}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Result */}
        {status === 'success' && result && (
          <Alert className="border-green-500 bg-green-500/10">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-500">Conversion Complete!</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>
                File converted successfully in {result.processing_time_seconds}s
                {result.file_size_bytes && (
                  <> • Output size: {formatFileSize(result.file_size_bytes)}</>
                )}
              </p>
              
              {/* Image Preview - only show for previewable image formats */}
              {result.download_url && isPreviewableImage(result.output_format) && (
                <div className="flex items-center gap-3">
                  <ImagePreview 
                    url={result.download_url} 
                    filename={result.original_filename 
                      ? result.original_filename.replace(/\.[^/.]+$/, `.${result.output_format}`)
                      : `converted_file.${result.output_format}`
                    } 
                  />
                  <span className="text-sm text-muted-foreground">
                    Hover over thumbnail to preview
                  </span>
                </div>
              )}
              
              <Button onClick={handleDownload} className="mt-2">
                <Download className="h-4 w-4 mr-2" />
                Download {result.output_format?.toUpperCase()}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            {status === 'success' ? 'Close' : 'Cancel'}
          </Button>
          {status !== 'success' && (
            <Button
              onClick={handleConvert}
              disabled={
                !selectedFile ||
                !canAccess ||
                !hasRemainingConversions ||
                !isWithinSizeLimit ||
                status === 'uploading' ||
                status === 'processing'
              }
            >
              {status === 'uploading' || status === 'processing' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {status === 'uploading' ? 'Uploading...' : 'Converting...'}
                </>
              ) : (
                <>
                  <FileUp className="h-4 w-4 mr-2" />
                  Convert to {currentOutputFormat}
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

