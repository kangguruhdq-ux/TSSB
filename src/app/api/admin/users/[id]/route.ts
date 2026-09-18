import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, handleAuthError } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { Role, UserStatus } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        status: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        servers: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            hostname: true,
            status: true,
            serverType: true,
          },
        },
        documentation: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            category: true,
            createdAt: true,
          },
        },
        activityLogs: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // Security guard: Admin cannot change their own role or deactivate themselves
    if (targetUser.id === adminUser.id) {
      if (body.role && body.role !== "ADMIN") {
        return NextResponse.json(
          { success: false, message: "Security restriction: You cannot demote your own administrator account." },
          { status: 400 }
        );
      }
      if (body.status && body.status !== "ACTIVE") {
        return NextResponse.json(
          { success: false, message: "Security restriction: You cannot deactivate your own administrator account." },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (body.role && Object.values(Role).includes(body.role)) {
      updateData.role = body.role as Role;
    }
    if (body.status && Object.values(UserStatus).includes(body.status)) {
      updateData.status = body.status as UserStatus;
    }
    if (body.name) updateData.name = body.name.trim();
    if (body.email) updateData.email = body.email.toLowerCase().trim();
    if (body.bio !== undefined) updateData.bio = body.bio;

    if (body.newPassword && body.newPassword.length >= 6) {
      const { hashPassword } = await import("@/lib/auth");
      updateData.passwordHash = await hashPassword(body.newPassword);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        status: true,
      },
    });

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await logActivity({
      userId: adminUser.id,
      action: "USER_UPDATED",
      entity: "USER",
      entityId: id,
      description: `Admin updated @${updated.username}: Role=${updated.role}, Status=${updated.status}.`,
      ipAddress: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: "User account updated successfully",
      data: updated,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdmin();
    const { id } = await params;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // Security guard: Admin cannot delete themselves
    if (targetUser.id === adminUser.id) {
      return NextResponse.json(
        { success: false, message: "Security restriction: You cannot delete your own administrator account." },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id } });

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await logActivity({
      userId: adminUser.id,
      action: "USER_DELETED",
      entity: "USER",
      entityId: id,
      description: `Admin deleted user account @${targetUser.username} (${targetUser.email}).`,
      ipAddress: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: "User account deleted successfully",
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
