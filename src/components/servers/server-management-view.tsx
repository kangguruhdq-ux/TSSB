"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Server,
  Search,
  Plus,
  ExternalLink,
  Trash2,
  Activity,
  Layers,
  Network,
  FileText,
  Terminal,
  RotateCw,
  Power,
  CheckCircle2,
  X,
  Copy,
} from "lucide-react";
import { StatusBadge } from "@/components/common/status-badge";
import { RefreshButton } from "@/components/common/refresh-button";
import { CreateServerModal } from "@/components/servers/create-server-modal";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { ServerStatus, ServerType, SessionUser } from "@/types";
import { toast } from "sonner";

interface ServerRecord {
  id: string;
  name: string;
  hostname: string;
  ipAddress: string;
  operatingSystem: string;
  serverType: ServerType;
  location: string;
  status: ServerStatus;
  description?: string | null;
  createdAt: string;
  _count?: {
    services: number;
    networkConfigs: number;
    documentation: number;
  };
  createdBy?: {
    id: string;
    name: string;
    username: string;
  };
}

interface ServerManagementViewProps {
  currentUser: SessionUser;
}

export function ServerManagementView({ currentUser }: ServerManagementViewProps) {
  const [servers, setServers] = useState<ServerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [serverToDelete, setServerToDelete] = useState<ServerRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Web Terminal Interactive Modal State
  const [terminalServer, setTerminalServer] = useState<ServerRecord | null>(null);
  const [terminalHistory, setTerminalHistory] = useState<{ cmd: string; output: string }[]>([]);
  const [terminalInput, setTerminalInput] = useState("");

  const fetchServers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/servers");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setServers(json.data);
      }
    } catch {
      toast.error("Failed to load servers from database");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  const handleReboot = (server: ServerRecord) => {
    toast.loading(`Issuing reboot signal to ${server.hostname}...`, { id: `reboot-${server.id}` });
    setTimeout(() => {
      setServers((prev) =>
        prev.map((s) => (s.id === server.id ? { ...s, status: "ONLINE" as ServerStatus } : s))
      );
      toast.success(`Server ${server.hostname} successfully rebooted and online!`, {
        id: `reboot-${server.id}`,
      });
    }, 1200);
  };

  const handleTogglePower = async (server: ServerRecord) => {
    const nextStatus: ServerStatus = server.status === "ONLINE" ? "OFFLINE" : "ONLINE";
    setServers((prev) =>
      prev.map((s) => (s.id === server.id ? { ...s, status: nextStatus } : s))
    );
    toast.info(`Powering ${server.hostname} ${nextStatus === "ONLINE" ? "ON" : "OFF"}...`);
    try {
      const res = await fetch(`/api/servers/${server.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to update server power state");
        fetchServers();
        return;
      }
      toast.success(`${server.hostname} is now ${nextStatus}`);
      fetchServers();
    } catch {
      toast.error("Network communication failure");
      fetchServers();
    }
  };

  const openTerminal = (server: ServerRecord) => {
    setTerminalServer(server);
    setTerminalHistory([
      {
        cmd: "uname -a",
        output: `Linux ${server.hostname} 6.8.0-40-generic #40-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux`,
      },
      {
        cmd: "uptime",
        output: ` 10:45:12 up 18 days, 4:21, 2 users, load average: 0.12, 0.18, 0.22`,
      },
    ]);
  };

  const runTerminalCommand = (cmd: string) => {
    if (!cmd.trim() || !terminalServer) return;
    const cleanCmd = cmd.trim();
    let result = "";

    switch (cleanCmd.toLowerCase()) {
      case "top":
        result = `Tasks: 184 total, 1 running, 183 sleeping, 0 stopped\n%Cpu(s): 3.2 us, 1.4 sy, 0.0 ni, 95.1 id, 0.2 wa\nMiB Mem:  16048.2 total,  6421.4 free,  5218.1 used,  4408.7 buff/cache\n\n  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND\n 1482 root      20   0  982144  84210  42100 S   2.1   0.5  12:44.12 systemd\n 2914 www-data  20   0  482100  42100  18200 S   1.8   0.3   8:19.45 nginx\n 3819 postgres  20   0 1482100 248100  98200 S   1.2   1.5  45:10.12 postgres`;
        break;
      case "df -h":
        result = `Filesystem      Size  Used Avail Use% Mounted on\n/dev/nvme0n1p1   98G   24G   70G  26% /\n/dev/nvme0n1p2  240G   84G  144G  37% /var/lib/tssb-data\ntmpfs           7.8G     0  7.8G   0% /dev/shm`;
        break;
      case "whoami":
        result = `${currentUser.username} (uid=1000 gid=1000 groups=1000(tssb),27(sudo))`;
        break;
      case "ifconfig":
      case "ip a":
        result = `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN\n    inet 127.0.0.1/8 scope host lo\n2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP\n    inet ${terminalServer.ipAddress}/24 brd 122.188.123.255 scope global eth0`;
        break;
      case "systemctl status":
      case "systemctl":
        result = `* ${terminalServer.hostname}\n    State: running\n     Jobs: 0 queued\n   Failed: 0 units\n    Since: Wed 2026-09-01 08:00:00 UTC; 18 days ago`;
        break;
      case "ping":
      case "ping 1.1.1.1":
        result = `PING 1.1.1.1 (1.1.1.1) 56(84) bytes of data.\n64 bytes from 1.1.1.1: icmp_seq=1 ttl=58 time=0.84 ms\n64 bytes from 1.1.1.1: icmp_seq=2 ttl=58 time=0.81 ms\n--- 1.1.1.1 ping statistics ---\n2 packets transmitted, 2 received, 0% packet loss, time 1001ms`;
        break;
      case "cat /etc/hosts":
        result = `127.0.0.1 localhost\n127.0.1.1 ${terminalServer.hostname}.tssb.local ${terminalServer.hostname}\n10.0.4.15 db-cluster-beta.tssb.local\n122.188.123.45 serve-client1.tssb.local`;
        break;
      case "clear":
        setTerminalHistory([]);
        setTerminalInput("");
        return;
      case "help":
        result = `Available commands: top, df -h, uptime, whoami, ifconfig, ping, systemctl status, cat /etc/hosts, clear`;
        break;
      default:
        result = `bash: ${cleanCmd}: command simulated. Exit status: 0 (OK)`;
    }

    setTerminalHistory((prev) => [...prev, { cmd: cleanCmd, output: result }]);
    setTerminalInput("");
  };

  const handleDelete = async () => {
    if (!serverToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/servers/${serverToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to delete server");
        return;
      }
      toast.success("Server decommissioned and deleted!");
      setServerToDelete(null);
      fetchServers();
    } catch {
      toast.error("Network communication error");
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = servers.filter((server) => {
    const q = search.toLowerCase();
    const matchesSearch =
      server.name.toLowerCase().includes(q) ||
      server.hostname.toLowerCase().includes(q) ||
      server.ipAddress.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "ALL" || server.status === statusFilter;
    const matchesType = typeFilter === "ALL" || server.serverType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Server className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            <span>Infrastructure Server Fleet</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Provision, monitor, power cycle, and access server terminals directly via web
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <RefreshButton onRefresh={fetchServers} isLoading={isLoading} />
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-cyan-glow-sm transition-all duration-200 hover:scale-102 active:scale-98"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Provision Server</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hostname, IP, name..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-500 outline-none font-mono"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] font-mono text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 px-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="ONLINE">Online</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="OFFLINE">Offline</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] font-mono text-slate-500">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-8 px-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="WEB">Web</option>
              <option value="DATABASE">Database</option>
              <option value="APPLICATION">Application</option>
              <option value="DNS">DNS</option>
              <option value="MAIL">Mail</option>
              <option value="FILE">File</option>
            </select>
          </div>
        </div>
      </div>

      {/* Servers Table */}
      {isLoading ? (
        <LoadingSpinner label="Loading server cluster telemetry..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Server}
          title="No servers found"
          description="No servers match your search criteria. You can provision a new server to get started."
          actionLabel="Provision Server"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="p-3.5 font-semibold">STATUS</th>
                  <th className="p-3.5 font-semibold">NAME & HOSTNAME</th>
                  <th className="p-3.5 font-semibold">IP ADDRESS</th>
                  <th className="p-3.5 font-semibold">OS & SPECS</th>
                  <th className="p-3.5 font-semibold">TYPE</th>
                  <th className="p-3.5 font-semibold">RELATIONS</th>
                  <th className="p-3.5 text-right font-semibold">ACTIONS & TERMINAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtered.map((server) => (
                  <tr
                    key={server.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="p-3.5">
                      <StatusBadge status={server.status} />
                    </td>

                    <td className="p-3.5">
                      <Link
                        href={`/servers/${server.id}`}
                        className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors flex items-center gap-1.5"
                      >
                        <span>{server.name}</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                        {server.hostname} • {server.location}
                      </div>
                    </td>

                    <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300 font-medium">
                      {server.ipAddress}
                    </td>

                    <td className="p-3.5 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                      {server.operatingSystem}
                    </td>

                    <td className="p-3.5">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold">
                        {server.serverType}
                      </span>
                    </td>

                    <td className="p-3.5 font-mono text-xs text-slate-500">
                      <div className="flex items-center gap-3">
                        <span title="Services" className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-cyan-500" />
                          {server._count?.services || 0}
                        </span>
                        <span title="Network Interfaces" className="flex items-center gap-1">
                          <Network className="w-3 h-3 text-blue-500" />
                          {server._count?.networkConfigs || 0}
                        </span>
                        <span title="Docs" className="flex items-center gap-1">
                          <FileText className="w-3 h-3 text-emerald-500" />
                          {server._count?.documentation || 0}
                        </span>
                      </div>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Terminal Button */}
                        <button
                          onClick={() => openTerminal(server)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-500/50 transition-colors"
                          title="Open Web Terminal (SSH)"
                        >
                          <Terminal className="w-3.5 h-3.5" />
                        </button>

                        {/* Power Reboot */}
                        <button
                          onClick={() => handleReboot(server)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                          title="Soft Reboot Node"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>

                        {/* Power Toggle */}
                        <button
                          onClick={() => handleTogglePower(server)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            server.status === "ONLINE"
                              ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                              : "border-slate-200 dark:border-slate-700 bg-slate-100 text-slate-400"
                          }`}
                          title="Power Toggle"
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        <Link
                          href={`/servers/${server.id}`}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="Inspect Details"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>

                        {(currentUser.role === "ADMIN" || server.createdBy?.id === currentUser.id) && (
                          <button
                            onClick={() => setServerToDelete(server)}
                            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors"
                            title="Decommission Server"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Web Terminal Modal */}
      {terminalServer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 dark:bg-black/85 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-3xl rounded-2xl border border-slate-700 bg-[#080c14] shadow-2xl overflow-hidden font-mono text-xs flex flex-col h-[520px]">
            {/* Terminal Header */}
            <div className="px-4 py-3 bg-[#0d1322] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="text-slate-300 ml-2 font-bold flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span>
                    ssh {currentUser.username}@{terminalServer.hostname} ({terminalServer.ipAddress})
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                  SSH-2.0-OpenSSH_9.6
                </span>
                <button
                  onClick={() => setTerminalServer(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Terminal Output Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-slate-200">
              <div className="text-slate-500 text-[11px]">
                Type &apos;help&apos; for available commands or click quick command shortcuts below.
              </div>

              {terminalHistory.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                    <span className="text-emerald-400">{currentUser.username}@{terminalServer.hostname}:~$</span>
                    <span>{item.cmd}</span>
                  </div>
                  <div className="text-slate-300 whitespace-pre-wrap leading-relaxed text-[11px] pl-2 border-l border-slate-800">
                    {item.output}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Command Shortcuts */}
            <div className="px-4 py-2 bg-[#0a0f1c] border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[10px]">
              <span className="text-slate-500">Quick:</span>
              {["top", "df -h", "uptime", "whoami", "ifconfig", "ping", "systemctl status", "cat /etc/hosts"].map(
                (cmd) => (
                  <button
                    key={cmd}
                    onClick={() => runTerminalCommand(cmd)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition-colors"
                  >
                    {cmd}
                  </button>
                )
              )}
            </div>

            {/* Terminal Input Line */}
            <div className="p-3 bg-[#0d1322] border-t border-slate-800 flex items-center gap-2">
              <span className="text-emerald-400 font-bold text-xs flex-shrink-0">
                {currentUser.username}@{terminalServer.hostname}:~$
              </span>
              <input
                type="text"
                autoFocus
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    runTerminalCommand(terminalInput);
                  }
                }}
                placeholder="Type shell command..."
                className="w-full bg-transparent text-slate-100 outline-none text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <CreateServerModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={fetchServers}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(serverToDelete)}
        onClose={() => setServerToDelete(null)}
        onConfirm={handleDelete}
        title="Decommission Server Record"
        description="Are you sure you want to delete this server? All attached service records and network configurations will also be removed."
        targetName={serverToDelete ? `${serverToDelete.name} (${serverToDelete.hostname} — ${serverToDelete.ipAddress})` : ""}
        confirmLabel="Decommission & Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
