"use client";

import { CardSkeleton, ErrorCard } from "@/components/dashboard/data-states";
import { useSpendSummary } from "@/hooks/use-api-keys";
import { format, parseISO } from "date-fns";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const PROVIDER_LABELS: Record<string, string> = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    stripe: "Stripe",
    github: "GitHub",
    generic: "Generic",
};

const providerLabel = (provider: string) =>
    PROVIDER_LABELS[provider] ?? (provider ? provider.charAt(0).toUpperCase() + provider.slice(1) : "Unknown");

const AnalyticsPage = () => {

    const summary = useSpendSummary(30);

    if (summary.isPending) {
        return (
            <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <CardSkeleton className="min-h-[360px]" />
                    <CardSkeleton className="min-h-[360px]" />
                </div>
            </div>
        );
    }

    if (summary.isError) {
        return (
            <ErrorCard
                message={summary.error.message}
                onRetry={() => summary.refetch()}
                className="min-h-[400px]"
            />
        );
    }

    const data = summary.data;
    const totalSpendUsd = data.totalCostCents / 100;

    const statTiles = [
        {
            label: "Total spend (30d)",
            value: `$${totalSpendUsd.toFixed(2)}`,
            meta: "Across all providers this period",
        },
        {
            label: "Total requests (30d)",
            value: data.totalRequests.toLocaleString("en-US"),
            meta: "Requests served by tracked keys",
        },
        {
            label: "Avg. cost / request",
            value: data.totalRequests > 0
                ? `$${(totalSpendUsd / data.totalRequests).toFixed(3)}`
                : "$0.000",
            meta: "Blended rate across providers",
        },
    ];

    const maxProviderCost = Math.max(...data.byProvider.map((p) => p.costCents), 0);

    const dailyCosts = data.byDay.map((day) => ({
        day: format(parseISO(day.date), "d"),
        costUsd: day.costCents / 100,
    }));

    const usageSeries = data.byDay.map((day) => ({
        label: format(parseISO(day.date), "MMM d"),
        requests: day.requests,
    }));

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-semibold">
                    Analytics
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Understand how your keys are used and what they cost.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {statTiles.map((tile) => (
                    <div key={tile.label} className="rounded-2xl bg-card p-5">
                        <p className="text-sm font-medium text-muted-foreground">
                            {tile.label}
                        </p>
                        <p className="mt-2 text-3xl font-semibold leading-none">
                            {tile.value}
                        </p>
                        <p className="mt-3 text-sm text-muted-foreground">
                            {tile.meta}
                        </p>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl bg-card p-6">
                <h2 className="text-2xl font-semibold">
                    Spend by provider
                </h2>
                <div className="mt-6 flex flex-col gap-y-5">
                    {data.byProvider.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            No spend recorded yet.
                        </p>
                    )}
                    {data.byProvider.map((row) => (
                        <div key={row.provider}>
                            <div className="flex items-center justify-between gap-x-4">
                                <span className="text-sm font-medium">
                                    {providerLabel(row.provider)}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    ${(row.costCents / 100).toFixed(2)} · {row.requests.toLocaleString("en-US")} req
                                </span>
                            </div>
                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-muted">
                                <div
                                    className="h-full rounded bg-primary"
                                    style={{ width: `${maxProviderCost > 0 ? (row.costCents / maxProviderCost) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-2xl bg-card p-6">
                    <h2 className="text-2xl font-semibold">
                        Daily cost — last 30 days
                    </h2>
                    <div className="mt-6 h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyCosts} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                                <CartesianGrid
                                    vertical={false}
                                    stroke="hsl(var(--border))"
                                    strokeWidth={1}
                                />
                                <XAxis
                                    dataKey="day"
                                    axisLine={false}
                                    tickLine={false}
                                    tickMargin={12}
                                    interval="preserveStartEnd"
                                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tickMargin={8}
                                    width={52}
                                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip
                                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
                                    content={({ active, payload, label }) => {
                                        if (!active || !payload?.length) return null;
                                        return (
                                            <div className="min-w-[180px] rounded-lg border border-border bg-card p-3 shadow-lg">
                                                <p className="text-sm font-semibold">Day {label}</p>
                                                <div className="mt-2 flex items-center justify-between gap-x-6 text-sm">
                                                    <div className="flex items-center gap-x-2">
                                                        <span className="h-2.5 w-2.5 rounded-[2px] bg-primary" />
                                                        <span className="text-muted-foreground">cost_usd</span>
                                                    </div>
                                                    <span className="font-medium">
                                                        ${Number(payload[0].value).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    }}
                                />
                                <Bar
                                    dataKey="costUsd"
                                    fill="hsl(var(--foreground))"
                                    fillOpacity={0.75}
                                    radius={[3, 3, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="rounded-2xl bg-card p-6">
                    <h2 className="text-2xl font-semibold">
                        Requests over time
                    </h2>
                    <div className="mt-6 h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={usageSeries} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="analyticsRequestsFill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.28} />
                                        <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    vertical={false}
                                    stroke="hsl(var(--border))"
                                    strokeWidth={1}
                                />
                                <XAxis
                                    dataKey="label"
                                    axisLine={false}
                                    tickLine={false}
                                    tickMargin={12}
                                    interval="preserveStartEnd"
                                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tickMargin={8}
                                    width={52}
                                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                                />
                                <Tooltip
                                    cursor={{ stroke: "hsl(var(--foreground))", strokeWidth: 1 }}
                                    content={({ active, payload, label }) => {
                                        if (!active || !payload?.length) return null;
                                        return (
                                            <div className="min-w-[180px] rounded-lg border border-border bg-card p-3 shadow-lg">
                                                <p className="text-sm font-semibold">{label}</p>
                                                <div className="mt-2 flex items-center justify-between gap-x-6 text-sm">
                                                    <div className="flex items-center gap-x-2">
                                                        <span className="h-2.5 w-2.5 rounded-[2px] bg-primary" />
                                                        <span className="text-muted-foreground">total_requests</span>
                                                    </div>
                                                    <span className="font-medium">
                                                        {Number(payload[0].value).toLocaleString("en-US")}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    }}
                                />
                                <Area
                                    type="linear"
                                    dataKey="requests"
                                    stroke="hsl(var(--foreground))"
                                    strokeWidth={1.5}
                                    fill="url(#analyticsRequestsFill)"
                                    activeDot={{
                                        r: 4,
                                        fill: "hsl(var(--foreground))",
                                        stroke: "hsl(var(--card))",
                                        strokeWidth: 2,
                                    }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
