import { NextRequest, NextResponse } from "next/server";

// OAuth (Google/GitHub/GitLab) is a browser-redirect flow, so unlike the rest
// of the app it cannot go through server actions: Google must be able to
// redirect the user's browser back to us. This route proxies the backend's
// /api/v1/sso/* endpoints on our own domain so the OAuth state/session and
// jid cookies are set on the frontend domain, where the rest of the app can
// use them.
const API_URL = (process.env.API_URL || "http://localhost:4000").replace(/\/$/, "");

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
    const target = new URL(`${API_URL}/api/v1/sso/${params.path.join("/")}`);
    req.nextUrl.searchParams.forEach((value, key) => target.searchParams.set(key, value));

    const headers: Record<string, string> = {};
    const cookie = req.headers.get("cookie");
    if (cookie) headers.cookie = cookie;

    let upstream: Response;
    try {
        upstream = await fetch(target, { headers, redirect: "manual", cache: "no-store" });
    } catch {
        return NextResponse.redirect(new URL("/auth/sign-in?error=sso", req.nextUrl.origin));
    }

    const responseHeaders = new Headers();
    const location = upstream.headers.get("location");
    if (location) responseHeaders.set("location", location);
    const contentType = upstream.headers.get("content-type");
    if (contentType) responseHeaders.set("content-type", contentType);
    for (const setCookie of upstream.headers.getSetCookie?.() ?? []) {
        responseHeaders.append("set-cookie", setCookie);
    }

    return new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders });
}
