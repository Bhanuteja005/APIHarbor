"use client";

import { acceptInvite } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, LoaderIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState } from 'react';
import { toast } from "sonner";
import { Label } from "../ui/label";

const AcceptInviteForm = () => {

    const router = useRouter();
    const searchParams = useSearchParams();

    const code = searchParams.get("token") || "";
    const email = searchParams.get("to") || "";
    const organizationId = searchParams.get("organization_id") || "";

    const [name, setName] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const isLinkValid = Boolean(code && email && organizationId);

    const handleAccept = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !password) {
            toast.error("Name and password are required!");
            return;
        }
        if (password.length < 14) {
            toast.error("Password must be at least 14 characters long.");
            return;
        }

        setIsLoading(true);

        try {
            const result = await acceptInvite({ email, organizationId, code, name, password });

            if ("success" in result && result.success) {
                router.push("/auth/auth-callback");
            } else {
                toast.error(("error" in result && result.error) || "Couldn't accept the invitation.");
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
                        Join your team
                    </CardTitle>
                    <p className="pt-1 text-sm text-muted-foreground">
                        {isLinkValid
                            ? `You've been invited to a workspace as ${email}. Set up your account to join.`
                            : "This invite link is invalid or incomplete. Ask your admin for a new invitation."}
                    </p>
                </CardHeader>
                <CardContent className="p-0">
                    {isLinkValid ? (
                        <form onSubmit={handleAccept} className="w-full">
                            <div className="w-full space-y-2">
                                <Label htmlFor="invite-name">
                                    Name
                                </Label>
                                <Input
                                    id="invite-name"
                                    type="text"
                                    value={name}
                                    disabled={isLoading}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="h-10 w-full focus-visible:border-foreground"
                                />
                            </div>
                            <div className="mt-4 w-full space-y-2">
                                <Label htmlFor="invite-password">
                                    Password
                                </Label>
                                <div className="relative w-full">
                                    <Input
                                        id="invite-password"
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
                            <div className="mt-6 w-full">
                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={isLoading}
                                    className="w-full"
                                >
                                    {isLoading ? (
                                        <LoaderIcon className="h-5 w-5 animate-spin" />
                                    ) : "Join workspace"}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <Link
                            href="/auth/sign-in"
                            className="flex h-10 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                            Back to log in
                        </Link>
                    )}
                </CardContent>
            </Card>
        </div>
    )
};

export default AcceptInviteForm
