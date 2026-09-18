import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = registerSchema.safeParse(body);

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

    const settings = await prisma.systemSettings.get();
    if (settings.allowRegistration === false) {
      return NextResponse.json(
        {
          success: false,
          message: "Pendaftaran operator baru saat ini ditutup oleh Administrator sistem.",
        },
        { status: 403 }
      );
    }

    const { name, username, email, password } = parseResult.data;
    const cleanUsername = username.toLowerCase().trim();
    const cleanEmail = email.toLowerCase().trim();

    // Check uniqueness
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { username: cleanUsername }],
      },
    });

    if (existingUser) {
      if (existingUser.email === cleanEmail) {
        return NextResponse.json(
          { success: false, message: "An account with this email address already exists." },
          { status: 409 }
        );
      }
      if (existingUser.username === cleanUsername) {
        return NextResponse.json(
          { success: false, message: "This username is already taken. Please choose another." },
          { status: 409 }
        );
      }
    }

    // Hash password with bcrypt
    const passwordHash = await hashPassword(password);

    // Create user strictly with role USER
    const newUser = await prisma.user.create({
      data: {
        name,
        username: cleanUsername,
        email: cleanEmail,
        passwordHash,
        role: "USER",
        status: "ACTIVE",
        avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      },
    });

    // Create session token and cookie
    const token = await createSessionToken({
      id: newUser.id,
      name: newUser.name,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      avatarUrl: newUser.avatarUrl,
    });

    await setSessionCookie(token, false);

    // Audit log
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await logActivity({
      userId: newUser.id,
      action: "USER_REGISTERED",
      entity: "USER",
      entityId: newUser.id,
      description: `New user account registered: @${newUser.username} (${newUser.email})`,
      ipAddress: clientIp,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Registration completed successfully",
        data: {
          id: newUser.id,
          name: newUser.name,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          avatarUrl: newUser.avatarUrl,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register route error:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred during account registration." },
      { status: 500 }
    );
  }
}
