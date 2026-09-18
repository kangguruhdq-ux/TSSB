import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { TicketDetailView } from "@/components/tickets/ticket-detail-view";

export const metadata: Metadata = {
  title: "Incident Discussion Thread — TSSB",
  description: "Collaborative incident resolution and diagnostic conversation.",
};

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  return (
    <AppShell user={session}>
      <TicketDetailView ticketId={id} currentUser={session} />
    </AppShell>
  );
}
