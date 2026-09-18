import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleAuthError } from "@/lib/session";
import { logActivity } from "@/lib/activity";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      return NextResponse.json({ success: false, message: "Ticket not found" }, { status: 404 });
    }

    // Role-based privacy: standard operators can only access tickets they authored
    if (user.role !== "ADMIN" && ticket.authorId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Access forbidden: you do not have permission to view this ticket." },
        { status: 403 }
      );
    }

    const messages = await prisma.ticketMessage.findMany({ where: { ticketId: id } });

    return NextResponse.json({
      success: true,
      data: {
        ticket,
        messages,
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.ticket.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Ticket not found" }, { status: 404 });
    }

    if (user.role !== "ADMIN" && existing.authorId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Access forbidden: you do not have permission to modify this ticket." },
        { status: 403 }
      );
    }

    const dataToUpdate: any = {};
    if (body.status) dataToUpdate.status = body.status;
    if (body.priority) dataToUpdate.priority = body.priority;
    if (body.assignedTo && user.role === "ADMIN") dataToUpdate.assignedTo = body.assignedTo;

    const updated = await prisma.ticket.update({
      where: { id },
      data: dataToUpdate,
    });

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await logActivity({
      userId: user.id,
      action: "SERVICE_UPDATED",
      entity: "SERVICE",
      entityId: id,
      description: `Updated ticket #${id.slice(-6)} status to ${updated.status}.`,
      ipAddress: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: "Ticket status updated successfully",
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

    const existing = await prisma.ticket.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Ticket not found" }, { status: 404 });
    }

    // Only ticket author or Admin can delete
    if (user.role !== "ADMIN" && existing.authorId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Permission denied. You can only delete tickets you authored." },
        { status: 403 }
      );
    }

    await prisma.ticket.delete({ where: { id } });

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await logActivity({
      userId: user.id,
      action: "SERVICE_DELETED",
      entity: "SERVICE",
      entityId: id,
      description: `Deleted support ticket #${id.slice(-6)}: "${existing.title}".`,
      ipAddress: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: "Ticket permanently removed from support registry",
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
