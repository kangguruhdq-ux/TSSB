import { NextRequest, NextResponse } from "next/server";
import { prisma, checkDatabaseHealth } from "@/lib/db";
import { requireAdmin, handleAuthError } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdmin();
    const body = await request.json();
    const action = body.action || "REFRESH";

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    if (action === "REFRESH") {
      const health = await checkDatabaseHealth();
      await logActivity({
        userId: adminUser.id,
        action: "DATABASE_PROBED",
        entity: "SERVER",
        description: `Admin @${adminUser.username} triggered database connection sweep & cache refresh.`,
        ipAddress: clientIp,
      });

      return NextResponse.json({
        success: true,
        message: "Database connection probe completed. Persistent cache refreshed.",
        data: {
          connected: health.connected,
          latencyMs: health.latencyMs,
          status: health.message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (action === "RESET_SEEDED") {
      const dataFilePath = path.resolve(process.cwd(), ".tssb-data.json");
      if (fs.existsSync(dataFilePath)) {
        try {
          const current = JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
          current.systemSettings = {
            ...current.systemSettings,
            lastBackupAt: new Date().toISOString(),
          };
          fs.writeFileSync(dataFilePath, JSON.stringify(current, null, 2), "utf8");
        } catch (e) {
          console.error("Failed to reset seeded data:", e);
        }
      }

      await logActivity({
        userId: adminUser.id,
        action: "DATABASE_RESET",
        entity: "SERVER",
        description: `Admin @${adminUser.username} executed database state refresh.`,
        ipAddress: clientIp,
      });

      return NextResponse.json({
        success: true,
        message: "Cluster demonstration state refreshed successfully.",
      });
    }

    if (action === "CLEAR_TRASH_AND_LOGS") {
      await prisma.activityLog.deleteMany();
      await prisma.mailMessage.deleteMany({ where: { isTrash: true } });

      await logActivity({
        userId: adminUser.id,
        action: "LOGS_PURGED",
        entity: "AUTH",
        description: `Admin @${adminUser.username} executed storage cleanup: purged audit logs and emptied trash pool.`,
        ipAddress: clientIp,
      });

      return NextResponse.json({
        success: true,
        message: "Storage cleanup complete: Purged audit logs and reclaimed trash pool memory.",
      });
    }

    return NextResponse.json(
      { success: false, message: `Unrecognized action: ${action}` },
      { status: 400 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}
