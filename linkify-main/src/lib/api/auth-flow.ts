import "server-only";

import { apiFetch } from "./client";
import { TOrganization, TProject, TUser } from "./types";

// The backend issues its refresh token as a `jid` httpOnly cookie scoped to
// its own domain; since all calls happen server-side we capture the raw value
// and replay it manually on refresh.
export const parseJidCookie = (setCookies: string[]) => {
    for (const cookie of setCookies) {
        const match = cookie.match(/^jid=([^;]*)/);
        if (match && match[1]) return match[1];
    }
    return undefined;
};

export interface MfaChallenge {
    mfaRequired: true;
    mfaToken: string;
    mfaMethod: string;
    orgId: string;
}

export interface CompletedSession {
    mfaRequired: false;
    token: string;
    refreshCookie?: string;
    orgId: string;
    projectId: string;
    user: { name: string; email: string };
}

// After we hold a post-org access token: resolve the user's display identity
// and the project every dashboard call is scoped to (creating one on first use).
export const finishSession = async (
    orgToken: string,
    refreshCookie: string | undefined,
    orgId: string
): Promise<CompletedSession> => {
    const me = await apiFetch<{ user: TUser }>("/api/v2/users/me", { token: orgToken });
    const user = me.data.user;
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || user.email;

    const list = await apiFetch<{ projects: TProject[] }>("/api/v1/projects", {
        token: orgToken,
        searchParams: { type: "secret-manager" },
    });

    let project = list.data.projects[0];
    if (!project) {
        const created = await apiFetch<{ project: TProject }>("/api/v1/projects", {
            method: "POST",
            token: orgToken,
            body: { projectName: "My Project" },
        });
        project = created.data.project;
    }

    return {
        mfaRequired: false,
        token: orgToken,
        refreshCookie,
        orgId,
        projectId: project.id,
        user: { name, email: user.email ?? "" },
    };
};

// From any account-level token (fresh login or fresh signup): pick the user's
// organization, exchange for an org-scoped token, then finish the session.
export const bootstrapSession = async (accountToken: string): Promise<MfaChallenge | CompletedSession> => {
    const orgs = await apiFetch<{ organizations: TOrganization[] }>("/api/v1/organization", {
        token: accountToken,
    });

    const organization = orgs.data.organizations[0];
    if (!organization) {
        throw new Error("Your account has no organization yet. Please contact support.");
    }

    const selected = await apiFetch<{ token: string; isMfaEnabled: boolean; mfaMethod?: string }>(
        "/api/v3/auth/select-organization",
        {
            method: "POST",
            token: accountToken,
            body: { organizationId: organization.id },
        }
    );

    if (selected.data.isMfaEnabled) {
        return {
            mfaRequired: true,
            mfaToken: selected.data.token,
            mfaMethod: selected.data.mfaMethod ?? "email",
            orgId: organization.id,
        };
    }

    return finishSession(selected.data.token, parseJidCookie(selected.setCookies), organization.id);
};
