import { SignInForm } from "@/components";
import AuthShell from "@/components/auth/auth-shell";
import { generateMetadata } from "@/utils";
import { Suspense } from "react";

export const metadata = generateMetadata({
    title: `Log in - ${process.env.NEXT_PUBLIC_APP_NAME || "APIHarbor"}`,
});

const SignInPage = () => {
    return (
        <AuthShell action={{ label: "Sign Up", href: "/auth/sign-up" }}>
            {/* SignInForm reads searchParams (SSO error / MFA handoff) */}
            <Suspense>
                <SignInForm />
            </Suspense>
        </AuthShell>
    )
};

export default SignInPage
