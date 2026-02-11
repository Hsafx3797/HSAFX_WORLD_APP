## Core Business Logic

### Payee Name Formatting

**Function**: `formatPayeeName(name, caseType, prefix, suffix)`

**Input Parameters**:
* `name`: `string`
  Raw payee name. May include extra spaces. Unicode supported.
* `caseType`: `"UpperCase" | "TitleCase" | "None"`
  Controls text casing of the name.
* `prefix`: `string`
  Optional honorific or label (e.g., `Mr.`, `M/S`, `To`).
* `suffix`: `string`
  Optional trailing label (e.g., `LTD`, `PVT. LTD`).

**Validation Rules**

* `name` must be a non-empty string after trimming
* `caseType` defaults to `"None"` if undefined
* `prefix` and `suffix` are optional and ignored if empty

**Logic**:
```
1. Trim leading/trailing whitespace from name
2. Apply case transformation:
   - UpperCase: Convert entire string to uppercase
   - TitleCase: Capitalize first letter of each word, rest lowercase (defalt)
3. Concatenate: [prefix] + name + [suffix]
4. Normalize spaces (single-space separation)
5. Trim final output
```

**Examples**:
```
Input: "john doe", "TitleCase", "Mr.", ""
Output: "Mr. John Doe"

Input: "acme corporation", "UpperCase", "", "LTD"
Output: "ACME CORPORATION LTD"
```

---

### Amount Number Formatting

**Function**: `formatAmountInNumber(amount, prefix, suffix, numberingSystem)`

**Input Parameters**:
* `amount`: `number | ""`
  Numeric amount (integer only, max 9 digits). Empty string returns empty.
* `prefix`: `string`
  Currency symbol or label (e.g., `Rs.`, `$`)
* `suffix`: `string`
  Trailing notation (e.g., `/-`, `ONLY`)
* `numberingSystem`: `"International" | "Indian"`
  Determines digit grouping

**Validation Rules**

* `amount` must be numeric and ≥ 0
* Reject values exceeding 9 digits
* Decimal values are rounded or rejected (implementation choice)

**Logic**:
```
1. If amount is empty → return ""
2. Validate numeric input
3. Apply locale-based formatting:
   - Indian: toLocaleString('en-IN')
   - International: toLocaleString('en-US')
4. Concatenate: [prefix] + formatted amount + [suffix]
5. Normalize spacing and trim
```

**Examples**:
```
Input: 1234567, "Rs.", "/-", "Indian"
Output: "Rs. 12,34,567 /-"

Input: 1234567, "$", "/-", "International"
Output: "$ 1,234,567 /-"
```

---

### Amount to Words Conversion

**Function**: `convertAmountToWords(amount, prefix, suffix, format, caseType, numberingSystem)`

**Input Parameters**:
* `amount`: `number | ""`
  Numeric value (max 9 digits integer + optional 2 decimals)
* `prefix`: `string`
  Optional currency label (e.g., `RUPEES`)
* `suffix`: `string`
  Optional closing text (e.g., `ONLY`)
* `format`: `"UK" | "US"`
  Controls decimal handling
* `caseType`: `"UpperCase" | "TitleCase"`
* `numberingSystem`: `"International" | "Indian"`

**Validation Rules**
* Empty amount → return empty string
* Fractional part limited to 2 digits
* Zero amount allowed (`"ZERO"`)

**Logic Flow**:
```
1. Split amount into integer and fractional parts
2. Convert integer using numbering system:
   - International:
     millions → thousands → hundreds
   - Indian:
     crores → lakhs → thousands → hundreds
3. Convert each segment using lookup tables
4. Handle fractional part:
   - UK: convert to words ("and seventy-five")
   - US: express as fraction ("and 75/100")
5. Join segments with proper conjunctions ("and")
6. Apply case transformation
7. Append prefix and suffix
8. Normalize spacing
```

**Lookup Tables**:
```typescript
ones  = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"]
teens = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"]
tens  = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]
```

**Example Conversions**:
```
Input: 123456789

International + UK + UpperCase:
"ONE MILLION TWO HUNDRED THIRTY-FOUR THOUSAND FIVE HUNDRED SIXTY-SEVEN AND EIGHTY-NINE"

Indian + UK + TitleCase:
"Twelve Crore Thirty-Four Lakh Five Hundred Sixty-Seven And Eighty-Nine"

International + US:
"ONE MILLION TWO HUNDRED THIRTY-FOUR THOUSAND FIVE HUNDRED SIXTY-SEVEN AND 89/100"
```

---

### Date Formatting

**Function**: `formatDate(dateStr, format)`

**Input Parameters**:
* `dateStr`: `string`
  ISO format date (`YYYY-MM-DD`)
* `format`:
  * `"DD/MM/YYYY"`
  * `"DD-MM-YYYY"`
  * `"DD MMM YYYY"`
  * `"DD-MMM-YYYY"`

Validation Rules
* Invalid or unparsable dates return empty string or error
* Leading zeros always preserved for day/month

**Logic**:
```
1. Parse ISO date string into Date object
2. Extract day, month index, year
3. Format output based on pattern:
   - DD/MM/YYYY  → 09/12/2025
   - DD-MM-YYYY  → 09-12-2025
   - DD MMM YYYY → 09 DEC 25
   - DD-MMM-YYYY → 09-DEC-2025
4. Return formatted string
```

**Month Names Array**:
```typescript
["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
```

---

## Single Cheque Generation

### State Structure
```typescript
interface FormData {
  countryName: string                                   // Selected country
  bankName: string                                      // Selected bank
  payeePrefix: string                                   // Max 10 chars (e.g., "Mr.", "Dr.")
  payeeName: string                                     // Max 35 characters
  payeeSuffix: string                                   // Max 10 chars (e.g., "Ltd", "Inc")
  date: string                                          // ISO format (YYYY-MM-DD)
  amountInNumberPrefix: string                          // E.g., "Rs.", "$"
  amountInNumber: number | ""                           // Max 9 digits total
  amountInNumberSuffix: string                          // E.g., "/-", ".00"
  amountInWordsPrefix: string                           // E.g., "RUPEES"
  amountInWords: string                                 // Auto generated from "amountInNumber"
  amountInWordsSuffix: string                           // E.g., "ONLY"
  chequeOrientation: "Portrait" | "Landscape"
  acPayee: boolean                                      // A/C Payee crossing
  notNegotiable: boolean                                // Not Negotiable marking
  orBearer: boolean                                     // Or Bearer option
  payeeCase: "UpperCase" | "TitleCase"
  dateFormat: "DD/MM/YYYY" | "DD-MM-YYYY" | "DD MMM YYYY" | "DD-MMM-YYYY"
  numberingSystem: "International" | "Indian"
  amountFormat: "UK" | "US"
  amountWordsCase: "UpperCase" | "TitleCase"
}
```

### Initialization Flow
```
1. Application loads cheque generator page
   ↓
2. Initialize default FormData state:
   - countryName: ""
   - bankName: ""
   - payeePrefix: ""
   - payeeName: ""
   - payeeSuffix: ""
   - date: today’s date in ISO format (YYYY-MM-DD)
   - amountInNumberPrefix: ""
   - amountInNumber: ""
   - amountInNumberSuffix: ""
   - amountInWordsPrefix: ""
   - amountInWords: ""
   - amountInWordsSuffix: ""
   - chequeOrientation: "Portrait"
   - acPayee: false
   - notNegotiable: false
   - orBearer: false
   - payeeCase: "TitleCase"
   - dateFormat: "DD/MM/YYYY"
   - numberingSystem: "International"
   - amountFormat: "UK"
   - amountWordsCase: "UpperCase"
   ↓
3. Load Country–Bank mapping JSON
   ↓
4. Populate country dropdown
   ↓
5. Disable bank dropdown until country is selected
   ↓
6. Watchers / Effects:
   - On country change → reset bankName
   - On amount change → auto-generate amountInWords
   - On numberingSystem / amountFormat change → regenerate words
```

### Country-Bank Mapping Structure
```
{
  "Pakistan": {
    "Allied Bank Limited": "templates/Pakistan/Pakistan_Allied_Bank_Limited",
    "Bank AL Habib Limited": "templates/Pakistan/Pakistan_Bank_AL_Habib_Limited",
    "HBL Bank": "templates/Pakistan/Pakistan_HBL.json"
  },
  "India": {
    "State Bank of India": "...",
    "HDFC Bank": "..."
  }
}
```

### Single Cheque Generation Flow

```
1. User clicks "Generate PDF"
   ↓
2. Validate required fields:
   - countryName not empty
   - bankName not empty
   - payeeName not empty (max 35 chars)
   - amount > 0 (max 9 digits)
   - date not empty
   ↓
3. Transform data:
   processedPayeeName = formatPayeeName(payeeName, payeeCase, prefix, suffix)
   processedDate = formatDate(date, dateFormat)
   processedAmountInNumber = formatAmountInNumber(amount, prefix, suffix, system)
   processedAmountInWords = prefix + convertAmountToWords(...) + suffix
   ↓
4. Construct ChequeData payload:
   {
     countryName, bankName, chequeOrientation,
     payeeName: processedPayeeName,
     date: processedDate,
     amountInNumber: processedAmountInNumber,
     amountInWords: processedAmountInWords,
     acPayee, notNegotiable, orBearer
   }
   ↓
5. Call generateChequePDF(chequeData)
   ↓
6. Receive PDF Blob
   ↓
7. Download PDF using downloadPDF(blob, filename)
   ↓
8. Attempt to open in browser using openPDFInBrowser(blob)
   ↓
9. Show success/error message
```

---

## Bulk Cheque Generation Logic



### CSV Template Structure
```csv
| countryName   | bankName              | chequeOrientation | payeePrefix   | payeeName | payeeSuffix   | date          | amount | amountInNumberPrefix | amountInNumberSuffix  | amountFormat  | numberingSystem   | amountWordsPrefix | amountWordsSuffix | acPayee   | notNegotiable | orBearer     |
| ------------- | --------------------- | ----------------- | -----------   | --------- | -----------   | ----          | ------ | -------------------- | --------------------  | ------------  | ---------------   | ----------------- | ----------------- | -------   | ------------- | -----------  |
| Pakistan      | Allied Bank Limited   | Portrait          | Mr.           | John Doe  | Ltd           | 31/10/2025    | 150075 | Rs.                  | /-                    | UK            | International     | RUPEES            | ONLY              | true      | true          | false        |
```

#### Import Flow
```
1. User selects CSV file
   ↓
2. Read file as text using FileReader
   ↓
3. Parse CSV:
   - Split by newlines
   - First line = headers
   - Remaining lines = data rows
   ↓
4. For each data row:
   - Split by commas
   - Validate required fields (payeeName, date, amount)
   - Apply constraints:
     * payeeName: max 35 chars (truncate if longer)
     * amount: max 9 digits, 2 decimals (skip row if invalid)
     * date: parse DD/MM/YYYY or DD-MM-YYYY formats
   ↓
5. Create ExtendedChequeData objects:
   - Map CSV columns to object properties
   - Parse booleans (string "true" → boolean true)
   - Apply global settings for missing fields
   - Calculate amountInNumber and amountInWords
   ↓
6. Replace current cheques array with imported data
   ↓
7. Show success message: "Successfully imported N cheque(s)"
```

### Bulk Cheque State Structure (Derived)

```typescript
interface ExtendedChequeData {
  countryName: string
  bankName: string
  chequeOrientation: "Portrait" | "Landscape"
  payeePrefix: string
  payeeName: string
  payeeSuffix: string
  date: string
  amount: number
  amountInNumberPrefix: string
  amountInNumberSuffix: string
  amountFormat: "UK" | "US"
  numberingSystem: "International" | "Indian"
  amountWordsPrefix: string
  amountWordsSuffix: string
  acPayee: boolean
  notNegotiable: boolean
  orBearer: boolean

  // Derived / Computed
  formattedPayeeName?: string
  formattedDate?: string
  formattedAmountInNumber?: string
  formattedAmountInWords?: string
}
```

### Bulk PDF Generation Flow

```
1. User clicks "Generate PDF (N)"
   ↓
2. Validate all cheques:
   - Ensure payeeName, date, amount are filled
   - Collect invalid cheque indices
   ↓
3. If validation fails:
   - Show error: "Missing data in cheque(s): 1, 3, 5"
   - Stop process
   ↓
4. Process all cheques:
   FOR EACH cheque:
     - Ensure amountInNumber and amountInWords are calculated
     - Format payeeName with prefix/suffix and case
     - Format date according to dateFormat
   ↓
5. Construct BulkChequeData payload:
   {
     cheques: processedCheques[],
     filename: filename || 'bulk_cheques'
   }
   ↓
6. Call generateBulkChequePDF(bulkData)
   ↓
7. Receive PDF Blob
   ↓
8. Download PDF using downloadPDF(blob, filename)
   ↓
9. Show success message
```

---

## Error Handling Strategy (Implicit but Now Explicit)

### Validation Errors

| Scenario           | Action             |
| ------------------ | ------------------ |
| Invalid CSV format | Reject import      |
| Invalid date       | Skip row           |
| Amount > 9 digits  | Skip row           |
| Missing payeeName  | Skip row           |
| Invalid boolean    | Default to `false` |

### Runtime Errors

| Scenario             | Action         |
| -------------------- | -------------- |
| Template not found   | Show error     |
| PDF generation fails | Abort & notify |
| Blob creation fails  | Abort & notify |

---

## Determinism & Idempotency Rules

* Same input → same PDF output
* Formatting functions are:
  * deterministic
  * stateless
  * locale-independent (explicit locales only)
* Bulk generation **does not mutate source CSV data**

---

## Performance Constraints

| Operation         | Limit                   |
| ----------------- | ----------------------- |
| Single cheque PDF | < 200ms                 |
| Bulk PDF          | ≤ 500 cheques per batch |
| CSV import        | ≤ 10,000 rows           |

---

## Security & Sanitization Rules

* All string inputs trimmed and normalized
* No HTML rendering from user inputs
* CSV parsing escapes embedded commas and quotes
* Filenames sanitized before download

---

## Final Notes

* **Single cheque** and **bulk cheque** pipelines share the same core formatting functions
* UI is declarative; **business logic is centralized**
* Templates are **country + bank scoped**
* No hidden magic — every transformation is explicit and traceable