import React from "react";
import Link from "next/link";
import { ServerCrash, ArrowLeft } from "lucide-react";
import { TssbLogo } from "@/components/common/logo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col items-center justify-center p-6 cyber-grid text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 mb-6 shadow-cyan-glow-sm">
        <ServerCrash className="w-8 h-8" />
      </div>

      <div className="font-mono text-xs text-cyan-400 font-bold uppercase tracking-widest mb-2">
        HTTP 404 • ROUTE UNREACHABLE
      </div>

      <h1 className="text-3xl font-extrabold text-white tracking-tight">
        Target Node Not Found
      </h1>

      <p className="text-xs text-slate-400 mt-2 max-w-sm leading-relaxed">
        The requested system endpoint or resource record does not exist on this cluster partition.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-cyan-glow-sm transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
