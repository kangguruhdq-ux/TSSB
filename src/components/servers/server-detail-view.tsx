"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Server,
  Layers,
  Network,
  FileText,
  Activity,
  ArrowLeft,
  Edit2,
  Trash2,
  CheckCircle2,
  Cpu,
  Globe,
  Clock,
  User as UserIcon,
  Plus,
} from "lucide-react";
import { StatusBadge } from "@/components/common/status-badge";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { formatDateTime } from "@/lib/utils";
import { SessionUser } from "@/types";
import { toast } from "sonner";

interface ServerDetailProps {
  server: any;
  currentUser: SessionUser;
}

export function ServerDetailView({ server: initialServer, currentUser }: ServerDetailProps) {
  const router = useRouter();
  const [server, setServer] = useState(initialServer);
  const [activeTab, setActiveTab] = useState<"services" | "network" | "docs">("services");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(server.status);

  const canManage = currentUser.role === "ADMIN" || server.createdById === currentUser.id;

  const handleUpdateStatus = async () => {
    try {
      const res = await fetch(`/api/servers/${server.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Update failed");
        return;
      }
      toast.success("Server status updated in PostgreSQL!");
      setServer(data.data);
      setIsEditingStatus(false);
    } catch {
      toast.error("Network communication error");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/servers/${server.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Delete failed");
        return;
      }
      toast.success("Server decommissioned");
      router.push("/servers");
      router.refresh();
    } catch {
      toast.error("Error decommissioning server");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/servers"
          className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Servers</span>
        </Link>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingStatus(!isEditingStatus)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-mono shadow-xs"
            >
              <Edit2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Change Status</span>
            </button>
            <button
              onClick={() => setIsConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-xs font-mono"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Decommission</span>
            </button>
          </div>
        )}
      </div>

      {/* Status Editor Banner if triggered */}
      {isEditingStatus && (
        <div className="p-3.5 rounded-xl border border-cyan-500/40 bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-700 dark:text-slate-300">Select New Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-8 px-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-100 outline-none"
            >
              <option value="ONLINE">ONLINE (Healthy)</option>
              <option value="MAINTENANCE">MAINTENANCE (Degraded)</option>
              <option value="OFFLINE">OFFLINE (Down)</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingStatus(false)}
              className="px-3 py-1 rounded text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateStatus}
              className="px-3 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
            >
              Save in Database
            </button>
          </div>
        </div>
      )}

      {/* Server Header Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] p-6 shadow-sm dark:shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-500/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-xs">
              <Server className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {server.name}
                </h1>
                <StatusBadge status={server.status} />
                <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 border border-slate-200 dark:border-slate-700">
                  {server.serverType}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
                {server.hostname} • IP: {server.ipAddress} • {server.location}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-500 dark:text-slate-400">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">PROVISIONED BY</div>
              <div className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">
                @{server.createdBy?.username || "admin"}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">REGISTERED DATE</div>
              <div className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">
                {formatDateTime(server.createdAt)}
              </div>
            </div>
          </div>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs font-mono">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase">OPERATING SYSTEM</span>
            <div className="text-slate-800 dark:text-slate-200 font-semibold mt-1">{server.operatingSystem}</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase">LOCATION / RACK</span>
            <div className="text-slate-800 dark:text-slate-200 font-semibold mt-1">{server.location}</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase">ATTACHED SERVICES</span>
            <div className="text-cyan-600 dark:text-cyan-400 font-bold mt-1">{server.services?.length || 0} active</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase">NIC INTERFACES</span>
            <div className="text-cyan-600 dark:text-cyan-400 font-bold mt-1">{server.networkConfigs?.length || 0} configured</div>
          </div>
        </div>

        {server.description && (
          <div className="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {server.description}
          </div>
        )}
      </div>

      {/* Relations Tabs */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab("services")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === "services"
                ? "bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Attached Services ({server.services?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("network")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === "network"
                ? "bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Network Interfaces ({server.networkConfigs?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("docs")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === "docs"
                ? "bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Runbooks & Docs ({server.documentation?.length || 0})</span>
          </button>
        </div>

        {/* Tab 1: Services */}
        {activeTab === "services" && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] overflow-hidden p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold tracking-wider uppercase text-slate-900 dark:text-slate-200">
                Attached Daemons & Microservices
              </h3>
              <Link
                href="/services"
                className="text-xs font-mono text-cyan-600 dark:text-cyan-400 hover:text-cyan-500"
              >
                Open Services Console →
              </Link>
            </div>

            {server.services && server.services.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {server.services.map((svc: any) => (
                  <div
                    key={svc.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{svc.name}</span>
                        <StatusBadge status={svc.status} />
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                        Port {svc.port} • Protocol: {svc.protocol} {svc.version && `• v${svc.version}`}
                      </div>
                      {svc.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{svc.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs font-mono text-slate-400">
                No services currently attached to this host.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Network Configurations */}
        {activeTab === "network" && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] overflow-hidden p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold tracking-wider uppercase text-slate-900 dark:text-slate-200">
                Bound Network Interfaces & IP Allocation
              </h3>
              <Link
                href="/network"
                className="text-xs font-mono text-cyan-600 dark:text-cyan-400 hover:text-cyan-500"
              >
                Open Network Console →
              </Link>
            </div>

            {server.networkConfigs && server.networkConfigs.length > 0 ? (
              <div className="space-y-2.5">
                {server.networkConfigs.map((net: any) => (
                  <div
                    key={net.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs"
                  >
                    <div>
                      <div className="text-cyan-600 dark:text-cyan-400 font-bold">{net.interfaceName}</div>
                      <div className="text-slate-800 dark:text-slate-300 mt-0.5">
                        IP: {net.ipAddress} / Subnet: {net.subnetMask}
                      </div>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 text-right">
                      <div>Gateway: {net.gateway}</div>
                      <div className="text-[11px] text-slate-400">
                        DNS: {net.dnsPrimary} {net.vlan && `• VLAN ${net.vlan}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs font-mono text-slate-400">
                No network interfaces bound.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Documentation */}
        {activeTab === "docs" && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] overflow-hidden p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold tracking-wider uppercase text-slate-900 dark:text-slate-200">
                Associated Runbooks & Installation Guides
              </h3>
              <Link
                href="/documentation"
                className="text-xs font-mono text-cyan-600 dark:text-cyan-400 hover:text-cyan-500"
              >
                Browse Documentation Library →
              </Link>
            </div>

            {server.documentation && server.documentation.length > 0 ? (
              <div className="space-y-2.5">
                {server.documentation.map((doc: any) => (
                  <Link
                    key={doc.id}
                    href={`/documentation/${doc.id}`}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:border-cyan-500/50 flex items-center justify-between gap-3 group transition-colors shadow-2xs"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                        {doc.title}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                        Category: {doc.category} • Updated: {formatDateTime(doc.updatedAt)}
                      </div>
                    </div>
                    <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400">Read Guide →</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs font-mono text-slate-400">
                No runbooks tagged for this server.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Decommission Server Host"
        description="Permanently delete this server from PostgreSQL. Attached services and network configurations will be cascaded."
        targetName={`${server.name} (${server.hostname})`}
        confirmLabel="Confirm Decommission"
        isLoading={isDeleting}
      />
    </div>
  );
}
