import AuthShell from "@/components/auth/auth-shell";
import ResetPasswordForm from "@/components/auth/reset-password-form";
import { Toaster } from "@/components/ui/sonner";
import { generateMetadata } from "@/utils";
import { Suspense } from "react";

export const metadata = generateMetadata({
    title: `Reset your password - ${process.env.NEXT_PUBLIC_APP_NAME || "APIHarbor"}`,
    noIndex: true,
});

const AccountRecoveryResetPage = () => {
    return (
        <>
            <Toaster richColors theme="dark" position="top-right" />
            <AuthShell action={{ label: "Log In", href: "/auth/sign-in" }}>
                <Suspense>
                    <ResetPasswordForm />
                </Suspense>
            </AuthShell>
        </>
    )
};

export default AccountRecoveryResetPage
