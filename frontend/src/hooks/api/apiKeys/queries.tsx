import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@app/config/request";

import { TApiKey, TApiKeyHealthCheck, TApiKeySpendSummary, TApiKeyUsageEntry } from "./types";

export const apiKeysQueryKeys = {
  all: ["api-keys"] as const,
  list: (projectId: string) => [...apiKeysQueryKeys.all, "list", { projectId }] as const,
  health: (apiKeyId: string) => [...apiKeysQueryKeys.all, "health", { apiKeyId }] as const,
  spend: (projectId: string, days: number) =>
    [...apiKeysQueryKeys.all, "spend", { projectId, days }] as const,
  usage: (apiKeyId: string, days: number) =>
    [...apiKeysQueryKeys.all, "usage", { apiKeyId, days }] as const
};

export const useGetApiKeys = (projectId: string) =>
  useQuery({
    queryKey: apiKeysQueryKeys.list(projectId),
    queryFn: async () => {
      const { data } = await apiRequest.get<{ apiKeys: TApiKey[] }>("/api/v1/api-keys", {
        params: { projectId }
      });
      return data.apiKeys;
    },
    enabled: Boolean(projectId)
  });

export const useGetApiKeyHealthChecks = (apiKeyId: string, enabled = true) =>
  useQuery({
    queryKey: apiKeysQueryKeys.health(apiKeyId),
    queryFn: async () => {
      const { data } = await apiRequest.get<{ healthChecks: TApiKeyHealthCheck[] }>(
        `/api/v1/api-keys/${apiKeyId}/health-checks`
      );
      return data.healthChecks;
    },
    enabled: enabled && Boolean(apiKeyId)
  });

export const useGetApiKeySpend = (projectId: string, days = 30) =>
  useQuery({
    queryKey: apiKeysQueryKeys.spend(projectId, days),
    queryFn: async () => {
      const { data } = await apiRequest.get<{ summary: TApiKeySpendSummary }>(
        "/api/v1/api-keys/spend",
        { params: { projectId, days } }
      );
      return data.summary;
    },
    enabled: Boolean(projectId)
  });

export const useGetApiKeyUsage = (apiKeyId: string, days = 30) =>
  useQuery({
    queryKey: apiKeysQueryKeys.usage(apiKeyId, days),
    queryFn: async () => {
      const { data } = await apiRequest.get<{ usage: TApiKeyUsageEntry[] }>(
        `/api/v1/api-keys/${apiKeyId}/usage`,
        { params: { days } }
      );
      return data.usage;
    },
    enabled: Boolean(apiKeyId)
  });
