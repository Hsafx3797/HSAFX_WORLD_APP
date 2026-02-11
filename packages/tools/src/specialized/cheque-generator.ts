/**
 * Cheque Generator
 * Generate printable cheque images with customizable data
 */

export interface ChequeData {
  payeeName: string;
  amount: number;
  amountInWords: string;
  date: string;
  memo?: string;
  bankName?: string;
  accountNumber?: string;
  chequeNumber?: string;
  micrLine?: string;
}

export interface ChequeStyle {
  width: number;
  height: number;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  fontSize: number;
  fontFamily: string;
  logoUrl?: string;
}

const DEFAULT_STYLE: ChequeStyle = {
  width: 850,
  height: 400,
  backgroundColor: '#f8f9fa',
  borderColor: '#dee2e6',
  textColor: '#212529',
  fontSize: 14,
  fontFamily: 'Arial, sans-serif',
};

// Number to words conversion
const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const scales = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];

function convertHundreds(num: number): string {
  let result = '';
  
  if (num >= 100) {
    result += ones[Math.floor(num / 100)] + ' Hundred';
    num %= 100;
    if (num > 0) result += ' and ';
  }
  
  if (num >= 20) {
    result += tens[Math.floor(num / 10)];
    num %= 10;
    if (num > 0) result += '-' + ones[num];
  } else if (num > 0) {
    result += ones[num];
  }
  
  return result;
}

export function numberToWords(amount: number, currency: string = 'Dollars'): string {
  if (amount === 0) return 'Zero ' + currency + ' Only';
  
  const dollars = Math.floor(amount);
  const cents = Math.round((amount - dollars) * 100);
  
  let words = '';
  let scaleIndex = 0;
  let remaining = dollars;
  
  while (remaining > 0) {
    const chunk = remaining % 1000;
    if (chunk > 0) {
      const chunkWords = convertHundreds(chunk);
      if (scales[scaleIndex]) {
        words = chunkWords + ' ' + scales[scaleIndex] + (words ? ' ' : '') + words;
      } else {
        words = chunkWords + words;
      }
    }
    remaining = Math.floor(remaining / 1000);
    scaleIndex++;
  }
  
  words += ' ' + currency;
  
  if (cents > 0) {
    words += ' and ' + convertHundreds(cents) + ' Cents';
  }
  
  return words + ' Only';
}

export function formatAmount(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function generateMICRLine(
  chequeNumber: string,
  routingNumber: string,
  accountNumber: string
): string {
  // MICR format: ⑆cheque_number⑆ ⑈routing_number⑈ account_number⑉
  // Using standard characters for representation
  return `C${chequeNumber}C A${routingNumber}A ${accountNumber}B`;
}

export function validateChequeData(data: Partial<ChequeData>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.payeeName || data.payeeName.trim().length < 2) {
    errors.push('Payee name is required and must be at least 2 characters');
  }
  
  if (data.amount === undefined || data.amount <= 0) {
    errors.push('Amount must be greater than zero');
  }
  
  if (data.amount && data.amount > 999999999.99) {
    errors.push('Amount exceeds maximum limit');
  }
  
  if (!data.date) {
    errors.push('Date is required');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function generateChequeSVG(
  data: ChequeData,
  style: Partial<ChequeStyle> = {}
): string {
  const s = { ...DEFAULT_STYLE, ...style };
  
  const svg = `
<svg width="${s.width}" height="${s.height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="lines" patternUnits="userSpaceOnUse" width="100%" height="100%">
      <line x1="50" y1="280" x2="${s.width - 50}" y2="280" stroke="#ccc" stroke-width="1"/>
    </pattern>
    <linearGradient id="chequeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f8f9fa;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#e9ecef;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="url(#chequeGrad)" rx="8" ry="8"/>
  <rect x="2" y="2" width="${s.width - 4}" height="${s.height - 4}" fill="none" stroke="${s.borderColor}" stroke-width="2" rx="6" ry="6"/>
  
  <!-- Decorative elements -->
  <rect x="10" y="10" width="${s.width - 20}" height="${s.height - 20}" fill="none" stroke="${s.borderColor}" stroke-width="1" stroke-dasharray="5,5" rx="4" ry="4"/>
  
  <!-- Bank Name -->
  <text x="50" y="45" font-family="${s.fontFamily}" font-size="18" font-weight="bold" fill="${s.textColor}">
    ${escapeXml(data.bankName || 'BANK NAME')}
  </text>
  
  <!-- Cheque Number -->
  <text x="${s.width - 50}" y="45" font-family="${s.fontFamily}" font-size="14" fill="${s.textColor}" text-anchor="end">
    No. ${escapeXml(data.chequeNumber || '000000')}
  </text>
  
  <!-- Date -->
  <text x="${s.width - 50}" y="80" font-family="${s.fontFamily}" font-size="14" fill="${s.textColor}" text-anchor="end">
    Date: ${escapeXml(data.date)}
  </text>
  
  <!-- Pay To Label -->
  <text x="50" y="120" font-family="${s.fontFamily}" font-size="12" fill="#6c757d">
    PAY TO THE ORDER OF
  </text>
  
  <!-- Payee Name -->
  <text x="50" y="150" font-family="${s.fontFamily}" font-size="18" font-weight="bold" fill="${s.textColor}">
    ${escapeXml(data.payeeName)}
  </text>
  <line x1="50" y1="155" x2="${s.width - 200}" y2="155" stroke="${s.borderColor}" stroke-width="1"/>
  
  <!-- Amount Box -->
  <rect x="${s.width - 180}" y="105" width="130" height="40" fill="white" stroke="${s.borderColor}" stroke-width="2" rx="4"/>
  <text x="${s.width - 170}" y="133" font-family="${s.fontFamily}" font-size="18" font-weight="bold" fill="${s.textColor}">
    ${escapeXml(formatAmount(data.amount))}
  </text>
  
  <!-- Amount in Words -->
  <text x="50" y="200" font-family="${s.fontFamily}" font-size="14" fill="${s.textColor}">
    ${escapeXml(data.amountInWords)}
  </text>
  <line x1="50" y1="205" x2="${s.width - 50}" y2="205" stroke="${s.borderColor}" stroke-width="1"/>
  <text x="${s.width - 50}" y="200" font-family="${s.fontFamily}" font-size="12" fill="#6c757d" text-anchor="end">
    DOLLARS
  </text>
  
  <!-- Memo Line -->
  <text x="50" y="270" font-family="${s.fontFamily}" font-size="11" fill="#6c757d">
    MEMO
  </text>
  <text x="100" y="270" font-family="${s.fontFamily}" font-size="12" fill="${s.textColor}">
    ${escapeXml(data.memo || '')}
  </text>
  <line x1="50" y1="275" x2="300" y2="275" stroke="${s.borderColor}" stroke-width="1"/>
  
  <!-- Signature Line -->
  <text x="${s.width - 50}" y="290" font-family="${s.fontFamily}" font-size="11" fill="#6c757d" text-anchor="end">
    AUTHORIZED SIGNATURE
  </text>
  <line x1="${s.width - 250}" y1="275" x2="${s.width - 50}" y2="275" stroke="${s.borderColor}" stroke-width="1"/>
  
  <!-- MICR Line -->
  <text x="50" y="${s.height - 40}" font-family="MICR, Courier New, monospace" font-size="14" fill="${s.textColor}">
    ${escapeXml(data.micrLine || generateMICRLine(data.chequeNumber || '000000', '123456789', data.accountNumber || '0000000000'))}
  </text>
  
  <!-- Account Number -->
  <text x="50" y="${s.height - 20}" font-family="${s.fontFamily}" font-size="10" fill="#6c757d">
    Account: ${escapeXml(maskAccountNumber(data.accountNumber || '0000000000'))}
  </text>
  
  <!-- Security Features -->
  <text x="${s.width - 50}" y="${s.height - 20}" font-family="${s.fontFamily}" font-size="8" fill="#adb5bd" text-anchor="end">
    VOID AFTER 90 DAYS
  </text>
</svg>`.trim();
  
  return svg;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) return accountNumber;
  return '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4);
}

export function createCheque(
  payeeName: string,
  amount: number,
  date: string,
  options: {
    memo?: string;
    bankName?: string;
    accountNumber?: string;
    chequeNumber?: string;
    currency?: string;
    style?: Partial<ChequeStyle>;
  } = {}
): { svg: string; data: ChequeData } {
  const amountInWords = numberToWords(amount, options.currency === 'USD' ? 'Dollars' : options.currency);
  
  const chequeData: ChequeData = {
    payeeName,
    amount,
    amountInWords,
    date,
    memo: options.memo,
    bankName: options.bankName,
    accountNumber: options.accountNumber,
    chequeNumber: options.chequeNumber,
    micrLine: options.accountNumber && options.chequeNumber 
      ? generateMICRLine(options.chequeNumber, '123456789', options.accountNumber)
      : undefined,
  };
  
  const validation = validateChequeData(chequeData);
  if (!validation.valid) {
    throw new Error(`Invalid cheque data: ${validation.errors.join(', ')}`);
  }
  
  const svg = generateChequeSVG(chequeData, options.style);
  
  return { svg, data: chequeData };
}

// Currency-specific cheque generators
export function createUSDCheque(
  payeeName: string,
  amount: number,
  date: string,
  options: Omit<Parameters<typeof createCheque>[3], 'currency'> = {}
): ReturnType<typeof createCheque> {
  return createCheque(payeeName, amount, date, { ...options, currency: 'USD' });
}

export function createGBPCheque(
  payeeName: string,
  amount: number,
  date: string,
  options?: Omit<Parameters<typeof createCheque>[3], 'currency'>
): ReturnType<typeof createCheque> {
  const style = options && 'style' in options ? options.style : undefined;
  return createCheque(payeeName, amount, date, { 
    ...options, 
    currency: 'GBP',
    style: { ...(style ?? {}), backgroundColor: '#f5f0e8' },
  });
}

export function createSARCheque(
  payeeName: string,
  amount: number,
  date: string,
  options: Omit<Parameters<typeof createCheque>[3], 'currency'> = {}
): ReturnType<typeof createCheque> {
  return createCheque(payeeName, amount, date, { 
    ...options, 
    currency: 'SAR',
  });
}
