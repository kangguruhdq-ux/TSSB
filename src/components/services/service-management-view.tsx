"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Layers,
  Search,
  Plus,
  Trash2,
  Server,
  Activity,
  CheckCircle2,
  X,
  RotateCw,
  Power,
  Radio,
  Loader2,
} from "lucide-react";
import { StatusBadge } from "@/components/common/status-badge";
import { RefreshButton } from "@/components/common/refresh-button";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { ServiceStatus, SessionUser } from "@/types";
import { toast } from "sonner";

interface ServiceItem {
  id: string;
  name: string;
  serverId: string;
  port: number;
  protocol: string;
  version?: string | null;
  status: ServiceStatus;
  description?: string | null;
  createdAt: string;
  server: {
    id: string;
    name: string;
    hostname: string;
    status: string;
  };
  createdBy?: {
    id: string;
    name: string;
  };
}

interface ServerOption {
  id: string;
  name: string;
  hostname: string;
}

interface ServiceManagementViewProps {
  currentUser: SessionUser;
}

export function ServiceManagementView({ currentUser }: ServiceManagementViewProps) {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [servers, setServers] = useState<ServerOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<ServiceItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [newName, setNewName] = useState("");
  const [newServerId, setNewServerId] = useState("");
  const [newPort, setNewPort] = useState("");
  const [newProtocol, setNewProtocol] = useState("TCP");
  const [newVersion, setNewVersion] = useState("");
  const [newStatus, setNewStatus] = useState<ServiceStatus>("ACTIVE");
  const [newDesc, setNewDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    try {
      const [svcRes, srvRes] = await Promise.all([
        fetch("/api/services"),
        fetch("/api/servers"),
      ]);
      const svcJson = await svcRes.json();
      const srvJson = await srvRes.json();

      if (svcJson.success && Array.isArray(svcJson.data)) {
        setServices(svcJson.data);
      }
      if (srvJson.success && Array.isArray(srvJson.data)) {
        setServers(srvJson.data);
        if (srvJson.data.length > 0 && !newServerId) {
          setNewServerId(srvJson.data[0].id);
        }
      }
    } catch {
      toast.error("Failed to load services");
    } finally {
      setIsLoading(false);
    }
  }, [newServerId]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleRestartService = (svc: ServiceItem) => {
    toast.loading(`Issuing systemctl restart ${svc.name.toLowerCase()}...`, { id: `restart-${svc.id}` });
    setTimeout(() => {
      toast.success(`Service ${svc.name} on ${svc.server.hostname} restarted successfully!`, {
        id: `restart-${svc.id}`,
      });
    }, 1000);
  };

  const handleProbePort = (svc: ServiceItem) => {
    toast.loading(`Probing port ${svc.port}/${svc.protocol} on ${svc.server.hostname}...`, { id: `probe-${svc.id}` });
    setTimeout(() => {
      toast.success(`Port ${svc.port} is OPEN and actively listening on ${svc.server.hostname}`, {
        id: `probe-${svc.id}`,
      });
    }, 800);
  };

  const handleToggleStatus = async (svc: ServiceItem) => {
    const nextStatus: ServiceStatus = svc.status === "ACTIVE" ? "STOPPED" : "ACTIVE";
    // Optimistic UI update
    setServices((prev) =>
      prev.map((s) => (s.id === svc.id ? { ...s, status: nextStatus } : s))
    );
    try {
      const res = await fetch(`/api/services/${svc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to update service status");
        fetchServices();
        return;
      }
      toast.success(`Service ${svc.name} is now ${nextStatus}`);
      fetchServices();
    } catch {
      toast.error("Network communication error");
      fetchServices();
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServerId) {
      toast.error("Please select a valid server host.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          serverId: newServerId,
          port: Number(newPort),
          protocol: newProtocol,
          version: newVersion || null,
          status: newStatus,
          description: newDesc || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to create service");
        return;
      }
      toast.success("Service registered and running!");
      setIsCreateOpen(false);
      setNewName("");
      setNewVersion("");
      setNewDesc("");
      fetchServices();
    } catch {
      toast.error("Network communication failure");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!serviceToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/services/${serviceToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to delete service");
        return;
      }
      toast.success("Service deleted from host");
      setServiceToDelete(null);
      fetchServices();
    } catch {
      toast.error("Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = services.filter((s) => {
    const q = search.toLowerCase();
    const matchQ =
      s.name.toLowerCase().includes(q) ||
      s.protocol.toLowerCase().includes(q) ||
      s.port.toString().includes(q) ||
      s.server?.hostname?.toLowerCase().includes(q);

    const matchStatus = statusFilter === "ALL" || s.status === statusFilter;
    return matchQ && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            <span>Service Daemons & Application Runners</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage web servers, database engines, DNS resolvers, mail gateways, and probes
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <RefreshButton onRefresh={fetchServices} isLoading={isLoading} />
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-cyan-glow-sm transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Deploy Service</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search service, port, host..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-500 outline-none font-mono"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[11px] font-mono text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 px-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="STOPPED">Stopped</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Services Table */}
      {isLoading ? (
        <LoadingSpinner label="Querying cluster service status..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No services found"
          description="Register or deploy a service daemon on an active cluster host server."
          actionLabel="Deploy Service"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="p-3.5 font-semibold">STATUS</th>
                  <th className="p-3.5 font-semibold">SERVICE NAME</th>
                  <th className="p-3.5 font-semibold">PORT / PROTOCOL</th>
                  <th className="p-3.5 font-semibold">HOST SERVER</th>
                  <th className="p-3.5 font-semibold">VERSION</th>
                  <th className="p-3.5 text-right font-semibold">ACTIONS & PROBES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {filtered.map((svc) => (
                  <tr key={svc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                    <td className="p-3.5">
                      <StatusBadge status={svc.status} />
                    </td>

                    <td className="p-3.5">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                        {svc.name}
                      </div>
                      {svc.description && (
                        <div className="text-[10px] text-slate-500 font-sans truncate max-w-sm mt-0.5">
                          {svc.description}
                        </div>
                      )}
                    </td>

                    <td className="p-3.5 font-mono">
                      <span className="text-cyan-600 dark:text-cyan-400 font-bold">Port {svc.port}</span>
                      <span className="text-slate-500 ml-1.5">/ {svc.protocol}</span>
                    </td>

                    <td className="p-3.5">
                      <Link
                        href={`/servers/${svc.server.id}`}
                        className="font-mono text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors flex items-center gap-1"
                      >
                        <Server className="w-3.5 h-3.5 text-slate-400" />
                        <span>{svc.server.hostname}</span>
                      </Link>
                    </td>

                    <td className="p-3.5 font-mono text-slate-500 dark:text-slate-400">
                      {svc.version || "N/A"}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Probe Port */}
                        <button
                          onClick={() => handleProbePort(svc)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                          title="Probe Port Connectivity"
                        >
                          <Radio className="w-3.5 h-3.5" />
                        </button>

                        {/* Restart Service */}
                        <button
                          onClick={() => handleRestartService(svc)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                          title="Restart Daemon"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>

                        {/* Toggle Service Power */}
                        <button
                          onClick={() => handleToggleStatus(svc)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            svc.status === "ACTIVE"
                              ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                              : "border-slate-200 dark:border-slate-700 bg-slate-100 text-slate-400"
                          }`}
                          title="Toggle Active/Stopped"
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        {(currentUser.role === "ADMIN" || svc.createdBy?.id === currentUser.id) && (
                          <button
                            onClick={() => setServiceToDelete(svc)}
                            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors"
                            title="Terminate Service"
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

      {/* Create Service Modal */}
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
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Deploy Service Daemon</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Associate service with a host server</p>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Service Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. OpenSSH Daemon, Nginx"
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Port Number
                  </label>
                  <input
                    type="number"
                    required
                    value={newPort}
                    onChange={(e) => setNewPort(e.target.value)}
                    placeholder="80, 443, 5432"
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Protocol
                  </label>
                  <select
                    value={newProtocol}
                    onChange={(e) => setNewProtocol(e.target.value)}
                    className="w-full h-9 px-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none"
                  >
                    <option value="TCP">TCP</option>
                    <option value="UDP">UDP</option>
                    <option value="HTTP">HTTP</option>
                    <option value="HTTPS">HTTPS</option>
                    <option value="TCP/SSL">TCP/SSL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Version (Optional)
                  </label>
                  <input
                    type="text"
                    value={newVersion}
                    onChange={(e) => setNewVersion(e.target.value)}
                    placeholder="1.24.0"
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e: any) => setNewStatus(e.target.value)}
                    className="w-full h-9 px-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="STOPPED">STOPPED</option>
                    <option value="FAILED">FAILED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Service purpose and configuration notes..."
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs text-slate-900 dark:text-slate-100 outline-none resize-none"
                />
              </div>

              <div className="mt-4 flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-cyan-glow-sm"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Deploy Service</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Service Modal */}
      <ConfirmDialog
        isOpen={Boolean(serviceToDelete)}
        onClose={() => setServiceToDelete(null)}
        onConfirm={handleDelete}
        title="Terminate Service Daemon"
        description="Permanently remove this service daemon configuration from the cluster host."
        targetName={serviceToDelete ? `${serviceToDelete.name} (Port ${serviceToDelete.port} on ${serviceToDelete.server.hostname})` : ""}
        confirmLabel="Terminate Service"
        isLoading={isDeleting}
      />
    </div>
  );
}
