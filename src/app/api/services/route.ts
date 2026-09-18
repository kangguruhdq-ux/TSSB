import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleAuthError } from "@/lib/session";
import { serviceSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";
import { ServiceStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get("serverId");
    const status = searchParams.get("status")?.toUpperCase();
    const search = searchParams.get("search")?.trim();

    const where: Record<string, unknown> = {};

    if (serverId) {
      where.serverId = serverId;
    }

    if (status && Object.values(ServiceStatus).includes(status as ServiceStatus)) {
      where.status = status as ServiceStatus;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { protocol: { contains: search, mode: "insensitive" } },
        { version: { contains: search, mode: "insensitive" } },
        { server: { hostname: { contains: search, mode: "insensitive" } } },
      ];
    }

    const services = await prisma.service.findMany({
      where,
      orderBy: { port: "asc" },
      include: {
        server: {
          select: {
            id: true,
            name: true,
            hostname: true,
            ipAddress: true,
            status: true,
          },
        },
        createdBy: {
          select: { id: true, name: true, username: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error("Services GET error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve services" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parseResult = serviceSchema.safeParse(body);

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

    const data = parseResult.data;

    // Verify parent server exists
    const server = await prisma.server.findUnique({
      where: { id: data.serverId },
    });
    if (!server) {
      return NextResponse.json(
        { success: false, message: "Selected server does not exist." },
        { status: 404 }
      );
    }

    const service = await prisma.service.create({
      data: {
        name: data.name,
        serverId: data.serverId,
        port: data.port,
        protocol: data.protocol,
        version: data.version ?? null,
        status: data.status,
        description: data.description ?? null,
        createdById: user.id,
      },
      include: {
        server: {
          select: { id: true, name: true, hostname: true, ipAddress: true },
        },
      },
    });

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await logActivity({
      userId: user.id,
      action: "SERVICE_CREATED",
      entity: "SERVICE",
      entityId: service.id,
      description: `Deployed service ${service.name} (Port ${service.port}/${service.protocol}) on ${server.hostname}.`,
      ipAddress: clientIp,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Service created successfully",
        data: service,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}
