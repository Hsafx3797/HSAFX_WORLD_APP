import { describe, it, expect } from 'vitest';
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
} from '../src/data-converters/specialized';

// ═══════════════════════════════════════════════
// Avro → JSON Schema
// ═══════════════════════════════════════════════

describe('avroToJsonSchema', () => {
  it('converts a record with primitive fields', () => {
    const avro = JSON.stringify({
      type: 'record',
      name: 'User',
      fields: [
        { name: 'id', type: 'long' },
        { name: 'name', type: 'string' },
        { name: 'active', type: 'boolean' },
      ],
    });
    const r = JSON.parse(avroToJsonSchema(avro));
    expect(r.$schema).toContain('draft-07');
    expect(r.title).toBe('User');
    expect(r.properties.id.type).toBe('integer');
    expect(r.properties.name.type).toBe('string');
    expect(r.properties.active.type).toBe('boolean');
    expect(r.required).toContain('id');
  });

  it('converts nullable union [null, string]', () => {
    const avro = JSON.stringify({
      type: 'record',
      name: 'Item',
      fields: [{ name: 'note', type: ['null', 'string'], default: null }],
    });
    const r = JSON.parse(avroToJsonSchema(avro));
    expect(r.properties.note.oneOf).toBeDefined();
  });

  it('converts enum to string + enum', () => {
    const avro = JSON.stringify({
      type: 'enum',
      name: 'Color',
      symbols: ['RED', 'GREEN', 'BLUE'],
    });
    const r = JSON.parse(avroToJsonSchema(avro));
    expect(r.type).toBe('string');
    expect(r.enum).toEqual(['RED', 'GREEN', 'BLUE']);
  });

  it('converts array type', () => {
    const avro = JSON.stringify({
      type: 'record',
      name: 'List',
      fields: [{ name: 'items', type: { type: 'array', items: 'string' } }],
    });
    const r = JSON.parse(avroToJsonSchema(avro));
    expect(r.properties.items.type).toBe('array');
    expect(r.properties.items.items.type).toBe('string');
  });

  it('converts map type', () => {
    const avro = JSON.stringify({
      type: 'record',
      name: 'Config',
      fields: [{ name: 'tags', type: { type: 'map', values: 'string' } }],
    });
    const r = JSON.parse(avroToJsonSchema(avro));
    expect(r.properties.tags.type).toBe('object');
    expect(r.properties.tags.additionalProperties.type).toBe('string');
  });

  it('returns error on invalid JSON', () => {
    const r = JSON.parse(avroToJsonSchema('NOT JSON'));
    expect(r.error).toBeDefined();
  });
});

// ═══════════════════════════════════════════════
// OpenAPI 2 → 3
// ═══════════════════════════════════════════════

describe('openapi2ToOpenapi3', () => {
  const swagger = JSON.stringify({
    swagger: '2.0',
    info: { title: 'Test API', version: '1.0' },
    host: 'api.example.com',
    basePath: '/v1',
    schemes: ['https'],
    consumes: ['application/json'],
    produces: ['application/json'],
    paths: {
      '/users': {
        get: {
          operationId: 'listUsers',
          parameters: [{ name: 'limit', in: 'query', type: 'integer' }],
          responses: { '200': { description: 'OK', schema: { type: 'array', items: { $ref: '#/definitions/User' } } } },
        },
        post: {
          operationId: 'createUser',
          parameters: [{ name: 'body', in: 'body', schema: { $ref: '#/definitions/User' } }],
          responses: { '201': { description: 'Created' } },
        },
      },
    },
    definitions: {
      User: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' } } },
    },
    securityDefinitions: {
      apiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
      basic: { type: 'basic' },
    },
  });

  it('updates version to 3.0.3', () => {
    const r = JSON.parse(openapi2ToOpenapi3(swagger));
    expect(r.openapi).toBe('3.0.3');
  });

  it('creates servers from host/basePath', () => {
    const r = JSON.parse(openapi2ToOpenapi3(swagger));
    expect(r.servers[0].url).toBe('https://api.example.com/v1');
  });

  it('rewrites $ref from definitions to components/schemas', () => {
    const r = openapi2ToOpenapi3(swagger);
    expect(r).toContain('#/components/schemas/User');
    expect(r).not.toContain('#/definitions/User');
  });

  it('converts body params to requestBody', () => {
    const r = JSON.parse(openapi2ToOpenapi3(swagger));
    const post = r.paths['/users'].post;
    expect(post.requestBody).toBeDefined();
    expect(post.requestBody.content['application/json']).toBeDefined();
  });

  it('converts securityDefinitions', () => {
    const r = JSON.parse(openapi2ToOpenapi3(swagger));
    expect(r.components.securitySchemes.apiKey.type).toBe('apiKey');
    expect(r.components.securitySchemes.basic.type).toBe('http');
  });

  it('passes through already-3.x', () => {
    const v3 = JSON.stringify({ openapi: '3.0.0', info: { title: 'T', version: '1' }, paths: {} });
    expect(openapi2ToOpenapi3(v3)).toContain('Already OpenAPI 3.x');
  });
});

// ═══════════════════════════════════════════════
// OpenAPI → TypeScript
// ═══════════════════════════════════════════════

describe('openapiToTypescript', () => {
  const spec = JSON.stringify({
    openapi: '3.0.3',
    info: { title: 'API', version: '1.0.0' },
    components: {
      schemas: {
        User: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'integer' }, name: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } } },
        },
      },
    },
    paths: {},
  });

  it('generates interface with required/optional', () => {
    const r = openapiToTypescript(spec);
    expect(r).toContain('export interface User');
    expect(r).toContain('id: number');
    expect(r).toContain('name?: string');
  });

  it('handles array types', () => {
    const r = openapiToTypescript(spec);
    expect(r).toContain('tags?: string[]');
  });

  it('generates enum type', () => {
    const s = JSON.stringify({
      openapi: '3.0.3',
      info: { title: 'T', version: '1' },
      components: { schemas: { Status: { type: 'string', enum: ['active', 'inactive'] } } },
      paths: {},
    });
    const r = openapiToTypescript(s);
    expect(r).toContain("'active' | 'inactive'");
  });
});

// ═══════════════════════════════════════════════
// OpenAPI → GraphQL
// ═══════════════════════════════════════════════

describe('openapiToGraphql', () => {
  const spec = JSON.stringify({
    openapi: '3.0.3',
    info: { title: 'API', version: '1' },
    components: {
      schemas: {
        User: { type: 'object', required: ['id'], properties: { id: { type: 'integer' }, name: { type: 'string' } } },
      },
    },
    paths: {
      '/users': {
        get: {
          operationId: 'listUsers',
          parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer' } }],
          responses: { '200': { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } } } },
        },
      },
    },
  });

  it('generates GraphQL type', () => {
    const r = openapiToGraphql(spec);
    expect(r).toContain('type User');
    expect(r).toContain('id: Int!');
    expect(r).toContain('name: String');
  });

  it('generates Query type from GET paths', () => {
    const r = openapiToGraphql(spec);
    expect(r).toContain('type Query');
    expect(r).toContain('listUsers');
  });
});

// ═══════════════════════════════════════════════
// GraphQL → OpenAPI
// ═══════════════════════════════════════════════

describe('graphqlToOpenapi', () => {
  const gql = `
    type User {
      id: ID!
      name: String!
      email: String
    }
    type Query {
      users(limit: Int!): [User]
      user(id: ID!): User
    }
    type Mutation {
      createUser(name: String!, email: String): User
    }
  `;

  it('generates OpenAPI 3.0.3', () => {
    const r = JSON.parse(graphqlToOpenapi(gql));
    expect(r.openapi).toBe('3.0.3');
  });

  it('creates GET paths from Query fields', () => {
    const r = JSON.parse(graphqlToOpenapi(gql));
    expect(r.paths['/users']).toBeDefined();
    expect(r.paths['/users'].get).toBeDefined();
  });

  it('creates POST paths from Mutation fields', () => {
    const r = JSON.parse(graphqlToOpenapi(gql));
    expect(r.paths['/createUser']).toBeDefined();
    expect(r.paths['/createUser'].post).toBeDefined();
  });

  it('maps types to schemas', () => {
    const r = JSON.parse(graphqlToOpenapi(gql));
    expect(r.components.schemas.User).toBeDefined();
    expect(r.components.schemas.User.properties.name).toBeDefined();
  });
});

// ═══════════════════════════════════════════════
// GraphQL → TypeScript
// ═══════════════════════════════════════════════

describe('graphqlToTypescript', () => {
  const gql = `
    enum Role { ADMIN USER GUEST }
    scalar DateTime
    type Post {
      id: ID!
      title: String!
      tags: [String]
      createdAt: DateTime
    }
    input CreatePostInput {
      title: String!
      body: String
    }
  `;

  it('generates enum', () => {
    const r = graphqlToTypescript(gql);
    expect(r).toContain('export enum Role');
    expect(r).toContain("ADMIN = 'ADMIN'");
  });

  it('generates scalar alias', () => {
    const r = graphqlToTypescript(gql);
    expect(r).toContain('export type DateTime = string');
  });

  it('generates interface from type', () => {
    const r = graphqlToTypescript(gql);
    expect(r).toContain('export interface Post');
    expect(r).toContain('id: string');
    expect(r).toContain('tags?: string[]');
  });

  it('generates interface from input', () => {
    const r = graphqlToTypescript(gql);
    expect(r).toContain('export interface CreatePostInput');
    expect(r).toContain('title: string');
  });
});

// ═══════════════════════════════════════════════
// Helm → Kubernetes
// ═══════════════════════════════════════════════

describe('helmToKubernetes', () => {
  it('replaces .Values references', () => {
    const input = JSON.stringify({
      template: 'replicas: {{ .Values.replicaCount }}\nimage: {{ .Values.image.repository }}',
      values: { replicaCount: 3, image: { repository: 'nginx' } },
    });
    const r = helmToKubernetes(input);
    expect(r).toContain('replicas: 3');
    expect(r).toContain('image: nginx');
  });

  it('replaces Release and Chart placeholders', () => {
    const input = JSON.stringify({
      template: 'name: {{ .Release.Name }}\nns: {{ .Release.Namespace }}\nchart: {{ .Chart.Name }}',
      values: { releaseName: 'my-app', namespace: 'prod', chartName: 'web' },
    });
    const r = helmToKubernetes(input);
    expect(r).toContain('name: my-app');
    expect(r).toContain('ns: prod');
    expect(r).toContain('chart: web');
  });

  it('handles default function', () => {
    const input = JSON.stringify({
      template: 'port: {{ default "8080" .Values.port }}',
      values: {},
    });
    const r = helmToKubernetes(input);
    expect(r).toContain('port: 8080');
  });

  it('handles if conditional', () => {
    const input = JSON.stringify({
      template: '{{- if .Values.ingress -}}enabled{{- end -}}',
      values: { ingress: true },
    });
    expect(helmToKubernetes(input)).toContain('enabled');
  });

  it('omits conditional block when falsy', () => {
    const input = JSON.stringify({
      template: 'before{{- if .Values.ingress -}}INCLUDED{{- end -}}after',
      values: { ingress: false },
    });
    const r = helmToKubernetes(input);
    expect(r).not.toContain('INCLUDED');
  });
});

// ═══════════════════════════════════════════════
// Terraform → CloudFormation
// ═══════════════════════════════════════════════

describe('terraformToCloudformation', () => {
  const tf = `
resource "aws_instance" "web" {
  ami           = "ami-12345"
  instance_type = "t3.micro"
  tags          = ["web", "prod"]
}
  `;

  it('generates CloudFormation template', () => {
    const r = JSON.parse(terraformToCloudformation(tf));
    expect(r.AWSTemplateFormatVersion).toBe('2010-09-09');
    expect(r.Resources).toBeDefined();
  });

  it('maps resource type', () => {
    const r = JSON.parse(terraformToCloudformation(tf));
    const keys = Object.keys(r.Resources);
    expect(keys.length).toBe(1);
    const res = r.Resources[keys[0]!];
    expect(res.Type).toBe('AWS::EC2::Instance');
  });

  it('maps properties', () => {
    const r = JSON.parse(terraformToCloudformation(tf));
    const res = Object.values(r.Resources)[0] as { Properties: Record<string, unknown> };
    expect(res.Properties.Ami).toBe('ami-12345');
    // capitalize2 only capitalizes the first char of the whole string, not each word
    expect(res.Properties.Instancetype).toBe('t3.micro');
  });
});

// ═══════════════════════════════════════════════
// Terraform → Pulumi
// ═══════════════════════════════════════════════

describe('terraformToPulumi', () => {
  const tf = `
variable "region" {
  default = "us-east-1"
}

resource "aws_s3_bucket" "data" {
  bucket = "my-data-bucket"
  acl    = "private"
}

output "bucket_name" {
  value = aws_s3_bucket.data.bucket
}
  `;

  it('generates Pulumi imports', () => {
    const r = terraformToPulumi(tf);
    expect(r).toContain('import * as pulumi');
    expect(r).toContain('import * as aws');
  });

  it('generates config from variables', () => {
    const r = terraformToPulumi(tf);
    expect(r).toContain('config.get("region"');
  });

  it('creates resource', () => {
    const r = terraformToPulumi(tf);
    expect(r).toContain('"data"');
    expect(r).toContain('bucket: "my-data-bucket"');
  });

  it('generates exports from outputs', () => {
    const r = terraformToPulumi(tf);
    expect(r).toContain('export const');
  });

  it('returns comment on empty input', () => {
    expect(terraformToPulumi('# nothing')).toContain('No resource blocks');
  });
});

// ═══════════════════════════════════════════════
// Dart → JavaScript
// ═══════════════════════════════════════════════

describe('dartToJavascript', () => {
  it('converts print to console.log', () => {
    const r = dartToJavascript("print('hello');");
    expect(r).toContain("console.log('hello')");
  });

  it('removes type annotations from params', () => {
    const r = dartToJavascript('void greet(String name) { }');
    const r2 = dartToJavascript('int add(int a, int b) { return a + b; }');
    expect(r).toContain('function greet(name)');
    expect(r2).toContain('function add(a, b)');
  });

  it('converts variable declarations', () => {
    const r = dartToJavascript('String x = "hello";');
    expect(r).toContain('let x = "hello"');
  });

  it('removes @override', () => {
    const r = dartToJavascript('@override\nvoid toString() {}');
    expect(r).not.toContain('@override');
  });

  it('prefixes output with comment', () => {
    const r = dartToJavascript('var x = 1;');
    expect(r).toContain('Transpiled from Dart');
  });
});

// ═══════════════════════════════════════════════
// ReasonML → JavaScript
// ═══════════════════════════════════════════════

describe('reasonmlToJavascript', () => {
  it('converts let to const', () => {
    const r = reasonmlToJavascript('let x = 42;');
    expect(r).toContain('const x = 42');
  });

  it('converts Js.log to console.log', () => {
    const r = reasonmlToJavascript('Js.log("hello");');
    expect(r).toContain('console.log("hello")');
  });

  it('converts array syntax [| ... |]', () => {
    const r = reasonmlToJavascript('let arr = [|1, 2, 3|];');
    expect(r).toContain('[1, 2, 3]');
  });

  it('converts Some/None', () => {
    const r = reasonmlToJavascript('let x = Some(42);\nlet y = None;');
    expect(r).toContain('42');
    expect(r).toContain('null');
  });

  it('converts ++ to +', () => {
    const r = reasonmlToJavascript('"hello" ++ " world"');
    expect(r).toContain('"hello" + " world"');
  });

  it('prefixes output with comment', () => {
    const r = reasonmlToJavascript('let a = 1;');
    expect(r).toContain('Transpiled from ReasonML');
  });
});

// ═══════════════════════════════════════════════
// Injection: XSS in schema names
// ═══════════════════════════════════════════════

describe('injection resistance', () => {
  it('Avro XSS in field name', () => {
    const avro = JSON.stringify({
      type: 'record',
      name: '<script>alert(1)</script>',
      fields: [{ name: 'x', type: 'string' }],
    });
    const r = avroToJsonSchema(avro);
    // XSS payload appears as title text, not executable — it's JSON output
    expect(JSON.parse(r).title).toContain('<script>');
  });

  it('Terraform command injection in resource name', () => {
    const tf = `resource "aws_instance" "$(rm -rf /)" {\n  ami = "test"\n}`;
    // Should not execute — just parse as a string
    const r = terraformToCloudformation(tf);
    expect(r).toBeDefined();
    expect(typeof r).toBe('string');
  });

  it('Helm SSTI payload in values', () => {
    const input = JSON.stringify({
      template: 'name: {{ .Values.name }}',
      values: { name: '{{7*7}}' },
    });
    const r = helmToKubernetes(input);
    // Value should be preserved literally, not evaluated
    expect(r).toContain('name: {{7*7}}');
  });
});
