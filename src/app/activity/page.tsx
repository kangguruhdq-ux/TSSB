import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { AppShell } from "@/components/layout/app-shell";
import { ActivityView } from "@/components/activity/activity-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activity Logs — TSSB Infrastructure Management",
  description: "Audit trail, security events, and operator activity records.",
};

export default async function ActivityPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/activity");
  }

  return (
    <AppShell user={user}>
      <ActivityView currentUser={user} />
    </AppShell>
  );
}
