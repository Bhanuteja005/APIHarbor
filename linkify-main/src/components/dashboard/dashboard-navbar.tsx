"use client";

import { useSession } from "@/components/auth/use-session";
import { useDashTheme } from "@/components/dashboard/theme";
import { Anchor, Bell, Moon, Sun } from "lucide-react";
import Link from "next/link";

const DashboardNavbar = () => {

    const { theme, toggleTheme } = useDashTheme();
    const { user } = useSession();

    const displayUser = user ?? { name: "Account", email: "" };

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border bg-card px-4 lg:px-6">
            <Link href="/dashboard" className="flex items-center gap-x-2 md:hidden">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <Anchor className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-heading text-lg font-bold">
                    APIHarbor
                </span>
            </Link>
            <div className="ml-auto flex items-center gap-x-3">
                <button
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                    {theme === "light" ? (
                        <Moon className="h-[18px] w-[18px]" />
                    ) : (
                        <Sun className="h-[18px] w-[18px]" />
                    )}
                </button>
                <button
                    aria-label="Notifications"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
                >
                    <Bell className="h-[18px] w-[18px]" />
                </button>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {displayUser.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
            </div>
        </header>
    );
};

export default DashboardNavbar;
