"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Shield,
  Users,
  Server,
  Layers,
  FileText,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Clock,
} from "lucide-react";
import { RefreshButton } from "@/components/common/refresh-button";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

export function AdminDashboardView() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      } else {
        toast.error(json.message || "Failed to load admin telemetry");
      }
    } catch {
      toast.error("Network communication failure");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (isLoading && !stats) {
    return <LoadingSpinner label="Loading admin control center telemetry..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            <span>Admin Control Center</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Global cluster telemetry, IAM directory governance, and relational storage status
          </p>
        </div>

        <div className="flex items-center gap-3">
          <RefreshButton onRefresh={fetchStats} isLoading={isLoading} />
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-cyan-glow-sm transition-all"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Manage Users</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Row 1: Users & Servers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] shadow-sm dark:shadow-md">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
            <span>TOTAL USERS</span>
            <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {stats?.totalUsers ?? 0}
          </div>
          <div className="mt-2 text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
            {stats?.activeUsers ?? 0} Active • {stats?.inactiveUsers ?? 0} Inactive
          </div>
        </div>

        <div className="p-4 rounded-xl border-2 border-cyan-500 dark:border-cyan-400 bg-cyan-50/70 dark:bg-[#0d172e] shadow-sm dark:shadow-[0_0_15px_rgba(6,182,212,0.2)]">
          <div className="flex items-center justify-between text-xs font-mono text-cyan-700 dark:text-cyan-400">
            <span>TOTAL SERVERS</span>
            <Server className="w-4 h-4 text-cyan-600 dark:text-cyan-300" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {stats?.totalServers ?? 0}
          </div>
          <div className="mt-2 text-[10px] font-mono text-cyan-700 dark:text-cyan-300">
            {stats?.onlineServers ?? 0} Online • {stats?.maintenanceServers ?? 0} Degraded
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] shadow-sm dark:shadow-md">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
            <span>TOTAL SERVICES</span>
            <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {stats?.totalServices ?? 0}
          </div>
          <div className="mt-2 text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
            {stats?.activeServices ?? 0} Running Active
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] shadow-sm dark:shadow-md">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
            <span>AUDIT TRAIL</span>
            <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {stats?.totalActivityLogs ?? 0}
          </div>
          <div className="mt-2 text-[10px] font-mono text-slate-500 dark:text-slate-400">
            {stats?.totalDocumentation ?? 0} Documentation Runbooks
          </div>
        </div>
      </div>

      {/* Cluster Health Distribution Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Server Status Breakdown */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] p-5 shadow-sm dark:shadow-lg">
          <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-900 dark:text-slate-200 mb-4 flex items-center justify-between">
            <span>SERVER HEALTH RATIO</span>
            <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold">POSTGRESQL AGGREGATION</span>
          </h3>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ONLINE (Healthy)</span>
                </span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{stats?.onlineServers ?? 0}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full"
                  style={{
                    width: `${
                      stats?.totalServers ? (stats.onlineServers / stats.totalServers) * 100 : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>MAINTENANCE (Degraded)</span>
                </span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{stats?.maintenanceServers ?? 0}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-amber-500 dark:bg-amber-400 rounded-full"
                  style={{
                    width: `${
                      stats?.totalServers
                        ? (stats.maintenanceServers / stats.totalServers) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-medium">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>OFFLINE (Down)</span>
                </span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{stats?.offlineServers ?? 0}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-rose-500 dark:bg-rose-400 rounded-full"
                  style={{
                    width: `${
                      stats?.totalServers ? (stats.offlineServers / stats.totalServers) * 100 : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* User Account Status Breakdown */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] p-5 shadow-sm dark:shadow-lg">
          <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-900 dark:text-slate-200 mb-4 flex items-center justify-between">
            <span>IAM ACCOUNT DIRECTORY</span>
            <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold">RBAC GOVERNED</span>
          </h3>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ACTIVE OPERATORS</span>
                </span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{stats?.activeUsers ?? 0}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full"
                  style={{
                    width: `${
                      stats?.totalUsers ? (stats.activeUsers / stats.totalUsers) * 100 : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-medium">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>INACTIVE / DEACTIVATED</span>
                </span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{stats?.inactiveUsers ?? 0}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-rose-500 dark:bg-rose-400 rounded-full"
                  style={{
                    width: `${
                      stats?.totalUsers ? (stats.inactiveUsers / stats.totalUsers) * 100 : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Security Policy: Enforce MFA</span>
              <Link href="/admin/users" className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 font-medium">
                Manage All Users →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Timeline Preview */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] p-5 shadow-sm dark:shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-900 dark:text-slate-200">
            RECENT AUDIT TRANSACTIONS
          </h3>
          <Link
            href="/activity"
            className="text-xs font-mono text-cyan-600 dark:text-cyan-400 hover:text-cyan-500"
          >
            View Full Activity Log →
          </Link>
        </div>

        <div className="space-y-2.5">
          {stats?.recentActivities?.map((act: any) => (
            <div
              key={act.id}
              className="p-3 rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950 border border-cyan-200 dark:border-cyan-800/40 text-cyan-700 dark:text-cyan-300">
                  {act.action}
                </span>
                <span className="font-sans text-slate-800 dark:text-slate-200">{act.description}</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {formatDateTime(act.createdAt)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
