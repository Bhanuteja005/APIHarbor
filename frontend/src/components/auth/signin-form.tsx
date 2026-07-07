"use client";

import { login, verifyMfa } from "@/actions";
import { Icons } from "@/components/global/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Github, Gitlab, LoaderIcon } from "lucide-react";
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";
import { Label } from "../ui/label";

const SignInForm = () => {

    const router = useRouter();

    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [mfaMethod, setMfaMethod] = useState<string | null>(null);
    const [mfaCode, setMfaCode] = useState<string>("");

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
        toast.info(`${provider} sign-in isn't configured yet. Use email and password.`);
    };

    if (mfaMethod) {
        return (
            <div className="flex flex-col items-start gap-y-6 py-8 w-full px-0.5">
                <h2 className="text-2xl font-semibold">
                    Two-factor authentication
                </h2>
                <p className="text-sm text-muted-foreground -mt-3">
                    {mfaMethod === "totp"
                        ? "Enter the 6-digit code from your authenticator app."
                        : "Enter the 6-digit code we just sent to your email."}
                </p>
                <form onSubmit={handleVerifyMfa} className="w-full">
                    <div className="space-y-2 w-full pl-0.5">
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
                    <div className="mt-4 w-full">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full"
                        >
                            {isLoading ? (
                                <LoaderIcon className="w-5 h-5 animate-spin" />
                            ) : "Verify and sign in"}
                        </Button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-start gap-y-6 py-8 w-full px-0.5">
            <h2 className="text-2xl font-semibold">
                Sign in to APIHarbor
            </h2>

            <form onSubmit={handleSignIn} className="w-full">
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
                <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">
                            Password
                        </Label>
                        <button
                            type="button"
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => toast.info("Account recovery is coming soon.")}
                        >
                            Forgot password?
                        </button>
                    </div>
                    <div className="relative w-full">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            disabled={isLoading}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="w-full focus-visible:border-foreground"
                        />
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            disabled={isLoading}
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
                        ) : "Sign in with email"}
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

export default SignInForm
