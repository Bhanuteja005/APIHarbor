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
import { useTeamMembers } from "@/hooks/use-api-keys";
import { useInviteMember, useRemoveMember, useUpdateMemberRole } from "@/hooks/use-org";
import { LoaderIcon, Trash2, UserPlus } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

const ROLES = [
    { slug: "admin", label: "Admin" },
    { slug: "member", label: "Member" },
    { slug: "no-access", label: "No Access" },
];

const AccessControlPage = () => {
    const team = useTeamMembers();
    const invite = useInviteMember();
    const updateRole = useUpdateMemberRole();
    const removeMember = useRemoveMember();

    const [inviteOpen, setInviteOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("member");
    const [search, setSearch] = useState("");

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            toast.error("Email is required");
            return;
        }
        try {
            await invite.mutateAsync({ email: email.trim(), role });
            toast.success(`Invitation sent to ${email.trim()}`);
            setInviteOpen(false);
            setEmail("");
            setRole("member");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not send the invitation");
        }
    };

    const handleRoleChange = async (membershipId: string, nextRole: string) => {
        try {
            await updateRole.mutateAsync({ membershipId, role: nextRole });
            toast.success("Role updated");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not update the role");
        }
    };

    const handleRemove = async (membershipId: string, name: string) => {
        try {
            await removeMember.mutateAsync(membershipId);
            toast.success(`Removed ${name}`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not remove the member");
        }
    };

    if (team.isPending) {
        return <CardSkeleton className="min-h-[420px]" />;
    }

    if (team.isError) {
        return (
            <ErrorCard
                message={team.error.message}
                onRetry={() => team.refetch()}
                className="min-h-[400px]"
            />
        );
    }

    const members = team.data.filter((member) => {
        if (!search.trim()) return true;
        const needle = search.trim().toLowerCase();
        return member.name.toLowerCase().includes(needle) || member.email.toLowerCase().includes(needle);
    });

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Access Control</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Invite teammates and manage what each member can do in your organization.
                    </p>
                </div>
                <Button onClick={() => setInviteOpen(true)} className="gap-x-2">
                    <UserPlus className="h-4 w-4" />
                    Invite member
                </Button>
            </div>

            <div className="rounded-2xl bg-card p-6">
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search members by name or email..."
                    className="max-w-sm"
                />
                <div className="mt-4 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Member</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="w-[60px]" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                                        {search ? "No members match your search." : "No members found."}
                                    </TableCell>
                                </TableRow>
                            )}
                            {members.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell className="text-sm font-medium">
                                        {member.name}
                                        {member.isCurrentUser && (
                                            <span className="ml-2 rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                                                You
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {member.email}
                                    </TableCell>
                                    <TableCell>
                                        {member.isCurrentUser ? (
                                            <span className="text-sm capitalize">{member.role}</span>
                                        ) : (
                                            <Select
                                                value={member.role}
                                                onValueChange={(value) => handleRoleChange(member.id, value)}
                                                disabled={updateRole.isPending}
                                            >
                                                <SelectTrigger className="h-8 w-[130px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {ROLES.map((r) => (
                                                        <SelectItem key={r.slug} value={r.slug}>
                                                            {r.label}
                                                        </SelectItem>
                                                    ))}
                                                    {!ROLES.some((r) => r.slug === member.role) && (
                                                        <SelectItem value={member.role}>
                                                            {member.role}
                                                        </SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {!member.isCurrentUser && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                aria-label={`Remove ${member.name}`}
                                                disabled={removeMember.isPending}
                                                onClick={() => handleRemove(member.id, member.name)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                    {members.length} of {team.data.length} members
                </p>
            </div>

            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Invite a member</DialogTitle>
                        <DialogDescription>
                            They&apos;ll receive an email invitation to join your organization.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleInvite} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="invite-email">Email</Label>
                            <Input
                                id="invite-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="teammate@company.com"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROLES.map((r) => (
                                        <SelectItem key={r.slug} value={r.slug}>
                                            {r.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={invite.isPending}>
                                {invite.isPending ? <LoaderIcon className="h-4 w-4 animate-spin" /> : "Send invite"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AccessControlPage;
