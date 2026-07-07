"use server";

import { apiFetch } from "@/lib/api/client";
import { setProjectCookie } from "@/lib/api/session";
import { TProject } from "@/lib/api/types";
import { withAuth } from "@/lib/api/with-auth";

export type ProjectType = "secret-manager" | "cert-manager" | "kms" | "ssh" | "secret-scanning" | "pam";

export interface TProjectDetail extends TProject {
    description?: string | null;
    createdAt?: string;
    environments?: { id: string; name: string; slug: string }[];
}

export const listProjects = async ({ type }: { type?: ProjectType } = {}) =>
    withAuth(async (token) => {
        const res = await apiFetch<{ projects: TProjectDetail[] }>("/api/v1/projects", {
            token,
            searchParams: type ? { type } : {},
        });
        return res.data.projects;
    });

export const getCurrentProject = async () =>
    withAuth(async (token, projectId) => {
        const res = await apiFetch<{ project: TProjectDetail }>(`/api/v1/projects/${projectId}`, { token });
        return res.data.project;
    });

export const createProject = async ({
    name,
    description,
    type = "secret-manager",
}: {
    name: string;
    description?: string;
    type?: ProjectType;
}) =>
    withAuth(async (token) => {
        const res = await apiFetch<{ project: TProjectDetail }>("/api/v1/projects", {
            method: "POST",
            token,
            body: {
                projectName: name,
                ...(description ? { projectDescription: description } : {}),
                type,
            },
        });
        return res.data.project;
    });

export const renameProject = async ({ projectId, name }: { projectId: string; name: string }) =>
    withAuth(async (token) => {
        const res = await apiFetch<{ project: TProjectDetail }>(`/api/v1/projects/${projectId}`, {
            method: "PATCH",
            token,
            body: { name },
        });
        return res.data.project;
    });

export const deleteProject = async ({ projectId }: { projectId: string }) =>
    withAuth(async (token, currentProjectId) => {
        if (projectId === currentProjectId) {
            throw new Error("Switch to another project before deleting the active one.");
        }
        await apiFetch(`/api/v1/projects/${projectId}`, { method: "DELETE", token });
        return true;
    });

// Validates the target belongs to this session's org before swapping the
// active-project cookie every dashboard call is scoped by.
export const switchProject = async ({ projectId }: { projectId: string }) =>
    withAuth(async (token) => {
        const res = await apiFetch<{ project: TProjectDetail }>(`/api/v1/projects/${projectId}`, { token });
        setProjectCookie(res.data.project.id);
        return res.data.project;
    });
