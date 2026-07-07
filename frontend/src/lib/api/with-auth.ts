import "server-only";

import { parseJidCookie } from "@/lib/api/auth-flow";
import { ApiError, apiFetch } from "@/lib/api/client";
import { clearSessionCookies, getSession, setSessionCookies } from "@/lib/api/session";

export type ActionResult<T> = { data: T } | { error: string; unauthorized?: boolean };

// Runs a backend call with the session token; on 401 refreshes the access
// token once via the captured jid refresh cookie and retries.
export const withAuth = async <T>(
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
