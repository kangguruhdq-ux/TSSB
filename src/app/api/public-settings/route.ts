import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const settings = await prisma.systemSettings.get();
    return NextResponse.json({
      success: true,
      data: {
        platformName: settings.platformName || "TSSB Infrastructure Platform",
        allowRegistration: settings.allowRegistration !== false,
        maintenanceMode: Boolean(settings.maintenanceMode),
        loginSuspended: Boolean((settings as any).loginSuspended),
        loginSuspensionMessage: (settings as any).loginSuspensionMessage || "Akses login pengguna saat ini ditangguhkan sementara untuk pemeliharaan sistem.",
        announcementText: settings.announcementText,
        showAnnouncement: Boolean(settings.showAnnouncement),
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: true,
      data: {
        platformName: "TSSB Infrastructure Platform",
        allowRegistration: true,
        maintenanceMode: false,
        loginSuspended: false,
        loginSuspensionMessage: "",
      },
    });
  }
}
