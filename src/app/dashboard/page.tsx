import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — TSSB Infrastructure Management",
  description: "Real-time system overview, server telemetry, and network topology.",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  return (
    <AppShell user={user}>
      <DashboardView initialUser={user} />
    </AppShell>
  );
}
