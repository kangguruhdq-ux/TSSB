import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { AppShell } from "@/components/layout/app-shell";
import { AdminSettingsView } from "@/components/admin/admin-settings-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings — TSSB Admin",
  description: "Configure system parameters, verify database health, and view environment telemetry.",
};

export default async function AdminSettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/admin/settings");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard?error=forbidden");
  }

  return (
    <AppShell user={user}>
      <AdminSettingsView />
    </AppShell>
  );
}
