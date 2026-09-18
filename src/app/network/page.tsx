import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { AppShell } from "@/components/layout/app-shell";
import { NetworkManagementView } from "@/components/network/network-management-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Network — TSSB Infrastructure Management",
  description: "Network configuration, IP subnets, VLAN topology, and DNS routing.",
};

export default async function NetworkPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/network");
  }

  return (
    <AppShell user={user}>
      <NetworkManagementView currentUser={user} />
    </AppShell>
  );
}
