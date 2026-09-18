import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = loginSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid login parameters",
          errors: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { identifier, password, rememberMe } = parseResult.data;

    // Search user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase().trim() },
          { username: identifier.toLowerCase().trim() },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials. Please verify your email/username and password." },
        { status: 401 }
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, message: "This account has been deactivated. Please contact an administrator." },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials. Please verify your email/username and password." },
        { status: 401 }
      );
    }

    // Check system maintenance and login suspension policies
    const settings = await prisma.systemSettings.get();
    const isMaintenance = Boolean(settings.maintenanceMode || (settings as any).loginSuspended);
    if (isMaintenance && user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message:
            (settings as any).loginSuspensionMessage ||
            "Akses login pengguna saat ini ditangguhkan sementara oleh Administrator untuk pemeliharaan sistem. Silakan coba lagi nanti.",
        },
        { status: 403 }
      );
    }

    // Generate JWT token
    const token = await createSessionToken(
      {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        avatarUrl: user.avatarUrl,
      },
      rememberMe
    );

    // Set HTTP-only secure cookie
    await setSessionCookie(token, rememberMe);

    // Audit log
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await logActivity({
      userId: user.id,
      action: "USER_LOGIN",
      entity: "AUTH",
      entityId: user.id,
      description: `User ${user.username} logged in successfully via swap-card portal.`,
      ipAddress: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: "Authentication successful",
      data: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected authentication error occurred." },
      { status: 500 }
    );
  }
}
