"use client";

import React from "react";
import {
  User,
  Globe,
  Triangle,
  Layers,
  Database,
  Server,
  Activity,
} from "lucide-react";

export function InfrastructureFlow() {
  const nodes = [
    { id: "user", label: "USER", sub: "Client Request", icon: User },
    { id: "client", label: "WEB CLIENT", sub: "HTTPS / React 19", icon: Globe },
    { id: "vercel", label: "VERCEL", sub: "Edge CDN", icon: Triangle },
    { id: "nextjs", label: "NEXT.JS", sub: "App Router / Node", icon: Layers },
    { id: "prisma", label: "PRISMA", sub: "Type-Safe ORM", icon: Server },
    { id: "neon", label: "NEON POSTGRESQL", sub: "Serverless Database", icon: Database },
  ];

  return (
    <div className="relative w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322]/90 p-5 shadow-sm dark:shadow-lg flex flex-col justify-between overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span className="text-xs font-bold tracking-wider uppercase text-slate-900 dark:text-slate-200">
            INFRASTRUCTURE VISUALIZATION
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800/40 text-cyan-700 dark:text-cyan-400">
          LIVE TELEMETRY
        </span>
      </div>

      {/* SVG Pipeline Graphic */}
      <div className="relative py-4 overflow-x-auto">
        <div className="min-w-[580px] flex items-center justify-between relative px-2">
          {/* Animated Connecting Line */}
          <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-[2px] bg-slate-200 dark:bg-slate-800 z-0">
            {/* Animated data pulses */}
            <div className="absolute top-0 left-0 h-full w-24 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-[shimmer_2.5s_infinite]" />
          </div>

          {nodes.map((node) => {
            const Icon = node.icon;
            return (
              <div key={node.id} className="relative z-10 flex flex-col items-center group">
                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 group-hover:border-cyan-500/80 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.35)] flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-all duration-300">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="mt-2.5 text-center">
                  <div className="text-[11px] font-bold font-mono text-slate-900 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                    {node.label}
                  </div>
                  <div className="text-[9px] font-mono text-slate-500 dark:text-slate-500">
                    {node.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Specs */}
      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>PostgreSQL TLS 1.3 Active</span>
        </div>
        <div className="text-slate-500">Edge Latency: ~14ms</div>
      </div>
    </div>
  );
}
