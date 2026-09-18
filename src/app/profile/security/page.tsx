import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { AppShell } from "@/components/layout/app-shell";
import { SecurityView } from "@/components/profile/security-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security & Credentials — TSSB Platform",
  description: "Update authentication credentials and configure security settings.",
};

export default async function SecurityPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/profile/security");
  }

  return (
    <AppShell user={user}>
      <SecurityView />
    </AppShell>
  );
}
