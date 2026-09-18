"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Search,
  Filter,
  Shield,
  Server,
  Layers,
  Network,
  FileText,
  User as UserIcon,
  Clock,
  Globe,
  Trash2,
} from "lucide-react";
import { RefreshButton } from "@/components/common/refresh-button";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { formatDateTime } from "@/lib/utils";
import { SessionUser } from "@/types";
import { toast } from "sonner";

interface ActivityRecord {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  description: string;
  ipAddress?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    username: string;
    role: string;
  } | null;
}

interface ActivityViewProps {
  currentUser: SessionUser;
}

export function ActivityView({ currentUser }: ActivityViewProps) {
  const [logs, setLogs] = useState<ActivityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [isClearOpen, setIsClearOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/activity?limit=100");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setLogs(json.data);
      }
    } catch {
      toast.error("Failed to load audit logs");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleClearLogs = async () => {
    setIsClearing(true);
    try {
      const res = await fetch("/api/activity", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to clear logs");
        return;
      }
      toast.success(data.message || "Activity logs purged successfully");
      setIsClearOpen(false);
      fetchLogs();
    } catch {
      toast.error("Network communication error");
    } finally {
      setIsClearing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filtered = logs.filter((log) => {
    const q = search.toLowerCase();
    const matchQ =
      log.action.toLowerCase().includes(q) ||
      log.description.toLowerCase().includes(q) ||
      (log.ipAddress && log.ipAddress.toLowerCase().includes(q)) ||
      (log.user && log.user.username.toLowerCase().includes(q));

    const matchEntity = entityFilter === "ALL" || log.entity === entityFilter;
    return matchQ && matchEntity;
  });

  const getEntityIcon = (entity: string) => {
    switch (entity.toUpperCase()) {
      case "SERVER":
        return <Server className="w-3.5 h-3.5 text-cyan-400" />;
      case "SERVICE":
        return <Layers className="w-3.5 h-3.5 text-blue-400" />;
      case "NETWORK":
        return <Network className="w-3.5 h-3.5 text-emerald-400" />;
      case "DOCUMENTATION":
        return <FileText className="w-3.5 h-3.5 text-amber-400" />;
      case "USER":
      case "AUTH":
        return <Shield className="w-3.5 h-3.5 text-cyan-300" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            <span>System Audit Activity</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Immutable transaction event log tracking authentication, configuration, and provisioning
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentUser.role === "ADMIN" && (
            <button
              onClick={() => setIsClearOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors shadow-xs"
              title="Clear all activity audit logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Audit Logs</span>
            </button>
          )}
          <RefreshButton onRefresh={fetchLogs} isLoading={isLoading} />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, description, IP..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-500 outline-none font-mono"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs w-full sm:w-auto">
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Entity:</span>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="h-8 px-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none"
          >
            <option value="ALL">All Entities</option>
            <option value="SERVER">Server</option>
            <option value="SERVICE">Service</option>
            <option value="NETWORK">Network</option>
            <option value="DOCUMENTATION">Documentation</option>
            <option value="AUTH">Authentication</option>
            <option value="USER">User Account</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <LoadingSpinner label="Fetching audit trails from PostgreSQL..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No audit logs found"
          description="No activity records match your query."
        />
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="p-3.5 font-semibold">TIMESTAMP</th>
                  <th className="p-3.5 font-semibold">ACTION</th>
                  <th className="p-3.5 font-semibold">ENTITY</th>
                  <th className="p-3.5 font-semibold">OPERATOR</th>
                  <th className="p-3.5 font-semibold">DESCRIPTION</th>
                  <th className="p-3.5 text-right font-semibold">SOURCE IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>

                    <td className="p-3.5 font-bold text-cyan-600 dark:text-cyan-400">
                      {log.action}
                    </td>

                    <td className="p-3.5">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] text-slate-700 dark:text-slate-300">
                        {getEntityIcon(log.entity)}
                        <span>{log.entity}</span>
                      </div>
                    </td>

                    <td className="p-3.5 text-slate-700 dark:text-slate-300">
                      {log.user ? `@${log.user.username}` : "SYSTEM"}
                    </td>

                    <td className="p-3.5 font-sans text-slate-800 dark:text-slate-300 text-xs max-w-md">
                      {log.description}
                    </td>

                    <td className="p-3.5 text-right text-slate-500 text-[11px]">
                      {log.ipAddress || "127.0.0.1"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm Clear Audit Logs Dialog */}
      <ConfirmDialog
        isOpen={isClearOpen}
        onClose={() => setIsClearOpen(false)}
        onConfirm={handleClearLogs}
        title="Clear System Activity Logs"
        description="Are you sure you want to permanently purge all recorded activity audit logs? This action frees audit trail storage but cannot be undone."
        confirmLabel="Purge All Logs"
        isLoading={isClearing}
      />
    </div>
  );
}
