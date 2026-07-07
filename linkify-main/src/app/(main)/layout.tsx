"use client";

import DashboardNavbar from "@/components/dashboard/dashboard-navbar";
import Sidebar from "@/components/dashboard/sidebar";
import { DashThemeProvider, useDashTheme } from "@/components/dashboard/theme";
import { cn } from "@/utils";
import React from "react";

const DashboardShell = ({ children }: { children: React.ReactNode }) => {
    const { theme } = useDashTheme();

    return (
        // The template's CSS vars are inverted: `:root` holds dark values and the
        // `.dark` class holds light values, so light dashboard mode applies `dark`.
        <div className={cn("min-h-screen w-full", theme === "light" && "dark")}>
            <div className="flex min-h-screen w-full bg-[hsl(var(--dash-main))] text-foreground">
                <Sidebar />
                <div className="flex flex-1 flex-col md:pl-[270px]">
                    <DashboardNavbar />
                    <main className="flex-1 p-4 md:p-6 lg:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
};

const MainLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <DashThemeProvider>
            <DashboardShell>
                {children}
            </DashboardShell>
        </DashThemeProvider>
    );
};

export default MainLayout;
