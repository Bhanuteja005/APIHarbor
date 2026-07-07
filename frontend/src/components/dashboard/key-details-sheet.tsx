"use client";

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { useKeyHealthChecks, useKeyUsage } from "@/hooks/use-api-keys";
import { TApiKey } from "@/lib/api/types";
import { cn } from "@/utils";
import { format, formatDistanceToNow } from "date-fns";

const STATUS_DOT: Record<string, string> = {
    healthy: "bg-emerald-500",
    invalid: "bg-amber-500",
    error: "bg-red-500",
    unknown: "bg-muted-foreground",
};

interface Props {
    apiKey: TApiKey | null;
    onClose: () => void;
}

const KeyDetailsSheet = ({ apiKey, onClose }: Props) => {

    const healthChecks = useKeyHealthChecks(apiKey?.id ?? null);
    const usage = useKeyUsage(apiKey?.id ?? null);

    const usageRows = (usage.data ?? [])
        .slice()
        .sort((a, b) => (a.usageDate < b.usageDate ? 1 : -1))
        .slice(0, 14);

    const totalRequests = (usage.data ?? []).reduce((sum, row) => sum + (row.requests ?? 0), 0);
    const totalCostUsd = (usage.data ?? []).reduce((sum, row) => sum + (row.costCents ?? 0), 0) / 100;

    return (
        <Sheet open={!!apiKey} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full overflow-y-auto sm:max-w-md">
                {apiKey && (
                    <>
                        <SheetHeader>
                            <SheetTitle>{apiKey.name}</SheetTitle>
                            <SheetDescription>
                                {apiKey.description || "Health check history and usage for this key."}
                            </SheetDescription>
                        </SheetHeader>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-muted p-4">
                                <p className="text-xs text-muted-foreground">
                                    Requests (30d)
                                </p>
                                <p className="mt-1 text-xl font-semibold">
                                    {totalRequests.toLocaleString("en-US")}
                                </p>
                            </div>
                            <div className="rounded-xl bg-muted p-4">
                                <p className="text-xs text-muted-foreground">
                                    Spend (30d)
                                </p>
                                <p className="mt-1 text-xl font-semibold">
                                    ${totalCostUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <h3 className="text-sm font-semibold">
                                Health check history
                            </h3>
                            {healthChecks.isPending ? (
                                <div className="mt-3 flex flex-col gap-2">
                                    <div className="h-10 animate-pulse rounded bg-muted" />
                                    <div className="h-10 animate-pulse rounded bg-muted" />
                                    <div className="h-10 animate-pulse rounded bg-muted" />
                                </div>
                            ) : healthChecks.isError ? (
                                <p className="mt-3 text-xs text-muted-foreground">
                                    Couldn&apos;t load history: {healthChecks.error.message}
                                </p>
                            ) : healthChecks.data.length === 0 ? (
                                <p className="mt-3 text-xs text-muted-foreground">
                                    No health checks recorded yet. Run &quot;Validate now&quot; to record the first one.
                                </p>
                            ) : (
                                <div className="mt-3 flex flex-col">
                                    {healthChecks.data.map((check) => (
                                        <div
                                            key={check.id}
                                            className="flex items-start gap-3 border-b border-border py-3 last:border-0"
                                        >
                                            <span
                                                className={cn(
                                                    "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                                                    STATUS_DOT[check.status] ?? STATUS_DOT.unknown
                                                )}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium capitalize">
                                                    {check.status}
                                                    {check.httpStatus ? (
                                                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                                                            HTTP {check.httpStatus}
                                                        </span>
                                                    ) : null}
                                                    {check.latencyMs != null && (
                                                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                                                            {check.latencyMs}ms
                                                        </span>
                                                    )}
                                                </p>
                                                {check.message && (
                                                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                        {check.message}
                                                    </p>
                                                )}
                                            </div>
                                            <p className="shrink-0 text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(check.checkedAt))} ago
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-6">
                            <h3 className="text-sm font-semibold">
                                Daily usage
                            </h3>
                            {usage.isPending ? (
                                <div className="mt-3 h-24 animate-pulse rounded bg-muted" />
                            ) : usage.isError ? (
                                <p className="mt-3 text-xs text-muted-foreground">
                                    Couldn&apos;t load usage: {usage.error.message}
                                </p>
                            ) : usageRows.length === 0 ? (
                                <p className="mt-3 text-xs text-muted-foreground">
                                    No usage recorded in the last 30 days. Report usage via the API to see it here.
                                </p>
                            ) : (
                                <div className="mt-3 flex flex-col">
                                    {usageRows.map((row) => (
                                        <div
                                            key={row.usageDate}
                                            className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0"
                                        >
                                            <span className="text-muted-foreground">
                                                {format(new Date(row.usageDate), "MMM d")}
                                            </span>
                                            <span>
                                                {row.requests.toLocaleString("en-US")} req
                                                <span className="ml-3 text-muted-foreground">
                                                    ${(((row.costCents ?? 0)) / 100).toFixed(2)}
                                                </span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
};

export default KeyDetailsSheet;
