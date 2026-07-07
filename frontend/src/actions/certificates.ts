"use server";

import { apiFetch } from "@/lib/api/client";
import { TCertificate, TCertificateAuthority } from "@/lib/api/types";
import { withAuth } from "@/lib/api/with-auth";

// PKI data lives in cert-manager type projects; every call here is scoped to
// an explicit projectId rather than the session's active project (which is a
// secret-manager project holding the API keys).

export const listCertificateAuthorities = async ({ projectId }: { projectId: string }) =>
    withAuth(async (token) => {
        const res = await apiFetch<{ cas: TCertificateAuthority[] }>(`/api/v1/projects/${projectId}/cas`, {
            token,
        });
        return res.data.cas;
    });

export const listCertificates = async ({ projectId }: { projectId: string }) =>
    withAuth(async (token) => {
        const res = await apiFetch<{ certificates: TCertificate[] }>(
            `/api/v1/projects/${projectId}/certificates`,
            { token, searchParams: { limit: 100 } }
        );
        return res.data.certificates;
    });

const toSlug = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-\s]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 32) || "certificate-authority";

export const createInternalCa = async ({
    projectId,
    name,
    commonName,
    organization,
}: {
    projectId: string;
    name: string;
    commonName: string;
    organization?: string;
}) =>
    withAuth(async (token) => {
        // A root CA only self-signs at create when notAfter is provided;
        // without it the CA is left in "pending-certificate".
        const notBefore = new Date();
        const notAfter = new Date(notBefore);
        notAfter.setFullYear(notAfter.getFullYear() + 10);

        // Unlike most routes, CA create returns the CA object unwrapped.
        const res = await apiFetch<TCertificateAuthority>(
            "/api/v1/cert-manager/ca/internal",
            {
                method: "POST",
                token,
                body: {
                    name: toSlug(name),
                    projectId,
                    status: "active",
                    configuration: {
                        type: "root",
                        friendlyName: name,
                        commonName,
                        organization: organization ?? "",
                        ou: "",
                        country: "",
                        province: "",
                        locality: "",
                        keyAlgorithm: "RSA_2048",
                        maxPathLength: -1,
                        notBefore: notBefore.toISOString(),
                        notAfter: notAfter.toISOString(),
                    },
                },
            }
        );
        return res.data;
    });
