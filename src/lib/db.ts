import { PrismaClient } from "@prisma/client";
import { fallbackStore } from "./store";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const rawPrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = rawPrisma;
}

function hasConfiguredDatabase(): boolean {
  const dbUrl = process.env.DATABASE_URL || "";
  return (
    Boolean(dbUrl) &&
    !dbUrl.includes("demo_password") &&
    !dbUrl.includes("ep-sample") &&
    !dbUrl.includes("sample-pooler")
  );
}

async function exec<T>(prismaFn: () => Promise<T>, fallbackFn: () => Promise<any>): Promise<T> {
  if (hasConfiguredDatabase()) {
    try {
      return await prismaFn();
    } catch (err: any) {
      // If error is database connection/network related, fall back gracefully
      if (
        err?.name === "PrismaClientInitializationError" ||
        err?.code === "P1001" ||
        err?.code === "P1002" ||
        err?.code === "P1003" ||
        err?.code === "P1017" ||
        err?.message?.includes("Can't reach database") ||
        err?.message?.includes("connection closed") ||
        err?.message?.includes("Connection refused") ||
        err?.message?.includes("timed out")
      ) {
        console.warn("[Database] Connection unavailable, falling back to local store:", err?.message || err);
        return await fallbackFn();
      }
      throw err;
    }
  }

  return await fallbackFn();
}

export const prisma = {
  user: {
    findFirst: (args?: any) => exec(() => rawPrisma.user.findFirst(args), () => fallbackStore.user.findFirst(args)),
    findUnique: (args: any) => exec(() => rawPrisma.user.findUnique(args), () => fallbackStore.user.findUnique(args)),
    findMany: (args?: any) => exec(() => rawPrisma.user.findMany(args), () => fallbackStore.user.findMany(args)),
    create: (args: any) => exec(() => rawPrisma.user.create(args), () => fallbackStore.user.create(args)),
    update: (args: any) => exec(() => rawPrisma.user.update(args), () => fallbackStore.user.update(args)),
    delete: (args: any) => exec(() => rawPrisma.user.delete(args), () => fallbackStore.user.delete(args)),
    count: (args?: any) => exec(() => rawPrisma.user.count(args), () => fallbackStore.user.count(args)),
  },
  server: {
    findFirst: (args?: any) => exec(() => rawPrisma.server.findFirst(args), () => fallbackStore.server.findFirst(args)),
    findUnique: (args: any) => exec(() => rawPrisma.server.findUnique(args), () => fallbackStore.server.findUnique(args)),
    findMany: (args?: any) => exec(() => rawPrisma.server.findMany(args), () => fallbackStore.server.findMany(args)),
    create: (args: any) => exec(() => rawPrisma.server.create(args), () => fallbackStore.server.create(args)),
    update: (args: any) => exec(() => rawPrisma.server.update(args), () => fallbackStore.server.update(args)),
    delete: (args: any) => exec(() => rawPrisma.server.delete(args), () => fallbackStore.server.delete(args)),
    count: (args?: any) => exec(() => rawPrisma.server.count(args), () => fallbackStore.server.count(args)),
  },
  service: {
    findFirst: (args?: any) => exec(() => rawPrisma.service.findFirst(args), () => fallbackStore.service.findMany(args).then(r => r[0] || null)),
    findUnique: (args: any) => exec(() => rawPrisma.service.findUnique(args), () => fallbackStore.service.findUnique(args)),
    findMany: (args?: any) => exec(() => rawPrisma.service.findMany(args), () => fallbackStore.service.findMany(args)),
    create: (args: any) => exec(() => rawPrisma.service.create(args), () => fallbackStore.service.create(args)),
    update: (args: any) => exec(() => rawPrisma.service.update(args), () => fallbackStore.service.update(args)),
    delete: (args: any) => exec(() => rawPrisma.service.delete(args), () => fallbackStore.service.delete(args)),
    count: (args?: any) => exec(() => rawPrisma.service.count(args), () => fallbackStore.service.count(args)),
  },
  networkConfiguration: {
    findFirst: (args?: any) => exec(() => rawPrisma.networkConfiguration.findFirst(args), () => fallbackStore.networkConfiguration.findMany(args).then(r => r[0] || null)),
    findUnique: (args: any) => exec(() => rawPrisma.networkConfiguration.findUnique(args), () => fallbackStore.networkConfiguration.findUnique(args)),
    findMany: (args?: any) => exec(() => rawPrisma.networkConfiguration.findMany(args), () => fallbackStore.networkConfiguration.findMany(args)),
    create: (args: any) => exec(() => rawPrisma.networkConfiguration.create(args), () => fallbackStore.networkConfiguration.create(args)),
    update: (args: any) => exec(() => rawPrisma.networkConfiguration.update(args), () => fallbackStore.networkConfiguration.update(args)),
    delete: (args: any) => exec(() => rawPrisma.networkConfiguration.delete(args), () => fallbackStore.networkConfiguration.delete(args)),
    count: (args?: any) => exec(() => rawPrisma.networkConfiguration.count(args), () => fallbackStore.networkConfiguration.findMany(args).then(r => r.length)),
  },
  documentation: {
    findFirst: (args?: any) => exec(() => rawPrisma.documentation.findFirst(args), () => fallbackStore.documentation.findMany(args).then(r => r[0] || null)),
    findUnique: (args: any) => exec(() => rawPrisma.documentation.findUnique(args), () => fallbackStore.documentation.findUnique(args)),
    findMany: (args?: any) => exec(() => rawPrisma.documentation.findMany(args), () => fallbackStore.documentation.findMany(args)),
    create: (args: any) => exec(() => rawPrisma.documentation.create(args), () => fallbackStore.documentation.create(args)),
    update: (args: any) => exec(() => rawPrisma.documentation.update(args), () => fallbackStore.documentation.update(args)),
    delete: (args: any) => exec(() => rawPrisma.documentation.delete(args), () => fallbackStore.documentation.delete(args)),
    count: (args?: any) => exec(() => rawPrisma.documentation.count(args), () => fallbackStore.documentation.count()),
  },
  activityLog: {
    findMany: (args?: any) => exec(() => rawPrisma.activityLog.findMany(args), () => fallbackStore.activityLog.findMany(args)),
    create: (args: any) => exec(() => rawPrisma.activityLog.create(args), () => fallbackStore.activityLog.create(args)),
    count: (args?: any) => exec(() => rawPrisma.activityLog.count(args), () => fallbackStore.activityLog.count()),
    deleteMany: () => exec(() => rawPrisma.activityLog.deleteMany(), () => fallbackStore.activityLog.deleteMany()),
  },
  file: {
    findFirst: (args?: any) => exec(() => rawPrisma.file.findFirst(args), () => fallbackStore.file.findFirst(args)),
    findUnique: (args: any) => exec(() => rawPrisma.file.findUnique(args), () => fallbackStore.file.findUnique(args)),
    findMany: (args?: any) => exec(() => rawPrisma.file.findMany({ ...args, orderBy: args?.orderBy || { createdAt: "desc" } }), () => fallbackStore.file.findMany(args)),
    create: (args: any) => exec(() => rawPrisma.file.create(args), () => fallbackStore.file.create(args)),
    delete: (args: any) => exec(() => rawPrisma.file.delete(args), () => fallbackStore.file.delete(args)),
  },
  fileTransfer: {
    findFirst: (args?: any) => exec(() => rawPrisma.fileTransfer.findFirst(args), () => fallbackStore.fileTransfer.findFirst(args)),
    findUnique: (args: any) => exec(() => rawPrisma.fileTransfer.findUnique(args), () => fallbackStore.fileTransfer.findUnique(args)),
    findMany: (args?: any) =>
      exec(() => {
        let finalArgs = args ? { ...args } : {};
        if (finalArgs.where?.userId) {
          const { userId, ...restWhere } = finalArgs.where;
          finalArgs.where = {
            ...restWhere,
            OR: [{ senderId: userId }, { receiverId: userId }],
          };
        }
        return rawPrisma.fileTransfer.findMany({
          ...finalArgs,
          orderBy: finalArgs.orderBy || { transferredAt: "desc" },
        });
      }, () => fallbackStore.fileTransfer.findMany(args)),
    create: (args: any) => exec(() => rawPrisma.fileTransfer.create(args), () => fallbackStore.fileTransfer.create(args)),
    update: (args: any) => exec(() => rawPrisma.fileTransfer.update(args), () => fallbackStore.fileTransfer.update(args)),
    delete: (args: any) => exec(() => rawPrisma.fileTransfer.delete(args), () => fallbackStore.fileTransfer.delete(args)),
  },
  mailMessage: {
    findFirst: (args?: any) => exec(() => rawPrisma.mailMessage.findFirst(args), () => fallbackStore.mailMessage.findFirst(args)),
    findUnique: (args: any) => exec(() => rawPrisma.mailMessage.findUnique(args), () => fallbackStore.mailMessage.findUnique(args)),
    findMany: (args?: any) =>
      exec(() => {
        let finalArgs = args ? { ...args } : {};
        if (finalArgs.where?.userId) {
          const { userId, ...restWhere } = finalArgs.where;
          finalArgs.where = {
            ...restWhere,
            OR: [{ senderId: userId }, { recipientId: userId }],
          };
        }
        return rawPrisma.mailMessage.findMany({
          ...finalArgs,
          orderBy: finalArgs.orderBy || { sentAt: "desc" },
        });
      }, () => fallbackStore.mailMessage.findMany(args)),
    create: (args: any) => exec(() => rawPrisma.mailMessage.create(args), () => fallbackStore.mailMessage.create(args)),
    update: (args: any) => exec(() => rawPrisma.mailMessage.update(args), () => fallbackStore.mailMessage.update(args)),
    delete: (args: any) => exec(() => rawPrisma.mailMessage.delete(args), () => fallbackStore.mailMessage.delete(args)),
    deleteMany: (args?: any) => exec(() => rawPrisma.mailMessage.deleteMany(args), () => fallbackStore.mailMessage.deleteMany(args)),
  },
  systemSettings: {
    get: async () =>
      exec(
        async () => {
          let settings = await rawPrisma.systemSettings.findUnique({
            where: { id: "default" },
          });
          if (!settings) {
            settings = await rawPrisma.systemSettings.create({
              data: { id: "default" },
            });
          }
          return settings;
        },
        () => fallbackStore.systemSettings.get()
      ),
    update: async (args: any) =>
      exec(
        async () => {
          const updateData = { ...args.data };
          if (updateData.lastBackupAt && typeof updateData.lastBackupAt === "string") {
            updateData.lastBackupAt = new Date(updateData.lastBackupAt);
          }
          return await rawPrisma.systemSettings.upsert({
            where: { id: "default" },
            create: { id: "default", ...updateData },
            update: updateData,
          });
        },
        () => fallbackStore.systemSettings.update(args)
      ),
  },
  ticket: {
    findFirst: (args?: any) => exec(() => rawPrisma.ticket.findFirst(args), () => fallbackStore.ticket.findFirst(args)),
    findUnique: (args: any) => exec(() => rawPrisma.ticket.findUnique(args), () => fallbackStore.ticket.findUnique(args)),
    findMany: (args?: any) =>
      exec(
        () =>
          rawPrisma.ticket.findMany({
            ...args,
            orderBy: args?.orderBy || { createdAt: "desc" },
          }),
        () => fallbackStore.ticket.findMany(args)
      ),
    create: (args: any) => exec(() => rawPrisma.ticket.create(args), () => fallbackStore.ticket.create(args)),
    update: (args: any) => exec(() => rawPrisma.ticket.update(args), () => fallbackStore.ticket.update(args)),
    delete: (args: any) => exec(() => rawPrisma.ticket.delete(args), () => fallbackStore.ticket.delete(args)),
    count: (args?: any) => exec(() => rawPrisma.ticket.count(args), () => fallbackStore.ticket.findMany(args).then(r => r.length)),
  },
  ticketMessage: {
    findMany: (args?: any) =>
      exec(
        () =>
          rawPrisma.ticketMessage.findMany({
            ...args,
            orderBy: args?.orderBy || { createdAt: "asc" },
          }),
        () => fallbackStore.ticketMessage.findMany(args)
      ),
    create: (args: any) => exec(() => rawPrisma.ticketMessage.create(args), () => fallbackStore.ticketMessage.create(args)),
  },
  $queryRaw: rawPrisma.$queryRaw.bind(rawPrisma),
  $disconnect: rawPrisma.$disconnect.bind(rawPrisma),
};

export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  latencyMs: number;
  message: string;
}> {
  if (!hasConfiguredDatabase()) {
    return {
      connected: false,
      latencyMs: 1,
      message: "Local persistent database active (Configure live Neon PostgreSQL in .env for production deployment)",
    };
  }

  const start = Date.now();
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Health check timeout")), 8000)
    );
    await Promise.race([rawPrisma.$queryRaw`SELECT 1`, timeoutPromise]);
    const latencyMs = Date.now() - start;

    return {
      connected: true,
      latencyMs,
      message: "Connected to Neon PostgreSQL cloud instance",
    };
  } catch (err: any) {
    return {
      connected: false,
      latencyMs: Date.now() - start,
      message: `Database connection probe timeout: ${err?.message || "unreachable"}`,
    };
  }
}

