import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { TicketsManagementView } from "@/components/tickets/tickets-management-view";

export const metadata: Metadata = {
  title: "Incident Reports & Tickets — TSSB",
  description: "Report bugs, infrastructure incidents, and communicate with system administrators.",
};

export default async function TicketsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <AppShell user={session}>
      <TicketsManagementView currentUser={session} />
    </AppShell>
  );
}
