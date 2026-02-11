### CODE EDITOR (Monaco-based)

**UI Pattern:**
`[Monaco Editor (Input)] ⇄ [Monaco Editor (Output)]` *(bidirectional)*

```page.tsx
'use client';

import { useState, useEffect } from 'react';
import { ConverterGrid } from '@/components/custom-ui/converters/data-converter/ConverterGrid';
import { CONVERTERS } from '@/serverSide/dataConverter/registry';
import type { DataConverter } from '@/serverSide/dataConverter/types';
import dynamic from 'next/dynamic';
import { useSession } from '@/contexts/SessionContext';
import { UpgradeModal } from '@/components/modals/UpgradeModal';

const ConverterDialog = dynamic(
  () => import('@/components/custom-ui/converters/data-converter/ConverterDialog').then(mod => ({ default: mod.ConverterDialog })),
  { ssr: false }
);

export default function DataConverterPage() {
  const [selectedConverter, setSelectedConverter] = useState<DataConverter | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [limitInfo, setLimitInfo] = useState<{ current?: number; max?: number | null } | null>(null);
  
  const { user } = useSession();
  const [userTier, setUserTier] = useState<string>('guest');

  // Fetch user subscription to determine tier
  useEffect(() => {
    if (user?.id) {
      fetch(`/api/subscriptions/user/${user.id}`)
        .then(res => res.json())
        .then((subscription) => {
          const tier = subscription?.plan?.tier || 'free';
          setUserTier(tier);
          console.log('[DATA-CONVERTER] User tier:', tier, 'isPro:', tier === 'pro' || tier === 'advance', 'Subscription:', subscription);
        })
        .catch(err => console.error('Failed to load subscription:', err));
    }
  }, [user]);

  const handleConverterSelect = (converter: DataConverter) => {
    setSelectedConverter(converter);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setTimeout(() => setSelectedConverter(null), 300);
  };

  const handleUpgradeRequired = (limit: { current?: number; max?: number | null }) => {
    setLimitInfo(limit);
    setShowUpgradeModal(true);
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 py-4">
      <div className="mb-4">
        <h1 className="text-4xl text-center font-bold m-2">Data Converters</h1>
      </div>
      
      <ConverterGrid
        converters={CONVERTERS}
        onConverterSelect={handleConverterSelect}
      />

      {selectedConverter && (
        <ConverterDialog
          converter={selectedConverter}
          isOpen={isDialogOpen}
          onClose={handleCloseDialog}
          isPro={(userTier === 'pro' || userTier === 'advance')}
          userId={user?.id}
          onUpgradeRequired={handleUpgradeRequired}
        />
      )}

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentTier={userTier as 'guest' | 'free' | 'pro' | 'advance'}
        feature="Data Converter"
        currentUsage={limitInfo?.current}
        maxLimit={limitInfo?.max === null ? undefined : limitInfo?.max}
      />
    </div>
  );
}
```

```ConverterGrid.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  FileJson, 
  FileSpreadsheet, 
  FileCode, 
  FileText, 
  Settings, 
  Link, 
  Binary, 
  Code, 
  Hash, 
  Minimize2, 
  Sparkles,
  Search,
} from 'lucide-react';
import type { DataConverter } from '@/serverSide/dataConverter/types';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FileJson,
  FileSpreadsheet,
  FileCode,
  FileText,
  Settings,
  Link,
  Binary,
  Code,
  Hash,
  Minimize2,
  Sparkles,
};

interface ConverterGridProps {
  converters: DataConverter[];
  onConverterSelect: (converter: DataConverter) => void;
}

export function ConverterGrid({ converters, onConverterSelect }: ConverterGridProps) {
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
  }, {} as Record<string, DataConverter[]>);

  return (
    <div className="space-y-3 border border-secondary-foreground rounded-lg p-4">
      {/* Search and Filter */}
      <div className="grid grid-cols-[33%_67%] gap-4">
        <div className="relative w-auto">
          <Search className="absolute left-3 top-[18px] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search converters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Converters Grid */}
      {Object.entries(groupedConverters).map(([category, categoryConverters]) => (
        <div key={category} className="space-y-4">
          <h2 className="text-2xl font-bold capitalize">
            {category.replace(/-/g, ' ')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryConverters.map(converter => {
              const IconComponent = ICON_MAP[converter.icon] || FileCode;
              
              return (
                <Card
                  key={converter.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => onConverterSelect(converter)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <IconComponent className="h-8 w-8 text-primary" />
                      <div className="flex gap-1">
                        {converter.popular && (
                          <Badge variant="secondary" className="text-xs">
                            Popular
                          </Badge>
                        )}
                        {converter.secure && (
                          <Badge variant="outline" className="text-xs">
                            Secure
                          </Badge>
                        )}
                        {converter.requiresPro && (
                          <Badge className="text-xs bg-amber-500">
                            Pro
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-lg">{converter.title}</CardTitle>
                    <CardDescription>{converter.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs uppercase">
                        {converter.inputFormat}
                      </Badge>
                      <span>{converter.bidirectional ? '⇆' : '→'}</span>
                      <Badge variant="outline" className="text-xs uppercase">
                        {converter.outputFormat}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {filteredConverters.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No converters found matching your search.
        </div>
      )}
    </div>
  );
}
```

```ConverterDialog.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftRight, Copy, Download, Loader2, AlertCircle, Upload, FileText } from 'lucide-react';
import type { DataConverter, ConversionResult } from '@/serverSide/dataConverter/types';

interface ConverterDialogProps {
  converter: DataConverter;
  isOpen: boolean;
  onClose: () => void;
  isPro?: boolean;
  userId?: string;
  onUpgradeRequired?: (limit: any) => void;
}

export function ConverterDialog({ converter, isOpen, onClose, isPro = false, userId, onUpgradeRequired }: ConverterDialogProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [options, setOptions] = useState<Record<string, unknown>>({});
  const [metadata, setMetadata] = useState<ConversionResult<string>['metadata']>();
  
  // Ref for output textarea to enable direct copying
  const outputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Toggle state for bidirectional converters
  const [isReversed, setIsReversed] = useState(false);

  // Reset state when converter changes
  useEffect(() => {
    setInput('');
    setOutput('');
    setError(null);
    setMetadata(undefined);
    setIsReversed(false);
  }, [converter.id]);

  // Get current converter ID based on direction
  const currentConverterId = converter.bidirectional && isReversed 
    ? (converter.reverseId || converter.id)
    : (converter.forwardId || converter.id);

  // Get current formats based on direction
  const currentInputFormat = isReversed ? converter.outputFormat : converter.inputFormat;
  const currentOutputFormat = isReversed ? converter.inputFormat : converter.outputFormat;

  // Get dynamic title
  const getDynamicTitle = () => {
    if (!converter.bidirectional) return converter.title;
    
    // Special handling for encoders
    if (converter.category === 'encoding') {
      const encoderName = converter.title.split(' ⇆ ')[0]; // Get "URL", "Base64", etc.
      return isReversed 
        ? `Decode ${encoderName}`
        : `Encode ${encoderName}`;
    }
    
    const formats = isReversed 
      ? `${converter.outputFormat.toUpperCase()} ⟶ ${converter.inputFormat.toUpperCase()}`
      : `${converter.inputFormat.toUpperCase()} ⟶ ${converter.outputFormat.toUpperCase()}`;
    
    return formats;
  };

  const handleToggleDirection = () => {
    setIsReversed(!isReversed);
    // Clear input on swap
    setInput('');
    setOutput('');
    setError(null);
  };

  const handleConvert = async () => {
    if (!input.trim()) {
      setError('Please enter some input');
      return;
    }

    setIsConverting(true);
    setError(null);
    setOutput('');
    setMetadata(undefined);

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          converterId: currentConverterId,
          input,
          options,
          userId: userId || 'anonymous',
          isPro,
        }),
      });

      const result: ConversionResult<string> = await response.json();

      if (response.status === 429) {
        // Tier limit exceeded
        setError(result.error || 'Usage limit exceeded');
        if (onUpgradeRequired) {
          onUpgradeRequired((result as any).limit);
        }
        return;
      }

      if (result.success && result.data) {
        setOutput(result.data);
        setMetadata(result.metadata);
      } else {
        setError(result.error || 'Conversion failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error occurred');
    } finally {
      setIsConverting(false);
    }
  };

  const handleCopy = () => {
    // Validate output exists
    if (!output || !output.trim()) {
      setError('No output to copy');
      return;
    }

    // Use the actual output textarea ref directly
    const textarea = outputRef.current;
    if (textarea) {
      // Focus and select all text in the textarea
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
      
      try {
        // Copy using execCommand on the actual element
        const success = document.execCommand('copy');
        
        if (success) {
          setSuccessMessage('✓ Copied to clipboard!');
          setTimeout(() => setSuccessMessage(null), 2000);
        } else {
          // Fallback to clipboard API
          navigator.clipboard.writeText(output).then(() => {
            setSuccessMessage('✓ Copied to clipboard!');
            setTimeout(() => setSuccessMessage(null), 2000);
          }).catch(() => {
            setError('Failed to copy. Please select and copy manually (Ctrl+C).');
            setTimeout(() => setError(null), 3000);
          });
        }
      } catch {
        // Final fallback
        navigator.clipboard.writeText(output).then(() => {
          setSuccessMessage('✓ Copied to clipboard!');
          setTimeout(() => setSuccessMessage(null), 2000);
        }).catch(() => {
          setError('Failed to copy. Please select and copy manually (Ctrl+C).');
          setTimeout(() => setError(null), 3000);
        });
      }
    } else {
      // Fallback if ref not available
      navigator.clipboard.writeText(output).then(() => {
        setSuccessMessage('✓ Copied to clipboard!');
        setTimeout(() => setSuccessMessage(null), 2000);
      }).catch(() => {
        setError('Failed to copy. Please select and copy manually.');
        setTimeout(() => setError(null), 3000);
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted-${Date.now()}.${currentOutputFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOptionChange = (optionId: string, value: unknown) => {
    setOptions(prev => ({ ...prev, [optionId]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setInput(text);
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} >
      <DialogContent className="bg-primary-foreground min-w-6xl max-h-[90vh] my-8 flex flex-col">
        <DialogHeader className='shrink-0'>
          <div className="items-center mb-2">
            <div className="gap-3">
              <DialogTitle className="text-2xl">
                {getDynamicTitle()}
                {converter.bidirectional && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleDirection}
                    className="relative mx-5 gap-2"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                    Swap
                  </Button>
                )}
                <div className="gap-1 mb-2">
                  {converter.popular && <Badge>Popular</Badge>}
                  {converter.secure && <Badge variant="outline">Secure</Badge>}
                  {converter.requiresPro && <Badge className="bg-amber-500">Pro</Badge>}
                </div>
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              Convert <span className='font-bold text-primary'>{getDynamicTitle()}</span> format
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Conversion Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 overflow-y-auto [scrollbar-gutter:stable] flex-1 pr-2">
          {/* Input Heading */}
            <div className="flex items-center justify-between">
              <Label>Input ({currentInputFormat.toUpperCase()})</Label>
              <div className="flex gap-2">
                {isPro && (
                  <div className="flex gap-2 mb-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.json,.xml,.csv,.yaml,.yml"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="data-file-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />Upload File (Pro)
                    </Button>
                  </div>
                )}
              </div>
            </div>
          

          {/* Output Heading */}
            <div className="flex items-center justify-between">
              <Label>Output ({currentOutputFormat.toUpperCase()})</Label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopy}
                  disabled={!output || !output.trim()}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownload}
                  disabled={!output || !output.trim()}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

          {/* Input textarea */}
          <div className="space-y-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Paste your ${currentInputFormat} here...`}
              className="min-h-[60vh] font-mono text-sm"
            />
          </div>


          {/* Output textarea */}
          <div className="space-y-2">
            <Textarea
              ref={outputRef}
              value={output}
              readOnly
              placeholder="Output will appear here..."
              className="min-h-[60vh] font-mono text-sm bg-muted/50"
            />            
            {metadata && (
              <div className="text-xs text-muted-foreground flex gap-4">
                {metadata.inputSize && (<span>Input: {(metadata.inputSize / 1024).toFixed(2)} KB</span>)}
                {metadata.outputSize && (<span>Output: {(metadata.outputSize / 1024).toFixed(2)} KB</span>)}
                {metadata.duration !== undefined && (<span>Time: {metadata.duration}ms</span>)}
              </div>
            )}
          </div>
        </div>

        {/* Convert Button */}
        <div className="flex justify-center gap-3">
          <Button
            onClick={handleConvert}
            disabled={isConverting || !input.trim()}
            size="lg"
            className="min-w-[200px]"
          >
            {isConverting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Converting...
              </>
            ) : (
              `Convert to ${currentOutputFormat.toUpperCase()}`
            )}
          </Button>
        </div>

        {/* Options - filtered by current direction */}
        {(() => {
          if (!converter.options || converter.options.length === 0) return null;
          
          // Filter options based on current direction
          const currentDirection = isReversed ? 'reverse' : 'forward';
          const filteredOptions = converter.options.filter(option => {
            const optionDirection = option.direction ?? 'both';
            return optionDirection === 'both' || optionDirection === currentDirection;
          });
          
          if (filteredOptions.length === 0) return null;
          
          return (
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold">Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredOptions.map((option) => (
                  <div key={option.id} className="space-y-2">
                    <Label htmlFor={option.id}>{option.label}</Label>
                    
                    {option.type === 'select' && option.options && (
                      <Select
                        value={String(options[option.id] || option.defaultValue)}
                        onValueChange={(value) => handleOptionChange(option.id, value)}
                      >
                        <SelectTrigger id={option.id}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {option.options?.map((opt) => (
                            <SelectItem key={String(opt.value)} value={String(opt.value)}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {option.type === 'switch' && (
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={option.id}
                          checked={Boolean(options[option.id] ?? option.defaultValue)}
                          onCheckedChange={(checked) => handleOptionChange(option.id, checked)}
                        />
                        <Label htmlFor={option.id} className="cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    )}

                    {option.type === 'slider' && (
                      <div className="space-y-2">
                        <Slider
                          id={option.id}
                          min={option.min || 0}
                          max={option.max || 10}
                          step={1}
                          value={[Number(options[option.id] ?? option.defaultValue)]}
                          onValueChange={([value]) => handleOptionChange(option.id, value)}
                        />
                        <div className="text-sm text-muted-foreground">
                          Value: {String(options[option.id] ?? option.defaultValue)}
                        </div>
                      </div>
                    )}

                    {option.type === 'input' && (
                      <Input
                        id={option.id}
                        value={String(options[option.id] || option.defaultValue || '')}
                        onChange={(e) => handleOptionChange(option.id, e.target.value)}
                        placeholder={option.placeholder}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Error Display */}
        {error && (
          <div className="border border-destructive rounded-lg p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}
        
        {/* Success Message */}
        {successMessage && (
          <div className="border border-green-600 dark:border-green-400 rounded-lg p-4 bg-green-50 dark:bg-green-950">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <p className="font-medium">{successMessage}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```