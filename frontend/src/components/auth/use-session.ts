"use client";

import { logout } from "@/actions";
import { useEffect, useState } from "react";

interface SessionUser {
    name: string;
    email: string;
}

export const useSession = () => {
    const [user, setUser] = useState<SessionUser | null>(null);

    useEffect(() => {
        const cookie = document.cookie
            .split("; ")
            .find((entry) => entry.startsWith("ah_user="));

        if (!cookie) return;

        try {
            setUser(JSON.parse(decodeURIComponent(cookie.split("=").slice(1).join("="))));
        } catch {
            setUser(null);
        }
    }, []);

    const signOut = async () => {
        await logout();
        setUser(null);
        window.location.href = "/";
    };

    return { user, isSignedIn: !!user, signOut };
};
