import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, handleAuthError } from "@/lib/session";

export async function GET() {
  try {
    await requireAdmin();

    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalServers,
      onlineServers,
      offlineServers,
      maintenanceServers,
      totalServices,
      activeServices,
      totalDocumentation,
      totalActivityLogs,
      recentActivities,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { status: "INACTIVE" } }),
      prisma.server.count(),
      prisma.server.count({ where: { status: "ONLINE" } }),
      prisma.server.count({ where: { status: "OFFLINE" } }),
      prisma.server.count({ where: { status: "MAINTENANCE" } }),
      prisma.service.count(),
      prisma.service.count({ where: { status: "ACTIVE" } }),
      prisma.documentation.count(),
      prisma.activityLog.count(),
      prisma.activityLog.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { username: true, role: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        totalServers,
        onlineServers,
        offlineServers,
        maintenanceServers,
        totalServices,
        activeServices,
        totalDocumentation,
        totalActivityLogs,
        recentActivities,
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
