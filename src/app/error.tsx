"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global runtime error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col items-center justify-center p-6 cyber-grid text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-6 shadow-md">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <div className="font-mono text-xs text-rose-400 font-bold uppercase tracking-widest mb-2">
        RUNTIME EXCEPTION DETECTED
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
        System Service Interrupted
      </h1>

      <p className="text-xs text-slate-400 mt-2 max-w-md leading-relaxed">
        An unhandled execution fault occurred. Verify database connectivity and reload the state machine.
      </p>

      <div className="mt-6">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-cyan-glow-sm transition-all"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Retry Operation</span>
        </button>
      </div>
    </div>
  );
}
