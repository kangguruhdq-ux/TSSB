import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { AppShell } from "@/components/layout/app-shell";
import { ServerManagementView } from "@/components/servers/server-management-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Servers — TSSB Server Administration",
  description: "Server cluster provisioning, lifecycle management, and telemetry.",
};

export default async function ServersPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/servers");
  }

  return (
    <AppShell user={user}>
      <ServerManagementView currentUser={user} />
    </AppShell>
  );
}
