"use client";

import {
    createAnthropicConnection,
    createGitHubConnection,
    deleteAppConnection,
    listAppConnections,
} from "@/actions/integrations";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { unwrap } from "./query-utils";

export const useAppConnections = () =>
    useQuery({
        queryKey: ["app-connections"],
        queryFn: async () => unwrap(await listAppConnections()),
    });

const useInvalidateConnections = () => {
    const client = useQueryClient();
    return () => client.invalidateQueries({ queryKey: ["app-connections"] });
};

export const useCreateGitHubConnection = () => {
    const invalidate = useInvalidateConnections();
    return useMutation({
        mutationFn: async (input: { name: string; personalAccessToken: string; description?: string }) =>
            unwrap(await createGitHubConnection(input)),
        onSuccess: invalidate,
    });
};

export const useCreateAnthropicConnection = () => {
    const invalidate = useInvalidateConnections();
    return useMutation({
        mutationFn: async (input: { name: string; apiKey: string; description?: string }) =>
            unwrap(await createAnthropicConnection(input)),
        onSuccess: invalidate,
    });
};

export const useDeleteAppConnection = () => {
    const invalidate = useInvalidateConnections();
    return useMutation({
        mutationFn: async (input: { app: string; connectionId: string }) =>
            unwrap(await deleteAppConnection(input)),
        onSuccess: invalidate,
    });
};
