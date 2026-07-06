import { useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { useParams } from "@tanstack/react-router";
import {
  AlertTriangle,
  DollarSign,
  EllipsisVertical,
  Gauge,
  KeyRound,
  PenLine,
  Receipt,
  ShieldAlert,
  ShieldCheck
} from "lucide-react";

import { createNotification } from "@app/components/notifications";
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldLabel,
  Input,
  Skeleton
} from "@app/components/v3";
import { cn } from "@app/components/v3/utils";
import {
  ApiKeyProvider,
  TApiKey,
  useCreateApiKey,
  useDeleteApiKey,
  useGetApiKeys,
  useGetApiKeySpend,
  useRecordApiKeyUsage,
  useRevealApiKey,
  useUpdateApiKey,
  useValidateApiKey
} from "@app/hooks/api/apiKeys";

const SPEND_WINDOW_DAYS = 30;

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  stripe: "Stripe",
  github: "GitHub",
  generic: "Generic / Custom"
};

const healthBadge = (status: string) => {
  const map: Record<string, string> = {
    healthy: "border-green-500/30 bg-green-500/20 text-green-400",
    invalid: "border-red-500/30 bg-red-500/20 text-red-400",
    error: "border-amber-500/30 bg-amber-500/20 text-amber-400",
    unknown: "border-mineshaft-500/40 bg-mineshaft-500/20 text-gray-400"
  };
  const cls = map[status] ?? map.unknown;
  return (
    <span className={`rounded border px-2 py-0.5 text-xs font-medium capitalize ${cls}`}>{status}</span>
  );
};

const formatUsd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const emptyForm = {
  name: "",
  provider: ApiKeyProvider.OpenAI,
  apiKey: "",
  description: "",
  testUrl: ""
};

const emptyUsageForm = { requests: "", costUsd: "" };

type TStatTileVariant = "neutral" | "success" | "danger" | "warning" | "info";

const STAT_TILE_VARIANT_CLASSES: Record<TStatTileVariant, string> = {
  neutral: "border-mineshaft-500/40 bg-mineshaft-500/20 text-gray-300",
  success: "border-green-500/30 bg-green-500/20 text-green-400",
  danger: "border-red-500/30 bg-red-500/20 text-red-400",
  warning: "border-amber-500/30 bg-amber-500/20 text-amber-400",
  info: "border-primary-500/30 bg-primary-500/20 text-primary-400"
};

const StatTile = ({
  label,
  value,
  icon,
  variant
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  variant: TStatTileVariant;
}) => (
  <Card className="gap-3 p-4">
    <CardHeader className="gap-0 pb-0">
      <CardTitle className="text-xs font-normal text-bunker-300">{label}</CardTitle>
      <CardAction>
        <div
          className={cn(
            "flex size-8 items-center justify-center rounded-md border [&>svg]:size-4",
            STAT_TILE_VARIANT_CLASSES[variant]
          )}
        >
          {icon}
        </div>
      </CardAction>
    </CardHeader>
    <CardContent>
      <span className="text-2xl font-semibold text-gray-100">{value}</span>
    </CardContent>
  </Card>
);

export const ApiKeysPage = () => {
  const { projectId } = useParams({ strict: false }) as { projectId: string };
  const { data: apiKeys, isLoading, error } = useGetApiKeys(projectId);
  const { data: spend, isLoading: isSpendLoading } = useGetApiKeySpend(projectId, SPEND_WINDOW_DAYS);

  const createApiKey = useCreateApiKey();
  const deleteApiKey = useDeleteApiKey();
  const validateApiKey = useValidateApiKey();
  const revealApiKey = useRevealApiKey();
  const updateApiKey = useUpdateApiKey();
  const recordUsage = useRecordApiKeyUsage();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TApiKey | null>(null);
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const [budgetTarget, setBudgetTarget] = useState<TApiKey | null>(null);
  const [budgetValue, setBudgetValue] = useState("");

  const [usageTarget, setUsageTarget] = useState<TApiKey | null>(null);
  const [usageForm, setUsageForm] = useState(emptyUsageForm);

  const spendByKeyId = useMemo(() => {
    const map = new Map<string, NonNullable<typeof spend>["keys"][number]>();
    spend?.keys.forEach((k) => map.set(k.id, k));
    return map;
  }, [spend]);

  const providersByCost = useMemo(
    () => [...(spend?.byProvider ?? [])].sort((a, b) => b.costCents - a.costCents),
    [spend]
  );

  const maxDayCostCents = useMemo(
    () => Math.max(1, ...(spend?.byDay.map((d) => d.costCents) ?? [1])),
    [spend]
  );

  const hasUsage = Boolean(spend && (spend.totalRequests > 0 || spend.totalCostCents > 0));

  const handleCreate = async () => {
    if (!form.name.trim() || !form.apiKey.trim()) {
      createNotification({ type: "error", text: "Name and API key are required" });
      return;
    }
    try {
      await createApiKey.mutateAsync({
        projectId,
        name: form.name.trim(),
        provider: form.provider,
        apiKey: form.apiKey.trim(),
        description: form.description.trim() || undefined,
        validationConfig:
          form.provider === ApiKeyProvider.Generic && form.testUrl.trim()
            ? { testUrl: form.testUrl.trim() }
            : undefined
      });
      createNotification({ type: "success", text: "API key added" });
      setIsAddOpen(false);
      setForm(emptyForm);
    } catch {
      createNotification({ type: "error", text: "Failed to add API key" });
    }
  };

  const handleValidate = async (k: TApiKey) => {
    setValidatingId(k.id);
    try {
      const { result } = await validateApiKey.mutateAsync({ apiKeyId: k.id, projectId });
      createNotification({
        type: result.status === "healthy" ? "success" : "error",
        text: `${k.name}: ${result.message ?? result.status}`
      });
    } catch {
      createNotification({ type: "error", text: "Validation failed" });
    } finally {
      setValidatingId(null);
    }
  };

  const handleReveal = async (k: TApiKey) => {
    if (revealed[k.id]) {
      setRevealed((r) => {
        const next = { ...r };
        delete next[k.id];
        return next;
      });
      return;
    }
    try {
      const { value } = await revealApiKey.mutateAsync({ apiKeyId: k.id, projectId });
      setRevealed((r) => ({ ...r, [k.id]: value }));
    } catch {
      createNotification({ type: "error", text: "Failed to reveal key" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteApiKey.mutateAsync({ apiKeyId: deleteTarget.id, projectId });
      createNotification({ type: "success", text: "API key deleted" });
    } catch {
      createNotification({ type: "error", text: "Failed to delete API key" });
    } finally {
      setDeleteTarget(null);
    }
  };

  const openBudgetModal = (k: TApiKey) => {
    setBudgetTarget(k);
    setBudgetValue(k.monthlyBudgetCents != null ? (k.monthlyBudgetCents / 100).toFixed(2) : "");
  };

  const handleSaveBudget = async () => {
    if (!budgetTarget) return;
    const trimmed = budgetValue.trim();
    const monthlyBudgetUsd = trimmed === "" ? null : Number(trimmed);
    if (monthlyBudgetUsd !== null && (Number.isNaN(monthlyBudgetUsd) || monthlyBudgetUsd < 0)) {
      createNotification({ type: "error", text: "Enter a valid budget amount" });
      return;
    }
    try {
      await updateApiKey.mutateAsync({ apiKeyId: budgetTarget.id, projectId, monthlyBudgetUsd });
      createNotification({
        type: "success",
        text: monthlyBudgetUsd === null ? "Budget cleared" : "Budget updated"
      });
      setBudgetTarget(null);
    } catch {
      createNotification({ type: "error", text: "Failed to update budget" });
    }
  };

  const handleClearBudget = async () => {
    if (!budgetTarget) return;
    try {
      await updateApiKey.mutateAsync({ apiKeyId: budgetTarget.id, projectId, monthlyBudgetUsd: null });
      createNotification({ type: "success", text: "Budget cleared" });
      setBudgetTarget(null);
    } catch {
      createNotification({ type: "error", text: "Failed to clear budget" });
    }
  };

  const openUsageModal = (k: TApiKey) => {
    setUsageTarget(k);
    setUsageForm(emptyUsageForm);
  };

  const handleRecordUsage = async () => {
    if (!usageTarget) return;
    const requests = usageForm.requests.trim() ? Number(usageForm.requests) : undefined;
    const costUsd = usageForm.costUsd.trim() ? Number(usageForm.costUsd) : undefined;

    if (requests === undefined && costUsd === undefined) {
      createNotification({ type: "error", text: "Enter at least a request count or a cost" });
      return;
    }
    if (
      (requests !== undefined && (Number.isNaN(requests) || requests < 0)) ||
      (costUsd !== undefined && (Number.isNaN(costUsd) || costUsd < 0))
    ) {
      createNotification({ type: "error", text: "Enter valid, non-negative numbers" });
      return;
    }

    try {
      await recordUsage.mutateAsync({ apiKeyId: usageTarget.id, projectId, requests, costUsd });
      createNotification({ type: "success", text: "Usage recorded" });
      setUsageTarget(null);
      setUsageForm(emptyUsageForm);
    } catch {
      createNotification({ type: "error", text: "Failed to record usage" });
    }
  };

  return (
    <>
      <Helmet>
        <title>API Keys | APIHarbor</title>
      </Helmet>
      <div className="flex h-full w-full justify-center bg-bunker-800 text-white">
        <div className="w-full max-w-8xl px-6">
          <div className="my-6 flex items-center justify-between">
            <div>
              <p className="text-3xl font-medium text-gray-200">API Keys</p>
              <p className="text-sm text-bunker-300">
                Store provider API keys encrypted at rest, validate them, and monitor their health.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-black hover:bg-primary/90"
            >
              + Add API Key
            </button>
          </div>

          {/* Command Centre: stat tiles */}
          {isSpendLoading ? (
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <Skeleton key={i} className="h-[104px]" />
              ))}
            </div>
          ) : (
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <StatTile
                label="Total Keys"
                value={apiKeys?.length ?? spend?.counts.total ?? 0}
                icon={<KeyRound />}
                variant="neutral"
              />
              <StatTile
                label="Active & Working"
                value={spend?.counts.healthy ?? 0}
                icon={<ShieldCheck />}
                variant="success"
              />
              <StatTile
                label="Needs Rotation"
                value={spend?.counts.invalid ?? 0}
                icon={<ShieldAlert />}
                variant="danger"
              />
              <StatTile
                label="Failing / Errors"
                value={spend?.counts.error ?? 0}
                icon={<AlertTriangle />}
                variant="warning"
              />
              <StatTile
                label="Low Quota"
                value={spend?.counts.lowQuota ?? 0}
                icon={<Gauge />}
                variant="neutral"
              />
              <StatTile
                label="Monthly Spend"
                value={formatUsd(spend?.totalCostCents ?? 0)}
                icon={<DollarSign />}
                variant="info"
              />
            </div>
          )}

          {/* Spend panel */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Spend &amp; usage</CardTitle>
            </CardHeader>
            <CardContent>
              {isSpendLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : !hasUsage ? (
                <Empty className="border-mineshaft-600 bg-mineshaft-900">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Receipt />
                    </EmptyMedia>
                    <EmptyTitle>No usage recorded yet</EmptyTitle>
                    <EmptyDescription>
                      Record usage via the API or the <span className="font-medium">⋯</span> menu on
                      any key below.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                  <div className="lg:col-span-2">
                    <div className="mb-4">
                      <div className="text-3xl font-semibold text-gray-100">
                        {formatUsd(spend?.totalCostCents ?? 0)}
                      </div>
                      <div className="text-sm text-bunker-300">
                        Spend in the last {SPEND_WINDOW_DAYS} days &middot;{" "}
                        {spend?.totalRequests ?? 0} requests
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs uppercase tracking-wide text-bunker-400">By provider</p>
                      {providersByCost.length ? (
                        providersByCost.map((p) => {
                          const pct =
                            spend && spend.totalCostCents > 0
                              ? (p.costCents / spend.totalCostCents) * 100
                              : 0;
                          return (
                            <div key={p.provider}>
                              <div className="mb-1 flex items-center justify-between text-sm">
                                <span className="text-gray-200">
                                  {PROVIDER_LABELS[p.provider] ?? p.provider}
                                </span>
                                <span className="text-bunker-300">
                                  {formatUsd(p.costCents)} &middot; {p.requests} req
                                </span>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full bg-mineshaft-700">
                                <div
                                  className="h-full rounded-full bg-primary"
                                  style={{ width: `${Math.max(2, pct)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-bunker-400">No provider breakdown yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-3">
                    <p className="mb-3 text-xs uppercase tracking-wide text-bunker-400">
                      Last {SPEND_WINDOW_DAYS} days
                    </p>
                    <div className="flex h-32 items-end gap-1 rounded-md border border-mineshaft-700 bg-mineshaft-900 p-3">
                      {(spend?.byDay ?? []).map((d) => {
                        const heightPct = Math.max(3, (d.costCents / maxDayCostCents) * 100);
                        return (
                          <div
                            key={d.date}
                            title={`${d.date}: ${formatUsd(d.costCents)} · ${d.requests} req`}
                            className="flex-1 rounded-t bg-primary/70 transition-colors hover:bg-primary"
                            style={{ height: `${heightPct}%` }}
                          />
                        );
                      })}
                    </div>
                    {spend?.byDay.length ? (
                      <div className="mt-1 flex justify-between text-[10px] text-bunker-400">
                        <span>{spend.byDay[0].date}</span>
                        <span>{spend.byDay[spend.byDay.length - 1].date}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="overflow-hidden rounded-md border border-mineshaft-600 bg-mineshaft-900">
            {isLoading ? (
              <div className="p-8 text-center text-bunker-300">Loading…</div>
            ) : error ? (
              <div className="p-8 text-center text-red-400">
                Failed to load API keys. You may not have access to this project.
              </div>
            ) : !apiKeys?.length ? (
              <div className="p-10 text-center text-bunker-300">
                <p className="text-lg">No API keys yet</p>
                <p className="mt-1 text-sm">Add your first provider API key to start monitoring its health.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-mineshaft-600 text-xs uppercase text-bunker-300">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Provider</th>
                    <th className="px-4 py-3">Key</th>
                    <th className="px-4 py-3">Health</th>
                    <th className="px-4 py-3">Usage / Quota</th>
                    <th className="px-4 py-3">This Month</th>
                    <th className="px-4 py-3">Last checked</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map((k) => {
                    const keySpend = spendByKeyId.get(k.id);
                    const spentCents = keySpend?.spentCents ?? 0;
                    const budgetCents = k.monthlyBudgetCents ?? keySpend?.monthlyBudgetCents ?? null;
                    const overBudget = keySpend?.overBudget ?? false;
                    const budgetPct =
                      budgetCents && budgetCents > 0
                        ? Math.min(100, (spentCents / budgetCents) * 100)
                        : 0;
                    const budgetBarWidth = budgetPct > 0 ? Math.max(3, budgetPct) : 0;

                    return (
                      <tr
                        key={k.id}
                        className="border-b border-mineshaft-700 last:border-0 hover:bg-mineshaft-800"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-200">{k.name}</div>
                          {k.description ? (
                            <div className="text-xs text-bunker-300">{k.description}</div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">{PROVIDER_LABELS[k.provider] ?? k.provider}</td>
                        <td className="max-w-[220px] truncate px-4 py-3 font-mono text-xs text-bunker-200">
                          {revealed[k.id] ?? k.maskedKey ?? "••••"}
                        </td>
                        <td className="px-4 py-3">
                          {healthBadge(k.healthStatus)}
                          {k.lastMessage ? (
                            <div className="mt-1 max-w-[220px] truncate text-xs text-bunker-400">
                              {k.lastMessage}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-bunker-200">
                          {k.quotaRemaining != null && k.quotaLimit != null
                            ? `${k.quotaRemaining} / ${k.quotaLimit}`
                            : k.lastLatencyMs != null
                              ? `${k.lastLatencyMs} ms`
                              : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-gray-200">{formatUsd(spentCents)}</div>
                          {budgetCents != null ? (
                            <div className="mt-1 w-28">
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-mineshaft-700">
                                <div
                                  className={cn(
                                    "h-full rounded-full",
                                    overBudget ? "bg-red-500" : "bg-primary"
                                  )}
                                  style={{ width: `${budgetBarWidth}%` }}
                                />
                              </div>
                              <div
                                className={cn(
                                  "mt-0.5 text-[10px]",
                                  overBudget ? "text-red-400" : "text-bunker-400"
                                )}
                              >
                                of {formatUsd(budgetCents)}
                                {overBudget ? " · over budget" : ""}
                              </div>
                            </div>
                          ) : (
                            <div className="mt-1 text-[10px] text-bunker-500">No budget set</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-bunker-300">
                          {k.lastCheckedAt ? new Date(k.lastCheckedAt).toLocaleString() : "Never"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleValidate(k)}
                              disabled={validatingId === k.id}
                              className="rounded border border-mineshaft-500 px-2 py-1 text-xs hover:bg-mineshaft-700 disabled:opacity-50"
                            >
                              {validatingId === k.id ? "Checking…" : "Validate"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReveal(k)}
                              className="rounded border border-mineshaft-500 px-2 py-1 text-xs hover:bg-mineshaft-700"
                            >
                              {revealed[k.id] ? "Hide" : "Reveal"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(k)}
                              className="rounded border border-red-500/40 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
                            >
                              Delete
                            </button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="xs" aria-label="More actions">
                                  <EllipsisVertical />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" sideOffset={2}>
                                <DropdownMenuItem onClick={() => openBudgetModal(k)}>
                                  <PenLine /> Set budget
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openUsageModal(k)}>
                                  <Receipt /> Record usage
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {isAddOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setIsAddOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-lg border border-mineshaft-600 bg-mineshaft-800 p-6"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <h2 className="mb-4 text-lg font-medium text-gray-100">Add API Key</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-bunker-300">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded border border-mineshaft-500 bg-mineshaft-900 px-3 py-2 text-sm text-gray-100 outline-none focus:border-primary"
                  placeholder="e.g. Production OpenAI"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-bunker-300">Provider</label>
                <select
                  value={form.provider}
                  onChange={(e) => setForm({ ...form, provider: e.target.value as ApiKeyProvider })}
                  className="w-full rounded border border-mineshaft-500 bg-mineshaft-900 px-3 py-2 text-sm text-gray-100 outline-none focus:border-primary"
                >
                  {Object.entries(PROVIDER_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-bunker-300">API Key</label>
                <input
                  type="password"
                  value={form.apiKey}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                  className="w-full rounded border border-mineshaft-500 bg-mineshaft-900 px-3 py-2 font-mono text-sm text-gray-100 outline-none focus:border-primary"
                  placeholder="sk-..."
                />
              </div>
              {form.provider === ApiKeyProvider.Generic ? (
                <div>
                  <label className="mb-1 block text-xs text-bunker-300">Validation test URL</label>
                  <input
                    value={form.testUrl}
                    onChange={(e) => setForm({ ...form, testUrl: e.target.value })}
                    className="w-full rounded border border-mineshaft-500 bg-mineshaft-900 px-3 py-2 text-sm text-gray-100 outline-none focus:border-primary"
                    placeholder="https://api.example.com/me"
                  />
                </div>
              ) : null}
              <div>
                <label className="mb-1 block text-xs text-bunker-300">Description (optional)</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded border border-mineshaft-500 bg-mineshaft-900 px-3 py-2 text-sm text-gray-100 outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="rounded px-4 py-2 text-sm text-bunker-200 hover:bg-mineshaft-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={createApiKey.isPending}
                className="rounded bg-primary px-4 py-2 text-sm font-medium text-black hover:bg-primary/90 disabled:opacity-50"
              >
                {createApiKey.isPending ? "Adding…" : "Add key"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setDeleteTarget(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-sm rounded-lg border border-mineshaft-600 bg-mineshaft-800 p-6"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <h2 className="mb-2 text-lg font-medium text-gray-100">Delete API key</h2>
            <p className="text-sm text-bunker-300">
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-100">{deleteTarget.name}</span>? This cannot be
              undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded px-4 py-2 text-sm text-bunker-200 hover:bg-mineshaft-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteApiKey.isPending}
                className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                {deleteApiKey.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Dialog open={Boolean(budgetTarget)} onOpenChange={(open) => !open && setBudgetTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Set monthly budget</DialogTitle>
            <DialogDescription>
              {budgetTarget?.name} will be flagged as over budget once spend passes this amount in a
              given month.
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="monthly-budget">Monthly budget (USD)</FieldLabel>
            <Input
              id="monthly-budget"
              type="number"
              min="0"
              step="0.01"
              placeholder="No budget set"
              value={budgetValue}
              onChange={(e) => setBudgetValue(e.target.value)}
            />
          </Field>
          <DialogFooter>
            {budgetTarget?.monthlyBudgetCents != null ? (
              <Button
                variant="danger"
                onClick={handleClearBudget}
                isPending={updateApiKey.isPending}
                isDisabled={updateApiKey.isPending}
              >
                Clear budget
              </Button>
            ) : null}
            <Button variant="ghost" onClick={() => setBudgetTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              className="border-primary/40 bg-primary/10 hover:border-primary/60 hover:bg-primary/20"
              onClick={handleSaveBudget}
              isPending={updateApiKey.isPending}
              isDisabled={updateApiKey.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(usageTarget)} onOpenChange={(open) => !open && setUsageTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Record usage</DialogTitle>
            <DialogDescription>
              Manually log usage for {usageTarget?.name}. Useful for testing or backfilling data from
              a provider without built-in reporting.
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="usage-requests">Requests</FieldLabel>
            <Input
              id="usage-requests"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={usageForm.requests}
              onChange={(e) => setUsageForm((f) => ({ ...f, requests: e.target.value }))}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="usage-cost">Cost (USD)</FieldLabel>
            <Input
              id="usage-cost"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={usageForm.costUsd}
              onChange={(e) => setUsageForm((f) => ({ ...f, costUsd: e.target.value }))}
            />
          </Field>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setUsageTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              className="border-primary/40 bg-primary/10 hover:border-primary/60 hover:bg-primary/20"
              onClick={handleRecordUsage}
              isPending={recordUsage.isPending}
              isDisabled={recordUsage.isPending}
            >
              Record usage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
