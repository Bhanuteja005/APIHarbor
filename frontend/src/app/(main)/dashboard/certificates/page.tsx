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
import { useCertificateAuthorities, useCertificates, useCreateInternalCa } from "@/hooks/use-certificates";
import { useCreateProject, useProjects } from "@/hooks/use-projects";
import { format } from "date-fns";
import { FileBadge, LoaderIcon, Plus, ShieldCheck } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const CertificatesPage = () => {
    const certProjects = useProjects("cert-manager");
    const createProject = useCreateProject();

    const [projectId, setProjectId] = useState<string | undefined>(undefined);

    // Default to the first cert-manager project once loaded.
    useEffect(() => {
        if (!projectId && certProjects.data?.length) {
            setProjectId(certProjects.data[0].id);
        }
    }, [certProjects.data, projectId]);

    const cas = useCertificateAuthorities(projectId);
    const certs = useCertificates(projectId);
    const createCa = useCreateInternalCa();

    const [caOpen, setCaOpen] = useState(false);
    const [caName, setCaName] = useState("");
    const [caCommonName, setCaCommonName] = useState("");
    const [caOrg, setCaOrg] = useState("");

    const handleCreateWorkspace = async () => {
        try {
            const project = await createProject.mutateAsync({ name: "Certificates", type: "cert-manager" });
            setProjectId(project.id);
            toast.success("Certificate workspace created");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not create workspace");
        }
    };

    const handleCreateCa = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectId) return;
        if (!caName.trim() || !caCommonName.trim()) {
            toast.error("Name and common name are required");
            return;
        }
        try {
            await createCa.mutateAsync({
                projectId,
                name: caName.trim(),
                commonName: caCommonName.trim(),
                organization: caOrg.trim() || undefined,
            });
            toast.success("Certificate authority created");
            setCaOpen(false);
            setCaName("");
            setCaCommonName("");
            setCaOrg("");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not create certificate authority");
        }
    };

    if (certProjects.isPending) {
        return <CardSkeleton className="min-h-[420px]" />;
    }

    if (certProjects.isError) {
        return (
            <ErrorCard
                message={certProjects.error.message}
                onRetry={() => certProjects.refetch()}
                className="min-h-[400px]"
            />
        );
    }

    // First-run state: no cert-manager project exists yet.
    if (!certProjects.data.length) {
        return (
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-2xl font-semibold">Certificates</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Issue and govern X.509 certificates with private certificate authorities.
                    </p>
                </div>
                <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl bg-card p-8 text-center">
                    <FileBadge className="h-8 w-8 text-muted-foreground" />
                    <p className="mt-4 text-sm font-medium">Set up your certificate workspace</p>
                    <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                        Certificates live in a dedicated project. Create one to start issuing private CAs and certificates.
                    </p>
                    <Button className="mt-5 gap-x-2" onClick={handleCreateWorkspace} disabled={createProject.isPending}>
                        {createProject.isPending ? (
                            <LoaderIcon className="h-4 w-4 animate-spin" />
                        ) : (
                            <Plus className="h-4 w-4" />
                        )}
                        Create certificate workspace
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Certificates</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Private certificate authorities and the certificates they issue.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {certProjects.data.length > 1 && (
                        <Select value={projectId} onValueChange={setProjectId}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Workspace" />
                            </SelectTrigger>
                            <SelectContent>
                                {certProjects.data.map((project) => (
                                    <SelectItem key={project.id} value={project.id}>
                                        {project.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    <Button onClick={() => setCaOpen(true)} className="gap-x-2">
                        <Plus className="h-4 w-4" />
                        New CA
                    </Button>
                </div>
            </div>

            <div className="rounded-2xl bg-card p-6">
                <div className="flex items-center gap-x-2.5">
                    <ShieldCheck className="h-5 w-5" />
                    <h2 className="text-sm font-semibold">Certificate authorities</h2>
                </div>
                <div className="mt-4 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Name</TableHead>
                                <TableHead>Common name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Valid until</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cas.isPending && (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                                        Loading certificate authorities...
                                    </TableCell>
                                </TableRow>
                            )}
                            {cas.data?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                                        No certificate authorities yet. Create a root CA to start issuing certificates.
                                    </TableCell>
                                </TableRow>
                            )}
                            {(cas.data ?? []).map((ca) => (
                                <TableRow key={ca.id}>
                                    <TableCell className="text-sm font-medium">
                                        {ca.friendlyName || ca.name}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {ca.commonName ?? "—"}
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium capitalize">
                                            {ca.type}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={
                                                ca.status === "active"
                                                    ? "text-xs font-medium capitalize text-emerald-500"
                                                    : "text-xs font-medium capitalize text-amber-500"
                                            }
                                        >
                                            {ca.status.replace(/-/g, " ")}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {ca.notAfter ? format(new Date(ca.notAfter), "MMM d, yyyy") : "—"}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <div className="rounded-2xl bg-card p-6">
                <div className="flex items-center gap-x-2.5">
                    <FileBadge className="h-5 w-5" />
                    <h2 className="text-sm font-semibold">Issued certificates</h2>
                </div>
                <div className="mt-4 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Common name</TableHead>
                                <TableHead>Serial number</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Not before</TableHead>
                                <TableHead>Expires</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {certs.isPending && (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                                        Loading certificates...
                                    </TableCell>
                                </TableRow>
                            )}
                            {certs.data?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                                        No certificates issued yet. Issue them from your CA via the API or CLI.
                                    </TableCell>
                                </TableRow>
                            )}
                            {(certs.data ?? []).map((cert) => (
                                <TableRow key={cert.id}>
                                    <TableCell className="text-sm font-medium">
                                        {cert.commonName || cert.friendlyName || "—"}
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                                        {cert.serialNumber ?? "—"}
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium capitalize">
                                            {cert.status ?? "active"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {cert.notBefore ? format(new Date(cert.notBefore), "MMM d, yyyy") : "—"}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {cert.notAfter ? format(new Date(cert.notAfter), "MMM d, yyyy") : "—"}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={caOpen} onOpenChange={setCaOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create root certificate authority</DialogTitle>
                        <DialogDescription>
                            Creates a private root CA (RSA 2048) that can issue certificates for your services.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateCa} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="ca-name">Name</Label>
                            <Input
                                id="ca-name"
                                value={caName}
                                onChange={(e) => setCaName(e.target.value)}
                                placeholder="e.g. Internal Root CA"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ca-cn">Common name</Label>
                            <Input
                                id="ca-cn"
                                value={caCommonName}
                                onChange={(e) => setCaCommonName(e.target.value)}
                                placeholder="e.g. apiharbor.internal"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ca-org">Organization (optional)</Label>
                            <Input
                                id="ca-org"
                                value={caOrg}
                                onChange={(e) => setCaOrg(e.target.value)}
                                placeholder="e.g. APIHarbor Inc"
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCaOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createCa.isPending}>
                                {createCa.isPending ? <LoaderIcon className="h-4 w-4 animate-spin" /> : "Create CA"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CertificatesPage;
