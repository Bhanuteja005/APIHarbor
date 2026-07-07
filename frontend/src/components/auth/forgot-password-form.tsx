"use client";

import { sendRecoveryEmail } from "@/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoaderIcon, MailCheck } from "lucide-react";
import Link from "next/link";
import React, { useState } from 'react';
import { toast } from "sonner";
import { Label } from "../ui/label";

const ForgotPasswordForm = () => {

    const [email, setEmail] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSent, setIsSent] = useState<boolean>(false);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast.error("Email is required!");
            return;
        }

        setIsLoading(true);

        try {
            const result = await sendRecoveryEmail({ email });

            if (result.success) {
                setIsSent(true);
            } else {
                toast.error(result.error || "Couldn't send the recovery email. Please try again.");
            }
        } catch (error) {
            toast.error("An error occurred. Please try again");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSent) {
        return (
            <div className="mx-auto flex w-full max-w-sm flex-col items-center">
                <Card className="w-full border-border bg-card/80 p-6 backdrop-blur">
                    <CardHeader className="p-0 pb-4">
                        <MailCheck className="mb-2 h-8 w-8 text-foreground" />
                        <CardTitle className="bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-[1.65rem] font-medium text-transparent">
                            Check your email
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <p className="text-sm text-muted-foreground">
                            If an account exists for {email}, we&apos;ve sent it a recovery
                            link. Open the email and click <strong>Restore Access</strong> to
                            set a new password.
                        </p>
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
        );
    }

    return (
        <div className="mx-auto flex w-full max-w-sm flex-col items-center">
            <Card className="w-full border-border bg-card/80 p-6 backdrop-blur">
                <CardHeader className="p-0 pb-6">
                    <CardTitle className="bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-[1.65rem] font-medium text-transparent">
                        Recover your account
                    </CardTitle>
                    <p className="pt-1 text-sm text-muted-foreground">
                        Enter the email tied to your account and we&apos;ll send you a
                        recovery link to reset your password.
                    </p>
                </CardHeader>
                <CardContent className="p-0">
                    <form onSubmit={handleSend} className="w-full">
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
                                ) : "Send recovery email"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <div className="mt-6 flex flex-row items-center justify-center gap-1.5 text-sm">
                <span className="text-muted-foreground">Remembered your password?</span>
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

export default ForgotPasswordForm
