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
    const { action } = body; // "ACCEPT" | "REJECT"

    if (action !== "ACCEPT" && action !== "REJECT") {
      return NextResponse.json(
        { success: false, message: "Invalid action. Must be ACCEPT or REJECT." },
        { status: 400 }
      );
    }

    const transfer = await prisma.fileTransfer.findUnique({ where: { id } });
    if (!transfer) {
      return NextResponse.json({ success: false, message: "Transfer record not found" }, { status: 404 });
    }

    if (user.role !== "ADMIN" && transfer.receiverId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Access forbidden: you are not the designated recipient." },
        { status: 403 }
      );
    }

    if (transfer.status === "COMPLETED" && action === "ACCEPT") {
      return NextResponse.json(
        { success: false, message: "Transfer is already accepted and stored." },
        { status: 400 }
      );
    }

    if (action === "ACCEPT") {
      // 1. Update transfer status
      await prisma.fileTransfer.update({
        where: { id },
        data: { status: "COMPLETED" },
      });

      // 2. Create the file in recipient's personal vault
      await prisma.file.create({
        data: {
          userId: transfer.receiverId,
          name: `received_${transfer.fileName}`,
          size: transfer.fileSize,
          mimeType: "text/plain",
          category: "DATA",
          description: `Transferred via ${transfer.protocol} from ${transfer.senderName} (@${transfer.senderUsername}). Accepted from Quarantine. Note: ${transfer.note || "None"}`,
          content:
            transfer.fileContent ||
            `// Transferred file: ${transfer.fileName}\n// Protocol: ${transfer.protocol}\n// Sender: ${transfer.senderName}\n// Accepted: ${new Date().toISOString()}`,
        },
      });

      const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
      await logActivity({
        userId: user.id,
        action: "SERVICE_UPDATED",
        entity: "SERVICE",
        entityId: id,
        description: `Accepted inbound file transfer "${transfer.fileName}" from @${transfer.senderUsername}.`,
        ipAddress: clientIp,
      });

      return NextResponse.json({
        success: true,
        message: `Transfer approved! "${transfer.fileName}" has been stored into your personal file vault.`,
      });
    } else {
      // REJECT
      await prisma.fileTransfer.update({
        where: { id },
        data: { status: "REJECTED" },
      });

      const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
      await logActivity({
        userId: user.id,
        action: "SERVICE_UPDATED",
        entity: "SERVICE",
        entityId: id,
        description: `Rejected inbound file transfer "${transfer.fileName}" from @${transfer.senderUsername}.`,
        ipAddress: clientIp,
      });

      return NextResponse.json({
        success: true,
        message: `Transfer rejected and discarded from ingestion queue.`,
      });
    }
  } catch (error) {
    return handleAuthError(error);
  }
}
