"use client";

import { completeSignup, sendSignupCode, verifySignupCode } from "@/actions";
import { Icons } from "@/components/global/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Github, Gitlab, LoaderIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";
import { Label } from "../ui/label";

type SignUpStep = "email" | "code" | "details";

const cardTitleClass =
    "bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-[1.65rem] font-medium text-transparent";

const SignUpForm = () => {

    const router = useRouter();

    const [step, setStep] = useState<SignUpStep>("email");
    const [email, setEmail] = useState<string>("");
    const [code, setCode] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [organization, setOrganization] = useState<string>("");
    const [attribution, setAttribution] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast.error("Email is required!");
            return;
        }

        setIsLoading(true);

        try {
            const result = await sendSignupCode({ email });

            if (result.success) {
                toast.success("Verification code sent to your email.");
                setStep("code");
            } else {
                toast.error(result.error || "Couldn't send the code. Please try again.");
            }
        } catch (error) {
            toast.error("An error occurred. Please try again");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyEmail = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!code || code.length < 6) {
            toast.error("Verification code is required!");
            return;
        }

        setIsLoading(true);

        try {
            const result = await verifySignupCode({ email, code });

            if (result.success) {
                setStep("details");
            } else {
                toast.error(result.error || "Invalid verification code");
            }
        } catch (error) {
            toast.error("An error occurred. Please try again");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCompleteSignUp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !organization || !password) {
            toast.error("Name, organization and password are required!");
            return;
        }

        if (password.length < 14) {
            toast.error("Password must be at least 14 characters long.");
            return;
        }

        setIsLoading(true);

        try {
            const result = await completeSignup({ name, organization, password, attribution });

            if ("success" in result && result.success) {
                router.push("/auth/auth-callback");
            } else {
                toast.error(("error" in result && result.error) || "An error occurred. Please try again");
                setIsLoading(false);
            }
        } catch (error) {
            toast.error("An error occurred. Please try again");
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        const result = await sendSignupCode({ email });
        if (result.success) {
            toast.success("Verification code resent to your email.");
        } else {
            toast.error(result.error || "Please wait before requesting another code.");
        }
    };

    const handleSso = (provider: string) => {
        if (provider === "Google") {
            // Google-verified emails complete signup in one hop on the backend.
            window.location.assign("/api/v1/sso/redirect/google");
            return;
        }
        toast.info(`${provider} sign-up isn't configured yet. Continue with your email.`);
    };

    if (step === "code") {
        return (
            <div className="mx-auto flex w-full max-w-sm flex-col items-center">
                <Card className="w-full border-border bg-card/80 p-6 backdrop-blur">
                    <CardHeader className="p-0 pb-6">
                        <CardTitle className={cardTitleClass}>
                            Confirm your email
                        </CardTitle>
                        <p className="pt-1 text-sm text-muted-foreground">
                            Enter the 6-digit confirmation code we just sent to {email}.
                        </p>
                    </CardHeader>
                    <CardContent className="p-0">
                        <form onSubmit={handleVerifyEmail} className="w-full">
                            <div className="w-full space-y-2">
                                <Label htmlFor="code">
                                    Confirmation code
                                </Label>
                                <InputOTP
                                    id="code"
                                    name="code"
                                    maxLength={6}
                                    value={code}
                                    disabled={isLoading}
                                    onChange={(e) => setCode(e)}
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
                                    ) : "Verify code"}
                                </Button>
                            </div>
                            <p className="mt-4 text-sm text-muted-foreground">
                                Didn&apos;t receive the code?{" "}
                                <Link
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleResend();
                                    }}
                                    className="text-foreground underline decoration-foreground/60 underline-offset-2 hover:decoration-foreground"
                                >
                                    Resend code
                                </Link>
                            </p>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (step === "details") {
        return (
            <div className="mx-auto flex w-full max-w-sm flex-col items-center">
                <Card className="w-full border-border bg-card/80 p-6 backdrop-blur">
                    <CardHeader className="p-0 pb-6">
                        <CardTitle className={cardTitleClass}>
                            Almost there
                        </CardTitle>
                        <p className="pt-1 text-sm text-muted-foreground">
                            Tell us a bit about you and set a password.
                        </p>
                    </CardHeader>
                    <CardContent className="p-0">
                        <form onSubmit={handleCompleteSignUp} className="w-full">
                            <div className="w-full space-y-2">
                                <Label htmlFor="name">
                                    Name
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={name}
                                    disabled={isLoading}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="h-10 w-full focus-visible:border-foreground"
                                />
                            </div>
                            <div className="mt-4 w-full space-y-2">
                                <Label htmlFor="organization">
                                    Organization name
                                </Label>
                                <Input
                                    id="organization"
                                    type="text"
                                    value={organization}
                                    disabled={isLoading}
                                    onChange={(e) => setOrganization(e.target.value)}
                                    placeholder="Enter your organization name"
                                    className="h-10 w-full focus-visible:border-foreground"
                                />
                            </div>
                            <div className="mt-4 w-full space-y-2">
                                <Label htmlFor="attribution">
                                    Where did you hear about us? <span className="text-muted-foreground">(optional)</span>
                                </Label>
                                <Input
                                    id="attribution"
                                    type="text"
                                    value={attribution}
                                    disabled={isLoading}
                                    onChange={(e) => setAttribution(e.target.value)}
                                    placeholder="Search engine, a friend, ..."
                                    className="h-10 w-full focus-visible:border-foreground"
                                />
                            </div>
                            <div className="mt-4 space-y-2">
                                <Label htmlFor="password">
                                    Password
                                </Label>
                                <div className="relative w-full">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        disabled={isLoading}
                                        autoComplete="new-password"
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="At least 14 characters"
                                        className="h-10 w-full pr-11 focus-visible:border-foreground"
                                    />
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
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
                            <div className="mt-6 w-full">
                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={isLoading}
                                    className="w-full"
                                >
                                    {isLoading ? (
                                        <LoaderIcon className="h-5 w-5 animate-spin" />
                                    ) : "Create account"}
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
                    <CardTitle className={cardTitleClass}>
                        Sign up for APIHarbor
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <form onSubmit={handleSendCode} className="w-full">
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

            <div className="mt-6 flex flex-row items-center justify-center gap-1.5 text-sm">
                <span className="text-muted-foreground">Already have an account?</span>
                <Link
                    href="/auth/sign-in"
                    className="cursor-pointer text-foreground/95 underline decoration-foreground/60 underline-offset-2 transition-colors duration-200 hover:decoration-foreground"
                >
                    Log in
                </Link>
            </div>
        </div>
    )
};

export default SignUpForm
