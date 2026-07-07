"use server";

import { apiFetch } from "@/lib/api/client";
import { getSession } from "@/lib/api/session";
import { ApiKeyProvider, TApiKey, THealthCheck, TKeyUsage, TSpendSummary, TUser } from "@/lib/api/types";
import { withAuth } from "@/lib/api/with-auth";

export const listApiKeys = async () =>
    withAuth(async (token, projectId) => {
        const res = await apiFetch<{ apiKeys: TApiKey[] }>("/api/v1/api-keys", {
            token,
            searchParams: { projectId },
        });
        return res.data.apiKeys;
    });

export interface CreateApiKeyInput {
    name: string;
    provider: ApiKeyProvider;
    apiKey: string;
    description?: string;
    validationConfig?: { testUrl: string; headerName?: string; headerScheme?: string };
}

export const createApiKey = async (input: CreateApiKeyInput) =>
    withAuth(async (token, projectId) => {
        const res = await apiFetch<{ apiKey: TApiKey }>("/api/v1/api-keys", {
            method: "POST",
            token,
            body: { ...input, projectId },
        });
        return res.data.apiKey;
    });

export interface UpdateApiKeyInput {
    apiKeyId: string;
    name?: string;
    description?: string;
    apiKey?: string;
    monitoringEnabled?: boolean;
    monthlyBudgetUsd?: number | null;
    validationConfig?: { testUrl: string; headerName?: string; headerScheme?: string };
}

export const updateApiKey = async ({ apiKeyId, ...body }: UpdateApiKeyInput) =>
    withAuth(async (token) => {
        const res = await apiFetch<{ apiKey: TApiKey }>(`/api/v1/api-keys/${apiKeyId}`, {
            method: "PATCH",
            token,
            body,
        });
        return res.data.apiKey;
    });

export const deleteApiKey = async ({ apiKeyId }: { apiKeyId: string }) =>
    withAuth(async (token) => {
        const res = await apiFetch<{ apiKey: TApiKey }>(`/api/v1/api-keys/${apiKeyId}`, {
            method: "DELETE",
            token,
        });
        return res.data.apiKey;
    });

export interface ValidateResult {
    apiKey: TApiKey;
    result: {
        status: string;
        latencyMs: number;
        httpStatus?: number;
        message?: string;
        quotaLimit?: number;
        quotaRemaining?: number;
    };
}

export const validateApiKey = async ({ apiKeyId }: { apiKeyId: string }) =>
    withAuth(async (token) => {
        const res = await apiFetch<ValidateResult>(`/api/v1/api-keys/${apiKeyId}/validate`, {
            method: "POST",
            token,
        });
        return res.data;
    });

export const revealApiKey = async ({ apiKeyId }: { apiKeyId: string }) =>
    withAuth(async (token) => {
        const res = await apiFetch<{ value: string }>(`/api/v1/api-keys/${apiKeyId}/reveal`, {
            method: "POST",
            token,
        });
        return res.data.value;
    });

export const getApiKeyById = async ({ apiKeyId }: { apiKeyId: string }) =>
    withAuth(async (token) => {
        const res = await apiFetch<{ apiKey: TApiKey }>(`/api/v1/api-keys/${apiKeyId}`, { token });
        return res.data.apiKey;
    });

export interface RecordUsageInput {
    apiKeyId: string;
    requests?: number;
    tokens?: number;
    costUsd?: number;
    date?: string;
}

export const recordApiKeyUsage = async ({ apiKeyId, ...body }: RecordUsageInput) =>
    withAuth(async (token) => {
        const res = await apiFetch<{ usage: TKeyUsage }>(`/api/v1/api-keys/${apiKeyId}/usage`, {
            method: "POST",
            token,
            body,
        });
        return res.data.usage;
    });

export const getKeyHealthChecks = async ({ apiKeyId, limit = 20 }: { apiKeyId: string; limit?: number }) =>
    withAuth(async (token) => {
        const res = await apiFetch<{ healthChecks: THealthCheck[] }>(
            `/api/v1/api-keys/${apiKeyId}/health-checks`,
            { token, searchParams: { limit } }
        );
        return res.data.healthChecks;
    });

export const getKeyUsage = async ({ apiKeyId, days = 30 }: { apiKeyId: string; days?: number }) =>
    withAuth(async (token) => {
        const res = await apiFetch<{ usage: TKeyUsage[] }>(`/api/v1/api-keys/${apiKeyId}/usage`, {
            token,
            searchParams: { days },
        });
        return res.data.usage;
    });

export const getSpendSummary = async ({ days = 30 }: { days?: number } = {}) =>
    withAuth(async (token, projectId) => {
        const res = await apiFetch<{ summary: TSpendSummary }>("/api/v1/api-keys/spend", {
            token,
            searchParams: { projectId, days },
        });
        return res.data.summary;
    });

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: string;
    isCurrentUser: boolean;
}

export const listTeamMembers = async () =>
    withAuth(async (token, _projectId, orgId) => {
        const session = getSession();
        const res = await apiFetch<{
            users: { id: string; role: string; user: TUser }[];
        }>(`/api/v2/organizations/${orgId}/memberships`, { token });

        return res.data.users.map((membership): TeamMember => {
            const name =
                [membership.user.firstName, membership.user.lastName].filter(Boolean).join(" ") ||
                membership.user.username ||
                membership.user.email ||
                "Unknown";
            return {
                id: membership.id,
                name,
                email: membership.user.email ?? membership.user.username ?? "",
                role: membership.role,
                isCurrentUser: (membership.user.email ?? "") === (session?.user.email ?? ""),
            };
        });
    });
