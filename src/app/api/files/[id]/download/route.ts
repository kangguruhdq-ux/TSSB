import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleAuthError } from "@/lib/session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const file = await prisma.file.findUnique({ where: { id } });
    if (!file) {
      return NextResponse.json({ success: false, message: "File not found" }, { status: 404 });
    }

    if (user.role !== "ADMIN" && file.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Access forbidden: you do not own this storage object." },
        { status: 403 }
      );
    }

    const content = file.content || "";
    const mimeType = file.mimeType || "application/octet-stream";

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.name)}"`,
        "Content-Length": Buffer.byteLength(content, "utf-8").toString(),
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
