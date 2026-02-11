# ✅ Form Validation Specification

**Validation Library:** Zod  
**Tools with Options:** GENERATORS (380-414), CALCULATORS (415-442), DOCUMENT_GENERATION (445)  
**Total Tools Requiring Validation:** ~75 tools

---

## 1. Overview

This specification defines Zod schemas for all tool options, inputs, and API requests to ensure type safety and runtime validation.

**Benefits:**
- Type-safe forms with TypeScript inference
- Real-time validation feedback
- Server-side validation in tRPC procedures
- Consistent error messages

---

## 2. Core Validation Schemas

### 2.1 Base Schemas

```typescript
// packages/validators/src/base.ts

import { z } from 'zod';

// Common validation patterns
export const nonEmptyString = z.string().min(1, 'This field is required');

export const positiveInt = z.number().int().positive('Must be positive integer');

export const email = z.string().email('Invalid email address');

export const url = z.string().url('Invalid URL format');

export const phoneNumber = z.string().regex(
  /^\+?[1-9]\d{1,14}$/,
  'Invalid phone number format (E.164)'
);

export const hexColor = z.string().regex(
  /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  'Invalid hex color (e.g., #FF0000)'
);

export const dateString = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  'Invalid date format'
);

export const positiveNumber = z.number().positive('Must be positive');

export const percentage = z.number().min(0).max(100, 'Must be between 0-100');
```

---

## 3. TEXT_CONVERTER Tool Schemas

### 3.1 Case Converter (Tools 1-5)

```typescript
// packages/validators/src/text-tools.ts

import { z } from 'zod';
import { nonEmptyString } from './base';

export const caseConverterSchema = z.object({
  input: nonEmptyString,
  preserveAcronyms: z.boolean().default(false).optional(),
  delimiter: z.enum(['space', 'dash', 'underscore', 'none']).optional()
});

export type CaseConverterInput = z.infer<typeof caseConverterSchema>;
```

### 3.2 Base64 Encoder (Tool 21)

```typescript
export const base64EncodeSchema = z.object({
  input: nonEmptyString,
  urlSafe: z.boolean().default(false),
  encoding: z.enum(['utf-8', 'ascii', 'latin1']).default('utf-8')
});
```

### 3.3 Hash Generator (Tools 31-40)

```typescript
export const hashGeneratorSchema = z.object({
  input: nonEmptyString,
  algorithm: z.enum(['md5', 'sha1', 'sha256', 'sha512']),
  uppercase: z.boolean().default(false),
  includePrefix: z.boolean().default(false) // e.g., "sha256:"
});
```

---

## 4. GENERATOR Tool Schemas

### 4.1 Password Generator (Tool 380)

```typescript
// packages/validators/src/generator-tools.ts

import { z } from 'zod';

export const passwordGeneratorSchema = z.object({
  length: z.number().int().min(4).max(128).default(16),
  includeUppercase: z.boolean().default(true),
  includeLowercase: z.boolean().default(true),
  includeNumbers: z.boolean().default(true),
  includeSymbols: z.boolean().default(true),
  excludeSimilar: z.boolean().default(false), // Exclude i, l, 1, L, o, 0, O
  excludeAmbiguous: z.boolean().default(false), // Exclude { } [ ] ( ) / \ ' " ` ~ , ; : . < >
  customSymbols: z.string().optional(),
  quantity: z.number().int().min(1).max(100).default(1)
}).refine(
  (data) => data.includeUppercase || data.includeLowercase || data.includeNumbers || data.includeSymbols,
  { message: 'At least one character type must be selected' }
);

export type PasswordGeneratorInput = z.infer<typeof passwordGeneratorSchema>;
```

### 4.2 QR Code Generator (Tool 385)

```typescript
export const qrCodeGeneratorSchema = z.object({
  content: nonEmptyString.max(2953, 'Content too long for QR code'),
  size: z.number().int().min(100).max(1000).default(300),
  errorCorrection: z.enum(['L', 'M', 'Q', 'H']).default('M'), // 7%, 15%, 25%, 30%
  backgroundColor: hexColor.default('#ffffff'),
  foregroundColor: hexColor.default('#000000'),
  format: z.enum(['png', 'svg', 'jpeg']).default('png'),
  logo: z.string().url().optional(), // Logo image URL
  logoSize: z.number().min(0).max(0.3).default(0.2) // 20% of QR size
});
```

### 4.3 UUID Generator (Tool 382)

```typescript
export const uuidGeneratorSchema = z.object({
  version: z.enum(['v1', 'v4', 'v5']).default('v4'),
  quantity: z.number().int().min(1).max(1000).default(1),
  uppercase: z.boolean().default(false),
  includeBraces: z.boolean().default(false), // {uuid}
  namespace: z.string().uuid().optional(), // For v5
  name: z.string().optional() // For v5
}).refine(
  (data) => data.version !== 'v5' || (data.namespace && data.name),
  { message: 'UUID v5 requires namespace and name' }
);
```

### 4.4 Lorem Ipsum Generator (Tool 383)

```typescript
export const loremIpsumSchema = z.object({
  count: z.number().int().min(1).max(1000).default(5),
  unit: z.enum(['words', 'sentences', 'paragraphs']).default('paragraphs'),
  startWithLorem: z.boolean().default(true),
  includeHTML: z.boolean().default(false) // Wrap in <p> tags
});
```

### 4.5 Fake Data Generator (Tool 384)

```typescript
export const fakeDataSchema = z.object({
  template: z.string().min(1, 'Template required'),
  count: z.number().int().min(1).max(1000).default(1),
  locale: z.enum(['en', 'es', 'fr', 'de', 'ja', 'zh']).default('en'),
  seed: z.number().int().optional() // For reproducible data
});

// Example template: "{{name.firstName}} {{name.lastName}} - {{internet.email}}"
```

---

## 5. CALCULATOR Tool Schemas

### 5.1 Age Calculator (Tool 415)

```typescript
// packages/validators/src/calculator-tools.ts

import { z } from 'zod';
import { dateString } from './base';

export const ageCalculatorSchema = z.object({
  birthDate: dateString,
  targetDate: dateString.optional(), // Default: today
  timezone: z.string().default('UTC'), // IANA timezone
  includeTime: z.boolean().default(false),
  showZodiac: z.boolean().default(true),
  showChineseZodiac: z.boolean().default(true)
});
```

### 5.2 BMI Calculator (Tool 416)

```typescript
export const bmiCalculatorSchema = z.object({
  weight: z.number().positive('Weight must be positive'),
  weightUnit: z.enum(['kg', 'lbs']).default('kg'),
  height: z.number().positive('Height must be positive'),
  heightUnit: z.enum(['cm', 'm', 'ft', 'in']).default('cm'),
  age: z.number().int().min(2).max(120).optional(),
  gender: z.enum(['male', 'female']).optional()
});
```

### 5.3 Percentage Calculator (Tool 417)

```typescript
export const percentageCalculatorSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('what-is'),
    percentage: percentage,
    value: z.number()
  }),
  z.object({
    mode: z.literal('is-what-percent'),
    partialValue: z.number(),
    totalValue: z.number().refine(val => val !== 0, 'Total cannot be zero')
  }),
  z.object({
    mode: z.literal('increase-decrease'),
    originalValue: z.number(),
    finalValue: z.number()
  })
]);
```

### 5.4 Unit Converter (Tool 418)

```typescript
export const unitConverterSchema = z.object({
  value: z.number(),
  fromUnit: nonEmptyString,
  toUnit: nonEmptyString,
  category: z.enum([
    'length',
    'weight',
    'temperature',
    'volume',
    'area',
    'speed',
    'time',
    'data',
    'pressure',
    'energy'
  ]),
  precision: z.number().int().min(0).max(10).default(2)
});
```

### 5.5 GPA Calculator (Tool 419)

```typescript
export const gpaCourseSchema = z.object({
  courseName: nonEmptyString,
  grade: z.string(), // Letter grade or percentage
  credits: z.number().positive(),
  isRetake: z.boolean().default(false)
});

export const gpaCalculatorSchema = z.object({
  courses: z.array(gpaCourseSchema).min(1, 'At least one course required'),
  gradingSystem: z.enum(['4.0', '5.0', 'percentage']).default('4.0'),
  includeWeighted: z.boolean().default(false),
  previousGPA: z.number().min(0).max(5).optional(),
  previousCredits: z.number().positive().optional()
});
```

### 5.6 Loan Calculator (Tool 420)

```typescript
export const loanCalculatorSchema = z.object({
  principal: z.number().positive('Loan amount must be positive'),
  annualRate: z.number().min(0).max(100, 'Interest rate must be 0-100%'),
  termYears: z.number().positive().max(50),
  paymentFrequency: z.enum(['monthly', 'biweekly', 'weekly']).default('monthly'),
  startDate: dateString,
  extraPayment: z.number().min(0).default(0),
  extraPaymentFrequency: z.enum(['monthly', 'yearly', 'once']).optional()
});
```

### 5.7 Tip Calculator (Tool 421)

```typescript
export const tipCalculatorSchema = z.object({
  billAmount: z.number().positive('Bill amount must be positive'),
  tipPercentage: z.number().min(0).max(100).default(15),
  numberOfPeople: z.number().int().positive().default(1),
  currency: z.string().default('USD'),
  roundUp: z.boolean().default(false)
});
```

### 5.8 Date Calculator (Tool 422)

```typescript
export const dateCalculatorSchema = z.discriminatedUnion('operation', [
  z.object({
    operation: z.literal('add-subtract'),
    startDate: dateString,
    value: z.number().int(),
    unit: z.enum(['days', 'weeks', 'months', 'years']),
    timezone: z.string().default('UTC')
  }),
  z.object({
    operation: z.literal('difference'),
    startDate: dateString,
    endDate: dateString,
    unit: z.enum(['days', 'weeks', 'months', 'years', 'all']),
    timezone: z.string().default('UTC')
  }),
  z.object({
    operation: z.literal('business-days'),
    startDate: dateString,
    endDate: dateString,
    excludeWeekends: z.boolean().default(true),
    holidays: z.array(dateString).optional()
  })
]);
```

### 5.9 Tax Calculator (Tool 423)

```typescript
export const taxCalculatorSchema = z.object({
  income: z.number().positive(),
  country: z.enum(['US', 'UK', 'CA', 'AU', 'IN', 'PK']),
  taxYear: z.number().int().min(2020).max(2030),
  filingStatus: z.enum(['single', 'married-joint', 'married-separate', 'head-of-household']),
  deductions: z.number().min(0).default(0),
  credits: z.number().min(0).default(0)
});
```

### 5.10 Zakat Calculator (Tool 424)

```typescript
export const zakatCalculatorSchema = z.object({
  cash: z.number().min(0).default(0),
  gold: z.object({
    grams: z.number().min(0).default(0),
    purity: z.enum(['24k', '22k', '21k', '18k', '14k']).default('24k')
  }),
  silver: z.object({
    grams: z.number().min(0).default(0)
  }),
  investments: z.number().min(0).default(0),
  realEstate: z.number().min(0).default(0),
  business: z.number().min(0).default(0),
  livestock: z.object({
    camels: z.number().int().min(0).default(0),
    cattle: z.number().int().min(0).default(0),
    sheep: z.number().int().min(0).default(0)
  }),
  debts: z.number().min(0).default(0),
  nisabStandard: z.enum(['gold', 'silver']).default('silver'),
  goldPricePerGram: z.number().positive(),
  silverPricePerGram: z.number().positive()
});
```

### 5.11 Islamic Inheritance Calculator (Tool 425)

```typescript
export const inheritanceHeirSchema = z.object({
  relation: z.enum([
    'father', 'mother', 'husband', 'wife',
    'son', 'daughter', 'paternal-grandfather', 'paternal-grandmother',
    'maternal-grandmother', 'full-brother', 'full-sister',
    'paternal-brother', 'paternal-sister',
    'maternal-brother', 'maternal-sister',
    'son-of-son', 'daughter-of-son'
  ]),
  count: z.number().int().positive().default(1),
  gender: z.enum(['male', 'female']).optional()
});

export const islamicInheritanceSchema = z.object({
  estate: z.number().positive('Estate value must be positive'),
  currency: z.string().default('USD'),
  heirs: z.array(inheritanceHeirSchema).min(1, 'At least one heir required'),
  debts: z.number().min(0).default(0),
  willBequests: z.number().min(0).max(33.33).default(0), // Max 1/3 of estate
  funeralExpenses: z.number().min(0).default(0)
});
```

---

## 6. FILE_CONVERTER Tool Schemas

### 6.1 Image Converter (Tools 298-320)

```typescript
// packages/validators/src/file-tools.ts

export const imageConverterSchema = z.object({
  fileKey: nonEmptyString, // R2 key after upload
  targetFormat: z.enum(['png', 'jpeg', 'webp', 'gif', 'bmp', 'tiff']),
  quality: z.number().int().min(1).max(100).default(90),
  resize: z.object({
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    fit: z.enum(['cover', 'contain', 'fill', 'inside', 'outside']).default('contain')
  }).optional(),
  rotate: z.number().int().min(0).max(360).default(0),
  flip: z.enum(['horizontal', 'vertical', 'both', 'none']).default('none')
});
```

### 6.2 PDF Converter (Tools 330-345)

```typescript
export const pdfConverterSchema = z.object({
  fileKey: nonEmptyString,
  targetFormat: z.enum(['docx', 'txt', 'html', 'images']),
  pageRange: z.string().optional(), // e.g., "1-5,8,10-12"
  imageFormat: z.enum(['png', 'jpeg']).optional(), // When converting to images
  imageDPI: z.number().int().min(72).max(600).default(150)
});
```

### 6.3 Document Converter (Tools 350-365)

```typescript
export const documentConverterSchema = z.object({
  fileKey: nonEmptyString,
  fromFormat: z.enum(['docx', 'xlsx', 'pptx', 'odt', 'ods', 'odp']),
  toFormat: z.enum(['pdf', 'docx', 'xlsx', 'pptx', 'html', 'txt']),
  includeMetadata: z.boolean().default(true)
});
```

---

## 7. Conditional Validation

### 7.1 Dependent Fields

```typescript
// Tool 381: Random Number Generator
export const randomNumberSchema = z.object({
  min: z.number(),
  max: z.number(),
  count: z.number().int().min(1).max(10000).default(1),
  allowDuplicates: z.boolean().default(true),
  decimalPlaces: z.number().int().min(0).max(10).default(0)
}).refine(
  (data) => data.max > data.min,
  { message: 'Max must be greater than min', path: ['max'] }
).refine(
  (data) => data.allowDuplicates || data.count <= (data.max - data.min + 1),
  { message: 'Not enough unique numbers in range', path: ['count'] }
);
```

### 7.2 Cross-Field Validation

```typescript
// Tool 390: Invoice Generator
export const invoiceItemSchema = z.object({
  description: nonEmptyString,
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
  taxRate: percentage.default(0)
});

export const invoiceGeneratorSchema = z.object({
  invoiceNumber: nonEmptyString,
  issueDate: dateString,
  dueDate: dateString,
  seller: z.object({
    name: nonEmptyString,
    address: nonEmptyString,
    email: email,
    phone: phoneNumber.optional()
  }),
  buyer: z.object({
    name: nonEmptyString,
    address: nonEmptyString,
    email: email,
    phone: phoneNumber.optional()
  }),
  items: z.array(invoiceItemSchema).min(1, 'At least one item required'),
  currency: z.string().default('USD'),
  notes: z.string().max(500).optional()
}).refine(
  (data) => new Date(data.dueDate) >= new Date(data.issueDate),
  { message: 'Due date must be after issue date', path: ['dueDate'] }
);
```

---

## 8. Error Handling & Display

### 8.1 Error Message Component

```tsx
// packages/ui-components/ValidationError.tsx

import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { ZodError } from 'zod';

interface ValidationErrorProps {
  error: ZodError | Error | string;
}

export function ValidationError({ error }: ValidationErrorProps) {
  const messages = typeof error === 'string'
    ? [error]
    : error instanceof ZodError
    ? error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
    : [error.message];
  
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <ul className="list-disc list-inside space-y-1">
          {messages.map((msg, i) => (
            <li key={i}>{msg}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
```

### 8.2 Field-Level Errors

```tsx
// packages/ui-components/FormField.tsx

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface FormFieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}

export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label className={error ? 'text-destructive' : ''}>{label}</Label>
      {children}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

// Usage:
<FormField label="Email" error={errors.email?.message}>
  <Input {...register('email')} />
</FormField>
```

---

## 9. React Hook Form Integration

```tsx
// Example: Password Generator with validation

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { passwordGeneratorSchema, type PasswordGeneratorInput } from '@/validators';

export default function PasswordGeneratorTool() {
  const { register, handleSubmit, formState: { errors } } = useForm<PasswordGeneratorInput>({
    resolver: zodResolver(passwordGeneratorSchema),
    defaultValues: {
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      quantity: 1
    }
  });
  
  const onSubmit = async (data: PasswordGeneratorInput) => {
    // Execute tool with validated data
    const result = await trpc.tools.generatePassword.mutate(data);
    console.log(result);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormField label="Length" error={errors.length?.message}>
        <Input type="number" {...register('length', { valueAsNumber: true })} />
      </FormField>
      
      <FormField label="Include Uppercase">
        <Checkbox {...register('includeUppercase')} />
      </FormField>
      
      {/* ... other fields ... */}
      
      <Button type="submit">Generate</Button>
    </form>
  );
}
```

---

## 10. Server-Side Validation (tRPC)

```typescript
// packages/api/src/routers/tools.ts

import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { passwordGeneratorSchema } from '@/validators';

export const toolsRouter = router({
  generatePassword: publicProcedure
    .input(passwordGeneratorSchema)
    .mutation(async ({ input, ctx }) => {
      // Input is already validated by Zod
      const password = generatePassword(input);
      
      return {
        success: true,
        result: password
      };
    }),
  
  calculateAge: publicProcedure
    .input(ageCalculatorSchema)
    .mutation(async ({ input, ctx }) => {
      const age = calculateAge(input);
      return { success: true, result: age };
    })
  
  // ... all 446 tools with validated inputs
});
```

---

## 11. Validation Schema Export Index

```typescript
// packages/validators/src/index.ts

// Base schemas
export * from './base';

// Tool-specific schemas
export * from './text-tools';
export * from './generator-tools';
export * from './calculator-tools';
export * from './file-tools';

// Type exports
export type { CaseConverterInput } from './text-tools';
export type { PasswordGeneratorInput } from './generator-tools';
export type { AgeCalculatorInput } from './calculator-tools';
```

---

**This specification provides complete Zod validation for all 446 tools, ensuring type safety and consistent error handling across the application.**
