import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, handleAuthError } from "@/lib/session";
import { hashPassword } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { Role, UserStatus } from "@prisma/client";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(2, "Full name is required").max(60),
  username: z.string().min(3, "Username must be at least 3 characters").max(30).regex(/^[a-zA-Z0-9_-]+$/, "Alphanumeric only"),
  email: z.string().email("Valid email required").max(100),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  role: z.enum(["ADMIN", "USER"]).default("USER"),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).default("ACTIVE"),
  bio: z.string().max(300).optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const role = searchParams.get("role")?.toUpperCase();
    const status = searchParams.get("status")?.toUpperCase();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (role && Object.values(Role).includes(role as Role)) {
      where.role = role as Role;
    }

    if (status && Object.values(UserStatus).includes(status as UserStatus)) {
      where.status = status as UserStatus;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
          status: true,
          avatarUrl: true,
          bio: true,
          createdAt: true,
          _count: {
            select: {
              servers: true,
              documentation: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdmin();
    const body = await request.json();
    const parseResult = createUserSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, message: "Invalid user details", errors: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, username, email, password, role, status, bio } = parseResult.data;

    // Check unique
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: email.toLowerCase().trim() }, { username: username.toLowerCase().trim() }],
      },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "User with this email or username already exists in auth realm." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const newUser = await prisma.user.create({
      data: {
        name,
        username: username.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: role as Role,
        status: status as UserStatus,
        bio: bio || `Provisioned by Administrator ${adminUser.name}`,
        avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      },
    });

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await logActivity({
      userId: adminUser.id,
      action: "USER_REGISTERED",
      entity: "USER",
      entityId: newUser.id,
      description: `Admin created operator account @${newUser.username} (${newUser.email}) with role ${newUser.role}.`,
      ipAddress: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: `User account @${newUser.username} provisioned successfully`,
      data: {
        id: newUser.id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
