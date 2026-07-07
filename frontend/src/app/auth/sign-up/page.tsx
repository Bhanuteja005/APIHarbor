import { SignUpForm } from "@/components";
import AuthShell from "@/components/auth/auth-shell";
import { generateMetadata } from "@/utils";

export const metadata = generateMetadata({
    title: `Sign up - ${process.env.NEXT_PUBLIC_APP_NAME || "APIHarbor"}`,
});

const SignUpPage = () => {
    return (
        <AuthShell action={{ label: "Log In", href: "/auth/sign-in" }}>
            <SignUpForm />
        </AuthShell>
    )
};

export default SignUpPage
