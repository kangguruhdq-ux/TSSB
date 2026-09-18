import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { FilesManagementView } from "@/components/files/files-management-view";

export const metadata: Metadata = {
  title: "FTP & Cluster File Storage — TSSB",
  description: "vsftpd service management, inter-user file transfers, and cluster file storage.",
};

export default async function FilesPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <AppShell user={session}>
      <FilesManagementView currentUser={session} />
    </AppShell>
  );
}
