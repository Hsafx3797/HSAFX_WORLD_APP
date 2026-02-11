/**
 * JSON Utilities
 * JSON formatting, validation, and conversion utilities
 */

/**
 * Format JSON with specified indentation
 */
export function formatJson(json: string, indent = 2): string {
  const parsed = JSON.parse(json);
  return JSON.stringify(parsed, null, indent);
}

/**
 * Minify JSON by removing whitespace
 */
export function minifyJson(json: string): string {
  const parsed = JSON.parse(json);
  return JSON.stringify(parsed);
}

/**
 * Sort JSON object keys alphabetically
 */
export function sortJsonKeys(json: string, deep = true): string {
  const parsed = JSON.parse(json);
  const sorted = sortObject(parsed, deep);
  return JSON.stringify(sorted, null, 2);
}

function sortObject(obj: unknown, deep: boolean): unknown {
  if (Array.isArray(obj)) {
    return deep ? obj.map(item => sortObject(item, deep)) : obj;
  }
  
  if (obj !== null && typeof obj === 'object') {
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(obj as Record<string, unknown>).sort();
    for (const key of keys) {
      sorted[key] = deep ? sortObject((obj as Record<string, unknown>)[key], deep) : (obj as Record<string, unknown>)[key];
    }
    return sorted;
  }
  
  return obj;
}

/**
 * JSON to NDJSON (newline-delimited JSON)
 */
export function jsonToNdjson(json: string): string {
  const parsed = JSON.parse(json);
  if (!Array.isArray(parsed)) {
    return JSON.stringify(parsed);
  }
  return parsed.map((item) => JSON.stringify(item)).join('\n');
}

/**
 * NDJSON to JSON array
 */
export function ndjsonToJson(ndjson: string): string {
  const lines = ndjson.trim().split('\n').filter(Boolean);
  const items = lines.map((line) => JSON.parse(line));
  return JSON.stringify(items, null, 2);
}

/**
 * JSON to URL parameters
 */
export function jsonToUrlParams(json: string): string {
  const parsed = JSON.parse(json);
  const params = new URLSearchParams();
  
  function flatten(obj: unknown, prefix = ''): void {
    if (obj === null || obj === undefined) return;
    
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        flatten(item, prefix ? `${prefix}[${index}]` : String(index));
      });
    } else if (typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        flatten(value, prefix ? `${prefix}[${key}]` : key);
      }
    } else {
      params.append(prefix, String(obj));
    }
  }
  
  flatten(parsed);
  return params.toString();
}

/**
 * URL parameters to JSON
 */
export function urlParamsToJson(params: string): string {
  const searchParams = new URLSearchParams(params);
  const result: Record<string, unknown> = {};
  
  searchParams.forEach((value, key) => {
    // Handle array notation like key[0], key[1]
    const arrayMatch = key.match(/^([^\[]+)\[(\d+)]$/);
    if (arrayMatch) {
      const [, arrayKey, index] = arrayMatch;
      if (!Array.isArray(result[arrayKey!])) {
        result[arrayKey!] = [];
      }
      (result[arrayKey!] as unknown[])[parseInt(index!, 10)] = value;
    } else {
      result[key] = value;
    }
  });
  
  return JSON.stringify(result, null, 2);
}

/**
 * JSON to form data representation
 */
export function jsonToFormData(json: string): string {
  const parsed = JSON.parse(json);
  const lines: string[] = [];
  
  function flatten(obj: unknown, prefix = ''): void {
    if (obj === null || obj === undefined) return;
    
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        flatten(item, prefix ? `${prefix}[${index}]` : String(index));
      });
    } else if (typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        flatten(value, prefix ? `${prefix}[${key}]` : key);
      }
    } else {
      lines.push(`${prefix}=${encodeURIComponent(String(obj))}`);
    }
  }
  
  flatten(parsed);
  return lines.join('\n');
}

/**
 * Query string to JSON
 */
export function queryStringToJson(qs: string): string {
  const params = new URLSearchParams(qs.startsWith('?') ? qs.slice(1) : qs);
  const result: Record<string, string | string[]> = {};
  
  params.forEach((value, key) => {
    if (result[key]) {
      if (Array.isArray(result[key])) {
        (result[key] as string[]).push(value);
      } else {
        result[key] = [result[key] as string, value];
      }
    } else {
      result[key] = value;
    }
  });
  
  return JSON.stringify(result, null, 2);
}

/**
 * JSON to query string
 */
export function jsonToQueryString(json: string): string {
  const parsed = JSON.parse(json);
  const params = new URLSearchParams();
  
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, String(v)));
    } else {
      params.append(key, String(value));
    }
  }
  
  return params.toString();
}

/**
 * Base64 to JSON
 */
export function base64ToJson(base64: string): string {
  const decoded = atob(base64);
  const parsed = JSON.parse(decoded);
  return JSON.stringify(parsed, null, 2);
}

/**
 * JSON to Base64
 */
export function jsonToBase64(json: string): string {
  const parsed = JSON.parse(json); // Validate JSON first
  return btoa(JSON.stringify(parsed));
}

/**
 * Deep comparison of two JSON objects
 */
export function jsonDiff(json1: string, json2: string): string {
  const obj1 = JSON.parse(json1);
  const obj2 = JSON.parse(json2);
  const differences: string[] = [];
  
  function compare(a: unknown, b: unknown, path = ''): void {
    if (a === b) return;
    
    if (typeof a !== typeof b) {
      differences.push(`${path}: type changed from ${typeof a} to ${typeof b}`);
      return;
    }
    
    if (a === null || b === null) {
      differences.push(`${path}: ${a} → ${b}`);
      return;
    }
    
    if (Array.isArray(a) && Array.isArray(b)) {
      const maxLen = Math.max(a.length, b.length);
      for (let i = 0; i < maxLen; i++) {
        if (i >= a.length) {
          differences.push(`${path}[${i}]: added ${JSON.stringify(b[i])}`);
        } else if (i >= b.length) {
          differences.push(`${path}[${i}]: removed ${JSON.stringify(a[i])}`);
        } else {
          compare(a[i], b[i], `${path}[${i}]`);
        }
      }
      return;
    }
    
    if (typeof a === 'object' && typeof b === 'object') {
      const allKeys = new Set([...Object.keys(a as object), ...Object.keys(b as object)]);
      for (const key of allKeys) {
        const aVal = (a as Record<string, unknown>)[key];
        const bVal = (b as Record<string, unknown>)[key];
        const newPath = path ? `${path}.${key}` : key;
        
        if (!(key in (a as object))) {
          differences.push(`${newPath}: added ${JSON.stringify(bVal)}`);
        } else if (!(key in (b as object))) {
          differences.push(`${newPath}: removed ${JSON.stringify(aVal)}`);
        } else {
          compare(aVal, bVal, newPath);
        }
      }
      return;
    }
    
    differences.push(`${path}: ${JSON.stringify(a)} → ${JSON.stringify(b)}`);
  }
  
  compare(obj1, obj2);
  
  return differences.length > 0 
    ? differences.join('\n')
    : 'No differences found';
}
