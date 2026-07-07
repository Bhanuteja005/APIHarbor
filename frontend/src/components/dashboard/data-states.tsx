"use client";

import { cn } from "@/utils";
import { AlertTriangle, RotateCw } from "lucide-react";

export const CardSkeleton = ({ className }: { className?: string }) => (
    <div className={cn("animate-pulse rounded-2xl bg-card p-6", className)}>
        <div className="h-4 w-1/3 rounded bg-muted" />
        <div className="mt-4 h-9 w-1/4 rounded bg-muted" />
        <div className="mt-5 h-3 w-2/3 rounded bg-muted" />
        <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
    </div>
);

export const ErrorCard = ({ message, onRetry, className }: { message: string; onRetry?: () => void; className?: string }) => (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl bg-card p-8 text-center", className)}>
        <AlertTriangle className="h-6 w-6 text-amber-500" />
        <p className="mt-3 text-sm font-medium">
            Couldn&apos;t load this data
        </p>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            {message}
        </p>
        {onRetry && (
            <button
                onClick={onRetry}
                className="mt-4 flex h-9 items-center gap-x-2 rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
                <RotateCw className="h-4 w-4" />
                Try again
            </button>
        )}
    </div>
);
