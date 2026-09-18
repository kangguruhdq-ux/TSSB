"use client";

import React, { useState } from "react";
import { RefreshButton } from "@/components/common/refresh-button";
import { Plus, Filter } from "lucide-react";

interface SystemOverviewHeaderProps {
  onRefresh: () => Promise<void> | void;
  onCreateServer?: () => void;
  isLoading?: boolean;
}

export function SystemOverviewHeader({
  onRefresh,
  onCreateServer,
  isLoading,
}: SystemOverviewHeaderProps) {
  const [timeframe, setTimeframe] = useState("24h");

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
          <span>SYSTEM OVERVIEW DASHBOARD</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Animated metric cards and real-time infrastructure status
        </p>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Timeframe Selector matching reference */}
        <div className="relative flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 shadow-xs">
          <Filter className="w-3.5 h-3.5 mr-1.5 text-cyan-600 dark:text-cyan-400" />
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-transparent text-xs font-mono text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
          >
            <option value="1h" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">1 hour</option>
            <option value="24h" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">24 hours</option>
            <option value="7d" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">7 days</option>
            <option value="30d" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">30 days</option>
          </select>
        </div>

        {/* Refresh button with rotating icon */}
        <RefreshButton onRefresh={onRefresh} isLoading={isLoading} />

        {/* Quick Action Button */}
        {onCreateServer && (
          <button
            onClick={onCreateServer}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs transition-all duration-200 hover:scale-102 active:scale-98 shadow-cyan-glow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Create Server</span>
          </button>
        )}
      </div>
    </div>
  );
}
