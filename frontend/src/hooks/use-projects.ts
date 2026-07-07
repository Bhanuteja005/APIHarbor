"use client";

import {
    createProject,
    deleteProject,
    getCurrentProject,
    listProjects,
    ProjectType,
    renameProject,
    switchProject,
} from "@/actions/projects";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { unwrap } from "./query-utils";

export const useProjects = (type?: ProjectType) =>
    useQuery({
        queryKey: ["projects", type ?? "all"],
        queryFn: async () => unwrap(await listProjects(type ? { type } : {})),
    });

export const useCurrentProject = () =>
    useQuery({
        queryKey: ["current-project"],
        queryFn: async () => unwrap(await getCurrentProject()),
    });

const useInvalidateProjects = () => {
    const client = useQueryClient();
    return () => {
        client.invalidateQueries({ queryKey: ["projects"] });
        client.invalidateQueries({ queryKey: ["current-project"] });
        client.invalidateQueries({ queryKey: ["product-stats"] });
    };
};

export const useCreateProject = () => {
    const invalidate = useInvalidateProjects();
    return useMutation({
        mutationFn: async (input: { name: string; description?: string; type?: ProjectType }) =>
            unwrap(await createProject(input)),
        onSuccess: invalidate,
    });
};

export const useRenameProject = () => {
    const invalidate = useInvalidateProjects();
    return useMutation({
        mutationFn: async (input: { projectId: string; name: string }) => unwrap(await renameProject(input)),
        onSuccess: invalidate,
    });
};

export const useDeleteProject = () => {
    const invalidate = useInvalidateProjects();
    return useMutation({
        mutationFn: async (projectId: string) => unwrap(await deleteProject({ projectId })),
        onSuccess: invalidate,
    });
};

export const useSwitchProject = () => {
    const client = useQueryClient();
    return useMutation({
        mutationFn: async (projectId: string) => unwrap(await switchProject({ projectId })),
        // Every project-scoped dataset (keys, spend, usage) must refetch under
        // the new active project.
        onSuccess: () => client.invalidateQueries(),
    });
};
