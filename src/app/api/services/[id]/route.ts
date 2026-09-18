import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleAuthError } from "@/lib/session";
import { serviceSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        server: true,
        createdBy: {
          select: { id: true, name: true, username: true },
        },
      },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, message: "Service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error("Service GET by ID error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load service" },
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

    const parseResult = serviceSchema.partial().safeParse(body);
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

    const existing = await prisma.service.findUnique({
      where: { id },
      include: { server: true },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Service not found" },
        { status: 404 }
      );
    }

    const isStatusOnly = Object.keys(body).length === 1 && body.status !== undefined;
    if (!isStatusOnly && user.role !== "ADMIN" && existing.createdById !== user.id) {
      return NextResponse.json(
        { success: false, message: "Permission denied. Only administrators or the creator can reconfigure service parameters." },
        { status: 403 }
      );
    }

    const updated = await prisma.service.update({
      where: { id },
      data: parseResult.data,
      include: {
        server: {
          select: { id: true, name: true, hostname: true },
        },
      },
    });

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const hostName = (existing as any).server?.hostname || "server";
    await logActivity({
      userId: user.id,
      action: "SERVICE_UPDATED",
      entity: "SERVICE",
      entityId: id,
      description: `Updated service ${updated.name} on ${hostName}. Status: ${updated.status}.`,
      ipAddress: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: "Service updated successfully",
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

    const existing = await prisma.service.findUnique({
      where: { id },
      include: { server: true },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Service not found" },
        { status: 404 }
      );
    }

    if (user.role !== "ADMIN" && existing.createdById !== user.id) {
      return NextResponse.json(
        { success: false, message: "Permission denied. You can only delete services you created." },
        { status: 403 }
      );
    }

    await prisma.service.delete({ where: { id } });

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const hostName = (existing as any).server?.hostname || "server";
    await logActivity({
      userId: user.id,
      action: "SERVICE_DELETED",
      entity: "SERVICE",
      entityId: id,
      description: `Terminated service ${existing.name} (Port ${existing.port}) from ${hostName}.`,
      ipAddress: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: "Service removed successfully",
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
