"use client";

import { CardSkeleton, ErrorCard } from "@/components/dashboard/data-states";
import KeyDetailsSheet from "@/components/dashboard/key-details-sheet";
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
    DropdownMenuSeparator,
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
import { Textarea } from "@/components/ui/textarea";
import {
    useApiKeys,
    useCreateApiKey,
    useDeleteApiKey,
    useRecordUsage,
    useRevealApiKey,
    useSpendSummary,
    useUpdateApiKey,
    useValidateApiKey,
} from "@/hooks/use-api-keys";
import { ApiKeyHealthStatus, ApiKeyProvider, TApiKey } from "@/lib/api/types";
import { cn } from "@/utils";
import { formatDistanceToNow } from "date-fns";
import { Eye, EyeOff, MoreHorizontal, PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const PROVIDER_OPTIONS: ApiKeyProvider[] = ["openai", "anthropic", "stripe", "github", "generic"];

const PROVIDER_LABELS: Record<ApiKeyProvider, string> = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    stripe: "Stripe",
    github: "GitHub",
    generic: "Generic",
};

const HEALTH_META: Record<
    ApiKeyHealthStatus,
    { label: string; dot: string; badge: string }
> = {
    healthy: {
        label: "Healthy",
        dot: "bg-emerald-500",
        badge: "bg-emerald-500/10 text-emerald-500",
    },
    invalid: {
        label: "Needs rotation",
        dot: "bg-amber-500",
        badge: "bg-amber-500/10 text-amber-500",
    },
    error: {
        label: "Failing",
        dot: "bg-red-500",
        badge: "bg-red-500/10 text-red-500",
    },
    unknown: {
        label: "Unknown",
        dot: "bg-muted-foreground",
        badge: "bg-muted text-muted-foreground",
    },
};

const EMPTY_FORM = {
    name: "",
    provider: "openai" as ApiKeyProvider,
    secret: "",
    testUrl: "",
    description: "",
};

const relativeTime = (iso?: string | null) =>
    iso ? `${formatDistanceToNow(new Date(iso))} ago` : "never";

const ApiKeysPage = () => {

    const keysQuery = useApiKeys();
    const summaryQuery = useSpendSummary();

    const createKey = useCreateApiKey();
    const updateKey = useUpdateApiKey();
    const deleteKey = useDeleteApiKey();
    const validateKey = useValidateApiKey();
    const revealKey = useRevealApiKey();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [revealed, setRevealed] = useState<Record<string, string>>({});
    const [budgetTarget, setBudgetTarget] = useState<TApiKey | null>(null);
    const [budgetValue, setBudgetValue] = useState("");
    const [detailsTarget, setDetailsTarget] = useState<TApiKey | null>(null);
    const [editTarget, setEditTarget] = useState<TApiKey | null>(null);
    const [editForm, setEditForm] = useState({ name: "", description: "", secret: "" });
    const [usageTarget, setUsageTarget] = useState<TApiKey | null>(null);
    const [usageForm, setUsageForm] = useState({ requests: "", costUsd: "" });
    const recordUsage = useRecordUsage();

    const handleRecordUsage = async () => {
        if (!usageTarget) return;
        const requests = usageForm.requests.trim() === "" ? 0 : Number(usageForm.requests);
        const costUsd = usageForm.costUsd.trim() === "" ? 0 : Number(usageForm.costUsd);
        if (Number.isNaN(requests) || Number.isNaN(costUsd) || requests < 0 || costUsd < 0) {
            toast.error("Enter valid usage numbers.");
            return;
        }
        if (requests === 0 && costUsd === 0) {
            toast.error("Enter requests, spend, or both.");
            return;
        }
        try {
            await recordUsage.mutateAsync({
                apiKeyId: usageTarget.id,
                requests: requests || undefined,
                costUsd: costUsd || undefined,
            });
            toast.success(`Usage recorded for ${usageTarget.name}.`);
            setUsageTarget(null);
            setUsageForm({ requests: "", costUsd: "" });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Couldn't record usage.");
        }
    };

    const openEdit = (row: TApiKey) => {
        setEditTarget(row);
        setEditForm({ name: row.name, description: row.description ?? "", secret: "" });
    };

    const handleSaveEdit = async () => {
        if (!editTarget) return;
        const name = editForm.name.trim();
        if (!name) {
            toast.error("Name is required.");
            return;
        }
        try {
            await updateKey.mutateAsync({
                apiKeyId: editTarget.id,
                name,
                description: editForm.description.trim() || undefined,
                ...(editForm.secret.trim() ? { apiKey: editForm.secret.trim() } : {}),
            });
            toast.success(
                editForm.secret.trim()
                    ? `${name} was updated and the new secret was validated.`
                    : `${name} was updated.`
            );
            setEditTarget(null);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Couldn't update this key.");
        }
    };

    const handleToggleMonitoring = async (row: TApiKey) => {
        try {
            await updateKey.mutateAsync({
                apiKeyId: row.id,
                monitoringEnabled: !row.monitoringEnabled,
            });
            toast.success(
                row.monitoringEnabled
                    ? `Automatic health checks paused for ${row.name}.`
                    : `Automatic health checks resumed for ${row.name}.`
            );
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Couldn't update monitoring.");
        }
    };

    const toggleReveal = async (row: TApiKey) => {
        if (revealed[row.id]) {
            setRevealed((prev) => {
                const next = { ...prev };
                delete next[row.id];
                return next;
            });
            return;
        }
        try {
            const value = await revealKey.mutateAsync(row.id);
            setRevealed((prev) => ({ ...prev, [row.id]: value }));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Couldn't reveal this key.");
        }
    };

    const handleValidate = async (row: TApiKey) => {
        const pending = toast.loading(`Validating ${row.name}...`);
        try {
            const { result } = await validateKey.mutateAsync(row.id);
            toast.dismiss(pending);
            if (result.status === "healthy") {
                toast.success(`${row.name} is healthy · ${result.latencyMs}ms`);
            } else if (result.status === "invalid") {
                toast.warning(`${row.name} needs rotation · ${result.message ?? "provider rejected the key"}`);
            } else {
                toast.error(`${row.name}: ${result.message ?? result.status} · ${result.latencyMs}ms`);
            }
        } catch (error) {
            toast.dismiss(pending);
            toast.error(error instanceof Error ? error.message : "Validation failed.");
        }
    };

    const handleDelete = async (row: TApiKey) => {
        try {
            await deleteKey.mutateAsync(row.id);
            toast.success(`${row.name} was removed from this project.`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Couldn't delete this key.");
        }
    };

    const handleSaveBudget = async () => {
        if (!budgetTarget) return;
        const parsed = budgetValue.trim() === "" ? null : Number(budgetValue);
        if (parsed !== null && (Number.isNaN(parsed) || parsed < 0)) {
            toast.error("Enter a valid budget amount.");
            return;
        }
        try {
            await updateKey.mutateAsync({ apiKeyId: budgetTarget.id, monthlyBudgetUsd: parsed });
            toast.success(
                parsed === null
                    ? `Budget removed for ${budgetTarget.name}.`
                    : `Budget for ${budgetTarget.name} set to $${parsed}/month.`
            );
            setBudgetTarget(null);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Couldn't update the budget.");
        }
    };

    const handleAddKey = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const name = form.name.trim();
        const secret = form.secret.trim();
        if (!name || !secret) {
            toast.error("Name and API key are required.");
            return;
        }
        if (form.provider === "generic" && !form.testUrl.trim()) {
            toast.error("A validation test URL is required for generic keys.");
            return;
        }

        try {
            const created = await createKey.mutateAsync({
                name,
                provider: form.provider,
                apiKey: secret,
                description: form.description.trim() || undefined,
                validationConfig:
                    form.provider === "generic"
                        ? { testUrl: form.testUrl.trim() }
                        : undefined,
            });
            setForm(EMPTY_FORM);
            setDialogOpen(false);
            if (created.healthStatus === "healthy") {
                toast.success(`${name} was added and validated · healthy`);
            } else {
                toast.success(`${name} was added. First health check ${created.healthStatus === "unknown" ? "is queued" : `returned: ${created.healthStatus}`}.`);
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Couldn't add this key.");
        }
    };

    if (keysQuery.isPending) {
        return (
            <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                    <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
                </div>
                <CardSkeleton className="min-h-[360px]" />
            </div>
        );
    }

    if (keysQuery.isError) {
        return (
            <ErrorCard
                message={keysQuery.error.message}
                onRetry={() => keysQuery.refetch()}
                className="min-h-[400px]"
            />
        );
    }

    const rows = keysQuery.data;
    const spendByKey = new Map(
        (summaryQuery.data?.keys ?? []).map((entry) => [entry.id, entry])
    );

    const stats = [
        { label: "Total keys", value: rows.length, dot: null as string | null },
        { label: "Healthy", value: rows.filter((r) => r.healthStatus === "healthy").length, dot: HEALTH_META.healthy.dot },
        { label: "Needs rotation", value: rows.filter((r) => r.healthStatus === "invalid").length, dot: HEALTH_META.invalid.dot },
        { label: "Failing", value: rows.filter((r) => r.healthStatus === "error").length, dot: HEALTH_META.error.dot },
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">
                        API Keys
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Track the health, usage, and spend of every key in this project.
                    </p>
                </div>
                <Button onClick={() => setDialogOpen(true)}>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Add API Key
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl bg-card p-5">
                        <div className="flex items-center gap-2">
                            {stat.dot && <span className={cn("h-2 w-2 rounded-full", stat.dot)} />}
                            <p className="text-sm text-muted-foreground">
                                {stat.label}
                            </p>
                        </div>
                        <p className="mt-2 text-3xl font-semibold">
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl bg-card p-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold">
                        All keys
                    </h2>
                    <span className="text-sm text-muted-foreground">
                        {rows.length} {rows.length === 1 ? "key" : "keys"}
                    </span>
                </div>
                <div className="mt-4 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Name</TableHead>
                                <TableHead>Provider</TableHead>
                                <TableHead>Key</TableHead>
                                <TableHead>Health</TableHead>
                                <TableHead>Usage</TableHead>
                                <TableHead>This month</TableHead>
                                <TableHead>Last checked</TableHead>
                                <TableHead className="w-10" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                                        No keys yet. Add your first API key to start monitoring its health.
                                    </TableCell>
                                </TableRow>
                            )}
                            {rows.map((row) => {
                                const health = HEALTH_META[row.healthStatus] ?? HEALTH_META.unknown;
                                const spend = spendByKey.get(row.id);
                                const spentUsd = (spend?.spentCents ?? 0) / 100;
                                const budgetUsd = row.monthlyBudgetCents ? row.monthlyBudgetCents / 100 : null;
                                const isRevealed = !!revealed[row.id];

                                return (
                                    <TableRow key={row.id}>
                                        <TableCell className="align-top">
                                            <p className="font-medium">{row.name}</p>
                                            {row.description && (
                                                <p className="mt-0.5 max-w-[220px] truncate text-xs text-muted-foreground">
                                                    {row.description}
                                                </p>
                                            )}
                                        </TableCell>
                                        <TableCell className="align-top">
                                            {PROVIDER_LABELS[row.provider] ?? row.provider}
                                        </TableCell>
                                        <TableCell className="align-top">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs">
                                                    {isRevealed ? revealed[row.id] : row.maskedKey}
                                                </span>
                                                <button
                                                    onClick={() => toggleReveal(row)}
                                                    aria-label={isRevealed ? "Hide key" : "Reveal key"}
                                                    className="text-muted-foreground transition-colors hover:text-foreground"
                                                >
                                                    {isRevealed
                                                        ? <EyeOff className="h-3.5 w-3.5" />
                                                        : <Eye className="h-3.5 w-3.5" />}
                                                </button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="align-top">
                                            <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium", health.badge)}>
                                                <span className={cn("h-1.5 w-1.5 rounded-full", health.dot)} />
                                                {health.label}
                                            </span>
                                            {row.lastMessage && (
                                                <p className="mt-1 max-w-[180px] truncate text-xs text-muted-foreground">
                                                    {row.lastMessage}
                                                </p>
                                            )}
                                        </TableCell>
                                        <TableCell className="align-top">
                                            {row.quotaLimit != null ? (
                                                <p className="text-sm">
                                                    {(row.quotaRemaining ?? 0).toLocaleString("en-US")}{" "}
                                                    <span className="text-muted-foreground">/ {row.quotaLimit.toLocaleString("en-US")}</span>
                                                </p>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">—</p>
                                            )}
                                            {row.lastLatencyMs != null && row.lastLatencyMs > 0 && (
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    {row.lastLatencyMs}ms
                                                </p>
                                            )}
                                        </TableCell>
                                        <TableCell className="align-top">
                                            <p className="text-sm">
                                                ${spentUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                            {budgetUsd != null && (
                                                <>
                                                    <div className="mt-1.5 h-1 w-[60px] overflow-hidden rounded-full bg-muted">
                                                        <div
                                                            className={cn(
                                                                "h-full rounded-full",
                                                                spend?.overBudget ? "bg-red-500" : "bg-primary"
                                                            )}
                                                            style={{ width: `${Math.min((spentUsd / budgetUsd) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                                        of ${budgetUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                                                    </p>
                                                </>
                                            )}
                                        </TableCell>
                                        <TableCell className="align-top text-sm text-muted-foreground">
                                            {relativeTime(row.lastCheckedAt)}
                                        </TableCell>
                                        <TableCell className="align-top">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        aria-label="Key actions"
                                                        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setDetailsTarget(row)}>
                                                        View history
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleValidate(row)}>
                                                        Validate now
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => toggleReveal(row)}>
                                                        {isRevealed ? "Hide key" : "Reveal key"}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => openEdit(row)}>
                                                        Edit key
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setBudgetTarget(row);
                                                            setBudgetValue(budgetUsd != null ? String(budgetUsd) : "");
                                                        }}
                                                    >
                                                        Set budget
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleToggleMonitoring(row)}>
                                                        {row.monitoringEnabled ? "Pause monitoring" : "Resume monitoring"}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setUsageTarget(row)}>
                                                        Record usage
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-red-500 focus:text-red-500"
                                                        onClick={() => handleDelete(row)}
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

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add API Key</DialogTitle>
                        <DialogDescription>
                            The key is encrypted at rest and validated right after it&apos;s added.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddKey} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="key-name">Name</Label>
                            <Input
                                id="key-name"
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                placeholder="prod-backend"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label>Provider</Label>
                            <Select
                                value={form.provider}
                                onValueChange={(value) => setForm((f) => ({ ...f, provider: value as ApiKeyProvider }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PROVIDER_OPTIONS.map((provider) => (
                                        <SelectItem key={provider} value={provider}>
                                            {PROVIDER_LABELS[provider]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="key-secret">API Key</Label>
                            <Input
                                id="key-secret"
                                type="password"
                                value={form.secret}
                                onChange={(e) => setForm((f) => ({ ...f, secret: e.target.value }))}
                                placeholder="sk-..."
                            />
                        </div>
                        {form.provider === "generic" && (
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="key-test-url">Validation test URL</Label>
                                <Input
                                    id="key-test-url"
                                    value={form.testUrl}
                                    onChange={(e) => setForm((f) => ({ ...f, testUrl: e.target.value }))}
                                    placeholder="https://api.example.com/v1/me"
                                />
                            </div>
                        )}
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="key-description">Description <span className="text-muted-foreground">(optional)</span></Label>
                            <Textarea
                                id="key-description"
                                value={form.description}
                                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                placeholder="What does this key power?"
                                rows={2}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={createKey.isPending}>
                                {createKey.isPending ? "Adding..." : "Add key"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!budgetTarget} onOpenChange={(open) => !open && setBudgetTarget(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Set monthly budget</DialogTitle>
                        <DialogDescription>
                            {budgetTarget ? `Spend limit for ${budgetTarget.name}. Leave empty to remove the budget.` : ""}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="budget-usd">Budget (USD / month)</Label>
                        <Input
                            id="budget-usd"
                            type="number"
                            min="0"
                            step="1"
                            value={budgetValue}
                            onChange={(e) => setBudgetValue(e.target.value)}
                            placeholder="200"
                        />
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSaveBudget} disabled={updateKey.isPending}>
                            {updateKey.isPending ? "Saving..." : "Save budget"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit API Key</DialogTitle>
                        <DialogDescription>
                            Update the key&apos;s details, or paste a new secret to rotate it.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="edit-key-name">Name</Label>
                            <Input
                                id="edit-key-name"
                                value={editForm.name}
                                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="edit-key-description">
                                Description <span className="text-muted-foreground">(optional)</span>
                            </Label>
                            <Textarea
                                id="edit-key-description"
                                value={editForm.description}
                                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                                rows={2}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="edit-key-secret">
                                New secret <span className="text-muted-foreground">(leave empty to keep the current one)</span>
                            </Label>
                            <Input
                                id="edit-key-secret"
                                type="password"
                                value={editForm.secret}
                                onChange={(e) => setEditForm((f) => ({ ...f, secret: e.target.value }))}
                                placeholder="sk-..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSaveEdit} disabled={updateKey.isPending}>
                            {updateKey.isPending ? "Saving..." : "Save changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!usageTarget} onOpenChange={(open) => !open && setUsageTarget(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Record usage</DialogTitle>
                        <DialogDescription>
                            {usageTarget ? `Log today's requests and spend for ${usageTarget.name}. Amounts add to today's totals.` : ""}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="usage-requests">Requests</Label>
                            <Input
                                id="usage-requests"
                                type="number"
                                min="0"
                                value={usageForm.requests}
                                onChange={(e) => setUsageForm((f) => ({ ...f, requests: e.target.value }))}
                                placeholder="1000"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="usage-cost">Spend (USD)</Label>
                            <Input
                                id="usage-cost"
                                type="number"
                                min="0"
                                step="0.01"
                                value={usageForm.costUsd}
                                onChange={(e) => setUsageForm((f) => ({ ...f, costUsd: e.target.value }))}
                                placeholder="12.50"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleRecordUsage} disabled={recordUsage.isPending}>
                            {recordUsage.isPending ? "Recording..." : "Record usage"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <KeyDetailsSheet apiKey={detailsTarget} onClose={() => setDetailsTarget(null)} />
        </div>
    );
};

export default ApiKeysPage;
