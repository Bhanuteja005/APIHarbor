"use client";

import { CardSkeleton } from "@/components/dashboard/data-states";
import { useProductStats } from "@/hooks/use-org";
import { TProductStats } from "@/lib/api/types";
import { FileBadge, KeySquare, Radar, ShieldCheck, Vault } from "lucide-react";

interface ProductCard {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    stats: (data: TProductStats) => { label: string; value: number }[];
}

const PRODUCTS: ProductCard[] = [
    {
        title: "Secrets Management",
        description: "Centralize secrets across environments with syncs, rotations, and lifecycle policies.",
        icon: Vault,
        stats: (d) => [
            { label: "secrets", value: d.secretManager.secretsCount },
            { label: "environments", value: d.secretManager.environmentsCount },
            { label: "projects", value: d.secretManager.projectsCount },
        ],
    },
    {
        title: "Certificate Manager",
        description: "Issue, rotate, and govern X.509 certificates for TLS, mTLS, and device identity.",
        icon: FileBadge,
        stats: (d) => [
            { label: "certificates", value: d.certificateManager.certificatesCount },
            { label: "CAs", value: d.certificateManager.certificateAuthoritiesCount },
            { label: "signers", value: d.certificateManager.signersCount },
        ],
    },
    {
        title: "KMS",
        description: "Generate, store, and use cryptographic keys to encrypt, sign, and verify.",
        icon: KeySquare,
        stats: (d) => [
            { label: "keys", value: d.kms.keysCount },
            { label: "clients", value: d.kms.clientsCount },
            { label: "projects", value: d.kms.projectsCount },
        ],
    },
    {
        title: "Secret Scanning",
        description: "Continuously scan repositories and artifacts for leaked secrets.",
        icon: Radar,
        stats: (d) => [
            { label: "data sources", value: d.secretScanning.dataSourcesCount },
            { label: "resources", value: d.secretScanning.resourcesCount },
            { label: "projects", value: d.secretScanning.projectsCount },
        ],
    },
    {
        title: "PAM",
        description: "Grant privileged users and machines just-in-time access with credential vaulting.",
        icon: ShieldCheck,
        stats: (d) => [
            { label: "accounts", value: d.pam.accountsCount },
            { label: "resources", value: d.pam.resourcesCount },
            { label: "projects", value: d.pam.projectsCount },
        ],
    },
];

const ProductsOverview = () => {
    const stats = useProductStats();

    if (stats.isPending) {
        return (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
            </div>
        );
    }

    // The overview is additive context on the dashboard — if the endpoint is
    // unavailable (e.g. older backend deploy) just render nothing.
    if (stats.isError || !stats.data) return null;

    return (
        <section>
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Organization overview
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {PRODUCTS.map((product) => (
                    <div key={product.title} className="rounded-2xl bg-card p-6">
                        <div className="flex items-center gap-x-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                                <product.icon className="h-5 w-5" />
                            </div>
                            <p className="text-sm font-semibold">{product.title}</p>
                        </div>
                        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                            {product.description}
                        </p>
                        <div className="mt-4 flex items-center gap-x-5 border-t border-border pt-4">
                            {product.stats(stats.data).map((stat) => (
                                <div key={stat.label}>
                                    <p className="text-lg font-semibold">{stat.value}</p>
                                    <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default ProductsOverview;
