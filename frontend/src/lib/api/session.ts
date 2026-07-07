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

export interface SessionCookieEntry {
    name: string;
    value: string;
    options: {
        httpOnly: boolean;
        sameSite: "lax";
        path: string;
        secure: boolean;
        maxAge: number;
    };
}

// Route handlers must set cookies on their own response object (cookies().set
// from next/headers is only reliable in server actions), so expose the raw
// entries for both call sites.
export const buildSessionCookies = ({ token, refreshCookie, orgId, projectId, user }: SessionData): SessionCookieEntry[] => {
    const base = { httpOnly: true, sameSite: "lax" as const, path: "/", secure, maxAge: WEEK_IN_SECONDS };

    const entries: SessionCookieEntry[] = [
        { name: SESSION_COOKIE, value: token, options: base },
        { name: ORG_COOKIE, value: orgId, options: base },
        { name: PROJECT_COOKIE, value: projectId, options: base },
        { name: USER_COOKIE, value: JSON.stringify(user), options: { ...base, httpOnly: false } },
    ];
    if (refreshCookie) entries.splice(1, 0, { name: REFRESH_COOKIE, value: refreshCookie, options: base });
    return entries;
};

export const setSessionCookies = (data: SessionData) => {
    const store = cookies();
    for (const { name, value, options } of buildSessionCookies(data)) {
        store.set(name, value, options);
    }
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

// The active project drives every project-scoped call; switching it is just a
// cookie swap once the target project is validated against the backend.
export const setProjectCookie = (projectId: string) => {
    cookies().set(PROJECT_COOKIE, projectId, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure,
        maxAge: WEEK_IN_SECONDS,
    });
};

export const clearSessionCookies = () => {
    const store = cookies();
    for (const name of [SESSION_COOKIE, REFRESH_COOKIE, ORG_COOKIE, PROJECT_COOKIE, USER_COOKIE]) {
        store.delete(name);
    }
};
