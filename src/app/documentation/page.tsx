import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { AppShell } from "@/components/layout/app-shell";
import { DocManagementView } from "@/components/documentation/doc-management-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation — TSSB Server Administration",
  description: "Operational runbooks, server setup guides, and troubleshooting procedures.",
};

export default async function DocumentationPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/documentation");
  }

  return (
    <AppShell user={user}>
      <DocManagementView currentUser={user} />
    </AppShell>
  );
}
