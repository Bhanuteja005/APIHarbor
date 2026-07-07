import "server-only";

// Server-side client for the APIHarbor backend (Fastify, deployed on Railway).
// All browser → backend traffic goes through Next server actions, so the
// backend never needs CORS for the frontend domain and tokens stay in
// httpOnly cookies.
const API_URL = (process.env.API_URL || "http://localhost:4000").replace(/\/$/, "");

export class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

interface ApiFetchOptions {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    token?: string;
    cookie?: string;
    searchParams?: Record<string, string | number | boolean | undefined>;
}

export interface ApiResponse<T> {
    data: T;
    setCookies: string[];
}

export const apiFetch = async <T>(path: string, options: ApiFetchOptions = {}): Promise<ApiResponse<T>> => {
    const url = new URL(`${API_URL}${path}`);
    for (const [key, value] of Object.entries(options.searchParams ?? {})) {
        if (value !== undefined) url.searchParams.set(key, String(value));
    }

    const headers: Record<string, string> = {};
    // Fastify rejects an empty body when content-type is application/json,
    // so only declare it when a body is actually sent.
    if (options.body !== undefined) headers["Content-Type"] = "application/json";
    if (options.token) headers.Authorization = `Bearer ${options.token}`;
    if (options.cookie) headers.Cookie = options.cookie;

    let response: Response;
    try {
        response = await fetch(url, {
            method: options.method ?? "GET",
            headers,
            body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
            cache: "no-store",
        });
    } catch {
        throw new ApiError(0, "Cannot reach the APIHarbor API. Please try again shortly.");
    }

    const text = await response.text();
    let data: any = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = null;
    }

    if (!response.ok) {
        const message =
            data?.message ||
            data?.error ||
            `Request failed with status ${response.status}`;
        throw new ApiError(response.status, Array.isArray(message) ? message.join(", ") : String(message));
    }

    return { data: data as T, setCookies: response.headers.getSetCookie?.() ?? [] };
};
