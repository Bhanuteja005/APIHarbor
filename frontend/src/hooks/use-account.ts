"use client";

import {
    changeMyPassword,
    getMe,
    listSessions,
    revokeAllSessions,
    revokeSession,
    updateMyMfa,
    updateMyName,
} from "@/actions/account";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { unwrap } from "./query-utils";

export const useMe = () =>
    useQuery({
        queryKey: ["me"],
        queryFn: async () => unwrap(await getMe()),
    });

export const useUpdateMyName = () => {
    const client = useQueryClient();
    return useMutation({
        mutationFn: async (name: string) => unwrap(await updateMyName({ name })),
        onSuccess: () => client.invalidateQueries({ queryKey: ["me"] }),
    });
};

export const useUpdateMyMfa = () => {
    const client = useQueryClient();
    return useMutation({
        mutationFn: async (isMfaEnabled: boolean) => unwrap(await updateMyMfa({ isMfaEnabled })),
        onSuccess: () => client.invalidateQueries({ queryKey: ["me"] }),
    });
};

export const useSessions = () =>
    useQuery({
        queryKey: ["sessions"],
        queryFn: async () => unwrap(await listSessions()),
    });

export const useRevokeSession = () => {
    const client = useQueryClient();
    return useMutation({
        mutationFn: async (sessionId: string) => unwrap(await revokeSession({ sessionId })),
        onSuccess: () => client.invalidateQueries({ queryKey: ["sessions"] }),
    });
};

export const useRevokeAllSessions = () =>
    useMutation({
        mutationFn: async () => unwrap(await revokeAllSessions()),
    });

export const useChangePassword = () =>
    useMutation({
        mutationFn: async (input: { oldPassword: string; newPassword: string }) =>
            unwrap(await changeMyPassword(input)),
    });
