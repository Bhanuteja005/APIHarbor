"use server";

import { bootstrapSession, finishSession, parseJidCookie } from "@/lib/api/auth-flow";
import { ApiError, apiFetch } from "@/lib/api/client";
import { clearSessionCookies, getSession, setSessionCookies } from "@/lib/api/session";
import { cookies } from "next/headers";

const MFA_COOKIE = "ah_mfa";
const SIGNUP_COOKIE = "ah_signup";

const secure = process.env.NODE_ENV === "production";
const shortLived = { httpOnly: true, sameSite: "lax" as const, path: "/", secure, maxAge: 60 * 30 };

const toErrorMessage = (error: unknown) =>
    error instanceof ApiError || error instanceof Error
        ? error.message
        : "An unexpected error occurred. Please try again.";

interface Credentials {
    email: string;
    password: string;
}

export const login = async ({ email, password }: Credentials) => {
    if (!email || !password) {
        return { error: "Email and password are required" };
    }

    try {
        const res = await apiFetch<{ accessToken: string }>("/api/v3/auth/login", {
            method: "POST",
            body: { email, password },
        });

        const session = await bootstrapSession(res.data.accessToken);

        if (session.mfaRequired) {
            cookies().set(MFA_COOKIE, JSON.stringify(session), shortLived);
            return { mfaRequired: true, mfaMethod: session.mfaMethod };
        }

        setSessionCookies(session);
        return { success: true };
    } catch (error) {
        if (error instanceof ApiError && error.status === 400) {
            return { error: "Invalid email or password" };
        }
        return { error: toErrorMessage(error) };
    }
};

export const verifyMfa = async ({ code }: { code: string }) => {
    const raw = cookies().get(MFA_COOKIE)?.value;
    if (!raw) return { error: "Your MFA session expired. Please sign in again." };

    try {
        const challenge = JSON.parse(raw) as { mfaToken: string; mfaMethod: string; orgId: string };

        const res = await apiFetch<{ token: string }>("/api/v2/auth/mfa/verify", {
            method: "POST",
            token: challenge.mfaToken,
            body: { mfaToken: code, mfaMethod: challenge.mfaMethod },
        });

        const session = await finishSession(res.data.token, parseJidCookie(res.setCookies), challenge.orgId);

        cookies().delete(MFA_COOKIE);
        setSessionCookies(session);
        return { success: true };
    } catch (error) {
        if (error instanceof ApiError && error.status === 400) {
            return { error: "Invalid verification code. Please try again." };
        }
        return { error: toErrorMessage(error) };
    }
};

export const sendSignupCode = async ({ email }: { email: string }) => {
    if (!email) return { error: "Email is required" };

    try {
        const res = await apiFetch<{ message: string; cooldownSeconds: number }>(
            "/api/v3/signup/email/signup",
            { method: "POST", body: { email } }
        );
        return { success: true, cooldownSeconds: res.data.cooldownSeconds };
    } catch (error) {
        return { error: toErrorMessage(error) };
    }
};

export const verifySignupCode = async ({ email, code }: { email: string; code: string }) => {
    if (!email || !code) return { error: "Verification code is required" };

    try {
        const res = await apiFetch<{ token: string }>("/api/v3/signup/email/verify", {
            method: "POST",
            body: { email, code },
        });

        cookies().set(SIGNUP_COOKIE, JSON.stringify({ token: res.data.token, email }), shortLived);
        return { success: true };
    } catch (error) {
        if (error instanceof ApiError && error.status === 400) {
            return { error: "Invalid verification code. Please try again." };
        }
        return { error: toErrorMessage(error) };
    }
};

interface SignupDetails {
    name: string;
    organization: string;
    password: string;
    attribution?: string;
}

export const completeSignup = async ({ name, organization, password, attribution }: SignupDetails) => {
    const raw = cookies().get(SIGNUP_COOKIE)?.value;
    if (!raw) return { error: "Your signup session expired. Please start over." };

    try {
        const { token: signupToken, email } = JSON.parse(raw) as { token: string; email: string };

        const res = await apiFetch<{ token: string }>("/api/v3/signup/complete-account", {
            method: "POST",
            token: signupToken,
            body: {
                type: "email",
                email,
                firstName: name.split(" ")[0],
                lastName: name.split(" ").slice(1).join(" ") || undefined,
                password,
                organizationName: organization,
                attributionSource: attribution || undefined,
            },
        });

        const session = await bootstrapSession(res.data.token);
        if (session.mfaRequired) {
            // Fresh accounts have no MFA; this only happens when the org enforces it.
            cookies().set(MFA_COOKIE, JSON.stringify(session), shortLived);
            cookies().delete(SIGNUP_COOKIE);
            return { mfaRequired: true, mfaMethod: session.mfaMethod };
        }

        cookies().delete(SIGNUP_COOKIE);
        setSessionCookies(session);
        return { success: true };
    } catch (error) {
        return { error: toErrorMessage(error) };
    }
};

interface AcceptInviteInput {
    email: string;
    organizationId: string;
    code: string;
    name: string;
    password: string;
}

export const acceptInvite = async ({ email, organizationId, code, name, password }: AcceptInviteInput) => {
    if (!email || !organizationId || !code) {
        return { error: "This invite link is invalid or has expired." };
    }
    if (!name || !password) return { error: "Name and password are required" };

    try {
        const verify = await apiFetch<{ message: string; token?: string }>(
            "/api/v1/invite-org/verify",
            { method: "POST", body: { email: email.toLowerCase(), organizationId, code } }
        );

        if (!verify.data.token) {
            return { error: "This invite link is invalid or has expired. Ask for a new invitation." };
        }

        const res = await apiFetch<{ token: string }>("/api/v3/signup/complete-account", {
            method: "POST",
            token: verify.data.token,
            body: {
                type: "email",
                email: email.toLowerCase(),
                firstName: name.split(" ")[0],
                lastName: name.split(" ").slice(1).join(" ") || undefined,
                password,
            },
        });

        const session = await bootstrapSession(res.data.token);
        if (session.mfaRequired) {
            cookies().set(MFA_COOKIE, JSON.stringify(session), shortLived);
            return { mfaRequired: true, mfaMethod: session.mfaMethod };
        }

        setSessionCookies(session);
        return { success: true };
    } catch (error) {
        return { error: toErrorMessage(error) };
    }
};

export const sendRecoveryEmail = async ({ email }: { email: string }) => {
    if (!email) return { error: "Email is required" };

    try {
        await apiFetch<{ message: string }>("/api/v1/account-recovery/send-email", {
            method: "POST",
            body: { email },
        });
        return { success: true };
    } catch (error) {
        return { error: toErrorMessage(error) };
    }
};

export const resetPasswordWithCode = async ({
    email,
    code,
    newPassword,
}: {
    email: string;
    code: string;
    newPassword: string;
}) => {
    if (!email || !code) return { error: "This recovery link is invalid or has expired." };
    if (!newPassword) return { error: "New password is required" };

    try {
        const verify = await apiFetch<{ token: string }>("/api/v1/account-recovery/verify-email", {
            method: "POST",
            body: { email, code },
        });

        await apiFetch("/api/v2/password/password-reset", {
            method: "POST",
            token: verify.data.token,
            body: { newPassword },
        });

        return { success: true };
    } catch (error) {
        if (error instanceof ApiError && (error.status === 400 || error.status === 401)) {
            return { error: "This recovery link is invalid or has expired. Request a new one." };
        }
        return { error: toErrorMessage(error) };
    }
};

export const logout = async () => {
    const session = getSession();

    if (session) {
        try {
            await apiFetch("/api/v1/auth/logout", {
                method: "POST",
                token: session.token,
                cookie: session.refreshCookie ? `jid=${session.refreshCookie}` : undefined,
            });
        } catch {
            // best effort — clear local session regardless
        }
    }

    clearSessionCookies();
    return { success: true };
};

export const getAuthStatus = async () => {
    const session = getSession();

    if (!session) {
        return { error: "User not found" };
    }

    return { success: true };
};
