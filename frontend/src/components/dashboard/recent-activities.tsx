"use client";

import { Bell, KeyRound, Plus, ShieldAlert, type LucideIcon } from "lucide-react";

export type ActivityType = "check" | "alert" | "warning" | "created";

export interface DashboardActivity {
    name: string;
    meta: string;
    value: string;
    type: ActivityType;
}

const ACTIVITY_META: Record<ActivityType, { icon: LucideIcon; iconClass: string; valueClass: string }> = {
    check: { icon: KeyRound, iconClass: "text-foreground", valueClass: "" },
    alert: { icon: ShieldAlert, iconClass: "text-red-500", valueClass: "text-red-500" },
    warning: { icon: Bell, iconClass: "text-amber-500", valueClass: "text-amber-500" },
    created: { icon: Plus, iconClass: "text-muted-foreground", valueClass: "" },
};

const RecentActivities = ({ activities }: { activities: DashboardActivity[] }) => {
    return (
        <div className="rounded-2xl bg-card p-6 md:p-8">
            <h2 className="text-2xl font-semibold">
                Recent Activities
            </h2>
            <div className="mt-6 flex flex-col">
                {activities.length === 0 && (
                    <p className="py-4 text-sm text-muted-foreground">
                        No activity yet — add your first API key to start monitoring.
                    </p>
                )}
                {activities.map((activity) => {
                    const meta = ACTIVITY_META[activity.type];
                    const Icon = meta.icon;

                    return (
                        <div
                            key={`${activity.name}-${activity.meta}`}
                            className="flex items-center gap-x-4 py-3.5"
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                                <Icon className={`h-[18px] w-[18px] ${meta.iconClass}`} />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">
                                    {activity.name}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    {activity.meta}
                                </p>
                            </div>
                            <span className={`ml-auto shrink-0 text-sm ${meta.valueClass}`.trim()}>
                                {activity.value}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RecentActivities;
