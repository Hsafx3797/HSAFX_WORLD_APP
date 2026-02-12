/**
 * Specialized Converters
 * Avro, OpenAPI, GraphQL, Helm, Terraform, and language transpilers
 */

// ============================================================
// Avro Schema → JSON Schema
// ============================================================

/**
 * Convert Avro schema to JSON Schema
 */
export function avroToJsonSchema(input: string): string {
  try {
    const avro = JSON.parse(input);
    const jsonSchema = convertAvroType(avro);
    return JSON.stringify(
      { $schema: 'http://json-schema.org/draft-07/schema#', ...jsonSchema },
      null,
      2
    );
  } catch (e) {
    return JSON.stringify({ error: `Invalid Avro schema: ${(e as Error).message}` });
  }
}

function convertAvroType(avro: unknown): Record<string, unknown> {
  if (typeof avro === 'string') {
    return avroStringType(avro);
  }

  if (Array.isArray(avro)) {
    // Union type — nullable pattern is ["null", "type"]
    const filtered = avro.filter((t) => t !== 'null');
    const hasNull = avro.includes('null');
    if (filtered.length === 1) {
      const converted = convertAvroType(filtered[0]);
      return hasNull ? { oneOf: [converted, { type: 'null' }] } : converted;
    }
    const variants = avro.map((t) => convertAvroType(t));
    return { oneOf: variants };
  }

  if (typeof avro === 'object' && avro !== null) {
    const obj = avro as Record<string, unknown>;
    const avroType = obj.type as string;

    switch (avroType) {
      case 'record': {
        const fields = (obj.fields as Array<Record<string, unknown>>) || [];
        const properties: Record<string, unknown> = {};
        const required: string[] = [];
        for (const field of fields) {
          const name = field.name as string;
          properties[name] = convertAvroType(field.type);
          if (field.doc) {
            (properties[name] as Record<string, unknown>).description = field.doc;
          }
          // Fields without a default are required
          if (!('default' in field)) {
            required.push(name);
          }
        }
        const result: Record<string, unknown> = {
          type: 'object',
          properties,
        };
        if (obj.name) result.title = obj.name;
        if (obj.doc) result.description = obj.doc;
        if (required.length > 0) result.required = required;
        return result;
      }

      case 'array':
        return { type: 'array', items: convertAvroType(obj.items) };

      case 'map':
        return {
          type: 'object',
          additionalProperties: convertAvroType(obj.values),
        };

      case 'enum':
        return {
          type: 'string',
          enum: obj.symbols,
          ...(obj.doc ? { description: obj.doc as string } : {}),
        };

      case 'fixed':
        return { type: 'string', minLength: obj.size as number, maxLength: obj.size as number };

      default:
        return avroStringType(avroType);
    }
  }

  return {};
}

function avroStringType(avroType: string): Record<string, unknown> {
  switch (avroType) {
    case 'null':
      return { type: 'null' };
    case 'boolean':
      return { type: 'boolean' };
    case 'int':
    case 'long':
      return { type: 'integer' };
    case 'float':
    case 'double':
      return { type: 'number' };
    case 'bytes':
      return { type: 'string', contentEncoding: 'base64' };
    case 'string':
      return { type: 'string' };
    default:
      return { type: 'string', description: `Avro type: ${avroType}` };
  }
}

// ============================================================
// OpenAPI 2.0 (Swagger) → OpenAPI 3.0
// ============================================================

/**
 * Convert Swagger 2.0 spec to OpenAPI 3.0
 */
export function openapi2ToOpenapi3(input: string): string {
  try {
    const swagger = JSON.parse(input);
    if (swagger.openapi?.startsWith('3')) {
      return JSON.stringify(swagger, null, 2) + '\n// Already OpenAPI 3.x';
    }

    const openapi3: Record<string, unknown> = {
      openapi: '3.0.3',
      info: swagger.info || { title: 'API', version: '1.0.0' },
    };

    // Servers from host/basePath/schemes
    if (swagger.host || swagger.basePath) {
      const scheme = (swagger.schemes || ['https'])[0];
      const host = swagger.host || 'localhost';
      const basePath = swagger.basePath || '';
      openapi3.servers = [{ url: `${scheme}://${host}${basePath}` }];
    }

    // Convert paths
    const paths: Record<string, unknown> = {};
    const globalConsumes: string[] = swagger.consumes || ['application/json'];
    const globalProduces: string[] = swagger.produces || ['application/json'];

    for (const [path, methods] of Object.entries(swagger.paths || {})) {
      const pathObj: Record<string, unknown> = {};
      for (const [method, op] of Object.entries(methods as Record<string, Record<string, unknown>>)) {
        if (method.startsWith('x-') || method === 'parameters') continue;
        pathObj[method] = convertOperation(
          op,
          op.consumes as string[] || globalConsumes,
          op.produces as string[] || globalProduces,
        );
      }
      paths[path] = pathObj;
    }
    openapi3.paths = paths;

    // Convert definitions → components/schemas
    const components: Record<string, unknown> = {};
    if (swagger.definitions) {
      components.schemas = convertSchemaRefs(swagger.definitions);
    }
    if (swagger.securityDefinitions) {
      components.securitySchemes = convertSecurityDefs(swagger.securityDefinitions);
    }
    if (Object.keys(components).length > 0) {
      openapi3.components = components;
    }

    if (swagger.security) {
      openapi3.security = swagger.security;
    }
    if (swagger.tags) {
      openapi3.tags = swagger.tags;
    }

    // Fix all $ref paths
    const result = JSON.stringify(openapi3, null, 2);
    return result.replace(/#\/definitions\//g, '#/components/schemas/');
  } catch (e) {
    return JSON.stringify({ error: `Invalid Swagger 2.0: ${(e as Error).message}` });
  }
}

function convertOperation(
  op: Record<string, unknown>,
  consumes: string[],
  produces: string[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (op.summary) result.summary = op.summary;
  if (op.description) result.description = op.description;
  if (op.operationId) result.operationId = op.operationId;
  if (op.tags) result.tags = op.tags;

  // Split parameters into path/query/header vs body
  const params = (op.parameters || []) as Record<string, unknown>[];
  const queryParams: Record<string, unknown>[] = [];
  let requestBody: Record<string, unknown> | undefined;

  for (const param of params) {
    if (param.in === 'body') {
      const mediaType = consumes[0] || 'application/json';
      requestBody = {
        required: param.required ?? true,
        content: {
          [mediaType]: { schema: param.schema || {} },
        },
      };
      if (param.description) requestBody.description = param.description;
    } else if (param.in === 'formData') {
      if (!requestBody) {
        requestBody = {
          content: {
            'application/x-www-form-urlencoded': {
              schema: { type: 'object', properties: {} },
            },
          },
        };
      }
      const formSchema = (requestBody.content as Record<string, Record<string, Record<string, unknown>>>)['application/x-www-form-urlencoded']?.schema;
      if (formSchema?.properties) {
        (formSchema.properties as Record<string, unknown>)[param.name as string] = {
          type: param.type || 'string',
          ...(param.description ? { description: param.description } : {}),
        };
      }
    } else {
      const p: Record<string, unknown> = {
        name: param.name,
        in: param.in,
      };
      if (param.required) p.required = true;
      if (param.description) p.description = param.description;
      p.schema = { type: (param.type as string) || 'string' };
      if (param.enum) (p.schema as Record<string, unknown>).enum = param.enum;
      queryParams.push(p);
    }
  }

  if (queryParams.length > 0) result.parameters = queryParams;
  if (requestBody) result.requestBody = requestBody;

  // Convert responses
  const responses: Record<string, unknown> = {};
  for (const [code, resp] of Object.entries((op.responses || {}) as Record<string, Record<string, unknown>>)) {
    const response: Record<string, unknown> = {};
    if (resp.description) response.description = resp.description;
    if (resp.schema) {
      const mediaType = produces[0] || 'application/json';
      response.content = { [mediaType]: { schema: resp.schema } };
    }
    responses[code] = response;
  }
  if (Object.keys(responses).length > 0) result.responses = responses;
  else result.responses = { '200': { description: 'OK' } };

  return result;
}

function convertSchemaRefs(definitions: Record<string, unknown>): Record<string, unknown> {
  // Deep clone and pass-through — the $ref rewrite handles the rest
  return JSON.parse(JSON.stringify(definitions));
}

function convertSecurityDefs(defs: Record<string, Record<string, unknown>>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [name, def] of Object.entries(defs)) {
    if (def.type === 'basic') {
      result[name] = { type: 'http', scheme: 'basic' };
    } else if (def.type === 'apiKey') {
      result[name] = { type: 'apiKey', in: def.in, name: def.name };
    } else if (def.type === 'oauth2') {
      const flows: Record<string, unknown> = {};
      const flow = def.flow as string;
      const flowObj: Record<string, unknown> = { scopes: def.scopes || {} };
      if (def.authorizationUrl) flowObj.authorizationUrl = def.authorizationUrl;
      if (def.tokenUrl) flowObj.tokenUrl = def.tokenUrl;
      const flowMap: Record<string, string> = {
        implicit: 'implicit',
        password: 'password',
        application: 'clientCredentials',
        accessCode: 'authorizationCode',
      };
      flows[flowMap[flow] || flow] = flowObj;
      result[name] = { type: 'oauth2', flows };
    } else {
      result[name] = def;
    }
  }
  return result;
}

// ============================================================
// OpenAPI → TypeScript
// ============================================================

/**
 * Generate TypeScript interfaces from an OpenAPI spec
 */
export function openapiToTypescript(input: string): string {
  try {
    const spec = JSON.parse(input);
    const schemas =
      spec.components?.schemas || spec.definitions || {};

    const lines: string[] = [
      '// Auto-generated from OpenAPI spec',
      `// Source: ${spec.info?.title || 'API'} v${spec.info?.version || '1.0.0'}`,
      '',
    ];

    for (const [name, schema] of Object.entries(schemas)) {
      lines.push(schemaToTypeScript(name, schema as Record<string, unknown>));
      lines.push('');
    }

    // Generate API operation types from paths
    for (const [path, methods] of Object.entries(spec.paths || {})) {
      for (const [method, op] of Object.entries(methods as Record<string, Record<string, unknown>>)) {
        if (method.startsWith('x-')) continue;
        const opId = op.operationId as string;
        if (!opId) continue;
        const typeName = capitalize2(opId);

        // Request type
        const bodySchema = (op.requestBody as Record<string, unknown>)?.content;
        if (bodySchema) {
          const jsonContent = (bodySchema as Record<string, Record<string, unknown>>)['application/json'];
          if (jsonContent?.schema) {
            lines.push(
              `/** ${method.toUpperCase()} ${path} — request body */`,
            );
            lines.push(
              schemaToTypeScript(`${typeName}Request`, jsonContent.schema as Record<string, unknown>),
            );
            lines.push('');
          }
        }

        // Response type
        const response200 =
          (op.responses as Record<string, Record<string, unknown>>)?.['200'] ||
          (op.responses as Record<string, Record<string, unknown>>)?.['201'];
        if (response200?.content) {
          const jsonResp = (response200.content as Record<string, Record<string, unknown>>)['application/json'];
          if (jsonResp?.schema) {
            lines.push(
              `/** ${method.toUpperCase()} ${path} — response */`,
            );
            lines.push(
              schemaToTypeScript(`${typeName}Response`, jsonResp.schema as Record<string, unknown>),
            );
            lines.push('');
          }
        }
      }
    }

    return lines.join('\n').trim();
  } catch (e) {
    return `// Error: ${(e as Error).message}`;
  }
}

function schemaToTypeScript(name: string, schema: Record<string, unknown>): string {
  const type = schema.type as string;

  if (type === 'object' || schema.properties) {
    const props = (schema.properties || {}) as Record<string, Record<string, unknown>>;
    const required = new Set((schema.required as string[]) || []);
    const lines: string[] = [`export interface ${name} {`];

    for (const [key, prop] of Object.entries(props)) {
      const opt = required.has(key) ? '' : '?';
      const tsType = schemaTypeToTs(prop);
      if (prop.description) lines.push(`  /** ${prop.description} */`);
      lines.push(`  ${key}${opt}: ${tsType};`);
    }
    lines.push('}');
    return lines.join('\n');
  }

  if (schema.enum) {
    const values = (schema.enum as unknown[])
      .map((v) => (typeof v === 'string' ? `'${v}'` : String(v)))
      .join(' | ');
    return `export type ${name} = ${values};`;
  }

  return `export type ${name} = ${schemaTypeToTs(schema)};`;
}

function schemaTypeToTs(schema: Record<string, unknown>): string {
  if (schema.$ref) {
    const ref = (schema.$ref as string).split('/').pop() || 'unknown';
    return ref;
  }
  const type = schema.type as string;
  switch (type) {
    case 'string':
      if (schema.enum) {
        return (schema.enum as string[]).map((v) => `'${v}'`).join(' | ');
      }
      if (schema.format === 'date-time' || schema.format === 'date') return 'string';
      return 'string';
    case 'integer':
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array': {
      const items = schema.items as Record<string, unknown> | undefined;
      return items ? `${schemaTypeToTs(items)}[]` : 'unknown[]';
    }
    case 'object': {
      if (schema.additionalProperties) {
        return `Record<string, ${schemaTypeToTs(schema.additionalProperties as Record<string, unknown>)}>`;
      }
      if (schema.properties) {
        const props = Object.entries(schema.properties as Record<string, Record<string, unknown>>)
          .map(([k, v]) => `${k}: ${schemaTypeToTs(v)}`)
          .join('; ');
        return `{ ${props} }`;
      }
      return 'Record<string, unknown>';
    }
    default:
      if (schema.oneOf || schema.anyOf) {
        const items = (schema.oneOf || schema.anyOf) as Record<string, unknown>[];
        return items.map((i) => schemaTypeToTs(i)).join(' | ');
      }
      if (schema.allOf) {
        const items = schema.allOf as Record<string, unknown>[];
        return items.map((i) => schemaTypeToTs(i)).join(' & ');
      }
      return 'unknown';
  }
}

// ============================================================
// OpenAPI → GraphQL Schema
// ============================================================

/**
 * Convert OpenAPI spec to GraphQL schema definition
 */
export function openapiToGraphql(input: string): string {
  try {
    const spec = JSON.parse(input);
    const schemas = spec.components?.schemas || spec.definitions || {};
    const lines: string[] = ['# Auto-generated from OpenAPI spec', ''];

    // Convert schemas to GraphQL types
    for (const [name, schema] of Object.entries(schemas)) {
      lines.push(schemaToGraphqlType(name, schema as Record<string, unknown>));
      lines.push('');
    }

    // Generate Query type from GET paths
    const queries: string[] = [];
    const mutations: string[] = [];

    for (const [path, methods] of Object.entries(spec.paths || {})) {
      for (const [method, op] of Object.entries(methods as Record<string, Record<string, unknown>>)) {
        if (method.startsWith('x-')) continue;
        const opId = (op.operationId as string) || pathToName(path, method);
        const resp = findResponseSchema(op);
        const returnType = resp ? schemaToGraphqlTypeRef(resp) : 'String';
        const args = buildGraphqlArgs(op);
        const argsStr = args.length > 0 ? `(${args.join(', ')})` : '';

        if (method === 'get') {
          queries.push(`  ${opId}${argsStr}: ${returnType}`);
        } else {
          mutations.push(`  ${opId}${argsStr}: ${returnType}`);
        }
      }
    }

    if (queries.length > 0) {
      lines.push('type Query {');
      lines.push(...queries);
      lines.push('}');
      lines.push('');
    }

    if (mutations.length > 0) {
      lines.push('type Mutation {');
      lines.push(...mutations);
      lines.push('}');
      lines.push('');
    }

    return lines.join('\n').trim();
  } catch (e) {
    return `# Error: ${(e as Error).message}`;
  }
}

function schemaToGraphqlType(name: string, schema: Record<string, unknown>): string {
  if (schema.enum) {
    const values = (schema.enum as string[]).map((v) => `  ${String(v).toUpperCase().replace(/[^A-Z0-9_]/g, '_')}`).join('\n');
    return `enum ${name} {\n${values}\n}`;
  }

  const props = (schema.properties || {}) as Record<string, Record<string, unknown>>;
  const required = new Set((schema.required as string[]) || []);
  const fields: string[] = [];

  for (const [key, prop] of Object.entries(props)) {
    const gqlType = schemaToGraphqlTypeRef(prop);
    const bang = required.has(key) ? '!' : '';
    fields.push(`  ${key}: ${gqlType}${bang}`);
  }

  if (fields.length === 0) {
    return `type ${name} {\n  _empty: String\n}`;
  }

  return `type ${name} {\n${fields.join('\n')}\n}`;
}

function schemaToGraphqlTypeRef(schema: Record<string, unknown>): string {
  if (schema.$ref) {
    return (schema.$ref as string).split('/').pop() || 'String';
  }
  const type = schema.type as string;
  switch (type) {
    case 'string':
      return schema.format === 'date-time' ? 'DateTime' : 'String';
    case 'integer':
      return 'Int';
    case 'number':
      return 'Float';
    case 'boolean':
      return 'Boolean';
    case 'array': {
      const items = schema.items as Record<string, unknown> | undefined;
      return items ? `[${schemaToGraphqlTypeRef(items)}]` : '[String]';
    }
    default:
      return 'String';
  }
}

function findResponseSchema(op: Record<string, unknown>): Record<string, unknown> | null {
  const responses = op.responses as Record<string, Record<string, unknown>> | undefined;
  if (!responses) return null;
  const success = responses['200'] || responses['201'];
  if (!success) return null;
  const content = success.content as Record<string, Record<string, unknown>> | undefined;
  if (content?.['application/json']?.schema) return content['application/json'].schema as Record<string, unknown>;
  if (success.schema) return success.schema as Record<string, unknown>;
  return null;
}

function buildGraphqlArgs(op: Record<string, unknown>): string[] {
  const params = (op.parameters || []) as Record<string, unknown>[];
  return params
    .filter((p) => p.in === 'query' || p.in === 'path')
    .map((p) => {
      const bang = p.required ? '!' : '';
      const gqlType = schemaToGraphqlTypeRef(p.schema ? p.schema as Record<string, unknown> : { type: p.type });
      return `${p.name}: ${gqlType}${bang}`;
    });
}

function pathToName(path: string, method: string): string {
  const segments = path.split('/').filter(Boolean).filter((s) => !s.startsWith('{'));
  const name = segments.map((s) => capitalize2(s)).join('');
  return method === 'get' ? `get${name}` : `${method}${name}`;
}

// ============================================================
// GraphQL → OpenAPI
// ============================================================

/**
 * Convert GraphQL schema to OpenAPI specification
 */
export function graphqlToOpenapi(input: string): string {
  try {
    const types = parseGraphqlTypes(input);
    const schemas: Record<string, unknown> = {};

    for (const t of types) {
      if (t.kind === 'type' && t.name !== 'Query' && t.name !== 'Mutation') {
        const properties: Record<string, unknown> = {};
        const required: string[] = [];
        for (const field of t.fields) {
          properties[field.name] = graphqlTypeToJsonSchema(field.type);
          if (field.nonNull) required.push(field.name);
        }
        schemas[t.name] = {
          type: 'object',
          properties,
          ...(required.length > 0 ? { required } : {}),
        };
      }
    }

    // Build paths from Query/Mutation types
    const paths: Record<string, unknown> = {};
    const queryType = types.find((t) => t.name === 'Query');
    const mutationType = types.find((t) => t.name === 'Mutation');

    if (queryType) {
      for (const field of queryType.fields) {
        const path = `/${field.name}`;
        const params = field.args.map((a) => ({
          name: a.name,
          in: 'query',
          required: a.nonNull,
          schema: graphqlTypeToJsonSchema(a.type),
        }));
        paths[path] = {
          get: {
            operationId: field.name,
            parameters: params.length > 0 ? params : undefined,
            responses: {
              '200': {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: graphqlTypeToJsonSchema(field.type),
                  },
                },
              },
            },
          },
        };
      }
    }

    if (mutationType) {
      for (const field of mutationType.fields) {
        const path = `/${field.name}`;
        const bodyProps: Record<string, unknown> = {};
        const bodyRequired: string[] = [];
        for (const a of field.args) {
          bodyProps[a.name] = graphqlTypeToJsonSchema(a.type);
          if (a.nonNull) bodyRequired.push(a.name);
        }
        paths[path] = {
          post: {
            operationId: field.name,
            requestBody:
              field.args.length > 0
                ? {
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                          properties: bodyProps,
                          ...(bodyRequired.length > 0 ? { required: bodyRequired } : {}),
                        },
                      },
                    },
                  }
                : undefined,
            responses: {
              '200': {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: graphqlTypeToJsonSchema(field.type),
                  },
                },
              },
            },
          },
        };
      }
    }

    const openapi = {
      openapi: '3.0.3',
      info: { title: 'API (from GraphQL)', version: '1.0.0' },
      paths,
      components: Object.keys(schemas).length > 0 ? { schemas } : undefined,
    };

    return JSON.stringify(openapi, null, 2);
  } catch (e) {
    return JSON.stringify({ error: `GraphQL parse error: ${(e as Error).message}` });
  }
}

// ============================================================
// GraphQL → TypeScript
// ============================================================

/**
 * Convert GraphQL schema to TypeScript types
 */
export function graphqlToTypescript(input: string): string {
  try {
    const types = parseGraphqlTypes(input);
    const lines: string[] = ['// Auto-generated from GraphQL schema', ''];

    for (const t of types) {
      if (t.kind === 'enum') {
        lines.push(`export enum ${t.name} {`);
        for (const v of t.values) {
          lines.push(`  ${v} = '${v}',`);
        }
        lines.push('}');
        lines.push('');
        continue;
      }

      if (t.kind === 'scalar') {
        lines.push(`export type ${t.name} = string;`);
        lines.push('');
        continue;
      }

      if (t.kind === 'input') {
        lines.push(`export interface ${t.name} {`);
        for (const f of t.fields) {
          const opt = f.nonNull ? '' : '?';
          lines.push(`  ${f.name}${opt}: ${graphqlTypeToTs(f.type)};`);
        }
        lines.push('}');
        lines.push('');
        continue;
      }

      // Regular type
      lines.push(`export interface ${t.name} {`);
      for (const f of t.fields) {
        const opt = f.nonNull ? '' : '?';
        const argsComment =
          f.args.length > 0
            ? ` // args: (${f.args.map((a) => `${a.name}: ${graphqlTypeToTs(a.type)}`).join(', ')})`
            : '';
        lines.push(`  ${f.name}${opt}: ${graphqlTypeToTs(f.type)};${argsComment}`);
      }
      lines.push('}');
      lines.push('');
    }

    return lines.join('\n').trim();
  } catch (e) {
    return `// Error: ${(e as Error).message}`;
  }
}

// ============================================================
// GraphQL Parser (shared)
// ============================================================

interface GqlField {
  name: string;
  type: string;
  nonNull: boolean;
  args: { name: string; type: string; nonNull: boolean }[];
}

interface GqlType {
  kind: 'type' | 'enum' | 'input' | 'scalar';
  name: string;
  fields: GqlField[];
  values: string[];
}

function parseGraphqlTypes(schema: string): GqlType[] {
  const types: GqlType[] = [];
  // Remove comments
  const clean = schema.replace(/#[^\n]*/g, '').replace(/"""[\s\S]*?"""/g, '');

  // Match type/input definitions
  const typeRegex = /(?:type|input)\s+(\w+)(?:\s+implements\s+[^{]+)?\s*\{([^}]+)\}/g;
  let match;
  while ((match = typeRegex.exec(clean)) !== null) {
    const kind = clean.substring(match.index).startsWith('input') ? 'input' : 'type';
    const name = match[1]!;
    const body = match[2]!;
    const fields = parseGraphqlFields(body);
    types.push({ kind, name, fields, values: [] });
  }

  // Match enums
  const enumRegex = /enum\s+(\w+)\s*\{([^}]+)\}/g;
  while ((match = enumRegex.exec(clean)) !== null) {
    const values = match[2]!
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    types.push({ kind: 'enum', name: match[1]!, fields: [], values });
  }

  // Match scalars
  const scalarRegex = /scalar\s+(\w+)/g;
  while ((match = scalarRegex.exec(clean)) !== null) {
    types.push({ kind: 'scalar', name: match[1]!, fields: [], values: [] });
  }

  return types;
}

function parseGraphqlFields(body: string): GqlField[] {
  const fields: GqlField[] = [];
  const lines = body.split('\n').map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    const fieldMatch = line.match(/^(\w+)(?:\(([^)]*)\))?\s*:\s*(.+?)$/);
    if (!fieldMatch) continue;
    const name = fieldMatch[1]!;
    const argsStr = fieldMatch[2] || '';
    const rawType = fieldMatch[3]!.trim();

    const nonNull = rawType.endsWith('!');
    const type = rawType.replace(/!$/g, '').trim();

    const args: { name: string; type: string; nonNull: boolean }[] = [];
    if (argsStr) {
      const argParts = argsStr.split(',');
      for (const part of argParts) {
        const argMatch = part.trim().match(/(\w+)\s*:\s*(.+)/);
        if (argMatch) {
          const argType = argMatch[2]!.trim();
          args.push({
            name: argMatch[1]!,
            type: argType.replace(/!$/g, '').trim(),
            nonNull: argType.endsWith('!'),
          });
        }
      }
    }

    fields.push({ name, type, nonNull, args });
  }

  return fields;
}

function graphqlTypeToTs(type: string): string {
  if (type.startsWith('[') && type.endsWith(']')) {
    const inner = type.slice(1, -1).replace(/!$/g, '');
    return `${graphqlTypeToTs(inner)}[]`;
  }
  switch (type) {
    case 'String':
    case 'ID':
      return 'string';
    case 'Int':
    case 'Float':
      return 'number';
    case 'Boolean':
      return 'boolean';
    case 'DateTime':
      return 'string';
    default:
      return type;
  }
}

function graphqlTypeToJsonSchema(type: string): Record<string, unknown> {
  if (type.startsWith('[') && type.endsWith(']')) {
    const inner = type.slice(1, -1).replace(/!$/g, '');
    return { type: 'array', items: graphqlTypeToJsonSchema(inner) };
  }
  switch (type) {
    case 'String':
    case 'ID':
      return { type: 'string' };
    case 'Int':
      return { type: 'integer' };
    case 'Float':
      return { type: 'number' };
    case 'Boolean':
      return { type: 'boolean' };
    case 'DateTime':
      return { type: 'string', format: 'date-time' };
    default:
      return { $ref: `#/components/schemas/${type}` };
  }
}

// ============================================================
// Helm Values → Kubernetes YAML
// ============================================================

/**
 * Render Helm-style Go template with values.
 * Input: JSON with { template: string, values: object }
 * Or: plain YAML template with {{ .Values.x }} (uses defaults)
 */
export function helmToKubernetes(input: string): string {
  try {
    let template: string;
    let values: Record<string, unknown>;

    // Try JSON input with template + values
    try {
      const parsed = JSON.parse(input);
      template = parsed.template as string;
      values = (parsed.values || {}) as Record<string, unknown>;
    } catch {
      // Plain YAML template — no values, use defaults
      template = input;
      values = {};
    }

    if (!template) {
      return '# Error: No template provided. Pass JSON: { "template": "...", "values": {...} }';
    }

    let result = template;

    // Replace {{ .Values.x.y }} patterns with nested value lookup
    result = result.replace(/\{\{\s*\.Values\.([\w.]+)\s*\}\}/g, (_m, path: string) => {
      const val = getNestedValue(values, path);
      return val !== undefined ? String(val) : `<.Values.${path}>`;
    });

    // Replace {{ .Release.Name }} patterns
    result = result.replace(/\{\{\s*\.Release\.Name\s*\}\}/g, values.releaseName as string || 'RELEASE-NAME');
    result = result.replace(/\{\{\s*\.Release\.Namespace\s*\}\}/g, values.namespace as string || 'default');
    result = result.replace(/\{\{\s*\.Chart\.Name\s*\}\}/g, values.chartName as string || 'chart');
    result = result.replace(/\{\{\s*\.Chart\.Version\s*\}\}/g, values.chartVersion as string || '0.1.0');

    // Handle {{ if .Values.x }} ... {{ end }} (basic conditional)
    result = result.replace(
      /\{\{-?\s*if\s+\.Values\.([\w.]+)\s*-?\}\}([\s\S]*?)\{\{-?\s*end\s*-?\}\}/g,
      (_m, path: string, content: string) => {
        const val = getNestedValue(values, path);
        return val ? content : '';
      },
    );

    // Handle {{ range .Values.x }} ... {{ end }} (basic iteration)
    result = result.replace(
      /\{\{-?\s*range\s+\.Values\.([\w.]+)\s*-?\}\}([\s\S]*?)\{\{-?\s*end\s*-?\}\}/g,
      (_m, path: string, content: string) => {
        const val = getNestedValue(values, path);
        if (!Array.isArray(val)) return '';
        return val.map((item) => {
          let line = content;
          line = line.replace(/\{\{\s*\.\s*\}\}/g, String(item));
          if (typeof item === 'object' && item !== null) {
            for (const [k, v] of Object.entries(item)) {
              line = line.replace(new RegExp(`\\{\\{\\s*\\.${k}\\s*\\}\\}`, 'g'), String(v));
            }
          }
          return line;
        }).join('');
      },
    );

    // Replace {{ default "val" .Values.x }}
    result = result.replace(
      /\{\{\s*default\s+"([^"]*)"\s+\.Values\.([\w.]+)\s*\}\}/g,
      (_m, def: string, path: string) => {
        const val = getNestedValue(values, path);
        return val !== undefined ? String(val) : def;
      },
    );

    // Clean up remaining template artifacts like {{- and -}}
    result = result.replace(/\{\{-?\s*\/\*[\s\S]*?\*\/\s*-?\}\}/g, ''); // Remove comments
    result = result.replace(/\n{3,}/g, '\n\n');

    return result.trim();
  } catch (e) {
    return `# Error: ${(e as Error).message}`;
  }
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

// ============================================================
// Terraform → CloudFormation
// ============================================================

/**
 * Convert Terraform HCL to AWS CloudFormation JSON
 */
export function terraformToCloudformation(input: string): string {
  try {
    const resources = parseTerraformResources(input);

    if (resources.length === 0) {
      return JSON.stringify({ error: 'No resource blocks found in input' });
    }

    const cfResources: Record<string, unknown> = {};

    for (const res of resources) {
      const cfType = terraformToCfResourceType(res.type);
      const logicalId = capitalize2(res.name.replace(/[-_.]/g, ''));

      cfResources[logicalId] = {
        Type: cfType,
        Properties: terraformPropsToCf(res.props),
      };
    }

    const template = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'Converted from Terraform',
      Resources: cfResources,
    };

    return JSON.stringify(template, null, 2);
  } catch (e) {
    return JSON.stringify({ error: `Terraform parse error: ${(e as Error).message}` });
  }
}

// ============================================================
// Terraform → Pulumi TypeScript
// ============================================================

/**
 * Convert Terraform HCL to Pulumi TypeScript
 */
export function terraformToPulumi(input: string): string {
  try {
    const resources = parseTerraformResources(input);

    if (resources.length === 0) {
      return '// No resource blocks found in input';
    }

    const lines: string[] = [
      'import * as pulumi from "@pulumi/pulumi";',
      'import * as aws from "@pulumi/aws";',
      '',
    ];

    // Extract variables
    const variables = parseTerraformVariables(input);
    if (variables.length > 0) {
      lines.push('// Configuration');
      lines.push('const config = new pulumi.Config();');
      for (const v of variables) {
        const getter = v.default !== undefined ? 'get' : 'require';
        const defaultStr = v.default !== undefined ? `, "${v.default}"` : '';
        lines.push(`const ${camelCase(v.name)} = config.${getter}("${v.name}"${defaultStr});`);
      }
      lines.push('');
    }

    for (const res of resources) {
      const [provider, service, ...rest] = res.type.split('_');
      const pulumiClass = [service, ...rest].map(capitalize2).join('');
      const pulumiProvider = provider || 'aws';
      const varName = camelCase(res.name);

      lines.push(`const ${varName} = new ${pulumiProvider}.${(service || '').toLowerCase()}.${pulumiClass}("${res.name}", {`);

      for (const [key, value] of Object.entries(res.props)) {
        const pulumiKey = camelCase(key);
        lines.push(`  ${pulumiKey}: ${terraformValueToPulumi(value)},`);
      }

      lines.push('});');
      lines.push('');
    }

    // Generate exports from outputs
    const outputs = parseTerraformOutputs(input);
    for (const out of outputs) {
      lines.push(`export const ${camelCase(out.name)} = ${out.value};`);
    }

    return lines.join('\n').trim();
  } catch (e) {
    return `// Error: ${(e as Error).message}`;
  }
}

// ============================================================
// Dart → JavaScript (simplified)
// ============================================================

/**
 * Transpile Dart code to JavaScript (simplified, covers common patterns)
 */
export function dartToJavascript(input: string): string {
  let js = input;

  // Remove type annotations from variables
  js = js.replace(/\b(final|var|const)\s+\w+\s+/g, (m) => {
    const keyword = m.trim().split(/\s+/)[0];
    return keyword === 'final' ? 'const ' : `${keyword} `;
  });
  // Remove explicit type annotations: `String x = ` → `let x = `
  js = js.replace(/\b(String|int|double|bool|num|List|Map|Set|dynamic|void)\s+(\w+)\s*=/g, 'let $2 =');
  js = js.replace(/\b(String|int|double|bool|num|List|Map|Set|dynamic|void)\s+(\w+)\s*\(/g, 'function $2(');

  // Convert print() → console.log()
  js = js.replace(/\bprint\s*\(/g, 'console.log(');

  // Convert string interpolation: $var and ${expr}
  js = js.replace(/'([^']*\$[^']+)'/g, (_m, content: string) => {
    const converted = content
      .replace(/\$\{([^}]+)\}/g, '${$1}')
      .replace(/\$(\w+)/g, '${$1}');
    return '`' + converted + '`';
  });

  // Convert ?? (null-aware) — same in JS
  // Convert ?. (null-safe member access) — same in JS
  // Convert ??= — same in JS

  // Convert Dart class syntax
  js = js.replace(/class\s+(\w+)\s+extends\s+(\w+)/g, 'class $1 extends $2');

  // Remove parameter type annotations in functions
  js = js.replace(/\(([^)]*)\)/g, (_m, params: string) => {
    const cleaned = params.split(',').map((p) => {
      const trimmed = p.trim();
      // Remove type prefix: "String name" → "name"
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 2) {
        const last = parts[parts.length - 1]!;
        // Check if first part looks like a type
        if (/^[A-Z]/.test(parts[0]!) || ['int', 'double', 'bool', 'num', 'String', 'dynamic', 'void', 'var'].includes(parts[0]!)) {
          return last;
        }
      }
      return trimmed;
    }).join(', ');
    return `(${cleaned})`;
  });

  // Convert arrow function syntax: => (same in both, but Dart uses it in class methods)
  // Convert late keyword
  js = js.replace(/\blate\s+/g, '');

  // Convert required keyword in named params
  js = js.replace(/\brequired\s+/g, '');

  // Convert Dart's main function
  js = js.replace(/void\s+main\s*\(\s*(?:List<String>\s+\w+)?\s*\)/g, 'function main()');

  // Convert async/await (same syntax, just remove Future<> return types)
  js = js.replace(/Future<\w+>/g, '');
  js = js.replace(/\basync\s*\*/g, 'async function*');

  // Remove @override annotation
  js = js.replace(/@override\s*/g, '');

  // Convert Dart list literal [...] (same in JS)
  // Convert Dart map literal {key: value} (same in JS)

  // Clean up multiple blank lines
  js = js.replace(/\n{3,}/g, '\n\n');

  return `// Transpiled from Dart (simplified)\n${js.trim()}`;
}

// ============================================================
// ReasonML → JavaScript (simplified)
// ============================================================

/**
 * Transpile ReasonML code to JavaScript (simplified, covers common patterns)
 */
export function reasonmlToJavascript(input: string): string {
  let js = input;

  // Convert let bindings: `let x = ...;` (mostly same in JS, but add `const`)
  js = js.replace(/\blet\s+(\w+)\s*(?::\s*\w+)?\s*=/g, 'const $1 =');

  // Convert module definitions
  js = js.replace(/module\s+(\w+)\s*=\s*\{/g, 'const $1 = {');

  // Convert type annotations after variable names
  js = js.replace(/:\s*(?:int|float|string|bool|unit|list\([^)]*\)|array\([^)]*\)|option\([^)]*\))\s*(?=[=;,)\]])/g, '');

  // Convert pattern matching: switch (x) { | pattern => expr }
  js = js.replace(/switch\s*\(([^)]+)\)\s*\{/g, '// switch on $1\nswitch ($1) {');
  js = js.replace(/\|\s*(\w+)\s*=>/g, 'case $1:');

  // Convert fun keyword to arrow function
  js = js.replace(/\bfun\s*\(([^)]*)\)\s*=>/g, '($1) =>');
  js = js.replace(/\bfun\s+(\w+)\s*=>/g, '($1) =>');

  // Convert Js.log → console.log
  js = js.replace(/Js\.log\s*\(/g, 'console.log(');
  js = js.replace(/Js\.log2\s*\(/g, 'console.log(');

  // Convert pipe operator: |>
  js = js.replace(/\|>/g, '// |> (pipe)');

  // Convert string concatenation: ++ → +
  js = js.replace(/\+\+/g, '+');

  // Convert list syntax: [1, 2, 3] (same) but [...rest] spread
  // Convert array syntax: [|1, 2, 3|] → [1, 2, 3]
  js = js.replace(/\[\|/g, '[');
  js = js.replace(/\|\]/g, ']');

  // Convert option types
  js = js.replace(/\bSome\s*\(([^)]+)\)/g, '$1');
  js = js.replace(/\bNone\b/g, 'null');

  // Convert type declarations
  js = js.replace(/^type\s+\w+\s*=\s*[^;]+;?\s*$/gm, '');

  // Convert ref: ref(x) → { current: x }
  js = js.replace(/ref\s*\(([^)]+)\)/g, '{ current: $1 }');

  // Remove semicolons at end of expressions that look like statements
  // (ReasonML uses ; as expression separator, JS uses them too, so mostly compatible)

  // Clean up multiple blank lines
  js = js.replace(/\n{3,}/g, '\n\n');

  return `// Transpiled from ReasonML (simplified)\n${js.trim()}`;
}

// ============================================================
// Terraform Parsing Helpers (shared)
// ============================================================

interface TerraformResource {
  type: string;
  name: string;
  props: Record<string, unknown>;
}

function parseTerraformResources(hcl: string): TerraformResource[] {
  const resources: TerraformResource[] = [];
  // Match resource "type" "name" { ... }
  const regex = /resource\s+"([^"]+)"\s+"([^"]+)"\s*\{/g;
  let match;

  while ((match = regex.exec(hcl)) !== null) {
    const type = match[1]!;
    const name = match[2]!;
    const start = match.index + match[0].length;
    const body = extractBlock(hcl, start);
    const props = parseHclBlock(body);
    resources.push({ type, name, props });
  }

  return resources;
}

function parseTerraformVariables(hcl: string): { name: string; default?: string }[] {
  const vars: { name: string; default?: string }[] = [];
  const regex = /variable\s+"([^"]+)"\s*\{/g;
  let match;

  while ((match = regex.exec(hcl)) !== null) {
    const name = match[1]!;
    const start = match.index + match[0].length;
    const body = extractBlock(hcl, start);
    const defaultMatch = body.match(/default\s*=\s*"?([^"\n}]+)"?/);
    vars.push({ name, default: defaultMatch?.[1]?.trim() });
  }

  return vars;
}

function parseTerraformOutputs(hcl: string): { name: string; value: string }[] {
  const outputs: { name: string; value: string }[] = [];
  const regex = /output\s+"([^"]+)"\s*\{/g;
  let match;

  while ((match = regex.exec(hcl)) !== null) {
    const name = match[1]!;
    const start = match.index + match[0].length;
    const body = extractBlock(hcl, start);
    const valueMatch = body.match(/value\s*=\s*(.+)/);
    if (valueMatch) {
      outputs.push({ name, value: valueMatch[1]!.trim() });
    }
  }

  return outputs;
}

function extractBlock(text: string, startAfterBrace: number): string {
  let depth = 1;
  let i = startAfterBrace;
  while (i < text.length && depth > 0) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') depth--;
    i++;
  }
  return text.substring(startAfterBrace, i - 1);
}

function parseHclBlock(block: string): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  const lines = block.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;

    // key = "value"
    const kvMatch = trimmed.match(/^(\w+)\s*=\s*"([^"]*)"/);
    if (kvMatch) {
      props[kvMatch[1]!] = kvMatch[2]!;
      continue;
    }

    // key = number
    const kvNum = trimmed.match(/^(\w+)\s*=\s*(\d+)/);
    if (kvNum) {
      props[kvNum[1]!] = parseInt(kvNum[2]!, 10);
      continue;
    }

    // key = true/false
    const kvBool = trimmed.match(/^(\w+)\s*=\s*(true|false)/);
    if (kvBool) {
      props[kvBool[1]!] = kvBool[2] === 'true';
      continue;
    }

    // key = [list]
    const kvList = trimmed.match(/^(\w+)\s*=\s*\[([^\]]*)\]/);
    if (kvList) {
      props[kvList[1]!] = kvList[2]!
        .split(',')
        .map((v) => v.trim().replace(/^"|"$/g, ''))
        .filter(Boolean);
      continue;
    }

    // key = var.x or resource references
    const kvRef = trimmed.match(/^(\w+)\s*=\s*(.+)/);
    if (kvRef) {
      props[kvRef[1]!] = kvRef[2]!.trim();
      continue;
    }
  }

  return props;
}

const TF_TO_CF_TYPES: Record<string, string> = {
  aws_instance: 'AWS::EC2::Instance',
  aws_s3_bucket: 'AWS::S3::Bucket',
  aws_security_group: 'AWS::EC2::SecurityGroup',
  aws_vpc: 'AWS::EC2::VPC',
  aws_subnet: 'AWS::EC2::Subnet',
  aws_internet_gateway: 'AWS::EC2::InternetGateway',
  aws_route_table: 'AWS::EC2::RouteTable',
  aws_iam_role: 'AWS::IAM::Role',
  aws_iam_policy: 'AWS::IAM::Policy',
  aws_lambda_function: 'AWS::Lambda::Function',
  aws_dynamodb_table: 'AWS::DynamoDB::Table',
  aws_sqs_queue: 'AWS::SQS::Queue',
  aws_sns_topic: 'AWS::SNS::Topic',
  aws_rds_instance: 'AWS::RDS::DBInstance',
  aws_ecs_cluster: 'AWS::ECS::Cluster',
  aws_ecs_service: 'AWS::ECS::Service',
  aws_cloudfront_distribution: 'AWS::CloudFront::Distribution',
  aws_route53_record: 'AWS::Route53::RecordSet',
  aws_elasticache_cluster: 'AWS::ElastiCache::CacheCluster',
  aws_lb: 'AWS::ElasticLoadBalancingV2::LoadBalancer',
  aws_lb_target_group: 'AWS::ElasticLoadBalancingV2::TargetGroup',
};

function terraformToCfResourceType(tfType: string): string {
  return TF_TO_CF_TYPES[tfType] || `AWS::${tfType.replace(/^aws_/, '').split('_').map(capitalize2).join('::')}`;
}

function terraformPropsToCf(props: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    result[capitalize2(key.replace(/_/g, ' ')).replace(/ /g, '')] = value;
  }
  return result;
}

function terraformValueToPulumi(value: unknown): string {
  if (typeof value === 'string') {
    // Check for variable references
    if (typeof value === 'string' && value.startsWith('var.')) {
      return camelCase(value.substring(4));
    }
    // Check for resource references
    if (typeof value === 'string' && value.match(/^[\w]+\.[\w]+\.[\w]+$/)) {
      const parts = value.split('.');
      return `${camelCase(parts[1]!)}.${camelCase(parts[2]!)}`;
    }
    return `"${value}"`;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => terraformValueToPulumi(v)).join(', ')}]`;
  }
  return JSON.stringify(value);
}

// ============================================================
// Utility Helpers
// ============================================================

function capitalize2(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function camelCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((part, i) => (i === 0 ? part.toLowerCase() : capitalize2(part.toLowerCase())))
    .join('');
}
