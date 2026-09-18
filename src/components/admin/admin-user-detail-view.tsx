"use client";

import React from "react";
import Link from "next/link";
import {
  User as UserIcon,
  ArrowLeft,
  Shield,
  Server,
  FileText,
  Activity,
  Calendar,
  Clock,
  ExternalLink,
} from "lucide-react";
import { StatusBadge } from "@/components/common/status-badge";
import { formatDateTime } from "@/lib/utils";

interface AdminUserDetailProps {
  user: any;
}

export function AdminUserDetailView({ user }: AdminUserDetailProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to User Management</span>
      </Link>

      {/* User Header Profile Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] p-6 shadow-sm dark:shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-cyan-500 p-0.5 overflow-hidden flex-shrink-0">
              <img
                src={
                  user.avatarUrl ||
                  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
                }
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{user.name}</h1>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950 border border-cyan-200 dark:border-cyan-800/40 text-cyan-700 dark:text-cyan-300">
                  {user.role}
                </span>
                <StatusBadge status={user.status} />
              </div>
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
                @{user.username} • {user.email}
              </div>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
            <div>Joined: {formatDateTime(user.createdAt)}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Updated: {formatDateTime(user.updatedAt)}
            </div>
          </div>
        </div>

        {user.bio && (
          <div className="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
            {user.bio}
          </div>
        )}
      </div>

      {/* Relations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Owned Servers */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] p-5 shadow-sm dark:shadow-md">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold font-mono text-slate-900 dark:text-slate-200">
              <Server className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>PROVISIONED SERVERS ({user.servers?.length || 0})</span>
            </div>
          </div>

          {user.servers && user.servers.length > 0 ? (
            <div className="space-y-2">
              {user.servers.map((s: any) => (
                <Link
                  key={s.id}
                  href={`/servers/${s.id}`}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60 hover:border-cyan-500/40 flex items-center justify-between group transition-colors text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                      {s.name}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      {s.hostname}
                    </div>
                  </div>
                  <StatusBadge status={s.status} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs font-mono text-slate-400">
              No servers registered by this user.
            </div>
          )}
        </div>

        {/* Owned Documentation */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] p-5 shadow-sm dark:shadow-md">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold font-mono text-slate-900 dark:text-slate-200">
              <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>AUTHORED RUNBOOKS ({user.documentation?.length || 0})</span>
            </div>
          </div>

          {user.documentation && user.documentation.length > 0 ? (
            <div className="space-y-2">
              {user.documentation.map((d: any) => (
                <Link
                  key={d.id}
                  href={`/documentation/${d.id}`}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60 hover:border-cyan-500/40 flex items-center justify-between group transition-colors text-xs"
                >
                  <div className="truncate mr-2">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 truncate">
                      {d.title}
                    </div>
                    <div className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">
                      {d.category}
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 whitespace-nowrap">
                    View →
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs font-mono text-slate-400">
              No runbooks authored by this user.
            </div>
          )}
        </div>
      </div>

      {/* Activity History */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] p-5 shadow-sm dark:shadow-md">
        <div className="flex items-center gap-2 text-xs font-bold font-mono text-slate-900 dark:text-slate-200 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
          <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span>RECENT USER ACTIVITY LOGS ({user.activityLogs?.length || 0})</span>
        </div>

        {user.activityLogs && user.activityLogs.length > 0 ? (
          <div className="space-y-2 font-mono text-xs">
            {user.activityLogs.map((log: any) => (
              <div
                key={log.id}
                className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-400 border border-slate-200 dark:border-slate-700">
                    {log.action}
                  </span>
                  <span className="font-sans text-slate-800 dark:text-slate-300 text-xs">
                    {log.description}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 whitespace-nowrap">
                  {formatDateTime(log.createdAt)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs font-mono text-slate-400">
            No logged activity for this account.
          </div>
        )}
      </div>
    </div>
  );
}
