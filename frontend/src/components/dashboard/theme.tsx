"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type DashTheme = "light" | "dark";

interface DashThemeContextValue {
    theme: DashTheme;
    toggleTheme: () => void;
}

const DashThemeContext = createContext<DashThemeContextValue>({
    theme: "light",
    toggleTheme: () => { },
});

export const useDashTheme = () => useContext(DashThemeContext);

export const DashThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [theme, setTheme] = useState<DashTheme>("light");

    useEffect(() => {
        const stored = window.localStorage.getItem("apiharbor-dash-theme");
        if (stored === "light" || stored === "dark") {
            setTheme(stored);
        }
    }, []);

    const toggleTheme = () => {
        setTheme((prev) => {
            const next = prev === "light" ? "dark" : "light";
            window.localStorage.setItem("apiharbor-dash-theme", next);
            return next;
        });
    };

    return (
        <DashThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </DashThemeContext.Provider>
    );
};
