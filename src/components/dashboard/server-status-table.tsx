"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Server, MoreHorizontal, ExternalLink, RefreshCw, Search } from "lucide-react";
import { StatusBadge } from "@/components/common/status-badge";
import { cn } from "@/lib/utils";

interface ServerItem {
  id: string;
  name: string;
  hostname: string;
  ipAddress: string;
  operatingSystem: string;
  serverType: string;
  status: string;
  location: string;
}

interface ServerStatusTableProps {
  servers: ServerItem[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function ServerStatusTable({
  servers,
  onRefresh,
  isLoading,
}: ServerStatusTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = servers.filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      s.hostname.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.ipAddress.toLowerCase().includes(q) ||
      s.serverType.toLowerCase().includes(q)
    );
  });

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322]/90 p-5 shadow-sm dark:shadow-lg flex flex-col justify-between overflow-hidden">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-xs font-bold tracking-wider uppercase text-slate-900 dark:text-slate-200">
              SERVER STATUS
            </h3>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            Real time animated telemetry on cluster nodes
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter nodes..."
              className="h-8 pl-8 pr-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-500 outline-none w-36 sm:w-44 font-mono"
            />
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh servers"
              className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors shadow-xs"
            >
              <RefreshCw
                className={cn("w-3.5 h-3.5", isLoading && "animate-spin text-cyan-500")}
              />
            </button>
          )}
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="pb-2.5 font-semibold">STATUS</th>
              <th className="pb-2.5 font-semibold">HOSTNAME</th>
              <th className="pb-2.5 font-semibold">IP</th>
              <th className="pb-2.5 font-semibold">OS</th>
              <th className="pb-2.5 font-semibold">TYPE</th>
              <th className="pb-2.5 text-right font-semibold">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-500 font-mono text-xs">
                  No server nodes matching filter.
                </td>
              </tr>
            ) : (
              filtered.slice(0, 5).map((server) => (
                <tr
                  key={server.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
                >
                  <td className="py-2.5">
                    <StatusBadge status={server.status} />
                  </td>
                  <td className="py-2.5 font-mono text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors font-medium">
                    {server.hostname}
                  </td>
                  <td className="py-2.5 font-mono text-slate-600 dark:text-slate-400">
                    {server.ipAddress}
                  </td>
                  <td className="py-2.5 text-slate-700 dark:text-slate-300">
                    {server.operatingSystem}
                  </td>
                  <td className="py-2.5">
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {server.serverType}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <Link
                      href={`/servers/${server.id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 transition-colors p-1"
                      title="Inspect server"
                    >
                      <span>Inspect</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Link to All Servers */}
      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-mono">
        <span className="text-slate-500">
          Showing {Math.min(filtered.length, 5)} of {servers.length} provisioned servers
        </span>
        <Link
          href="/servers"
          className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 transition-colors font-medium"
        >
          View all servers →
        </Link>
      </div>
    </div>
  );
}
