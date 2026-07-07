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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    useAppConnections,
    useCreateAnthropicConnection,
    useCreateGitHubConnection,
    useDeleteAppConnection,
} from "@/hooks/use-integrations";
import { format } from "date-fns";
import { Blocks, Github, LoaderIcon, Plus, Sparkles, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

type ProviderChoice = "github" | "anthropic";

const PROVIDERS: {
    id: ProviderChoice;
    name: string;
    description: string;
    credentialLabel: string;
    credentialPlaceholder: string;
    icon: React.ComponentType<{ className?: string }>;
}[] = [
    {
        id: "github",
        name: "GitHub",
        description: "Connect with a personal access token to sync and scan repositories.",
        credentialLabel: "Personal access token",
        credentialPlaceholder: "ghp_...",
        icon: Github,
    },
    {
        id: "anthropic",
        name: "Anthropic",
        description: "Connect with an API key to manage Anthropic resources.",
        credentialLabel: "API key",
        credentialPlaceholder: "sk-ant-...",
        icon: Sparkles,
    },
];

const IntegrationsPage = () => {
    const connections = useAppConnections();
    const createGitHub = useCreateGitHubConnection();
    const createAnthropic = useCreateAnthropicConnection();
    const deleteConnection = useDeleteAppConnection();

    const [addOpen, setAddOpen] = useState(false);
    const [provider, setProvider] = useState<ProviderChoice>("github");
    const [name, setName] = useState("");
    const [credential, setCredential] = useState("");

    const selected = PROVIDERS.find((p) => p.id === provider)!;
    const isCreating = createGitHub.isPending || createAnthropic.isPending;

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !credential.trim()) {
            toast.error("Name and credential are required");
            return;
        }
        try {
            if (provider === "github") {
                await createGitHub.mutateAsync({ name: name.trim(), personalAccessToken: credential.trim() });
            } else {
                await createAnthropic.mutateAsync({ name: name.trim(), apiKey: credential.trim() });
            }
            toast.success(`${selected.name} connection created`);
            setAddOpen(false);
            setName("");
            setCredential("");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not create connection — check the credential.");
        }
    };

    const handleDelete = async (app: string, connectionId: string, connectionName: string) => {
        try {
            await deleteConnection.mutateAsync({ app, connectionId });
            toast.success(`Removed ${connectionName}`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not remove connection");
        }
    };

    if (connections.isPending) {
        return <CardSkeleton className="min-h-[420px]" />;
    }

    if (connections.isError) {
        return (
            <ErrorCard
                message={connections.error.message}
                onRetry={() => connections.refetch()}
                className="min-h-[400px]"
            />
        );
    }

    const rows = connections.data;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Integrations</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        App connections to third-party services, reusable across your projects.
                    </p>
                </div>
                <Button onClick={() => setAddOpen(true)} className="gap-x-2">
                    <Plus className="h-4 w-4" />
                    Add connection
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {PROVIDERS.map((p) => (
                    <div key={p.id} className="rounded-2xl bg-card p-6">
                        <div className="flex items-center gap-x-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                                <p.icon className="h-5 w-5" />
                            </div>
                            <p className="text-sm font-semibold">{p.name}</p>
                            <Button
                                size="sm"
                                variant="outline"
                                className="ml-auto"
                                onClick={() => {
                                    setProvider(p.id);
                                    setAddOpen(true);
                                }}
                            >
                                Connect
                            </Button>
                        </div>
                        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                            {p.description}
                        </p>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl bg-card p-6">
                <div className="flex items-center gap-x-2.5">
                    <Blocks className="h-5 w-5" />
                    <h2 className="text-sm font-semibold">Configured connections</h2>
                </div>
                <div className="mt-4 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Name</TableHead>
                                <TableHead>App</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="w-[60px]" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                                        No app connections configured. Add one to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                            {rows.map((connection) => (
                                <TableRow key={connection.id}>
                                    <TableCell className="text-sm font-medium">
                                        {connection.name}
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium capitalize">
                                            {connection.app}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm capitalize text-muted-foreground">
                                        {connection.method}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {format(new Date(connection.createdAt), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            aria-label={`Remove ${connection.name}`}
                                            disabled={deleteConnection.isPending}
                                            onClick={() => handleDelete(connection.app, connection.id, connection.name)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add {selected.name} connection</DialogTitle>
                        <DialogDescription>
                            Credentials are encrypted at rest and never exposed to the browser after saving.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Provider</Label>
                            <div className="flex gap-2">
                                {PROVIDERS.map((p) => (
                                    <Button
                                        key={p.id}
                                        type="button"
                                        size="sm"
                                        variant={provider === p.id ? "primary" : "outline"}
                                        className="gap-x-2"
                                        onClick={() => setProvider(p.id)}
                                    >
                                        <p.icon className="h-4 w-4" />
                                        {p.name}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="connection-name">Connection name</Label>
                            <Input
                                id="connection-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. org-github"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="connection-credential">{selected.credentialLabel}</Label>
                            <Input
                                id="connection-credential"
                                type="password"
                                value={credential}
                                onChange={(e) => setCredential(e.target.value)}
                                placeholder={selected.credentialPlaceholder}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isCreating}>
                                {isCreating ? <LoaderIcon className="h-4 w-4 animate-spin" /> : "Create connection"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default IntegrationsPage;
