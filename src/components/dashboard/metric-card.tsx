import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  highlight?: boolean;
  trend?: string;
  className?: string;
}

export function MetricCard({
  label,
  value,
  subtext,
  icon: Icon,
  highlight = false,
  trend,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-0.5",
        highlight
          ? "bg-cyan-50/70 dark:bg-[#0d172e] border-2 border-cyan-500 dark:border-cyan-400 shadow-sm dark:shadow-[0_0_20px_rgba(6,182,212,0.25)]"
          : "bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm",
        className
      )}
    >
      {/* Top row: Icon and Trend/Subtext */}
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
            highlight
              ? "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40"
              : "bg-slate-100 dark:bg-slate-800/80 text-cyan-600 dark:text-cyan-400 border border-slate-200 dark:border-slate-700/60 group-hover:border-cyan-500/40"
          )}
        >
          <Icon className="w-5 h-5" />
        </div>

        {trend && (
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
            {trend}
          </span>
        )}
      </div>

      {/* Metric Content */}
      <div className="mt-3">
        <span className="text-[11px] font-mono tracking-wider text-slate-500 dark:text-slate-400 uppercase">
          {label}
        </span>
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
          {value}
        </div>
        {subtext && (
          <p className="text-[10px] font-mono text-slate-500 dark:text-slate-500 mt-1 truncate">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}
