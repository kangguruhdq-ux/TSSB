import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, handleAuthError } from "@/lib/session";
import { logActivity } from "@/lib/activity";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const settings = await prisma.systemSettings.get();
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminUser = await requireAdmin();
    const body = await request.json();

    const updated = await prisma.systemSettings.update({
      data: {
        platformName: body.platformName,
        maintenanceMode: Boolean(body.maintenanceMode),
        allowRegistration: Boolean(body.allowRegistration),
        loginSuspended: Boolean(body.loginSuspended),
        loginSuspensionMessage: body.loginSuspensionMessage || "Akses login pengguna saat ini ditangguhkan sementara oleh Administrator untuk pemeliharaan sistem. Silakan coba lagi nanti.",
        sessionTimeoutMinutes: Number(body.sessionTimeoutMinutes) || 60,
        announcementText: body.announcementText,
        showAnnouncement: Boolean(body.showAnnouncement),
        ftpPort: Number(body.ftpPort) || 21,
        smtpPort: Number(body.smtpPort) || 587,
        storageQuotaDefaultMb: Number(body.storageQuotaDefaultMb) || 10240,
      },
    });

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await logActivity({
      userId: adminUser.id,
      action: "USER_UPDATED",
      entity: "AUTH",
      entityId: "settings",
      description: `Admin updated platform settings: Maintenance=${updated.maintenanceMode}, Registration=${updated.allowRegistration}.`,
      ipAddress: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: "System configuration updated successfully",
      data: updated,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
