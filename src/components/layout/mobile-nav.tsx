"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  X,
  LayoutDashboard,
  Server,
  Layers,
  Network,
  FileText,
  Activity,
  Users,
  Settings,
  Shield,
  LogOut,
  User as UserIcon,
  FolderArchive,
  Mail,
  LifeBuoy,
} from "lucide-react";
import { TssbLogo } from "@/components/common/logo";
import { SessionUser } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  user: SessionUser | null;
}

export function MobileNav({ isOpen, onClose, user }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const mainItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Servers", href: "/servers", icon: Server },
    { label: "Services", href: "/services", icon: Layers },
    { label: "Network", href: "/network", icon: Network },
    { label: "Files (FTP)", href: "/files", icon: FolderArchive },
    { label: "Webmail", href: "/mail", icon: Mail },
    { label: "Reports & Tickets", href: "/tickets", icon: LifeBuoy },
    { label: "Documentation", href: "/documentation", icon: FileText },
    { label: "Audit Activity", href: "/activity", icon: Activity },
  ];

  const adminItems = [
    { label: "Admin Control Center", href: "/admin", icon: Shield },
    { label: "User Management", href: "/admin/users", icon: Users },
    { label: "Incident Tickets", href: "/tickets", icon: LifeBuoy },
    { label: "System Settings", href: "/admin/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Logged out successfully");
      onClose();
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Logout failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-[280px] bg-white dark:bg-[#090e1a] border-r border-slate-200 dark:border-[#172033] flex flex-col justify-between p-4 z-50 shadow-2xl animate-in slide-in-from-left duration-250 transition-colors">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <TssbLogo size="sm" href="/dashboard" />
            <button
              onClick={onClose}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items */}
          <div className="mt-4 space-y-1 overflow-y-auto max-h-[calc(100vh-240px)]">
            {mainItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 min-h-[44px] rounded-lg text-xs font-medium transition-colors",
                    isActive
                      ? "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-semibold border border-cyan-500/30"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Admin Items */}
            {user?.role === "ADMIN" && (
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="px-3 text-[10px] font-mono uppercase text-cyan-600 dark:text-cyan-400 tracking-wider mb-2 font-bold">
                  ADMINISTRATION
                </div>
                <div className="space-y-1">
                  {adminItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 px-3 min-h-[44px] rounded-lg text-xs font-medium transition-colors",
                          isActive
                            ? "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-semibold border border-cyan-500/30"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400 text-xs font-bold">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="truncate text-xs">
                <div className="text-slate-900 dark:text-white font-medium truncate">{user?.name || "User"}</div>
                <div className="text-slate-500 dark:text-slate-400 text-[10px] font-mono truncate">{user?.email}</div>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
