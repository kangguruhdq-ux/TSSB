import React, { Suspense } from "react";
import { AuthCardSwap } from "@/components/auth/auth-card-swap";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login — TSSB Server Administration & Infrastructure Management",
  description: "Secure interactive login portal for TSSB Platform.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080c14]" />}>
      <AuthCardSwap initialMode="login" />
    </Suspense>
  );
}
