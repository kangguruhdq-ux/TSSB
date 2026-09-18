import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  label = "Loading telemetry...",
  className,
}: LoadingSpinnerProps) {
  const sizeClass =
    size === "sm" ? "w-4 h-4" : size === "lg" ? "w-8 h-8" : "w-6 h-6";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 py-8 text-slate-400",
        className
      )}
    >
      <Loader2 className={cn("animate-spin text-cyan-400", sizeClass)} />
      {label && <span className="text-xs font-mono tracking-wider">{label}</span>}
    </div>
  );
}
