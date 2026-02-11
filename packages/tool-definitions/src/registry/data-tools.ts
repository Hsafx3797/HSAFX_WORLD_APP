// Data Tools Registry - Converters, Validators, Formatters, Schema, Code, DevOps, API, Diff, Encoding
// Part of the distributed registry system
import type { ToolMetadata } from '../types';

export const dataToolsRegistry: ToolMetadata[] = [
  // =====================================================
  // DATA CONVERTERS (192-297)
  // =====================================================

  // Format Converters (192-220)
  {
    id: 'csv-to-json', name: 'CSV ⇄ JSON', description: 'Convert CSV to JSON', category: 'Data', subcategory: 'Converter', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'headerRow', type: 'select', label: 'Header Row', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], defaultValue: 'yes' },
      { name: 'delimiter', type: 'select', label: 'Delimiter', options: [{ value: ',', label: 'Comma (,)' }, { value: ';', label: 'Semicolon (;)' }, { value: '\t', label: 'Tab' }, { value: 'custom', label: 'Custom' }], defaultValue: ',' },
      { name: 'customDelimiter', type: 'string', label: 'Custom Delimiter', placeholder: 'Enter custom delimiter' },
      { name: 'quoteChar', type: 'select', label: 'Quote Character', options: [{ value: '"', label: 'Double Quote (")' }, { value: "'", label: "Single Quote (')" }, { value: 'none', label: 'None' }], defaultValue: '"' },
      { name: 'nullHandling', type: 'select', label: 'Null Handling', options: [{ value: 'null', label: 'Empty → null' }, { value: 'omit', label: 'Omit empty' }], defaultValue: 'null' },
      { name: 'typeInference', type: 'select', label: 'Type Inference', options: [{ value: 'on', label: 'On' }, { value: 'off', label: 'Off' }], defaultValue: 'on' }
    ]
  },
  {
    id: 'tsv-to-json', name: 'TSV ⇄ JSON', description: 'Convert TSV to JSON', category: 'Data', subcategory: 'Converter', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'headerRow', type: 'select', label: 'Header Row', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], defaultValue: 'yes' },
      { name: 'nullHandling', type: 'select', label: 'Null Handling', options: [{ value: 'null', label: 'Empty → null' }, { value: 'omit', label: 'Omit empty' }], defaultValue: 'null' },
      { name: 'typeInference', type: 'select', label: 'Type Inference', options: [{ value: 'on', label: 'On' }, { value: 'off', label: 'Off' }], defaultValue: 'on' }
    ]
  },
  {
    id: 'tsv-to-csv', name: 'TSV ⇄ CSV', description: 'Convert between TSV and CSV', category: 'Data', subcategory: 'Converter', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'targetDelimiter', type: 'select', label: 'Target Delimiter', options: [{ value: ',', label: 'Comma (,)' }, { value: ';', label: 'Semicolon (;)' }, { value: '|', label: 'Pipe (|)' }], defaultValue: ',' },
      { name: 'quoteChar', type: 'select', label: 'Quote Character', options: [{ value: '"', label: 'Double Quote (")' }, { value: "'", label: "Single Quote (')" }, { value: 'none', label: 'None' }], defaultValue: '"' }
    ]
  },
  {
    id: 'xml-to-json', name: 'XML ⇄ JSON', description: 'Convert XML to JSON', category: 'Data', subcategory: 'Converter', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'attributeHandling', type: 'select', label: 'Attribute Handling', options: [{ value: '@attr', label: '@attr prefix' }, { value: 'attr', label: 'No prefix' }], defaultValue: '@attr' },
      { name: 'textNodeKey', type: 'select', label: 'Text Node Key', options: [{ value: '#text', label: '#text' }, { value: 'value', label: 'value' }, { value: '_text', label: '_text' }], defaultValue: '#text' },
      { name: 'arrayDetection', type: 'select', label: 'Array Detection', options: [{ value: 'repeat', label: 'Repeat tags' }, { value: 'explicit', label: 'Explicit' }], defaultValue: 'repeat' },
      { name: 'namespaceHandling', type: 'select', label: 'Namespace Handling', options: [{ value: 'strip', label: 'Strip' }, { value: 'preserve', label: 'Preserve' }], defaultValue: 'strip' }
    ]
  },
  {
    id: 'yaml-to-json', name: 'YAML ⇄ JSON', description: 'Convert YAML to JSON', category: 'Data', subcategory: 'Converter', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'schemaMode', type: 'select', label: 'Schema Mode', options: [{ value: 'json', label: 'JSON Schema' }, { value: 'native', label: 'YAML native' }], defaultValue: 'json' },
      { name: 'anchorHandling', type: 'select', label: 'Anchor Handling', options: [{ value: 'resolve', label: 'Resolve' }, { value: 'preserve', label: 'Preserve' }], defaultValue: 'resolve' }
    ]
  },
  {
    id: 'toml-to-json', name: 'TOML ⇄ JSON', description: 'Convert TOML to JSON', category: 'Data', subcategory: 'Converter', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'datetimeFormat', type: 'select', label: 'Datetime Format', options: [{ value: 'iso', label: 'ISO 8601' }, { value: 'unix', label: 'Unix timestamp' }, { value: 'string', label: 'String' }], defaultValue: 'iso' },
      { name: 'inlineTables', type: 'select', label: 'Inline Tables', options: [{ value: 'expand', label: 'Expand' }, { value: 'preserve', label: 'Preserve' }], defaultValue: 'expand' }
    ]
  },
  {
    id: 'ini-to-json', name: 'INI ⇄ JSON', description: 'Convert INI to JSON', category: 'Data', subcategory: 'Converter', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'sectionStrategy', type: 'select', label: 'Section Strategy', options: [{ value: 'nested', label: 'Nested' }, { value: 'flat', label: 'Flat' }], defaultValue: 'nested' },
      { name: 'duplicateKeys', type: 'select', label: 'Duplicate Keys', options: [{ value: 'override', label: 'Override' }, { value: 'array', label: 'Array' }], defaultValue: 'override' }
    ]
  },
  {
    id: 'hocon-to-json', name: 'HOCON ⇄ JSON', description: 'Convert HOCON to JSON', category: 'Data', subcategory: 'Converter', tier: 'pro', costType: 'coin', coinCost: 1, execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'resolveSubstitutions', type: 'select', label: 'Resolve Substitutions', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], defaultValue: 'yes' },
      { name: 'includeHandling', type: 'select', label: 'Include Handling', options: [{ value: 'inline', label: 'Inline' }, { value: 'ignore', label: 'Ignore' }], defaultValue: 'inline' }
    ]
  },
  {
    id: 'properties-to-json', name: 'Properties ⇄ JSON', description: 'Convert Properties to JSON', category: 'Data', subcategory: 'Converter', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'dotNotationExpansion', type: 'select', label: 'Dot-notation Expansion', options: [{ value: 'yes', label: 'a.b.c → nested' }, { value: 'no', label: 'Keep flat' }], defaultValue: 'yes' },
      { name: 'encoding', type: 'select', label: 'Encoding', options: [{ value: 'utf8', label: 'UTF-8' }, { value: 'iso88591', label: 'ISO-8859-1' }], defaultValue: 'utf8' }
    ]
  },
  {
    id: 'bson-to-json', name: 'BSON ⇄ JSON', description: 'Convert BSON to JSON', category: 'Data', subcategory: 'Converter', tier: 'pro', costType: 'coin', coinCost: 1, execution: 'server', inputType: 'file', outputType: 'json',
    options: [
      { name: 'extendedJsonMode', type: 'select', label: 'Extended JSON Mode', options: [{ value: 'canonical', label: 'Canonical' }, { value: 'relaxed', label: 'Relaxed' }], defaultValue: 'relaxed' }
    ]
  },
  {
    id: 'messagepack-to-json', name: 'MessagePack ⇄ JSON', description: 'Convert MessagePack to JSON', category: 'Data', subcategory: 'Converter', tier: 'pro', costType: 'coin', coinCost: 1, execution: 'server', inputType: 'file', outputType: 'json',
    options: [
      { name: 'binaryHandling', type: 'select', label: 'Binary Handling', options: [{ value: 'base64', label: 'Base64' }, { value: 'omit', label: 'Omit' }], defaultValue: 'base64' },
      { name: 'timestampMode', type: 'select', label: 'Timestamp Mode', options: [{ value: 'iso', label: 'ISO 8601' }, { value: 'unix', label: 'Unix timestamp' }, { value: 'ms', label: 'Milliseconds' }], defaultValue: 'iso' }
    ]
  },
  {
    id: 'avro-to-json', name: 'Avro → JSON', description: 'Convert Avro to JSON preview', category: 'Data', subcategory: 'Converter', tier: 'pro', costType: 'coin', coinCost: 2, execution: 'server', inputType: 'file', outputType: 'json',
    options: [
      { name: 'schemaSource', type: 'select', label: 'Schema Source', options: [{ value: 'inline', label: 'Inline (embedded)' }, { value: 'upload', label: 'Upload schema' }, { value: 'registry', label: 'Schema Registry' }], defaultValue: 'inline' },
      { name: 'previewDepth', type: 'number', label: 'Preview Depth', min: 1, max: 100, defaultValue: 10, description: 'Number of records to preview' }
    ]
  },
  {
    id: 'parquet-to-json', name: 'Parquet ⇄ JSON', description: 'Convert Parquet to JSON', category: 'Data', subcategory: 'Converter', tier: 'pro', costType: 'coin', coinCost: 2, execution: 'server', inputType: 'file', outputType: 'json',
    options: [
      { name: 'tableProjection', type: 'select', label: 'Table Projection', options: [{ value: 'rows', label: 'Rows' }, { value: 'columns', label: 'Columns' }], defaultValue: 'rows' },
      { name: 'rowLimit', type: 'number', label: 'Row Limit', min: 1, max: 10000, defaultValue: 100, description: 'Maximum rows to convert' },
      { name: 'nestedStrategy', type: 'select', label: 'Nested Strategy', options: [{ value: 'flatten', label: 'Flatten' }, { value: 'preserve', label: 'Preserve' }], defaultValue: 'preserve' }
    ]
  },
  {
    id: 'ndjson-to-json', name: 'NDJSON ⇄ JSON Array', description: 'Convert NDJSON to JSON array', category: 'Data', subcategory: 'Converter', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'errorHandling', type: 'select', label: 'Error Handling', options: [{ value: 'skip', label: 'Skip invalid' }, { value: 'fail', label: 'Fail on error' }], defaultValue: 'skip' },
      { name: 'trailingNewline', type: 'select', label: 'Trailing Newline', options: [{ value: 'preserve', label: 'Preserve' }, { value: 'strip', label: 'Strip' }], defaultValue: 'strip' }
    ]
  },
  { id: 'json-to-jsonl', name: 'JSON ⇄ JSONL', description: 'Convert JSON to JSONL', category: 'Data', subcategory: 'Converter', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'text' },
  {
    id: 'json-to-url-params', name: 'JSON ⇄ URL Query Params', description: 'Convert JSON to URL params', category: 'Data', subcategory: 'Converter', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'text',
    options: [
      { name: 'arrayStrategy', type: 'select', label: 'Array Strategy', options: [{ value: 'repeat', label: 'Repeat (a=1&a=2)' }, { value: 'comma', label: 'Comma (a=1,2)' }, { value: 'bracket', label: 'Bracket (a[]=1&a[]=2)' }], defaultValue: 'bracket' },
      { name: 'nestedStrategy', type: 'select', label: 'Nested Strategy', options: [{ value: 'dot', label: 'Dot (a.b=1)' }, { value: 'bracket', label: 'Bracket (a[b]=1)' }], defaultValue: 'bracket' }
    ]
  },
  {
    id: 'json-to-form-data', name: 'JSON ⇄ Form-Data', description: 'Convert JSON to form data', category: 'Data', subcategory: 'Converter', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'text',
    options: [
      { name: 'fileFieldDetection', type: 'select', label: 'File Field Detection', options: [{ value: 'auto', label: 'Auto-detect' }, { value: 'manual', label: 'Manual' }], defaultValue: 'auto' },
      { name: 'boundaryMode', type: 'select', label: 'Boundary Mode', options: [{ value: 'auto', label: 'Auto-generate' }, { value: 'custom', label: 'Custom' }], defaultValue: 'auto' }
    ]
  },

  // Schema Converters
  {
    id: 'avro-to-json-schema', name: 'Avro → JSON Schema', description: 'Convert Avro to JSON Schema', category: 'Data', subcategory: 'Schema', tier: 'pro', costType: 'coin', coinCost: 2, execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'logicalTypeMapping', type: 'select', label: 'Logical Type Mapping', options: [{ value: 'strict', label: 'Strict (preserve)' }, { value: 'relaxed', label: 'Relaxed (convert)' }], defaultValue: 'relaxed' },
      { name: 'unionHandling', type: 'select', label: 'Union Handling', options: [{ value: 'oneOf', label: 'oneOf' }, { value: 'anyOf', label: 'anyOf' }], defaultValue: 'oneOf' }
    ]
  },
  {
    id: 'protobuf-to-json', name: 'Protobuf ⇄ JSON', description: 'Convert Protobuf to JSON', category: 'Data', subcategory: 'Schema', tier: 'pro', costType: 'coin', coinCost: 2, execution: 'server', inputType: 'file', outputType: 'json',
    options: [
      { name: 'descriptorSource', type: 'select', label: 'Descriptor Source', options: [{ value: 'inline', label: 'Inline' }, { value: 'upload', label: 'Upload .proto' }], defaultValue: 'inline' },
      { name: 'enumStyle', type: 'select', label: 'Enum Style', options: [{ value: 'string', label: 'String' }, { value: 'number', label: 'Number' }], defaultValue: 'string' }
    ]
  },
  {
    id: 'openapi2-to-openapi3', name: 'OpenAPI 2 → OpenAPI 3', description: 'Convert Swagger to OpenAPI 3', category: 'Data', subcategory: 'Schema', tier: 'pro', costType: 'coin', coinCost: 2, execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'securitySchemeMapping', type: 'select', label: 'Security Scheme Mapping', options: [{ value: 'auto', label: 'Auto-convert' }, { value: 'manual', label: 'Manual review' }], defaultValue: 'auto' },
      { name: 'refStrategy', type: 'select', label: 'Ref Strategy', options: [{ value: 'inline', label: 'Inline' }, { value: '$ref', label: '$ref' }], defaultValue: '$ref' }
    ]
  },
  {
    id: 'openapi-to-typescript', name: 'OpenAPI → TypeScript', description: 'Generate TypeScript from OpenAPI', category: 'Data', subcategory: 'Schema', tier: 'pro', costType: 'coin', coinCost: 3, execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'clientStyle', type: 'select', label: 'Client Style', options: [{ value: 'fetch', label: 'Fetch' }, { value: 'axios', label: 'Axios' }, { value: 'ky', label: 'Ky' }], defaultValue: 'fetch' },
      { name: 'nullabilityMode', type: 'select', label: 'Nullability Mode', options: [{ value: 'strict', label: 'Strict null checks' }, { value: 'optional', label: 'Optional (?)' }, { value: 'undefined', label: 'Undefined union' }], defaultValue: 'optional' },
      { name: 'readonlyModels', type: 'checkbox', label: 'Readonly Models', defaultValue: false }
    ]
  },
  {
    id: 'openapi-to-graphql', name: 'OpenAPI → GraphQL', description: 'Convert OpenAPI to GraphQL', category: 'Data', subcategory: 'Schema', tier: 'pro', costType: 'coin', coinCost: 3, execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'operationMappingStrategy', type: 'select', label: 'Operation Mapping', options: [{ value: 'query', label: 'GET → Query, POST → Mutation' }, { value: 'all-query', label: 'All → Query' }, { value: 'all-mutation', label: 'All → Mutation' }], defaultValue: 'query' },
      { name: 'paginationStyle', type: 'select', label: 'Pagination Style', options: [{ value: 'relay', label: 'Relay Connection' }, { value: 'offset', label: 'Offset/Limit' }, { value: 'cursor', label: 'Cursor' }], defaultValue: 'relay' }
    ]
  },
  {
    id: 'graphql-to-typescript', name: 'GraphQL → TypeScript', description: 'Generate TypeScript from GraphQL', category: 'Data', subcategory: 'Schema', tier: 'pro', costType: 'coin', coinCost: 3, execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'resolverSignatureStyle', type: 'select', label: 'Resolver Signature Style', options: [{ value: 'generic', label: 'Generic resolvers' }, { value: 'typed', label: 'Typed resolvers' }], defaultValue: 'typed' },
      { name: 'maybeType', type: 'select', label: 'Maybe Type', options: [{ value: 'T', label: 'T (no wrapper)' }, { value: 'T | null', label: 'T | null' }, { value: 'T | undefined', label: 'T | undefined' }], defaultValue: 'T | null' }
    ]
  },
  { id: 'graphql-to-openapi', name: 'GraphQL → OpenAPI', description: 'Convert GraphQL to OpenAPI', category: 'Data', subcategory: 'Schema', tier: 'pro', costType: 'coin', coinCost: 3, execution: 'client', inputType: 'text', outputType: 'text' },
  {
    id: 'json-schema-to-typescript', name: 'JSON Schema → TypeScript', description: 'Generate TypeScript from JSON Schema', category: 'Data', subcategory: 'Schema', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'text',
    options: [
      { name: 'strictnessLevel', type: 'select', label: 'Strictness Level', options: [{ value: 'strict', label: 'Strict' }, { value: 'moderate', label: 'Moderate' }, { value: 'loose', label: 'Loose' }], defaultValue: 'moderate' },
      { name: 'additionalPropertiesHandling', type: 'select', label: 'Additional Properties', options: [{ value: 'ignore', label: 'Ignore' }, { value: 'index', label: 'Index signature' }, { value: 'error', label: 'Error' }], defaultValue: 'index' }
    ]
  },
  {
    id: 'json-schema-to-zod', name: 'JSON Schema → Zod', description: 'Generate Zod from JSON Schema', category: 'Data', subcategory: 'Schema', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'text',
    options: [
      { name: 'validationStrictness', type: 'select', label: 'Validation Strictness', options: [{ value: 'strict', label: 'Strict' }, { value: 'passthrough', label: 'Passthrough' }, { value: 'strip', label: 'Strip unknown' }], defaultValue: 'strict' },
      { name: 'defaultValueInjection', type: 'checkbox', label: 'Inject Default Values', defaultValue: true }
    ]
  },
  {
    id: 'json-schema-to-joi', name: 'JSON Schema → Joi', description: 'Generate Joi from JSON Schema', category: 'Data', subcategory: 'Schema', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'text',
    options: [
      { name: 'validationStrictness', type: 'select', label: 'Validation Strictness', options: [{ value: 'strict', label: 'Strict' }, { value: 'allowUnknown', label: 'Allow unknown' }, { value: 'stripUnknown', label: 'Strip unknown' }], defaultValue: 'strict' },
      { name: 'defaultValueInjection', type: 'checkbox', label: 'Inject Default Values', defaultValue: true }
    ]
  },
  { id: 'json-schema-to-openapi', name: 'JSON Schema → OpenAPI', description: 'Convert JSON Schema to OpenAPI components', category: 'Data', subcategory: 'Schema', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'text' },
  {
    id: 'sql-ddl-to-json-schema', name: 'SQL DDL → JSON Schema', description: 'Convert SQL DDL to JSON Schema', category: 'Data', subcategory: 'Schema', tier: 'pro', costType: 'coin', coinCost: 2, execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'dialect', type: 'select', label: 'SQL Dialect', options: [{ value: 'mysql', label: 'MySQL' }, { value: 'postgresql', label: 'PostgreSQL' }, { value: 'sqlite', label: 'SQLite' }, { value: 'mssql', label: 'SQL Server' }], defaultValue: 'postgresql' },
      { name: 'relationshipHandling', type: 'select', label: 'Relationship Handling', options: [{ value: 'ignore', label: 'Ignore' }, { value: '$ref', label: '$ref' }], defaultValue: '$ref' }
    ]
  },

  // Validators (221-236)
  {
    id: 'validate-json', name: 'JSON Validator', description: 'Validate JSON syntax', category: 'Data', subcategory: 'Validator', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'strictMode', type: 'checkbox', label: 'Strict Mode', defaultValue: true },
      { name: 'allowComments', type: 'checkbox', label: 'Allow Comments', defaultValue: false },
      { name: 'allowTrailingComma', type: 'checkbox', label: 'Allow Trailing Comma', defaultValue: false }
    ]
  },
  {
    id: 'validate-xml', name: 'XML Validator', description: 'Validate XML syntax', category: 'Data', subcategory: 'Validator', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'validateDtd', type: 'checkbox', label: 'Validate DTD', defaultValue: false },
      { name: 'checkWellFormed', type: 'checkbox', label: 'Check Well-Formed', defaultValue: true }
    ]
  },
  {
    id: 'validate-yaml', name: 'YAML Validator', description: 'Validate YAML syntax', category: 'Data', subcategory: 'Validator', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'yamlVersion', type: 'select', label: 'YAML Version', options: [{ value: '1.1', label: 'YAML 1.1' }, { value: '1.2', label: 'YAML 1.2' }], defaultValue: '1.2' },
      { name: 'allowDuplicateKeys', type: 'checkbox', label: 'Allow Duplicate Keys', defaultValue: false }
    ]
  },
  {
    id: 'validate-csv', name: 'CSV Validator', description: 'Validate CSV format', category: 'Data', subcategory: 'Validator', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'delimiter', type: 'select', label: 'Delimiter', options: [{ value: ',', label: 'Comma (,)' }, { value: ';', label: 'Semicolon (;)' }, { value: '\t', label: 'Tab' }], defaultValue: ',' },
      { name: 'hasHeader', type: 'checkbox', label: 'Has Header Row', defaultValue: true },
      { name: 'strictColumnCount', type: 'checkbox', label: 'Strict Column Count', defaultValue: true }
    ]
  },
  {
    id: 'validate-json-schema', name: 'JSON Schema Validator', description: 'Validate against JSON Schema', category: 'Data', subcategory: 'Validator', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      { name: 'schemaVersion', type: 'select', label: 'Schema Version', options: [{ value: 'draft-07', label: 'Draft-07' }, { value: 'draft-06', label: 'Draft-06' }, { value: 'draft-04', label: 'Draft-04' }, { value: '2019-09', label: '2019-09' }, { value: '2020-12', label: '2020-12' }], defaultValue: 'draft-07' },
      { name: 'allErrors', type: 'checkbox', label: 'Report All Errors', defaultValue: true }
    ]
  },
  {
    id: 'validate-openapi', name: 'OpenAPI Validator', description: 'Validate OpenAPI spec', category: 'Data', subcategory: 'Validator', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'specVersion', type: 'select', label: 'Spec Version', options: [{ value: 'auto', label: 'Auto-detect' }, { value: '2.0', label: 'Swagger 2.0' }, { value: '3.0', label: 'OpenAPI 3.0' }, { value: '3.1', label: 'OpenAPI 3.1' }], defaultValue: 'auto' },
      { name: 'validateExamples', type: 'checkbox', label: 'Validate Examples', defaultValue: true }
    ]
  },
  {
    id: 'validate-graphql-schema', name: 'GraphQL Schema Validator', description: 'Validate GraphQL schema', category: 'Data', subcategory: 'Validator', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'checkDeprecations', type: 'checkbox', label: 'Check Deprecations', defaultValue: true }
    ]
  },
  {
    id: 'validate-sql', name: 'SQL Syntax Validator', description: 'Validate SQL syntax', category: 'Data', subcategory: 'Validator', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'dialect', type: 'select', label: 'SQL Dialect', options: [{ value: 'standard', label: 'Standard SQL' }, { value: 'mysql', label: 'MySQL' }, { value: 'postgresql', label: 'PostgreSQL' }, { value: 'tsql', label: 'T-SQL' }, { value: 'sqlite', label: 'SQLite' }], defaultValue: 'standard' }
    ]
  },
  {
    id: 'validate-docker-compose', name: 'Docker Compose Validator', description: 'Validate Docker Compose', category: 'Data', subcategory: 'Validator', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'composeVersion', type: 'select', label: 'Compose Version', options: [{ value: 'auto', label: 'Auto-detect' }, { value: '2', label: 'Version 2' }, { value: '3', label: 'Version 3' }], defaultValue: 'auto' }
    ]
  },
  {
    id: 'validate-kubernetes', name: 'Kubernetes YAML Validator', description: 'Validate Kubernetes YAML', category: 'Data', subcategory: 'Validator', tier: 'pro', costType: 'coin', coinCost: 1, execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'k8sVersion', type: 'select', label: 'Kubernetes Version', options: [{ value: 'latest', label: 'Latest' }, { value: '1.29', label: '1.29' }, { value: '1.28', label: '1.28' }, { value: '1.27', label: '1.27' }], defaultValue: 'latest' },
      { name: 'strictMode', type: 'checkbox', label: 'Strict Mode', defaultValue: true }
    ]
  },
  {
    id: 'validate-terraform', name: 'Terraform Validator', description: 'Validate Terraform config', category: 'Data', subcategory: 'Validator', tier: 'pro', costType: 'coin', coinCost: 1, execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'terraformVersion', type: 'select', label: 'Terraform Version', options: [{ value: 'latest', label: 'Latest' }, { value: '1.6', label: '1.6.x' }, { value: '1.5', label: '1.5.x' }, { value: '1.4', label: '1.4.x' }], defaultValue: 'latest' }
    ]
  },

  // Testers
  {
    id: 'jsonpath-tester', name: 'JSONPath Tester', description: 'Test JSONPath expressions', category: 'Data', subcategory: 'Tester', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      { name: 'implementation', type: 'select', label: 'Implementation', options: [{ value: 'jsonpath-plus', label: 'JSONPath Plus' }, { value: 'goessner', label: 'Goessner' }], defaultValue: 'jsonpath-plus' },
      { name: 'resultType', type: 'select', label: 'Result Type', options: [{ value: 'value', label: 'Values' }, { value: 'path', label: 'Paths' }, { value: 'both', label: 'Both' }], defaultValue: 'value' }
    ]
  },
  {
    id: 'xpath-tester', name: 'XPath Tester', description: 'Test XPath expressions', category: 'Data', subcategory: 'Tester', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'xpathVersion', type: 'select', label: 'XPath Version', options: [{ value: '1.0', label: 'XPath 1.0' }, { value: '2.0', label: 'XPath 2.0' }, { value: '3.0', label: 'XPath 3.0' }], defaultValue: '1.0' },
      { name: 'outputFormat', type: 'select', label: 'Output Format', options: [{ value: 'text', label: 'Text' }, { value: 'xml', label: 'XML nodes' }], defaultValue: 'text' }
    ]
  },
  {
    id: 'regex-tester', name: 'Regex Tester & Debugger', description: 'Test and debug regex', category: 'Data', subcategory: 'Tester', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'regexFlavor', type: 'select', label: 'Regex Flavor', options: [{ value: 'javascript', label: 'JavaScript' }, { value: 'pcre', label: 'PCRE' }, { value: 'python', label: 'Python' }], defaultValue: 'javascript' },
      { name: 'globalFlag', type: 'checkbox', label: 'Global (g)', defaultValue: true },
      { name: 'caseInsensitiveFlag', type: 'checkbox', label: 'Case Insensitive (i)', defaultValue: false },
      { name: 'multilineFlag', type: 'checkbox', label: 'Multiline (m)', defaultValue: false },
      { name: 'showMatchGroups', type: 'checkbox', label: 'Show Match Groups', defaultValue: true }
    ]
  },
  {
    id: 'cron-validator', name: 'Cron Expression Validator', description: 'Validate and explain cron', category: 'Data', subcategory: 'Validator', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'cronFormat', type: 'select', label: 'Cron Format', options: [{ value: 'standard', label: 'Standard (5 fields)' }, { value: 'extended', label: 'Extended (6 fields with seconds)' }, { value: 'quartz', label: 'Quartz (7 fields)' }], defaultValue: 'standard' },
      { name: 'previewCount', type: 'number', label: 'Preview Count', defaultValue: 5, min: 1, max: 20 }
    ]
  },
  {
    id: 'semver-validator', name: 'SemVer Validator', description: 'Validate semantic versioning', category: 'Data', subcategory: 'Validator', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'allowPrerelease', type: 'checkbox', label: 'Allow Prerelease', defaultValue: true },
      { name: 'allowBuildMetadata', type: 'checkbox', label: 'Allow Build Metadata', defaultValue: true }
    ]
  },

  // Formatters (237-248)
  {
    id: 'format-json', name: 'JSON Formatter (Minifier)', description: 'Format or minify JSON', category: 'Data', subcategory: 'Formatter', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      { name: 'mode', type: 'select', label: 'Mode', options: [{ value: 'prettify', label: 'Prettify' }, { value: 'minify', label: 'Minify' }], defaultValue: 'prettify' },
      { name: 'indentation', type: 'select', label: 'Indentation', options: [{ value: '2', label: '2 spaces' }, { value: '4', label: '4 spaces' }, { value: 'tab', label: 'Tab' }], defaultValue: '2' },
      { name: 'sortKeys', type: 'checkbox', label: 'Sort Keys', defaultValue: false },
      { name: 'trailingComma', type: 'checkbox', label: 'Allow Trailing Comma', defaultValue: false }
    ]
  },
  {
    id: 'format-xml', name: 'XML Formatter (Minifier)', description: 'Format or minify XML', category: 'Data', subcategory: 'Formatter', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'mode', type: 'select', label: 'Mode', options: [{ value: 'prettify', label: 'Prettify' }, { value: 'minify', label: 'Minify' }], defaultValue: 'prettify' },
      { name: 'indentation', type: 'select', label: 'Indentation', options: [{ value: '2', label: '2 spaces' }, { value: '4', label: '4 spaces' }, { value: 'tab', label: 'Tab' }], defaultValue: '2' },
      { name: 'preserveComments', type: 'checkbox', label: 'Preserve Comments', defaultValue: true },
      { name: 'collapseContent', type: 'checkbox', label: 'Collapse Content', defaultValue: false }
    ]
  },
  {
    id: 'format-yaml', name: 'YAML Formatter', description: 'Format YAML', category: 'Data', subcategory: 'Formatter', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'indentation', type: 'select', label: 'Indentation', options: [{ value: '2', label: '2 spaces' }, { value: '4', label: '4 spaces' }], defaultValue: '2' },
      { name: 'lineWidth', type: 'number', label: 'Line Width', defaultValue: 80, min: 40, max: 200 },
      { name: 'sortKeys', type: 'checkbox', label: 'Sort Keys', defaultValue: false }
    ]
  },
  {
    id: 'format-sql', name: 'SQL Formatter', description: 'Format SQL queries', category: 'Data', subcategory: 'Formatter', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'dialect', type: 'select', label: 'SQL Dialect', options: [{ value: 'standard', label: 'Standard SQL' }, { value: 'mysql', label: 'MySQL' }, { value: 'postgresql', label: 'PostgreSQL' }, { value: 'tsql', label: 'T-SQL' }, { value: 'plsql', label: 'PL/SQL' }], defaultValue: 'standard' },
      { name: 'keywordCase', type: 'select', label: 'Keyword Case', options: [{ value: 'upper', label: 'UPPER' }, { value: 'lower', label: 'lower' }, { value: 'preserve', label: 'Preserve' }], defaultValue: 'upper' },
      { name: 'indentation', type: 'select', label: 'Indentation', options: [{ value: '2', label: '2 spaces' }, { value: '4', label: '4 spaces' }, { value: 'tab', label: 'Tab' }], defaultValue: '2' },
      { name: 'linesBetweenQueries', type: 'number', label: 'Lines Between Queries', defaultValue: 1, min: 0, max: 5 }
    ]
  },
  {
    id: 'format-graphql', name: 'GraphQL Formatter', description: 'Format GraphQL queries', category: 'Data', subcategory: 'Formatter', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'indentation', type: 'select', label: 'Indentation', options: [{ value: '2', label: '2 spaces' }, { value: '4', label: '4 spaces' }, { value: 'tab', label: 'Tab' }], defaultValue: '2' },
      { name: 'sortDefinitions', type: 'checkbox', label: 'Sort Definitions', defaultValue: false }
    ]
  },
  {
    id: 'format-openapi', name: 'OpenAPI / Swagger Formatter', description: 'Format OpenAPI specs', category: 'Data', subcategory: 'Formatter', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'outputFormat', type: 'select', label: 'Output Format', options: [{ value: 'yaml', label: 'YAML' }, { value: 'json', label: 'JSON' }], defaultValue: 'yaml' },
      { name: 'indentation', type: 'select', label: 'Indentation', options: [{ value: '2', label: '2 spaces' }, { value: '4', label: '4 spaces' }], defaultValue: '2' },
      { name: 'sortPaths', type: 'checkbox', label: 'Sort Paths', defaultValue: false }
    ]
  },
  {
    id: 'format-markdown', name: 'Markdown Formatter', description: 'Format Markdown', category: 'Data', subcategory: 'Formatter', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'lineWidth', type: 'number', label: 'Line Width', defaultValue: 80, min: 40, max: 200 },
      { name: 'listIndentation', type: 'select', label: 'List Indentation', options: [{ value: '2', label: '2 spaces' }, { value: '4', label: '4 spaces' }], defaultValue: '2' },
      { name: 'emphasisMarker', type: 'select', label: 'Emphasis Marker', options: [{ value: '*', label: 'Asterisk (*)' }, { value: '_', label: 'Underscore (_)' }], defaultValue: '*' }
    ]
  },
  {
    id: 'format-html', name: 'HTML Formatter', description: 'Format HTML', category: 'Data', subcategory: 'Formatter', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'indentation', type: 'select', label: 'Indentation', options: [{ value: '2', label: '2 spaces' }, { value: '4', label: '4 spaces' }, { value: 'tab', label: 'Tab' }], defaultValue: '2' },
      { name: 'wrapLineLength', type: 'number', label: 'Wrap Line Length', defaultValue: 120, min: 0, max: 300 },
      { name: 'preserveNewlines', type: 'checkbox', label: 'Preserve Newlines', defaultValue: true }
    ]
  },
  {
    id: 'format-code', name: 'Code Formatter (Prettier-style)', description: 'Format code with Prettier', category: 'Data', subcategory: 'Formatter', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'language', type: 'select', label: 'Language', options: [{ value: 'auto', label: 'Auto-detect' }, { value: 'javascript', label: 'JavaScript' }, { value: 'typescript', label: 'TypeScript' }, { value: 'css', label: 'CSS' }, { value: 'html', label: 'HTML' }], defaultValue: 'auto' },
      { name: 'tabWidth', type: 'select', label: 'Tab Width', options: [{ value: '2', label: '2 spaces' }, { value: '4', label: '4 spaces' }], defaultValue: '2' },
      { name: 'useTabs', type: 'checkbox', label: 'Use Tabs', defaultValue: false },
      { name: 'semi', type: 'checkbox', label: 'Semicolons', defaultValue: true },
      { name: 'singleQuote', type: 'checkbox', label: 'Single Quotes', defaultValue: false },
      { name: 'trailingComma', type: 'select', label: 'Trailing Comma', options: [{ value: 'none', label: 'None' }, { value: 'es5', label: 'ES5' }, { value: 'all', label: 'All' }], defaultValue: 'es5' }
    ]
  },
  {
    id: 'line-ending-normalizer', name: 'Line Ending Normalizer', description: 'Normalize LF/CRLF', category: 'Data', subcategory: 'Formatter', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'targetEnding', type: 'select', label: 'Target Line Ending', options: [{ value: 'lf', label: 'LF (Unix/Linux/macOS)' }, { value: 'crlf', label: 'CRLF (Windows)' }, { value: 'cr', label: 'CR (Classic Mac)' }], defaultValue: 'lf' },
      { name: 'trimTrailingWhitespace', type: 'checkbox', label: 'Trim Trailing Whitespace', defaultValue: false },
      { name: 'finalNewline', type: 'checkbox', label: 'Ensure Final Newline', defaultValue: true }
    ]
  },
  {
    id: 'indentation-converter', name: 'Indentation Converter', description: 'Convert tabs ⇄ spaces', category: 'Data', subcategory: 'Formatter', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'direction', type: 'select', label: 'Direction', options: [{ value: 'tabs-to-spaces', label: 'Tabs → Spaces' }, { value: 'spaces-to-tabs', label: 'Spaces → Tabs' }], defaultValue: 'tabs-to-spaces' },
      { name: 'spaceCount', type: 'select', label: 'Space Count', options: [{ value: '2', label: '2 spaces' }, { value: '4', label: '4 spaces' }, { value: '8', label: '8 spaces' }], defaultValue: '2' }
    ]
  },
  {
    id: 'key-sorter', name: 'Key Sorter (JSON/YAML)', description: 'Sort keys in JSON/YAML', category: 'Data', subcategory: 'Formatter', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'inputFormat', type: 'select', label: 'Input Format', options: [{ value: 'auto', label: 'Auto-detect' }, { value: 'json', label: 'JSON' }, { value: 'yaml', label: 'YAML' }], defaultValue: 'auto' },
      { name: 'sortOrder', type: 'select', label: 'Sort Order', options: [{ value: 'asc', label: 'Ascending (A-Z)' }, { value: 'desc', label: 'Descending (Z-A)' }], defaultValue: 'asc' },
      { name: 'recursive', type: 'checkbox', label: 'Sort Recursively', defaultValue: true },
      { name: 'caseSensitive', type: 'checkbox', label: 'Case Sensitive', defaultValue: false }
    ]
  },

  // Code Converters (249-264)
  {
    id: 'typescript-to-javascript', name: 'TypeScript → JavaScript', description: 'Convert TypeScript to JavaScript', category: 'Data', subcategory: 'Code', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'target', type: 'select', label: 'Target', options: [{ value: 'ES5', label: 'ES5' }, { value: 'ES6', label: 'ES6/ES2015' }, { value: 'ES2017', label: 'ES2017' }, { value: 'ES2020', label: 'ES2020' }, { value: 'ESNext', label: 'ESNext' }], defaultValue: 'ES2020' },
      { name: 'module', type: 'select', label: 'Module System', options: [{ value: 'commonjs', label: 'CommonJS' }, { value: 'es6', label: 'ES Modules' }, { value: 'umd', label: 'UMD' }], defaultValue: 'es6' },
      { name: 'removeComments', type: 'checkbox', label: 'Remove Comments', defaultValue: false },
      { name: 'downlevelIteration', type: 'checkbox', label: 'Downlevel Iteration', defaultValue: false }
    ]
  },
  {
    id: 'coffeescript-to-javascript', name: 'CoffeeScript → JavaScript', description: 'Convert CoffeeScript to JS', category: 'Data', subcategory: 'Code', tier: 'pro', costType: 'coin', coinCost: 1, execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'bare', type: 'checkbox', label: 'Bare (no wrapper)', defaultValue: false },
      { name: 'header', type: 'checkbox', label: 'Include Header Comment', defaultValue: true }
    ]
  },
  {
    id: 'dart-to-javascript', name: 'Dart → JavaScript', description: 'Convert Dart to JavaScript', category: 'Data', subcategory: 'Code', tier: 'pro', costType: 'coin', coinCost: 2, execution: 'server', inputType: 'text', outputType: 'text',
    options: [
      { name: 'optimization', type: 'select', label: 'Optimization Level', options: [{ value: 'O0', label: 'None (debug)' }, { value: 'O1', label: 'Basic' }, { value: 'O2', label: 'Standard' }, { value: 'O3', label: 'Aggressive' }], defaultValue: 'O2' },
      { name: 'minify', type: 'checkbox', label: 'Minify Output', defaultValue: false }
    ]
  },
  {
    id: 'flow-to-typescript', name: 'Flow → TypeScript', description: 'Convert Flow to TypeScript', category: 'Data', subcategory: 'Code', tier: 'pro', costType: 'coin', coinCost: 2, execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'preserveComments', type: 'checkbox', label: 'Preserve Comments', defaultValue: true },
      { name: 'strictNullChecks', type: 'checkbox', label: 'Strict Null Checks', defaultValue: true }
    ]
  },
  {
    id: 'reasonml-to-javascript', name: 'ReasonML → JavaScript', description: 'Convert ReasonML to JS', category: 'Data', subcategory: 'Code', tier: 'pro', costType: 'coin', coinCost: 2, execution: 'server', inputType: 'text', outputType: 'text',
    options: [
      { name: 'moduleFormat', type: 'select', label: 'Module Format', options: [{ value: 'commonjs', label: 'CommonJS' }, { value: 'es6', label: 'ES Modules' }], defaultValue: 'es6' }
    ]
  },
  {
    id: 'kotlin-to-typescript', name: 'Kotlin Data Classes → TypeScript', description: 'Convert Kotlin to TS', category: 'Data', subcategory: 'Code', tier: 'pro', costType: 'coin', coinCost: 2, execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'nullability', type: 'select', label: 'Nullability Style', options: [{ value: 'optional', label: 'Optional (?)' }, { value: 'null-union', label: 'Null Union (| null)' }, { value: 'undefined-union', label: 'Undefined Union (| undefined)' }], defaultValue: 'optional' },
      { name: 'useInterface', type: 'checkbox', label: 'Use Interface (vs Type)', defaultValue: true }
    ]
  },
  {
    id: 'swift-to-typescript', name: 'Swift Codable → TypeScript', description: 'Convert Swift to TS', category: 'Data', subcategory: 'Code', tier: 'pro', costType: 'coin', coinCost: 2, execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'nullability', type: 'select', label: 'Nullability Style', options: [{ value: 'optional', label: 'Optional (?)' }, { value: 'null-union', label: 'Null Union (| null)' }], defaultValue: 'optional' },
      { name: 'useInterface', type: 'checkbox', label: 'Use Interface (vs Type)', defaultValue: true }
    ]
  },
  {
    id: 'java-to-typescript', name: 'Java POJO → TypeScript', description: 'Convert Java to TS', category: 'Data', subcategory: 'Code', tier: 'pro', costType: 'coin', coinCost: 2, execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'nullability', type: 'select', label: 'Nullability Style', options: [{ value: 'optional', label: 'Optional (?)' }, { value: 'null-union', label: 'Null Union (| null)' }], defaultValue: 'optional' },
      { name: 'useInterface', type: 'checkbox', label: 'Use Interface (vs Type)', defaultValue: true },
      { name: 'includeGettersSetters', type: 'checkbox', label: 'Include Getters/Setters', defaultValue: false }
    ]
  },
  {
    id: 'csharp-to-typescript', name: 'C# DTO → TypeScript', description: 'Convert C# to TS', category: 'Data', subcategory: 'Code', tier: 'pro', costType: 'coin', coinCost: 2, execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'nullability', type: 'select', label: 'Nullability Style', options: [{ value: 'optional', label: 'Optional (?)' }, { value: 'null-union', label: 'Null Union (| null)' }], defaultValue: 'optional' },
      { name: 'useInterface', type: 'checkbox', label: 'Use Interface (vs Type)', defaultValue: true },
      { name: 'preserveAttributes', type: 'checkbox', label: 'Preserve Attributes as Comments', defaultValue: false }
    ]
  },
  {
    id: 'scss-to-css', name: 'SCSS → CSS', description: 'Convert SCSS to CSS', category: 'Data', subcategory: 'Code', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'outputStyle', type: 'select', label: 'Output Style', options: [{ value: 'expanded', label: 'Expanded' }, { value: 'compressed', label: 'Compressed' }], defaultValue: 'expanded' },
      { name: 'sourceMap', type: 'checkbox', label: 'Generate Source Map', defaultValue: false }
    ]
  },
  {
    id: 'less-to-css', name: 'Less → CSS', description: 'Convert Less to CSS', category: 'Data', subcategory: 'Code', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'compress', type: 'checkbox', label: 'Compress Output', defaultValue: false },
      { name: 'strictMath', type: 'checkbox', label: 'Strict Math', defaultValue: false }
    ]
  },
  {
    id: 'stylus-to-css', name: 'Stylus → CSS', description: 'Convert Stylus to CSS', category: 'Data', subcategory: 'Code', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'compress', type: 'checkbox', label: 'Compress Output', defaultValue: false }
    ]
  },
  {
    id: 'postcss-to-css', name: 'PostCSS → CSS', description: 'Process PostCSS to CSS', category: 'Data', subcategory: 'Code', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'autoprefixer', type: 'checkbox', label: 'Add Vendor Prefixes', defaultValue: true },
      { name: 'minify', type: 'checkbox', label: 'Minify Output', defaultValue: false }
    ]
  },
  {
    id: 'css-to-js-objects', name: 'CSS ⇄ JS Style Objects', description: 'Convert CSS to JS objects', category: 'Data', subcategory: 'Code', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'format', type: 'select', label: 'Output Format', options: [{ value: 'object', label: 'Plain Object' }, { value: 'styled-components', label: 'Styled Components' }, { value: 'emotion', label: 'Emotion' }], defaultValue: 'object' },
      { name: 'camelCase', type: 'checkbox', label: 'CamelCase Properties', defaultValue: true }
    ]
  },
  {
    id: 'tailwind-to-css', name: 'Tailwind → CSS Tokens', description: 'Convert Tailwind config to CSS custom properties', category: 'Data', subcategory: 'Code', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'outputFormat', type: 'select', label: 'Output Format', options: [{ value: 'css-variables', label: 'CSS Variables' }, { value: 'sass-variables', label: 'Sass Variables' }, { value: 'json', label: 'JSON Tokens' }], defaultValue: 'css-variables' }
    ]
  },
  {
    id: 'css-variables-to-json', name: 'CSS Variables ⇄ JSON Tokens', description: 'Convert CSS vars to JSON', category: 'Data', subcategory: 'Code', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'nestByPrefix', type: 'checkbox', label: 'Nest by Prefix', defaultValue: true },
      { name: 'stripPrefix', type: 'checkbox', label: 'Strip -- Prefix', defaultValue: true }
    ]
  },

  // DevOps Converters (265-274)
  {
    id: 'dockerfile-lint', name: 'Dockerfile Lint & Normalize', description: 'Lint and format Dockerfile', category: 'Data', subcategory: 'DevOps', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'enforceBestPractices', type: 'checkbox', label: 'Enforce Best Practices', defaultValue: true },
      { name: 'suggestOptimizations', type: 'checkbox', label: 'Suggest Optimizations', defaultValue: true }
    ]
  },
  {
    id: 'docker-compose-to-kubernetes', name: 'Docker Compose → Kubernetes', description: 'Convert to K8s YAML', category: 'Data', subcategory: 'DevOps', tier: 'pro', costType: 'coin', coinCost: 3, execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'outputFormat', type: 'select', label: 'Output Format', options: [{ value: 'deployment', label: 'Deployment + Service' }, { value: 'statefulset', label: 'StatefulSet' }, { value: 'daemonset', label: 'DaemonSet' }], defaultValue: 'deployment' },
      { name: 'generateIngress', type: 'checkbox', label: 'Generate Ingress', defaultValue: false },
      { name: 'namespace', type: 'string', label: 'Namespace', placeholder: 'default', defaultValue: 'default' }
    ]
  },
  {
    id: 'helm-to-kubernetes', name: 'Helm Values → Kubernetes', description: 'Expand Helm to K8s', category: 'Data', subcategory: 'DevOps', tier: 'pro', costType: 'coin', coinCost: 3, execution: 'server', inputType: 'text', outputType: 'text',
    options: [
      { name: 'releaseName', type: 'string', label: 'Release Name', placeholder: 'my-release', defaultValue: 'my-release' },
      { name: 'includeHooks', type: 'checkbox', label: 'Include Hooks', defaultValue: false }
    ]
  },
  {
    id: 'terraform-to-cloudformation', name: 'Terraform → CloudFormation', description: 'Convert to CloudFormation', category: 'Data', subcategory: 'DevOps', tier: 'pro', costType: 'coin', coinCost: 5, execution: 'server', inputType: 'text', outputType: 'text',
    options: [
      { name: 'stackName', type: 'string', label: 'Stack Name', placeholder: 'MyStack', defaultValue: '' },
      { name: 'outputFormat', type: 'select', label: 'Output Format', options: [{ value: 'yaml', label: 'YAML' }, { value: 'json', label: 'JSON' }], defaultValue: 'yaml' }
    ]
  },
  {
    id: 'terraform-to-pulumi', name: 'Terraform → Pulumi', description: 'Convert to Pulumi', category: 'Data', subcategory: 'DevOps', tier: 'pro', costType: 'coin', coinCost: 5, execution: 'server', inputType: 'text', outputType: 'text',
    options: [
      { name: 'language', type: 'select', label: 'Target Language', options: [{ value: 'typescript', label: 'TypeScript' }, { value: 'python', label: 'Python' }, { value: 'go', label: 'Go' }, { value: 'csharp', label: 'C#' }], defaultValue: 'typescript' }
    ]
  },
  {
    id: 'kubernetes-to-kustomize', name: 'Kubernetes → Kustomize', description: 'Convert to Kustomize', category: 'Data', subcategory: 'DevOps', tier: 'pro', costType: 'coin', coinCost: 2, execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'generateBase', type: 'checkbox', label: 'Generate Base', defaultValue: true },
      { name: 'includeOverlays', type: 'checkbox', label: 'Include Overlays', defaultValue: false }
    ]
  },
  {
    id: 'sql-to-nosql', name: 'SQL → NoSQL', description: 'Convert SQL queries to NoSQL syntax', category: 'Data', subcategory: 'DevOps', tier: 'pro', costType: 'coin', coinCost: 2, execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'targetDb', type: 'select', label: 'Target Database', options: [{ value: 'mongodb', label: 'MongoDB' }, { value: 'dynamodb', label: 'DynamoDB' }, { value: 'couchdb', label: 'CouchDB' }, { value: 'firebase', label: 'Firebase' }], defaultValue: 'mongodb' },
      { name: 'preserveJoins', type: 'select', label: 'Join Handling', options: [{ value: 'embed', label: 'Embed as subdocuments' }, { value: 'reference', label: 'Use references' }, { value: 'denormalize', label: 'Denormalize' }], defaultValue: 'embed' }
    ]
  },
  {
    id: 'env-to-json', name: 'ENV ⇄ JSON', description: 'Convert .env to JSON', category: 'Data', subcategory: 'DevOps', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'expandVariables', type: 'checkbox', label: 'Expand Variables', defaultValue: false },
      { name: 'parseNumbers', type: 'checkbox', label: 'Parse Numbers', defaultValue: true },
      { name: 'parseBooleans', type: 'checkbox', label: 'Parse Booleans', defaultValue: true }
    ]
  },
  {
    id: 'env-to-yaml', name: 'ENV ⇄ YAML', description: 'Convert .env to YAML', category: 'Data', subcategory: 'DevOps', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'expandVariables', type: 'checkbox', label: 'Expand Variables', defaultValue: false },
      { name: 'groupByPrefix', type: 'checkbox', label: 'Group by Prefix', defaultValue: true }
    ]
  },
  {
    id: 'env-to-docker-compose', name: 'ENV ⇄ Docker Compose', description: 'Convert .env to Docker Compose', category: 'Data', subcategory: 'DevOps', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'envFileMode', type: 'select', label: 'Environment Mode', options: [{ value: 'inline', label: 'Inline Variables' }, { value: 'env_file', label: 'Reference env_file' }], defaultValue: 'inline' }
    ]
  },

  // API Tools (275-290)
  {
    id: 'api-response-beautifier', name: 'API Response Beautifier', description: 'Format API responses', category: 'Data', subcategory: 'API', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      { name: 'indentation', type: 'select', label: 'Indentation', options: [{ value: '2', label: '2 spaces' }, { value: '4', label: '4 spaces' }], defaultValue: '2' },
      { name: 'sortKeys', type: 'checkbox', label: 'Sort Keys', defaultValue: false }
    ]
  },
  {
    id: 'api-response-to-mock', name: 'API Response → Mock Schema', description: 'Generate mock from API', category: 'Data', subcategory: 'API', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      { name: 'mockFormat', type: 'select', label: 'Mock Format', options: [{ value: 'json-schema', label: 'JSON Schema' }, { value: 'faker', label: 'Faker.js' }, { value: 'msw', label: 'MSW Handler' }], defaultValue: 'json-schema' },
      { name: 'includeExamples', type: 'checkbox', label: 'Include Examples', defaultValue: true }
    ]
  },
  {
    id: 'jwt-decoder', name: 'JWT Decoder', description: 'Decode JWT header/payload', category: 'Data', subcategory: 'API', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'showAll', type: 'checkbox', label: 'Show Header + Payload + Signature', defaultValue: true },
      { name: 'formatTimestamps', type: 'checkbox', label: 'Format Timestamps', defaultValue: true }
    ]
  },
  {
    id: 'jwt-to-json', name: 'JWT → JSON Claims', description: 'Extract JWT claims', category: 'Data', subcategory: 'API', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'includeHeader', type: 'checkbox', label: 'Include Header', defaultValue: false },
      { name: 'formatTimestamps', type: 'checkbox', label: 'Format Timestamps', defaultValue: true }
    ]
  },
  {
    id: 'base64-to-json', name: 'Base64 → JSON', description: 'Decode Base64 to JSON', category: 'Data', subcategory: 'API', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'urlSafe', type: 'checkbox', label: 'URL-Safe Base64', defaultValue: false },
      { name: 'prettify', type: 'checkbox', label: 'Prettify JSON', defaultValue: true }
    ]
  },
  {
    id: 'url-to-curl', name: 'URL → cURL', description: 'Generate cURL from URL', category: 'Data', subcategory: 'API', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'method', type: 'select', label: 'HTTP Method', options: [{ value: 'GET', label: 'GET' }, { value: 'POST', label: 'POST' }, { value: 'PUT', label: 'PUT' }, { value: 'DELETE', label: 'DELETE' }, { value: 'PATCH', label: 'PATCH' }], defaultValue: 'GET' },
      { name: 'includeCookies', type: 'checkbox', label: 'Include Cookies', defaultValue: false },
      { name: 'followRedirects', type: 'checkbox', label: 'Follow Redirects (-L)', defaultValue: true }
    ]
  },
  {
    id: 'curl-to-fetch', name: 'cURL → Fetch', description: 'Convert cURL to fetch', category: 'Data', subcategory: 'API', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'asyncStyle', type: 'select', label: 'Async Style', options: [{ value: 'async-await', label: 'async/await' }, { value: 'promise', label: 'Promise chain' }], defaultValue: 'async-await' },
      { name: 'typescript', type: 'checkbox', label: 'TypeScript', defaultValue: false }
    ]
  },
  {
    id: 'curl-to-httpie', name: 'cURL → HTTPie', description: 'Convert cURL to HTTPie', category: 'Data', subcategory: 'API', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'useShortFlags', type: 'checkbox', label: 'Use Short Flags', defaultValue: true }
    ]
  },
  {
    id: 'http-headers-to-json', name: 'HTTP Headers → JSON', description: 'Parse HTTP headers', category: 'Data', subcategory: 'API', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'lowercaseKeys', type: 'checkbox', label: 'Lowercase Keys', defaultValue: true },
      { name: 'parseCookies', type: 'checkbox', label: 'Parse Cookies', defaultValue: true }
    ]
  },

  // Diff Tools
  {
    id: 'json-diff', name: 'JSON Diff', description: 'Compare JSON objects', category: 'Data', subcategory: 'Diff', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      { name: 'ignoreOrder', type: 'checkbox', label: 'Ignore Array Order', defaultValue: false },
      { name: 'showUnchanged', type: 'checkbox', label: 'Show Unchanged', defaultValue: false },
      { name: 'outputFormat', type: 'select', label: 'Output Format', options: [{ value: 'patch', label: 'JSON Patch' }, { value: 'unified', label: 'Unified Diff' }, { value: 'visual', label: 'Visual Tree' }], defaultValue: 'visual' }
    ]
  },
  {
    id: 'schema-diff', name: 'Schema Diff', description: 'Compare schemas', category: 'Data', subcategory: 'Diff', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'schemaType', type: 'select', label: 'Schema Type', options: [{ value: 'json-schema', label: 'JSON Schema' }, { value: 'typescript', label: 'TypeScript' }, { value: 'graphql', label: 'GraphQL' }], defaultValue: 'json-schema' },
      { name: 'showBreakingChanges', type: 'checkbox', label: 'Highlight Breaking Changes', defaultValue: true }
    ]
  },
  {
    id: 'openapi-diff', name: 'OpenAPI Diff', description: 'Compare OpenAPI specs', category: 'Data', subcategory: 'Diff', tier: 'pro', costType: 'coin', coinCost: 2, execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'showBreakingChanges', type: 'checkbox', label: 'Highlight Breaking Changes', defaultValue: true },
      { name: 'includeDeprecations', type: 'checkbox', label: 'Include Deprecations', defaultValue: true }
    ]
  },
  {
    id: 'graphql-diff', name: 'GraphQL Schema Diff', description: 'Compare GraphQL schemas', category: 'Data', subcategory: 'Diff', tier: 'pro', costType: 'coin', coinCost: 2, execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'showBreakingChanges', type: 'checkbox', label: 'Highlight Breaking Changes', defaultValue: true },
      { name: 'includeDangerousChanges', type: 'checkbox', label: 'Include Dangerous Changes', defaultValue: true }
    ]
  },
  {
    id: 'config-diff', name: 'Config Diff', description: 'Compare config files', category: 'Data', subcategory: 'Diff', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'configFormat', type: 'select', label: 'Config Format', options: [{ value: 'auto', label: 'Auto-detect' }, { value: 'yaml', label: 'YAML' }, { value: 'json', label: 'JSON' }, { value: 'toml', label: 'TOML' }, { value: 'ini', label: 'INI' }], defaultValue: 'auto' },
      { name: 'ignoreComments', type: 'checkbox', label: 'Ignore Comments', defaultValue: true }
    ]
  },
  {
    id: 'line-diff', name: 'Line-by-Line Diff', description: 'Compare text line by line', category: 'Data', subcategory: 'Diff', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'contextLines', type: 'number', label: 'Context Lines', defaultValue: 3, min: 0, max: 10 },
      { name: 'ignoreWhitespace', type: 'checkbox', label: 'Ignore Whitespace', defaultValue: false },
      { name: 'outputFormat', type: 'select', label: 'Output Format', options: [{ value: 'unified', label: 'Unified' }, { value: 'side-by-side', label: 'Side by Side' }], defaultValue: 'unified' }
    ]
  },
  {
    id: 'ast-viewer', name: 'AST Viewer', description: 'View abstract syntax tree', category: 'Data', subcategory: 'Developer', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'language', type: 'select', label: 'Language', options: [{ value: 'javascript', label: 'JavaScript' }, { value: 'typescript', label: 'TypeScript' }, { value: 'json', label: 'JSON' }, { value: 'css', label: 'CSS' }, { value: 'html', label: 'HTML' }], defaultValue: 'javascript' },
      { name: 'showLocations', type: 'checkbox', label: 'Show Locations', defaultValue: false }
    ]
  },

  // Unicode/Encoding (291-297)
  {
    id: 'html-entity-encode', name: 'HTML Entity Encode ⇄ Decode', description: 'Encode/decode HTML entities (use Swap to change direction)', category: 'Data', subcategory: 'Encoding', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'encodeMode', type: 'select', label: 'Encode Mode', options: [{ value: 'named', label: 'Named (&amp;)' }, { value: 'numeric', label: 'Numeric (&#38;)' }, { value: 'hex', label: 'Hex (&#x26;)' }], defaultValue: 'named' }
    ]
  },
  {
    id: 'punycode-encode', name: 'Punycode Encode ⇄ Decode', description: 'Encode/decode Punycode (use Swap to change direction)', category: 'Data', subcategory: 'Encoding', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: []
  },
  {
    id: 'utf8-to-utf16', name: 'UTF-8 ⇄ UTF-16 Converter', description: 'Convert between UTF formats (use Swap to change direction)', category: 'Data', subcategory: 'Encoding', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'endianness', type: 'select', label: 'Endianness', options: [{ value: 'le', label: 'Little Endian' }, { value: 'be', label: 'Big Endian' }], defaultValue: 'le' }
    ]
  },
  {
    id: 'unicode-normalizer', name: 'Unicode Normalizer', description: 'Normalize Unicode forms', category: 'Data', subcategory: 'Encoding', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'form', type: 'select', label: 'Normalization Form', options: [{ value: 'NFC', label: 'NFC (Composed)' }, { value: 'NFD', label: 'NFD (Decomposed)' }, { value: 'NFKC', label: 'NFKC (Compat Composed)' }, { value: 'NFKD', label: 'NFKD (Compat Decomposed)' }], defaultValue: 'NFC' }
    ]
  },
  {
    id: 'unicode-code-point', name: 'Unicode Code Point Viewer', description: 'View Unicode code points', category: 'Data', subcategory: 'Encoding', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'outputFormat', type: 'select', label: 'Output Format', options: [{ value: 'hex', label: 'Hex (U+0041)' }, { value: 'decimal', label: 'Decimal' }, { value: 'both', label: 'Both' }], defaultValue: 'hex' },
      { name: 'showNames', type: 'checkbox', label: 'Show Character Names', defaultValue: true }
    ]
  },
  {
    id: 'unicode-category-filter', name: 'Unicode Category Filter', description: 'Filter by Unicode category', category: 'Data', subcategory: 'Encoding', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'category', type: 'select', label: 'Category', options: [{ value: 'L', label: 'Letters (L)' }, { value: 'N', label: 'Numbers (N)' }, { value: 'P', label: 'Punctuation (P)' }, { value: 'S', label: 'Symbols (S)' }, { value: 'Z', label: 'Separators (Z)' }, { value: 'C', label: 'Control (C)' }], defaultValue: 'L' },
      { name: 'action', type: 'select', label: 'Action', options: [{ value: 'keep', label: 'Keep Only' }, { value: 'remove', label: 'Remove' }], defaultValue: 'keep' }
    ]
  },
  {
    id: 'text-direction-normalizer', name: 'Text Direction Normalizer', description: 'Normalize LTR/RTL direction', category: 'Data', subcategory: 'Encoding', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'direction', type: 'select', label: 'Target Direction', options: [{ value: 'ltr', label: 'LTR (Left-to-Right)' }, { value: 'rtl', label: 'RTL (Right-to-Left)' }, { value: 'strip', label: 'Strip Direction Marks' }], defaultValue: 'ltr' },
      { name: 'insertMarks', type: 'checkbox', label: 'Insert Direction Marks', defaultValue: true }
    ]
  },
];
