"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Server,
  Layers,
  Network,
  FileText,
  Activity,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  Shield,
  LogOut,
  User as UserIcon,
  FolderArchive,
  Mail,
  LifeBuoy,
} from "lucide-react";
import { TssbLogo } from "@/components/common/logo";
import { cn } from "@/lib/utils";
import { SessionUser } from "@/types";
import { toast } from "sonner";

interface SidebarProps {
  user: SessionUser | null;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminOpen, setAdminOpen] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isAdmin = user?.role === "ADMIN";

  const mainNavItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Servers", href: "/servers", icon: Server },
    { label: "Services", href: "/services", icon: Layers },
    { label: "Network", href: "/network", icon: Network },
    { label: "Files (FTP)", href: "/files", icon: FolderArchive },
    { label: "Webmail", href: "/mail", icon: Mail },
    { label: "Reports & Tickets", href: "/tickets", icon: LifeBuoy },
    { label: "Docs", href: "/documentation", icon: FileText },
    { label: "Activity", href: "/activity", icon: Activity },
  ];

  const adminNavItems = [
    { label: "Admin Dashboard", href: "/admin", icon: Shield },
    { label: "User Management", href: "/admin/users", icon: Users },
    { label: "Storage & Files", href: "/files", icon: FolderArchive },
    { label: "System Mail", href: "/mail", icon: Mail },
    { label: "Incident Tickets", href: "/tickets", icon: LifeBuoy },
    { label: "Platform Settings", href: "/admin/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Logout failed");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className="w-64 bg-white dark:bg-[#090e1a] border-r border-slate-200 dark:border-[#172033] flex flex-col justify-between h-screen sticky top-0 select-none z-30 transition-colors duration-200">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200 dark:border-[#172033]/80">
        <TssbLogo size="md" href="/dashboard" />
      </div>

      {/* Navigation Links Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Main Navigation */}
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 group relative",
                  isActive
                    ? "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-semibold border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-cyan-500 dark:bg-cyan-400 rounded-r shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                )}
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive
                      ? "text-cyan-600 dark:text-cyan-400"
                      : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Admin Section (Adapts strictly to role) */}
        {isAdmin && (
          <div className="pt-2 border-t border-slate-200 dark:border-[#172033]">
            <button
              onClick={() => setAdminOpen(!adminOpen)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>ADMIN ROLE</span>
              </div>
              {adminOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>

            {adminOpen && (
              <div className="mt-1 space-y-1 pl-1">
                {adminNavItems.map((item, idx) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={`${item.href}-${idx}`}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-medium transition-all group",
                        isActive
                          ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Footer Panel */}
      <div className="p-3 border-t border-slate-200 dark:border-[#172033] bg-slate-50 dark:bg-slate-950/40">
        <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-xs">
          <Link
            href="/profile"
            className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold text-xs flex-shrink-0">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name || "User"}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <UserIcon className="w-4 h-4" />
              )}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {user?.name || "Logged In"}
              </div>
              <div className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 truncate">
                @{user?.username || "user"}
              </div>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            aria-label="Log out"
            title="Log out"
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
