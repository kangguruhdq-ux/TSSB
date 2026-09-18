import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleAuthError } from "@/lib/session";
import { networkSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get("serverId");
    const search = searchParams.get("search")?.trim();

    const where: Record<string, unknown> = {};

    if (serverId) {
      where.serverId = serverId;
    }

    if (search) {
      where.OR = [
        { interfaceName: { contains: search, mode: "insensitive" } },
        { ipAddress: { contains: search, mode: "insensitive" } },
        { gateway: { contains: search, mode: "insensitive" } },
        { subnetMask: { contains: search, mode: "insensitive" } },
        { server: { hostname: { contains: search, mode: "insensitive" } } },
      ];
    }

    const configs = await prisma.networkConfiguration.findMany({
      where,
      orderBy: { createdAt: "desc" },
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
      data: configs,
    });
  } catch (error) {
    console.error("Network GET error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load network configurations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parseResult = networkSchema.safeParse(body);

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

    const networkConfig = await prisma.networkConfiguration.create({
      data: {
        serverId: data.serverId,
        interfaceName: data.interfaceName,
        ipAddress: data.ipAddress,
        subnetMask: data.subnetMask,
        gateway: data.gateway,
        dnsPrimary: data.dnsPrimary,
        dnsSecondary: data.dnsSecondary ?? null,
        vlan: data.vlan ?? null,
        description: data.description ?? null,
        createdById: user.id,
      },
      include: {
        server: {
          select: { id: true, name: true, hostname: true },
        },
      },
    });

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await logActivity({
      userId: user.id,
      action: "NETWORK_CREATED",
      entity: "NETWORK",
      entityId: networkConfig.id,
      description: `Configured interface ${networkConfig.interfaceName} (${networkConfig.ipAddress}) on ${server.hostname}.`,
      ipAddress: clientIp,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Network configuration added successfully",
        data: networkConfig,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}
