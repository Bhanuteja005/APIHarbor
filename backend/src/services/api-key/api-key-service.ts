/* eslint-disable no-await-in-loop */
import { ForbiddenError } from "@casl/ability";

import { ActionProjectType, TApiharborKeys, TApiharborKeysUpdate } from "@app/db/schemas";
import { TPermissionServiceFactory } from "@app/ee/services/permission/permission-service-types";
import { ProjectPermissionActions, ProjectPermissionSub } from "@app/ee/services/permission/project-permission";
import { BadRequestError, NotFoundError } from "@app/lib/errors";
import { logger } from "@app/lib/logger";

import { TKmsServiceFactory } from "../kms/kms-service";
import { KmsDataKey } from "../kms/kms-types";
import { TApiKeyDALFactory } from "./api-key-dal";
import { validateApiKeyWithProvider } from "./api-key-provider-fns";
import {
  ApiKeyHealthStatus,
  ApiKeyProvider,
  MAX_API_KEYS_PER_PROJECT,
  TApiKeyGenericValidationConfig,
  TCreateApiKeyDTO,
  TDeleteApiKeyDTO,
  TGetApiKeyDTO,
  TGetApiKeyHealthHistoryDTO,
  TGetApiKeyUsageDTO,
  TGetSpendSummaryDTO,
  TListApiKeysDTO,
  TRecordApiKeyUsageDTO,
  TRevealApiKeyDTO,
  TUpdateApiKeyDTO,
  TValidateApiKeyDTO
} from "./api-key-types";

const toCents = (usd: number) => Math.round(usd * 100);
const todayUtc = () => new Date().toISOString().slice(0, 10);
const daysAgoUtc = (days: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
};
const startOfMonthUtc = () => `${new Date().toISOString().slice(0, 7)}-01`;

type TApiKeyServiceFactoryDep = {
  apiKeyDAL: TApiKeyDALFactory;
  permissionService: Pick<TPermissionServiceFactory, "getProjectPermission">;
  kmsService: Pick<TKmsServiceFactory, "createCipherPairWithDataKey">;
};

export type TApiKeyServiceFactory = ReturnType<typeof apiKeyServiceFactory>;

// Show enough to identify a key but never the whole secret.
const maskKey = (plaintext: string): string => {
  if (!plaintext) return "";
  if (plaintext.length <= 8) return "••••";
  return `${plaintext.slice(0, 3)}…${plaintext.slice(-4)}`;
};

// Strip the encrypted blob so it never reaches the API surface.
const sanitizeApiKey = <T extends { encryptedApiKey?: unknown }>(apiKey: T) => {
  const { encryptedApiKey, ...rest } = apiKey;
  return rest;
};

export const apiKeyServiceFactory = ({ apiKeyDAL, permissionService, kmsService }: TApiKeyServiceFactoryDep) => {
  const getProjectCipher = (projectId: string) =>
    kmsService.createCipherPairWithDataKey({ type: KmsDataKey.SecretManager, projectId });

  const decryptValue = async (apiKey: Pick<TApiharborKeys, "projectId" | "encryptedApiKey">) => {
    const { decryptor } = await getProjectCipher(apiKey.projectId);
    return decryptor({ cipherTextBlob: apiKey.encryptedApiKey }).toString();
  };

  // Validate against the provider, persist a health-check row + denormalized latest status on the key.
  const runAndRecordHealthCheck = async (apiKey: TApiharborKeys, plaintext: string) => {
    const result = await validateApiKeyWithProvider(
      apiKey.provider as ApiKeyProvider,
      plaintext,
      apiKey.validationConfig as TApiKeyGenericValidationConfig | null
    );

    await apiKeyDAL.createHealthCheck({
      apiKeyId: apiKey.id,
      status: result.status,
      httpStatus: result.httpStatus ?? null,
      latencyMs: result.latencyMs,
      message: result.message ?? null
    });

    const updated = await apiKeyDAL.updateById(apiKey.id, {
      healthStatus: result.status,
      lastCheckedAt: new Date(),
      lastLatencyMs: result.latencyMs,
      lastHttpStatus: result.httpStatus ?? null,
      lastMessage: result.message ?? null,
      quotaLimit: result.quotaLimit ?? null,
      quotaRemaining: result.quotaRemaining ?? null
    });

    return { apiKey: updated, result };
  };

  const assertProjectPermission = async (
    projectId: string,
    action: ProjectPermissionActions,
    actor: TCreateApiKeyDTO["actor"],
    actorId: string,
    actorAuthMethod: TCreateApiKeyDTO["actorAuthMethod"],
    actorOrgId: string
  ) => {
    const { permission } = await permissionService.getProjectPermission({
      actor,
      actorId,
      projectId,
      actorAuthMethod,
      actorOrgId,
      actionProjectType: ActionProjectType.Any
    });
    ForbiddenError.from(permission).throwUnlessCan(action, ProjectPermissionSub.ApiHarborKeys);
  };

  const createApiKey = async ({
    actor,
    actorId,
    actorOrgId,
    actorAuthMethod,
    projectId,
    name,
    provider,
    apiKey,
    description,
    monitoringEnabled,
    validationConfig
  }: TCreateApiKeyDTO) => {
    await assertProjectPermission(projectId, ProjectPermissionActions.Create, actor, actorId, actorAuthMethod, actorOrgId);

    // Free tier is capped at MAX_API_KEYS_PER_PROJECT keys per project. Enterprise
    // (private) deployments can raise this via the API_KEYS_PER_PROJECT_LIMIT env var.
    const keyLimit = Number(process.env.API_KEYS_PER_PROJECT_LIMIT) || MAX_API_KEYS_PER_PROJECT;
    const existingCount = await apiKeyDAL.countDocuments({ projectId });
    if (existingCount >= keyLimit) {
      throw new BadRequestError({
        message: `This project has reached its limit of ${keyLimit} API keys. Contact the APIHarbor team for a private deployment to store more.`
      });
    }

    // Resolve the project's KMS cipher. On a project whose SecretManager KMS key
    // has never been initialized, the first call performs a lazy setup that can
    // transiently fail on an internal cleanup — so retry once (the key is created
    // on the first pass, so the retry resolves cleanly).
    let encryptor: Awaited<ReturnType<typeof getProjectCipher>>["encryptor"];
    try {
      ({ encryptor } = await getProjectCipher(projectId));
    } catch (err) {
      logger.warn(
        {
          err,
          name: (err as { name?: string })?.name,
          detail: (err as { error?: { message?: string; detail?: string } })?.error
        },
        `apiKey: project cipher init failed once, retrying [projectId=${projectId}]`
      );
      ({ encryptor } = await getProjectCipher(projectId));
    }
    const encryptedApiKey = encryptor({ plainText: Buffer.from(apiKey) }).cipherTextBlob;

    const created = await apiKeyDAL.create({
      projectId,
      name,
      provider,
      description,
      encryptedApiKey,
      monitoringEnabled: monitoringEnabled ?? true,
      validationConfig: validationConfig ?? null,
      healthStatus: ApiKeyHealthStatus.Unknown
    });

    // Best-effort initial validation so the key shows a real health status right away.
    try {
      const { apiKey: validated } = await runAndRecordHealthCheck(created, apiKey);
      return sanitizeApiKey({ ...validated, maskedKey: maskKey(apiKey) });
    } catch (err) {
      logger.warn({ err, apiKeyId: created.id }, `apiKey: initial validation failed [apiKeyId=${created.id}]`);
      return sanitizeApiKey({ ...created, maskedKey: maskKey(apiKey) });
    }
  };

  const listApiKeys = async ({ actor, actorId, actorOrgId, actorAuthMethod, projectId }: TListApiKeysDTO) => {
    await assertProjectPermission(projectId, ProjectPermissionActions.Read, actor, actorId, actorAuthMethod, actorOrgId);

    const apiKeys = await apiKeyDAL.find({ projectId });
    apiKeys.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const { decryptor } = await getProjectCipher(projectId);
    return apiKeys.map((k) => {
      let maskedKey = "";
      try {
        maskedKey = maskKey(decryptor({ cipherTextBlob: k.encryptedApiKey }).toString());
      } catch (err) {
        logger.warn({ err, apiKeyId: k.id }, `apiKey: failed to derive masked key [apiKeyId=${k.id}]`);
      }
      return sanitizeApiKey({ ...k, maskedKey });
    });
  };

  const getApiKeyById = async ({ actor, actorId, actorOrgId, actorAuthMethod, apiKeyId }: TGetApiKeyDTO) => {
    const apiKey = await apiKeyDAL.findById(apiKeyId);
    if (!apiKey) throw new NotFoundError({ message: `API key with ID '${apiKeyId}' not found` });
    await assertProjectPermission(
      apiKey.projectId,
      ProjectPermissionActions.Read,
      actor,
      actorId,
      actorAuthMethod,
      actorOrgId
    );
    const maskedKey = maskKey(await decryptValue(apiKey));
    return sanitizeApiKey({ ...apiKey, maskedKey });
  };

  const revealApiKey = async ({ actor, actorId, actorOrgId, actorAuthMethod, apiKeyId }: TRevealApiKeyDTO) => {
    const apiKey = await apiKeyDAL.findById(apiKeyId);
    if (!apiKey) throw new NotFoundError({ message: `API key with ID '${apiKeyId}' not found` });
    await assertProjectPermission(
      apiKey.projectId,
      ProjectPermissionActions.Read,
      actor,
      actorId,
      actorAuthMethod,
      actorOrgId
    );
    const value = await decryptValue(apiKey);
    await apiKeyDAL.updateById(apiKey.id, { lastUsedAt: new Date() });
    return { apiKey: sanitizeApiKey(apiKey), value };
  };

  const updateApiKey = async ({
    actor,
    actorId,
    actorOrgId,
    actorAuthMethod,
    apiKeyId,
    name,
    description,
    apiKey: newApiKey,
    monitoringEnabled,
    validationConfig,
    monthlyBudgetUsd
  }: TUpdateApiKeyDTO) => {
    const existing = await apiKeyDAL.findById(apiKeyId);
    if (!existing) throw new NotFoundError({ message: `API key with ID '${apiKeyId}' not found` });
    await assertProjectPermission(
      existing.projectId,
      ProjectPermissionActions.Edit,
      actor,
      actorId,
      actorAuthMethod,
      actorOrgId
    );

    const updateData: TApiharborKeysUpdate = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (monitoringEnabled !== undefined) updateData.monitoringEnabled = monitoringEnabled;
    if (validationConfig !== undefined) updateData.validationConfig = validationConfig;
    if (monthlyBudgetUsd !== undefined)
      updateData.monthlyBudgetCents = monthlyBudgetUsd === null ? null : toCents(monthlyBudgetUsd);
    if (newApiKey) {
      const { encryptor } = await getProjectCipher(existing.projectId);
      updateData.encryptedApiKey = encryptor({ plainText: Buffer.from(newApiKey) }).cipherTextBlob;
      updateData.healthStatus = ApiKeyHealthStatus.Unknown;
    }

    let updated = await apiKeyDAL.updateById(apiKeyId, updateData);

    if (newApiKey) {
      try {
        const res = await runAndRecordHealthCheck(updated, newApiKey);
        updated = res.apiKey;
      } catch (err) {
        logger.warn({ err, apiKeyId }, `apiKey: re-validation after update failed [apiKeyId=${apiKeyId}]`);
      }
    }

    const maskedKey = maskKey(await decryptValue(updated));
    return sanitizeApiKey({ ...updated, maskedKey });
  };

  const deleteApiKey = async ({ actor, actorId, actorOrgId, actorAuthMethod, apiKeyId }: TDeleteApiKeyDTO) => {
    const existing = await apiKeyDAL.findById(apiKeyId);
    if (!existing) throw new NotFoundError({ message: `API key with ID '${apiKeyId}' not found` });
    await assertProjectPermission(
      existing.projectId,
      ProjectPermissionActions.Delete,
      actor,
      actorId,
      actorAuthMethod,
      actorOrgId
    );
    const deleted = await apiKeyDAL.deleteById(apiKeyId);
    return sanitizeApiKey(deleted);
  };

  const validateApiKey = async ({ actor, actorId, actorOrgId, actorAuthMethod, apiKeyId }: TValidateApiKeyDTO) => {
    const apiKey = await apiKeyDAL.findById(apiKeyId);
    if (!apiKey) throw new NotFoundError({ message: `API key with ID '${apiKeyId}' not found` });
    await assertProjectPermission(
      apiKey.projectId,
      ProjectPermissionActions.Read,
      actor,
      actorId,
      actorAuthMethod,
      actorOrgId
    );
    const plaintext = await decryptValue(apiKey);
    const { apiKey: updated, result } = await runAndRecordHealthCheck(apiKey, plaintext);
    return { apiKey: sanitizeApiKey({ ...updated, maskedKey: maskKey(plaintext) }), result };
  };

  const getApiKeyHealthHistory = async ({
    actor,
    actorId,
    actorOrgId,
    actorAuthMethod,
    apiKeyId,
    limit
  }: TGetApiKeyHealthHistoryDTO) => {
    const apiKey = await apiKeyDAL.findById(apiKeyId);
    if (!apiKey) throw new NotFoundError({ message: `API key with ID '${apiKeyId}' not found` });
    await assertProjectPermission(
      apiKey.projectId,
      ProjectPermissionActions.Read,
      actor,
      actorId,
      actorAuthMethod,
      actorOrgId
    );
    return apiKeyDAL.findHealthChecks(apiKeyId, limit ?? 20);
  };

  // Record usage/spend for a key (requests, tokens, cost). Aggregated per UTC day.
  const recordUsage = async ({
    actor,
    actorId,
    actorOrgId,
    actorAuthMethod,
    apiKeyId,
    requests,
    tokens,
    costUsd,
    date
  }: TRecordApiKeyUsageDTO) => {
    const apiKey = await apiKeyDAL.findById(apiKeyId);
    if (!apiKey) throw new NotFoundError({ message: `API key with ID '${apiKeyId}' not found` });
    await assertProjectPermission(
      apiKey.projectId,
      ProjectPermissionActions.Edit,
      actor,
      actorId,
      actorAuthMethod,
      actorOrgId
    );
    const row = await apiKeyDAL.recordUsage(apiKeyId, {
      usageDate: date || todayUtc(),
      requests: Math.max(0, Math.round(requests ?? 0)),
      tokens: tokens === undefined ? null : Math.max(0, Math.round(tokens)),
      costCents: costUsd === undefined ? 0 : Math.max(0, toCents(costUsd))
    });
    return {
      usage: {
        usageDate: row.usageDate,
        requests: row.requests,
        tokens: row.tokens ?? null,
        costCents: row.costCents
      }
    };
  };

  const getApiKeyUsage = async ({
    actor,
    actorId,
    actorOrgId,
    actorAuthMethod,
    apiKeyId,
    days
  }: TGetApiKeyUsageDTO) => {
    const apiKey = await apiKeyDAL.findById(apiKeyId);
    if (!apiKey) throw new NotFoundError({ message: `API key with ID '${apiKeyId}' not found` });
    await assertProjectPermission(
      apiKey.projectId,
      ProjectPermissionActions.Read,
      actor,
      actorId,
      actorAuthMethod,
      actorOrgId
    );
    const rows = await apiKeyDAL.findUsageByKey(apiKeyId, daysAgoUtc(days ?? 30));
    return {
      usage: rows.map((r) => ({
        usageDate: typeof r.usageDate === "string" ? r.usageDate : new Date(r.usageDate).toISOString().slice(0, 10),
        requests: Number(r.requests),
        tokens: r.tokens === null || r.tokens === undefined ? null : Number(r.tokens),
        costCents: Number(r.costCents)
      }))
    };
  };

  // Project-wide spend + health rollup that powers the dashboard stat tiles and charts.
  const getSpendSummary = async ({
    actor,
    actorId,
    actorOrgId,
    actorAuthMethod,
    projectId,
    days
  }: TGetSpendSummaryDTO) => {
    await assertProjectPermission(projectId, ProjectPermissionActions.Read, actor, actorId, actorAuthMethod, actorOrgId);

    const trailingDays = days ?? 30;
    const keys = await apiKeyDAL.find({ projectId });
    const monthUsage = await apiKeyDAL.findUsageByProject(projectId, startOfMonthUtc());
    const trailingUsage = await apiKeyDAL.findUsageByProject(projectId, daysAgoUtc(trailingDays));

    // --- per-key spend (this month) ---
    const spentByKey = new Map<string, { costCents: number; requests: number }>();
    for (const u of monthUsage) {
      const agg = spentByKey.get(u.apiKeyId as string) ?? { costCents: 0, requests: 0 };
      agg.costCents += Number(u.costCents);
      agg.requests += Number(u.requests);
      spentByKey.set(u.apiKeyId as string, agg);
    }

    // --- spend by provider (this month) ---
    const providerAgg = new Map<string, { costCents: number; requests: number }>();
    for (const u of monthUsage) {
      const p = (u.provider as string) || "generic";
      const agg = providerAgg.get(p) ?? { costCents: 0, requests: 0 };
      agg.costCents += Number(u.costCents);
      agg.requests += Number(u.requests);
      providerAgg.set(p, agg);
    }

    // --- spend by day (trailing window) ---
    const dayAgg = new Map<string, { costCents: number; requests: number }>();
    for (const u of trailingUsage) {
      const d =
        typeof u.usageDate === "string" ? u.usageDate : new Date(u.usageDate).toISOString().slice(0, 10);
      const agg = dayAgg.get(d) ?? { costCents: 0, requests: 0 };
      agg.costCents += Number(u.costCents);
      agg.requests += Number(u.requests);
      dayAgg.set(d, agg);
    }

    // --- health counts for the stat tiles ---
    const counts = { total: keys.length, healthy: 0, invalid: 0, error: 0, unknown: 0, lowQuota: 0 };
    for (const k of keys) {
      if (k.healthStatus === ApiKeyHealthStatus.Healthy) counts.healthy += 1;
      else if (k.healthStatus === ApiKeyHealthStatus.Invalid) counts.invalid += 1;
      else if (k.healthStatus === ApiKeyHealthStatus.Error) counts.error += 1;
      else counts.unknown += 1;
      if (k.quotaLimit && k.quotaRemaining !== null && k.quotaRemaining !== undefined) {
        if (k.quotaRemaining / k.quotaLimit <= 0.1) counts.lowQuota += 1;
      }
    }

    const totalCostCents = monthUsage.reduce((sum, u) => sum + Number(u.costCents), 0);
    const totalRequests = monthUsage.reduce((sum, u) => sum + Number(u.requests), 0);

    return {
      summary: {
        totalCostCents,
        totalRequests,
        counts,
        byProvider: [...providerAgg.entries()]
          .map(([provider, v]) => ({ provider, ...v }))
          .sort((a, b) => b.costCents - a.costCents),
        byDay: [...dayAgg.entries()].map(([date, v]) => ({ date, ...v })).sort((a, b) => a.date.localeCompare(b.date)),
        keys: keys.map((k) => {
          const spent = spentByKey.get(k.id) ?? { costCents: 0, requests: 0 };
          const budget = k.monthlyBudgetCents ?? null;
          return {
            id: k.id,
            name: k.name,
            provider: k.provider,
            healthStatus: k.healthStatus,
            monthlyBudgetCents: budget,
            spentCents: spent.costCents,
            requests: spent.requests,
            overBudget: budget !== null && spent.costCents > budget
          };
        })
      }
    };
  };

  // Called by the health-monitoring cron (no actor) — re-validates every monitored key.
  const runHealthChecks = async () => {
    const keys = await apiKeyDAL.findMonitoredKeys();
    logger.info(`apiKey: running scheduled health checks for ${keys.length} monitored key(s)`);
    for (const key of keys) {
      try {
        const plaintext = await decryptValue(key);
        await runAndRecordHealthCheck(key, plaintext);
      } catch (err) {
        logger.warn({ err, apiKeyId: key.id }, `apiKey: scheduled health check failed [apiKeyId=${key.id}]`);
      }
    }
  };

  return {
    createApiKey,
    listApiKeys,
    getApiKeyById,
    revealApiKey,
    updateApiKey,
    deleteApiKey,
    validateApiKey,
    getApiKeyHealthHistory,
    recordUsage,
    getApiKeyUsage,
    getSpendSummary,
    runHealthChecks
  };
};
