import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleAuthError } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { z } from "zod";

const createFileSchema = z.object({
  name: z.string().min(1, "File name is required").max(120),
  size: z.number().nonnegative().default(1024),
  mimeType: z.string().default("text/plain"),
  category: z.enum(["CONFIG", "ARCHIVE", "CERTIFICATE", "SCRIPT", "LOG", "DATA"]).default("DATA"),
  description: z.string().max(300).optional().nullable(),
  content: z.string().default(""),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Admins see all files, standard users see their own
    const files =
      user.role === "ADMIN"
        ? await prisma.file.findMany()
        : await prisma.file.findMany({ where: { userId: user.id } });

    // Fetch user transfers (both sent and received)
    const transfers = await prisma.fileTransfer.findMany({ where: { userId: user.id } });

    // Fetch all active users so users can select who to transfer to
    const allUsers = await prisma.user.findMany();
    const recipientUsers = allUsers
      .filter((u: any) => u.id !== user.id && u.status === "ACTIVE")
      .map((u: any) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        role: u.role,
        avatarUrl: u.avatarUrl,
      }));

    // Calculate storage efficiency metrics
    const totalBytesUsed = files.reduce((acc: number, f: any) => acc + (Number(f.size) || 0), 0);
    const quotaBytes = user.role === "ADMIN" ? 50 * 1024 * 1024 * 1024 : 10 * 1024 * 1024 * 1024; // 50GB admin, 10GB user

    return NextResponse.json({
      success: true,
      data: {
        files,
        transfers,
        recipientUsers,
        storage: {
          usedBytes: totalBytesUsed,
          quotaBytes,
          percentUsed: Math.min(100, (totalBytesUsed / quotaBytes) * 100).toFixed(1),
          fileCount: files.length,
        },
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parseResult = createFileSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, message: "Invalid file specifications", errors: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, size, mimeType, category, description, content } = parseResult.data;

    const file = await prisma.file.create({
      data: {
        userId: user.id,
        name,
        size,
        mimeType,
        category,
        description: description || null,
        content: content || `// File: ${name}\n// Uploaded to TSSB FTP storage on ${new Date().toISOString()}`,
      },
    });

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await logActivity({
      userId: user.id,
      action: "SERVICE_CREATED",
      entity: "SERVICE",
      entityId: file.id,
      description: `Uploaded file ${name} (${(size / 1024).toFixed(1)} KB) to FTP cluster storage.`,
      ipAddress: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: "File stored in cluster FTP pool successfully",
      data: file,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
