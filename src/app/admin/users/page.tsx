import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { AppShell } from "@/components/layout/app-shell";
import { AdminUsersView } from "@/components/admin/admin-users-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Management — TSSB Admin",
  description: "Manage system operators, assign IAM roles, and configure account statuses.",
};

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/admin/users");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard?error=forbidden");
  }

  return (
    <AppShell user={user}>
      <AdminUsersView currentUser={user} />
    </AppShell>
  );
}
