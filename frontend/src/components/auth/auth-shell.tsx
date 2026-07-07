import { Icons } from "@/components/global/icons";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/utils";
import Link from "next/link";
import React from "react";
import AuthBackground from "./auth-background";

interface Props {
    children: React.ReactNode;
    action?: {
        label: string;
        href: string;
    };
}

const AuthShell = ({ children, action }: Props) => (
    <div className="relative flex min-h-dvh w-full flex-col overflow-hidden bg-gradient-to-tr from-neutral-900/80 via-background to-neutral-900/80 px-4">
        <AuthBackground />

        <header className="relative z-10 mx-auto flex h-16 w-full max-w-6xl items-center justify-between">
            <Link href="/" className="flex items-center gap-x-2">
                <Icons.logo className="h-7 w-7" />
                <span className="font-heading text-lg font-bold !leading-none">
                    APIHarbor
                </span>
            </Link>
            {action && (
                <Link href={action.href} className={cn(buttonVariants({ size: "sm" }))}>
                    {action.label}
                </Link>
            )}
        </header>

        <div className="relative z-10 my-auto flex w-full flex-col items-center py-10">
            {children}
        </div>

        <footer className="relative z-10 py-6 text-center">
            <div className="mb-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <Link href="/terms" className="transition-colors hover:text-foreground">
                    Terms of Service
                </Link>
                <Link href="/privacy" className="transition-colors hover:text-foreground">
                    Privacy Policy
                </Link>
            </div>
            <p className="text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} APIHarbor Inc. All rights reserved.
            </p>
        </footer>
    </div>
);

export default AuthShell;
