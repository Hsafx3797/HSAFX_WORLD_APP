'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Download, Loader2, AlertCircle, Upload, CheckCircle2 } from 'lucide-react';

// ============== TYPES ==============
interface ChequeFormData {
  countryName: string;
  bankName: string;
  payeePrefix: string;
  payeeName: string;
  payeeSuffix: string;
  payeeCase: 'TitleCase' | 'UpperCase' | 'LowerCase';
  date: string;
  dateFormat: 'DD/MM/YYYY' | 'DD-MM-YYYY' | 'DD MMM YYYY' | 'DD-MMM-YYYY';
  amount: string | number;
  amountInNumberPrefix: string;
  amountInNumberSuffix: string;
  amountFormat: 'UK' | 'US';
  numberingSystem: 'International' | 'Indian';
  amountWordsCase: 'UpperCase' | 'TitleCase';
  amountWordsPrefix: string;
  amountWordsSuffix: string;
  chequeOrientation: 'Portrait' | 'Landscape';
  acPayee: boolean;
  notNegotiable: boolean;
  orBearer: boolean;
}

interface CountriesBanksMapping {
  countries: string[];
  mapping: Record<string, string[]>;
}

interface GenerateChequeResponse {
  success: boolean;
  pdfBase64?: string;
  filename?: string;
  error?: string;
  errors?: string[];
}

// ============== CONSTANTS ==============
const VALIDATION = {
  payeeName: { maxLength: 35 },
  prefix: { maxLength: 10 },
  suffix: { maxLength: 10 },
};

const DEFAULT_FORM_DATA: ChequeFormData = {
  countryName: '',
  bankName: '',
  payeePrefix: '',
  payeeName: '',
  payeeSuffix: '',
  payeeCase: 'TitleCase',
  date: new Date().toISOString().split('T')[0]!,
  dateFormat: 'DD/MM/YYYY',
  amount: '',
  amountInNumberPrefix: 'Rs.',
  amountInNumberSuffix: '/-',
  amountFormat: 'UK',
  numberingSystem: 'International',
  amountWordsCase: 'UpperCase',
  amountWordsPrefix: 'RUPEES',
  amountWordsSuffix: 'ONLY',
  chequeOrientation: 'Portrait',
  acPayee: true,
  notNegotiable: true,
  orBearer: false,
};

// ============== UTILITY FUNCTIONS ==============
function transformTextCase(text: string, caseType: 'TitleCase' | 'UpperCase' | 'LowerCase'): string {
  switch (caseType) {
    case 'UpperCase': return text.toUpperCase();
    case 'LowerCase': return text.toLowerCase();
    case 'TitleCase':
    default:
      return text.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }
}

function numberToWordsInternational(num: number): string {
  if (num === 0) return 'Zero';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const scales = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];
  
  const convert = (n: number): string => {
    if (n < 20) return ones[n]!;
    if (n < 100) return tens[Math.floor(n / 10)]! + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)]! + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
    return '';
  };
  
  let words = '';
  let scaleIndex = 0;
  let remaining = Math.floor(num);
  
  while (remaining > 0) {
    const chunk = remaining % 1000;
    if (chunk > 0) {
      const chunkWords = convert(chunk) + (scales[scaleIndex] ? ' ' + scales[scaleIndex] : '');
      words = chunkWords + (words ? ' ' + words : '');
    }
    remaining = Math.floor(remaining / 1000);
    scaleIndex++;
  }
  
  return words.trim();
}

function numberToWordsIndian(num: number): string {
  if (num === 0) return 'Zero';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const convert = (n: number): string => {
    if (n < 20) return ones[n]!;
    if (n < 100) return tens[Math.floor(n / 10)]! + (n % 10 ? ' ' + ones[n % 10] : '');
    return '';
  };
  
  let words = '';
  let remaining = Math.floor(num);
  
  // Crore (10 million)
  if (remaining >= 10000000) {
    words += convert(Math.floor(remaining / 10000000)) + ' Crore ';
    remaining %= 10000000;
  }
  // Lakh (100 thousand)
  if (remaining >= 100000) {
    words += convert(Math.floor(remaining / 100000)) + ' Lakh ';
    remaining %= 100000;
  }
  // Thousand
  if (remaining >= 1000) {
    words += convert(Math.floor(remaining / 1000)) + ' Thousand ';
    remaining %= 1000;
  }
  // Hundred
  if (remaining >= 100) {
    words += ones[Math.floor(remaining / 100)] + ' Hundred ';
    remaining %= 100;
  }
  // Remaining
  if (remaining > 0) {
    if (words) words += 'and ';
    words += convert(remaining);
  }
  
  return words.trim();
}

function formatAmountInWords(
  amount: string | number,
  format: 'UK' | 'US',
  wordsCase: 'UpperCase' | 'TitleCase',
  numberingSystem: 'International' | 'Indian',
  prefix: string,
  suffix: string
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num) || num <= 0) return '';
  
  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num % 1) * 100);
  
  const toWords = numberingSystem === 'Indian' ? numberToWordsIndian : numberToWordsInternational;
  
  let words = toWords(integerPart);
  
  if (decimalPart > 0) {
    const connector = format === 'UK' ? ' and ' : ' ';
    words += connector + toWords(decimalPart) + ' Paisa';
  }
  
  // Apply case
  words = wordsCase === 'UpperCase' ? words.toUpperCase() : transformTextCase(words, 'TitleCase');
  
  // Add prefix/suffix
  if (prefix) words = transformTextCase(prefix, wordsCase) + ' ' + words;
  if (suffix) words = words + ' ' + transformTextCase(suffix, wordsCase);
  
  return words;
}

function formatAmountInNumber(
  amount: string | number,
  prefix: string,
  suffix: string,
  numberingSystem: 'International' | 'Indian'
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '';
  
  let formatted: string;
  if (numberingSystem === 'Indian') {
    // Indian numbering: 1,00,00,000
    const str = num.toFixed(2);
    const [intPart, decPart] = str.split('.');
    let intFormatted = '';
    const len = intPart!.length;
    for (let i = 0; i < len; i++) {
      if (i > 0) {
        if (i === len - 3 || (i > len - 3 && (len - i) % 2 === 1)) {
          intFormatted = ',' + intFormatted;
        }
      }
      intFormatted = intPart![len - 1 - i] + intFormatted;
    }
    formatted = intFormatted + '.' + decPart;
  } else {
    formatted = num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  
  return [prefix, formatted, suffix].filter(Boolean).join('');
}

function formatDateString(dateStr: string, format: ChequeFormData['dateFormat']): string {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthShort = monthNames[date.getMonth()];
  
  switch (format) {
    case 'DD/MM/YYYY': return `${day}/${month}/${year}`;
    case 'DD-MM-YYYY': return `${day}-${month}-${year}`;
    case 'DD MMM YYYY': return `${day} ${monthShort} ${year}`;
    case 'DD-MMM-YYYY': return `${day}-${monthShort}-${year}`;
    default: return `${day}/${month}/${year}`;
  }
}

function downloadPdf(base64: string, filename: string) {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'application/pdf' });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============== API CALLS ==============
async function fetchCountriesBanks(): Promise<CountriesBanksMapping> {
  const response = await fetch('/api/tools/cheque-generator/countries-banks');
  if (!response.ok) {
    throw new Error('Failed to fetch countries and banks');
  }
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch countries and banks');
  }
  return { countries: data.countries, mapping: data.mapping };
}

async function generateCheque(chequeData: {
  countryName: string;
  bankName: string;
  chequeOrientation: string;
  payeeName: string;
  date: string;
  amountInNumber: string;
  amountInWords: string;
  acPayee: boolean;
  notNegotiable: boolean;
  orBearer: boolean;
}): Promise<GenerateChequeResponse> {
  const response = await fetch('/api/tools/cheque-generator/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(chequeData),
  });
  return response.json();
}

async function generateBulkCheques(cheques: Array<{
  countryName: string;
  bankName: string;
  chequeOrientation: string;
  payeeName: string;
  date: string;
  amountInNumber: string;
  amountInWords: string;
  acPayee: boolean;
  notNegotiable: boolean;
  orBearer: boolean;
}>): Promise<GenerateChequeResponse & { chequeCount?: number }> {
  const response = await fetch('/api/tools/cheque-generator/generate-bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cheques }),
  });
  return response.json();
}

// ============== CHEQUE FORM COMPONENT ==============
function ChequeForm({ 
  onSuccess, 
  disabled = false 
}: { 
  onSuccess?: () => void; 
  disabled?: boolean;
}) {
  const [formData, setFormData] = React.useState<ChequeFormData>(DEFAULT_FORM_DATA);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [countriesBanks, setCountriesBanks] = React.useState<CountriesBanksMapping | null>(null);

  // Fetch countries and banks on mount
  React.useEffect(() => {
    let mounted = true;
    
    async function loadData() {
      try {
        const data = await fetchCountriesBanks();
        if (mounted) {
          setCountriesBanks(data);
          // Set default country/bank
          if (data.countries.length > 0) {
            const firstCountry = data.countries[0]!;
            const banks = data.mapping[firstCountry] || [];
            setFormData(prev => ({
              ...prev,
              countryName: firstCountry,
              bankName: banks[0] || '',
            }));
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load data');
        }
      } finally {
        if (mounted) {
          setIsLoadingData(false);
        }
      }
    }
    
    loadData();
    return () => { mounted = false; };
  }, []);

  // Available countries and banks from API
  const availableCountries = React.useMemo(() => {
    return countriesBanks?.countries || [];
  }, [countriesBanks]);
  
  const availableBanks = React.useMemo(() => {
    if (!countriesBanks || !formData.countryName) return [];
    return countriesBanks.mapping[formData.countryName] || [];
  }, [countriesBanks, formData.countryName]);

  // Auto-select first bank when country changes
  React.useEffect(() => {
    if (availableBanks.length > 0 && !availableBanks.includes(formData.bankName)) {
      setFormData(prev => ({ ...prev, bankName: availableBanks[0]! }));
    }
  }, [availableBanks, formData.bankName]);

  // Real-time calculated values
  const previewAmountInWords = React.useMemo(() => formatAmountInWords(
    formData.amount,
    formData.amountFormat,
    formData.amountWordsCase,
    formData.numberingSystem,
    formData.amountWordsPrefix,
    formData.amountWordsSuffix
  ), [formData.amount, formData.amountFormat, formData.amountWordsCase, formData.numberingSystem, formData.amountWordsPrefix, formData.amountWordsSuffix]);

  const previewAmountInNumber = React.useMemo(() => formatAmountInNumber(
    formData.amount,
    formData.amountInNumberPrefix,
    formData.amountInNumberSuffix,
    formData.numberingSystem
  ), [formData.amount, formData.amountInNumberPrefix, formData.amountInNumberSuffix, formData.numberingSystem]);

  const handleInputChange = (field: keyof ChequeFormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleAmountChange = (value: string) => {
    if (!/^\d*\.?\d*$/.test(value)) return;
    if (value === '') {
      handleInputChange('amount', '');
      return;
    }
    const [intPart = '', decPart = ''] = value.split('.');
    const totalDigits = intPart.length + decPart.length;
    if (totalDigits > 9 || decPart.length > 2) return;
    const numValue = parseFloat(value);
    handleInputChange('amount', isNaN(numValue) ? value : numValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    if (!formData.payeeName.trim()) {
      setError('Payee name is required');
      return;
    }
    if (!formData.amount || parseFloat(String(formData.amount)) <= 0) {
      setError('Valid amount is required');
      return;
    }
    if (!formData.date) {
      setError('Date is required');
      return;
    }

    setIsLoading(true);

    try {
      // Build full payee name
      const fullPayeeName = [
        formData.payeePrefix,
        transformTextCase(formData.payeeName, formData.payeeCase),
        formData.payeeSuffix
      ].filter(Boolean).join(' ').substring(0, 35);

      // Prepare cheque data for API
      const chequeData = {
        countryName: formData.countryName,
        bankName: formData.bankName,
        chequeOrientation: formData.chequeOrientation,
        payeeName: fullPayeeName,
        date: formatDateString(formData.date, formData.dateFormat),
        amountInNumber: previewAmountInNumber,
        amountInWords: previewAmountInWords,
        acPayee: formData.acPayee,
        notNegotiable: formData.notNegotiable,
        orBearer: formData.orBearer,
      };

      // Call API
      const result = await generateCheque(chequeData);

      if (!result.success) {
        throw new Error(result.error || result.errors?.join(', ') || 'Failed to generate cheque');
      }

      // Download PDF
      if (result.pdfBase64 && result.filename) {
        downloadPdf(result.pdfBase64, result.filename);
      }

      onSuccess?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate cheque');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Loading bank data...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Cheque Generator
          </CardTitle>
          <CardDescription>
            Generate printable cheques with precise bank-specific layouts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Bank Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Select
                value={formData.countryName}
                onValueChange={(v) => handleInputChange('countryName', v)}
                disabled={disabled}
              >
                <SelectTrigger id="country">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {availableCountries.map((country) => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank">Bank *</Label>
              <Select
                value={formData.bankName}
                onValueChange={(v) => handleInputChange('bankName', v)}
                disabled={disabled || !formData.countryName}
              >
                <SelectTrigger id="bank">
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent>
                  {availableBanks.map((bank) => (
                    <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payee Information */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="space-y-2">
              <Label htmlFor="payeePrefix">Prefix</Label>
              <Input
                id="payeePrefix"
                value={formData.payeePrefix}
                onChange={(e) => handleInputChange('payeePrefix', e.target.value)}
                placeholder="Mr., Dr."
                maxLength={VALIDATION.prefix.maxLength}
                disabled={disabled}
              />
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="payeeName">Payee Name *</Label>
              <Input
                id="payeeName"
                value={formData.payeeName}
                onChange={(e) => handleInputChange('payeeName', e.target.value)}
                placeholder="John Doe"
                maxLength={VALIDATION.payeeName.maxLength}
                required
                disabled={disabled}
              />
              <p className="text-xs text-muted-foreground">{formData.payeeName.length}/{VALIDATION.payeeName.maxLength}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payeeSuffix">Suffix</Label>
              <Input
                id="payeeSuffix"
                value={formData.payeeSuffix}
                onChange={(e) => handleInputChange('payeeSuffix', e.target.value)}
                placeholder="Ltd, Inc"
                maxLength={VALIDATION.suffix.maxLength}
                disabled={disabled}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Payee Name Case</Label>
            <Select
              value={formData.payeeCase}
              onValueChange={(v) => handleInputChange('payeeCase', v as ChequeFormData['payeeCase'])}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TitleCase">Title Case</SelectItem>
                <SelectItem value="UpperCase">UPPER CASE</SelectItem>
                <SelectItem value="LowerCase">lower case</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date and Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label>Date Format</Label>
              <Select
                value={formData.dateFormat}
                onValueChange={(v) => handleInputChange('dateFormat', v as ChequeFormData['dateFormat'])}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="DD-MM-YYYY">DD-MM-YYYY</SelectItem>
                  <SelectItem value="DD MMM YYYY">DD MMM YYYY</SelectItem>
                  <SelectItem value="DD-MMM-YYYY">DD-MMM-YYYY</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Amount in number */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="space-y-2">
              <Label>Number Prefix</Label>
              <Input
                value={formData.amountInNumberPrefix}
                onChange={(e) => handleInputChange('amountInNumberPrefix', e.target.value)}
                placeholder="Rs., $"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                value={formData.amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                required
                disabled={disabled}
              />
              {previewAmountInNumber && (
                <p className="text-xs text-muted-foreground">
                  <strong>Preview:</strong> {previewAmountInNumber}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Number Suffix</Label>
              <Input
                value={formData.amountInNumberSuffix}
                onChange={(e) => handleInputChange('amountInNumberSuffix', e.target.value)}
                placeholder="/-"
                disabled={disabled}
              />
            </div>
          </div>

          {/* Amount formatting */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="space-y-2">
              <Label>Words Prefix</Label>
              <Input
                value={formData.amountWordsPrefix}
                onChange={(e) => handleInputChange('amountWordsPrefix', e.target.value)}
                placeholder="RUPEES"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label>Numbering System</Label>
              <Select
                value={formData.numberingSystem}
                onValueChange={(v) => handleInputChange('numberingSystem', v as ChequeFormData['numberingSystem'])}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="International">International (1,000,000)</SelectItem>
                  <SelectItem value="Indian">Indian (10,00,000)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Words Case</Label>
              <Select
                value={formData.amountWordsCase}
                onValueChange={(v) => handleInputChange('amountWordsCase', v as ChequeFormData['amountWordsCase'])}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UpperCase">UPPER CASE</SelectItem>
                  <SelectItem value="TitleCase">Title Case</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Amount Style</Label>
              <Select
                value={formData.amountFormat}
                onValueChange={(v) => handleInputChange('amountFormat', v as ChequeFormData['amountFormat'])}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UK">UK (and)</SelectItem>
                  <SelectItem value="US">US ( )</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Words Suffix</Label>
              <Input
                value={formData.amountWordsSuffix}
                onChange={(e) => handleInputChange('amountWordsSuffix', e.target.value)}
                placeholder="ONLY"
                disabled={disabled}
              />
            </div>
          </div>

          {previewAmountInWords && (
            <div className="text-xs text-muted-foreground">
              <strong>Preview:</strong> {previewAmountInWords}
            </div>
          )}

          {/* Cheque Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Orientation</Label>
              <Select
                value={formData.chequeOrientation}
                onValueChange={(v) => handleInputChange('chequeOrientation', v as ChequeFormData['chequeOrientation'])}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Portrait">Portrait</SelectItem>
                  <SelectItem value="Landscape">Landscape</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="acPayee"
                checked={formData.acPayee}
                onCheckedChange={(checked) => handleInputChange('acPayee', checked as boolean)}
                disabled={disabled}
              />
              <Label htmlFor="acPayee" className="cursor-pointer">A/C Payee</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="notNegotiable"
                checked={formData.notNegotiable}
                onCheckedChange={(checked) => handleInputChange('notNegotiable', checked as boolean)}
                disabled={disabled}
              />
              <Label htmlFor="notNegotiable" className="cursor-pointer">Not Negotiable</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="orBearer"
                checked={formData.orBearer}
                onCheckedChange={(checked) => handleInputChange('orBearer', checked as boolean)}
                disabled={disabled}
              />
              <Label htmlFor="orBearer" className="cursor-pointer">Or Bearer</Label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button type="submit" size="lg" disabled={isLoading || disabled}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Generate & Download PDF
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

// ============== CSV BULK UPLOAD COMPONENT ==============
function CSVBulkUpload({ 
  onSuccess, 
  disabled = false 
}: { 
  onSuccess?: (count: number) => void; 
  disabled?: boolean;
}) {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const CSV_HEADERS = [
    'countryName', 'bankName', 'chequeOrientation', 'payeeName', 
    'date', 'amountInNumber', 'amountInWords',
    'acPayee', 'notNegotiable', 'orBearer'
  ];

  const CSV_EXAMPLE = [
    ['Pakistan', 'Allied Bank Limited', 'Portrait', 'Mr. John Doe', 
     '31/10/2025', 'Rs.1,500.00/-', 'RUPEES ONE THOUSAND FIVE HUNDRED ONLY',
     'true', 'true', 'false'],
    ['Pakistan', 'Habib Bank Limited', 'Landscape', 'Dr. Jane Smith', 
     '01/11/2025', 'Rs.25,000.00/-', 'RUPEES TWENTY FIVE THOUSAND ONLY',
     'true', 'false', 'true'],
  ];

  const handleDownloadTemplate = () => {
    const csvContent = [CSV_HEADERS.join(','), ...CSV_EXAMPLE.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cheque_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB');
      return;
    }

    setIsProcessing(true);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file is empty or invalid');
      }

      // Parse CSV
      const headers = lines[0]!.split(',').map(h => h.trim());
      const cheques = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i]!.split(',').map(v => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        cheques.push({
          countryName: row.countryName || 'Pakistan',
          bankName: row.bankName || 'Allied Bank Limited',
          chequeOrientation: (row.chequeOrientation as 'Portrait' | 'Landscape') || 'Portrait',
          payeeName: row.payeeName || '',
          date: row.date || new Date().toLocaleDateString('en-GB'),
          amountInNumber: row.amountInNumber || '',
          amountInWords: row.amountInWords || '',
          acPayee: row.acPayee === 'true',
          notNegotiable: row.notNegotiable === 'true',
          orBearer: row.orBearer === 'true',
        });
      }

      // Call bulk API
      const result = await generateBulkCheques(cheques);

      if (!result.success) {
        throw new Error(result.error || result.errors?.join(', ') || 'Failed to generate cheques');
      }

      // Download PDF
      if (result.pdfBase64 && result.filename) {
        downloadPdf(result.pdfBase64, result.filename);
      }

      setSuccess(`Successfully generated ${result.chequeCount || cheques.length} cheque(s)! PDF downloaded.`);
      onSuccess?.(result.chequeCount || cheques.length);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to process CSV file');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Bulk Cheque Generation
            </CardTitle>
            <CardDescription className="mt-2">
              Upload a CSV file to generate multiple cheques at once
            </CardDescription>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadTemplate}
              disabled={disabled || isProcessing}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Download CSV Template
            </Button>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={disabled || isProcessing}
                className="hidden"
                id="csv-upload"
              />
              <Button
                type="button"
                size="lg"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing & Generating PDF...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload CSV & Generate PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {success && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground pt-2 space-y-2 border-t">
          <p className="font-bold">CSV Format:</p>
          <p className="font-mono text-xs bg-muted p-2 rounded overflow-x-auto">
            {CSV_HEADERS.join(', ')}
          </p>
          <p className="font-bold mt-3">Instructions:</p>
          <ol className="list-decimal list-inside space-y-1 pl-2">
            <li>Download the CSV template above</li>
            <li>Fill in your cheque data (one row per cheque)</li>
            <li>Ensure all required fields are populated</li>
            <li>Save the file and upload it here</li>
            <li>A single PDF with all cheques will be generated and downloaded</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}

// ============== MAIN COMPONENT ==============
export interface ChequeGeneratorProps {
  className?: string;
}

export function ChequeGenerator({ className }: ChequeGeneratorProps) {
  return (
    <div className={cn('container max-w-4xl mx-auto px-4 py-8', className)}>
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
          <FileText className="h-9 w-9" />
          Printable Cheque Generator
        </h1>
        <p className="text-muted-foreground">
          Generate bank-specific printable cheques with precise layouts for 30+ countries
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Main Form */}
        <ChequeForm />

        {/* CSV Bulk Upload */}
        <CSVBulkUpload />
      </div>
    </div>
  );
}

export default ChequeGenerator;
