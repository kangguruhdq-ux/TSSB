import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleAuthError } from "@/lib/session";
import { networkSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const config = await prisma.networkConfiguration.findUnique({
      where: { id },
      include: {
        server: true,
        createdBy: {
          select: { id: true, name: true, username: true },
        },
      },
    });

    if (!config) {
      return NextResponse.json(
        { success: false, message: "Network configuration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error("Network GET by ID error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load network configuration" },
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

    const parseResult = networkSchema.partial().safeParse(body);
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

    const existing = await prisma.networkConfiguration.findUnique({
      where: { id },
      include: { server: true },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Network configuration not found" },
        { status: 404 }
      );
    }

    const isStatusOnly = Object.keys(body).length === 1 && body.status !== undefined;
    if (!isStatusOnly && user.role !== "ADMIN" && existing.createdById !== user.id) {
      return NextResponse.json(
        { success: false, message: "Permission denied. Only administrators or the creator can modify network interface parameters." },
        { status: 403 }
      );
    }

    const updated = await prisma.networkConfiguration.update({
      where: { id },
      data: parseResult.data,
      include: {
        server: {
          select: { id: true, name: true, hostname: true },
        },
      },
    });

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const hostName = (existing as any).server?.hostname || "host";
    await logActivity({
      userId: user.id,
      action: "NETWORK_UPDATED",
      entity: "NETWORK",
      entityId: id,
      description: `Updated network interface ${updated.interfaceName} (${updated.ipAddress}) on ${hostName}.`,
      ipAddress: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: "Network configuration updated successfully",
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

    const existing = await prisma.networkConfiguration.findUnique({
      where: { id },
      include: { server: true },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Network configuration not found" },
        { status: 404 }
      );
    }

    if (user.role !== "ADMIN" && existing.createdById !== user.id) {
      return NextResponse.json(
        { success: false, message: "Permission denied. You can only remove network settings you configured." },
        { status: 403 }
      );
    }

    await prisma.networkConfiguration.delete({ where: { id } });

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const hostName = (existing as any).server?.hostname || "server";
    await logActivity({
      userId: user.id,
      action: "NETWORK_DELETED",
      entity: "NETWORK",
      entityId: id,
      description: `Removed interface ${existing.interfaceName} from ${hostName}.`,
      ipAddress: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: "Network configuration deleted successfully",
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
