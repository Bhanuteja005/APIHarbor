"use client";

import { CardSkeleton, ErrorCard } from "@/components/dashboard/data-states";
import { Button } from "@/components/ui/button";
import { useApiKeys } from "@/hooks/use-api-keys";
import { ApiKeyProvider } from "@/lib/api/types";
import { cn } from "@/utils";
import { Bot, CreditCard, Github, Globe, Plus, Sparkles, type LucideIcon } from "lucide-react";
import { toast } from "sonner";

const PROVIDERS: { id: ApiKeyProvider; name: string; description: string; icon: LucideIcon }[] = [
    { id: "openai", name: "OpenAI", description: "Completions, embeddings, and assistants APIs.", icon: Sparkles },
    { id: "anthropic", name: "Anthropic", description: "Claude models and the Messages API.", icon: Bot },
    { id: "stripe", name: "Stripe", description: "Payments, billing, and financial reports.", icon: CreditCard },
    { id: "github", name: "GitHub", description: "Repos, actions, and personal access tokens.", icon: Github },
    { id: "generic", name: "Generic HTTP", description: "Track any key with a custom validation URL.", icon: Globe },
];

const ProvidersPage = () => {

    const keysQuery = useApiKeys();

    const handleComingSoon = () => {
        toast.info("Provider management is coming soon.");
    };

    if (keysQuery.isPending) {
        return (
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Providers
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Connect the platforms your API keys belong to.
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    <CardSkeleton className="min-h-[220px]" />
                    <CardSkeleton className="min-h-[220px]" />
                    <CardSkeleton className="min-h-[220px]" />
                    <CardSkeleton className="min-h-[220px]" />
                    <CardSkeleton className="min-h-[220px]" />
                    <CardSkeleton className="min-h-[220px]" />
                </div>
            </div>
        );
    }

    if (keysQuery.isError) {
        return (
            <ErrorCard
                message={keysQuery.error.message}
                onRetry={() => keysQuery.refetch()}
                className="min-h-[400px]"
            />
        );
    }

    const keys = keysQuery.data;
    const countByProvider = keys.reduce<Record<string, number>>((acc, key) => {
        acc[key.provider] = (acc[key.provider] ?? 0) + 1;
        return acc;
    }, {});

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-semibold">
                    Providers
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Connect the platforms your API keys belong to.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {PROVIDERS.map((provider) => {
                    const Icon = provider.icon;
                    const count = countByProvider[provider.id] ?? 0;
                    const isConnected = count > 0;

                    return (
                        <div
                            key={provider.id}
                            className="flex min-h-[220px] flex-col rounded-2xl bg-card p-6"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <span
                                        className={cn(
                                            "h-1.5 w-1.5 rounded-full",
                                            isConnected ? "bg-emerald-500" : "bg-muted-foreground"
                                        )}
                                    />
                                    {isConnected ? "Connected" : "Available"}
                                </span>
                            </div>
                            <h2 className="mt-4 text-base font-semibold">
                                {provider.name}
                            </h2>
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                {provider.description}
                            </p>
                            <div className="mt-auto flex items-center justify-between pt-5">
                                <span className="text-sm text-muted-foreground">
                                    {count} {count === 1 ? "key" : "keys"}
                                </span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleComingSoon}
                                >
                                    {isConnected ? "Manage" : "Connect"}
                                </Button>
                            </div>
                        </div>
                    );
                })}

                <button
                    type="button"
                    onClick={handleComingSoon}
                    className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-transparent transition-colors hover:bg-muted/40"
                >
                    <Plus className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                        Add custom provider
                    </span>
                </button>
            </div>
        </div>
    );
};

export default ProvidersPage;
