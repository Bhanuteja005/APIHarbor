"use client";

// Server actions return { data } | { error, unauthorized? }. Unwrap them into
// React Query's throw-based error handling, bouncing to sign-in on expiry.
export const unwrap = <T>(result: { data: T } | { error: string; unauthorized?: boolean }): T => {
    if ("error" in result) {
        if (result.unauthorized && typeof window !== "undefined") {
            window.location.href = "/auth/sign-in";
        }
        throw new Error(result.error);
    }
    return result.data;
};
