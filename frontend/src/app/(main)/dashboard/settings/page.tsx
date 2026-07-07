"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTeamMembers } from "@/hooks/use-api-keys";
import { useState } from "react";
import { toast } from "sonner";

interface SettingRowProps {
    title: string;
    hint: string;
    children: React.ReactNode;
}

const SettingRow = ({ title, hint, children }: SettingRowProps) => {
    return (
        <div className="flex items-center justify-between gap-4">
            <div>
                <p className="text-sm font-medium">
                    {title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                    {hint}
                </p>
            </div>
            {children}
        </div>
    );
};

const getInitials = (name: string) => {
    return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase();
};

const capitalize = (value: string) =>
    value.charAt(0).toUpperCase() + value.slice(1);

const BASE_ROLES = ["admin", "member", "no-access"];

const roleOptionsFor = (role: string) =>
    BASE_ROLES.includes(role) ? BASE_ROLES : [role, ...BASE_ROLES];

const SettingsPage = () => {

    const [workspaceName, setWorkspaceName] = useState("My Project");
    const [autoHealthChecks, setAutoHealthChecks] = useState(true);
    const [checkFrequency, setCheckFrequency] = useState("hourly");
    const [recheckFailing, setRecheckFailing] = useState(true);
    const [monthlyBudget, setMonthlyBudget] = useState("2000");
    const [expiryAlerts, setExpiryAlerts] = useState(true);
    const [failingKeyAlerts, setFailingKeyAlerts] = useState(true);
    const [lowQuotaWarnings, setLowQuotaWarnings] = useState(true);
    const [weeklyDigest, setWeeklyDigest] = useState(false);
    const team = useTeamMembers();

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-semibold">
                    Settings
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Manage your workspace, monitoring, and notification preferences.
                </p>
            </div>

            <div className="flex w-full max-w-3xl flex-col gap-6">
                <div className="rounded-2xl bg-card p-6">
                    <h2 className="mb-4 text-base font-semibold">
                        Workspace
                    </h2>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="workspace-name">
                                Workspace name
                            </Label>
                            <Input
                                id="workspace-name"
                                value={workspaceName}
                                onChange={(e) => setWorkspaceName(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="workspace-url">
                                Workspace URL
                            </Label>
                            <Input
                                id="workspace-url"
                                defaultValue="apiharbor.io/my-project"
                                disabled
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button
                                size="sm"
                                onClick={() => toast.info("Workspace renaming is coming soon.")}
                            >
                                Save changes
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl bg-card p-6">
                    <h2 className="mb-4 text-base font-semibold">
                        Monitoring
                    </h2>
                    <div className="flex flex-col gap-5">
                        <SettingRow
                            title="Automatic health checks"
                            hint="Ping every tracked key on a schedule to verify it still works."
                        >
                            <Switch
                                checked={autoHealthChecks}
                                onCheckedChange={setAutoHealthChecks}
                            />
                        </SettingRow>
                        <SettingRow
                            title="Check frequency"
                            hint="How often keys are validated against their providers."
                        >
                            <Select value={checkFrequency} onValueChange={setCheckFrequency}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="realtime">
                                        Real-time
                                    </SelectItem>
                                    <SelectItem value="hourly">
                                        Hourly
                                    </SelectItem>
                                    <SelectItem value="daily">
                                        Daily
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </SettingRow>
                        <SettingRow
                            title="Re-check failing keys"
                            hint="Retry keys that failed their last check more aggressively."
                        >
                            <Switch
                                checked={recheckFailing}
                                onCheckedChange={setRecheckFailing}
                            />
                        </SettingRow>
                    </div>
                </div>

                <div className="rounded-2xl bg-card p-6">
                    <h2 className="mb-4 text-base font-semibold">
                        Budget
                    </h2>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="monthly-budget">
                                Monthly budget (USD)
                            </Label>
                            <Input
                                id="monthly-budget"
                                type="number"
                                value={monthlyBudget}
                                onChange={(e) => setMonthlyBudget(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                You&apos;ll be alerted when spend crosses 80% of this budget.
                            </p>
                        </div>
                        <div className="flex justify-end">
                            <Button
                                size="sm"
                                onClick={() => toast.success("Budget updated.")}
                            >
                                Save changes
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl bg-card p-6">
                    <div className="mb-4 flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-base font-semibold">
                                Team
                            </h2>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Control who can view, add, reveal, or delete keys.
                            </p>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toast.info("Member invites are coming soon.")}
                        >
                            Invite member
                        </Button>
                    </div>
                    {team.isPending ? (
                        <div className="flex flex-col gap-2">
                            <div className="h-12 animate-pulse rounded bg-muted" />
                            <div className="h-12 animate-pulse rounded bg-muted" />
                            <div className="h-12 animate-pulse rounded bg-muted" />
                        </div>
                    ) : team.isError ? (
                        <p className="text-xs text-muted-foreground">
                            Couldn&apos;t load team members: {team.error.message}
                        </p>
                    ) : (
                        <div className="flex flex-col">
                            {team.data.map((member) => (
                                <div
                                    key={member.id}
                                    className="flex items-center gap-3 border-b border-border py-3 last:border-0"
                                >
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                                        {getInitials(member.name)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium">
                                            {member.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {member.email}
                                        </p>
                                    </div>
                                    <Select
                                        value={member.role}
                                        onValueChange={() =>
                                            toast.info("Role changes are managed by your organization admin.")
                                        }
                                        disabled={member.isCurrentUser}
                                    >
                                        <SelectTrigger className="w-[120px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roleOptionsFor(member.role).map((role) => (
                                                <SelectItem key={role} value={role}>
                                                    {capitalize(role)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                    )}
                    <p className="mt-4 text-xs text-muted-foreground">
                        Owners and admins can add and reveal keys. Members can add keys. Viewers have read-only access.
                    </p>
                </div>

                <div className="rounded-2xl bg-card p-6">
                    <h2 className="mb-4 text-base font-semibold">
                        Notifications
                    </h2>
                    <div className="flex flex-col gap-5">
                        <SettingRow
                            title="Expiry alerts"
                            hint="Get notified before a key's expiry date passes."
                        >
                            <Switch
                                checked={expiryAlerts}
                                onCheckedChange={setExpiryAlerts}
                            />
                        </SettingRow>
                        <SettingRow
                            title="Failing key alerts"
                            hint="Get notified as soon as a health check fails."
                        >
                            <Switch
                                checked={failingKeyAlerts}
                                onCheckedChange={setFailingKeyAlerts}
                            />
                        </SettingRow>
                        <SettingRow
                            title="Low quota warnings"
                            hint="Get notified when a key's remaining quota drops below 10%."
                        >
                            <Switch
                                checked={lowQuotaWarnings}
                                onCheckedChange={setLowQuotaWarnings}
                            />
                        </SettingRow>
                        <SettingRow
                            title="Weekly digest"
                            hint="A summary of key health and spend, every Monday."
                        >
                            <Switch
                                checked={weeklyDigest}
                                onCheckedChange={setWeeklyDigest}
                            />
                        </SettingRow>
                    </div>
                </div>

                <div className="rounded-2xl border border-red-500/20 bg-card p-6">
                    <h2 className="mb-4 text-sm font-medium text-red-500">
                        Danger zone
                    </h2>
                    <SettingRow
                        title="Delete this workspace"
                        hint="All tracked keys and history will be permanently removed."
                    >
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => toast.error("Workspace deletion is disabled in the demo.")}
                        >
                            Delete workspace
                        </Button>
                    </SettingRow>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
