"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Menu,
  User as UserIcon,
  Shield,
  Key,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Server,
  Layers,
  Network,
  FileText,
  Activity,
  FolderArchive,
  Mail,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";
import { SessionUser } from "@/types";
import { toast } from "sonner";

interface TopbarProps {
  user: SessionUser | null;
  onOpenMobileNav: () => void;
}

export function Topbar({ user, onOpenMobileNav }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const navTabs = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Servers", href: "/servers", icon: Server },
    { label: "Services", href: "/services", icon: Layers },
    { label: "Network", href: "/network", icon: Network },
    { label: "Files", href: "/files", icon: FolderArchive },
    { label: "Mail", href: "/mail", icon: Mail },
    { label: "Docs", href: "/documentation", icon: FileText },
    { label: "Activity", href: "/activity", icon: Activity },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Logout failed");
    }
  };

  return (
    <header className="h-14 border-b border-slate-200 dark:border-[#172033] bg-white/95 dark:bg-[#090e1a]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 transition-colors duration-200">
      {/* Left: Mobile hamburger trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 rounded-lg border border-slate-300 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Top horizontal tab shortcuts */}
        <nav className="hidden xl:flex items-center gap-1">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              pathname === tab.href ||
              (tab.href !== "/dashboard" && pathname.startsWith(tab.href));

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                  isActive
                    ? "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right Controls: Notifications, Theme, User Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen(!notifOpen);
              setDropdownOpen(false);
            }}
            aria-label="Notifications"
            className="relative w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/60 hover:border-cyan-500/50 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all hover:scale-105 active:scale-95 shadow-xs"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
          </button>

          {/* Notifications Flyout */}
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">SYSTEM NOTIFICATIONS</span>
                <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold">AUDIT ACTIVE</span>
              </div>
              <div className="mt-3 space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Database Synced</span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                    PostgreSQL connection pool operating with optimal latency.
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                    <span>RBAC Realm Active</span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                    Server-side authorization enforced on all mutation actions.
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-center">
                <Link
                  href="/activity"
                  onClick={() => setNotifOpen(false)}
                  className="text-xs font-mono text-cyan-600 dark:text-cyan-400 hover:underline"
                >
                  View All Audit Activity →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Dark/Light Theme Toggle */}
        <ThemeToggle />

        {/* User Pill & Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/60 hover:border-cyan-500/50 transition-all hover:scale-102 shadow-xs"
          >
            <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400 text-xs font-bold overflow-hidden">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name || "User"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-3.5 h-3.5" />
              )}
            </div>
            <span className="text-xs font-mono text-slate-700 dark:text-slate-200 max-w-[120px] truncate hidden sm:inline">
              {user?.email || "Account"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 sm:w-52 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {user?.name || "Logged User"}
                </div>
                <div className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 truncate">
                  Role: {user?.role || "USER"}
                </div>
              </div>

              <Link
                href="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
              >
                <UserIcon className="w-4 h-4" />
                <span>Profile Settings</span>
              </Link>

              <Link
                href="/profile/security"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
              >
                <Key className="w-4 h-4" />
                <span>Security & Password</span>
              </Link>

              <Link
                href="/files"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
              >
                <FolderArchive className="w-4 h-4" />
                <span>FTP & File Storage</span>
              </Link>

              <Link
                href="/mail"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>Internal Webmail</span>
              </Link>

              {user?.role === "ADMIN" && (
                <Link
                  href="/admin/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin Settings</span>
                </Link>
              )}

              <div className="my-1 border-t border-slate-200 dark:border-slate-800" />

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
