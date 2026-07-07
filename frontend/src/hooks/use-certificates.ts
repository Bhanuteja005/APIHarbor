"use client";

import { createInternalCa, listCertificateAuthorities, listCertificates } from "@/actions/certificates";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { unwrap } from "./query-utils";

export const useCertificateAuthorities = (projectId: string | undefined) =>
    useQuery({
        queryKey: ["cas", projectId],
        queryFn: async () => unwrap(await listCertificateAuthorities({ projectId: projectId! })),
        enabled: Boolean(projectId),
    });

export const useCertificates = (projectId: string | undefined) =>
    useQuery({
        queryKey: ["certificates", projectId],
        queryFn: async () => unwrap(await listCertificates({ projectId: projectId! })),
        enabled: Boolean(projectId),
    });

export const useCreateInternalCa = () => {
    const client = useQueryClient();
    return useMutation({
        mutationFn: async (input: { projectId: string; name: string; commonName: string; organization?: string }) =>
            unwrap(await createInternalCa(input)),
        onSuccess: (_data, variables) => {
            client.invalidateQueries({ queryKey: ["cas", variables.projectId] });
            client.invalidateQueries({ queryKey: ["product-stats"] });
        },
    });
};
