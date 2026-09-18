"use client";

import React, { useState } from "react";
import {
  Network,
  Server,
  Database,
  Globe,
  Mail,
  Shield,
  Layers,
  Cpu,
  Activity,
  HardDrive,
  CheckCircle2,
  X,
  ExternalLink,
  Copy,
  Radio,
} from "lucide-react";
import { toast } from "sonner";

interface TopologyNode {
  id: string;
  name: string;
  hostname: string;
  ip: string;
  subnet: string;
  gateway: string;
  vlan: string;
  vlanId: number;
  type: "GATEWAY" | "SWITCH" | "WEB" | "APP" | "DATABASE" | "DNS_MAIL" | "STORAGE";
  status: "ONLINE" | "ACTIVE" | "STANDBY";
  latency: string;
  throughput: string;
  services: string[];
  ports: number[];
  color: string;
}

const TOPOLOGY_NODES: TopologyNode[] = [
  {
    id: "node-gw",
    name: "Edge Gateway & Firewall",
    hostname: "gw-core.tssb.local",
    ip: "203.0.113.1",
    subnet: "255.255.255.248",
    gateway: "203.0.113.254",
    vlan: "WAN Uplink",
    vlanId: 1,
    type: "GATEWAY",
    status: "ONLINE",
    latency: "0.4 ms",
    throughput: "148.2 MB/s",
    services: ["iptables / nftables", "NAT Traversal", "DDoS Mitigation"],
    ports: [80, 443],
    color: "#06B6D4",
  },
  {
    id: "node-switch",
    name: "Core Distribution Switch",
    hostname: "sw-dist-01",
    ip: "192.168.1.1",
    subnet: "255.255.255.0",
    gateway: "203.0.113.1",
    vlan: "VLAN Root (Trunk 802.1Q)",
    vlanId: 100,
    type: "SWITCH",
    status: "ONLINE",
    latency: "0.1 ms",
    throughput: "1.2 GB/s",
    services: ["802.1Q VLAN Trunking", "LACP Link Aggregation", "IGMP Snooping"],
    ports: [1, 2, 3, 4, 24],
    color: "#3B82F6",
  },
  {
    id: "node-web",
    name: "Web Gateway Alpha",
    hostname: "serve-client1",
    ip: "122.188.123.45",
    subnet: "255.255.255.0",
    gateway: "122.188.123.1",
    vlan: "DMZ Zone",
    vlanId: 10,
    type: "WEB",
    status: "ONLINE",
    latency: "1.2 ms",
    throughput: "68.4 MB/s",
    services: ["Nginx Reverse Proxy", "Certbot SSL", "Node Exporter"],
    ports: [80, 443, 9100],
    color: "#06B6D4",
  },
  {
    id: "node-app",
    name: "Application Runner Node",
    hostname: "serve-client2",
    ip: "122.128.18.238",
    subnet: "255.255.255.0",
    gateway: "122.128.18.1",
    vlan: "Application Zone",
    vlanId: 20,
    type: "APP",
    status: "ONLINE",
    latency: "0.9 ms",
    throughput: "94.1 MB/s",
    services: ["Next.js Engine", "Docker Containerd", "vsftpd Daemon"],
    ports: [3000, 21, 22],
    color: "#8B5CF6",
  },
  {
    id: "node-db",
    name: "Database Primary Enclave",
    hostname: "db-cluster-beta",
    ip: "10.0.4.15",
    subnet: "255.255.255.0",
    gateway: "10.0.4.1",
    vlan: "Secure Storage Enclave",
    vlanId: 200,
    type: "DATABASE",
    status: "ONLINE",
    latency: "0.6 ms",
    throughput: "45.8 MB/s",
    services: ["PostgreSQL 16.2", "pg_stat_statements", "Prisma Connector"],
    ports: [5432],
    color: "#10B981",
  },
  {
    id: "node-dns-mail",
    name: "Authoritative DNS & Mail",
    hostname: "serve-client3",
    ip: "198.51.100.12",
    subnet: "255.255.255.0",
    gateway: "198.51.100.1",
    vlan: "Services & Routing",
    vlanId: 30,
    type: "DNS_MAIL",
    status: "ONLINE",
    latency: "1.4 ms",
    throughput: "32.1 MB/s",
    services: ["BIND9 DNS", "Postfix SMTP", "Dovecot IMAP"],
    ports: [53, 25, 993],
    color: "#F59E0B",
  },
];

export function NetworkTopology() {
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);

  const handlePing = (ip: string) => {
    setIsPinging(true);
    setPingResult(null);
    setTimeout(() => {
      setIsPinging(false);
      const rtt1 = (Math.random() * 0.8 + 0.3).toFixed(2);
      const rtt2 = (Math.random() * 0.7 + 0.3).toFixed(2);
      const rtt3 = (Math.random() * 0.6 + 0.3).toFixed(2);
      setPingResult(
        `PING ${ip} (56 bytes of data):\n64 bytes from ${ip}: icmp_seq=1 ttl=64 time=${rtt1} ms\n64 bytes from ${ip}: icmp_seq=2 ttl=64 time=${rtt2} ms\n64 bytes from ${ip}: icmp_seq=3 ttl=64 time=${rtt3} ms\n--- ${ip} ping statistics ---\n3 packets transmitted, 3 received, 0% packet loss`
      );
    }, 600);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied to clipboard: ${text}`);
  };

  return (
    <div className="relative w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322]/90 p-5 shadow-sm dark:shadow-xl transition-all">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-wider uppercase text-slate-900 dark:text-slate-100">
              NETWORK TOPOLOGY & VLAN MESH
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Interactive 802.1Q segmented distribution backbone
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
              100% ROUTABLE
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            5 Active Subnets
          </span>
        </div>
      </div>

      {/* Interactive Topology Graph Visualizer */}
      <div className="relative w-full py-2 flex flex-col items-center">
        {/* Tier 1: Core Gateway WAN */}
        <div className="w-full flex justify-center mb-1">
          <button
            onClick={() => {
              setSelectedNode(TOPOLOGY_NODES[0]);
              setPingResult(null);
            }}
            className="group relative flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-cyan-400/40 hover:border-cyan-500 shadow-sm hover:shadow-cyan-glow-sm hover:-translate-y-0.5 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-cyan-600 dark:text-cyan-400 font-bold flex items-center gap-1.5">
                <span>CORE WAN GATEWAY</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                gw-core.tssb.local
              </div>
              <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                203.0.113.1 (Firewall / NAT)
              </div>
            </div>
          </button>
        </div>

        {/* Animated Connector 1: Gateway to Switch */}
        <div className="w-0.5 h-6 bg-gradient-to-b from-cyan-400 to-blue-500 relative">
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
        </div>

        {/* Tier 2: Core Distribution Switch */}
        <div className="w-full flex justify-center mb-1">
          <button
            onClick={() => {
              setSelectedNode(TOPOLOGY_NODES[1]);
              setPingResult(null);
            }}
            className="group relative flex items-center gap-3 px-5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-blue-400/40 hover:border-blue-500 shadow-sm hover:shadow-cyan-glow-sm hover:-translate-y-0.5 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/40 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1.5">
                <span>VLAN ROOT / DISTRIBUTION SWITCH</span>
                <span className="px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-[9px] text-blue-700 dark:text-blue-300">
                  802.1Q TRUNK
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                sw-dist-01.tssb.local
              </div>
              <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                192.168.1.1 (Gigabit Core Mesh)
              </div>
            </div>
          </button>
        </div>

        {/* Animated Horizontal Distribution Bus */}
        <div className="w-full max-w-2xl flex flex-col items-center my-1 px-4">
          <div className="w-0.5 h-4 bg-blue-500" />
          <div className="w-full h-0.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-amber-500 relative">
            <span className="absolute left-1/4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="absolute left-3/4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          </div>
          <div className="w-full flex justify-between px-6 sm:px-10">
            <div className="w-0.5 h-4 bg-cyan-500" />
            <div className="w-0.5 h-4 bg-purple-500" />
            <div className="w-0.5 h-4 bg-emerald-500" />
            <div className="w-0.5 h-4 bg-amber-500" />
          </div>
        </div>

        {/* Tier 3: Segmented Cluster Nodes Grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-1">
          {/* Node: Web Cluster (VLAN 10) */}
          <button
            onClick={() => {
              setSelectedNode(TOPOLOGY_NODES[2]);
              setPingResult(null);
            }}
            className="group p-3.5 rounded-xl border border-cyan-500/30 bg-slate-50/70 dark:bg-slate-900/60 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20 hover:border-cyan-500 transition-all text-left shadow-xs hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-bold">
                VLAN 10 DMZ
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <Server className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                Web Gateway Alpha
              </div>
            </div>
            <div className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-medium truncate">
              122.188.123.45
            </div>
            <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              <span>Port: 80, 443</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">1.2ms</span>
            </div>
          </button>

          {/* Node: Application Node (VLAN 20) */}
          <button
            onClick={() => {
              setSelectedNode(TOPOLOGY_NODES[3]);
              setPingResult(null);
            }}
            className="group p-3.5 rounded-xl border border-purple-500/30 bg-slate-50/70 dark:bg-slate-900/60 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 hover:border-purple-500 transition-all text-left shadow-xs hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold">
                VLAN 20 APPS
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                Application Node 01
              </div>
            </div>
            <div className="text-[11px] font-mono text-purple-600 dark:text-purple-400 font-medium truncate">
              122.128.18.238
            </div>
            <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              <span>Next.js + vsftpd</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">0.9ms</span>
            </div>
          </button>

          {/* Node: Database Cluster (VLAN 200) */}
          <button
            onClick={() => {
              setSelectedNode(TOPOLOGY_NODES[4]);
              setPingResult(null);
            }}
            className="group p-3.5 rounded-xl border border-emerald-500/30 bg-slate-50/70 dark:bg-slate-900/60 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 hover:border-emerald-500 transition-all text-left shadow-xs hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                VLAN 200 ENCLAVE
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                Database Primary
              </div>
            </div>
            <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-medium truncate">
              10.0.4.15
            </div>
            <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              <span>PostgreSQL 16.2</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">0.6ms</span>
            </div>
          </button>

          {/* Node: DNS & Mail (VLAN 30) */}
          <button
            onClick={() => {
              setSelectedNode(TOPOLOGY_NODES[5]);
              setPingResult(null);
            }}
            className="group p-3.5 rounded-xl border border-amber-500/30 bg-slate-50/70 dark:bg-slate-900/60 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 hover:border-amber-500 transition-all text-left shadow-xs hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold">
                VLAN 30 ROUTING
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                Authoritative DNS / Mail
              </div>
            </div>
            <div className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-medium truncate">
              198.51.100.12
            </div>
            <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              <span>BIND9 + Postfix</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">1.4ms</span>
            </div>
          </button>
        </div>

        {/* Tier 4: Bottom Protocol & Integration Bar */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">Integrated Protocols:</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">
              HTTP/HTTPS
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">
              FTP/SFTP
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">
              SMTP/IMAP
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">
              DNS Port 53
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">
              Postgres 5432
            </span>
          </div>

          <div className="text-cyan-600 dark:text-cyan-400 font-medium">
            Click any node to inspect telemetry & ping host
          </div>
        </div>
      </div>

      {/* Node Inspection Modal */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs"
                  style={{ backgroundColor: `${selectedNode.color}20`, color: selectedNode.color }}
                >
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono font-bold uppercase text-cyan-600 dark:text-cyan-400">
                    {selectedNode.vlan} (VLAN {selectedNode.vlanId})
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {selectedNode.name}
                  </h4>
                  <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {selectedNode.hostname}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Telemetry Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] font-mono text-slate-500 uppercase">IP Address</div>
                <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between mt-0.5">
                  <span>{selectedNode.ip}</span>
                  <button
                    onClick={() => copyToClipboard(selectedNode.ip)}
                    title="Copy IP"
                    className="text-slate-400 hover:text-cyan-500"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] font-mono text-slate-500 uppercase">Gateway</div>
                <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {selectedNode.gateway}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] font-mono text-slate-500 uppercase">Subnet Mask</div>
                <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {selectedNode.subnet}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] font-mono text-slate-500 uppercase">Avg Latency</div>
                <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {selectedNode.latency}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] font-mono text-slate-500 uppercase">Throughput</div>
                <div className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 mt-0.5">
                  {selectedNode.throughput}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] font-mono text-slate-500 uppercase">Node Status</div>
                <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{selectedNode.status}</span>
                </div>
              </div>
            </div>

            {/* Active Services on Node */}
            <div className="mb-4">
              <div className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">
                Active Daemons & Services:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedNode.services.map((svc, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-mono flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>{svc}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Interactive Ping Tool Output */}
            {pingResult && (
              <div className="mb-4 p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[10px] text-emerald-400 whitespace-pre-line leading-relaxed shadow-inner">
                {pingResult}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => handlePing(selectedNode.ip)}
                disabled={isPinging}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors disabled:opacity-50"
              >
                <Activity className={`w-3.5 h-3.5 ${isPinging ? "animate-spin" : ""}`} />
                <span>{isPinging ? "Pinging Node..." : "Test ICMP Ping"}</span>
              </button>

              <button
                onClick={() => setSelectedNode(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
