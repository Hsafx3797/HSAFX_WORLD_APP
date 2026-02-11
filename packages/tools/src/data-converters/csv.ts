/**
 * CSV/TSV Conversion Utilities
 */

/**
 * Parse a CSV line respecting quoted values
 */
function parseCsvLine(line: string, delimiter = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Escape a value for CSV
 */
function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert JSON array to CSV
 */
export function jsonToCsv(json: string): string {
  const data = JSON.parse(json);
  
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Input must be a non-empty array of objects');
  }
  
  const headers: string[] = [...new Set(data.flatMap((obj) => Object.keys(obj)))];
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map((header) => escapeCsvValue(row[header]));
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

/**
 * Convert CSV to JSON array
 */
export function csvToJson(csv: string, hasHeaders = true): string {
  const lines = csv.trim().split('\n');
  if (lines.length === 0) return '[]';
  
  if (hasHeaders) {
    const headers = parseCsvLine(lines[0]!, ',');
    const data = lines.slice(1).map((line) => {
      const values = parseCsvLine(line);
      const obj: Record<string, string> = {};
      headers.forEach((header, i) => {
        obj[header] = values[i] ?? '';
      });
      return obj;
    });
    return JSON.stringify(data, null, 2);
  }
  
  const data = lines.map((line) => parseCsvLine(line));
  return JSON.stringify(data, null, 2);
}

/**
 * Convert JSON array to TSV
 */
export function jsonToTsv(json: string): string {
  const data = JSON.parse(json);
  
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Input must be a non-empty array of objects');
  }
  
  const headers: string[] = [...new Set(data.flatMap((obj) => Object.keys(obj)))];
  const tsvRows = [headers.join('\t')];
  
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      return String(value).replace(/\t/g, ' ');
    });
    tsvRows.push(values.join('\t'));
  }
  
  return tsvRows.join('\n');
}

/**
 * Convert TSV to JSON array
 */
export function tsvToJson(tsv: string, hasHeaders = true): string {
  const lines = tsv.trim().split('\n');
  if (lines.length === 0) return '[]';
  
  if (hasHeaders) {
    const headers = parseCsvLine(lines[0]!, '\t');
    const data = lines.slice(1).map((line) => {
      const values = parseCsvLine(line, '\t');
      const obj: Record<string, string> = {};
      headers.forEach((header, i) => {
        obj[header] = values[i] ?? '';
      });
      return obj;
    });
    return JSON.stringify(data, null, 2);
  }
  
  const data = lines.map((line) => parseCsvLine(line, '\t'));
  return JSON.stringify(data, null, 2);
}

/**
 * Convert TSV to CSV
 */
export function tsvToCsv(tsv: string): string {
  const lines = tsv.trim().split('\n');
  return lines.map((line) => {
    const values = parseCsvLine(line, '\t');
    return values.map((v) => escapeCsvValue(v)).join(',');
  }).join('\n');
}

/**
 * Convert CSV to TSV
 */
export function csvToTsv(csv: string): string {
  const lines = csv.trim().split('\n');
  return lines.map((line) => {
    const values = parseCsvLine(line, ',');
    return values.map((v) => v.replace(/\t/g, ' ')).join('\t');
  }).join('\n');
}

/**
 * Validate CSV structure
 */
export function validateCsv(csv: string): { valid: boolean; error?: string; details?: Record<string, unknown> } {
  const lines = csv.trim().split('\n');
  if (lines.length === 0) {
    return { valid: false, error: 'Empty CSV' };
  }
  
  const headerCount = parseCsvLine(lines[0]!, ',').length;
  const issues: string[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const lineValues = parseCsvLine(lines[i]!, ',');
    if (lineValues.length !== headerCount) {
      issues.push(`Line ${i + 1}: expected ${headerCount} columns, found ${lineValues.length}`);
    }
  }
  
  if (issues.length > 0) {
    return { 
      valid: false, 
      error: 'Column count mismatch', 
      details: { issues, rowCount: lines.length, columnCount: headerCount }
    };
  }
  
  return { 
    valid: true, 
    details: { rowCount: lines.length, columnCount: headerCount }
  };
}

/**
 * Convert Markdown table to JSON
 */
export function markdownTableToJson(markdown: string): string {
  const lines = markdown.trim().split('\n').filter(line => line.includes('|'));
  if (lines.length < 2) {
    throw new Error('Invalid markdown table: needs header and at least one separator row');
  }
  
  const parseRow = (row: string): string[] => {
    return row.split('|')
      .map(cell => cell.trim())
      .filter(cell => cell.length > 0 && !cell.match(/^-+$/));
  };
  
  const headers = parseRow(lines[0]!);
  // Skip separator row (line[1])
  const dataLines = lines.slice(2);
  
  const data = dataLines.map(line => {
    const values = parseRow(line);
    const obj: Record<string, string> = {};
    headers.forEach((header, i) => {
      obj[header] = values[i] ?? '';
    });
    return obj;
  });
  
  return JSON.stringify(data, null, 2);
}

/**
 * Convert JSON to Markdown table
 */
export function jsonToMarkdownTable(json: string): string {
  const data = JSON.parse(json);
  
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Input must be a non-empty array of objects');
  }
  
  const headers: string[] = [...new Set(data.flatMap((obj) => Object.keys(obj)))];
  const headerRow = `| ${headers.join(' | ')} |`;
  const separator = `| ${headers.map(() => '---').join(' | ')} |`;
  
  const dataRows = data.map(row => {
    const values = headers.map(h => String(row[h] ?? '').replace(/\|/g, '\\|'));
    return `| ${values.join(' | ')} |`;
  });
  
  return [headerRow, separator, ...dataRows].join('\n');
}
