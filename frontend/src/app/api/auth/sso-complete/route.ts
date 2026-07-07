import { NextRequest, NextResponse } from "next/server";

import { bootstrapSession } from "@/lib/api/auth-flow";
import { apiFetch } from "@/lib/api/client";
import { buildSessionCookies } from "@/lib/api/session";

// Lands here after the backend's OAuth callback redirected the browser to
// /login/select-organization. The backend left an org-less `jid` refresh
// cookie scoped to path=/api (which is why this must be a route handler under
// /api, not a server action). Exchange it for an access token, bootstrap the
// org/project session exactly like a password login, then continue into the
// dashboard.
export const dynamic = "force-dynamic";

const shortLived = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 30,
};

export async function GET(req: NextRequest) {
    const redirectTo = (path: string) => {
        const res = NextResponse.redirect(new URL(path, req.nextUrl.origin));
        // The backend's oauth jid has served its purpose on our domain.
        res.cookies.set("jid", "", { path: "/api", maxAge: 0 });
        return res;
    };

    const jid = req.cookies.get("jid")?.value;
    if (!jid) return redirectTo("/auth/sign-in?error=sso");

    try {
        const refreshed = await apiFetch<{ token: string }>("/api/v1/auth/token", {
            method: "POST",
            cookie: `jid=${jid}`,
        });

        const session = await bootstrapSession(refreshed.data.token);

        if (session.mfaRequired) {
            const res = redirectTo(`/auth/sign-in?mfa=${encodeURIComponent(session.mfaMethod)}`);
            res.cookies.set("ah_mfa", JSON.stringify(session), shortLived);
            return res;
        }

        const res = redirectTo("/auth/auth-callback");
        for (const { name, value, options } of buildSessionCookies(session)) {
            res.cookies.set(name, value, options);
        }
        return res;
    } catch {
        return redirectTo("/auth/sign-in?error=sso");
    }
}
