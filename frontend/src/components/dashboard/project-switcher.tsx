"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateProject, useCurrentProject, useProjects, useSwitchProject } from "@/hooks/use-projects";
import { cn } from "@/utils";
import { Check, ChevronsUpDown, FolderKanban, LoaderIcon, Plus } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

const ProjectSwitcher = () => {
    const projects = useProjects("secret-manager");
    const current = useCurrentProject();
    const switchProject = useSwitchProject();
    const createProject = useCreateProject();

    const [createOpen, setCreateOpen] = useState(false);
    const [name, setName] = useState("");

    const handleSwitch = async (projectId: string) => {
        if (projectId === current.data?.id) return;
        try {
            const project = await switchProject.mutateAsync(projectId);
            toast.success(`Switched to ${project.name}`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not switch project");
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Project name is required");
            return;
        }
        try {
            const project = await createProject.mutateAsync({ name: name.trim() });
            await switchProject.mutateAsync(project.id);
            toast.success(`Project ${project.name} created`);
            setCreateOpen(false);
            setName("");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not create project");
        }
    };

    const isBusy = switchProject.isPending || createProject.isPending;

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="flex h-11 w-full items-center gap-x-2.5 rounded-lg bg-muted px-3 text-sm font-medium transition-colors hover:bg-muted/80">
                        <FolderKanban className="h-5 w-5 shrink-0" />
                        <span className="truncate">
                            {current.data?.name ?? "Select project"}
                        </span>
                        {isBusy ? (
                            <LoaderIcon className="ml-auto h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                        ) : (
                            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[230px]">
                    <DropdownMenuLabel>Projects</DropdownMenuLabel>
                    {(projects.data ?? []).map((project) => (
                        <DropdownMenuItem
                            key={project.id}
                            onClick={() => handleSwitch(project.id)}
                            className="flex items-center gap-x-2"
                        >
                            <Check
                                className={cn(
                                    "h-4 w-4",
                                    project.id === current.data?.id ? "opacity-100" : "opacity-0"
                                )}
                            />
                            <span className="truncate">{project.name}</span>
                        </DropdownMenuItem>
                    ))}
                    {projects.isLoading && (
                        <DropdownMenuItem disabled>Loading projects...</DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setCreateOpen(true)} className="flex items-center gap-x-2">
                        <Plus className="h-4 w-4" />
                        New project
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create project</DialogTitle>
                        <DialogDescription>
                            Projects group your API keys, usage, and budgets. You can switch between them anytime.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="project-name">Project name</Label>
                            <Input
                                id="project-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Production, Staging"
                                autoFocus
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createProject.isPending}>
                                {createProject.isPending ? (
                                    <LoaderIcon className="h-4 w-4 animate-spin" />
                                ) : "Create project"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ProjectSwitcher;
