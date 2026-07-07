"use server";

import { parseJidCookie } from "@/lib/api/auth-flow";
import { ApiError, apiFetch } from "@/lib/api/client";
import { clearSessionCookies, getSession, setSessionCookies } from "@/lib/api/session";
import { ApiKeyProvider, TApiKey, TSpendSummary, TUser } from "@/lib/api/types";

type ActionResult<T> = { data: T } | { error: string; unauthorized?: boolean };

// Runs a backend call with the session token; on 401 refreshes the access
// token once via the captured jid refresh cookie and retries.
const withAuth = async <T>(
    run: (token: string, projectId: string, orgId: string) => Promise<T>
): Promise<ActionResult<T>> => {
    const session = getSession();
    if (!session) return { error: "You are signed out. Please sign in again.", unauthorized: true };

    try {
        return { data: await run(session.token, session.projectId, session.orgId) };
    } catch (error) {
        if (error instanceof ApiError && error.status === 401 && session.refreshCookie) {
            try {
                const refreshed = await apiFetch<{ token: string }>("/api/v1/auth/token", {
                    method: "POST",
                    cookie: `jid=${session.refreshCookie}`,
                });
                const nextRefresh = parseJidCookie(refreshed.setCookies) ?? session.refreshCookie;
                setSessionCookies({
                    token: refreshed.data.token,
                    refreshCookie: nextRefresh,
                    orgId: session.orgId,
                    projectId: session.projectId,
                    user: session.user,
                });
                return { data: await run(refreshed.data.token, session.projectId, session.orgId) };
            } catch {
                clearSessionCookies();
                return { error: "Your session expired. Please sign in again.", unauthorized: true };
            }
        }

        if (error instanceof ApiError && error.status === 401) {
            clearSessionCookies();
            return { error: "Your session expired. Please sign in again.", unauthorized: true };
        }

        const message = error instanceof Error ? error.message : "Request failed. Please try again.";
        return { error: message };
    }
};

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
    monitoringEnabled?: boolean;
    monthlyBudgetUsd?: number | null;
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
