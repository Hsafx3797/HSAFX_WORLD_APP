/**
 * Schema Converters - JSON Schema to TypeScript, Zod, Joi, OpenAPI
 */

/**
 * Convert JSON Schema to TypeScript interface
 */
export function jsonSchemaToTypeScript(schema: string, name = 'Root'): string {
  try {
    const parsed = JSON.parse(schema);
    return generateTypeScriptInterface(parsed, name);
  } catch (e) {
    return `// Error: ${(e as Error).message}`;
  }
}

function generateTypeScriptInterface(schema: Record<string, unknown>, name: string, indent = 0): string {
  const spaces = '  '.repeat(indent);
  const type = schema.type as string;
  
  if (type === 'object') {
    const properties = schema.properties as Record<string, Record<string, unknown>> || {};
    const required = new Set((schema.required as string[]) || []);
    
    let result = `${spaces}interface ${name} {\n`;
    
    for (const [key, prop] of Object.entries(properties)) {
      const optional = required.has(key) ? '' : '?';
      const propType = getTypeScriptType(prop, key);
      const description = prop.description ? ` // ${prop.description}` : '';
      result += `${spaces}  ${key}${optional}: ${propType};${description}\n`;
    }
    
    result += `${spaces}}\n`;
    return result;
  }
  
  return `type ${name} = ${getTypeScriptType(schema, name)};`;
}

function getTypeScriptType(schema: Record<string, unknown>, propName: string): string {
  const type = schema.type as string;
  
  switch (type) {
    case 'string':
      if (schema.enum) {
        return (schema.enum as string[]).map(v => `'${v}'`).join(' | ');
      }
      if (schema.format === 'date-time') return 'Date | string';
      if (schema.format === 'date') return 'string';
      if (schema.format === 'uri') return 'string';
      return 'string';
      
    case 'number':
    case 'integer':
      return 'number';
      
    case 'boolean':
      return 'boolean';
      
    case 'array':
      const items = schema.items as Record<string, unknown>;
      if (items) {
        return `${getTypeScriptType(items, propName)}[]`;
      }
      return 'unknown[]';
      
    case 'object':
      if (schema.properties) {
        // Inline object
        const properties = schema.properties as Record<string, Record<string, unknown>>;
        const required = new Set((schema.required as string[]) || []);
        const props = Object.entries(properties)
          .map(([key, prop]) => {
            const opt = required.has(key) ? '' : '?';
            return `${key}${opt}: ${getTypeScriptType(prop, key)}`;
          })
          .join('; ');
        return `{ ${props} }`;
      }
      if (schema.additionalProperties) {
        const valueType = getTypeScriptType(schema.additionalProperties as Record<string, unknown>, 'value');
        return `Record<string, ${valueType}>`;
      }
      return 'Record<string, unknown>';
      
    case 'null':
      return 'null';
      
    default:
      if (schema.oneOf || schema.anyOf) {
        const options = (schema.oneOf || schema.anyOf) as Record<string, unknown>[];
        return options.map(opt => getTypeScriptType(opt, propName)).join(' | ');
      }
      if (schema.allOf) {
        const options = schema.allOf as Record<string, unknown>[];
        return options.map(opt => getTypeScriptType(opt, propName)).join(' & ');
      }
      return 'unknown';
  }
}

/**
 * Convert JSON Schema to Zod validation schema
 */
export function jsonSchemaToZod(schema: string, name = 'schema'): string {
  try {
    const parsed = JSON.parse(schema);
    return `import { z } from 'zod';\n\nconst ${name} = ${generateZodSchema(parsed)};\n\ntype ${capitalize(name)} = z.infer<typeof ${name}>;`;
  } catch (e) {
    return `// Error: ${(e as Error).message}`;
  }
}

function generateZodSchema(schema: Record<string, unknown>): string {
  const type = schema.type as string;
  
  switch (type) {
    case 'string':
      let str = 'z.string()';
      if (schema.minLength) str += `.min(${schema.minLength})`;
      if (schema.maxLength) str += `.max(${schema.maxLength})`;
      if (schema.pattern) str += `.regex(/${schema.pattern}/)`;
      if (schema.format === 'email') str += `.email()`;
      if (schema.format === 'uri') str += `.url()`;
      if (schema.format === 'uuid') str += `.uuid()`;
      if (schema.format === 'date-time') str += `.datetime()`;
      if (schema.enum) {
        str = `z.enum([${(schema.enum as string[]).map(v => `'${v}'`).join(', ')}])`;
      }
      return str;
      
    case 'number':
    case 'integer':
      let num = type === 'integer' ? 'z.number().int()' : 'z.number()';
      if (schema.minimum !== undefined) num += `.min(${schema.minimum})`;
      if (schema.maximum !== undefined) num += `.max(${schema.maximum})`;
      return num;
      
    case 'boolean':
      return 'z.boolean()';
      
    case 'null':
      return 'z.null()';
      
    case 'array':
      const items = schema.items as Record<string, unknown>;
      let arr = `z.array(${items ? generateZodSchema(items) : 'z.unknown()'})`;
      if (schema.minItems) arr += `.min(${schema.minItems})`;
      if (schema.maxItems) arr += `.max(${schema.maxItems})`;
      return arr;
      
    case 'object':
      const properties = schema.properties as Record<string, Record<string, unknown>> || {};
      const required = new Set((schema.required as string[]) || []);
      
      const props = Object.entries(properties)
        .map(([key, prop]) => {
          let zodProp = generateZodSchema(prop);
          if (!required.has(key)) {
            zodProp += '.optional()';
          }
          return `  ${key}: ${zodProp}`;
        })
        .join(',\n');
      
      return `z.object({\n${props}\n})`;
      
    default:
      if (schema.oneOf || schema.anyOf) {
        const options = (schema.oneOf || schema.anyOf) as Record<string, unknown>[];
        if (options.length === 1) return generateZodSchema(options[0]!);
        return `z.union([${options.map(opt => generateZodSchema(opt)).join(', ')}])`;
      }
      return 'z.unknown()';
  }
}

/**
 * Convert JSON Schema to Joi validation schema
 */
export function jsonSchemaToJoi(schema: string, name = 'schema'): string {
  try {
    const parsed = JSON.parse(schema);
    return `const Joi = require('joi');\n\nconst ${name} = ${generateJoiSchema(parsed)};`;
  } catch (e) {
    return `// Error: ${(e as Error).message}`;
  }
}

function generateJoiSchema(schema: Record<string, unknown>): string {
  const type = schema.type as string;
  
  switch (type) {
    case 'string':
      let str = 'Joi.string()';
      if (schema.minLength) str += `.min(${schema.minLength})`;
      if (schema.maxLength) str += `.max(${schema.maxLength})`;
      if (schema.pattern) str += `.pattern(/${schema.pattern}/)`;
      if (schema.format === 'email') str += `.email()`;
      if (schema.format === 'uri') str += `.uri()`;
      if (schema.enum) {
        str += `.valid(${(schema.enum as string[]).map(v => `'${v}'`).join(', ')})`;
      }
      return str;
      
    case 'number':
    case 'integer':
      let num = type === 'integer' ? 'Joi.number().integer()' : 'Joi.number()';
      if (schema.minimum !== undefined) num += `.min(${schema.minimum})`;
      if (schema.maximum !== undefined) num += `.max(${schema.maximum})`;
      return num;
      
    case 'boolean':
      return 'Joi.boolean()';
      
    case 'array':
      const items = schema.items as Record<string, unknown>;
      let arr = `Joi.array()`;
      if (items) arr += `.items(${generateJoiSchema(items)})`;
      if (schema.minItems) arr += `.min(${schema.minItems})`;
      if (schema.maxItems) arr += `.max(${schema.maxItems})`;
      return arr;
      
    case 'object':
      const properties = schema.properties as Record<string, Record<string, unknown>> || {};
      const required = new Set((schema.required as string[]) || []);
      
      const props = Object.entries(properties)
        .map(([key, prop]) => {
          let joiProp = generateJoiSchema(prop);
          if (required.has(key)) {
            joiProp += '.required()';
          }
          return `  ${key}: ${joiProp}`;
        })
        .join(',\n');
      
      return `Joi.object({\n${props}\n})`;
      
    default:
      return 'Joi.any()';
  }
}

/**
 * Convert TypeScript interface to JSON Schema
 */
export function typeScriptToJsonSchema(tsCode: string): string {
  try {
    // Basic TypeScript interface parsing
    const interfaceMatch = tsCode.match(/interface\s+(\w+)\s*\{([^}]+)\}/);
    if (!interfaceMatch) {
      return JSON.stringify({ error: 'Could not parse TypeScript interface' });
    }
    
    const name = interfaceMatch[1];
    const body = interfaceMatch[2]!;
    
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    
    const propertyMatches = body.matchAll(/(\w+)(\?)?:\s*([^;]+);/g);
    for (const match of propertyMatches) {
      const propName = match[1]!;
      const optional = match[2] === '?';
      const typeStr = match[3]!.trim();
      
      properties[propName] = typeStringToJsonSchema(typeStr);
      if (!optional) {
        required.push(propName);
      }
    }
    
    const schema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: name,
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined
    };
    
    return JSON.stringify(schema, null, 2);
  } catch (e) {
    return JSON.stringify({ error: (e as Error).message });
  }
}

function typeStringToJsonSchema(typeStr: string): Record<string, unknown> {
  // Handle union types
  if (typeStr.includes(' | ')) {
    const types = typeStr.split(' | ').map(t => t.trim());
    return { oneOf: types.map(t => typeStringToJsonSchema(t)) };
  }
  
  // Handle arrays
  if (typeStr.endsWith('[]')) {
    const itemType = typeStr.slice(0, -2);
    return { type: 'array', items: typeStringToJsonSchema(itemType) };
  }
  
  // Handle basic types
  switch (typeStr.toLowerCase()) {
    case 'string':
      return { type: 'string' };
    case 'number':
      return { type: 'number' };
    case 'boolean':
      return { type: 'boolean' };
    case 'null':
      return { type: 'null' };
    case 'any':
    case 'unknown':
      return {};
    default:
      // Could be a custom type or string literal
      if (typeStr.startsWith("'") && typeStr.endsWith("'")) {
        return { const: typeStr.slice(1, -1) };
      }
      return { type: 'object' };
  }
}

/**
 * Infer JSON Schema from JSON data
 */
export function inferJsonSchema(json: string): string {
  try {
    const data = JSON.parse(json);
    const schema = inferSchema(data);
    
    return JSON.stringify({
      $schema: 'http://json-schema.org/draft-07/schema#',
      ...schema
    }, null, 2);
  } catch (e) {
    return JSON.stringify({ error: (e as Error).message });
  }
}

function inferSchema(value: unknown): Record<string, unknown> {
  if (value === null) {
    return { type: 'null' };
  }
  
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return { type: 'array' };
    }
    // Infer from first item
    return {
      type: 'array',
      items: inferSchema(value[0])
    };
  }
  
  const type = typeof value;
  
  switch (type) {
    case 'string':
      const str = value as string;
      // Try to detect format
      if (str.match(/^\d{4}-\d{2}-\d{2}T/)) {
        return { type: 'string', format: 'date-time' };
      }
      if (str.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return { type: 'string', format: 'date' };
      }
      if (str.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return { type: 'string', format: 'email' };
      }
      if (str.match(/^https?:\/\//)) {
        return { type: 'string', format: 'uri' };
      }
      return { type: 'string' };
      
    case 'number':
      return Number.isInteger(value) ? { type: 'integer' } : { type: 'number' };
      
    case 'boolean':
      return { type: 'boolean' };
      
    case 'object':
      const obj = value as Record<string, unknown>;
      const properties: Record<string, unknown> = {};
      const required: string[] = [];
      
      for (const [key, val] of Object.entries(obj)) {
        properties[key] = inferSchema(val);
        required.push(key);
      }
      
      return {
        type: 'object',
        properties,
        required
      };
      
    default:
      return {};
  }
}

// Helper
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
