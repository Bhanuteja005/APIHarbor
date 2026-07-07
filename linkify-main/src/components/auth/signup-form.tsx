"use client";

import { completeSignup, sendSignupCode, verifySignupCode } from "@/actions";
import { Icons } from "@/components/global/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Github, Gitlab, LoaderIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";
import { Label } from "../ui/label";

type SignUpStep = "email" | "code" | "details";

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
        toast.info(`${provider} sign-up isn't configured yet. Continue with your email.`);
    };

    if (step === "code") {
        return (
            <div className="flex flex-col items-start w-full text-start gap-y-6 py-8 px-0.5">
                <h2 className="text-2xl font-semibold">
                    Verify your email
                </h2>
                <p className="text-sm text-muted-foreground">
                    To continue, please enter the 6-digit verification code we just sent to {email}.
                </p>
                <form onSubmit={handleVerifyEmail} className="w-full">
                    <div className="space-y-2 w-full pl-0.5">
                        <Label htmlFor="code">
                            Verification code
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
                    <div className="mt-4 w-full">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full"
                        >
                            {isLoading ? (
                                <LoaderIcon className="w-5 h-5 animate-spin" />
                            ) : "Verify code"}
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                        Didn&apos;t receive the code?{" "}
                        <Link
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                handleResend();
                            }}
                            className="text-primary"
                        >
                            Resend code
                        </Link>
                    </p>
                </form>
            </div>
        );
    }

    if (step === "details") {
        return (
            <div className="flex flex-col items-start gap-y-6 py-8 w-full px-0.5">
                <h2 className="text-2xl font-semibold">
                    Almost there
                </h2>
                <p className="text-sm text-muted-foreground -mt-3">
                    Tell us a bit about you and set a password.
                </p>

                <form onSubmit={handleCompleteSignUp} className="w-full">
                    <div className="space-y-2 w-full">
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
                            className="w-full focus-visible:border-foreground"
                        />
                    </div>
                    <div className="mt-4 space-y-2 w-full">
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
                            className="w-full focus-visible:border-foreground"
                        />
                    </div>
                    <div className="mt-4 space-y-2 w-full">
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
                            className="w-full focus-visible:border-foreground"
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
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="At least 14 characters"
                                className="w-full focus-visible:border-foreground"
                            />
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="absolute top-1 right-1"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ?
                                    <EyeOff className="w-4 h-4" /> :
                                    <Eye className="w-4 h-4" />
                                }
                            </Button>
                        </div>
                    </div>
                    <div className="mt-4 w-full">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full"
                        >
                            {isLoading ? (
                                <LoaderIcon className="w-5 h-5 animate-spin" />
                            ) : "Create account"}
                        </Button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-start gap-y-6 py-8 w-full px-0.5">
            <h2 className="text-2xl font-semibold">
                Create an account
            </h2>

            <form onSubmit={handleSendCode} className="w-full">
                <div className="space-y-2 w-full">
                    <Label htmlFor="email">
                        Email
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        disabled={isLoading}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full focus-visible:border-foreground"
                    />
                </div>
                <div className="mt-4 w-full">
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full"
                    >
                        {isLoading ? (
                            <LoaderIcon className="w-5 h-5 animate-spin" />
                        ) : "Continue"}
                    </Button>
                </div>
            </form>

            <div className="flex items-center gap-x-3 w-full">
                <div className="flex-1 border-t border-border/80" />
                <span className="text-xs text-muted-foreground">
                    Or continue with
                </span>
                <div className="flex-1 border-t border-border/80" />
            </div>

            <div className="grid grid-cols-3 gap-3 w-full">
                <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => handleSso("Google")}
                >
                    <Icons.google className="w-4 h-4" />
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => handleSso("GitHub")}
                >
                    <Github className="w-4 h-4" />
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => handleSso("GitLab")}
                >
                    <Gitlab className="w-4 h-4" />
                </Button>
            </div>
        </div>
    )
};

export default SignUpForm
