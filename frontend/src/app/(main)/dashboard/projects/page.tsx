"use client";

import { CardSkeleton, ErrorCard } from "@/components/dashboard/data-states";
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
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ProjectType, TProjectDetail } from "@/actions/projects";
import {
    useCreateProject,
    useCurrentProject,
    useDeleteProject,
    useProjects,
    useRenameProject,
    useSwitchProject,
} from "@/hooks/use-projects";
import { format } from "date-fns";
import { Check, LoaderIcon, MoreHorizontal, Plus } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

const TYPE_LABELS: Record<string, string> = {
    "secret-manager": "API Keys",
    "cert-manager": "Certificates",
    kms: "KMS",
    ssh: "SSH",
    "secret-scanning": "Secret Scanning",
    pam: "PAM",
};

const ProjectsPage = () => {
    const projects = useProjects();
    const current = useCurrentProject();
    const createProject = useCreateProject();
    const renameProject = useRenameProject();
    const deleteProject = useDeleteProject();
    const switchProject = useSwitchProject();

    const [createOpen, setCreateOpen] = useState(false);
    const [newName, setNewName] = useState("");
    const [newType, setNewType] = useState<ProjectType>("secret-manager");

    const [renameTarget, setRenameTarget] = useState<TProjectDetail | null>(null);
    const [renameValue, setRenameValue] = useState("");

    const [deleteTarget, setDeleteTarget] = useState<TProjectDetail | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState("");

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) {
            toast.error("Project name is required");
            return;
        }
        try {
            const project = await createProject.mutateAsync({ name: newName.trim(), type: newType });
            toast.success(`Project ${project.name} created`);
            setCreateOpen(false);
            setNewName("");
            setNewType("secret-manager");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not create project");
        }
    };

    const handleRename = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!renameTarget || !renameValue.trim()) return;
        try {
            await renameProject.mutateAsync({ projectId: renameTarget.id, name: renameValue.trim() });
            toast.success("Project renamed");
            setRenameTarget(null);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not rename project");
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteProject.mutateAsync(deleteTarget.id);
            toast.success(`Project ${deleteTarget.name} deleted`);
            setDeleteTarget(null);
            setDeleteConfirm("");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not delete project");
        }
    };

    const handleSwitch = async (project: TProjectDetail) => {
        try {
            await switchProject.mutateAsync(project.id);
            toast.success(`Switched to ${project.name}`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not switch project");
        }
    };

    if (projects.isPending) {
        return <CardSkeleton className="min-h-[420px]" />;
    }

    if (projects.isError) {
        return (
            <ErrorCard
                message={projects.error.message}
                onRetry={() => projects.refetch()}
                className="min-h-[400px]"
            />
        );
    }

    const rows = projects.data;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Projects
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Group API keys, certificates, and budgets per environment or team. The active project scopes the rest of the dashboard.
                    </p>
                </div>
                <Button onClick={() => setCreateOpen(true)} className="gap-x-2">
                    <Plus className="h-4 w-4" />
                    New project
                </Button>
            </div>

            <div className="rounded-2xl bg-card p-6">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[60px]" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                                        No projects yet. Create one to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                            {rows.map((project) => {
                                const isActive = project.id === current.data?.id;
                                return (
                                    <TableRow key={project.id}>
                                        <TableCell className="text-sm font-medium">
                                            {project.name}
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                                                {TYPE_LABELS[project.type] ?? project.type}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {project.createdAt ? format(new Date(project.createdAt), "MMM d, yyyy") : "—"}
                                        </TableCell>
                                        <TableCell>
                                            {isActive ? (
                                                <span className="inline-flex items-center gap-x-1 text-xs font-medium text-emerald-500">
                                                    <Check className="h-3.5 w-3.5" />
                                                    Active
                                                </span>
                                            ) : project.type === "secret-manager" ? (
                                                <button
                                                    onClick={() => handleSwitch(project)}
                                                    className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                                                >
                                                    Switch to
                                                </button>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setRenameTarget(project);
                                                            setRenameValue(project.name);
                                                        }}
                                                    >
                                                        Rename
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        disabled={isActive}
                                                        onClick={() => setDeleteTarget(project)}
                                                    >
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create project</DialogTitle>
                        <DialogDescription>
                            API Keys projects hold tracked keys; Certificates projects hold CAs and issued certificates.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-project-name">Name</Label>
                            <Input
                                id="new-project-name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="e.g. Production"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select value={newType} onValueChange={(value) => setNewType(value as ProjectType)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="secret-manager">API Keys</SelectItem>
                                    <SelectItem value="cert-manager">Certificates</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createProject.isPending}>
                                {createProject.isPending ? <LoaderIcon className="h-4 w-4 animate-spin" /> : "Create"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={Boolean(renameTarget)} onOpenChange={(open) => !open && setRenameTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename project</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleRename} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="rename-project">Name</Label>
                            <Input
                                id="rename-project"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setRenameTarget(null)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={renameProject.isPending}>
                                {renameProject.isPending ? <LoaderIcon className="h-4 w-4 animate-spin" /> : "Save"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={Boolean(deleteTarget)}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteTarget(null);
                        setDeleteConfirm("");
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete project</DialogTitle>
                        <DialogDescription>
                            This permanently deletes <span className="font-medium text-foreground">{deleteTarget?.name}</span> and
                            every API key, certificate, and record inside it. Type the project name to confirm.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        placeholder={deleteTarget?.name}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={deleteConfirm !== deleteTarget?.name || deleteProject.isPending}
                            onClick={handleDelete}
                        >
                            {deleteProject.isPending ? <LoaderIcon className="h-4 w-4 animate-spin" /> : "Delete project"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ProjectsPage;
