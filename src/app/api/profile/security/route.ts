import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleAuthError } from "@/lib/session";
import { verifyPassword, hashPassword } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const user = await prisma.user.findUnique({
      where: { id: session.id },
    });
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const defaultSettings = {
      requireTransferApproval: false,
      requireMailApproval: false,
      twoFactorEnabled: false,
    };

    return NextResponse.json({
      success: true,
      data: {
        securitySettings: { ...defaultSettings, ...((user as any).securitySettings || {}) },
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const user = await prisma.user.findUnique({
      where: { id: session.id },
    });
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const currentSettings = (user as any).securitySettings || {
      requireTransferApproval: false,
      requireMailApproval: false,
      twoFactorEnabled: false,
    };

    const updatedSettings = {
      ...currentSettings,
      ...(typeof body.requireTransferApproval === "boolean" ? { requireTransferApproval: body.requireTransferApproval } : {}),
      ...(typeof body.requireMailApproval === "boolean" ? { requireMailApproval: body.requireMailApproval } : {}),
      ...(typeof body.twoFactorEnabled === "boolean" ? { twoFactorEnabled: body.twoFactorEnabled } : {}),
    };

    await prisma.user.update({
      where: { id: session.id },
      data: { securitySettings: updatedSettings },
    });

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await logActivity({
      userId: session.id,
      action: "SECURITY_SETTINGS_UPDATED",
      entity: "USER",
      entityId: session.id,
      description: `User @${session.username} updated security quarantine & 2FA preferences.`,
      ipAddress: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: "Security preferences updated successfully",
      data: { securitySettings: updatedSettings },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const parseResult = changePasswordSchema.safeParse(body);
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

    const { currentPassword, newPassword } = parseResult.data;

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, username: true, passwordHash: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const isMatch = await verifyPassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Current password is incorrect" },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { success: false, message: "New password must be different from current password" },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: session.id },
      data: { passwordHash: newHash },
    });

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await logActivity({
      userId: session.id,
      action: "PASSWORD_CHANGED",
      entity: "USER",
      entityId: session.id,
      description: `User @${user.username} modified authentication credentials.`,
      ipAddress: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully. Your account is secured.",
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
