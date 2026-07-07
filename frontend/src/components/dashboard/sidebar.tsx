"use client";

import { logout } from "@/actions";
import { useSession } from "@/components/auth/use-session";
import ProjectSwitcher from "@/components/dashboard/project-switcher";
import { cn } from "@/utils";
import {
    Blocks,
    FileBadge,
    FolderKanban,
    KeyRound,
    LayoutGrid,
    LineChart,
    LogOut,
    ScrollText,
    Settings,
    Users,
    Waypoints,
    Infinity as InfinityIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";

const NAV_ITEMS = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
    { label: "API Keys", href: "/dashboard/keys", icon: KeyRound },
    { label: "Analytics", href: "/dashboard/analytics", icon: LineChart },
    { label: "Providers", href: "/dashboard/providers", icon: Waypoints },
    { label: "Projects", href: "/dashboard/projects", icon: FolderKanban },
    { label: "Certificates", href: "/dashboard/certificates", icon: FileBadge },
    { label: "Integrations", href: "/dashboard/integrations", icon: Blocks },
    { label: "Access Control", href: "/dashboard/access", icon: Users },
    { label: "Audit Logs", href: "/dashboard/audit-logs", icon: ScrollText },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const Sidebar = () => {

    const router = useRouter();
    const pathname = usePathname();
    const { user } = useSession();

    const displayUser = user ?? { name: "Account", email: "" };

    const handleLogout = async () => {
        await logout();
        router.push("/");
    };

    return (
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[270px] flex-col border-r border-border bg-card md:flex">
            <div className="flex items-center gap-x-3 px-5 pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                    <InfinityIcon className="h-6 w-6 text-primary-foreground" strokeWidth={2.25} />
                </div>
                <span className="font-heading text-2xl font-bold tracking-tight">
                    APIHarbor
                </span>
            </div>

            <div className="px-5 pt-7">
                <ProjectSwitcher />
            </div>

            <div className="px-5 pt-6">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Menu
                </p>
                <div className="mt-3 border-b border-border" />
            </div>

            <nav className="flex flex-col gap-y-1.5 overflow-y-auto px-5 pt-5">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex h-11 items-center gap-x-3 rounded-lg px-3.5 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-foreground/80 hover:bg-muted"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto border-t border-border px-5 py-4">
                <div className="flex items-center gap-x-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                        {displayUser.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                            {displayUser.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                            {displayUser.email}
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        aria-label="Sign out"
                        className="ml-auto text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <LogOut className="h-[18px] w-[18px]" />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
