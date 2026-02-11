### TEXT CONVERTER

**UI Pattern:**
`[Textarea] → [Options/Buttons] → [Save Input State] → [Converter Text] → [Display Output in Textarea]`

---

```page.tsx
import { CaseConverterApp } from '@/components/custom-ui/converters/case-converter/CaseConverterApp';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Case Converter - 100+ Text Transformations | MacroApps',
  description: 'Free online case converter with 100+ transformations: uppercase, lowercase, camelCase, snake_case, and more. Real-time text statistics and instant conversions.',
  keywords: 'case converter, text transformer, camelCase, snake_case, uppercase, lowercase, text tools',
};

export default function CaseConverterPage() {
  return (
    <main className="min-h-screen bg-linear-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-4 space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Case Converter
          </h1>
        </div>

        {/* Main Tool */}
        <CaseConverterApp />

      </div>
    </main>
  );
}

```


```CaseConverterApp.tsx
'use client';

import { useState, useTransition } from 'react';
import { convertText, CASE_CONVERTERS, type CaseConverter } from '@/serverSide/caseConverter';
import { useCaseConversion, useCaseUsage } from '@/hooks/queries';
import { useSession } from '@/contexts/SessionContext';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Copy, Download, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ConverterCategory {
    name: string;
    icon: string;
    converters: CaseConverter[];
}

export function CaseConverterApp() {
    // Authentication and usage tracking
    const { user } = useSession();
    const userId = user?.id;
    const caseConversion = useCaseConversion();
    const { data: usageData } = useCaseUsage(userId);

    // Dual state management
    const [displayText, setDisplayText] = useState('');
    const [originalText, setOriginalText] = useState('');
    const [isPending, startTransition] = useTransition();

    // Text change handler - updates both states
    const handleTextChange = (value: string) => {
        setDisplayText(value);
        setOriginalText(value);
    };

    // Conversion handler - uses API if authenticated, otherwise client-side
    const handleConvert = async (converterId: string) => {
        if (!originalText.trim()) {
            toast.error('Please enter some text to convert');
            return;
        }

        // Check usage limits for authenticated users
        if (userId && usageData) {
            if (usageData.remaining === 0) {
                toast.error('Usage limit reached. Upgrade for unlimited conversions!');
                return;
            }
        }

        // If authenticated, use API with tracking
        if (userId) {
            try {
                const result = await caseConversion.mutateAsync({
                    text: originalText,
                    converterId,
                });

                if (result.success && result.result) {
                    setDisplayText(result.result);
                    toast.success('Text converted successfully!');
                } else {
                    toast.error(result.error || 'Conversion failed');
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Conversion failed';
                
                if (errorMessage.includes('limit')) {
                    toast.error('Usage limit reached. Upgrade for unlimited conversions!');
                } else {
                    toast.error(errorMessage);
                }
            }
        } else {
            // Guest users: client-side conversion (no tracking)
            startTransition(async () => {
                const result = await convertText(originalText, converterId);
                if (result.success && result.result) {
                    setDisplayText(result.result);
                    toast.success('Text converted! Sign in for usage tracking.');
                } else {
                    toast.error(result.error || 'Conversion failed');
                }
            });
        }
    };

    // Calculate text statistics
    const stats = {
        characters: displayText.length,
        words: displayText.trim() ? displayText.trim().split(/\s+/).length : 0,
        sentences: displayText.trim() ? displayText.split(/[.!?]+/).filter(s => s.trim()).length : 0,
        lines: displayText.split('\n').length,
        palindrome: (() => {
            if (!displayText.trim()) return 'No';

            // Extract words and check each one
            const words = displayText.toLowerCase().match(/[a-z0-9]+/g) || [];
            const palindromes = words.filter(word => {
                if (word.length < 2) return false;
                const reversed = [...word].reverse().join('');
                return word === reversed;
            });

            return palindromes.length > 0 ? palindromes.join(', ') : 'No';
        })()
    };

    // Action handlers
    const handleCopy = async () => {
        if (!displayText) {
            toast.error('No text to copy');
            return;
        }
        try {
            await navigator.clipboard.writeText(displayText);
            toast.success('Copied to clipboard!');
        } catch {
            toast.error('Failed to copy text');
        }
    };

    const handleDownload = () => {
        if (!displayText) {
            toast.error('No text to download');
            return;
        }
        const blob = new Blob([displayText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'converted-text.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Text downloaded!');
    };

    const handleClear = () => {
        setDisplayText('');
        setOriginalText('');
        toast.success('Text cleared!');
    };

    // Group converters by category
    const categories: ConverterCategory[] = [
        {
            name: 'Basic Cases',
            icon: '📝',
            converters: CASE_CONVERTERS.filter(c => c.category === 'basic')
        },
        {
            name: 'Programming Cases',
            icon: '💻',
            converters: CASE_CONVERTERS.filter(c => c.category === 'programming')
        },
        {
            name: 'Symbol Separators',
            icon: '🔣',
            converters: CASE_CONVERTERS.filter(c => c.category === 'symbol')
        },
        {
            name: 'Text Effects',
            icon: '✨',
            converters: CASE_CONVERTERS.filter(c => c.category === 'effects')
        },
        {
            name: 'Encoding & Ciphers',
            icon: '🔐',
            converters: CASE_CONVERTERS.filter(c => c.category === 'encoding')
        },
        {
            name: 'Special Alphabets',
            icon: '🌐',
            converters: CASE_CONVERTERS.filter(c => c.category === 'special')
        },
        {
            name: 'Transformations',
            icon: '🔄',
            converters: CASE_CONVERTERS.filter(c => c.category === 'transform')
        },

    ].filter(cat => cat.converters.length > 0);

    return (
        <div className="space-y-4">
            {/* Usage Display for Authenticated Users */}
            {/* {userId && usageData && (
                <Card className="p-4 bg-muted/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">
                                Conversions Used: {usageData.count} / {usageData.maxPerPeriod === -1 ? '∞' : usageData.maxPerPeriod}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {usageData.tier === 'pro' || usageData.tier === 'advance' 
                                    ? 'Unlimited conversions' 
                                    : `${usageData.remaining} remaining this period`}
                            </p>
                        </div>
                        {usageData.remaining === 0 && usageData.tier !== 'pro' && usageData.tier !== 'advance' && (
                            <Button size="sm" variant="default">
                                Upgrade
                            </Button>
                        )}
                    </div>
                </Card>
            )} */}

            {/* Main Textarea */}
            <Card className="p-3 gap-3">
                <Textarea
                    value={displayText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder="Enter your text here to convert..."
                    className="min-h-[150px] text-sm resize-y font-mono"
                    disabled={isPending || caseConversion.isPending}
                />

                {/* Text Statistics */}
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>Characters: <strong>{stats.characters}</strong></span>
                    <span>Words: <strong>{stats.words}</strong></span>
                    <span>Sentences: <strong>{stats.sentences}</strong></span>
                    <span>Lines: <strong>{stats.lines}</strong></span>
                    <span>Palindrome: <strong>{stats.palindrome}</strong></span>
                </div>

                {/* Action Buttons */}
                <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                        onClick={handleCopy}
                        variant="outline"
                        size="sm"
                        disabled={isPending || !displayText}
                    >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                    </Button>
                    <Button
                        onClick={handleDownload}
                        variant="outline"
                        size="sm"
                        disabled={isPending || !displayText}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                    </Button>
                    <Button
                        onClick={handleClear}
                        variant="outline"
                        size="sm"
                        disabled={isPending || !displayText}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear
                    </Button>
                    {isPending && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground ml-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Converting...
                        </div>
                    )}
                </div>

                {/* Converter Categories */}
                <Accordion type="single" collapsible className="w-full">
                    <h2 className="text-lg font-semibold mb-1">Select Conversion</h2>
                    {categories.map((category) => (
                        <AccordionItem key={category.name} value={category.name}>
                            <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-3">
                                    <span className="text-1xl">{category.icon}</span>
                                    <div className="text-left flex w-full">
                                        <div className="font-semibold">{category.name}</div>
                                        <div className="text-sm text-muted-foreground ml-2 bg-secondary rounded-full px-2">{category.converters.length} options</div>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-1.5 pt-2">
                                    {category.converters.map((converter) => (
                                        <Button
                                            key={converter.id}
                                            onClick={() => handleConvert(converter.id)}
                                            variant="outline"
                                            size="sm"
                                            className="h-auto py-1 mx-2 my-0.5 justify-center text-center hover:bg-accent text-xs"
                                            disabled={isPending || !originalText.trim()}
                                        >
                                            {converter.name}
                                        </Button>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
                <span className='relative bg-secondary-foreground self-center w-full h-px' />
                
                {/* Info Section */}
                <h3 className="text-[18px] font-semibold p-0">💡 How to Use</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Type or paste your text in the textarea above</li>
                    <li>Expand any category and click a conversion button</li>
                    <li>The converted text appears instantly in the same textarea</li>
                    <li>Your original text is preserved for multiple conversions</li>
                    <li>Use Copy, Download, or Clear buttons as needed</li>
                </ul>
            </Card>
        </div>
    );
}

```