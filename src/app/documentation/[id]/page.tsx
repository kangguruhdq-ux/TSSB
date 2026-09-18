import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { DocDetailView } from "@/components/documentation/doc-detail-view";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const doc = await prisma.documentation.findUnique({
      where: { id },
      select: { title: true },
    });
    return {
      title: doc ? `${doc.title} — TSSB Documentation` : "Runbook — TSSB",
    };
  } catch {
    return { title: "Runbook — TSSB" };
  }
}

export default async function DocDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/documentation");
  }

  const { id } = await params;
  const doc = await prisma.documentation.findUnique({
    where: { id },
    include: {
      server: true,
      author: {
        select: { id: true, name: true, username: true, avatarUrl: true },
      },
    },
  });

  if (!doc) {
    notFound();
  }

  return (
    <AppShell user={user}>
      <DocDetailView doc={doc} currentUser={user} />
    </AppShell>
  );
}
