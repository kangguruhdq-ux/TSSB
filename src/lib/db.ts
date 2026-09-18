import { PrismaClient } from "@prisma/client";
import { fallbackStore } from "./store";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  dbStatus: boolean | undefined;
};

const rawPrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = rawPrisma;
}

// Track whether live PostgreSQL is actively reachable
let isConnected = globalForPrisma.dbStatus ?? false;
let hasCheckedOnce = false;

// Fast health probe with timeout
async function probeConnection(): Promise<boolean> {
  // If connection string is obviously placeholder, don't stall network
  const dbUrl = process.env.DATABASE_URL || "";
  if (
    !dbUrl ||
    dbUrl.includes("demo_password") ||
    dbUrl.includes("ep-sample") ||
    dbUrl.includes("sample-pooler")
  ) {
    return false;
  }

  try {
    const timeoutPromise = new Promise<boolean>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 1500)
    );
    const queryPromise = rawPrisma.$queryRaw`SELECT 1`.then(() => true);
    return await Promise.race([queryPromise, timeoutPromise]);
  } catch {
    return false;
  }
}

async function exec<T>(prismaFn: () => Promise<T>, fallbackFn: () => Promise<any>): Promise<T> {
  if (!hasCheckedOnce) {
    isConnected = await probeConnection();
    hasCheckedOnce = true;
    globalForPrisma.dbStatus = isConnected;
  }

  if (isConnected) {
    try {
      return await prismaFn();
    } catch (err: any) {
      if (
        err?.name === "PrismaClientInitializationError" ||
        err?.code === "P1001" ||
        err?.message?.includes("Can't reach database")
      ) {
        isConnected = false;
        globalForPrisma.dbStatus = false;
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
    findMany: (args?: any) => fallbackStore.file.findMany(args),
    findUnique: (args: any) => fallbackStore.file.findUnique(args),
    create: (args: any) => fallbackStore.file.create(args),
    delete: (args: any) => fallbackStore.file.delete(args),
  },
  fileTransfer: {
    findMany: (args?: any) => fallbackStore.fileTransfer.findMany(args),
    findUnique: (args: any) => fallbackStore.fileTransfer.findUnique(args),
    create: (args: any) => fallbackStore.fileTransfer.create(args),
    update: (args: any) => fallbackStore.fileTransfer.update(args),
    delete: (args: any) => fallbackStore.fileTransfer.delete(args),
  },
  mailMessage: {
    findMany: (args?: any) => fallbackStore.mailMessage.findMany(args),
    findUnique: (args: any) => fallbackStore.mailMessage.findUnique(args),
    create: (args: any) => fallbackStore.mailMessage.create(args),
    update: (args: any) => fallbackStore.mailMessage.update(args),
    delete: (args: any) => fallbackStore.mailMessage.delete(args),
    deleteMany: (args?: any) => fallbackStore.mailMessage.deleteMany(args),
  },
  systemSettings: {
    get: () => fallbackStore.systemSettings.get(),
    update: (args: any) => fallbackStore.systemSettings.update(args),
  },
  ticket: {
    findMany: (args?: any) => fallbackStore.ticket.findMany(args),
    findUnique: (args: any) => fallbackStore.ticket.findUnique(args),
    create: (args: any) => fallbackStore.ticket.create(args),
    update: (args: any) => fallbackStore.ticket.update(args),
    delete: (args: any) => fallbackStore.ticket.delete(args),
  },
  ticketMessage: {
    findMany: (args?: any) => fallbackStore.ticketMessage.findMany(args),
    create: (args: any) => fallbackStore.ticketMessage.create(args),
  },
  $queryRaw: rawPrisma.$queryRaw.bind(rawPrisma),
  $disconnect: rawPrisma.$disconnect.bind(rawPrisma),
};

export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  latencyMs: number;
  message: string;
}> {
  const start = Date.now();
  const ok = await probeConnection();
  const latencyMs = Date.now() - start;

  if (ok) {
    return {
      connected: true,
      latencyMs,
      message: "Connected to Neon PostgreSQL cloud instance",
    };
  }

  return {
    connected: false,
    latencyMs: 1,
    message: "Local persistent database active (Configure live Neon PostgreSQL in .env for production deployment)",
  };
}
