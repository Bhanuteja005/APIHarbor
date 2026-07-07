import AcceptInviteForm from "@/components/auth/accept-invite-form";
import AuthShell from "@/components/auth/auth-shell";
import { Toaster } from "@/components/ui/sonner";
import { generateMetadata } from "@/utils";
import { Suspense } from "react";

export const metadata = generateMetadata({
    title: `Join your team - ${process.env.NEXT_PUBLIC_APP_NAME || "APIHarbor"}`,
    noIndex: true,
});

const SignupInvitePage = () => {
    return (
        <>
            <Toaster richColors theme="dark" position="top-right" />
            <AuthShell action={{ label: "Log In", href: "/auth/sign-in" }}>
                <Suspense>
                    <AcceptInviteForm />
                </Suspense>
            </AuthShell>
        </>
    )
};

export default SignupInvitePage
