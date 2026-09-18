import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/session";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const dataPath = path.join(process.cwd(), ".tssb-data.json");
    let content = "{}";
    if (fs.existsSync(dataPath)) {
      content = fs.readFileSync(dataPath, "utf-8");
    }

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="tssb-backup-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
