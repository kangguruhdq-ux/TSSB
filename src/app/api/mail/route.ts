import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleAuthError } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { z } from "zod";

const attachmentSchema = z.object({
  fileName: z.string(),
  fileSize: z.number().default(0),
  fileType: z.string().default("text/plain"),
  content: z.string().optional(),
});

const sendMailSchema = z.object({
  recipientId: z.string().min(1, "Recipient is required"),
  subject: z.string().min(1, "Subject is required").max(150),
  body: z.string().min(1, "Message body cannot be empty").max(10000),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  hasAttachment: z.boolean().default(false),
  attachmentName: z.string().optional().nullable(),
  attachments: z.array(attachmentSchema).optional().default([]),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Inbound messages (Inbox & Quarantined)
    const allInbound = await prisma.mailMessage.findMany({
      where: { recipientId: user.id },
    });

    const inbox = allInbound.filter((m: any) => m.status !== "PENDING_APPROVAL" && !m.isTrash);
    const quarantined = allInbound.filter((m: any) => m.status === "PENDING_APPROVAL");
    const trash = allInbound.filter((m: any) => m.isTrash);

    // Outbound messages (Sent)
    const sent = await prisma.mailMessage.findMany({
      where: { senderId: user.id },
    });

    // All active users for recipient picker
    const allUsers = await prisma.user.findMany();
    const potentialRecipients = allUsers
      .filter((u: any) => u.id !== user.id && u.status === "ACTIVE")
      .map((u: any) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        role: u.role,
        avatarUrl: u.avatarUrl,
      }));

    // Files owned by user that can be attached
    const userFiles = await prisma.file.findMany({
      where: { userId: user.id },
    });

    // Calculate mailbox storage size
    let storageBytes = 0;
    allInbound.forEach((m: any) => {
      storageBytes += (m.body?.length || 0) + (m.subject?.length || 0) * 2 + 512;
      if (Array.isArray(m.attachments)) {
        m.attachments.forEach((a: any) => {
          storageBytes += Number(a.fileSize) || 1024;
        });
      }
    });
    sent.forEach((m: any) => {
      storageBytes += (m.body?.length || 0) + 256;
    });

    const quotaBytes = 500 * 1024 * 1024; // 500MB mailbox quota

    return NextResponse.json({
      success: true,
      data: {
        inbox,
        quarantined,
        trash,
        sent,
        recipients: potentialRecipients,
        availableAttachments: userFiles.map((f: any) => ({ id: f.id, name: f.name, size: f.size, content: f.content })),
        unreadCount: inbox.filter((m: any) => !m.isRead).length,
        quarantineCount: quarantined.length,
        storage: {
          usedBytes: storageBytes,
          quotaBytes,
          percentUsed: Math.min(100, (storageBytes / quotaBytes) * 100).toFixed(2),
        },
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parseResult = sendMailSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, message: "Invalid email parameters", errors: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { recipientId, subject, body: mailBody, priority, hasAttachment, attachmentName, attachments } = parseResult.data;

    // Verify recipient exists
    const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
    if (!recipient) {
      return NextResponse.json({ success: false, message: "Recipient user not found" }, { status: 404 });
    }

    const recipientSettings = (recipient as any).securitySettings || {};
    const requiresApproval = Boolean(recipientSettings.requireMailApproval);
    const initialStatus = requiresApproval ? "PENDING_APPROVAL" : "DELIVERED";

    const finalAttachments = attachments && attachments.length > 0 ? attachments : (
      hasAttachment && attachmentName ? [{ fileName: attachmentName, fileSize: 1024, fileType: "text/plain" }] : []
    );

    const message = await prisma.mailMessage.create({
      data: {
        senderId: user.id,
        senderName: user.name,
        senderEmail: user.email,
        recipientId: recipient.id,
        recipientName: recipient.name,
        recipientEmail: recipient.email,
        subject,
        body: mailBody,
        priority,
        status: initialStatus,
        hasAttachment: finalAttachments.length > 0,
        attachmentName: finalAttachments.length > 0 ? finalAttachments[0].fileName : null,
        attachments: finalAttachments,
      },
    });

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await logActivity({
      userId: user.id,
      action: "SERVICE_CREATED",
      entity: "SERVICE",
      entityId: message.id,
      description: `Dispatched email "${subject}" to ${recipient.email} (Status: ${initialStatus}).`,
      ipAddress: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: requiresApproval
        ? `Email dispatched to ${recipient.name} and placed in Quarantine pending recipient authorization.`
        : `Email successfully delivered to ${recipient.name} (${recipient.email})!`,
      data: message,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "empty_trash") {
      // Reclaim mailbox storage by permanently purging all trash messages
      const deleted = await prisma.mailMessage.deleteMany({
        where: {
          recipientId: user.id,
          isTrash: true,
        },
      });

      const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
      await logActivity({
        userId: user.id,
        action: "SERVICE_DELETED",
        entity: "SERVICE",
        entityId: user.id,
        description: `Emptied mail trash and reclaimed mailbox storage.`,
        ipAddress: clientIp,
      });

      return NextResponse.json({
        success: true,
        message: "Trash emptied. Mailbox storage reclaimed successfully!",
        data: deleted,
      });
    }

    return NextResponse.json({ success: false, message: "Specify action=empty_trash" }, { status: 400 });
  } catch (error) {
    return handleAuthError(error);
  }
}
