import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleAuthError } from "@/lib/session";
import { documentationSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";
import { DocCategory } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category")?.toUpperCase();
    const serverId = searchParams.get("serverId");
    const search = searchParams.get("search")?.trim();

    const where: Record<string, unknown> = {};

    if (category && Object.values(DocCategory).includes(category as DocCategory)) {
      where.category = category as DocCategory;
    }

    if (serverId) {
      where.serverId = serverId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const docs = await prisma.documentation.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        server: {
          select: {
            id: true,
            name: true,
            hostname: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: docs,
    });
  } catch (error) {
    console.error("Docs GET error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load documentation" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parseResult = documentationSchema.safeParse(body);

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

    const data = parseResult.data;

    const doc = await prisma.documentation.create({
      data: {
        title: data.title,
        category: data.category,
        content: data.content,
        serverId: data.serverId || null,
        authorId: user.id,
      },
      include: {
        server: {
          select: { id: true, name: true, hostname: true },
        },
        author: {
          select: { id: true, name: true, username: true, avatarUrl: true },
        },
      },
    });

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await logActivity({
      userId: user.id,
      action: "DOCUMENTATION_CREATED",
      entity: "DOCUMENTATION",
      entityId: doc.id,
      description: `Authored documentation guide: "${doc.title}" [${doc.category}].`,
      ipAddress: clientIp,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Documentation article published successfully",
        data: doc,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}
