import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleAuthError } from "@/lib/session";
import { profileSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireAuth();
    const user = await prisma.user.findUnique({
      where: { id: session.id },
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
        _count: {
          select: {
            servers: true,
            documentation: true,
            activityLogs: true,
          },
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

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const parseResult = profileSchema.safeParse(body);
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

    const { name, username, email, bio, avatarUrl } = parseResult.data;
    const cleanUsername = username.toLowerCase().trim();
    const cleanEmail = email.toLowerCase().trim();

    // Check conflict only if email or username is modified
    if (cleanEmail !== session.email.toLowerCase()) {
      const emailConflict = await prisma.user.findFirst({
        where: {
          id: { not: session.id },
          email: cleanEmail,
        },
      });
      if (emailConflict) {
        return NextResponse.json(
          { success: false, message: "Email is already in use by another user." },
          { status: 409 }
        );
      }
    }

    if (cleanUsername !== (session.username || "").toLowerCase()) {
      const usernameConflict = await prisma.user.findFirst({
        where: {
          id: { not: session.id },
          username: cleanUsername,
        },
      });
      if (usernameConflict) {
        return NextResponse.json(
          { success: false, message: "Username is already in use by another user." },
          { status: 409 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: {
        name,
        username: cleanUsername,
        email: cleanEmail,
        bio: bio ?? null,
        avatarUrl: avatarUrl || null,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        status: true,
        bio: true,
        avatarUrl: true,
        updatedAt: true,
      },
    });

    // Re-issue updated session JWT cookie so user changes immediately reflect across entire app
    const token = await createSessionToken({
      id: updatedUser.id,
      name: updatedUser.name,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status,
      avatarUrl: updatedUser.avatarUrl,
    });
    await setSessionCookie(token, true);

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await logActivity({
      userId: session.id,
      action: "USER_UPDATED",
      entity: "USER",
      entityId: session.id,
      description: `User @${updatedUser.username} updated profile information.`,
      ipAddress: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
