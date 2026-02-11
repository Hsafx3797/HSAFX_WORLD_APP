/**
 * YAML Conversion Utilities
 * Simple implementation to avoid module import issues - browser/server compatible
 */

// Internal YAML stringifier
function stringifyYaml(obj: unknown, indent = 0): string {
  const spaces = '  '.repeat(indent);
  
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj === 'boolean') return obj ? 'true' : 'false';
  if (typeof obj === 'number') return String(obj);
  if (typeof obj === 'string') {
    if (obj.includes('\n') || obj.includes(':') || obj.includes('#')) {
      return `"${obj.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
    }
    return obj;
  }
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return obj.map((item) => `${spaces}- ${stringifyYaml(item, indent + 1).trim()}`).join('\n');
  }
  
  if (typeof obj === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    return entries.map(([key, value]) => {
      const valueStr = stringifyYaml(value, indent + 1);
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return `${spaces}${key}:\n${valueStr}`;
      }
      if (Array.isArray(value)) {
        return `${spaces}${key}:\n${valueStr}`;
      }
      return `${spaces}${key}: ${valueStr}`;
    }).join('\n');
  }
  
  return String(obj);
}

// Internal YAML parser
function parseYaml(yamlStr: string): unknown {
  const lines = yamlStr.split('\n');
  const result: Record<string, unknown> = {};
  const stack: { obj: Record<string, unknown>; indent: number }[] = [{ obj: result, indent: -1 }];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const indent = line.search(/\S/);
    const match = trimmed.match(/^([^:]+):\s*(.*)$/);
    
    if (match) {
      const key = match[1]!.trim();
      const value = match[2]!.trim();
      
      while (stack.length > 1 && stack[stack.length - 1]!.indent >= indent) {
        stack.pop();
      }
      
      const parent = stack[stack.length - 1]!.obj;
      
      if (value === '' || value === '|' || value === '>') {
        const newObj: Record<string, unknown> = {};
        parent[key] = newObj;
        stack.push({ obj: newObj, indent });
      } else {
        parent[key] = parseYamlValue(value);
      }
    }
  }
  
  return result;
}

function parseYamlValue(value: string): unknown {
  if (value === 'null' || value === '~') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+$/.test(value)) return parseInt(value, 10);
  if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

// ==================== EXPORTS ====================

/**
 * Convert JSON string to YAML format
 */
export function jsonToYaml(json: string): string {
  const parsed = JSON.parse(json);
  return stringifyYaml(parsed);
}

/**
 * Convert YAML string to JSON format
 */
export function yamlToJson(yamlStr: string, indent = 2): string {
  const parsed = parseYaml(yamlStr);
  return JSON.stringify(parsed, null, indent);
}

/**
 * Format YAML string (parse and re-stringify for consistent formatting)
 */
export function formatYaml(yamlStr: string): string {
  const parsed = parseYaml(yamlStr);
  return stringifyYaml(parsed);
}

/**
 * Convert .env file content to YAML
 */
export function envToYaml(env: string): string {
  const json = envToJsonInternal(env);
  return stringifyYaml(JSON.parse(json));
}

// Internal helper for env parsing
function envToJsonInternal(env: string): string {
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
