import { z } from "zod";

import { ApiharborKeyHealthChecksSchema, ApiharborKeysSchema } from "@app/db/schemas";
import { readLimit, writeLimit } from "@app/server/config/rateLimiter";
import { verifyAuth } from "@app/server/plugins/auth/verify-auth";
import { ApiKeyProvider } from "@app/services/api-key/api-key-types";
import { AuthMode } from "@app/services/auth/auth-type";

// Response shape: everything except the encrypted secret, plus a masked preview.
export const sanitizedApiKeySchema = ApiharborKeysSchema.omit({ encryptedApiKey: true }).extend({
  maskedKey: z.string().optional()
});

const validationResultSchema = z.object({
  status: z.string(),
  httpStatus: z.number().optional(),
  latencyMs: z.number(),
  message: z.string().optional(),
  quotaLimit: z.number().optional(),
  quotaRemaining: z.number().optional()
});

const genericValidationConfigSchema = z.object({
  testUrl: z.string().url().trim(),
  headerName: z.string().trim().optional(),
  headerScheme: z.string().trim().optional()
});

export const registerApiKeyRouter = async (server: FastifyZodProvider) => {
  server.route({
    method: "POST",
    url: "/",
    config: { rateLimit: writeLimit },
    onRequest: verifyAuth([AuthMode.JWT, AuthMode.IDENTITY_ACCESS_TOKEN]),
    schema: {
      operationId: "createApiKey",
      body: z.object({
        projectId: z.string().trim(),
        name: z.string().trim().min(1),
        provider: z.nativeEnum(ApiKeyProvider),
        apiKey: z.string().trim().min(1),
        description: z.string().trim().max(1000).optional(),
        monitoringEnabled: z.boolean().optional(),
        validationConfig: genericValidationConfigSchema.optional()
      }),
      response: { 200: z.object({ apiKey: sanitizedApiKeySchema }) }
    },
    handler: async (req) => {
      const apiKey = await server.services.apiKey.createApiKey({
        actor: req.permission.type,
        actorId: req.permission.id,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        ...req.body
      });
      return { apiKey };
    }
  });

  server.route({
    method: "GET",
    url: "/",
    config: { rateLimit: readLimit },
    onRequest: verifyAuth([AuthMode.JWT, AuthMode.IDENTITY_ACCESS_TOKEN]),
    schema: {
      operationId: "listApiKeys",
      querystring: z.object({
        projectId: z.string().trim()
      }),
      response: { 200: z.object({ apiKeys: sanitizedApiKeySchema.array() }) }
    },
    handler: async (req) => {
      const apiKeys = await server.services.apiKey.listApiKeys({
        actor: req.permission.type,
        actorId: req.permission.id,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        projectId: req.query.projectId
      });
      return { apiKeys };
    }
  });

  server.route({
    method: "GET",
    url: "/:apiKeyId",
    config: { rateLimit: readLimit },
    onRequest: verifyAuth([AuthMode.JWT, AuthMode.IDENTITY_ACCESS_TOKEN]),
    schema: {
      operationId: "getApiKeyById",
      params: z.object({ apiKeyId: z.string().trim() }),
      response: { 200: z.object({ apiKey: sanitizedApiKeySchema }) }
    },
    handler: async (req) => {
      const apiKey = await server.services.apiKey.getApiKeyById({
        actor: req.permission.type,
        actorId: req.permission.id,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        apiKeyId: req.params.apiKeyId
      });
      return { apiKey };
    }
  });

  server.route({
    method: "POST",
    url: "/:apiKeyId/reveal",
    config: { rateLimit: writeLimit },
    onRequest: verifyAuth([AuthMode.JWT, AuthMode.IDENTITY_ACCESS_TOKEN]),
    schema: {
      operationId: "revealApiKey",
      params: z.object({ apiKeyId: z.string().trim() }),
      response: { 200: z.object({ apiKey: sanitizedApiKeySchema, value: z.string() }) }
    },
    handler: async (req) => {
      const { apiKey, value } = await server.services.apiKey.revealApiKey({
        actor: req.permission.type,
        actorId: req.permission.id,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        apiKeyId: req.params.apiKeyId
      });
      return { apiKey, value };
    }
  });

  server.route({
    method: "POST",
    url: "/:apiKeyId/validate",
    config: { rateLimit: writeLimit },
    onRequest: verifyAuth([AuthMode.JWT, AuthMode.IDENTITY_ACCESS_TOKEN]),
    schema: {
      operationId: "validateApiKey",
      params: z.object({ apiKeyId: z.string().trim() }),
      response: { 200: z.object({ apiKey: sanitizedApiKeySchema, result: validationResultSchema }) }
    },
    handler: async (req) => {
      const { apiKey, result } = await server.services.apiKey.validateApiKey({
        actor: req.permission.type,
        actorId: req.permission.id,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        apiKeyId: req.params.apiKeyId
      });
      return { apiKey, result };
    }
  });

  server.route({
    method: "GET",
    url: "/:apiKeyId/health-checks",
    config: { rateLimit: readLimit },
    onRequest: verifyAuth([AuthMode.JWT, AuthMode.IDENTITY_ACCESS_TOKEN]),
    schema: {
      operationId: "getApiKeyHealthChecks",
      params: z.object({ apiKeyId: z.string().trim() }),
      querystring: z.object({ limit: z.coerce.number().min(1).max(100).default(20) }),
      response: { 200: z.object({ healthChecks: ApiharborKeyHealthChecksSchema.array() }) }
    },
    handler: async (req) => {
      const healthChecks = await server.services.apiKey.getApiKeyHealthHistory({
        actor: req.permission.type,
        actorId: req.permission.id,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        apiKeyId: req.params.apiKeyId,
        limit: req.query.limit
      });
      return { healthChecks };
    }
  });

  server.route({
    method: "PATCH",
    url: "/:apiKeyId",
    config: { rateLimit: writeLimit },
    onRequest: verifyAuth([AuthMode.JWT, AuthMode.IDENTITY_ACCESS_TOKEN]),
    schema: {
      operationId: "updateApiKey",
      params: z.object({ apiKeyId: z.string().trim() }),
      body: z.object({
        name: z.string().trim().min(1).optional(),
        description: z.string().trim().max(1000).optional(),
        apiKey: z.string().trim().min(1).optional(),
        monitoringEnabled: z.boolean().optional(),
        validationConfig: genericValidationConfigSchema.optional(),
        monthlyBudgetUsd: z.number().min(0).nullable().optional()
      }),
      response: { 200: z.object({ apiKey: sanitizedApiKeySchema }) }
    },
    handler: async (req) => {
      const apiKey = await server.services.apiKey.updateApiKey({
        actor: req.permission.type,
        actorId: req.permission.id,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        apiKeyId: req.params.apiKeyId,
        ...req.body
      });
      return { apiKey };
    }
  });

  server.route({
    method: "DELETE",
    url: "/:apiKeyId",
    config: { rateLimit: writeLimit },
    onRequest: verifyAuth([AuthMode.JWT, AuthMode.IDENTITY_ACCESS_TOKEN]),
    schema: {
      operationId: "deleteApiKey",
      params: z.object({ apiKeyId: z.string().trim() }),
      response: { 200: z.object({ apiKey: sanitizedApiKeySchema }) }
    },
    handler: async (req) => {
      const apiKey = await server.services.apiKey.deleteApiKey({
        actor: req.permission.type,
        actorId: req.permission.id,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        apiKeyId: req.params.apiKeyId
      });
      return { apiKey };
    }
  });

  // ---- Usage & spend ----
  const usageRowSchema = z.object({
    usageDate: z.string(),
    requests: z.number(),
    tokens: z.number().nullable(),
    costCents: z.number()
  });

  server.route({
    method: "POST",
    url: "/:apiKeyId/usage",
    config: { rateLimit: writeLimit },
    onRequest: verifyAuth([AuthMode.JWT, AuthMode.IDENTITY_ACCESS_TOKEN]),
    schema: {
      operationId: "recordApiKeyUsage",
      params: z.object({ apiKeyId: z.string().trim() }),
      body: z.object({
        requests: z.number().min(0).optional(),
        tokens: z.number().min(0).optional(),
        costUsd: z.number().min(0).optional(),
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional()
      }),
      response: { 200: z.object({ usage: usageRowSchema }) }
    },
    handler: async (req) => {
      return server.services.apiKey.recordUsage({
        actor: req.permission.type,
        actorId: req.permission.id,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        apiKeyId: req.params.apiKeyId,
        ...req.body
      });
    }
  });

  server.route({
    method: "GET",
    url: "/:apiKeyId/usage",
    config: { rateLimit: readLimit },
    onRequest: verifyAuth([AuthMode.JWT, AuthMode.IDENTITY_ACCESS_TOKEN]),
    schema: {
      operationId: "getApiKeyUsage",
      params: z.object({ apiKeyId: z.string().trim() }),
      querystring: z.object({ days: z.coerce.number().min(1).max(365).default(30) }),
      response: { 200: z.object({ usage: usageRowSchema.array() }) }
    },
    handler: async (req) => {
      return server.services.apiKey.getApiKeyUsage({
        actor: req.permission.type,
        actorId: req.permission.id,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        apiKeyId: req.params.apiKeyId,
        days: req.query.days
      });
    }
  });

  server.route({
    method: "GET",
    url: "/spend",
    config: { rateLimit: readLimit },
    onRequest: verifyAuth([AuthMode.JWT, AuthMode.IDENTITY_ACCESS_TOKEN]),
    schema: {
      operationId: "getApiKeySpendSummary",
      querystring: z.object({
        projectId: z.string().trim(),
        days: z.coerce.number().min(1).max(365).default(30)
      }),
      response: {
        200: z.object({
          summary: z.object({
            totalCostCents: z.number(),
            totalRequests: z.number(),
            counts: z.object({
              total: z.number(),
              healthy: z.number(),
              invalid: z.number(),
              error: z.number(),
              unknown: z.number(),
              lowQuota: z.number()
            }),
            byProvider: z
              .object({ provider: z.string(), costCents: z.number(), requests: z.number() })
              .array(),
            byDay: z.object({ date: z.string(), costCents: z.number(), requests: z.number() }).array(),
            keys: z
              .object({
                id: z.string(),
                name: z.string(),
                provider: z.string(),
                healthStatus: z.string(),
                monthlyBudgetCents: z.number().nullable(),
                spentCents: z.number(),
                requests: z.number(),
                overBudget: z.boolean()
              })
              .array()
          })
        })
      }
    },
    handler: async (req) => {
      return server.services.apiKey.getSpendSummary({
        actor: req.permission.type,
        actorId: req.permission.id,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        projectId: req.query.projectId,
        days: req.query.days
      });
    }
  });
};
