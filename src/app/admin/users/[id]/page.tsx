import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { AdminUserDetailView } from "@/components/admin/admin-user-detail-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Inspection — TSSB Admin",
  description: "Detailed operator telemetry and access governance.",
};

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login?redirect=/admin/users");
  }

  if (currentUser.role !== "ADMIN") {
    redirect("/dashboard?error=forbidden");
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      status: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
      servers: {
        take: 10,
        orderBy: { createdAt: "desc" },
      },
      documentation: {
        take: 10,
        orderBy: { createdAt: "desc" },
      },
      activityLogs: {
        take: 20,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <AppShell user={currentUser}>
      <AdminUserDetailView user={user} />
    </AppShell>
  );
}
