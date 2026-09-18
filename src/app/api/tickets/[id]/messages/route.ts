import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleAuthError } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { z } from "zod";

const createMessageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(10000),
  imageUrl: z.string().optional().nullable(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const parseResult = createMessageSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, message: "Invalid message payload", errors: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      return NextResponse.json({ success: false, message: "Ticket not found" }, { status: 404 });
    }

    if (user.role !== "ADMIN" && ticket.authorId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Access forbidden: you do not have access to this conversation." },
        { status: 403 }
      );
    }

    const { message, imageUrl } = parseResult.data;

    const newMessage = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        authorId: user.id,
        authorName: user.name,
        authorUsername: user.username,
        authorRole: user.role,
        authorAvatar: user.avatarUrl || null,
        message,
        imageUrl: imageUrl || null,
      },
    });

    // If ticket was CLOSED and author sends a message, reopen as IN_PROGRESS
    if (ticket.status === "CLOSED" || ticket.status === "RESOLVED") {
      await prisma.ticket.update({
        where: { id },
        data: { status: "IN_PROGRESS" },
      });
    }

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await logActivity({
      userId: user.id,
      action: "SERVICE_UPDATED",
      entity: "SERVICE",
      entityId: id,
      description: `Posted reply in ticket #${id.slice(-6)}.`,
      ipAddress: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: "Message dispatched to conversation thread",
      data: newMessage,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
