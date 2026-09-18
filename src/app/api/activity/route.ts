import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleAuthError } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const entity = searchParams.get("entity")?.toUpperCase();
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

    const where: Record<string, unknown> = {};

    // Standard user can only view their own activity logs
    if (user.role !== "ADMIN") {
      where.userId = user.id;
    }

    if (entity) {
      where.entity = entity;
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { ipAddress: { contains: search, mode: "insensitive" } },
      ];
    }

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Permission denied: Only administrators can purge activity logs." },
        { status: 403 }
      );
    }

    const res = await prisma.activityLog.deleteMany();

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "LOGS_PURGED",
        entity: "AUTH",
        description: `Admin @${user.username} purged all activity logs. Reclaimed audit trail storage.`,
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully cleared ${(res as any)?.count || 0} activity records.`,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

