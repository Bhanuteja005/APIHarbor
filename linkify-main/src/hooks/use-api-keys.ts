"use client";

import {
    CreateApiKeyInput,
    UpdateApiKeyInput,
    createApiKey,
    deleteApiKey,
    getSpendSummary,
    listApiKeys,
    listTeamMembers,
    revealApiKey,
    updateApiKey,
    validateApiKey,
} from "@/actions/api-keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Server actions return { data } | { error, unauthorized? }. Unwrap them into
// React Query's throw-based error handling, bouncing to sign-in on expiry.
const unwrap = <T>(result: { data: T } | { error: string; unauthorized?: boolean }): T => {
    if ("error" in result) {
        if (result.unauthorized && typeof window !== "undefined") {
            window.location.href = "/auth/sign-in";
        }
        throw new Error(result.error);
    }
    return result.data;
};

export const useApiKeys = () =>
    useQuery({
        queryKey: ["api-keys"],
        queryFn: async () => unwrap(await listApiKeys()),
        refetchInterval: 60_000,
    });

export const useSpendSummary = (days = 30) =>
    useQuery({
        queryKey: ["spend-summary", days],
        queryFn: async () => unwrap(await getSpendSummary({ days })),
        refetchInterval: 60_000,
    });

export const useTeamMembers = () =>
    useQuery({
        queryKey: ["team-members"],
        queryFn: async () => unwrap(await listTeamMembers()),
    });

const useInvalidateKeys = () => {
    const client = useQueryClient();
    return () => {
        client.invalidateQueries({ queryKey: ["api-keys"] });
        client.invalidateQueries({ queryKey: ["spend-summary"] });
    };
};

export const useCreateApiKey = () => {
    const invalidate = useInvalidateKeys();
    return useMutation({
        mutationFn: async (input: CreateApiKeyInput) => unwrap(await createApiKey(input)),
        onSuccess: invalidate,
    });
};

export const useUpdateApiKey = () => {
    const invalidate = useInvalidateKeys();
    return useMutation({
        mutationFn: async (input: UpdateApiKeyInput) => unwrap(await updateApiKey(input)),
        onSuccess: invalidate,
    });
};

export const useDeleteApiKey = () => {
    const invalidate = useInvalidateKeys();
    return useMutation({
        mutationFn: async (apiKeyId: string) => unwrap(await deleteApiKey({ apiKeyId })),
        onSuccess: invalidate,
    });
};

export const useValidateApiKey = () => {
    const invalidate = useInvalidateKeys();
    return useMutation({
        mutationFn: async (apiKeyId: string) => unwrap(await validateApiKey({ apiKeyId })),
        onSuccess: invalidate,
    });
};

export const useRevealApiKey = () =>
    useMutation({
        mutationFn: async (apiKeyId: string) => unwrap(await revealApiKey({ apiKeyId })),
    });
