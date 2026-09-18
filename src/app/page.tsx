import React from "react";
import Link from "next/link";
import {
  Server,
  Database,
  Network,
  Shield,
  FileText,
  Activity,
  ArrowRight,
  CheckCircle2,
  Terminal,
  Cpu,
  Layers,
  Zap,
} from "lucide-react";
import { TssbLogo } from "@/components/common/logo";
import { InfrastructureFlow } from "@/components/visualizations/infrastructure-flow";
import { NetworkTopology } from "@/components/visualizations/network-topology";
import { getCurrentUser } from "@/lib/session";

export default async function LandingPage() {
  const user = await getCurrentUser();

  const serverTypes = [
    { type: "WEB", desc: "Nginx, Apache, HTTP/3 Ingress & TLS Termination", count: "Proxy Nodes" },
    { type: "DATABASE", desc: "PostgreSQL, PgBouncer, Multi-AZ Clustering", count: "Stateful Storage" },
    { type: "DNS", desc: "BIND9, Anycast authoritative nameservers, DNSSEC", count: "Routing Resolver" },
    { type: "APPLICATION", desc: "Node.js, Next.js App Router, Microservices", count: "Execution Mesh" },
    { type: "MAIL", desc: "Postfix, Dovecot, DKIM, SPF, and DMARC relays", count: "Messaging Edge" },
    { type: "FILE", desc: "NFS, Samba, S3-compatible object repositories", count: "Storage Matrix" },
  ];

  const coreCompetencies = [
    { title: "Server Installation", desc: "Automated provisioning with cloud-init and hardened Linux kernels." },
    { title: "Network Administration", desc: "Multi-tenant VLAN routing, subnet allocation, and gateway controls." },
    { title: "Role-Based Access", desc: "Strict server-side cryptographic JWT authorization and identity gates." },
    { title: "System Audit Trail", desc: "Immutable transactional event logging for compliance and forensics." },
    { title: "Technical Runbooks", desc: "Markdown documentation for operations, failover, and maintenance." },
    { title: "High-Availability Relational DB", desc: "Zero-data-loss architecture backed by Neon PostgreSQL." },
  ];

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* Animated Navbar */}
      <header className="h-16 border-b border-slate-800/80 bg-[#090e1a]/80 backdrop-blur-md sticky top-0 z-50 px-6 sm:px-12 flex items-center justify-between">
        <TssbLogo size="md" href="/" />

        <div className="hidden md:flex items-center gap-6 text-xs font-mono text-slate-400">
          <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
          <a href="#architecture" className="hover:text-cyan-400 transition-colors">Architecture</a>
          <a href="#servers" className="hover:text-cyan-400 transition-colors">Server Types</a>
          <a href="#security" className="hover:text-cyan-400 transition-colors">Security</a>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 text-xs font-mono transition-all"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-lg text-xs font-mono text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs shadow-cyan-glow-sm transition-all"
              >
                <span>Get Started</span>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 sm:px-12 max-w-6xl mx-auto text-center cyber-grid">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-cyan-500/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="relative z-10 space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-700/50 text-cyan-400 font-mono text-xs">
            <Terminal className="w-3.5 h-3.5" />
            <span>ENTERPRISE INFRASTRUCTURE OPERATING REALM</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            TSSB — Server Administration & Infrastructure Management
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            A centralized platform for managing servers, services, network configuration, documentation, users, and system activities.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4 flex-wrap">
            <Link
              href={user ? "/dashboard" : "/login"}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-sm tracking-wider uppercase transition-all duration-200 active:scale-95 shadow-cyan-glow"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#architecture"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-mono text-xs transition-colors"
            >
              <span>Explore Platform</span>
            </a>
          </div>
        </div>

        {/* Live Visualizations Preview */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
          <InfrastructureFlow />
          <NetworkTopology />
        </div>
      </section>

      {/* Core Competencies / Features Section */}
      <section id="features" className="py-20 px-6 sm:px-12 max-w-6xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">
            ACADEMIC & PROFESSIONAL MASTERY
          </h2>
          <h3 className="text-2xl sm:text-3xl font-bold text-white">
            Comprehensive Infrastructure Management
          </h3>
          <p className="text-xs text-slate-400 mt-2">
            Built from scratch to validate and operate complex multi-node systems.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {coreCompetencies.map((comp, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl border border-slate-800 bg-[#0d1322]/80 hover:border-cyan-500/40 transition-all duration-300 group"
            >
              <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-800/50 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                {comp.title}
              </h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                {comp.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Server Types Grid */}
      <section id="servers" className="py-20 px-6 sm:px-12 max-w-6xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">
            CLUSTER WORKLOADS
          </h2>
          <h3 className="text-2xl sm:text-3xl font-bold text-white">
            Supported Server Archetypes
          </h3>
          <p className="text-xs text-slate-400 mt-2">
            Dynamic relational modeling and health checks across diverse server classes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {serverTypes.map((st, i) => (
            <div
              key={i}
              className="p-5 rounded-xl border border-slate-800 bg-[#0d1322] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm font-bold text-cyan-400">
                    {st.type} SERVER
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                    {st.count}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {st.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* System Architecture Section */}
      <section id="architecture" className="py-20 px-6 sm:px-12 max-w-6xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">
            PRODUCTION DEPLOYMENT ARCHITECTURE
          </h2>
          <h3 className="text-2xl sm:text-3xl font-bold text-white">
            End-to-End Modern Cloud Stack
          </h3>
          <p className="text-xs text-slate-400 mt-2">
            Zero localStorage gimmicks. 100% relational persistence via PostgreSQL.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center font-mono text-xs">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
            <div className="text-cyan-400 font-bold mb-1">FRONTEND</div>
            <div className="text-slate-200">Next.js 15 App Router</div>
            <div className="text-[10px] text-slate-500 mt-1">React 19 + Tailwind CSS</div>
          </div>
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
            <div className="text-cyan-400 font-bold mb-1">RUNTIME</div>
            <div className="text-slate-200">Vercel Serverless</div>
            <div className="text-[10px] text-slate-500 mt-1">Edge Network + Route Handlers</div>
          </div>
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
            <div className="text-cyan-400 font-bold mb-1">ORM LAYER</div>
            <div className="text-slate-200">Prisma v6</div>
            <div className="text-[10px] text-slate-500 mt-1">Type-Safe Client & Migrations</div>
          </div>
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
            <div className="text-cyan-400 font-bold mb-1">DATABASE</div>
            <div className="text-slate-200">Neon PostgreSQL</div>
            <div className="text-[10px] text-slate-500 mt-1">Relational Pooling + SSL</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 sm:px-12 border-t border-slate-800/80 bg-gradient-to-b from-transparent to-cyan-950/20 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h3 className="text-2xl sm:text-3xl font-bold text-white">
            Ready to inspect the TSSB infrastructure?
          </h3>
          <p className="text-xs sm:text-sm text-slate-400">
            Access the centralized management console using preconfigured administrative credentials or create a new operator account.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all shadow-cyan-glow"
            >
              <span>Access Administration Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 sm:px-12 border-t border-slate-800 text-xs font-mono text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <TssbLogo size="sm" showText={false} />
          <span>TSSB Infrastructure Platform</span>
        </div>
        <div>
          Production-Ready Full-Stack Server Administration System
        </div>
        <div>
          PostgreSQL / Prisma / Next.js
        </div>
      </footer>
    </div>
  );
}
