"use client";

import { LoaderIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// The backend redirects here when an OAuth provider could not verify the
// user's email (rare with Google). Fall back to the email signup flow.
const SsoSignupPage = () => {
    const router = useRouter();

    useEffect(() => {
        router.replace("/auth/sign-up");
    }, [router]);

    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
            <LoaderIcon className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Redirecting to sign up...</p>
        </main>
    );
};

export default SsoSignupPage;
