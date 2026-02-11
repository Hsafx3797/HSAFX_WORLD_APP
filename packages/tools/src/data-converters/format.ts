/**
 * General Format Conversion Utilities
 * TOML, INI, Properties, and other miscellaneous formats
 */

// ==================== TOML ====================

/**
 * Convert JSON to TOML format
 */
export function jsonToToml(json: string): string {
  const data = JSON.parse(json);
  
  function toToml(obj: Record<string, unknown>, prefix = ''): string {
    const lines: string[] = [];
    const tables: string[] = [];
    
    for (const [key, value] of Object.entries(obj)) {
      if (!key) continue;
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (value === null || value === undefined) {
        continue;
      } else if (typeof value === 'boolean') {
        lines.push(`${key} = ${value}`);
      } else if (typeof value === 'number') {
        lines.push(`${key} = ${value}`);
      } else if (typeof value === 'string') {
        lines.push(`${key} = "${value.replace(/"/g, '\\"')}"`);
      } else if (Array.isArray(value)) {
        if (value.every((v) => typeof v !== 'object' || v === null)) {
          const arrStr = value.map((v) => 
            typeof v === 'string' ? `"${v}"` : String(v)
          ).join(', ');
          lines.push(`${key} = [${arrStr}]`);
        } else {
          value.forEach((item) => {
            tables.push(`\n[[${fullKey}]]`);
            tables.push(toToml(item as Record<string, unknown>));
          });
        }
      } else if (typeof value === 'object') {
        tables.push(`\n[${fullKey}]`);
        tables.push(toToml(value as Record<string, unknown>));
      }
    }
    
    return lines.concat(tables).join('\n');
  }
  
  return toToml(data);
}

// ==================== INI ====================

/**
 * Convert INI to JSON
 */
export function iniToJson(ini: string): string {
  const result: Record<string, unknown> = {};
  let currentSection: Record<string, unknown> = result;
  
  const lines = ini.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#')) continue;
    
    const sectionMatch = trimmed.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      const sectionName = sectionMatch[1]!;
      result[sectionName] = {};
      currentSection = result[sectionName] as Record<string, unknown>;
      continue;
    }
    
    const keyValueMatch = trimmed.match(/^([^=]+)=(.*)$/);
    if (keyValueMatch) {
      const key = keyValueMatch[1]!.trim();
      let value: string | number | boolean = keyValueMatch[2]!.trim();
      
      // Type coercion
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      else if (!isNaN(Number(value)) && value !== '') value = Number(value);
      
      currentSection[key] = value;
    }
  }
  
  return JSON.stringify(result, null, 2);
}

/**
 * Convert JSON to INI format
 */
export function jsonToIni(json: string): string {
  const data = JSON.parse(json);
  const lines: string[] = [];
  
  for (const [section, values] of Object.entries(data as Record<string, unknown>)) {
    if (typeof values === 'object' && values !== null && !Array.isArray(values)) {
      lines.push(`[${section}]`);
      for (const [key, value] of Object.entries(values as Record<string, unknown>)) {
        lines.push(`${key}=${String(value)}`);
      }
      lines.push('');
    } else {
      lines.push(`${section}=${String(values)}`);
    }
  }
  
  return lines.join('\n').trim();
}

// ==================== PROPERTIES ====================

/**
 * Convert JSON to Java .properties format
 */
export function jsonToProperties(json: string): string {
  const data = JSON.parse(json);
  
  function flatten(obj: unknown, prefix = ''): string[] {
    const lines: string[] = [];
    
    if (typeof obj !== 'object' || obj === null) {
      return [`${prefix}=${String(obj)}`];
    }
    
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (!key) continue;
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        lines.push(...flatten(value, newKey));
      } else if (Array.isArray(value)) {
        value.forEach((item, i) => {
          lines.push(...flatten(item, `${newKey}[${i}]`));
        });
      } else {
        lines.push(`${newKey}=${String(value ?? '')}`);
      }
    }
    
    return lines;
  }
  
  return flatten(data).join('\n');
}

/**
 * Convert .properties file to JSON
 */
export function propertiesToJson(props: string): string {
  const lines = props.split('\n').filter((line) => line.trim() && !line.startsWith('#'));
  const result: Record<string, unknown> = {};
  
  for (const line of lines) {
    const [keyPart, ...valueParts] = line.split('=');
    if (!keyPart) continue;
    const value = valueParts.join('=').trim();
    const keys = keyPart.trim().split('.');
    
    let current: Record<string, unknown> = result;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i]!;
      if (!(k in current)) {
        current[k] = {};
      }
      current = current[k] as Record<string, unknown>;
    }
    
    const lastKey = keys[keys.length - 1]!;
    if (value === 'true') {
      current[lastKey] = true;
    } else if (value === 'false') {
      current[lastKey] = false;
    } else if (!isNaN(Number(value)) && value !== '') {
      current[lastKey] = Number(value);
    } else {
      current[lastKey] = value;
    }
  }
  
  return JSON.stringify(result, null, 2);
}

// ==================== ENV ====================

/**
 * Convert .env file to JSON
 */
export function envToJson(env: string): string {
  const result: Record<string, string> = {};
  const lines = env.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1]!.trim();
      let value = match[2] ?? '';
      // Remove surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      result[key] = value;
    }
  }
  
  return JSON.stringify(result, null, 2);
}

/**
 * Convert JSON to .env format
 */
export function jsonToEnv(json: string): string {
  const data = JSON.parse(json);
  const lines: string[] = [];
  
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const strValue = String(value ?? '');
    // Quote if contains spaces or special characters
    if (strValue.includes(' ') || strValue.includes('\n') || strValue.includes('=')) {
      lines.push(`${key}="${strValue.replace(/"/g, '\\"')}"`);
    } else {
      lines.push(`${key}=${strValue}`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Convert .env to Docker Compose environment section
 */
export function envToDockerCompose(env: string): string {
  const json = JSON.parse(envToJson(env)) as Record<string, string>;
  const envLines = Object.entries(json).map(([k, v]) => `      - ${k}=${v}`);
  
  return `version: "3.8"
services:
  app:
    environment:
${envLines.join('\n')}`;
}

// ==================== LINE ENDINGS ====================

/**
 * Normalize line endings
 */
export function normalizeLineEndings(text: string, style: 'lf' | 'crlf' | 'cr' = 'lf'): string {
  // First normalize to LF
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  switch (style) {
    case 'crlf':
      return normalized.replace(/\n/g, '\r\n');
    case 'cr':
      return normalized.replace(/\n/g, '\r');
    case 'lf':
    default:
      return normalized;
  }
}

/**
 * Convert indentation (tabs <-> spaces)
 */
export function convertIndentation(text: string, fromTabs: boolean, toTabs: boolean, spaces = 2): string {
  if (fromTabs && !toTabs) {
    // Tabs to spaces
    return text.replace(/\t/g, ' '.repeat(spaces));
  } else if (!fromTabs && toTabs) {
    // Spaces to tabs (replace leading spaces groups)
    const regex = new RegExp(`^( {${spaces}})+`, 'gm');
    return text.replace(regex, (match) => '\t'.repeat(match.length / spaces));
  }
  return text;
}

/**
 * Sort object keys in text
 */
export function sortKeys(text: string, isYaml = false): string {
  if (isYaml) {
    // For YAML, simple approach: parse as JSON via YAML, sort, stringify
    // This is a simplified version - full YAML sorting would need yaml library
    return text; // Just return as-is for now, proper implementation needs yaml parser
  }
  
  const parsed = JSON.parse(text);
  
  function sortObject(obj: unknown): unknown {
    if (Array.isArray(obj)) {
      return obj.map(sortObject);
    }
    if (obj !== null && typeof obj === 'object') {
      const sorted: Record<string, unknown> = {};
      const keys = Object.keys(obj as Record<string, unknown>).sort();
      for (const key of keys) {
        sorted[key] = sortObject((obj as Record<string, unknown>)[key]);
      }
      return sorted;
    }
    return obj;
  }
  
  return JSON.stringify(sortObject(parsed), null, 2);
}
