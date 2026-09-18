import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleAuthError } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { z } from "zod";

const createTicketSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(150),
  category: z.enum(["BUG", "SERVER_INCIDENT", "SECURITY", "FEATURE"]).default("BUG"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  description: z.string().min(5, "Description must be at least 5 characters").max(10000),
  imageUrl: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Admins see all tickets; standard operators only see tickets they created (Private Space)
    const tickets =
      user.role === "ADMIN"
        ? await prisma.ticket.findMany()
        : await prisma.ticket.findMany({ where: { authorId: user.id } });

    // Include statistics
    const stats = {
      total: tickets.length,
      open: tickets.filter((t: any) => t.status === "OPEN").length,
      inProgress: tickets.filter((t: any) => t.status === "IN_PROGRESS").length,
      resolved: tickets.filter((t: any) => t.status === "RESOLVED" || t.status === "CLOSED").length,
      urgent: tickets.filter((t: any) => t.priority === "URGENT" && t.status !== "CLOSED").length,
    };

    return NextResponse.json({
      success: true,
      data: {
        tickets,
        stats,
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
    const parseResult = createTicketSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, message: "Invalid ticket details", errors: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { title, category, priority, description, imageUrl } = parseResult.data;

    const ticket = await prisma.ticket.create({
      data: {
        title,
        category,
        priority,
        status: "OPEN",
        authorId: user.id,
        authorName: user.name,
        authorUsername: user.username,
        authorAvatar: user.avatarUrl || null,
        assignedTo: "System Administrator",
        description,
        imageUrl: imageUrl || null,
      },
    });

    // Also create the initial message in the conversation thread
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        authorId: user.id,
        authorName: user.name,
        authorUsername: user.username,
        authorRole: user.role,
        authorAvatar: user.avatarUrl || null,
        message: description,
        imageUrl: imageUrl || null,
      },
    });

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await logActivity({
      userId: user.id,
      action: "SERVICE_CREATED",
      entity: "SERVICE",
      entityId: ticket.id,
      description: `Opened support ticket #${ticket.id.slice(-6)}: "${title}" (Priority: ${priority}).`,
      ipAddress: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: "Ticket submitted to system administration successfully",
      data: ticket,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
