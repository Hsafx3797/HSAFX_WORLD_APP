/**
 * XML Conversion Utilities
 */

/**
 * Escape special XML characters
 */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Convert JSON string to XML format
 */
export function jsonToXml(json: string, rootName = 'root'): string {
  const parsed = JSON.parse(json);
  
  function toXml(obj: unknown, indent = ''): string {
    if (obj === null || obj === undefined) return '';
    
    if (Array.isArray(obj)) {
      return obj.map((item) => toXml(item, indent)).join('\n');
    }
    
    if (typeof obj === 'object') {
      const entries = Object.entries(obj as Record<string, unknown>);
      return entries.map(([key, value]) => {
        if (Array.isArray(value)) {
          return value.map((item) => 
            `${indent}<${key}>\n${toXml(item, indent + '  ')}\n${indent}</${key}>`
          ).join('\n');
        }
        if (typeof value === 'object' && value !== null) {
          return `${indent}<${key}>\n${toXml(value, indent + '  ')}\n${indent}</${key}>`;
        }
        return `${indent}<${key}>${escapeXml(String(value))}</${key}>`;
      }).join('\n');
    }
    
    return `${indent}${escapeXml(String(obj))}`;
  }
  
  return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n${toXml(parsed, '  ')}\n</${rootName}>`;
}

/**
 * Convert XML string to JSON (simple regex-based parser)
 */
export function xmlToJson(xml: string): string {
  const result: Record<string, unknown> = {};
  const rootMatch = xml.match(/<(\w+)[^>]*>([\s\S]*?)<\/\1>/);
  if (!rootMatch) return '{}';
  
  const rootTag = rootMatch[1]!;
  const content = rootMatch[2] ?? '';
  
  function parseContent(str: string): unknown {
    if (!/<\w+/.test(str)) {
      return str.trim() || null;
    }
    
    const obj: Record<string, unknown> = {};
    const tagRegex = /<(\w+)([^>]*)>([^<]*(?:(?!<\/\1>)<[^<]*)*)<\/\1>/g;
    let match;
    
    while ((match = tagRegex.exec(str)) !== null) {
      const tag = match[1];
      const inner = match[3] ?? '';
      if (!tag) continue;
      
      const parsed = parseContent(inner);
      
      if (obj[tag] !== undefined) {
        if (!Array.isArray(obj[tag])) {
          obj[tag] = [obj[tag]];
        }
        (obj[tag] as unknown[]).push(parsed);
      } else {
        obj[tag] = parsed;
      }
    }
    
    return Object.keys(obj).length ? obj : str.trim() || null;
  }
  
  result[rootTag] = parseContent(content);
  return JSON.stringify(result, null, 2);
}

/**
 * Format XML with indentation
 */
export function formatXml(xml: string, indent = 2): string {
  const lines = xml.replace(/>\s*</g, '>\n<').split('\n');
  let level = 0;
  const indentStr = ' '.repeat(indent);
  
  return lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    
    // Closing tag
    if (trimmed.startsWith('</')) {
      level--;
    }
    
    const result = indentStr.repeat(Math.max(0, level)) + trimmed;
    
    // Opening tag (not self-closing, not closing)
    if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>') && !trimmed.includes('</')) {
      level++;
    }
    
    return result;
  }).filter(Boolean).join('\n');
}

/**
 * Validate XML structure
 */
export function validateXml(xml: string): { valid: boolean; error?: string } {
  const tagStack: string[] = [];
  const tagPattern = /<\/?(\w+)[^>]*\/?>/g;
  const selfClosing = /<(\w+)[^>]*\/>/g;
  
  let match;
  while ((match = tagPattern.exec(xml)) !== null) {
    const fullTag = match[0];
    const tagName = match[1];
    
    if (!tagName) continue;
    
    // Skip self-closing
    if (selfClosing.test(fullTag)) {
      selfClosing.lastIndex = 0;
      continue;
    }
    
    if (fullTag.startsWith('</')) {
      // Closing tag
      const expected = tagStack.pop();
      if (expected !== tagName) {
        return { valid: false, error: `Mismatched tag: expected </${expected}>, found </${tagName}>` };
      }
    } else if (!fullTag.endsWith('/>')) {
      // Opening tag
      tagStack.push(tagName);
    }
  }
  
  if (tagStack.length > 0) {
    return { valid: false, error: `Unclosed tags: ${tagStack.join(', ')}` };
  }
  
  return { valid: true };
}

/**
 * Test XPath expression against XML
 */
export function testXPath(xml: string, xpath: string): string {
  // Basic XPath simulation for browser environments
  // Full XPath requires DOM parser, this is a simplified version
  
  // Extract tag from simple XPath like //tagname or /root/child
  const simpleMatch = xpath.match(/\/\/(\w+)/);
  if (!simpleMatch) {
    return JSON.stringify({ error: 'Only simple //tagname XPath supported in browser' });
  }
  
  const tagName = simpleMatch[1];
  const regex = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`, 'g');
  const matches: string[] = [];
  
  let match;
  while ((match = regex.exec(xml)) !== null) {
    matches.push(match[1] ?? '');
  }
  
  return JSON.stringify({ xpath, matches, count: matches.length }, null, 2);
}
