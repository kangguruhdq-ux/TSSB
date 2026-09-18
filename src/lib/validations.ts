import { z } from "zod";

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(3, "Email or username must be at least 3 characters")
    .max(100, "Identifier is too long"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password is too long"),
  rememberMe: z.boolean().optional().default(false),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(60, "Full name cannot exceed 60 characters"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username cannot exceed 30 characters")
      .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and dashes"),
    email: z
      .string()
      .email("Please provide a valid email address")
      .max(100, "Email cannot exceed 100 characters"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password cannot exceed 100 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const serverSchema = z.object({
  name: z.string().min(2, "Server name is required").max(60),
  hostname: z
    .string()
    .min(2, "Hostname is required")
    .max(60)
    .regex(/^[a-zA-Z0-9.-]+$/, "Invalid hostname format"),
  ipAddress: z
    .string()
    .min(7, "IP address is required")
    .regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/, "Must be a valid IPv4 or IPv6 address"),
  operatingSystem: z.string().min(2, "Operating system is required"),
  serverType: z.enum(["WEB", "DNS", "FILE", "MAIL", "DATABASE", "APPLICATION", "OTHER"]),
  location: z.string().min(2, "Location is required"),
  status: z.enum(["ONLINE", "OFFLINE", "MAINTENANCE"]).default("ONLINE"),
  description: z.string().max(500).optional().nullable(),
});

export const serviceSchema = z.object({
  name: z.string().min(2, "Service name is required").max(60),
  serverId: z.string().min(1, "Server selection is required"),
  port: z.coerce.number().int().min(1, "Port must be at least 1").max(65535, "Port must be <= 65535"),
  protocol: z.string().min(1, "Protocol is required").default("TCP"),
  version: z.string().max(50).optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE", "DEGRADED", "STOPPED"]).default("ACTIVE"),
  description: z.string().max(500).optional().nullable(),
});

export const networkSchema = z.object({
  serverId: z.string().min(1, "Server selection is required"),
  interfaceName: z.string().min(2, "Interface name is required").max(30),
  ipAddress: z.string().min(7, "IP address is required"),
  subnetMask: z.string().min(7, "Subnet mask is required"),
  gateway: z.string().min(7, "Gateway is required"),
  dnsPrimary: z.string().min(7, "Primary DNS is required"),
  dnsSecondary: z.string().optional().nullable(),
  vlan: z.coerce.number().int().min(1).max(4094).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
});

export const documentationSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(120),
  category: z.enum([
    "INSTALLATION",
    "CONFIGURATION",
    "NETWORKING",
    "SECURITY",
    "TROUBLESHOOTING",
    "MAINTENANCE",
    "OTHER",
  ]),
  content: z.string().min(10, "Content must be at least 10 characters"),
  serverId: z.string().optional().nullable(),
});

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(60),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, "Alphanumeric, underscore, dash only"),
  email: z.string().email("Invalid email format"),
  bio: z.string().max(500).optional().nullable(),
  avatarUrl: z.string().max(2000000).optional().nullable(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, "Current password required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

export const userRoleUpdateSchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
});

export const userStatusUpdateSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]),
});
