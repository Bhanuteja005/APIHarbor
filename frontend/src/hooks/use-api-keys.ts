"use client";

import {
    CreateApiKeyInput,
    RecordUsageInput,
    UpdateApiKeyInput,
    createApiKey,
    deleteApiKey,
    getKeyHealthChecks,
    getKeyUsage,
    getSpendSummary,
    listApiKeys,
    listTeamMembers,
    recordApiKeyUsage,
    revealApiKey,
    updateApiKey,
    validateApiKey,
} from "@/actions/api-keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { unwrap } from "./query-utils";

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

export const useRecordUsage = () => {
    const client = useQueryClient();
    const invalidate = useInvalidateKeys();
    return useMutation({
        mutationFn: async (input: RecordUsageInput) => unwrap(await recordApiKeyUsage(input)),
        onSuccess: (_data, input) => {
            invalidate();
            client.invalidateQueries({ queryKey: ["key-usage", input.apiKeyId] });
        },
    });
};

export const useKeyHealthChecks = (apiKeyId: string | null, limit = 20) =>
    useQuery({
        queryKey: ["key-health-checks", apiKeyId, limit],
        queryFn: async () => unwrap(await getKeyHealthChecks({ apiKeyId: apiKeyId!, limit })),
        enabled: !!apiKeyId,
    });

export const useKeyUsage = (apiKeyId: string | null, days = 30) =>
    useQuery({
        queryKey: ["key-usage", apiKeyId, days],
        queryFn: async () => unwrap(await getKeyUsage({ apiKeyId: apiKeyId!, days })),
        enabled: !!apiKeyId,
    });
