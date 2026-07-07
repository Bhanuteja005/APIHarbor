"use server";

import { apiFetch } from "@/lib/api/client";
import { clearSessionCookies, getSession, setSessionCookies } from "@/lib/api/session";
import { TAccount, TSession } from "@/lib/api/types";
import { withAuth } from "@/lib/api/with-auth";

export const getMe = async () =>
    withAuth(async (token) => {
        const res = await apiFetch<{ user: TAccount }>("/api/v2/users/me", { token });
        return res.data.user;
    });

export const updateMyName = async ({ name }: { name: string }) =>
    withAuth(async (token) => {
        const firstName = name.split(" ")[0];
        const lastName = name.split(" ").slice(1).join(" ");

        const res = await apiFetch<{ user: TAccount }>("/api/v2/users/me/name", {
            method: "PATCH",
            token,
            body: { firstName, lastName },
        });

        // Keep the display cookie in sync so the sidebar shows the new name.
        const session = getSession();
        if (session) {
            setSessionCookies({
                ...session,
                user: { ...session.user, name },
            });
        }

        return res.data.user;
    });

export const updateMyMfa = async ({ isMfaEnabled }: { isMfaEnabled: boolean }) =>
    withAuth(async (token) => {
        const res = await apiFetch<{ user: TAccount }>("/api/v2/users/me/mfa", {
            method: "PATCH",
            token,
            body: { isMfaEnabled, ...(isMfaEnabled ? { selectedMfaMethod: "email" } : {}) },
        });
        return res.data.user;
    });

export const listSessions = async () =>
    withAuth(async (token) => {
        const res = await apiFetch<TSession[]>("/api/v2/users/me/sessions", { token });
        return res.data;
    });

export const revokeSession = async ({ sessionId }: { sessionId: string }) =>
    withAuth(async (token) => {
        await apiFetch(`/api/v2/users/me/sessions/${sessionId}`, { method: "DELETE", token });
        return true;
    });

export const revokeAllSessions = async () => {
    const result = await withAuth(async (token) => {
        await apiFetch("/api/v2/users/me/sessions", { method: "DELETE", token });
        return true;
    });

    // Every session (including this one) is now revoked.
    if ("data" in result) clearSessionCookies();
    return result;
};

export const changeMyPassword = async ({
    oldPassword,
    newPassword,
}: {
    oldPassword: string;
    newPassword: string;
}) => {
    const result = await withAuth(async (token) => {
        await apiFetch("/api/v2/password/user/password-reset", {
            method: "POST",
            token,
            body: { oldPassword, newPassword },
        });
        return true;
    });

    // The backend invalidates existing sessions after a password change,
    // so clear ours and let the user sign back in.
    if ("data" in result) clearSessionCookies();
    return result;
};
