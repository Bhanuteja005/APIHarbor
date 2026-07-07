import AuthShell from "@/components/auth/auth-shell";
import ForgotPasswordForm from "@/components/auth/forgot-password-form";
import { generateMetadata } from "@/utils";

export const metadata = generateMetadata({
    title: `Recover your account - ${process.env.NEXT_PUBLIC_APP_NAME || "APIHarbor"}`,
});

const ForgotPasswordPage = () => {
    return (
        <AuthShell action={{ label: "Log In", href: "/auth/sign-in" }}>
            <ForgotPasswordForm />
        </AuthShell>
    )
};

export default ForgotPasswordPage
