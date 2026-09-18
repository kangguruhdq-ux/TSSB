import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { AppShell } from "@/components/layout/app-shell";
import { ServiceManagementView } from "@/components/services/service-management-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services — TSSB Server Administration",
  description: "Monitor and configure active daemons, ports, and microservices.",
};

export default async function ServicesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/services");
  }

  return (
    <AppShell user={user}>
      <ServiceManagementView currentUser={user} />
    </AppShell>
  );
}
