### DOCUMENT GENERATION (Cheque/Layout-sensitive)

**UI Pattern:**
`[Form / CSV Upload] → [Template Selector] → [PDF Preview] → [Download]`

```page>tsx
'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, FileText, Loader2 } from 'lucide-react';

import { ChequeForm, CSVBulkUpload } from '@/components/custom-ui/cheque';
import {
  type SubscriptionTier,
  CHEQUE_SUBSCRIPTION_LIMITS,
} from '@/serverSide/printableCheque/types';
import {
  getGuestChequeUsage,
  incrementGuestChequeUsage,
} from '@/serverSide/printableCheque/api';
import { useUser, useUserSubscription } from '@/hooks/queries';

import { UpgradeModal } from '@/components/modals/UpgradeModal';

export default function ChequePage() {
  const { data: userData, isLoading: isLoadingUser } = useUser();
  const user = userData?.success ? userData.user : null;
  const { data: subscription, isLoading: isLoadingSub } = useUserSubscription(user?.id || '');
  

  const [remainingCount, setRemainingCount] = useState<number | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [limitInfo, setLimitInfo] = useState<{ current?: number; max?: number | null } | null>(null);

  // Determine user tier
  const userTier: SubscriptionTier = !user 
    ? 'guest'
    : (subscription?.plan?.tier as SubscriptionTier) || 'free';

  // Debug: log subscription data
  useEffect(() => {
    if (user) {
      console.log('[CHEQUE] User tier:', userTier, 'Subscription:', subscription);
    }
  }, [user, userTier, subscription]);

  // Initialize usage for guest or free users
  const guestUsage = !user ? getGuestChequeUsage() : null;
  
  useEffect(() => {
    async function loadUsage() {
      if (guestUsage) {
        setRemainingCount(guestUsage.remaining);
      } else if (user?.id) {
        // Get usage from database via API
        try {
          const response = await fetch(`/api/usage/current?userId=${user.id}&feature=cheque-generation`);
          if (response.ok) {
            const usageData = await response.json();
            // Keep null as null (unlimited), don't convert to 0
            setRemainingCount(usageData.remaining);
          }
        } catch (error) {
          console.error('Failed to load usage:', error);
        }
      }
    }
    loadUsage();
  }, [user, guestUsage]);

  const limits = CHEQUE_SUBSCRIPTION_LIMITS[userTier];
  // null means unlimited (from deprecated tier limits), -1 means unlimited (from constants)
  const canGenerateCheque = limits.maxChequesPerDay === -1 || remainingCount === null || remainingCount > 0;

  const handleChequeSuccess = async () => {
    // Increment usage count
    if (userTier === 'guest') {
      incrementGuestChequeUsage();
      const updated = getGuestChequeUsage();
      setRemainingCount(updated.remaining);
    } else if (user?.id) {
      // Reload usage from database via API
      try {
        const response = await fetch(`/api/usage/current?userId=${user.id}&feature=cheque-generation`);
        if (response.ok) {
          const usageData = await response.json();
          setRemainingCount(usageData.remaining);
        }
      } catch (error) {
        console.error('Failed to reload usage:', error);
      }
    }
  };

  const handleBulkSuccess = async () => {
    // Bulk is only for Pro/Advance users (unlimited), but reload usage anyway
    if (user?.id) {
      try {
        const response = await fetch(`/api/usage/current?userId=${user.id}&feature=cheque-generation`);
        if (response.ok) {
          const usageData = await response.json();
          setRemainingCount(usageData.remaining);
        }
      } catch (error) {
        console.error('Failed to reload usage:', error);
      }
    }
  };

  const handleUpgradeRequired = (limit: { current?: number; max?: number | null }) => {
    setLimitInfo(limit);
    setShowUpgradeModal(true);
  };

  const isLoading = isLoadingUser || (user && isLoadingSub);

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
          <FileText className="h-9 w-9" />
          Printable Cheque Generator
        </h1>
      </div>

      {/* Limit Reached Warning */}
      {!canGenerateCheque && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Daily limit reached!</strong> You have used all {limits.maxChequesPerDay} cheques
            for today.
            {userTier === 'guest' && ' Sign up for a free account to get more cheques per day.'}
            {userTier === 'free' && ' Upgrade to Pro for unlimited cheque generation.'}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4">
          
        {/* Main Form - Takes 1 column on large screens */}
        <div className="">
          <ChequeForm 
            onSuccess={handleChequeSuccess} 
            disabled={!canGenerateCheque}
            onUpgradeRequired={handleUpgradeRequired}
            />
        </div>

        {/* CSV Bulk Upload - Only for Pro/Advance users */}
          {(userTier === 'pro' || userTier === 'advance') && (
            <div className="">
              <CSVBulkUpload 
                onSuccess={handleBulkSuccess}
                disabled={!canGenerateCheque}
              />
            </div>
          )}
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentTier={userTier}
        feature="Cheque Generator"
        currentUsage={limitInfo?.current}
        maxLimit={limitInfo?.max === null ? undefined : limitInfo?.max}
      />

    </div>
  );
}

```

```ChequeForm.tsx
'use client';

/**
 * Printable Cheque - Main Form Component
 * Single cheque generation with real-time transformations
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, FileText, Loader2 } from 'lucide-react';

import {
  type ChequeFormData,
  type CountriesBanksMapping,
  DEFAULT_CHEQUE_FORM_DATA,
  CHEQUE_VALIDATION,
} from '@/serverSide/printableCheque/types';
import {
  generateChequePDF,
  downloadAndOpenPDF,
  getCountriesBanks,
} from '@/serverSide/printableCheque/api';
import {
  transformChequeFormData,
  validateChequeFormData,
  generateChequeFilename,
  formatAmountInWords,
  formatAmountInNumber,
  transformTextCase,
} from '@/serverSide/printableCheque/utils';

interface ChequeFormProps {
  onSuccess?: () => void;
  disabled?: boolean;
  onUpgradeRequired?: (limit: any) => void;
}

export function ChequeForm({ onSuccess, disabled = false, onUpgradeRequired }: ChequeFormProps) {
  const [formData, setFormData] = useState<ChequeFormData>(DEFAULT_CHEQUE_FORM_DATA);
  const [countriesBanks, setCountriesBanks] = useState<CountriesBanksMapping>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Available countries and banks
  const availableCountries = useMemo(() => Object.keys(countriesBanks), [countriesBanks]);
  const availableBanks = useMemo(() => {
    if (!formData.countryName) return [];
    return Object.keys(countriesBanks[formData.countryName] || {});
  }, [countriesBanks, formData.countryName]);

  // Real-time calculated values
  const previewAmountInWords = useMemo(() => {
    return formatAmountInWords(
      formData.amount,
      formData.amountFormat,
      formData.amountWordsCase,
      formData.numberingSystem,
      formData.amountWordsPrefix,
      formData.amountWordsSuffix
    );
  }, [
    formData.amount,
    formData.amountFormat,
    formData.amountWordsCase,
    formData.numberingSystem,
    formData.amountWordsPrefix,
    formData.amountWordsSuffix,
  ]);

  const previewAmountInNumber = useMemo(() => {
    return formatAmountInNumber(
      formData.amount,
      formData.amountInNumberPrefix,
      formData.amountInNumberSuffix,
      formData.numberingSystem
    );
  }, [
    formData.amount,
    formData.amountInNumberPrefix,
    formData.amountInNumberSuffix,
    formData.numberingSystem,
  ]);

  // Load countries and banks on mount
  useEffect(() => {
    async function loadCountriesAndBanks() {
      try {
        const data = await getCountriesBanks();
        setCountriesBanks(data);

        // Auto-select first country and bank
        const firstCountry = Object.keys(data)[0];
        if (firstCountry) {
          const firstBank = Object.keys(data[firstCountry])[0];
          setFormData((prev) => ({
            ...prev,
            countryName: firstCountry,
            bankName: firstBank || '',
          }));
        }
        // Clear any previous error on successful load
        setError(null);
      } catch (_err: unknown) {
        setError('Failed to load countries and banks. Backend might be offline.');
      } finally {
        setIsLoadingCountries(false);
      }
    }

    loadCountriesAndBanks();
  }, []);

  // Auto-select first bank when country changes
  useEffect(() => {
    if (formData.countryName && countriesBanks[formData.countryName]) {
      const banks = Object.keys(countriesBanks[formData.countryName]);
      if (banks.length > 0 && !banks.includes(formData.bankName)) {
        setFormData((prev) => ({ ...prev, bankName: banks[0] }));
      }
    }
  }, [formData.countryName, countriesBanks, formData.bankName]);

  // Apply text case transformations automatically
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      payeeName: prev.payeeName ? transformTextCase(prev.payeeName, prev.payeeCase) : '',
      payeePrefix: prev.payeePrefix ? transformTextCase(prev.payeePrefix, prev.payeeCase) : '',
      payeeSuffix: prev.payeeSuffix ? transformTextCase(prev.payeeSuffix, prev.payeeCase) : '',
    }));
  }, [formData.payeeCase]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      amountWordsPrefix: prev.amountWordsPrefix
        ? transformTextCase(prev.amountWordsPrefix, prev.amountWordsCase)
        : '',
      amountWordsSuffix: prev.amountWordsSuffix
        ? transformTextCase(prev.amountWordsSuffix, prev.amountWordsCase)
        : '',
    }));
  }, [formData.amountWordsCase]);

  const handleInputChange = (field: keyof ChequeFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleAmountChange = (value: string) => {
    // Allow only digits and one dot
    if (!/^\d*\.?\d*$/.test(value)) return;

    if (value === '') {
      handleInputChange('amount', '');
      return;
    }

    // Split into integer and decimal parts
    const [intPart = '', decPart = ''] = value.split('.');
    const totalDigits = intPart.length + decPart.length;

    // Enforce constraints
    if (totalDigits > 9 || decPart.length > 2) return;

    const numValue = parseFloat(value);
    handleInputChange('amount', isNaN(numValue) ? value : numValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    const validation = validateChequeFormData(formData);
    if (!validation.isValid) {
      setError(validation.errors.join('. '));
      return;
    }

    setIsLoading(true);

    try {
      // Transform form data to backend format
      const chequeData = transformChequeFormData(formData);

      // Generate PDF
      const blob = await generateChequePDF(chequeData);

      // Download and open in new tab
      const filename = generateChequeFilename(formData.payeeName);
      await downloadAndOpenPDF(blob, filename);

      // Call success callback
      onSuccess?.();
    } catch (err: any) {
      if (err.status === 429) {
        // Tier limit exceeded
        setError(err.message || 'Usage limit exceeded');
        onUpgradeRequired?.(err.limit);
      } else if (err.message.includes('Failed to fetch')) {
        setError('Backend server not running on port 8000. Please start the server.');
      } else if (err.message.includes('500')) {
        setError('Server error. Check console for details.');
      } else {
        setError(err.message || 'Failed to generate cheque');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingCountries) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Loading banks...</span>
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
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error Alert */}
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
                <SelectTrigger className="w-full" id="country">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {availableCountries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
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
                <SelectTrigger className="w-full" id="bank">
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent>
                  {availableBanks.map((bank) => (
                    <SelectItem key={bank} value={bank}>
                      {bank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payee Information */}
          <div className="space-y-2">
            {/* <h3 className="text-sm font-semibold">Payee Information</h3> */}

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">

              <div className="space-y-2">
                <Label htmlFor="payeePrefix">Prefix</Label>
                <Input
                  id="payeePrefix"
                  value={formData.payeePrefix}
                  onChange={(e) => handleInputChange('payeePrefix', e.target.value)}
                  placeholder="Mr., Dr."
                  maxLength={CHEQUE_VALIDATION.prefix.maxLength}
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="payeeName">
                  Payee Name *
                </Label>
                <Input
                  id="payeeName"
                  value={formData.payeeName}
                  onChange={(e) => handleInputChange('payeeName', e.target.value)}
                  placeholder="John Doe"
                  maxLength={CHEQUE_VALIDATION.payeeName.maxLength}
                  required
                  disabled={disabled}
                />
                <p className="absolute text-xs text-muted-foreground">{formData.payeeName.length}/{CHEQUE_VALIDATION.payeeName.maxLength}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payeeSuffix">Suffix</Label>
                <Input
                  id="payeeSuffix"
                  value={formData.payeeSuffix}
                  onChange={(e) => handleInputChange('payeeSuffix', e.target.value)}
                  placeholder="Ltd, Inc"
                  maxLength={CHEQUE_VALIDATION.suffix.maxLength}
                  disabled={disabled}
                />
              </div>

            </div>

            <div className="space-y-2">
              <Label htmlFor="payeeCase">Payee Name Case</Label>
              <Select
                value={formData.payeeCase}
                onValueChange={(v: any) => handleInputChange('payeeCase', v)}
                disabled={disabled}
              >
                <SelectTrigger id="payeeCase">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TitleCase">Title Case</SelectItem>
                  <SelectItem value="UpperCase">UPPER CASE</SelectItem>
                  <SelectItem value="LowerCase">lower case</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              <Label htmlFor="dateFormat">Date Format</Label>
              <Select
                value={formData.dateFormat}
                onValueChange={(v: any) => handleInputChange('dateFormat', v)}
                disabled={disabled}
              >
                <SelectTrigger id="dateFormat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="DD-MM-YYYY">DD-MM-YYYY</SelectItem>
                  <SelectItem value="DD MMM YYYY">DD MMM YY</SelectItem>
                  <SelectItem value="DD-MMM-YYYY">DD-MMM-YYYY</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className='grid grid-cols-1 md:grid-cols-5 gap-3'>

              <div className="space-y-2">
                <Label htmlFor="amountInNumberPrefix">Number Prefix</Label>
                <Input
                  id="amountInNumberPrefix"
                  value={formData.amountInNumberPrefix}
                  onChange={(e) => handleInputChange('amountInNumberPrefix', e.target.value)}
                  placeholder="Rs., $"
                  disabled={disabled}
                />
              </div>

              {/* Amount in number inputfield */}
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
                  className=''
                />
                  {previewAmountInNumber && (
                    <p className="text-xs text-muted-foreground">
                      <strong>Preview:</strong> {previewAmountInNumber}
                    </p>
                  )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amountInNumberSuffix">Number Suffix</Label>
                <Input
                  id="amountInNumberSuffix"
                  value={formData.amountInNumberSuffix}
                  onChange={(e) => handleInputChange('amountInNumberSuffix', e.target.value)}
                  placeholder="/-"
                  disabled={disabled}
                />
              </div>
            </div>
          </div>

          {/* Amount Formatting */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">

              <div className="space-y-2">
                <Label htmlFor="amountWordsPrefix">Words Prefix</Label>
                <Input
                  id="amountWordsPrefix"
                  value={formData.amountWordsPrefix}
                  onChange={(e) => handleInputChange('amountWordsPrefix', e.target.value)}
                  placeholder="RUPEES"
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberingSystem">Numbering System</Label>
                <Select
                  value={formData.numberingSystem}
                  onValueChange={(v: any) => handleInputChange('numberingSystem', v)}
                  disabled={disabled}
                >
                  <SelectTrigger id="numberingSystem">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="International">International (1,000,000)</SelectItem>
                    <SelectItem value="Indian">Indian (10,00,000)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amountWordsCase">Words Case</Label>
                <Select
                  value={formData.amountWordsCase}
                  onValueChange={(v: any) => handleInputChange('amountWordsCase', v)}
                  disabled={disabled}
                >
                  <SelectTrigger id="amountWordsCase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UpperCase">UPPER CASE</SelectItem>
                    <SelectItem value="TitleCase">Title Case</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amountFormat">Amount Style</Label>
                <Select
                  value={formData.amountFormat}
                  onValueChange={(v: any) => handleInputChange('amountFormat', v)}
                  disabled={disabled}
                >
                  <SelectTrigger id="amountFormat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UK">UK (and)</SelectItem>
                    <SelectItem value="US">US ( )</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amountWordsSuffix">Words Suffix</Label>
                <Input
                  id="amountWordsSuffix"
                  value={formData.amountWordsSuffix}
                  onChange={(e) => handleInputChange('amountWordsSuffix', e.target.value)}
                  placeholder="ONLY"
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2 col-span-5">
                {previewAmountInWords && (
                  <div className="text-xs text-muted-foreground">
                    <strong>Preview:</strong> {previewAmountInWords}
                  </div>
                )}
              </div>
            </div>


          </div>

          {/* Cheque Options */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="orientation">Orientation</Label>
                <Select
                  value={formData.chequeOrientation}
                  onValueChange={(v: any) => handleInputChange('chequeOrientation', v)}
                  disabled={disabled}
                >
                  <SelectTrigger id="orientation">
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
                  onCheckedChange={(checked) =>
                    handleInputChange('acPayee', checked as boolean)
                  }
                  disabled={disabled}
                />
                <Label htmlFor="acPayee" className="cursor-pointer">
                  A/C Payee
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notNegotiable"
                  checked={formData.notNegotiable}
                  onCheckedChange={(checked) =>
                    handleInputChange('notNegotiable', checked as boolean)
                  }
                  disabled={disabled}
                />
                <Label htmlFor="notNegotiable" className="cursor-pointer">
                  Not Negotiable
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="orBearer"
                  checked={formData.orBearer}
                  onCheckedChange={(checked) =>
                    handleInputChange('orBearer', checked as boolean)
                  }
                  disabled={disabled}
                />
                <Label htmlFor="orBearer" className="cursor-pointer">
                  Or Bearer
                </Label>
              </div>
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
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Cheque PDF
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

```

```CSVBulkUpload.tsx
'use client';

/**
 * Printable Cheque - CSV Bulk Upload Component
 * Pro/Pro+ only feature for bulk cheque generation
 */

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, FileSpreadsheet, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

import type { BulkChequeData, ChequeCSVRow } from '@/serverSide/printableCheque/types';
import { generateBulkChequePDF, downloadAndOpenPDF } from '@/serverSide/printableCheque/api';
import { formatAmountInWords } from '@/serverSide/printableCheque/utils';

interface CSVBulkUploadProps {
  disabled?: boolean;
  onSuccess?: (count: number) => void;
}

// CSV Template Headers
const CSV_HEADERS = [
  'countryName',
  'bankName',
  'chequeOrientation',
  'payeePrefix',
  'payeeName',
  'payeeSuffix',
  'date',
  'amount',
  'amountInNumberPrefix',
  'amountInNumberSuffix',
  'amountFormat',
  'numberingSystem',
  'amountWordsPrefix',
  'amountWordsSuffix',
  'acPayee',
  'notNegotiable',
  'orBearer',
];

// CSV Template Example Data
const CSV_EXAMPLE_DATA = [
  [
    'Pakistan',
    'Allied Bank Limited',
    'Portrait',
    'Mr.',
    'John Doe',
    'Ltd',
    '31/10/2025',
    '1500.75',
    'Rs.',
    '/-',
    'UK',
    'International',
    'RUPEES',
    'ONLY',
    'true',
    'true',
    'false',
  ],
  [
    'Pakistan',
    'HBL Bank',
    'Landscape',
    'Dr.',
    'Jane Smith',
    '',
    '01/11/2025',
    '25000',
    'Rs.',
    '/-',
    'UK',
    'Indian',
    'RUPEES',
    'ONLY',
    'true',
    'false',
    'true',
  ],
];

export function CSVBulkUpload({ disabled = false, onSuccess }: CSVBulkUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Download CSV template
   */
  const handleDownloadTemplate = () => {
    const csvContent = [
      CSV_HEADERS.join(','),
      ...CSV_EXAMPLE_DATA.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cheque_template.csv';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Parse CSV file
   */
  const parseCSV = (csvText: string): ChequeCSVRow[] => {
    const lines = csvText.split('\n').filter((line) => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file is empty or invalid');
    }

    const headers = lines[0].split(',').map((h) => h.trim());
    const rows: ChequeCSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const row: any = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      // Validate required fields
      if (!row.payeeName || !row.date || !row.amount) {
        console.warn(`Row ${i}: Missing required fields, skipping`);
        continue;
      }

      rows.push(row as ChequeCSVRow);
    }

    return rows;
  };

  /**
   * Convert CSV row to ChequeData
   */
  const convertCSVRowToChequeData = (row: ChequeCSVRow) => {
    // Parse amount
    const amount = parseFloat(row.amount) || 0;
    
    // Get format settings from CSV or use defaults
    const amountFormat = (row.amountFormat as 'UK' | 'US') || 'UK';
    const numberingSystem = (row.numberingSystem as 'International' | 'Indian') || 'International';
    
    return {
      countryName: row.countryName || 'Pakistan',
      bankName: row.bankName || 'Allied Bank Limited',
      chequeOrientation: (row.chequeOrientation || 'Portrait') as 'Portrait' | 'Landscape',
      payeeName: [row.payeePrefix, row.payeeName, row.payeeSuffix]
        .filter(Boolean)
        .join(' ')
        .trim()
        .substring(0, 35),
      date: row.date,
      amountInNumber: [row.amountInNumberPrefix, row.amount, row.amountInNumberSuffix]
        .filter(Boolean)
        .join(' ')
        .trim(),
      amountInWords: formatAmountInWords(
        amount,
        amountFormat,
        'UpperCase',
        numberingSystem,
        row.amountWordsPrefix || '',
        row.amountWordsSuffix || ''
      ),
      acPayee: row.acPayee?.toLowerCase() === 'true',
      notNegotiable: row.notNegotiable?.toLowerCase() === 'true',
      orBearer: row.orBearer?.toLowerCase() === 'true',
    };
  };

  /**
   * Handle file upload
   */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);
    setPreviewCount(null);

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB');
      return;
    }

    setIsProcessing(true);

    try {
      // Read file
      const text = await file.text();

      // Parse CSV
      const rows = parseCSV(text);

      if (rows.length === 0) {
        throw new Error('No valid cheque data found in CSV');
      }

      setPreviewCount(rows.length);

      // Convert rows to cheque data
      const cheques = rows.map(convertCSVRowToChequeData);

      // Create bulk data
      const bulkData: BulkChequeData = {
        cheques,
        filename: `bulk_cheques_${Date.now()}`,
      };

      // Generate PDF
      const blob = await generateBulkChequePDF(bulkData);

      // Download and open
      await downloadAndOpenPDF(blob, `${bulkData.filename}.pdf`);

      setSuccess(`Successfully generated ${cheques.length} cheque(s)!`);
      onSuccess?.(cheques.length);
    } catch (err: any) {
      if (err.message.includes('Failed to fetch')) {
        setError('Backend server not running on port 8000. Please start the server.');
      } else {
        setError(err.message || 'Failed to process CSV file');
      }
    } finally {
      setIsProcessing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card className="gap-2 p-4">
      <CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">

          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Bulk Cheque Generation
              </CardTitle>
              <CardDescription className="mt-2">
                Upload a CSV file to generate multiple cheques at once
              </CardDescription>
            </div>
          </div>

        {/* Download Template Button */}
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

            {/* Upload CSV Button */}
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
                    Processing CSV...
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
        {/* Success Message */}
        {success && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Preview Count */}
        {previewCount !== null && (
          <Alert>
            <AlertDescription>
              <strong>Processing:</strong> {previewCount} cheque(s) found in CSV
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <div className="text-sm text-muted-foreground pt-2 space-y-2 border-t">
          <p className="font-bold">Instructions:</p>
          <ol className="list-decimal list-inside space-y-1 pl-2">
            <li>Download the CSV template above</li>
            <li>Fill in your cheque data (one row per cheque)</li>
            <li>Save the file and upload it here</li>
            <li>The PDF will be generated automatically with all cheques</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}

```

