import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleAuthError } from "@/lib/session";
import { logActivity } from "@/lib/activity";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const existing = await prisma.file.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: "File not found" }, { status: 404 });
    }

    if (user.role !== "ADMIN" && existing.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Permission denied. You can only delete your own files." },
        { status: 403 }
      );
    }

    await prisma.file.delete({ where: { id } });

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await logActivity({
      userId: user.id,
      action: "SERVICE_DELETED",
      entity: "SERVICE",
      entityId: id,
      description: `Purged file ${existing.name} from FTP storage pool.`,
      ipAddress: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: "File purged from cluster storage successfully",
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
