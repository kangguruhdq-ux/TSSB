import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { ServerDetailView } from "@/components/servers/server-detail-view";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const server = await prisma.server.findUnique({
      where: { id },
      select: { name: true, hostname: true },
    });
    return {
      title: server
        ? `${server.name} (${server.hostname}) — TSSB Infrastructure`
        : "Server Details — TSSB",
    };
  } catch {
    return { title: "Server Details — TSSB" };
  }
}

export default async function ServerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/servers");
  }

  const { id } = await params;
  const server = await prisma.server.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: { id: true, name: true, username: true, role: true },
      },
      services: {
        orderBy: { port: "asc" },
      },
      networkConfigs: {
        orderBy: { interfaceName: "asc" },
      },
      documentation: {
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!server) {
    notFound();
  }

  return (
    <AppShell user={user}>
      <ServerDetailView server={server} currentUser={user} />
    </AppShell>
  );
}
