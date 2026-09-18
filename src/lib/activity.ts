import { prisma } from "@/lib/db";

interface LogActivityParams {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  description: string;
  ipAddress?: string | null;
}

export async function logActivity({
  userId,
  action,
  entity,
  entityId,
  description,
  ipAddress,
}: LogActivityParams): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId: userId ?? null,
        action,
        entity,
        entityId: entityId ?? null,
        description,
        ipAddress: ipAddress ?? null,
      },
    });
  } catch (err) {
    // Non-blocking log catch to preserve primary transaction
    console.error("Failed to record activity log:", err);
  }
}
