import React from "react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  variant?: "server" | "service" | "user" | "role" | "default";
  className?: string;
  showDot?: boolean;
}

export function StatusBadge({
  status,
  variant = "default",
  className,
  showDot = true,
}: StatusBadgeProps) {
  const norm = status.toUpperCase();

  // Color mapping based on status
  let dotColor = "bg-slate-400";
  let textColor = "text-slate-300";
  let bgBorderColor = "bg-slate-500/10 border-slate-500/20";

  if (norm === "ONLINE" || norm === "HEALTHY" || norm === "ACTIVE") {
    dotColor = "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]";
    textColor = "text-emerald-400";
    bgBorderColor = "bg-emerald-500/10 border-emerald-500/30";
  } else if (norm === "DEGRADED" || norm === "MAINTENANCE") {
    dotColor = "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]";
    textColor = "text-amber-400";
    bgBorderColor = "bg-amber-500/10 border-amber-500/30";
  } else if (norm === "OFFLINE" || norm === "DOWN" || norm === "INACTIVE" || norm === "STOPPED") {
    dotColor = "bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]";
    textColor = "text-rose-400";
    bgBorderColor = "bg-rose-500/10 border-rose-500/30";
  } else if (norm === "ADMIN") {
    dotColor = "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]";
    textColor = "text-cyan-400";
    bgBorderColor = "bg-cyan-500/10 border-cyan-500/30";
  } else if (norm === "USER") {
    dotColor = "bg-blue-400";
    textColor = "text-blue-300";
    bgBorderColor = "bg-blue-500/10 border-blue-500/20";
  }

  // Display label formatting
  const displayLabel =
    norm === "ONLINE"
      ? "Healthy"
      : norm === "MAINTENANCE"
      ? "Degraded"
      : norm === "OFFLINE"
      ? "Down"
      : norm.charAt(0) + norm.slice(1).toLowerCase();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
        bgBorderColor,
        textColor,
        className
      )}
    >
      {showDot && (
        <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", dotColor)} />
      )}
      <span>{displayLabel}</span>
    </span>
  );
}
