// Tool execution engine
import type { ToolMetadata, ToolExecutionResult, ToolExecutionContext } from './types';
import { getToolById } from './registry';
// Use shared data converters from the tool-execution package
import * as converters from '@hsafx/tool-execution/data-converters';
import * as validators from './validators';
import * as generators from './generators';
import * as calculators from './calculators';
import * as cssGenerators from './css-generators';
import * as seoGenerators from './seo-generators';
import * as shippingValidators from './shipping';
import * as specializedTools from './specialized';
import { executeTextTool } from './wasm-loader';

// Client-side tool execution
export async function executeClientTool(
  toolId: string,
  input: string,
  options?: Record<string, unknown>,
  context?: ToolExecutionContext
): Promise<ToolExecutionResult> {
  const startTime = performance.now();

  try {
    const tool = getToolById(toolId);
    if (!tool) {
      return { success: false, error: `Tool not found: ${toolId}` };
    }

    if (tool.execution === 'server') {
      return { success: false, error: 'This tool requires server-side execution' };
    }

    // SECURITY: Check tier access for client-side tools
    if (tool.tier === 'pro' && (!context || context.tier === 'guest' || context.tier === 'free')) {
      return { success: false, error: 'This tool requires a Pro subscription' };
    }

    if (tool.tier === 'advance' && (!context || context.tier !== 'advance')) {
      return { success: false, error: 'This tool requires an Advance subscription' };
    }

    // Check coin balance for paid tools
    if (tool.costType === 'coin' && tool.coinCost) {
      if (!context || context.coinsAvailable < tool.coinCost) {
        return { success: false, error: `Insufficient coins. Required: ${tool.coinCost}` };
      }
    }

    let output: string | Record<string, unknown>;

    // Route to appropriate handler based on category
    switch (tool.category) {
      case 'Text':
        output = await executeTextTool(toolId, input, options);
        break;

      case 'Data':
        output = await executeDataTool(toolId, input, options);
        break;

      case 'Generator':
        output = await executeGeneratorTool(toolId, input, options);
        break;

      case 'Calculator':
        output = executeCalculatorTool(toolId, input, options);
        break;

      case 'Converter':
        output = executeConverterTool(toolId, input, options);
        break;

      case 'Validator':
        output = executeValidatorTool(toolId, input, options);
        break;

      case 'Specialized':
        output = await executeSpecializedTool(toolId, input, options);
        break;

      case 'Media':
        // Only client-side media tools
        output = executeMediaTool(toolId, input, options);
        break;

      default:
        return { success: false, error: `Unknown tool category: ${tool.category}` };
    }

    const duration = performance.now() - startTime;

    return {
      success: true,
      output,
      duration,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: performance.now() - startTime,
    };
  }
}

// Data tools execution
async function executeDataTool(
  toolId: string,
  input: string,
  options?: Record<string, unknown>
): Promise<string | Record<string, unknown>> {
  // Helper to convert typed results to plain objects
  const toRecord = <T extends object>(obj: T): Record<string, unknown> =>
    JSON.parse(JSON.stringify(obj)) as Record<string, unknown>;

  switch (toolId) {
    // ====== Format Converters (192-220) ======
    case 'csv-to-json':
      return converters.csvToJson(input);
    case 'tsv-to-json':
      return converters.tsvToJson(input);
    case 'tsv-to-csv':
      return converters.tsvToCsv(input);
    case 'xml-to-json':
      return converters.xmlToJson(input);
    case 'yaml-to-json':
      return converters.yamlToJson(input);
    case 'toml-to-json':
      return converters.jsonToToml(input); // reverse - bidirectional tool
    case 'ini-to-json':
      return converters.iniToJson(input);
    case 'hocon-to-json':
      return converters.iniToJson(input); // Similar structure
    case 'properties-to-json':
      return converters.propertiesToJson(input);
    case 'ndjson-to-json':
      return converters.ndjsonToJson(input);
    case 'json-to-jsonl':
      return converters.jsonToNdjson(input);
    case 'json-to-url-params':
      return converters.jsonToUrlParams(input);
    case 'json-to-form-data':
      return converters.jsonToFormData(input);

    // Reverse converters (JSON to X)
    case 'json-to-yaml':
      return converters.jsonToYaml(input);
    case 'json-to-xml':
      return converters.jsonToXml(input);
    case 'json-to-csv':
      return converters.jsonToCsv(input);
    case 'json-to-toml':
      return converters.jsonToToml(input);
    case 'json-to-ini':
      return converters.jsonToIni(input);
    case 'json-to-properties':
      return converters.jsonToProperties(input);
    case 'json-to-tsv':
      return converters.jsonToTsv(input);
    case 'csv-to-tsv':
      return converters.csvToTsv(input);

    // Schema converters
    case 'json-schema-to-typescript':
      return converters.jsonSchemaToTypescript(input);
    case 'json-schema-to-zod':
      return converters.jsonSchemaToZod(input);
    case 'json-schema-to-joi':
      return converters.jsonSchemaToJoi(input);
    case 'json-schema-to-openapi':
      return converters.jsonSchemaToOpenapi(input);

    // Markdown converters
    case 'markdown-table-to-json':
      return converters.markdownTableToJson(input);
    case 'json-to-markdown-table':
      return converters.jsonToMarkdownTable(input);
    case 'markdown-to-html':
      return converters.markdownToHtml(input);

    // ====== Validators (221-236) ======
    case 'validate-json':
      return converters.validateJson(input);
    case 'validate-xml':
      return converters.validateXml(input);
    case 'validate-yaml':
      return converters.validateYaml(input);
    case 'validate-csv':
      return converters.validateCsv(input);
    case 'validate-json-schema':
      try {
        const { schema, data } = JSON.parse(input);
        // Basic schema validation
        const schemaObj = typeof schema === 'string' ? JSON.parse(schema) : schema;
        const dataObj = typeof data === 'string' ? JSON.parse(data) : data;
        return { valid: true, schema: schemaObj, data: dataObj };
      } catch (e) {
        return { valid: false, error: (e as Error).message };
      }
    case 'validate-openapi':
      try {
        const spec = JSON.parse(input);
        const hasOpenApi = spec.openapi || spec.swagger;
        return { valid: !!hasOpenApi, version: spec.openapi || spec.swagger };
      } catch (e) {
        return { valid: false, error: (e as Error).message };
      }
    case 'validate-graphql-schema':
      // Basic GraphQL validation
      const hasTypeDef = /type\s+\w+|query|mutation|subscription/i.test(input);
      return { valid: hasTypeDef };
    case 'validate-sql':
      // Basic SQL syntax check
      const sqlKeywords = /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\b/i;
      return { valid: sqlKeywords.test(input) };
    case 'validate-docker-compose':
      try {
        const compose = converters.yamlToJson(input);
        const parsed = JSON.parse(compose);
        return { valid: !!parsed.services || !!parsed.version };
      } catch (e) {
        return { valid: false, error: (e as Error).message };
      }
    case 'validate-kubernetes':
      try {
        const k8s = converters.yamlToJson(input);
        const parsed = JSON.parse(k8s);
        return { valid: !!parsed.apiVersion && !!parsed.kind };
      } catch (e) {
        return { valid: false, error: (e as Error).message };
      }
    case 'validate-terraform':
      // Basic HCL/Terraform validation
      const hasTerraform = /\b(resource|provider|variable|output|module|data)\s+"[^"]+"/i.test(input);
      return { valid: hasTerraform };
    case 'jsonpath-tester':
      const { json: jpJson, path: jpPath } = options ?? {};
      return JSON.parse(converters.testJsonPath(jpJson as string || input, jpPath as string || '$'));
    case 'xpath-tester':
      const { xpath } = options ?? {};
      return JSON.parse(converters.testXPath(input, xpath as string || '//'));
    case 'regex-tester':
      const { pattern, flags } = options ?? {};
      return JSON.parse(converters.testRegex(pattern as string || '', input, flags as string || 'g'));
    case 'cron-validator':
      return toRecord(validators.validateCronExpression(input));
    case 'semver-validator':
      return converters.parseSemver(input);

    // ====== Formatters (237-248) ======
    case 'format-json':
      return converters.formatJson(input, options?.indent as number);
    case 'format-xml':
      return converters.formatXml(input, options?.indent as number);
    case 'format-yaml':
      return converters.formatYaml(input);
    case 'format-sql':
      return converters.formatSql(input);
    case 'format-graphql':
      return converters.formatGraphql(input);
    case 'format-openapi':
      // Format OpenAPI as JSON
      return converters.formatJson(input);
    case 'format-markdown':
      return converters.formatMarkdown(input);
    case 'format-html':
      return converters.formatHtml(input, options?.indent as number);
    case 'format-code':
      // Generic code formatting - delegates to specific formatter
      return converters.formatJson(input);
    case 'minify-json':
      return converters.minifyJson(input);
    case 'line-ending-normalizer':
      return converters.normalizeLineEndings(input, options?.style as 'lf' | 'crlf' | 'cr');
    case 'indentation-converter':
      return converters.convertIndentation(
        input,
        options?.fromTabs as boolean ?? false,
        options?.toTabs as boolean ?? false,
        options?.spaces as number ?? 2
      );
    case 'key-sorter':
      return converters.sortKeys(input, options?.isYaml as boolean);

    // ====== Code Converters (249-264) ======
    case 'typescript-to-javascript':
      return converters.typescriptToJavascript(input);
    case 'scss-to-css':
      return converters.scssToCss(input);
    case 'less-to-css':
      return converters.lessToCss(input);
    case 'stylus-to-css':
      return converters.stylusToCss(input);
    case 'postcss-to-css':
      return converters.postcssToCss(input);
    case 'css-to-js-objects':
      return converters.cssToJsObjects(input);
    case 'css-variables-to-json':
      return converters.cssVariablesToJson(input);
    case 'tailwind-to-css':
      return cssGenerators.tailwindToCss(input);
    case 'coffeescript-to-javascript':
      // CoffeeScript is complex, provide basic transformation
      return input
        .replace(/->/g, '=>')
        .replace(/(\w+)\s*=\s*\(([^)]*)\)\s*=>/g, 'const $1 = ($2) =>')
        .replace(/#([^\n]*)/g, '//$1');
    case 'flow-to-typescript':
      // Flow to TypeScript - mostly compatible, some type name changes
      return input
        .replace(/\/\*\s*@flow\s*\*\//g, '')
        .replace(/\?(\w+)/g, '$1 | null')
        .replace(/\$Exact<([^>]+)>/g, '$1')
        .replace(/\$Keys<([^>]+)>/g, 'keyof $1');
    case 'kotlin-to-typescript':
      // Basic Kotlin data class to TypeScript interface
      return input
        .replace(/data\s+class\s+(\w+)\s*\(([^)]+)\)/g, (_, name, props) => {
          const tsProps = props.split(',').map((p: string) => {
            const match = p.trim().match(/(?:val|var)\s+(\w+):\s*(\w+)/);
            if (match && match[1] && match[2]) return `  ${match[1]}: ${match[2].toLowerCase()};`;
            return '';
          }).filter(Boolean).join('\n');
          return `interface ${name} {\n${tsProps}\n}`;
        });
    case 'swift-to-typescript':
      // Basic Swift struct to TypeScript interface
      return input
        .replace(/struct\s+(\w+)\s*:\s*Codable\s*\{([^}]+)\}/g, (_, name, props) => {
          const tsProps = props.split('\n').map((line: string) => {
            const match = line.trim().match(/(?:let|var)\s+(\w+):\s*(\w+)/);
            if (match && match[1] && match[2]) return `  ${match[1]}: ${match[2].toLowerCase()};`;
            return '';
          }).filter(Boolean).join('\n');
          return `interface ${name} {\n${tsProps}\n}`;
        });
    case 'java-to-typescript':
      // Basic Java POJO to TypeScript interface
      return input
        .replace(/public\s+class\s+(\w+)\s*\{([^}]+)\}/g, (_, name, body) => {
          const fields = body.match(/private\s+(\w+)\s+(\w+);/g) || [];
          const tsProps = fields.map((f: string) => {
            const match = f.match(/private\s+(\w+)\s+(\w+)/);
            if (match && match[1] && match[2]) return `  ${match[2]}: ${match[1].toLowerCase()};`;
            return '';
          }).filter(Boolean).join('\n');
          return `interface ${name} {\n${tsProps}\n}`;
        });
    case 'csharp-to-typescript':
      // Basic C# DTO to TypeScript interface
      return input
        .replace(/public\s+class\s+(\w+)\s*\{([^}]+)\}/g, (_, name, body) => {
          const props = body.match(/public\s+(\w+)\s+(\w+)\s*\{\s*get;\s*set;\s*\}/g) || [];
          const tsProps = props.map((p: string) => {
            const match = p.match(/public\s+(\w+)\s+(\w+)/);
            if (match && match[1] && match[2]) return `  ${match[2]}: ${match[1].toLowerCase()};`;
            return '';
          }).filter(Boolean).join('\n');
          return `interface ${name} {\n${tsProps}\n}`;
        });

    // ====== DevOps Converters (265-274) ======
    case 'dockerfile-lint':
      return converters.lintDockerfile(input);
    case 'docker-compose-to-kubernetes':
      // Convert Docker Compose to K8s manifest (basic)
      try {
        const compose = JSON.parse(converters.yamlToJson(input));
        const k8sManifests: unknown[] = [];

        for (const [name, service] of Object.entries(compose.services ?? {})) {
          const svc = service as Record<string, unknown>;
          k8sManifests.push({
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            metadata: { name },
            spec: {
              replicas: 1,
              selector: { matchLabels: { app: name } },
              template: {
                metadata: { labels: { app: name } },
                spec: {
                  containers: [{
                    name,
                    image: svc.image,
                    ports: Array.isArray(svc.ports)
                      ? svc.ports.map((p: string) => ({ containerPort: parseInt(String(p).split(':').pop() ?? '80') }))
                      : []
                  }]
                }
              }
            }
          });
        }

        return k8sManifests.map((m) => converters.jsonToYaml(JSON.stringify(m))).join('---\n');
      } catch {
        return '# Error converting Docker Compose to Kubernetes';
      }
    case 'env-to-json':
      return converters.envToJson(input);
    case 'env-to-yaml':
      return converters.envToYaml(input);
    case 'env-to-docker-compose':
      return converters.envToDockerCompose(input);
    case 'json-to-env':
      return converters.jsonToEnv(input);
    case 'sql-to-nosql':
      return converters.sqlToNoSql(input);
    case 'kubernetes-to-kustomize':
      return converters.kubernetesToKustomize(input);

    // ====== API Tools (275-290) ======
    case 'api-response-beautifier':
      return converters.formatJson(input);
    case 'api-response-to-mock':
      return converters.apiResponseToMock(input);
    case 'jwt-decoder':
      return converters.decodeJwt(input);
    case 'jwt-to-json':
      return converters.decodeJwt(input);
    case 'base64-to-json':
      return converters.base64ToJson(input);
    case 'json-to-base64':
      return converters.jsonToBase64(input);
    case 'url-to-curl':
      return converters.urlToCurl(input, options?.method as string);
    case 'curl-to-fetch':
      return converters.curlToFetch(input);
    case 'curl-to-httpie':
      return converters.curlToHttpie(input);
    case 'http-headers-to-json':
      return converters.httpHeadersToJson(input);
    case 'json-diff':
      const { json1, json2 } = options ?? {};
      return converters.jsonDiff(json1 as string || input, json2 as string || '{}');
    case 'schema-diff':
      const { schema1, schema2 } = options ?? {};
      return converters.schemaDiff(schema1 as string || input, schema2 as string || '{}');
    case 'openapi-diff':
      const { openapi1, openapi2 } = options ?? {};
      return converters.openapiDiff(openapi1 as string || input, openapi2 as string || '');
    case 'graphql-diff':
      const { graphql1, graphql2 } = options ?? {};
      return converters.graphqlSchemaDiff(graphql1 as string || input, graphql2 as string || '');
    case 'config-diff':
      const { config1, config2 } = options ?? {};
      return converters.configDiff(config1 as string || input, config2 as string || '');
    case 'line-diff':
      const { text1, text2 } = options ?? {};
      return converters.lineDiff(text1 as string || input, text2 as string || '');
    case 'ast-viewer':
      const { language: astLang } = options ?? {};
      return converters.viewAst(input, astLang as string || 'javascript');

    // ====== Binary Format Converters — server-side only ======
    // bson-to-json, messagepack-to-json, protobuf-to-json, avro-to-json, parquet-to-json
    // are execution: 'server' — routed via executeServerTool() → FastAPI.
    // No client-side handling needed here.

    // ====== Schema/API Converters (client-side) ======
    case 'avro-to-json-schema':
      return converters.avroToJsonSchema(input);
    case 'openapi2-to-openapi3':
      return converters.openapi2ToOpenapi3(input);
    case 'openapi-to-typescript':
      return converters.openapiToTypescript(input);
    case 'openapi-to-graphql':
      return converters.openapiToGraphql(input);
    case 'graphql-to-openapi':
      return converters.graphqlToOpenapi(input);
    case 'graphql-to-typescript':
      return converters.graphqlToTypescript(input);

    case 'sql-ddl-to-json-schema': {
      // Basic DDL → JSON Schema (regex-based, handles CREATE TABLE)
      const tables = input.match(/CREATE\s+TABLE\s+["`]?(\w+)["`]?\s*\(([\s\S]*?)\);/gi) || [];
      if (tables.length === 0) return '{ "error": "No CREATE TABLE statements found" }';
      const schemas = tables.map(t => {
        const nameMatch = t.match(/CREATE\s+TABLE\s+["`]?(\w+)/i);
        const name = nameMatch?.[1] ?? 'unknown';
        const colBlock = t.match(/\(([\s\S]*)\)/)?.[1] ?? '';
        const cols = colBlock.split(',').map(c => c.trim()).filter(c => c && !c.match(/^\s*(PRIMARY|FOREIGN|UNIQUE|INDEX|KEY|CONSTRAINT)/i));
        const properties: Record<string, object> = {};
        const required: string[] = [];
        for (const col of cols) {
          const m = col.match(/^["`]?(\w+)["`]?\s+(\w+)/);
          if (!m) continue;
          const [, colName, sqlType] = m;
          if (!colName || !sqlType) continue;
          const notNull = /NOT\s+NULL/i.test(col);
          let type = 'string';
          if (/INT|SERIAL|BIGINT|SMALLINT/i.test(sqlType)) type = 'integer';
          else if (/FLOAT|DOUBLE|DECIMAL|NUMERIC|REAL/i.test(sqlType)) type = 'number';
          else if (/BOOL/i.test(sqlType)) type = 'boolean';
          properties[colName] = { type };
          if (notNull) required.push(colName);
        }
        return { title: name, type: 'object', properties, required };
      });
      return JSON.stringify(schemas.length === 1 ? schemas[0] : schemas, null, 2);
    }

    // ====== Language Transpilers (client-side, simplified) ======
    case 'dart-to-javascript':
      return converters.dartToJavascript(input);
    case 'reasonml-to-javascript':
      return converters.reasonmlToJavascript(input);

    // ====== DevOps Converters (client-side) ======
    case 'helm-to-kubernetes':
      return converters.helmToKubernetes(input);
    case 'terraform-to-cloudformation':
      return converters.terraformToCloudformation(input);
    case 'terraform-to-pulumi':
      return converters.terraformToPulumi(input);

    // ====== Unicode/Encoding (291-297) ======
    case 'html-entity-encode':
      // direction: 'forward' = encode, 'reverse' = decode
      return options?.direction === 'reverse' ? converters.unescapeHtml(input) : converters.escapeHtml(input);
    case 'punycode-encode':
      // direction: 'forward' = encode, 'reverse' = decode
      return options?.direction === 'reverse' ? converters.punycodeDecode(input) : converters.punycodeEncode(input);
    case 'utf8-to-utf16':
      // direction: 'forward' = utf8 to utf16, 'reverse' = utf16 to utf8
      if (options?.direction === 'reverse') {
        // UTF-16 to UTF-8: parse input as UTF-16 bytes and convert
        return converters.utf16ToUtf8(input, options?.endianness as 'le' | 'be');
      }
      // UTF-8 to UTF-16
      return converters.utf8ToUtf16(input, options?.endianness as 'le' | 'be');
    case 'unicode-normalizer':
      return converters.unicodeNormalize(input, options?.form as 'NFC' | 'NFD' | 'NFKC' | 'NFKD');
    case 'unicode-code-point':
      return converters.unicodeCodePoints(input);
    case 'unicode-category-filter':
      // Filter by Unicode category - keep only letters
      const category = options?.category as string ?? 'L';
      if (category === 'L') return input.replace(/[^a-zA-Z\u00C0-\u024F]/g, '');
      if (category === 'N') return input.replace(/[^\d]/g, '');
      if (category === 'P') return input.replace(/[^.,!?;:'"()-]/g, '');
      return input;
    case 'text-direction-normalizer':
      // Remove RTL/LTR marks and normalize
      return input.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '');

    // ====== Original validators from old code ======
    case 'validate-email':
      return toRecord(validators.validateEmail(input));
    case 'validate-url':
      return toRecord(validators.validateUrl(input));
    case 'validate-uuid':
      return toRecord(validators.validateUuid(input));
    case 'validate-ip':
      return toRecord(validators.validateIpAddress(input));
    case 'validate-credit-card':
      return toRecord(validators.validateCreditCard(input));
    case 'validate-phone':
      return toRecord(validators.validatePhoneNumber(input));
    case 'validate-iban':
      return toRecord(validators.validateIban(input));
    case 'validate-isbn':
      return toRecord(validators.validateIsbn(input));
    case 'validate-hex-color':
      return toRecord(validators.validateHexColor(input));
    case 'validate-mac':
      return toRecord(validators.validateMacAddress(input));
    case 'validate-date':
      return toRecord(validators.validateDate(input, options?.format as string));
    case 'validate-time':
      return toRecord(validators.validateTime24h(input));
    case 'validate-slug':
      return toRecord(validators.validateSlug(input));
    case 'validate-base64':
      return toRecord(validators.validateBase64(input));
    case 'validate-jwt':
      return toRecord(validators.validateJwt(input));
    case 'validate-password':
      return toRecord(validators.validatePasswordStrength(input));

    // Shipping validators
    case 'container-validator':
      return toRecord(shippingValidators.validateContainerNumber(input));
    case 'bill-of-lading-validator':
      return toRecord(shippingValidators.validateBillOfLading(input));
    case 'booking-number-validator':
      return toRecord(shippingValidators.validateBookingNumber(input));
    case 'seal-number-validator':
      return toRecord(shippingValidators.validateSealNumber(input));

    // DB Schema  
    case 'db-schema-visualizer':
      return specializedTools.generateDbVisualization(input as unknown as Parameters<typeof specializedTools.generateDbVisualization>[0], options as unknown as Parameters<typeof specializedTools.generateDbVisualization>[1]);

    default:
      throw new Error(`Unknown data tool: ${toolId}`);
  }
}

// Generator tools execution
async function executeGeneratorTool(
  toolId: string,
  input: string,
  options?: Record<string, unknown>
): Promise<string> {
  // Parse input if it's JSON
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(input);
  } catch {
    // Input is plain text
  }

  // Merge options into data (options take precedence for form values)
  if (options) {
    data = { ...data, ...options };
  }

  switch (toolId) {
    // ====== ID Generators (380-391) ======
    case 'uuid-v1':
      return generators.generateUuidV1();
    case 'uuid-v4':
      return generators.generateUuidV4();
    case 'uuid-v5':
      return generators.generateUuidV5(data.name as string, data.namespace as string);
    case 'nanoid':
      return generators.generateNanoId(options?.size as number ?? data.size as number);
    case 'cuid':
      return generators.generateCuid();
    case 'ulid':
      return generators.generateUlid();
    case 'object-id':
      return generators.generateObjectId();

    // Password/Security Generators
    case 'password-generator':
      return generators.generatePassword(data as Parameters<typeof generators.generatePassword>[0]);
    case 'passphrase-generator':
      return generators.generatePassphrase(data.wordCount as number, data.separator as string);
    case 'hash-generator':
      return await generators.generateHash(input, (data.algorithm as 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512') ?? 'SHA-256');
    case 'api-key-generator':
      return generators.generateApiKey(data.prefix as string, data.length as number);
    case 'jwt-generator':
      return generators.generateJwt(data.payload as Record<string, unknown>, data.secret as string, data.expiresIn as string);

    // Text Generators
    case 'lorem-ipsum':
      return generators.generateLoremIpsum(data.paragraphs as number, data.sentences as number);
    case 'username-generator':
      return generators.generateUsername(data.style as string);
    case 'quote-generator':
      return generators.generateQuote();
    case 'random-number':
      return generators.generateRandomNumbers(data.min as number, data.max as number, data.count as number);

    // Visual Generators
    case 'qr-barcode':
      return generators.generateQrCode(input);
    case 'signature-generator':
      return generators.generateSignature(data.name as string, data.style as string);
    case 'color-palette':
      return JSON.stringify(generators.generateColorPalette(data.baseColor as string, data.count as number), null, 2);
    case 'color-palette-generator':
      return JSON.stringify(generators.generateColorPalette(data.baseColor as string, data.count as number), null, 2);
    case 'placeholder-image':
      return generators.generatePlaceholderImage(data.width as number, data.height as number, data.text as string);
    case 'vcard-qr-generator':
      return generators.generateVCardQr(data as unknown as Parameters<typeof generators.generateVCardQr>[0]);
    case 'favicon-generator':
      return generators.generateFaviconHtml(data.emoji as string ?? '⭐');

    // SEO Generators (392-399)
    case 'meta-tags-generator':
      return seoGenerators.generateMetaTags(data as unknown as Parameters<typeof seoGenerators.generateMetaTags>[0]);
    case 'og-meta-generator':
      return seoGenerators.generateMetaTags(data as unknown as Parameters<typeof seoGenerators.generateMetaTags>[0]);
    case 'sitemap-generator':
      return seoGenerators.generateSitemap(data.urls as Array<{ url: string; lastmod?: string; priority?: number }>);
    case 'robots-txt-generator':
      return seoGenerators.generateRobotsTxt(data.rules as Record<string, string[]>, data.sitemap as string);
    case 'htaccess-generator':
      return seoGenerators.generateHtaccess(data as unknown as Parameters<typeof seoGenerators.generateHtaccess>[0]);
    case 'canonical-url-generator':
      return seoGenerators.generateCanonicalTag(input);
    case 'seo-slug-generator':
      return seoGenerators.generateSeoSlug(input);

    // Schema Generators
    case 'schema-article':
      return seoGenerators.generateArticleSchema(data as unknown as Parameters<typeof seoGenerators.generateArticleSchema>[0]);
    case 'schema-product':
      return seoGenerators.generateProductSchema(data as unknown as Parameters<typeof seoGenerators.generateProductSchema>[0]);
    case 'schema-faq':
      return seoGenerators.generateFaqSchema(data as unknown as Parameters<typeof seoGenerators.generateFaqSchema>[0]);

    // CSS Generators (400-414)
    case 'gradient-generator': {
      // Build stops array from color1/color2 fields
      const stops = [
        { color: String(data.color1) || '#3498db', position: 0 },
        { color: String(data.color2) || '#2ecc71', position: 100 },
      ];
      const angle = Number(data.angle) || 90;
      const type = String(data.type) || 'linear';

      if (type === 'radial') {
        return `background: ${cssGenerators.generateRadialGradient(stops)};`;
      } else if (type === 'conic') {
        return `background: ${cssGenerators.generateConicGradient(stops, angle)};`;
      }
      return `background: ${cssGenerators.generateLinearGradient(stops, angle)};`;
    }
    case 'box-shadow-generator': {
      // Map form field names to function parameter names
      const shadowData = {
        offsetX: Number(data.offsetX) || 0,
        offsetY: Number(data.offsetY) || 0,
        blurRadius: Number(data.blur) || 0,  // Form uses 'blur', function expects 'blurRadius'
        spreadRadius: Number(data.spread) || 0, // Form uses 'spread', function expects 'spreadRadius'
        color: String(data.color) || 'rgba(0,0,0,0.3)',
        inset: Boolean(data.inset),
      };
      return `box-shadow: ${cssGenerators.generateBoxShadow([shadowData])};`;
    }
    case 'flexbox-generator':
      return JSON.stringify(cssGenerators.generateFlexContainer(data as Parameters<typeof cssGenerators.generateFlexContainer>[0]), null, 2);
    case 'grid-generator':
      return JSON.stringify(cssGenerators.generateGridContainer(data as Parameters<typeof cssGenerators.generateGridContainer>[0]), null, 2);
    case 'border-radius-generator':
      return cssGenerators.generateBorderRadius(data as Parameters<typeof cssGenerators.generateBorderRadius>[0]);
    case 'clip-path-generator':
      return cssGenerators.generateClipPath(data.shape as string, data.points as number[][]);
    case 'filter-generator':
      return cssGenerators.generateFilter(data as Parameters<typeof cssGenerators.generateFilter>[0]);
    case 'transform-animation-generator':
      return cssGenerators.generateKeyframes(data.name as string, Array.isArray(data.steps) ? data.steps as Parameters<typeof cssGenerators.generateKeyframes>[1] : []);
    case 'typography-generator':
      return cssGenerators.generateTypography(data as Parameters<typeof cssGenerators.generateTypography>[0]);
    case 'transform-generator':
      return cssGenerators.generateTransform(data as Parameters<typeof cssGenerators.generateTransform>[0]);
    case 'animation-generator':
      return cssGenerators.generateKeyframes(data.name as string, Array.isArray(data.steps) ? data.steps as Parameters<typeof cssGenerators.generateKeyframes>[1] : []);
    case 'tailwind-to-css':
      return JSON.stringify(cssGenerators.tailwindToCss(input), null, 2);

    // Date/Time Generators
    case 'timestamp-converter':
      if (typeof data.timestamp === 'number') {
        return JSON.stringify({
          timestamp: data.timestamp,
          iso: converters.timestampToDate(data.timestamp as number),
          date: new Date((data.timestamp as number) * 1000).toLocaleString()
        }, null, 2);
      } else {
        const ts = converters.dateToTimestamp(input);
        return JSON.stringify({
          timestamp: ts,
          iso: new Date(ts * 1000).toISOString(),
          date: new Date(ts * 1000).toLocaleString()
        }, null, 2);
      }

    // Password Analyzer
    case 'password-strength':
      return JSON.stringify(validators.validatePasswordStrength(input), null, 2);

    // Emoji Picker
    case 'emoji-picker':
      return JSON.stringify(generators.searchEmoji(input), null, 2);

    // Specialized generators
    case 'container-generator':
      return JSON.stringify(shippingValidators.generateContainerNumber(data.ownerCode as string, data.categoryCode as string), null, 2);

    case 'cheque-generator':
      return JSON.stringify(specializedTools.generateCheque(
        data.payeeName as string || 'Payee',
        (data.amount as number) || 0,
        (data.date as string) || new Date().toISOString().split('T')[0] || '',
        {
          memo: data.memo as string | undefined,
          bankName: data.bankName as string | undefined,
          accountNumber: data.accountNumber as string | undefined,
          chequeNumber: data.chequeNumber as string | undefined,
        }
      ), null, 2);

    case 'file-tree-generator':
      return specializedTools.generateFileTree(data as unknown as Parameters<typeof specializedTools.generateFileTree>[0], options as Parameters<typeof specializedTools.generateFileTree>[1]);

    default:
      throw new Error(`Unknown generator tool: ${toolId}`);
  }
}

// Calculator tools execution
function executeCalculatorTool(
  toolId: string,
  input: string,
  _options?: Record<string, unknown>
): Record<string, unknown> {
  const data = JSON.parse(input);

  switch (toolId) {
    case 'gpa-calculator':
      return calculators.calculateGpa(data.grades);

    case 'zakat-calculator':
      return calculators.calculateZakat(data);

    case 'inheritance-calculator':
      return calculators.calculateIslamicInheritance(data);

    case 'bmi-calculator':
      return calculators.calculateBmi(data.weight, data.height);

    case 'age-calculator':
      return calculators.calculateAge(new Date(data.birthDate));

    case 'date-diff':
      return calculators.calculateDateDifference(new Date(data.date1), new Date(data.date2));


    case 'percentage-calculator': {
      const val = Number(data.value);
      const pct = Number(data.percentage);

      if (data.operation === 'of') {
        // X% of Y: (percentage/100) * value
        return { result: (pct / 100) * val };
      } else if (data.operation === 'is') {
        // X is what % of Y: (value / percentage) * 100
        return { result: (val / pct) * 100 };
      } else if (data.operation === 'change') {
        // % change from X to Y: ((percentage - value) / value) * 100
        return { result: ((pct - val) / val) * 100 };
      } else if (data.operation === 'increase') {
        // Increase X by Y%: value * (1 + percentage/100)
        return { result: val * (1 + pct / 100) };
      } else if (data.operation === 'decrease') {
        // Decrease X by Y%: value * (1 - percentage/100)
        return { result: val * (1 - pct / 100) };
      }
      throw new Error('Invalid percentage operation');
    }

    case 'expression-evaluator':
      return { result: calculators.evaluateExpression(input) };

    default:
      throw new Error(`Unknown calculator tool: ${toolId}`);
  }
}

// Converter tools execution
function executeConverterTool(
  toolId: string,
  input: string,
  _options?: Record<string, unknown>
): string | Record<string, unknown> {
  const data = JSON.parse(input);

  switch (toolId) {
    case 'length-converter':
      return { result: calculators.convertUnit(data.value, data.from, data.to, 'length') };

    case 'weight-converter':
      return { result: calculators.convertUnit(data.value, data.from, data.to, 'weight') };

    case 'temperature-converter':
      return { result: calculators.convertUnit(data.value, data.from, data.to, 'temperature') };

    case 'volume-converter':
      return { result: calculators.convertUnit(data.value, data.from, data.to, 'volume') };

    case 'area-converter':
      return { result: calculators.convertUnit(data.value, data.from, data.to, 'area') };

    case 'speed-converter':
      return { result: calculators.convertUnit(data.value, data.from, data.to, 'speed') };

    case 'data-converter':
      return { result: calculators.convertUnit(data.value, data.from, data.to, 'data') };

    case 'time-converter':
      return { result: calculators.convertUnit(data.value, data.from, data.to, 'time') };

    case 'pressure-converter':
      return { result: calculators.convertUnit(data.value, data.from, data.to, 'pressure') };

    case 'energy-converter':
      return { result: calculators.convertUnit(data.value, data.from, data.to, 'energy') };

    case 'power-converter':
      return { result: calculators.convertUnit(data.value, data.from, data.to, 'power') };

    case 'frequency-converter':
      return { result: calculators.convertUnit(data.value, data.from, data.to, 'frequency') };

    case 'data-storage-converter':
      return { result: calculators.convertUnit(data.value, data.from, data.to, 'dataStorage') };

    case 'electric-converter':
      return { result: calculators.convertUnit(data.value, data.from, data.to, 'electric') };

    case 'angle-converter':
      return { result: calculators.convertUnit(data.value, data.from, data.to, 'angle') };

    case 'force-converter':
      return { result: calculators.convertUnit(data.value, data.from, data.to, 'force') };

    case 'torque-converter':
      return { result: calculators.convertUnit(data.value, data.from, data.to, 'torque') };

    case 'fuel-consumption-converter':
      return { result: calculators.convertUnit(data.value, data.from, data.to, 'fuelConsumption') };

    case 'radiation-converter':
      return { result: calculators.convertUnit(data.value, data.from, data.to, 'radiation') };

    case 'density-converter':
      return { result: calculators.convertUnit(data.value, data.from, data.to, 'density') };

    case 'illumination-converter':
      return { result: calculators.convertUnit(data.value, data.from, data.to, 'illumination') };

    case 'magnetic-converter':
      return { result: calculators.convertUnit(data.value, data.from, data.to, 'magnetic') };

    case 'cooking-converter':
      return { result: calculators.convertUnit(data.value, data.from, data.to, 'cooking') };

    case 'paper-size-converter':
      return { result: calculators.convertUnit(data.value, data.from, data.to, 'paperSize') };

    case 'color-converter':
      if (data.format === 'rgb') {
        return { result: converters.hexToRgb(input) };
      } else if (data.format === 'hsl') {
        return { result: converters.hexToHsl(input) };
      }
      return { result: converters.rgbToHex(data.r, data.g, data.b) };

    case 'base-converter':
      return converters.convertBase(data.value, data.from, data.to);

    case 'timezone-converter':
      return { result: converters.timestampToDate(data.timestamp) };

    case 'jwt-decoder':
      return JSON.parse(converters.decodeJwt(input));

    case 'url-parser':
      return JSON.parse(converters.parseUrl(input));

    case 'cron-parser':
      return JSON.parse(converters.parseCronExpression(input));

    default:
      throw new Error(`Unknown converter tool: ${toolId}`);
  }
}

// Validator tools execution
function executeValidatorTool(
  toolId: string,
  input: string,
  _options?: Record<string, unknown>
): Record<string, unknown> {
  // Helper to convert typed results to plain objects
  const toRecord = <T extends object>(obj: T): Record<string, unknown> =>
    JSON.parse(JSON.stringify(obj)) as Record<string, unknown>;

  switch (toolId) {
    // Standard validators
    case 'validate-email':
      return toRecord(validators.validateEmail(input));
    case 'validate-url':
      return toRecord(validators.validateUrl(input));
    case 'validate-uuid':
      return toRecord(validators.validateUuid(input));
    case 'validate-ip':
      return toRecord(validators.validateIpAddress(input));
    case 'validate-credit-card':
      return toRecord(validators.validateCreditCard(input));
    case 'validate-phone':
      return toRecord(validators.validatePhoneNumber(input));
    case 'validate-iban':
      return toRecord(validators.validateIban(input));
    case 'validate-isbn':
      return toRecord(validators.validateIsbn(input));

    // Shipping validators
    case 'container-validator':
      return toRecord(shippingValidators.validateContainerNumber(input));
    case 'bill-of-lading-validator':
      return toRecord(shippingValidators.validateBillOfLading(input));
    case 'booking-number-validator':
      return toRecord(shippingValidators.validateBookingNumber(input));
    case 'seal-number-validator':
      return toRecord(shippingValidators.validateSealNumber(input));

    default:
      throw new Error(`Unknown validator tool: ${toolId}`);
  }
}

// Media tools execution (client-side only)
function executeMediaTool(
  toolId: string,
  input: string,
  _options?: Record<string, unknown>
): string {
  switch (toolId) {
    case 'markdown-to-html':
      return converters.markdownToHtml(input);

    case 'image-to-base64':
      // For files, this is handled differently (input is already base64 or data URL)
      const extracted = converters.imageToBase64FromDataUrl(input);
      return JSON.stringify(extracted, null, 2);

    default:
      throw new Error(`Unknown media tool: ${toolId}. Most media tools require server execution.`);
  }
}

// Specialized tools execution
async function executeSpecializedTool(
  toolId: string,
  input: string,
  options?: Record<string, unknown>
): Promise<string> {
  switch (toolId) {
    case 'db-schema-visualizer':
      // Parse input as Schema object, convert to desired format
      const schemaData = JSON.parse(input) as Parameters<typeof specializedTools.generateDbVisualization>[0];
      return specializedTools.generateDbVisualization(schemaData, (options?.format as 'dbml' | 'mermaid' | 'plantuml' | 'markdown' | 'sql' | 'json') || 'mermaid');

    case 'file-tree-generator':
      return specializedTools.generateFileTree(
        input as unknown as Parameters<typeof specializedTools.generateFileTree>[0],
        options as Parameters<typeof specializedTools.generateFileTree>[1]
      );

    case 'cheque-generator':
      const chequeData = JSON.parse(input);
      return JSON.stringify(
        specializedTools.generateCheque(
          chequeData.payeeName as string || 'Payee',
          (chequeData.amount as number) || 0,
          (chequeData.date as string) || new Date().toISOString().split('T')[0] || '',
          {
            memo: chequeData.memo as string | undefined,
            bankName: chequeData.bankName as string | undefined,
            accountNumber: chequeData.accountNumber as string | undefined,
            chequeNumber: chequeData.chequeNumber as string | undefined,
          }
        ), null, 2
      );

    default:
      throw new Error(`Unknown specialized tool: ${toolId}`);
  }
}

// Server-side tool execution (calls FastAPI backend)
export async function executeServerTool(
  toolId: string,
  input: File | File[],
  options?: Record<string, unknown>,
  context?: ToolExecutionContext
): Promise<ToolExecutionResult> {
  const tool = getToolById(toolId);
  if (!tool) {
    return { success: false, error: `Tool not found: ${toolId}` };
  }

  if (tool.execution !== 'server') {
    return { success: false, error: 'This tool does not require server execution' };
  }

  // Check tier access
  if (tool.tier === 'pro' && (!context || context.tier === 'guest' || context.tier === 'free')) {
    return { success: false, error: 'This tool requires a Pro subscription' };
  }

  // Check coin balance for paid tools
  if (tool.costType === 'coin' && tool.coinCost) {
    if (!context || context.coinsAvailable < tool.coinCost) {
      return { success: false, error: `Insufficient coins. Required: ${tool.coinCost}` };
    }
  }

  try {
    const formData = new FormData();

    if (Array.isArray(input)) {
      input.forEach((file, index) => {
        formData.append(`files`, file);
      });
    } else {
      formData.append('file', input);
    }

    if (options) {
      formData.append('options', JSON.stringify(options));
    }

    const baseUrl = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';
    const response = await fetch(`${baseUrl}/api/tools/${toolId}`, {
      method: 'POST',
      body: formData,
      headers: context?.userId ? { 'X-User-Id': context.userId } : {},
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.detail || 'Server error' };
    }

    // Check content type for file vs JSON response
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      const result = await response.json();
      return {
        success: true,
        output: result.output,
        coinCost: tool.coinCost,
      };
    } else {
      // File download - convert to ArrayBuffer
      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();
      return {
        success: true,
        output: buffer,
        coinCost: tool.coinCost,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// Main execution router
export async function executeTool(
  toolId: string,
  input: string | File | File[],
  options?: Record<string, unknown>,
  context?: ToolExecutionContext
): Promise<ToolExecutionResult> {
  const tool = getToolById(toolId);
  if (!tool) {
    return { success: false, error: `Tool not found: ${toolId}` };
  }

  if (tool.execution === 'server') {
    return executeServerTool(toolId, input as File | File[], options, context);
  }

  return executeClientTool(toolId, input as string, options, context);
}
