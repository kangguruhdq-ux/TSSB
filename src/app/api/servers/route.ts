import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleAuthError } from "@/lib/session";
import { serverSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";
import { ServerStatus, ServerType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status")?.toUpperCase();
    const type = searchParams.get("type")?.toUpperCase();

    const where: Record<string, unknown> = {};

    if (status && Object.values(ServerStatus).includes(status as ServerStatus)) {
      where.status = status as ServerStatus;
    }

    if (type && Object.values(ServerType).includes(type as ServerType)) {
      where.serverType = type as ServerType;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { hostname: { contains: search, mode: "insensitive" } },
        { ipAddress: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { operatingSystem: { contains: search, mode: "insensitive" } },
      ];
    }

    const servers = await prisma.server.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            services: true,
            networkConfigs: true,
            documentation: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: servers,
    });
  } catch (error) {
    console.error("Servers GET error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve servers from database" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parseResult = serverSchema.safeParse(body);

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

    const serverData = parseResult.data;

    // Check hostname uniqueness
    const existing = await prisma.server.findFirst({
      where: { hostname: serverData.hostname.trim() },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "A server with this hostname already exists." },
        { status: 409 }
      );
    }

    const server = await prisma.server.create({
      data: {
        name: serverData.name,
        hostname: serverData.hostname,
        ipAddress: serverData.ipAddress,
        operatingSystem: serverData.operatingSystem,
        serverType: serverData.serverType,
        location: serverData.location,
        status: serverData.status,
        description: serverData.description ?? null,
        createdById: user.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, username: true },
        },
      },
    });

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await logActivity({
      userId: user.id,
      action: "SERVER_CREATED",
      entity: "SERVER",
      entityId: server.id,
      description: `Provisioned server ${server.name} (${server.hostname}) at IP ${server.ipAddress}.`,
      ipAddress: clientIp,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Server created successfully",
        data: server,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}
