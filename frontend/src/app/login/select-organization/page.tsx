"use client";

import { LoaderIcon } from "lucide-react";
import { useEffect } from "react";

// The backend's OAuth callback always redirects the browser to this fixed
// path. The jid refresh cookie it set is scoped to path=/api, so completing
// the session must happen via a full navigation to an /api route handler —
// a fetch or server action would not carry the cookie.
const SelectOrganizationPage = () => {
    useEffect(() => {
        window.location.replace("/api/auth/sso-complete");
    }, []);

    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
            <LoaderIcon className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Completing sign-in...</p>
        </main>
    );
};

export default SelectOrganizationPage;
