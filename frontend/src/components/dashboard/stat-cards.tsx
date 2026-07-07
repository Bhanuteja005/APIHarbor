"use client";

import { Activity, CircleDollarSign, KeyRound } from "lucide-react";

interface StatCardsProps {
    totalKeys: number;
    totalRequests: number;
    spendUsd: number;
    budgetUsd: number;
}

const StatCards = ({ totalKeys, totalRequests, spendUsd, budgetUsd }: StatCardsProps) => {

    const spendPercent = budgetUsd > 0
        ? Math.min(Math.round((spendUsd / budgetUsd) * 100), 100)
        : 0;

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="flex min-h-[280px] flex-col rounded-2xl bg-card p-6">
                <div className="flex items-start justify-between">
                    <span className="text-base font-medium">
                        Total keys
                    </span>
                    <KeyRound className="h-5 w-5" />
                </div>
                <p className="mt-4 text-[40px] font-semibold leading-none">
                    {totalKeys}
                </p>
                <p className="mt-5 max-w-[300px] text-sm leading-relaxed text-muted-foreground">
                    Manage all your API keys in a single dashboard,
                    with health checks and insights
                </p>
            </div>

            <div className="flex min-h-[280px] flex-col rounded-2xl bg-card p-6">
                <div className="flex items-start justify-between">
                    <span className="text-base font-medium">
                        Total requests
                    </span>
                    <Activity className="h-5 w-5" />
                </div>
                <p className="mt-4 text-[40px] font-semibold leading-none">
                    {totalRequests.toLocaleString("en-US")}
                </p>
                <p className="mt-5 max-w-[300px] text-sm leading-relaxed text-muted-foreground">
                    This is how many requests your keys have
                    served throughout the month
                </p>
            </div>

            <div className="flex min-h-[280px] flex-col rounded-2xl bg-card p-6">
                <div className="flex items-start justify-between">
                    <span className="text-base font-medium">
                        Monthly spend
                    </span>
                    <CircleDollarSign className="h-5 w-5" />
                </div>
                <p className="mt-4 text-[40px] font-semibold leading-none">
                    ${spendUsd.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                </p>
                {budgetUsd > 0 ? (
                    <>
                        <p className="mt-2 text-sm">
                            Your budget
                        </p>
                        <div className="mt-4">
                            <div className="flex items-center justify-between text-sm">
                                <span>${spendUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                                <span>${budgetUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-primary"
                                    style={{ width: `${spendPercent}%` }}
                                />
                            </div>
                        </div>
                        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                            Total benchmark of your monthly budget and how
                            much your keys have spent this month
                        </p>
                    </>
                ) : (
                    <p className="mt-5 max-w-[300px] text-sm leading-relaxed text-muted-foreground">
                        Month-to-date spend across every tracked key.
                        Set per-key budgets on the API Keys page to track a limit here.
                    </p>
                )}
            </div>
        </div>
    );
};

export default StatCards;
