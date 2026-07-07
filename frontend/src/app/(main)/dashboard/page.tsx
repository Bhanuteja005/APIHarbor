"use client";

import { CardSkeleton, ErrorCard } from "@/components/dashboard/data-states";
import PerformanceCard from "@/components/dashboard/performance-card";
import ProductsOverview from "@/components/dashboard/products-overview";
import RecentActivities, { DashboardActivity } from "@/components/dashboard/recent-activities";
import StatCards from "@/components/dashboard/stat-cards";
import UsageChart from "@/components/dashboard/usage-chart";
import { useApiKeys, useSpendSummary } from "@/hooks/use-api-keys";
import { TApiKey } from "@/lib/api/types";
import { format, formatDistanceToNow, parseISO } from "date-fns";

const toActivity = (key: TApiKey): DashboardActivity => {
    const when = key.lastCheckedAt
        ? `${formatDistanceToNow(new Date(key.lastCheckedAt))} ago`
        : "not checked yet";

    switch (key.healthStatus) {
        case "healthy":
            return {
                name: `${key.provider} · ${key.name}`,
                meta: `Health check passed · ${when}`,
                value: key.lastLatencyMs ? `${key.lastLatencyMs}ms` : "OK",
                type: "check",
            };
        case "invalid":
            return {
                name: `${key.provider} · ${key.name}`,
                meta: `${key.lastMessage || "Provider rejected the key"} · ${when}`,
                value: "Needs rotation",
                type: "alert",
            };
        case "error":
            return {
                name: `${key.provider} · ${key.name}`,
                meta: `${key.lastMessage || "Health check failed"} · ${when}`,
                value: "Failing",
                type: "warning",
            };
        default:
            return {
                name: `${key.provider} · ${key.name}`,
                meta: "Key added · first health check pending",
                value: "Unchecked",
                type: "created",
            };
    }
};

const DashboardPage = () => {

    const summary = useSpendSummary();
    const keys = useApiKeys();

    if (summary.isPending || keys.isPending) {
        return (
            <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[230px,1fr]">
                    <CardSkeleton />
                    <CardSkeleton className="min-h-[320px]" />
                </div>
                <CardSkeleton />
            </div>
        );
    }

    if (summary.isError || keys.isError) {
        const message = (summary.error || keys.error)?.message ?? "Please try again.";
        return (
            <ErrorCard
                message={message}
                onRetry={() => {
                    summary.refetch();
                    keys.refetch();
                }}
                className="min-h-[400px]"
            />
        );
    }

    const data = summary.data;
    const budgetUsd = data.keys?.reduce((total, key) => total + (key.monthlyBudgetCents ?? 0), 0) / 100 || 0;

    const breakdown = [
        { name: "Healthy", value: data.counts.healthy },
        { name: "Needs rotation", value: data.counts.invalid },
        { name: "Failing", value: data.counts.error },
        { name: "Unknown", value: data.counts.unknown },
    ];

    const series = data.byDay.map((day) => ({
        label: format(parseISO(day.date), "MMM d"),
        requests: day.requests,
    }));

    const activities = [...keys.data]
        .sort((a, b) => (b.lastCheckedAt ?? "").localeCompare(a.lastCheckedAt ?? ""))
        .slice(0, 5)
        .map(toActivity);

    return (
        <div className="flex flex-col gap-6">
            <StatCards
                totalKeys={data.counts.total}
                totalRequests={data.totalRequests}
                spendUsd={data.totalCostCents / 100}
                budgetUsd={budgetUsd}
            />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[230px,1fr]">
                <PerformanceCard breakdown={breakdown} />
                <UsageChart series={series} />
            </div>
            <RecentActivities activities={activities} />
            <ProductsOverview />
        </div>
    );
};

export default DashboardPage;
