"use client";

import { login, verifyMfa } from "@/actions";
import { Icons } from "@/components/global/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Github, Gitlab, LoaderIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";
import { Label } from "../ui/label";

const SignInForm = () => {

    const router = useRouter();
    const searchParams = useSearchParams();

    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    // SSO logins that require MFA are redirected here with ?mfa=<method>
    // (the challenge itself lives in the httpOnly ah_mfa cookie).
    const [mfaMethod, setMfaMethod] = useState<string | null>(searchParams.get("mfa"));
    const [mfaCode, setMfaCode] = useState<string>("");

    const ssoError = searchParams.get("error");
    useEffect(() => {
        if (ssoError === "sso") {
            toast.error("Single sign-on failed. Please try again or use email and password.");
        }
    }, [ssoError]);

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error("Email and password are required!");
            return;
        }

        setIsLoading(true);

        try {
            const result = await login({ email, password });

            if ("mfaRequired" in result && result.mfaRequired) {
                setMfaMethod(result.mfaMethod ?? "email");
                setIsLoading(false);
                return;
            }

            if ("success" in result && result.success) {
                router.push("/auth/auth-callback");
            } else {
                toast.error(("error" in result && result.error) || "Invalid email or password");
                setIsLoading(false);
            }
        } catch (error) {
            toast.error("An error occurred. Please try again");
            setIsLoading(false);
        }
    };

    const handleVerifyMfa = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!mfaCode || mfaCode.length < 6) {
            toast.error("Enter the 6-digit code to continue.");
            return;
        }

        setIsLoading(true);

        try {
            const result = await verifyMfa({ code: mfaCode });

            if (result.success) {
                router.push("/auth/auth-callback");
            } else {
                toast.error(result.error || "Invalid verification code");
                setIsLoading(false);
            }
        } catch (error) {
            toast.error("An error occurred. Please try again");
            setIsLoading(false);
        }
    };

    const handleSso = (provider: string) => {
        if (provider === "Google") {
            window.location.assign("/api/v1/sso/redirect/google");
            return;
        }
        toast.info(`${provider} sign-in isn't configured yet. Use email and password.`);
    };

    if (mfaMethod) {
        return (
            <div className="mx-auto flex w-full max-w-sm flex-col items-center">
                <Card className="w-full border-border bg-card/80 p-6 backdrop-blur">
                    <CardHeader className="p-0 pb-6">
                        <CardTitle className="bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-[1.65rem] font-medium text-transparent">
                            Two-factor authentication
                        </CardTitle>
                        <p className="pt-1 text-sm text-muted-foreground">
                            {mfaMethod === "totp"
                                ? "Enter the 6-digit code from your authenticator app."
                                : "Enter the 6-digit code we just sent to your email."}
                        </p>
                    </CardHeader>
                    <CardContent className="p-0">
                        <form onSubmit={handleVerifyMfa} className="w-full">
                            <div className="w-full space-y-2">
                                <Label htmlFor="mfa-code">
                                    Verification code
                                </Label>
                                <InputOTP
                                    id="mfa-code"
                                    maxLength={6}
                                    value={mfaCode}
                                    disabled={isLoading}
                                    onChange={(value) => setMfaCode(value)}
                                    className="pt-2"
                                >
                                    <InputOTPGroup>
                                        <InputOTPSlot index={0} />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot index={2} />
                                        <InputOTPSlot index={3} />
                                        <InputOTPSlot index={4} />
                                        <InputOTPSlot index={5} />
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>
                            <div className="mt-6 w-full">
                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={isLoading}
                                    className="w-full"
                                >
                                    {isLoading ? (
                                        <LoaderIcon className="h-5 w-5 animate-spin" />
                                    ) : "Verify and sign in"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="mx-auto flex w-full max-w-sm flex-col items-center">
            <Card className="w-full border-border bg-card/80 p-6 backdrop-blur">
                <CardHeader className="p-0 pb-6">
                    <CardTitle className="bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-[1.65rem] font-medium text-transparent">
                        Log in to APIHarbor
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <form onSubmit={handleSignIn} className="w-full">
                        <div className="w-full space-y-2">
                            <Label htmlFor="email" className="sr-only">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                disabled={isLoading}
                                autoComplete="username"
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email..."
                                className="h-10 w-full focus-visible:border-foreground"
                            />
                        </div>
                        <div className="mt-2 w-full space-y-2">
                            <Label htmlFor="password" className="sr-only">
                                Password
                            </Label>
                            <div className="relative w-full">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    disabled={isLoading}
                                    autoComplete="current-password"
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password..."
                                    className="h-10 w-full pr-11 focus-visible:border-foreground"
                                />
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    disabled={isLoading}
                                    className="absolute right-1 top-1 h-8 w-8"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ?
                                        <EyeOff className="h-4 w-4" /> :
                                        <Eye className="h-4 w-4" />
                                    }
                                </Button>
                            </div>
                        </div>
                        <div className="mt-4 w-full">
                            <Button
                                type="submit"
                                size="lg"
                                disabled={isLoading}
                                className="w-full"
                            >
                                {isLoading ? (
                                    <LoaderIcon className="h-5 w-5 animate-spin" />
                                ) : "Continue with Email"}
                            </Button>
                        </div>
                    </form>

                    <div className="my-4 flex w-full flex-row items-center py-2">
                        <div className="w-full border-t border-border" />
                        <span className="mx-2 text-xs text-muted-foreground">or</span>
                        <div className="w-full border-t border-border" />
                    </div>

                    <div className="flex w-full gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            disabled={isLoading}
                            title="Continue with Google"
                            aria-label="Continue with Google"
                            onClick={() => handleSso("Google")}
                        >
                            <Icons.google className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            disabled={isLoading}
                            title="Continue with GitHub"
                            aria-label="Continue with GitHub"
                            onClick={() => handleSso("GitHub")}
                        >
                            <Github className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            disabled={isLoading}
                            title="Continue with GitLab"
                            aria-label="Continue with GitLab"
                            onClick={() => handleSso("GitLab")}
                        >
                            <Gitlab className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="mt-6 flex flex-col items-center gap-3">
                <div className="flex flex-row items-center justify-center gap-1.5 text-sm">
                    <span className="text-muted-foreground">Don&apos;t have an account?</span>
                    <Link
                        href="/auth/sign-up"
                        className="cursor-pointer text-foreground/95 underline decoration-foreground/60 underline-offset-2 transition-colors duration-200 hover:decoration-foreground"
                    >
                        Sign up
                    </Link>
                </div>
                <div className="flex flex-row justify-center text-xs text-muted-foreground">
                    <Link
                        href="/auth/forgot-password"
                        className="cursor-pointer duration-200 hover:text-foreground hover:underline hover:underline-offset-2"
                    >
                        Recover your account
                    </Link>
                </div>
            </div>
        </div>
    )
};

export default SignInForm
