import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    if (user) {
      const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
      await logActivity({
        userId: user.id,
        action: "USER_LOGOUT",
        entity: "AUTH",
        entityId: user.id,
        description: `User @${user.username} logged out of session.`,
        ipAddress: clientIp,
      });
    }

    await clearSessionCookie();

    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout route error:", error);
    return NextResponse.json(
      { success: false, message: "Error terminating session" },
      { status: 500 }
    );
  }
}
