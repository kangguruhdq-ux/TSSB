import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleAuthError } from "@/lib/session";
import { serverSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
          select: {
            id: true,
            title: true,
            category: true,
            updatedAt: true,
            author: {
              select: { name: true, username: true },
            },
          },
        },
      },
    });

    if (!server) {
      return NextResponse.json(
        { success: false, message: "Server not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: server,
    });
  } catch (error) {
    console.error("Server GET by ID error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load server details" },
      { status: 500 }
    );
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

    const parseResult = serverSchema.partial().safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const existing = await prisma.server.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Server not found" },
        { status: 404 }
      );
    }

    // Role or ownership check: Admin can edit any server, operators can toggle status
    const isStatusOnly = Object.keys(body).length === 1 && body.status !== undefined;
    if (!isStatusOnly && user.role !== "ADMIN" && existing.createdById !== user.id) {
      return NextResponse.json(
        { success: false, message: "Permission denied. Only administrators or the creator can reconfigure server hardware specifications." },
        { status: 403 }
      );
    }

    const updated = await prisma.server.update({
      where: { id },
      data: parseResult.data,
      include: {
        createdBy: {
          select: { id: true, name: true, username: true },
        },
      },
    });

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await logActivity({
      userId: user.id,
      action: "SERVER_UPDATED",
      entity: "SERVER",
      entityId: id,
      description: `Updated server ${updated.name} (${updated.hostname}). Status: ${updated.status}.`,
      ipAddress: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: "Server updated successfully",
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

    const existing = await prisma.server.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Server not found" },
        { status: 404 }
      );
    }

    // Role or ownership check
    if (user.role !== "ADMIN" && existing.createdById !== user.id) {
      return NextResponse.json(
        { success: false, message: "Permission denied. You can only delete servers you registered." },
        { status: 403 }
      );
    }

    await prisma.server.delete({ where: { id } });

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await logActivity({
      userId: user.id,
      action: "SERVER_DELETED",
      entity: "SERVER",
      entityId: id,
      description: `Decommissioned server ${existing.name} (${existing.hostname}).`,
      ipAddress: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: "Server deleted successfully",
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
