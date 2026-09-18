import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { ProfileView } from "@/components/profile/profile-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile — TSSB Server Administration",
  description: "Manage your user profile, biography, and credentials.",
};

export default async function ProfilePage() {
  const session = await getCurrentUser();
  if (!session) {
    redirect("/login?redirect=/profile");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      _count: {
        select: {
          servers: true,
          documentation: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell user={session}>
      <ProfileView initialUser={user} />
    </AppShell>
  );
}
