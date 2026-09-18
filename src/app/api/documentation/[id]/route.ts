import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleAuthError } from "@/lib/session";
import { documentationSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await prisma.documentation.findUnique({
      where: { id },
      include: {
        server: true,
        author: {
          select: { id: true, name: true, username: true, role: true, avatarUrl: true },
        },
      },
    });

    if (!doc) {
      return NextResponse.json(
        { success: false, message: "Documentation guide not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: doc,
    });
  } catch (error) {
    console.error("Documentation GET by ID error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load documentation article" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const parseResult = documentationSchema.partial().safeParse(body);
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

    const existing = await prisma.documentation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Documentation article not found" },
        { status: 404 }
      );
    }

    if (user.role !== "ADMIN" && existing.authorId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Permission denied. You can only edit guides you authored." },
        { status: 403 }
      );
    }

    const updated = await prisma.documentation.update({
      where: { id },
      data: parseResult.data,
      include: {
        server: true,
        author: {
          select: { id: true, name: true, username: true, avatarUrl: true },
        },
      },
    });

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await logActivity({
      userId: user.id,
      action: "DOCUMENTATION_UPDATED",
      entity: "DOCUMENTATION",
      entityId: id,
      description: `Updated documentation article: "${updated.title}".`,
      ipAddress: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: "Documentation guide updated successfully",
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
    const user = await requireAuth();
    const { id } = await params;

    const existing = await prisma.documentation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Documentation article not found" },
        { status: 404 }
      );
    }

    if (user.role !== "ADMIN" && existing.authorId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Permission denied. You can only delete guides you authored." },
        { status: 403 }
      );
    }

    await prisma.documentation.delete({ where: { id } });

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await logActivity({
      userId: user.id,
      action: "DOCUMENTATION_DELETED",
      entity: "DOCUMENTATION",
      entityId: id,
      description: `Removed documentation article: "${existing.title}".`,
      ipAddress: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: "Documentation article deleted successfully",
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
