"use server";

import { apiFetch } from "@/lib/api/client";
import { clearSessionCookies } from "@/lib/api/session";
import { TAuditLog, TOrganization, TProductStats } from "@/lib/api/types";
import { withAuth } from "@/lib/api/with-auth";

export const getOrganization = async () =>
    withAuth(async (token, _projectId, orgId) => {
        const res = await apiFetch<{ organization: TOrganization }>(
            `/api/v1/organization/${orgId}`,
            { token }
        );
        return res.data.organization;
    });

export const updateOrganizationName = async ({ name }: { name: string }) =>
    withAuth(async (token, _projectId, orgId) => {
        const res = await apiFetch<{ organization: TOrganization }>(
            `/api/v1/organization/${orgId}`,
            { method: "PATCH", token, body: { name } }
        );
        return res.data.organization;
    });

export const inviteTeamMember = async ({ email, role = "member" }: { email: string; role?: string }) =>
    withAuth(async (token, _projectId, orgId) => {
        const res = await apiFetch<{ message: string }>("/api/v1/invite-org/signup", {
            method: "POST",
            token,
            body: {
                inviteeEmails: [email],
                organizationId: orgId,
                organizationRoleSlug: role,
            },
        });
        return res.data.message;
    });

export const updateMemberRole = async ({ membershipId, role }: { membershipId: string; role: string }) =>
    withAuth(async (token, _projectId, orgId) => {
        await apiFetch(`/api/v2/organizations/${orgId}/memberships/${membershipId}`, {
            method: "PATCH",
            token,
            body: { role },
        });
        return true;
    });

export const removeMember = async ({ membershipId }: { membershipId: string }) =>
    withAuth(async (token, _projectId, orgId) => {
        await apiFetch(`/api/v2/organizations/${orgId}/memberships/${membershipId}`, {
            method: "DELETE",
            token,
        });
        return true;
    });

// Org-wide counters behind the product overview cards (secrets, PKI, KMS,
// scanning, PAM) — one call, all five buckets.
export const getProductStats = async () =>
    withAuth(async (token) => {
        const res = await apiFetch<TProductStats>("/api/v1/organization/product-stats", { token });
        return res.data;
    });

export const deleteOrganization = async () => {
    const result = await withAuth(async (token, _projectId, orgId) => {
        await apiFetch(`/api/v2/organizations/${orgId}`, { method: "DELETE", token });
        return true;
    });
    // The org (and every membership token scoped to it) is gone; the local
    // session is unusable either way.
    if ("data" in result) clearSessionCookies();
    return result;
};

export interface AuditLogsInput {
    limit?: number;
    offset?: number;
    actorType?: string;
    startDate?: string;
    endDate?: string;
}

export const getAuditLogs = async ({ limit = 50, offset = 0, actorType, startDate, endDate }: AuditLogsInput = {}) =>
    withAuth(async (token) => {
        const res = await apiFetch<{ auditLogs: TAuditLog[] }>("/api/v1/organization/audit-logs", {
            token,
            searchParams: {
                limit,
                offset,
                ...(actorType ? { actorType } : {}),
                ...(startDate ? { startDate } : {}),
                ...(endDate ? { endDate } : {}),
            },
        });
        return res.data.auditLogs;
    });
