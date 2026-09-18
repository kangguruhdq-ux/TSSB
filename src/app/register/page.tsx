import React, { Suspense } from "react";
import { AuthCardSwap } from "@/components/auth/auth-card-swap";
import { Metadata } from "next";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Register — TSSB Server Administration & Infrastructure Management",
  description: "Account registration for TSSB Platform.",
};

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const settings = await prisma.systemSettings.get();
  if (settings && settings.allowRegistration === false) {
    redirect("/login?notice=registration_closed");
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080c14]" />}>
      <AuthCardSwap initialMode="register" allowRegistrationInitial={true} />
    </Suspense>
  );
}
