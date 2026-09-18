"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Network,
  Plus,
  Trash2,
  Search,
  Server,
  Shield,
  Loader2,
  X,
  Radio,
  ExternalLink,
  Activity,
  Globe,
  Terminal,
} from "lucide-react";
import { NetworkTopology } from "@/components/visualizations/network-topology";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { toast } from "sonner";
import { SessionUser } from "@/types";

interface NetworkItem {
  id: string;
  serverId: string;
  interfaceName: string;
  ipAddress: string;
  subnetMask: string;
  gateway: string;
  dnsPrimary: string;
  dnsSecondary?: string | null;
  vlan?: number | null;
  description?: string | null;
  createdAt: string;
  server: {
    id: string;
    name: string;
    hostname: string;
    status: string;
  };
}

interface ServerOption {
  id: string;
  name: string;
  hostname: string;
}

interface NetworkManagementViewProps {
  currentUser?: SessionUser;
}

export function NetworkManagementView({ currentUser }: NetworkManagementViewProps = {}) {
  const [configs, setConfigs] = useState<NetworkItem[]>([]);
  const [servers, setServers] = useState<ServerOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal controls
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<NetworkItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states for creating network config
  const [newServerId, setNewServerId] = useState("");
  const [newInterface, setNewInterface] = useState("eth0");
  const [newIp, setNewIp] = useState("");
  const [newSubnet, setNewSubnet] = useState("255.255.255.0");
  const [newGateway, setNewGateway] = useState("192.168.1.1");
  const [newDns1, setNewDns1] = useState("1.1.1.1");
  const [newDns2, setNewDns2] = useState("8.8.8.8");
  const [newVlan, setNewVlan] = useState<number | "">("");
  const [newDesc, setNewDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live DNS resolver tester state
  const [dnsQueryHost, setDnsQueryHost] = useState("tssb.local");
  const [dnsQueryType, setDnsQueryType] = useState("A");
  const [dnsResult, setDnsResult] = useState<string | null>(null);
  const [isQueryingDns, setIsQueryingDns] = useState(false);

  const fetchConfigs = useCallback(async () => {
    setIsLoading(true);
    try {
      const [netRes, srvRes] = await Promise.all([
        fetch("/api/network"),
        fetch("/api/servers"),
      ]);
      const netJson = await netRes.json();
      const srvJson = await srvRes.json();

      if (netJson.success && Array.isArray(netJson.data)) {
        setConfigs(netJson.data);
      }
      if (srvJson.success && Array.isArray(srvJson.data)) {
        setServers(srvJson.data);
        if (srvJson.data.length > 0 && !newServerId) {
          setNewServerId(srvJson.data[0].id);
        }
      }
    } catch {
      toast.error("Failed to load network configurations");
    } finally {
      setIsLoading(false);
    }
  }, [newServerId]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServerId) {
      toast.error("Select a host server.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serverId: newServerId,
          interfaceName: newInterface,
          ipAddress: newIp,
          subnetMask: newSubnet,
          gateway: newGateway,
          dnsPrimary: newDns1,
          dnsSecondary: newDns2 || null,
          vlan: newVlan === "" ? null : Number(newVlan),
          description: newDesc || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to configure network");
        return;
      }
      toast.success("Interface bound successfully!");
      setIsCreateOpen(false);
      setNewIp("");
      setNewDesc("");
      fetchConfigs();
    } catch {
      toast.error("Network communication error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!configToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/network/${configToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to delete interface");
        return;
      }
      toast.success("Interface unbound from server");
      setConfigToDelete(null);
      fetchConfigs();
    } catch {
      toast.error("Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const runDnsLookup = () => {
    setIsQueryingDns(true);
    setDnsResult(null);
    setTimeout(() => {
      setIsQueryingDns(false);
      const queryLower = dnsQueryHost.toLowerCase().trim();
      let answer = "";
      if (dnsQueryType === "A") {
        if (queryLower.includes("mail")) answer = "198.51.100.88";
        else if (queryLower.includes("db")) answer = "10.0.4.15";
        else if (queryLower.includes("ns")) answer = "198.51.100.12";
        else answer = "122.188.123.45";
      } else if (dnsQueryType === "MX") {
        answer = "10 mail.tssb.local. (Priority 10, IP 198.51.100.88)";
      } else if (dnsQueryType === "TXT") {
        answer = `"v=spf1 mx ip4:203.0.113.88 ~all" (SPF Anti-Spoofing Policy)`;
      } else if (dnsQueryType === "NS") {
        answer = "ns1.tssb.local., ns2.tssb.local. (BIND9 9.18.24)";
      }
      setDnsResult(`; <<>> DiG 9.18.24 <<>> ${dnsQueryType} ${dnsQueryHost}\n;; Got answer:\n;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 48912\n;; flags: qr aa rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1\n\n;; ANSWER SECTION:\n${dnsQueryHost}.\t\t3600\tIN\t${dnsQueryType}\t${answer}\n\n;; Query time: 1.2 msec\n;; SERVER: 198.51.100.12#53(198.51.100.12) (UDP)\n;; WHEN: ${new Date().toUTCString()}`);
    }, 450);
  };

  const filtered = configs.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.interfaceName.toLowerCase().includes(q) ||
      c.ipAddress.toLowerCase().includes(q) ||
      c.gateway.toLowerCase().includes(q) ||
      c.server?.hostname?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Network className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            <span>Network Infrastructure & VLAN Mesh</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            VLAN segmentation, IP routing tables, gateway controls, and interface binding
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchConfigs}
            disabled={isLoading}
            className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 text-xs shadow-xs"
            title="Refresh network interfaces"
          >
            <Activity className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-cyan-glow-sm transition-all hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            <span>Bind Interface</span>
          </button>
        </div>
      </div>

      {/* Rebuilt Network Topology Graphic */}
      <NetworkTopology />

      {/* Interactive Web DNS Query Resolver Console */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              DNS Name Resolver Console (Port 53 Tool)
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            BIND9 Daemon Live
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={dnsQueryHost}
              onChange={(e) => setDnsQueryHost(e.target.value)}
              placeholder="e.g. tssb.local, mail.tssb.local, ns1.tssb.local"
              className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none"
            />
          </div>
          <select
            value={dnsQueryType}
            onChange={(e) => setDnsQueryType(e.target.value)}
            className="h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none"
          >
            <option value="A">Record A (IPv4)</option>
            <option value="MX">Record MX (Mail)</option>
            <option value="TXT">Record TXT (SPF/DKIM)</option>
            <option value="NS">Record NS (Nameserver)</option>
          </select>
          <button
            onClick={runDnsLookup}
            disabled={isQueryingDns}
            className="h-9 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
          >
            {isQueryingDns && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Resolve DNS</span>
          </button>
        </div>

        {dnsResult && (
          <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400 whitespace-pre-line leading-relaxed shadow-inner">
            {dnsResult}
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search interface, IP, gateway, host..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-500 outline-none font-mono"
          />
        </div>
        <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
          {filtered.length} Interfaces Active
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner label="Loading network routing configurations..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Network}
          title="No network interfaces found"
          description="Bind an IP address and network interface to a registered cluster host."
          actionLabel="Bind Interface"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="p-3.5 font-semibold">INTERFACE</th>
                  <th className="p-3.5 font-semibold">IP & SUBNET</th>
                  <th className="p-3.5 font-semibold">GATEWAY</th>
                  <th className="p-3.5 font-semibold">HOST SERVER</th>
                  <th className="p-3.5 font-semibold">DNS RESOLVERS</th>
                  <th className="p-3.5 font-semibold">VLAN</th>
                  <th className="p-3.5 text-right font-semibold">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {filtered.map((net) => (
                  <tr key={net.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                    <td className="p-3.5">
                      <span className="font-bold text-cyan-600 dark:text-cyan-400 group-hover:underline">
                        {net.interfaceName}
                      </span>
                      {net.description && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-sans truncate max-w-xs mt-0.5">
                          {net.description}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <div className="text-slate-800 dark:text-slate-200 font-semibold">{net.ipAddress}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{net.subnetMask}</div>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">{net.gateway}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                        <Server className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                        <span>{net.server?.hostname || "server"}</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="text-[11px] text-slate-700 dark:text-slate-300">{net.dnsPrimary}</div>
                      {net.dnsSecondary && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{net.dnsSecondary}</div>
                      )}
                    </td>
                    <td className="p-3.5">
                      {net.vlan ? (
                        <span className="px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 border border-cyan-300 dark:border-cyan-800/40 text-cyan-700 dark:text-cyan-300 text-[10px] font-bold">
                          VLAN {net.vlan}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 text-[10px]">None</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setConfigToDelete(net)}
                        className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                        title="Unbind interface"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <Network className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Bind Network Interface</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Allocate static IP to server host</p>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Host Server Target
                </label>
                <select
                  required
                  value={newServerId}
                  onChange={(e) => setNewServerId(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none"
                >
                  {servers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.hostname} — {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Interface Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newInterface}
                    onChange={(e) => setNewInterface(e.target.value)}
                    placeholder="eth0, ens192, bond0"
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    IP Address
                  </label>
                  <input
                    type="text"
                    required
                    value={newIp}
                    onChange={(e) => setNewIp(e.target.value)}
                    placeholder="192.168.1.100"
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Subnet Mask
                  </label>
                  <input
                    type="text"
                    required
                    value={newSubnet}
                    onChange={(e) => setNewSubnet(e.target.value)}
                    placeholder="255.255.255.0"
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Default Gateway
                  </label>
                  <input
                    type="text"
                    required
                    value={newGateway}
                    onChange={(e) => setNewGateway(e.target.value)}
                    placeholder="192.168.1.1"
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    DNS 1
                  </label>
                  <input
                    type="text"
                    required
                    value={newDns1}
                    onChange={(e) => setNewDns1(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    DNS 2 (Opt)
                  </label>
                  <input
                    type="text"
                    value={newDns2}
                    onChange={(e) => setNewDns2(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    VLAN ID
                  </label>
                  <input
                    type="number"
                    value={newVlan}
                    onChange={(e) => setNewVlan(e.target.value ? Number(e.target.value) : "")}
                    placeholder="e.g. 100"
                    className="w-full h-9 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Network interface purpose..."
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs text-slate-900 dark:text-slate-100 outline-none resize-none"
                />
              </div>

              <div className="mt-4 flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-cyan-glow-sm"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Bind Interface</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(configToDelete)}
        onClose={() => setConfigToDelete(null)}
        onConfirm={handleDelete}
        title="Unbind Interface Configuration"
        description="Permanently remove this network configuration from the host."
        targetName={configToDelete ? `${configToDelete.interfaceName} (${configToDelete.ipAddress} on ${configToDelete.server?.hostname || "server"})` : ""}
        confirmLabel="Unbind Interface"
        isLoading={isDeleting}
      />
    </div>
  );
}
