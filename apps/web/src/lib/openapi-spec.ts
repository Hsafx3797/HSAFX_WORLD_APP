/**
 * OpenAPI 3.1 specification for HSAFX WORLD B2B API v1.
 * Served at GET /api/v1/openapi.json
 *
 * Covers all public REST API endpoints. Internal and admin routes are excluded.
 */

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'HSAFX WORLD API',
    version: '2.0.0',
    description:
      'B2B REST API for HSAFX WORLD — 30 parameterized engines for text, data, and media processing. Authenticate with an API key, execute engines, and retrieve results via async jobs.',
    contact: { email: 'support@hsafx.world' },
    license: { name: 'Proprietary' },
  },
  servers: [
    { url: 'https://api.hsafx.world', description: 'Production' },
    { url: 'https://api.staging.hsafx.world', description: 'Staging' },
    { url: 'http://localhost:3000', description: 'Development' },
  ],

  // ── Security ────────────────────────────────────────────────
  security: [{ bearerAuth: [] }],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http' as const,
        scheme: 'bearer',
        bearerFormat: 'API Key',
        description:
          'Include your API key in the Authorization header: `Authorization: Bearer hsafx_live_sk_…`',
      },
    },
    schemas: {
      // ── Shared ──
      ApiMeta: {
        type: 'object',
        properties: {
          requestId: { type: 'string', format: 'uuid' },
          rateLimitRemaining: { type: 'integer' },
          rateLimitReset: { type: 'integer', description: 'Unix timestamp' },
        },
      },
      ErrorResponse: {
        type: 'object',
        required: ['success', 'error'],
        properties: {
          success: { type: 'boolean', const: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', description: 'Machine-readable error code (e.g. A001, E001)' },
              message: { type: 'string' },
            },
          },
          meta: { $ref: '#/components/schemas/ApiMeta' },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          limit: { type: 'integer' },
          offset: { type: 'integer' },
          hasMore: { type: 'boolean' },
        },
      },

      // ── Engines ──
      EngineSummary: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Engine identifier (e.g. "case", "image", "convert")' },
          description: { type: 'string' },
          runtime: { type: 'string', enum: ['node', 'rust', 'python'], description: 'Execution backend' },
          inputType: { type: 'string', enum: ['text', 'json', 'file'] },
          outputType: { type: 'string', enum: ['text', 'json', 'file'] },
        },
      },
      EngineSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          runtime: { type: 'string', enum: ['node', 'rust', 'python'] },
          options: {
            type: 'object',
            description: 'JSON Schema describing the engine options',
            additionalProperties: true,
          },
        },
      },

      // ── Execute / Jobs ──
      EngineExecuteRequest: {
        type: 'object',
        required: ['input'],
        properties: {
          input: {
            oneOf: [
              { type: 'string', description: 'Text input for text/data engines' },
              { type: 'object', description: 'JSON input for structured engines' },
            ],
          },
          options: {
            type: 'object',
            additionalProperties: true,
            description: 'Engine-specific options (see GET /api/v1/engine/{name}/schema for available keys)',
          },
        },
      },
      EngineExecuteResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', const: true },
          data: {
            type: 'object',
            properties: {
              jobId: { type: 'string', format: 'uuid' },
              engineName: { type: 'string' },
              status: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'] },
              idempotencyKey: { type: 'string' },
            },
          },
          meta: { $ref: '#/components/schemas/ApiMeta' },
        },
      },
      JobStatus: {
        type: 'object',
        properties: {
          success: { type: 'boolean', const: true },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              engineName: { type: 'string' },
              status: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'] },
              createdAt: { type: 'string', format: 'date-time' },
              completedAt: { type: 'string', format: 'date-time', nullable: true },
              error: { type: 'string', nullable: true },
            },
          },
          meta: { $ref: '#/components/schemas/ApiMeta' },
        },
      },
      JobResult: {
        type: 'object',
        properties: {
          success: { type: 'boolean', const: true },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              status: { type: 'string' },
              output: { description: 'Engine output — shape depends on the engine' },
              outputType: { type: 'string' },
              executionTime: { type: 'integer', description: 'Duration in milliseconds' },
            },
          },
          meta: { $ref: '#/components/schemas/ApiMeta' },
        },
      },

      // ── Account ──
      AccountInfo: {
        type: 'object',
        properties: {
          success: { type: 'boolean', const: true },
          data: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              email: { type: 'string', format: 'email' },
              name: { type: 'string' },
              plan: { type: 'string' },
              subscriptionStatus: { type: 'string', nullable: true },
            },
          },
        },
      },
      UsageStats: {
        type: 'object',
        properties: {
          success: { type: 'boolean', const: true },
          data: {
            type: 'object',
            properties: {
              period: { type: 'string', enum: ['day', 'week', 'month'] },
              totalExecutions: { type: 'integer' },
              engineBreakdown: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    engineName: { type: 'string' },
                    count: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },

      // ── Billing ──
      Balance: {
        type: 'object',
        properties: {
          success: { type: 'boolean', const: true },
          data: {
            type: 'object',
            properties: {
              balance: { type: 'integer' },
              lifetimeEarned: { type: 'integer' },
              lifetimeSpent: { type: 'integer' },
            },
          },
        },
      },
      TransactionList: {
        type: 'object',
        properties: {
          success: { type: 'boolean', const: true },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                type: {
                  type: 'string',
                  enum: [
                    'purchase', 'engine_usage', 'refund', 'admin_adjustment',
                    'subscription_grant', 'reward', 'bonus', 'expiry',
                  ],
                },
                amount: { type: 'integer' },
                description: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
          },
          pagination: { $ref: '#/components/schemas/PaginationMeta' },
        },
      },
      SubscriptionInfo: {
        type: 'object',
        properties: {
          success: { type: 'boolean', const: true },
          data: {
            type: 'object',
            properties: {
              plan: { type: 'string' },
              status: { type: 'string' },
              currentPeriodStart: { type: 'string', format: 'date-time' },
              currentPeriodEnd: { type: 'string', format: 'date-time' },
              cancelAtPeriodEnd: { type: 'boolean' },
            },
            nullable: true,
          },
        },
      },

      // ── Key Rotation ──
      KeyRotateResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', const: true },
          data: {
            type: 'object',
            properties: {
              newKey: { type: 'string', description: 'New API key plaintext — shown once' },
              newKeyId: { type: 'string' },
              newKeyPrefix: { type: 'string' },
              oldKeyId: { type: 'string' },
              oldKeyExpiresAt: {
                type: 'string',
                format: 'date-time',
                description: 'Old key remains valid until this time (24h grace)',
              },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    parameters: {
      LimitParam: {
        name: 'limit',
        in: 'query' as const,
        schema: { type: 'integer', minimum: 1, maximum: 200, default: 50 },
        description: 'Number of items per page',
      },
      OffsetParam: {
        name: 'offset',
        in: 'query' as const,
        schema: { type: 'integer', minimum: 0, default: 0 },
        description: 'Number of items to skip',
      },
    },
  },

  // ── Paths ───────────────────────────────────────────────────
  paths: {
    // ── Health ──
    '/api/v1/health': {
      get: {
        summary: 'Health check',
        operationId: 'getHealth',
        tags: ['Health'],
        security: [],
        responses: {
          '200': {
            description: 'API is operational',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    version: { type: 'string' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ── Engines ──
    '/api/v1/engines': {
      get: {
        summary: 'List all engines',
        operationId: 'listEngines',
        tags: ['Engines'],
        description: 'Returns all 28 available engines with their names, descriptions, and runtime backends.',
        responses: {
          '200': {
            description: 'List of engines',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', const: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/EngineSummary' },
                    },
                    meta: { $ref: '#/components/schemas/ApiMeta' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/engine/{name}': {
      post: {
        summary: 'Execute an engine',
        operationId: 'executeEngine',
        tags: ['Engines'],
        description: 'Submit input and options to one of 30 engines. Returns a job ID for async result retrieval.',
        parameters: [
          {
            name: 'name',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Engine name (e.g. "case", "image", "convert", "hash")',
          },
          {
            name: 'Idempotency-Key',
            in: 'header',
            schema: { type: 'string', format: 'uuid' },
            description: 'Idempotency key to prevent duplicate executions (24h TTL)',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EngineExecuteRequest' },
            },
          },
        },
        responses: {
          '202': {
            description: 'Job accepted for processing',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/EngineExecuteResponse' },
              },
            },
          },
          '404': {
            description: 'Engine not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '422': {
            description: 'Invalid input or options for this engine',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '429': {
            description: 'Rate limit exceeded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/engine/{name}/schema': {
      get: {
        summary: 'Get engine option schema',
        operationId: 'getEngineSchema',
        tags: ['Engines'],
        description: 'Returns the full JSON Schema for an engine\'s options, including all available parameters and their types.',
        parameters: [
          {
            name: 'name',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Engine name',
          },
        ],
        responses: {
          '200': {
            description: 'Engine schema',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', const: true },
                    data: { $ref: '#/components/schemas/EngineSchema' },
                    meta: { $ref: '#/components/schemas/ApiMeta' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Engine not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },

    // ── Jobs ──
    '/api/v1/jobs/{jobId}': {
      get: {
        summary: 'Get job status',
        operationId: 'getJobStatus',
        tags: ['Jobs'],
        parameters: [
          {
            name: 'jobId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Job status',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/JobStatus' },
              },
            },
          },
          '404': {
            description: 'Job not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/jobs/{jobId}/result': {
      get: {
        summary: 'Get job result',
        operationId: 'getJobResult',
        tags: ['Jobs'],
        parameters: [
          {
            name: 'jobId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Completed job result',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/JobResult' },
              },
            },
          },
          '404': {
            description: 'Job not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '409': {
            description: 'Job is not yet completed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },

    // ── Account ──
    '/api/v1/account': {
      get: {
        summary: 'Get account info',
        operationId: 'getAccount',
        tags: ['Account'],
        responses: {
          '200': {
            description: 'Account details for the API key owner',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AccountInfo' },
              },
            },
          },
        },
      },
    },
    '/api/v1/account/usage': {
      get: {
        summary: 'Get usage statistics',
        operationId: 'getUsage',
        tags: ['Account'],
        parameters: [
          {
            name: 'period',
            in: 'query',
            schema: { type: 'string', enum: ['day', 'week', 'month'], default: 'month' },
            description: 'Time period for usage stats',
          },
          {
            name: 'engineName',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter usage by specific engine name',
          },
        ],
        responses: {
          '200': {
            description: 'Usage statistics',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UsageStats' },
              },
            },
          },
        },
      },
    },

    // ── Webhooks ──
    '/api/v1/account/webhooks': {
      get: {
        summary: 'List webhook endpoints',
        operationId: 'listWebhooks',
        tags: ['Webhooks'],
        responses: {
          '200': {
            description: 'Registered webhook endpoints',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', const: true },
                    data: {
                      type: 'object',
                      properties: {
                        webhooks: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string', format: 'uuid' },
                              url: { type: 'string', format: 'uri' },
                              events: { type: 'array', items: { type: 'string' } },
                              isActive: { type: 'boolean' },
                              description: { type: 'string', nullable: true },
                              createdAt: { type: 'string', format: 'date-time' },
                            },
                          },
                        },
                      },
                    },
                    meta: { $ref: '#/components/schemas/ApiMeta' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Register a webhook endpoint',
        operationId: 'createWebhook',
        tags: ['Webhooks'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['url'],
                properties: {
                  url: { type: 'string', format: 'uri', description: 'HTTPS callback URL' },
                  events: {
                    type: 'array',
                    items: { type: 'string', enum: ['job.completed', 'job.failed'] },
                    default: ['job.completed', 'job.failed'],
                  },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Webhook created — signing secret is returned only once',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', const: true },
                    data: {
                      type: 'object',
                      properties: {
                        webhook: { type: 'object' },
                        secret: { type: 'string', description: 'HMAC signing secret (shown only at creation)' },
                      },
                    },
                    meta: { $ref: '#/components/schemas/ApiMeta' },
                  },
                },
              },
            },
          },
          '409': {
            description: 'Maximum webhook limit reached',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      delete: {
        summary: 'Delete a webhook endpoint',
        operationId: 'deleteWebhook',
        tags: ['Webhooks'],
        parameters: [
          {
            name: 'id',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'Webhook endpoint ID to delete',
          },
        ],
        responses: {
          '200': {
            description: 'Webhook deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', const: true },
                    data: {
                      type: 'object',
                      properties: {
                        deleted: { type: 'boolean' },
                        id: { type: 'string', format: 'uuid' },
                      },
                    },
                    meta: { $ref: '#/components/schemas/ApiMeta' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Webhook not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },

    // ── Billing ──
    '/api/v1/billing/balance': {
      get: {
        summary: 'Get balance',
        operationId: 'getBalance',
        tags: ['Billing'],
        responses: {
          '200': {
            description: 'Current balance',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Balance' },
              },
            },
          },
        },
      },
    },
    '/api/v1/billing/transactions': {
      get: {
        summary: 'List transactions',
        operationId: 'listTransactions',
        tags: ['Billing'],
        parameters: [
          { $ref: '#/components/parameters/LimitParam' },
          { $ref: '#/components/parameters/OffsetParam' },
          {
            name: 'type',
            in: 'query',
            schema: {
              type: 'string',
              enum: [
                'purchase', 'engine_usage', 'refund', 'admin_adjustment',
                'subscription_grant', 'reward', 'bonus', 'expiry',
              ],
            },
            description: 'Filter by transaction type',
          },
        ],
        responses: {
          '200': {
            description: 'Paginated transaction list',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TransactionList' },
              },
            },
          },
        },
      },
    },
    '/api/v1/billing/subscription': {
      get: {
        summary: 'Get subscription info',
        operationId: 'getSubscription',
        tags: ['Billing'],
        description: 'Returns subscription plan and status.',
        responses: {
          '200': {
            description: 'Current subscription details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SubscriptionInfo' },
              },
            },
          },
        },
      },
    },

    // ── Key Management ──
    '/api/v1/keys/rotate': {
      post: {
        summary: 'Rotate API key',
        operationId: 'rotateKey',
        tags: ['Keys'],
        description:
          'Generates a new API key and sets a 24-hour grace period on the current key. The new key plaintext is returned once — store it securely.',
        responses: {
          '200': {
            description: 'Key rotated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/KeyRotateResponse' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
  },

  tags: [
    { name: 'Health', description: 'Health check endpoints' },
    { name: 'Engines', description: 'Discover and execute 30 parameterized engines' },
    { name: 'Jobs', description: 'Async job status and results' },
    { name: 'Account', description: 'Account info and usage statistics' },
    { name: 'Webhooks', description: 'Webhook endpoint management for job notifications' },
    { name: 'Billing', description: 'Balance, transactions, subscription' },
    { name: 'Keys', description: 'API key management' },
  ],
} as const;
