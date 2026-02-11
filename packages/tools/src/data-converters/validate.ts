/**
 * Validation Utilities for Data Formats
 */

/**
 * Validate JSON string
 */
export function validateJson(json: string): { valid: boolean; error?: string } {
  try {
    JSON.parse(json);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: (e as Error).message };
  }
}

/**
 * Validate YAML string (basic validation)
 */
export function validateYaml(yamlStr: string): { valid: boolean; error?: string } {
  try {
    // Basic YAML validation - check for invalid structures
    const lines = yamlStr.split('\n');
    // const indentStack: number[] = [-1];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const trimmed = line.trim();
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      // Check for tabs (YAML prefers spaces)
      if (line.includes('\t')) {
        return { valid: false, error: `Line ${i + 1}: tabs are not allowed in YAML` };
      }
      
      // Check key-value format
      if (!trimmed.startsWith('-') && !trimmed.includes(':')) {
        return { valid: false, error: `Line ${i + 1}: invalid YAML syntax` };
      }
    }
    
    return { valid: true };
  } catch (e) {
    return { valid: false, error: (e as Error).message };
  }
}

/**
 * Test regex pattern against text
 */
export function testRegex(pattern: string, text: string, flags = 'g'): string {
  try {
    const regex = new RegExp(pattern, flags);
    const matches: { match: string; index: number; groups?: Record<string, string> }[] = [];
    let match: RegExpExecArray | null;
    
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        match: match[0],
        index: match.index,
        groups: match.groups
      });
      
      // Prevent infinite loop for zero-length matches
      if (match.index === regex.lastIndex) {
        regex.lastIndex++;
      }
    }
    
    return JSON.stringify({
      pattern,
      flags,
      matches,
      matchCount: matches.length
    }, null, 2);
  } catch (e) {
    return JSON.stringify({ error: (e as Error).message });
  }
}

/**
 * Test JsonPath expression against JSON
 */
export function testJsonPath(json: string, path: string): string {
  try {
    const data = JSON.parse(json);
    
    // Simple JSONPath implementation for basic expressions
    if (path === '$' || path === '') {
      return JSON.stringify({ path, result: data }, null, 2);
    }
    
    // Handle basic paths like $.field, $.field.subfield, $[0], $.array[0]
    const segments = path.replace(/^\$\.?/, '').split(/\.|\[|\]/).filter(Boolean);
    
    let current: unknown = data;
    for (const segment of segments) {
      if (current === null || current === undefined) break;
      
      if (segment.match(/^\d+$/)) {
        // Array index
        current = (current as unknown[])[parseInt(segment, 10)];
      } else {
        // Object property
        current = (current as Record<string, unknown>)[segment];
      }
    }
    
    return JSON.stringify({ path, result: current }, null, 2);
  } catch (e) {
    return JSON.stringify({ error: (e as Error).message });
  }
}

/**
 * Parse and validate semantic versioning
 */
export function parseSemver(version: string): { valid: boolean; parsed?: Record<string, unknown>; error?: string } {
  const semverRegex = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([\da-z-]+(?:\.[\da-z-]+)*))?(?:\+([\da-z-]+(?:\.[\da-z-]+)*))?$/i;
  
  const match = version.match(semverRegex);
  if (!match) {
    return { valid: false, error: 'Invalid semantic version format' };
  }
  
  return {
    valid: true,
    parsed: {
      major: parseInt(match[1]!, 10),
      minor: parseInt(match[2]!, 10),
      patch: parseInt(match[3]!, 10),
      prerelease: match[4] || null,
      buildMetadata: match[5] || null,
      full: version
    }
  };
}

/**
 * Parse cron expression
 */
export function parseCronExpression(cron: string): string {
  const parts = cron.trim().split(/\s+/);
  
  const fieldNames = ['minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'];
  
  if (parts.length !== 5 && parts.length !== 6) {
    return JSON.stringify({ valid: false, error: 'Cron expression must have 5 or 6 fields' });
  }
  
  const result: Record<string, unknown> = {
    valid: true,
    fields: {}
  };
  
  // If 6 parts, first is seconds (extended cron)
  const offset = parts.length === 6 ? 1 : 0;
  if (parts.length === 6) {
    (result.fields as Record<string, unknown>).second = parts[0];
  }
  
  for (let i = 0; i < 5; i++) {
    const field = parts[i + offset];
    const name = fieldNames[i];
    (result.fields as Record<string, unknown>)[name!] = field;
  }
  
  // Generate human-readable description
  const descriptions: string[] = [];
  
  const minute = parts[offset];
  const hour = parts[1 + offset];
  
  if (minute === '*' && hour === '*') {
    descriptions.push('Every minute');
  } else if (minute !== '*' && hour === '*') {
    descriptions.push(`At minute ${minute} of every hour`);
  } else if (minute !== '*' && hour !== '*') {
    descriptions.push(`At ${hour}:${minute?.padStart(2, '0')}`);
  }
  
  result.description = descriptions.join(', ') || 'Custom schedule';
  
  return JSON.stringify(result, null, 2);
}

/**
 * Line-by-line diff
 */
export function lineDiff(text1: string, text2: string): string {
  const lines1 = text1.split('\n');
  const lines2 = text2.split('\n');
  const result: string[] = [];
  
  const maxLen = Math.max(lines1.length, lines2.length);
  
  for (let i = 0; i < maxLen; i++) {
    const line1 = lines1[i];
    const line2 = lines2[i];
    
    if (line1 === line2) {
      result.push(`  ${line1}`);
    } else if (line1 === undefined) {
      result.push(`+ ${line2}`);
    } else if (line2 === undefined) {
      result.push(`- ${line1}`);
    } else {
      result.push(`- ${line1}`);
      result.push(`+ ${line2}`);
    }
  }
  
  return result.join('\n');
}
