/**
 * Convert Engine — Universal Data Format Converter
 *
 * Routes "from → to" pairs to the correct data-converter function.
 * Covers JSON, YAML, XML, CSV, TSV, TOML, INI, Properties,
 * ENV, NDJSON, Markdown table, URL params, Form data, Base64.
 */

import type { Engine, ConvertEngineOptions, EngineInput, EngineResult, ValidationOutcome } from './types';
import {
  jsonToNdjson, ndjsonToJson,
  jsonToUrlParams, urlParamsToJson,
  jsonToFormData,
  jsonToQueryString, queryStringToJson,
  base64ToJson, jsonToBase64,
} from '../data-converters/json';
import {
  jsonToYaml, yamlToJson,
} from '../data-converters/yaml';
import {
  jsonToXml, xmlToJson,
} from '../data-converters/xml';
import {
  jsonToCsv, csvToJson,
  jsonToTsv, tsvToJson,
  tsvToCsv, csvToTsv,
  jsonToMarkdownTable, markdownTableToJson,
} from '../data-converters/csv';
import {
  jsonToToml, tomlToJson, hoconToJson,
  iniToJson, jsonToIni,
  jsonToProperties, propertiesToJson,
  envToJson, jsonToEnv,
  envToDockerCompose,
} from '../data-converters/format';
import { envToYaml } from '../data-converters/yaml';
import {
  typeScriptToJavaScript,
  scssToCss,
  es6ToCommonJs,
  commonJsToEs6,
  lessToCss,
  stylusToCss,
  postcssToCss,
  cssToJsObjects,
  cssVariablesToJson,
  tailwindToCssTokens,
  markdownToHtml,
  viewAst,
} from '../data-converters/code';
import {
  avroToJsonSchema,
  openapi2ToOpenapi3,
  openapiToTypescript,
  openapiToGraphql,
  graphqlToOpenapi,
  graphqlToTypescript,
  helmToKubernetes,
  terraformToCloudformation,
  terraformToPulumi,
  dartToJavascript,
  reasonmlToJavascript,
  sqlToNoSql,
  kubernetesToKustomize,
  jsonSchemaToOpenapi,
} from '../data-converters/specialized';
import {
  dockerComposeToKubernetes,
  kubernetesToDockerCompose,
  lintDockerfile,
  lintKubernetesYaml,
} from '../data-converters/devops';

// ---------------------------------------------------------------------------
// Route table: "from:to" → function(input) → string
// ---------------------------------------------------------------------------

type ConvertFn = (input: string) => string;

function buildRoutes(): Record<string, ConvertFn> {
  return {
    'json:yaml':       jsonToYaml,
    'yaml:json':       yamlToJson,
    'json:xml':        (input) => jsonToXml(input),
    'xml:json':        xmlToJson,
    'json:csv':        jsonToCsv,
    'csv:json':        (input) => csvToJson(input),
    'json:tsv':        jsonToTsv,
    'tsv:json':        (input) => tsvToJson(input),
    'tsv:csv':         tsvToCsv,
    'csv:tsv':         csvToTsv,
    'json:ndjson':     jsonToNdjson,
    'ndjson:json':     ndjsonToJson,
    'json:toml':       jsonToToml,
    'toml:json':       tomlToJson,
    'hocon:json':      hoconToJson,
    'json:ini':        jsonToIni,
    'ini:json':        iniToJson,
    'json:properties': jsonToProperties,
    'properties:json': propertiesToJson,
    'json:env':        jsonToEnv,
    'env:json':        envToJson,
    'json:url-params': jsonToUrlParams,
    'url-params:json': urlParamsToJson,
    'json:form-data':  jsonToFormData,
    'json:query-string': jsonToQueryString,
    'query-string:json': queryStringToJson,
    'json:base64':     jsonToBase64,
    'base64:json':     base64ToJson,
    'json:markdown-table': jsonToMarkdownTable,
    'markdown-table:json': markdownTableToJson,

    // Code transpilation
    'typescript:javascript': typeScriptToJavaScript,
    'scss:css':              scssToCss,
    'less:css':              lessToCss,
    'stylus:css':            stylusToCss,
    'postcss:css':           postcssToCss,
    'css:js-objects':        cssToJsObjects,
    'css-variables:json':    cssVariablesToJson,
    'tailwind:css':          tailwindToCssTokens,
    'es6:commonjs':          es6ToCommonJs,
    'commonjs:es6':          commonJsToEs6,

    // Schema converters
    'avro:json-schema':      avroToJsonSchema,
    'openapi2:openapi3':     openapi2ToOpenapi3,
    'openapi:typescript':    openapiToTypescript,
    'openapi:graphql':       openapiToGraphql,
    'graphql:openapi':       graphqlToOpenapi,
    'graphql:typescript':    graphqlToTypescript,
    'json-schema:openapi':   jsonSchemaToOpenapi,

    // DevOps converters
    'docker-compose:kubernetes': (input) => dockerComposeToKubernetes(input, 'app'),
    'kubernetes:docker-compose': kubernetesToDockerCompose,
    'helm:kubernetes':           helmToKubernetes,
    'terraform:cloudformation':  terraformToCloudformation,
    'terraform:pulumi':          terraformToPulumi,
    'kubernetes:kustomize':      kubernetesToKustomize,
    'sql:nosql':                 sqlToNoSql,
    'env:yaml':                  envToYaml,
    'env:docker-compose':        envToDockerCompose,

    // Code converters (specialized)
    'dart:javascript':       dartToJavascript,
    'reasonml:javascript':   reasonmlToJavascript,

    // Formatting shortcuts
    'markdown:html':         markdownToHtml,

    // Developer
    'code:ast':              viewAst,

    // Linting
    'dockerfile:lint':       lintDockerfile,
    'kubernetes:lint':       lintKubernetesYaml,
  };
}

const ROUTES = buildRoutes();
const FORMATS = [...new Set(
  Object.keys(ROUTES).flatMap(k => k.split(':')),
)].sort();

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const convertEngine: Engine<ConvertEngineOptions> = {
  name: 'convert',
  description: 'Convert between data formats (JSON, YAML, XML, CSV, TOML, INI, etc.).',

  validate(options: ConvertEngineOptions): ValidationOutcome {
    const errors: string[] = [];
    const key = `${options.from}:${options.to}`;
    if (!ROUTES[key]) {
      errors.push(
        `No conversion route "${options.from}" → "${options.to}". ` +
        `Available formats: ${FORMATS.join(', ')}`,
      );
    }
    return errors.length ? { valid: false, errors } : { valid: true };
  },

  execute(input: EngineInput, options: ConvertEngineOptions): EngineResult {
    const text = typeof input === 'string' ? input : JSON.stringify(input, null, 2);
    const key = `${options.from}:${options.to}`;
    const fn = ROUTES[key];
    if (!fn) {
      return { output: text, metadata: { error: `No route: ${key}` } };
    }
    return {
      output: fn(text),
      metadata: { from: options.from, to: options.to },
    };
  },
};
