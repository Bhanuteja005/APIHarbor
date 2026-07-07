"use server";

import { apiFetch } from "@/lib/api/client";
import { TAppConnection } from "@/lib/api/types";
import { withAuth } from "@/lib/api/with-auth";

// App connections the dashboard can create today are the token-based methods
// (no OAuth client registration needed): GitHub via personal access token and
// Anthropic via API key. OAuth-based providers (Slack, Teams, GitHub OAuth)
// need client credentials configured on the backend first.

export const listAppConnections = async () =>
    withAuth(async (token) => {
        const res = await apiFetch<{ appConnections: TAppConnection[] }>("/api/v1/app-connections", { token });
        return res.data.appConnections;
    });

// Connection names must be slugs on the backend.
const toSlug = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-\s]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 32) || "connection";

export const createGitHubConnection = async ({
    name,
    personalAccessToken,
    description,
}: {
    name: string;
    personalAccessToken: string;
    description?: string;
}) =>
    withAuth(async (token) => {
        const res = await apiFetch<{ appConnection: TAppConnection }>("/api/v1/app-connections/github", {
            method: "POST",
            token,
            body: {
                name: toSlug(name),
                ...(description ? { description } : {}),
                method: "pat",
                credentials: { personalAccessToken },
            },
        });
        return res.data.appConnection;
    });

export const createAnthropicConnection = async ({
    name,
    apiKey,
    description,
}: {
    name: string;
    apiKey: string;
    description?: string;
}) =>
    withAuth(async (token) => {
        const res = await apiFetch<{ appConnection: TAppConnection }>("/api/v1/app-connections/anthropic", {
            method: "POST",
            token,
            body: {
                name: toSlug(name),
                ...(description ? { description } : {}),
                method: "api-key",
                credentials: { apiKey },
            },
        });
        return res.data.appConnection;
    });

export const deleteAppConnection = async ({ app, connectionId }: { app: string; connectionId: string }) =>
    withAuth(async (token) => {
        await apiFetch(`/api/v1/app-connections/${app}/${connectionId}`, { method: "DELETE", token });
        return true;
    });
