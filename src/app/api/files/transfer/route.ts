import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleAuthError } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { z } from "zod";

const transferSchema = z.object({
  receiverId: z.string().min(1, "Recipient user is required"),
  fileName: z.string().min(1, "File name is required"),
  fileSize: z.number().nonnegative().default(1024),
  protocol: z.enum(["FTP", "SFTP", "FTPS"]).default("SFTP"),
  port: z.number().int().default(22),
  note: z.string().max(300).optional().nullable(),
  fileContent: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parseResult = transferSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, message: "Invalid transfer parameters", errors: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { receiverId, fileName, fileSize, protocol, port, note, fileContent } = parseResult.data;

    // Verify recipient exists
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
      return NextResponse.json({ success: false, message: "Target recipient user not found" }, { status: 404 });
    }

    const receiverSettings = (receiver as any).securitySettings || {};
    const requiresApproval = Boolean(receiverSettings.requireTransferApproval);
    const initialStatus = requiresApproval ? "PENDING_APPROVAL" : "COMPLETED";

    // Create file transfer record
    const transfer = await prisma.fileTransfer.create({
      data: {
        senderId: user.id,
        senderName: user.name,
        senderUsername: user.username,
        receiverId: receiver.id,
        receiverName: receiver.name,
        receiverUsername: receiver.username,
        fileName,
        fileSize,
        protocol,
        port,
        status: initialStatus,
        note: note || `Direct ${protocol} transmission from ${user.name}`,
        fileContent: fileContent || "",
      },
    });

    // If recipient does NOT require manual approval, immediately store in their file pool
    if (!requiresApproval) {
      await prisma.file.create({
        data: {
          userId: receiver.id,
          name: `received_${fileName}`,
          size: fileSize,
          mimeType: "text/plain",
          category: "DATA",
          description: `Transferred via ${protocol} from @${user.username} (${user.name}). Note: ${note || "None"}`,
          content: fileContent || `// Transferred file: ${fileName}\n// Protocol: ${protocol} (Port ${port})\n// Sender: ${user.name} (@${user.username})\n// Timestamp: ${new Date().toISOString()}`,
        },
      });
    }

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await logActivity({
      userId: user.id,
      action: "SERVICE_UPDATED",
      entity: "SERVICE",
      entityId: transfer.id,
      description: `Dispatched ${protocol} transfer of ${fileName} to @${receiver.username}.`,
      ipAddress: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: `File transferred to @${receiver.username} via ${protocol} successfully!`,
      data: transfer,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
