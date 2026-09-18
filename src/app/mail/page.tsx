import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { WebmailView } from "@/components/mail/webmail-view";

export const metadata: Metadata = {
  title: "Internal Webmail — TSSB",
  description: "Postfix SMTP & Dovecot IMAP messaging platform between operators.",
};

export default async function MailPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <AppShell user={session}>
      <WebmailView currentUser={session} />
    </AppShell>
  );
}
