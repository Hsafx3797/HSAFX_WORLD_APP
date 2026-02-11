'use client';

/**
 * Code Executor
 * 
 * Handles all code/data transformation tools (JSON/YAML/XML converters, formatters, etc.)
 * Uses CodeEditorTool in expanded mode with NO header (page handles header).
 */

import * as React from 'react';
import type { ToolMetadata } from '@/lib/tools/types';
import { executeClientTool } from '@/lib/tools/executor';
import { CodeEditorTool } from '../code-editor-tool';

// ============================================================================
// TOOL IDS
// ============================================================================

/** Code/Data tool IDs that use CodeEditorTool */
export const CODE_TOOL_IDS = new Set([
  // JSON conversions
  'json-to-yaml', 'yaml-to-json', 'json-to-xml', 'xml-to-json', 'json-to-csv', 'csv-to-json',
  'json-to-toml', 'toml-to-json', 'json-to-properties', 'properties-to-json',
  'markdown-table-to-json', 'json-to-markdown-table', 'format-json', 'minify-json',
  'tsv-to-json', 'tsv-to-csv', 'ini-to-json', 'hocon-to-json', 'ndjson-to-json',
  'json-to-jsonl', 'json-to-url-params', 'json-to-form-data', 'base64-to-json',
  // Binary format converters
  'bson-to-json', 'messagepack-to-json', 'avro-to-json', 'parquet-to-json', 'protobuf-to-json',
  // Code transpilers
  'typescript-to-javascript', 'coffeescript-to-javascript', 'dart-to-javascript', 'reasonml-to-javascript',
  'dart-to-js', 'reasonml-to-js', 'tailwind-to-css-tokens', 'tailwind-config-to-css-tokens',
  'typescript-to-js', 'flow-to-typescript', 'kotlin-to-typescript', 'swift-to-typescript',
  'scss-to-css', 'less-to-css', 'stylus-to-css',
  // CSS/JS converters
  'css-to-js-style', 'css-vars-to-json-tokens',
  // HTTP/API converters
  'url-to-curl', 'curl-to-fetch', 'curl-to-httpie', 'http-headers-to-json',
  'api-response-to-mock', 'jwt-to-json-claims', 'jwt-to-json',
  // DevOps converters
  'docker-compose-to-k8s', 'terraform-to-pulumi', 'helm-to-k8s', 'helm-values-to-kubernetes',
  'terraform-to-cloudformation', 'env-to-docker-compose', 'env-to-json', 'env-to-yaml',
  'kubernetes-to-kustomize', 'sql-to-nosql',
  // Schema converters
  'openapi2-to-openapi3', 'openapi-to-typescript', 'openapi-to-graphql',
  'graphql-to-typescript', 'json-schema-to-typescript', 'json-schema-to-zod',
  'sql-ddl-to-json-schema', 'avro-to-json-schema', 'graphql-to-openapi',
  'json-schema-to-joi', 'json-schema-to-openapi',
  // Formatters & validators
  'format-xml', 'minify-xml', 'format-html', 'minify-html', 'format-css', 'minify-css',
  'format-javascript', 'minify-javascript', 'format-sql', 'validate-json', 'validate-xml',
  'validate-yaml', 'jwt-decoder', 'jwt-encoder', 'cron-parser', 'url-parser', 'base-converter',
  // Encoding tools (bidirectional)
  'html-entity-encode', 'punycode-encode', 'utf8-to-utf16',
  // Diff tools
  'json-diff', 'schema-diff', 'openapi-diff', 'line-diff',
]);

// ============================================================================
// TYPE CHECK
// ============================================================================

/** Check if a tool ID belongs to code/data category */
export function isCodeTool(toolId: string): boolean {
  return CODE_TOOL_IDS.has(toolId);
}

// ============================================================================
// LANGUAGE MAPPING
// ============================================================================

/** Language info for code editor tools */
interface LanguageInfo {
  input: string;
  output: string;
  bidirectional: boolean;
}

/** Get language configuration for a code tool */
export function getCodeLanguageInfo(toolId: string): LanguageInfo {
  const mapping: Record<string, LanguageInfo> = {
    // JSON conversions
    'json-to-yaml': { input: 'json', output: 'yaml', bidirectional: true },
    'yaml-to-json': { input: 'yaml', output: 'json', bidirectional: true },
    'json-to-xml': { input: 'json', output: 'xml', bidirectional: true },
    'xml-to-json': { input: 'xml', output: 'json', bidirectional: true },
    'json-to-csv': { input: 'json', output: 'csv', bidirectional: true },
    'csv-to-json': { input: 'csv', output: 'json', bidirectional: true },
    'json-to-toml': { input: 'json', output: 'toml', bidirectional: true },
    'toml-to-json': { input: 'toml', output: 'json', bidirectional: true },
    'json-to-properties': { input: 'json', output: 'properties', bidirectional: true },
    'properties-to-json': { input: 'properties', output: 'json', bidirectional: true },
    'tsv-to-json': { input: 'tsv', output: 'json', bidirectional: true },
    'tsv-to-csv': { input: 'tsv', output: 'csv', bidirectional: true },
    'ini-to-json': { input: 'ini', output: 'json', bidirectional: true },
    'hocon-to-json': { input: 'hocon', output: 'json', bidirectional: true },
    'ndjson-to-json': { input: 'ndjson', output: 'json', bidirectional: true },
    'json-to-jsonl': { input: 'json', output: 'jsonl', bidirectional: true },
    'json-to-url-params': { input: 'json', output: 'plaintext', bidirectional: true },
    'json-to-form-data': { input: 'json', output: 'plaintext', bidirectional: true },
    // Binary format converters
    'bson-to-json': { input: 'bson', output: 'json', bidirectional: true },
    'messagepack-to-json': { input: 'msgpack', output: 'json', bidirectional: true },
    'avro-to-json': { input: 'avro', output: 'json', bidirectional: false },
    'parquet-to-json': { input: 'parquet', output: 'json', bidirectional: true },
    'protobuf-to-json': { input: 'protobuf', output: 'json', bidirectional: true },
    // Code transpilers
    'dart-to-js': { input: 'dart', output: 'javascript', bidirectional: false },
    'dart-to-javascript': { input: 'dart', output: 'javascript', bidirectional: false },
    'reasonml-to-js': { input: 'reason', output: 'javascript', bidirectional: false },
    'reasonml-to-javascript': { input: 'reason', output: 'javascript', bidirectional: false },
    'tailwind-to-css-tokens': { input: 'javascript', output: 'css', bidirectional: false },
    'tailwind-config-to-css-tokens': { input: 'javascript', output: 'css', bidirectional: false },
    'typescript-to-js': { input: 'typescript', output: 'javascript', bidirectional: false },
    'typescript-to-javascript': { input: 'typescript', output: 'javascript', bidirectional: false },
    'coffeescript-to-javascript': { input: 'coffeescript', output: 'javascript', bidirectional: false },
    'flow-to-typescript': { input: 'javascript', output: 'typescript', bidirectional: false },
    'kotlin-to-typescript': { input: 'kotlin', output: 'typescript', bidirectional: false },
    'swift-to-typescript': { input: 'swift', output: 'typescript', bidirectional: false },
    'scss-to-css': { input: 'scss', output: 'css', bidirectional: false },
    'less-to-css': { input: 'less', output: 'css', bidirectional: false },
    'stylus-to-css': { input: 'stylus', output: 'css', bidirectional: false },
    // CSS/JS converters
    'css-to-js-style': { input: 'css', output: 'javascript', bidirectional: true },
    'css-vars-to-json-tokens': { input: 'css', output: 'json', bidirectional: true },
    // DevOps converters
    'docker-compose-to-k8s': { input: 'yaml', output: 'yaml', bidirectional: false },
    'terraform-to-pulumi': { input: 'hcl', output: 'typescript', bidirectional: false },
    'helm-to-k8s': { input: 'yaml', output: 'yaml', bidirectional: false },
    'helm-values-to-kubernetes': { input: 'yaml', output: 'yaml', bidirectional: false },
    'terraform-to-cloudformation': { input: 'hcl', output: 'yaml', bidirectional: false },
    'env-to-docker-compose': { input: 'env', output: 'yaml', bidirectional: true },
    'env-to-json': { input: 'env', output: 'json', bidirectional: true },
    'env-to-yaml': { input: 'env', output: 'yaml', bidirectional: true },
    'kubernetes-to-kustomize': { input: 'yaml', output: 'yaml', bidirectional: false },
    'sql-to-nosql': { input: 'sql', output: 'javascript', bidirectional: false },
    // API tools
    'api-response-to-mock': { input: 'json', output: 'json', bidirectional: false },
    'jwt-to-json': { input: 'plaintext', output: 'json', bidirectional: false },
    'jwt-to-json-claims': { input: 'plaintext', output: 'json', bidirectional: false },
    'base64-to-json': { input: 'plaintext', output: 'json', bidirectional: false },
    'url-to-curl': { input: 'plaintext', output: 'plaintext', bidirectional: false },
    'curl-to-fetch': { input: 'plaintext', output: 'javascript', bidirectional: false },
    'curl-to-httpie': { input: 'plaintext', output: 'plaintext', bidirectional: false },
    'http-headers-to-json': { input: 'plaintext', output: 'json', bidirectional: false },
    // Encoding tools
    'html-entity-encode': { input: 'plaintext', output: 'plaintext', bidirectional: true },
    'punycode-encode': { input: 'plaintext', output: 'plaintext', bidirectional: true },
    'utf8-to-utf16': { input: 'plaintext', output: 'plaintext', bidirectional: true },
    // Schema converters
    'openapi2-to-openapi3': { input: 'yaml', output: 'yaml', bidirectional: false },
    'openapi-to-typescript': { input: 'yaml', output: 'typescript', bidirectional: false },
    'openapi-to-graphql': { input: 'yaml', output: 'graphql', bidirectional: false },
    'graphql-to-typescript': { input: 'graphql', output: 'typescript', bidirectional: false },
    'graphql-to-openapi': { input: 'graphql', output: 'yaml', bidirectional: false },
    'json-schema-to-typescript': { input: 'json', output: 'typescript', bidirectional: false },
    'json-schema-to-zod': { input: 'json', output: 'typescript', bidirectional: false },
    'json-schema-to-joi': { input: 'json', output: 'javascript', bidirectional: false },
    'json-schema-to-openapi': { input: 'json', output: 'yaml', bidirectional: false },
    'sql-ddl-to-json-schema': { input: 'sql', output: 'json', bidirectional: false },
    'avro-to-json-schema': { input: 'avro', output: 'json', bidirectional: false },
    // Formatters (non-bidirectional)
    'format-json': { input: 'json', output: 'json', bidirectional: false },
    'minify-json': { input: 'json', output: 'json', bidirectional: false },
    'format-xml': { input: 'xml', output: 'xml', bidirectional: false },
    'minify-xml': { input: 'xml', output: 'xml', bidirectional: false },
    'format-html': { input: 'html', output: 'html', bidirectional: false },
    'minify-html': { input: 'html', output: 'html', bidirectional: false },
    'format-css': { input: 'css', output: 'css', bidirectional: false },
    'minify-css': { input: 'css', output: 'css', bidirectional: false },
    'format-javascript': { input: 'javascript', output: 'javascript', bidirectional: false },
    'minify-javascript': { input: 'javascript', output: 'javascript', bidirectional: false },
    'format-sql': { input: 'sql', output: 'sql', bidirectional: false },
    // Validators & decoders (one-way)
    'jwt-decoder': { input: 'plaintext', output: 'json', bidirectional: false },
    'jwt-encoder': { input: 'json', output: 'plaintext', bidirectional: false },
    'url-parser': { input: 'plaintext', output: 'json', bidirectional: false },
    'cron-parser': { input: 'plaintext', output: 'json', bidirectional: false },
    // Diff tools
    'json-diff': { input: 'json', output: 'diff', bidirectional: false },
    'schema-diff': { input: 'json', output: 'diff', bidirectional: false },
    'openapi-diff': { input: 'yaml', output: 'diff', bidirectional: false },
    'line-diff': { input: 'plaintext', output: 'diff', bidirectional: false },
  };
  
  return mapping[toolId] || { input: 'plaintext', output: 'plaintext', bidirectional: false };
}

// ============================================================================
// CSS PREVIEW CONFIG
// ============================================================================

/** Tool IDs that should show CSS preview */
const CSS_OUTPUT_TOOLS = new Set([
  'scss-to-css', 'less-to-css', 'stylus-to-css',
  'format-css', 'minify-css',
  'tailwind-to-css-tokens', 'tailwind-config-to-css-tokens',
]);

/** Check if tool should show CSS preview */
export function shouldShowCssPreview(toolId: string): boolean {
  return CSS_OUTPUT_TOOLS.has(toolId);
}

// ============================================================================
// PROPS
// ============================================================================

export interface CodeExecutorProps {
  tool: ToolMetadata;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CodeExecutor({ tool }: CodeExecutorProps) {
  const langInfo = getCodeLanguageInfo(tool.id);
  const showCssPreview = shouldShowCssPreview(tool.id);

  // Create transform function
  const transform = React.useCallback(
    async (input: string, options?: Record<string, unknown>): Promise<string> => {
      const result = await executeClientTool(tool.id, input, options);
      if (!result.success) {
        throw new Error(result.error || 'Conversion failed');
      }
      return typeof result.output === 'string' 
        ? result.output 
        : JSON.stringify(result.output, null, 2);
    },
    [tool.id]
  );

  return (
    <CodeEditorTool
      toolId={tool.id}
      inputLanguage={langInfo.input}
      outputLanguage={langInfo.output}
      bidirectional={langInfo.bidirectional}
      transform={transform}
      toolOptions={tool.options}
      showCssPreview={showCssPreview}
    />
  );
}

export default CodeExecutor;
