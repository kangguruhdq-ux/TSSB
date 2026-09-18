import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/db";
import { requireAdmin, handleAuthError } from "@/lib/session";

export async function GET() {
  try {
    await requireAdmin();

    const dbHealth = await checkDatabaseHealth();

    const healthData = {
      system: {
        status: dbHealth.connected ? "OPERATIONAL" : "DEGRADED",
        platform: "TSSB Infrastructure Platform",
        version: "v1.0.0-prod",
        runtime: "Next.js App Router (Node.js " + process.version + ")",
        deploymentTarget: "Vercel / Neon PostgreSQL",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
      database: {
        status: dbHealth.connected ? "CONNECTED" : "UNAVAILABLE",
        provider: "PostgreSQL (Neon)",
        latencyMs: dbHealth.latencyMs,
        message: dbHealth.message,
        poolerConfigured: Boolean(process.env.DATABASE_URL),
        directUrlConfigured: Boolean(process.env.DIRECT_URL),
      },
      security: {
        sessionAuth: "JWT / HttpOnly Secure Cookies",
        hashingAlgorithm: "bcrypt (10 rounds)",
        rbacEnforced: true,
        secretsConfigured: {
          databaseUrl: Boolean(process.env.DATABASE_URL),
          authSecret: Boolean(process.env.AUTH_SECRET),
          nextAuthUrl: Boolean(process.env.NEXTAUTH_URL),
        },
      },
    };

    return NextResponse.json({
      success: true,
      data: healthData,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
