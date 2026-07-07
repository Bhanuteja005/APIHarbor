"use client";

import { resetPasswordWithCode } from "@/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, LoaderIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState } from 'react';
import { toast } from "sonner";
import { Label } from "../ui/label";

const ResetPasswordForm = () => {

    const router = useRouter();
    const searchParams = useSearchParams();

    const token = searchParams.get("token") || "";
    const email = searchParams.get("to") || "";

    const [password, setPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const isLinkValid = Boolean(token && email);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!password) {
            toast.error("New password is required!");
            return;
        }

        if (password.length < 14) {
            toast.error("Password must be at least 14 characters long.");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords don't match.");
            return;
        }

        setIsLoading(true);

        try {
            const result = await resetPasswordWithCode({ email, code: token, newPassword: password });

            if (result.success) {
                toast.success("Password updated. Log in with your new password.");
                router.push("/auth/sign-in");
            } else {
                toast.error(result.error || "Couldn't reset your password. Please try again.");
                setIsLoading(false);
            }
        } catch (error) {
            toast.error("An error occurred. Please try again");
            setIsLoading(false);
        }
    };

    return (
        <div className="mx-auto flex w-full max-w-sm flex-col items-center">
            <Card className="w-full border-border bg-card/80 p-6 backdrop-blur">
                <CardHeader className="p-0 pb-6">
                    <CardTitle className="bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-[1.65rem] font-medium text-transparent">
                        Set a new password
                    </CardTitle>
                    <p className="pt-1 text-sm text-muted-foreground">
                        {isLinkValid
                            ? `Choose a new password for ${email}.`
                            : "This recovery link is invalid or incomplete. Request a new one below."}
                    </p>
                </CardHeader>
                <CardContent className="p-0">
                    {isLinkValid ? (
                        <form onSubmit={handleReset} className="w-full">
                            <div className="w-full space-y-2">
                                <Label htmlFor="new-password">
                                    New password
                                </Label>
                                <div className="relative w-full">
                                    <Input
                                        id="new-password"
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
                            <div className="mt-4 w-full space-y-2">
                                <Label htmlFor="confirm-password">
                                    Confirm new password
                                </Label>
                                <Input
                                    id="confirm-password"
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    disabled={isLoading}
                                    autoComplete="new-password"
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repeat your new password"
                                    className="h-10 w-full focus-visible:border-foreground"
                                />
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
                                    ) : "Reset password"}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <Link
                            href="/auth/forgot-password"
                            className="flex h-10 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                            Request a new recovery link
                        </Link>
                    )}
                </CardContent>
            </Card>

            <div className="mt-6 flex flex-row items-center justify-center gap-1.5 text-sm">
                <Link
                    href="/auth/sign-in"
                    className="cursor-pointer text-foreground/95 underline decoration-foreground/60 underline-offset-2 transition-colors duration-200 hover:decoration-foreground"
                >
                    Back to log in
                </Link>
            </div>
        </div>
    )
};

export default ResetPasswordForm
