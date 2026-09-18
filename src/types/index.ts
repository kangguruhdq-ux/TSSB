export type Role = "USER" | "ADMIN";
export type UserStatus = "ACTIVE" | "INACTIVE";

export type ServerType =
  | "WEB"
  | "DNS"
  | "FILE"
  | "MAIL"
  | "DATABASE"
  | "APPLICATION"
  | "OTHER";

export type ServerStatus = "ONLINE" | "OFFLINE" | "MAINTENANCE";

export type ServiceStatus = "ACTIVE" | "INACTIVE" | "DEGRADED" | "STOPPED";

export type DocCategory =
  | "INSTALLATION"
  | "CONFIGURATION"
  | "NETWORKING"
  | "SECURITY"
  | "TROUBLESHOOTING"
  | "MAINTENANCE"
  | "OTHER";

export interface SafeUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: Role;
  status: UserStatus;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface SessionUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: Role;
  status: UserStatus;
  avatarUrl?: string | null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalServers: number;
  onlineServers: number;
  offlineServers: number;
  maintenanceServers: number;
  totalServices: number;
  activeServices: number;
  totalDocumentation: number;
  totalActivityLogs: number;
}
