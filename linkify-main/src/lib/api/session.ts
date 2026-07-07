import "server-only";

import { cookies } from "next/headers";

// Session cookies. The backend JWT lives in an httpOnly cookie and is only
// ever read server-side; ah_user is readable by the client for display.
export const SESSION_COOKIE = "ah_session";
export const REFRESH_COOKIE = "ah_refresh";
export const PROJECT_COOKIE = "ah_project";
export const ORG_COOKIE = "ah_org";
export const USER_COOKIE = "ah_user";

const WEEK_IN_SECONDS = 60 * 60 * 24 * 7;

const secure = process.env.NODE_ENV === "production";

export interface SessionData {
    token: string;
    refreshCookie?: string;
    orgId: string;
    projectId: string;
    user: { name: string; email: string };
}

export const setSessionCookies = ({ token, refreshCookie, orgId, projectId, user }: SessionData) => {
    const store = cookies();
    const base = { httpOnly: true, sameSite: "lax" as const, path: "/", secure, maxAge: WEEK_IN_SECONDS };

    store.set(SESSION_COOKIE, token, base);
    if (refreshCookie) store.set(REFRESH_COOKIE, refreshCookie, base);
    store.set(ORG_COOKIE, orgId, base);
    store.set(PROJECT_COOKIE, projectId, base);
    store.set(USER_COOKIE, JSON.stringify(user), { ...base, httpOnly: false });
};

export const getSession = () => {
    const store = cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    let user = { name: "", email: "" };
    try {
        user = JSON.parse(store.get(USER_COOKIE)?.value ?? "{}");
    } catch {
        // ignore malformed cookie
    }

    return {
        token,
        refreshCookie: store.get(REFRESH_COOKIE)?.value,
        orgId: store.get(ORG_COOKIE)?.value ?? "",
        projectId: store.get(PROJECT_COOKIE)?.value ?? "",
        user,
    };
};

export const clearSessionCookies = () => {
    const store = cookies();
    for (const name of [SESSION_COOKIE, REFRESH_COOKIE, ORG_COOKIE, PROJECT_COOKIE, USER_COOKIE]) {
        store.delete(name);
    }
};
