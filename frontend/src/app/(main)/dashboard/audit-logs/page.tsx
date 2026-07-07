"use client";

import { CardSkeleton, ErrorCard } from "@/components/dashboard/data-states";
import { Button } from "@/components/ui/button";
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
import { useAuditLogs } from "@/hooks/use-org";
import { TAuditLog } from "@/lib/api/types";
import { format } from "date-fns";
import { useState } from "react";

const PAGE_SIZE = 25;

const describeActor = (log: TAuditLog) => {
    const meta = log.actor?.metadata ?? {};
    if (typeof meta.email === "string" && meta.email) return meta.email;
    if (typeof meta.name === "string" && meta.name) return meta.name;
    return log.actor?.type ?? "unknown";
};

const humanizeEvent = (type: string) =>
    type
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

const AuditLogsPage = () => {

    const [actorType, setActorType] = useState<string>("all");
    const [offset, setOffset] = useState(0);

    const logs = useAuditLogs({
        limit: PAGE_SIZE,
        offset,
        actorType: actorType === "all" ? undefined : actorType,
    });

    if (logs.isPending) {
        return (
            <div className="flex flex-col gap-6">
                <CardSkeleton className="min-h-[420px]" />
            </div>
        );
    }

    if (logs.isError) {
        return (
            <ErrorCard
                message={logs.error.message}
                onRetry={() => logs.refetch()}
                className="min-h-[400px]"
            />
        );
    }

    const rows = logs.data;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Audit Logs
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Every action taken in this workspace, by whom, and from where.
                    </p>
                </div>
                <Select
                    value={actorType}
                    onValueChange={(value) => {
                        setActorType(value);
                        setOffset(0);
                    }}
                >
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="All actors" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All actors</SelectItem>
                        <SelectItem value="user">Users</SelectItem>
                        <SelectItem value="identity">Machine identities</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-2xl bg-card p-6">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Time</TableHead>
                                <TableHead>Event</TableHead>
                                <TableHead>Actor</TableHead>
                                <TableHead>Source IP</TableHead>
                                <TableHead>Client</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                                        No activity recorded {offset > 0 ? "on this page" : "yet"}.
                                    </TableCell>
                                </TableRow>
                            )}
                            {rows.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                                        {format(new Date(log.createdAt), "MMM d, HH:mm:ss")}
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                                            {humanizeEvent(log.event.type)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {describeActor(log)}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {log.ipAddress ?? "—"}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {log.userAgentType ?? "—"}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                        Showing {rows.length} events{offset > 0 ? ` · page ${offset / PAGE_SIZE + 1}` : ""}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={offset === 0 || logs.isFetching}
                            onClick={() => setOffset((prev) => Math.max(0, prev - PAGE_SIZE))}
                        >
                            Previous
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={rows.length < PAGE_SIZE || logs.isFetching}
                            onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuditLogsPage;
