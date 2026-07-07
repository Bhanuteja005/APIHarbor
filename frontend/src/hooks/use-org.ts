"use client";

import {
    AuditLogsInput,
    getAuditLogs,
    getOrganization,
    inviteTeamMember,
    removeMember,
    updateMemberRole,
    updateOrganizationName,
} from "@/actions/org";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { unwrap } from "./query-utils";

export const useOrganization = () =>
    useQuery({
        queryKey: ["organization"],
        queryFn: async () => unwrap(await getOrganization()),
    });

export const useUpdateOrgName = () => {
    const client = useQueryClient();
    return useMutation({
        mutationFn: async (name: string) => unwrap(await updateOrganizationName({ name })),
        onSuccess: () => client.invalidateQueries({ queryKey: ["organization"] }),
    });
};

const useInvalidateTeam = () => {
    const client = useQueryClient();
    return () => client.invalidateQueries({ queryKey: ["team-members"] });
};

export const useInviteMember = () => {
    const invalidate = useInvalidateTeam();
    return useMutation({
        mutationFn: async ({ email, role }: { email: string; role?: string }) =>
            unwrap(await inviteTeamMember({ email, role })),
        onSuccess: invalidate,
    });
};

export const useUpdateMemberRole = () => {
    const invalidate = useInvalidateTeam();
    return useMutation({
        mutationFn: async ({ membershipId, role }: { membershipId: string; role: string }) =>
            unwrap(await updateMemberRole({ membershipId, role })),
        onSuccess: invalidate,
    });
};

export const useRemoveMember = () => {
    const invalidate = useInvalidateTeam();
    return useMutation({
        mutationFn: async (membershipId: string) => unwrap(await removeMember({ membershipId })),
        onSuccess: invalidate,
    });
};

export const useAuditLogs = (input: AuditLogsInput = {}) =>
    useQuery({
        queryKey: ["audit-logs", input],
        queryFn: async () => unwrap(await getAuditLogs(input)),
        refetchInterval: 60_000,
    });
