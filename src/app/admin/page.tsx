import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { AppShell } from "@/components/layout/app-shell";
import { AdminDashboardView } from "@/components/admin/admin-dashboard-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Control Center — TSSB Infrastructure",
  description: "Administrative oversight, user management, and platform telemetry.",
};

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/admin");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard?error=forbidden");
  }

  return (
    <AppShell user={user}>
      <AdminDashboardView />
    </AppShell>
  );
}
