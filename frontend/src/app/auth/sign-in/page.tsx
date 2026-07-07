import { SignInForm } from "@/components";
import AuthShell from "@/components/auth/auth-shell";
import { generateMetadata } from "@/utils";

export const metadata = generateMetadata({
    title: `Log in - ${process.env.NEXT_PUBLIC_APP_NAME || "APIHarbor"}`,
});

const SignInPage = () => {
    return (
        <AuthShell action={{ label: "Sign Up", href: "/auth/sign-up" }}>
            <SignInForm />
        </AuthShell>
    )
};

export default SignInPage
