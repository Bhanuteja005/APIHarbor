import { Toaster } from "@/components/ui/sonner";
import React from 'react';

interface Props {
    children: React.ReactNode
}

const AuthLayout = ({ children }: Props) => {
    return (
        <>
            <Toaster richColors theme="dark" position="top-right" />
            <main className="relative w-full">
                {children}
            </main>
        </>
    );
};

export default AuthLayout
