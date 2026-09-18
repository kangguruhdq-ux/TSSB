import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleAuthError } from "@/lib/session";
import { logActivity } from "@/lib/activity";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.mailMessage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Email not found" }, { status: 404 });
    }

    if (existing.recipientId !== user.id && existing.senderId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 403 });
    }

    const dataToUpdate: any = {};
    if (typeof body.isRead === "boolean") dataToUpdate.isRead = body.isRead;
    if (typeof body.isTrash === "boolean") dataToUpdate.isTrash = body.isTrash;

    // Quarantine Accept / Reject actions
    if (body.action === "ACCEPT") {
      dataToUpdate.status = "DELIVERED";
      dataToUpdate.isRead = false;
    } else if (body.action === "REJECT") {
      dataToUpdate.status = "REJECTED";
      dataToUpdate.isTrash = true;
    }

    const updated = await prisma.mailMessage.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({
      success: true,
      message: body.action === "ACCEPT"
        ? "Email accepted from quarantine and placed in Inbox"
        : body.action === "REJECT"
        ? "Quarantined email rejected and moved to trash"
        : "Message state updated",
      data: updated,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const existing = await prisma.mailMessage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Email not found" }, { status: 404 });
    }

    if (existing.recipientId !== user.id && existing.senderId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    await prisma.mailMessage.delete({ where: { id } });

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await logActivity({
      userId: user.id,
      action: "SERVICE_DELETED",
      entity: "SERVICE",
      entityId: id,
      description: `Purged email "${existing.subject}" to reclaim mailbox storage.`,
      ipAddress: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: "Message permanently purged from mailbox storage",
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
