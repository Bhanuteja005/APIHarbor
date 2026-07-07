"use client";

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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTeamMembers } from "@/hooks/use-api-keys";
import {
    useChangePassword,
    useMe,
    useRevokeAllSessions,
    useRevokeSession,
    useSessions,
    useUpdateMyMfa,
    useUpdateMyName,
} from "@/hooks/use-account";
import {
    useDeleteOrganization,
    useInviteMember,
    useOrganization,
    useRemoveMember,
    useUpdateMemberRole,
    useUpdateOrgName,
} from "@/hooks/use-org";
import { formatDistanceToNow } from "date-fns";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

const describeUserAgent = (ua?: string | null) => {
    if (!ua) return "Unknown device";
    if (ua.toLowerCase().includes("cli")) return "CLI";
    const browser =
        ua.includes("Edg/") ? "Edge"
            : ua.includes("Chrome/") ? "Chrome"
                : ua.includes("Firefox/") ? "Firefox"
                    : ua.includes("Safari/") ? "Safari"
                        : "Browser";
    const os =
        ua.includes("Windows") ? "Windows"
            : ua.includes("Mac OS") ? "macOS"
                : ua.includes("Linux") ? "Linux"
                    : ua.includes("Android") ? "Android"
                        : ua.includes("iPhone") || ua.includes("iOS") ? "iOS"
                            : null;
    return os ? `${browser} on ${os}` : browser;
};

const SettingsPage = () => {

    const router = useRouter();

    const org = useOrganization();
    const updateOrgName = useUpdateOrgName();
    const team = useTeamMembers();
    const inviteMember = useInviteMember();
    const updateRole = useUpdateMemberRole();
    const removeMember = useRemoveMember();

    const me = useMe();
    const updateName = useUpdateMyName();
    const updateMfa = useUpdateMyMfa();
    const sessions = useSessions();
    const revokeSession = useRevokeSession();
    const revokeAllSessions = useRevokeAllSessions();
    const changePassword = useChangePassword();

    const [workspaceName, setWorkspaceName] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("member");
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [expiryAlerts, setExpiryAlerts] = useState(true);
    const [failingKeyAlerts, setFailingKeyAlerts] = useState(true);
    const [lowQuotaWarnings, setLowQuotaWarnings] = useState(true);
    const [weeklyDigest, setWeeklyDigest] = useState(false);

    const deleteOrg = useDeleteOrganization();
    const [deleteOrgOpen, setDeleteOrgOpen] = useState(false);
    const [deleteOrgConfirm, setDeleteOrgConfirm] = useState("");

    useEffect(() => {
        if (org.data?.name) setWorkspaceName(org.data.name);
    }, [org.data?.name]);

    useEffect(() => {
        if (me.data) {
            setDisplayName([me.data.firstName, me.data.lastName].filter(Boolean).join(" "));
        }
    }, [me.data]);

    const handleSaveWorkspace = async () => {
        const name = workspaceName.trim();
        if (!name) {
            toast.error("Workspace name can't be empty.");
            return;
        }
        try {
            await updateOrgName.mutateAsync(name);
            toast.success("Workspace name updated.");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Couldn't rename the workspace.");
        }
    };

    const handleInvite = async () => {
        const email = inviteEmail.trim().toLowerCase();
        if (!email) {
            toast.error("Enter the teammate's email.");
            return;
        }
        try {
            await inviteMember.mutateAsync({ email, role: inviteRole });
            toast.success(`Invitation sent to ${email}.`);
            setInviteOpen(false);
            setInviteEmail("");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Couldn't send the invitation.");
        }
    };

    const handleRoleChange = async (membershipId: string, role: string, memberName: string) => {
        try {
            await updateRole.mutateAsync({ membershipId, role });
            toast.success(`${memberName} is now ${role === "no-access" ? "suspended" : `a ${role}`}.`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Couldn't change the role.");
        }
    };

    const handleRemoveMember = async (membershipId: string, memberName: string) => {
        try {
            await removeMember.mutateAsync(membershipId);
            toast.success(`${memberName} was removed from the workspace.`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Couldn't remove this member.");
        }
    };

    const handleSaveName = async () => {
        const name = displayName.trim();
        if (!name) {
            toast.error("Name can't be empty.");
            return;
        }
        try {
            await updateName.mutateAsync(name);
            toast.success("Your name was updated.");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Couldn't update your name.");
        }
    };

    const handleToggleMfa = async (enabled: boolean) => {
        try {
            await updateMfa.mutateAsync(enabled);
            toast.success(
                enabled
                    ? "Two-factor authentication enabled. You'll receive a code by email at sign-in."
                    : "Two-factor authentication disabled."
            );
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Couldn't update MFA.");
        }
    };

    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword) {
            toast.error("Current and new password are required.");
            return;
        }
        if (newPassword.length < 14) {
            toast.error("New password must be at least 14 characters long.");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("New passwords don't match.");
            return;
        }
        try {
            await changePassword.mutateAsync({ oldPassword, newPassword });
            toast.success("Password changed. Please sign in again.");
            router.push("/auth/sign-in");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Couldn't change your password.");
        }
    };

    const handleRevokeSession = async (sessionId: string) => {
        try {
            await revokeSession.mutateAsync(sessionId);
            toast.success("Session revoked.");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Couldn't revoke this session.");
        }
    };

    const handleRevokeAllSessions = async () => {
        try {
            await revokeAllSessions.mutateAsync();
            toast.success("All sessions revoked. Please sign in again.");
            router.push("/auth/sign-in");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Couldn't revoke sessions.");
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-semibold">
                    Settings
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Manage your workspace, team, account security, and notification preferences.
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
                                disabled={org.isPending}
                                onChange={(e) => setWorkspaceName(e.target.value)}
                                placeholder={org.isPending ? "Loading..." : "My organization"}
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button
                                size="sm"
                                disabled={updateOrgName.isPending || org.isPending}
                                onClick={handleSaveWorkspace}
                            >
                                {updateOrgName.isPending ? "Saving..." : "Save changes"}
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
                            onClick={() => setInviteOpen(true)}
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
                                            {member.isCurrentUser && (
                                                <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                                            )}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {member.email}
                                        </p>
                                    </div>
                                    <Select
                                        value={member.role}
                                        onValueChange={(role) => handleRoleChange(member.id, role, member.name)}
                                        disabled={member.isCurrentUser || updateRole.isPending}
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
                                    {!member.isCurrentUser && (
                                        <button
                                            aria-label={`Remove ${member.name}`}
                                            onClick={() => handleRemoveMember(member.id, member.name)}
                                            className="text-muted-foreground transition-colors hover:text-red-500"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    <p className="mt-4 text-xs text-muted-foreground">
                        Admins manage the workspace and its members. Members can add and validate keys.
                    </p>
                </div>

                <div className="rounded-2xl bg-card p-6">
                    <h2 className="mb-4 text-base font-semibold">
                        Account
                    </h2>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="display-name">
                                Your name
                            </Label>
                            <Input
                                id="display-name"
                                value={displayName}
                                disabled={me.isPending}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder={me.isPending ? "Loading..." : "Your name"}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="account-email">
                                Email
                            </Label>
                            <Input
                                id="account-email"
                                value={me.data?.email ?? me.data?.username ?? ""}
                                disabled
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button
                                size="sm"
                                disabled={updateName.isPending || me.isPending}
                                onClick={handleSaveName}
                            >
                                {updateName.isPending ? "Saving..." : "Save changes"}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl bg-card p-6">
                    <h2 className="mb-4 text-base font-semibold">
                        Security
                    </h2>
                    <div className="flex flex-col gap-5">
                        <SettingRow
                            title="Two-factor authentication"
                            hint="Require a 6-digit email code every time you sign in."
                        >
                            <Switch
                                checked={!!me.data?.isMfaEnabled}
                                disabled={me.isPending || updateMfa.isPending}
                                onCheckedChange={handleToggleMfa}
                            />
                        </SettingRow>

                        <div className="border-t border-border pt-5">
                            <p className="text-sm font-medium">
                                Change password
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                You&apos;ll be signed out everywhere after changing it.
                            </p>
                            <div className="mt-4 flex flex-col gap-3">
                                <Input
                                    type="password"
                                    value={oldPassword}
                                    autoComplete="current-password"
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    placeholder="Current password"
                                />
                                <Input
                                    type="password"
                                    value={newPassword}
                                    autoComplete="new-password"
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="New password (at least 14 characters)"
                                />
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    autoComplete="new-password"
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                />
                                <div className="flex justify-end">
                                    <Button
                                        size="sm"
                                        disabled={changePassword.isPending}
                                        onClick={handleChangePassword}
                                    >
                                        {changePassword.isPending ? "Updating..." : "Change password"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl bg-card p-6">
                    <div className="mb-4 flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-base font-semibold">
                                Active sessions
                            </h2>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Devices currently signed in to your account.
                            </p>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={revokeAllSessions.isPending}
                            onClick={handleRevokeAllSessions}
                        >
                            Sign out everywhere
                        </Button>
                    </div>
                    {sessions.isPending ? (
                        <div className="flex flex-col gap-2">
                            <div className="h-12 animate-pulse rounded bg-muted" />
                            <div className="h-12 animate-pulse rounded bg-muted" />
                        </div>
                    ) : sessions.isError ? (
                        <p className="text-xs text-muted-foreground">
                            Couldn&apos;t load sessions: {sessions.error.message}
                        </p>
                    ) : (
                        <div className="flex flex-col">
                            {sessions.data.map((session) => (
                                <div
                                    key={session.id}
                                    className="flex items-center gap-3 border-b border-border py-3 last:border-0"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium">
                                            {describeUserAgent(session.userAgent)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {session.ip} · last active {formatDistanceToNow(new Date(session.lastUsed))} ago
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        disabled={revokeSession.isPending}
                                        onClick={() => handleRevokeSession(session.id)}
                                    >
                                        Revoke
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
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
                        title="Delete this organization"
                        hint="Permanently removes the organization, every project, and all tracked keys and history."
                    >
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteOrgOpen(true)}
                        >
                            Delete organization
                        </Button>
                    </SettingRow>
                </div>
            </div>

            <Dialog
                open={deleteOrgOpen}
                onOpenChange={(open) => {
                    setDeleteOrgOpen(open);
                    if (!open) setDeleteOrgConfirm("");
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete organization</DialogTitle>
                        <DialogDescription>
                            This permanently removes{" "}
                            <span className="font-medium text-foreground">{org.data?.name ?? "your organization"}</span>{" "}
                            and all of its data. This action cannot be undone. Type the organization name to confirm.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        value={deleteOrgConfirm}
                        onChange={(e) => setDeleteOrgConfirm(e.target.value)}
                        placeholder={org.data?.name ?? ""}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteOrgOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={
                                deleteOrg.isPending ||
                                !org.data?.name ||
                                deleteOrgConfirm !== org.data.name
                            }
                            onClick={async () => {
                                try {
                                    await deleteOrg.mutateAsync();
                                    toast.success("Organization deleted.");
                                    router.push("/");
                                } catch (error) {
                                    toast.error(
                                        error instanceof Error ? error.message : "Couldn't delete the organization."
                                    );
                                }
                            }}
                        >
                            {deleteOrg.isPending ? "Deleting..." : "Delete organization"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Invite a team member</DialogTitle>
                        <DialogDescription>
                            They&apos;ll receive an email invitation to join this workspace.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="invite-email">Email</Label>
                            <Input
                                id="invite-email"
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="teammate@company.com"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label>Role</Label>
                            <Select value={inviteRole} onValueChange={setInviteRole}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="member">Member</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleInvite} disabled={inviteMember.isPending}>
                            {inviteMember.isPending ? "Sending..." : "Send invitation"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SettingsPage;
