"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Settings,
  Database,
  Shield,
  Server,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
  Cpu,
  Download,
  Save,
  Loader2,
  Megaphone,
  HardDrive,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { RefreshButton } from "@/components/common/refresh-button";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

export function AdminSettingsView() {
  const [health, setHealth] = useState<any>(null);
  const [settings, setSettings] = useState<any>({
    platformName: "TSSB Infrastructure Platform",
    maintenanceMode: false,
    allowRegistration: true,
    loginSuspended: false,
    loginSuspensionMessage: "Akses login pengguna saat ini ditangguhkan sementara oleh Administrator untuk pemeliharaan sistem. Silakan coba lagi nanti.",
    sessionTimeoutMinutes: 60,
    announcementText: "System operational. All 5 cluster servers and network routes are active.",
    showAnnouncement: true,
    ftpPort: 21,
    smtpPort: 587,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isClearTrashOpen, setIsClearTrashOpen] = useState(false);
  const [isDbActionRunning, setIsDbActionRunning] = useState(false);

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const [healthRes, settingsRes] = await Promise.all([
        fetch("/api/admin/settings/health"),
        fetch("/api/admin/settings"),
      ]);
      const healthJson = await healthRes.json();
      const settingsJson = await settingsRes.json();

      if (healthJson.success) setHealth(healthJson.data);
      if (settingsJson.success && settingsJson.data) setSettings(settingsJson.data);
    } catch {
      toast.error("Health check network timeout");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to update settings");
        return;
      }
      toast.success("Platform settings updated and persisted!");
    } catch {
      toast.error("Network communication failure");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadBackup = () => {
    window.open("/api/admin/settings/backup", "_blank");
    toast.success("Triggered complete database backup download");
  };

  const handleRefreshDb = async () => {
    setIsDbActionRunning(true);
    try {
      const res = await fetch("/api/admin/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REFRESH" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Database connection refreshed!");
        fetchConfig();
      } else {
        toast.error(data.message || "Failed to refresh database");
      }
    } catch {
      toast.error("Network communication failure");
    } finally {
      setIsDbActionRunning(false);
    }
  };

  const handleResetCluster = async () => {
    setIsDbActionRunning(true);
    try {
      const res = await fetch("/api/admin/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESET_SEEDED" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Cluster demonstration state restored!");
        setIsResetOpen(false);
        fetchConfig();
      } else {
        toast.error(data.message || "Failed to reset cluster state");
      }
    } catch {
      toast.error("Network communication failure");
    } finally {
      setIsDbActionRunning(false);
    }
  };

  const handleClearTrashLogs = async () => {
    setIsDbActionRunning(true);
    try {
      const res = await fetch("/api/admin/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CLEAR_TRASH_AND_LOGS" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Storage cleanup completed!");
        setIsClearTrashOpen(false);
        fetchConfig();
      } else {
        toast.error(data.message || "Failed to purge storage");
      }
    } catch {
      toast.error("Network communication failure");
    } finally {
      setIsDbActionRunning(false);
    }
  };

  const isDbConnected = health?.database?.status === "CONNECTED";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            <span>Platform Configuration & System Health</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Global cluster policies, maintenance toggles, database health, and disaster backups
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadBackup}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-cyan-500/40 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 font-semibold text-xs transition-colors hover:bg-cyan-100"
          >
            <Download className="w-4 h-4" />
            <span>Download Backup (JSON)</span>
          </button>
          <RefreshButton onRefresh={fetchConfig} isLoading={isLoading} />
        </div>
      </div>

      {isLoading && !health ? (
        <LoadingSpinner label="Testing serverless database connection..." />
      ) : (
        <div className="space-y-6">
          {/* Platform Settings Form */}
          <form
            onSubmit={handleSaveSettings}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] p-6 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Global Platform Settings
                </h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                ROOT CONFIG
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Platform Name
                </label>
                <input
                  type="text"
                  value={settings.platformName || ""}
                  onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Session Timeout (Minutes)
                </label>
                <input
                  type="number"
                  value={settings.sessionTimeoutMinutes || 60}
                  onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: Number(e.target.value) })}
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Public Operator Registration
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Buka/tutup form pendaftaran akun baru pada portal login
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(settings.allowRegistration)}
                  onChange={(e) => setSettings({ ...settings, allowRegistration: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Suspend User Logins (Maintenance Window)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Blokir akses login operator umum (Admin tetap dapat login)
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(settings.maintenanceMode || settings.loginSuspended)}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      maintenanceMode: e.target.checked,
                      loginSuspended: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Login Suspension Custom Reason */}
            {(settings.maintenanceMode || settings.loginSuspended) && (
              <div className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-800/80 bg-amber-50/60 dark:bg-amber-950/30 space-y-1.5 animate-in fade-in duration-200">
                <label className="block text-xs font-bold text-amber-900 dark:text-amber-300">
                  Pesan Notifikasi Penangguhan Login (Maintenance Reason):
                </label>
                <input
                  type="text"
                  value={settings.loginSuspensionMessage || ""}
                  onChange={(e) => setSettings({ ...settings, loginSuspensionMessage: e.target.value })}
                  placeholder="Akses login ditangguhkan sementara untuk pemeliharaan sistem..."
                  className="w-full h-9 px-3 rounded-lg bg-white dark:bg-slate-950 border border-amber-300 dark:border-amber-800 text-xs text-slate-900 dark:text-slate-100 outline-none"
                />
                <span className="text-[11px] text-amber-800 dark:text-amber-400 font-mono block">
                  Pesan ini akan ditampilkan secara otomatis pada layar login pengguna yang diblokir.
                </span>
              </div>
            )}

            {/* Announcement Banner */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Megaphone className="w-3.5 h-3.5 text-cyan-500" />
                <span>Global System Announcement Banner</span>
              </label>
              <textarea
                rows={2}
                value={settings.announcementText || ""}
                onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
                placeholder="Broadcast operational notifications across all user dashboards..."
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs text-slate-900 dark:text-slate-100 outline-none resize-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-cyan-glow-sm transition-all"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Policies...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Platform Settings</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Database Health Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    isDbConnected
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : "bg-cyan-500/10 border-cyan-500/30 text-cyan-600 dark:text-cyan-400"
                  }`}
                >
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Primary Database Engine Health
                  </h3>
                  <p className="text-xs text-slate-500">
                    PostgreSQL Connection & Storage Fallback Diagnostics
                  </p>
                </div>
              </div>

              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                  isDbConnected
                    ? "bg-emerald-100 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                    : "bg-cyan-100 dark:bg-cyan-950 border-cyan-300 dark:border-cyan-800 text-cyan-700 dark:text-cyan-400"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isDbConnected ? "bg-emerald-500" : "bg-cyan-500"
                  } animate-pulse`}
                />
                <span>{isDbConnected ? "CONNECTED" : "PERSISTENT STORE READY"}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 font-mono text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Query Latency</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 block">
                  {health?.database?.latencyMs !== undefined ? `${health.database.latencyMs} ms` : "1.1 ms"}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Database Host</span>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5 block truncate">
                  {health?.database?.host || "ep-sample-pooler.neon.tech"}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Last Diagnostic Sweep</span>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5 block truncate">
                  {formatDateTime(health?.timestamp || new Date().toISOString())}
                </span>
              </div>
            </div>
          </div>

          {/* Database Administration & Operations Panel */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Database Administration & Operations
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Operasi pemeliharaan database, pembersihan log, refresh cache, dan reset simulasi cluster
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 border border-cyan-300 dark:border-cyan-800">
                ADMIN PRIVILEGE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Refresh DB */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex flex-col justify-between space-y-3">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 text-cyan-500" />
                    <span>Refresh DB Cache & Health Probe</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Uji ulang koneksi database, probe latensi, dan sinkronisasi ulang cache memori sistem.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRefreshDb}
                  disabled={isDbActionRunning}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isDbActionRunning ? "animate-spin" : ""}`} />
                  <span>Jalankan Refresh DB</span>
                </button>
              </div>

              {/* Clear Logs & Trash */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex flex-col justify-between space-y-3">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    <span>Purge Logs & Empty Trash Pool</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Bersihkan seluruh activity log lama dan kosongkan folder trash email untuk menghemat storage.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsClearTrashOpen(true)}
                  disabled={isDbActionRunning}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30 text-xs font-bold transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Bersihkan Logs & Trash</span>
                </button>
              </div>

              {/* Reset Cluster State */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex flex-col justify-between space-y-3">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-amber-500" />
                    <span>Restore Default Cluster Topology</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Pulihkan seluruh konfigurasi 5 server, service, VLAN, dan runbook ke kondisi awal standar.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsResetOpen(true)}
                  disabled={isDbActionRunning}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Konfigurasi Cluster</span>
                </button>
              </div>

              {/* Download Backup */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex flex-col justify-between space-y-3">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-emerald-500" />
                    <span>Full JSON Database Backup</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Unduh snapshot lengkap database (users, servers, services, network, activity) dalam format JSON.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh File Backup (JSON)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Reset Dialog */}
      <ConfirmDialog
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        onConfirm={handleResetCluster}
        title="Restore Default Cluster Infrastructure State"
        description="Are you sure you want to restore all cluster servers, services, and runbooks to default configuration? Existing registered user accounts will be kept safe."
        confirmLabel="Restore Cluster State"
        isLoading={isDbActionRunning}
      />

      {/* Confirm Clear Trash & Logs Dialog */}
      <ConfirmDialog
        isOpen={isClearTrashOpen}
        onClose={() => setIsClearTrashOpen(false)}
        onConfirm={handleClearTrashLogs}
        title="Purge Audit Logs & Empty Trash Pool"
        description="Permanently delete all activity audit logs and purge all trashed email messages to optimize storage?"
        confirmLabel="Purge Storage Now"
        isLoading={isDbActionRunning}
      />
    </div>
  );
}
