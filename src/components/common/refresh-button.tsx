"use client";

import React from "react";
import { RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface RefreshButtonProps {
  onRefresh: () => Promise<void> | void;
  isLoading?: boolean;
  className?: string;
  label?: string;
  size?: "sm" | "md";
}

export function RefreshButton({
  onRefresh,
  isLoading = false,
  className,
  label,
  size = "sm",
}: RefreshButtonProps) {
  const [internalLoading, setInternalLoading] = React.useState(false);

  const handleClick = async () => {
    setInternalLoading(true);
    try {
      await onRefresh();
    } finally {
      // Add slight timeout so the rotation feedback is clearly felt
      setTimeout(() => setInternalLoading(false), 400);
    }
  };

  const isSpinning = isLoading || internalLoading;

  return (
    <button
      onClick={handleClick}
      disabled={isSpinning}
      aria-label="Refresh data"
      title="Refresh data"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-900/60 hover:bg-slate-800/80 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-400 transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed",
        size === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3 text-sm",
        className
      )}
    >
      <RotateCw
        className={cn(
          "w-3.5 h-3.5 transition-transform",
          isSpinning && "animate-spin text-cyan-400"
        )}
      />
      {label && <span>{label}</span>}
    </button>
  );
}
