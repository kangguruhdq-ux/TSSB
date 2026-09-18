"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FolderArchive,
  Upload,
  Send,
  Download,
  Trash2,
  Search,
  FileText,
  Shield,
  Server,
  Activity,
  CheckCircle2,
  X,
  FileCode,
  HardDrive,
  User as UserIcon,
  RefreshCw,
  Loader2,
  ArrowRightLeft,
  FileCheck,
  Radio,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { formatDateTime } from "@/lib/utils";
import { SessionUser } from "@/types";
import { toast } from "sonner";

interface StorageFile {
  id: string;
  userId: string;
  name: string;
  size: number;
  mimeType: string;
  category: "CONFIG" | "ARCHIVE" | "CERTIFICATE" | "SCRIPT" | "LOG" | "DATA";
  description?: string | null;
  content: string;
  createdAt: string;
  user?: {
    name: string;
    username: string;
  };
}

interface TransferRecord {
  id: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  receiverId: string;
  receiverName: string;
  receiverUsername: string;
  fileName: string;
  fileSize: number;
  protocol: "FTP" | "SFTP" | "FTPS";
  port: number;
  status: string;
  note?: string | null;
  transferredAt: string;
}

interface RecipientUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

interface StorageMeta {
  usedBytes: number;
  quotaBytes: number;
  percentUsed: string;
  fileCount: number;
}

interface FilesManagementViewProps {
  currentUser: SessionUser;
}

export function FilesManagementView({ currentUser }: FilesManagementViewProps) {
  const [activeTab, setActiveTab] = useState<"storage" | "transfer" | "quarantine" | "history" | "daemon">("storage");
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [recipients, setRecipients] = useState<RecipientUser[]>([]);
  const [storage, setStorage] = useState<StorageMeta>({
    usedBytes: 0,
    quotaBytes: 10 * 1024 * 1024 * 1024,
    percentUsed: "0.0",
    fileCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<StorageFile | null>(null);
  const [fileToDelete, setFileToDelete] = useState<StorageFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Upload Form
  const [uploadName, setUploadName] = useState("");
  const [uploadCategory, setUploadCategory] = useState<"CONFIG" | "ARCHIVE" | "CERTIFICATE" | "SCRIPT" | "LOG" | "DATA">("CONFIG");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadContent, setUploadContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Transfer Form
  const [selectedFileToTransfer, setSelectedFileToTransfer] = useState("");
  const [targetReceiverId, setTargetReceiverId] = useState("");
  const [transferProtocol, setTransferProtocol] = useState<"FTP" | "SFTP" | "FTPS">("SFTP");
  const [transferNote, setTransferNote] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferProgress, setTransferProgress] = useState(0);

  // Pending transfers quarantine filter
  const pendingInbound = transfers.filter(
    (t) => (t.receiverId === currentUser.id || currentUser.role === "ADMIN") && t.status === "PENDING_APPROVAL"
  );

  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/files");
      const json = await res.json();
      if (json.success && json.data) {
        setFiles(json.data.files || []);
        setTransfers(json.data.transfers || []);
        setRecipients(json.data.recipientUsers || []);
        if (json.data.storage) setStorage(json.data.storage);

        if (json.data.recipientUsers?.length > 0 && !targetReceiverId) {
          setTargetReceiverId(json.data.recipientUsers[0].id);
        }
        if (json.data.files?.length > 0 && !selectedFileToTransfer) {
          setSelectedFileToTransfer(json.data.files[0].id);
        }
      }
    } catch {
      toast.error("Failed to load FTP storage telemetry");
    } finally {
      setIsLoading(false);
    }
  }, [targetReceiverId, selectedFileToTransfer]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleLocalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFileObj(file);
    setUploadName(file.name);

    // Categorize based on file extension
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (["conf", "cfg", "ini", "env", "yaml", "yml", "json", "cnf"].includes(ext)) {
      setUploadCategory("CONFIG");
    } else if (["sh", "bash", "ps1", "bat", "py", "js", "ts"].includes(ext)) {
      setUploadCategory("SCRIPT");
    } else if (["zip", "tar", "gz", "bz2", "7z", "rar"].includes(ext)) {
      setUploadCategory("ARCHIVE");
    } else if (["crt", "pem", "key", "csr", "der"].includes(ext)) {
      setUploadCategory("CERTIFICATE");
    } else if (["log", "out", "err"].includes(ext)) {
      setUploadCategory("LOG");
    } else {
      setUploadCategory("DATA");
    }

    // Read content
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setUploadContent(text || "");
    };

    if (file.type.startsWith("text/") || file.size < 1000000) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      const finalSize = selectedFileObj
        ? selectedFileObj.size
        : new Blob([uploadContent || " "]).size || 1024;
      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: uploadName,
          category: uploadCategory,
          description: uploadDesc,
          content: uploadContent,
          size: finalSize,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to upload file");
        return;
      }
      toast.success("File uploaded to cluster storage!");
      setIsUploadOpen(false);
      setUploadName("");
      setUploadDesc("");
      setUploadContent("");
      setSelectedFileObj(null);
      fetchFiles();
    } catch {
      toast.error("Network communication error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAcceptTransfer = async (id: string) => {
    // Optimistic update: mark as COMPLETED immediately
    setTransfers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "COMPLETED" } : t))
    );
    try {
      const res = await fetch(`/api/files/transfer/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ACCEPT" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "File transfer verified & accepted");
        fetchFiles();
      } else {
        toast.error(data.message || "Failed to accept transfer");
        fetchFiles();
      }
    } catch {
      toast.error("Network communication failure");
      fetchFiles();
    }
  };

  const handleRejectTransfer = async (id: string) => {
    // Optimistic update: mark as REJECTED immediately
    setTransfers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "REJECTED" } : t))
    );
    try {
      const res = await fetch(`/api/files/transfer/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REJECT" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "File transfer rejected");
        fetchFiles();
      } else {
        toast.error(data.message || "Failed to reject transfer");
        fetchFiles();
      }
    } catch {
      toast.error("Network communication failure");
      fetchFiles();
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const chosenFile = files.find((f) => f.id === selectedFileToTransfer);
    if (!chosenFile) {
      toast.error("Please select a file to transfer.");
      return;
    }
    if (!targetReceiverId) {
      toast.error("Please select a recipient user.");
      return;
    }

    setIsTransferring(true);
    setTransferProgress(15);
    const interval = setInterval(() => {
      setTransferProgress((prev) => (prev >= 90 ? 90 : prev + 25));
    }, 120);

    try {
      const res = await fetch("/api/files/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: targetReceiverId,
          fileName: chosenFile.name,
          fileSize: chosenFile.size,
          protocol: transferProtocol,
          port: transferProtocol === "SFTP" ? 22 : transferProtocol === "FTPS" ? 990 : 21,
          note: transferNote,
          fileContent: chosenFile.content,
        }),
      });
      const data = await res.json();
      clearInterval(interval);
      setTransferProgress(100);

      if (!res.ok || !data.success) {
        toast.error(data.message || "File transfer failed");
        return;
      }

      toast.success(data.message);
      setTransferNote("");
      setActiveTab("history");
      fetchFiles();
    } catch {
      clearInterval(interval);
      toast.error("Transfer connection dropped");
    } finally {
      setIsTransferring(false);
      setTimeout(() => setTransferProgress(0), 1000);
    }
  };

  const handleDeleteFile = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/files/${fileToDelete.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to delete file");
        return;
      }
      toast.success("File deleted successfully");
      setFileToDelete(null);
      fetchFiles();
    } catch {
      toast.error("Delete operation failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = (file: StorageFile) => {
    const blob = new Blob([file.content || ""], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${file.name}`);
  };

  const filteredFiles = files.filter((f) => {
    const q = search.toLowerCase();
    const matchesSearch = f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q);
    const matchesCategory = categoryFilter === "ALL" || f.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FolderArchive className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            <span>FTP & Cluster Storage Manager</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            vsftpd daemon, cloud file transfers between operators, and storage optimization
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchFiles}
            disabled={isLoading}
            className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 text-xs shadow-xs"
            title="Refresh files"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setActiveTab("transfer")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-cyan-500/40 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 font-semibold text-xs transition-colors hover:bg-cyan-100"
          >
            <Send className="w-4 h-4" />
            <span>Transfer to User</span>
          </button>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-cyan-glow-sm transition-all hover:scale-102"
          >
            <Upload className="w-4 h-4" />
            <span>Upload File</span>
          </button>
        </div>
      </div>

      {/* Storage & Telemetry Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Storage Efficiency Bar */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">
            <span>STORAGE EFFICIENCY</span>
            <HardDrive className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {(storage.usedBytes / 1024).toFixed(1)} KB{" "}
            <span className="text-xs font-normal text-slate-500">/ {(storage.quotaBytes / 1024 / 1024 / 1024).toFixed(0)} GB</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(4, Number(storage.percentUsed))}%` }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-500 flex justify-between">
            <span>{storage.fileCount} Objects Stored</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-bold">{storage.percentUsed}% Quota</span>
          </div>
        </div>

        {/* FTP Daemon Status */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">
            <span>FTP DAEMON</span>
            <Radio className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>vsftpd 3.0.5</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Port 21 (FTP) & 22 (SFTP) Active</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Encrypted TLS/SSL data channel enabled
          </div>
        </div>

        {/* Inter-User Transfers Count */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">
            <span>INTER-USER TRANSFERS</span>
            <ArrowRightLeft className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {transfers.length} Transmissions
          </div>
          <div className="text-[11px] font-mono text-purple-600 dark:text-purple-400">
            P2P Cluster Synchronized
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Zero data packet loss recorded
          </div>
        </div>

        {/* Active Operators */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">
            <span>STORAGE REALM</span>
            <Shield className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {recipients.length + 1} Registered Nodes
          </div>
          <div className="text-[11px] font-mono text-blue-600 dark:text-blue-400">
            Multi-Tenant Isolation
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            RBAC Access Enforcement Active
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto no-scrollbar scrollbar-none flex-nowrap">
        <button
          onClick={() => setActiveTab("storage")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
            activeTab === "storage"
              ? "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-bold border border-cyan-500/30"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <FolderArchive className="w-4 h-4" />
          <span>Storage Pool ({files.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("transfer")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
            activeTab === "transfer"
              ? "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-bold border border-cyan-500/30"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Send File to User</span>
        </button>

        <button
          onClick={() => setActiveTab("quarantine")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
            activeTab === "quarantine"
              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Inbound Quarantine</span>
          {pendingInbound.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold leading-none">
              {pendingInbound.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
            activeTab === "history"
              ? "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-bold border border-cyan-500/30"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Transfer Inbox & History ({transfers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("daemon")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
            activeTab === "daemon"
              ? "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-bold border border-cyan-500/30"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Server className="w-4 h-4" />
          <span>vsftpd Server Telemetry</span>
        </button>
      </div>

      {/* Tab 1: Storage Pool Explorer */}
      {activeTab === "storage" && (
        <div className="space-y-4">
          {/* Privacy & Isolation Banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-xs text-cyan-800 dark:text-cyan-300">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
              <span>
                <strong>Personal Secure Vault:</strong> Compartmentalized operator storage with role-based access control. Files cannot be accessed by unauthorized peers.
              </span>
            </div>
            <span className="hidden sm:inline font-mono text-[10px] bg-cyan-100 dark:bg-cyan-900 px-2 py-0.5 rounded font-bold uppercase">
              ROLE: {currentUser.role}
            </span>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search file name, category..."
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-500 outline-none font-mono"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {["ALL", "CONFIG", "SCRIPT", "ARCHIVE", "CERTIFICATE", "LOG", "DATA"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition-colors ${
                    categoryFilter === cat
                      ? "bg-cyan-500 text-slate-950 font-bold"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Files List Table */}
          {isLoading ? (
            <LoadingSpinner label="Querying cluster storage catalog..." />
          ) : filteredFiles.length === 0 ? (
            <EmptyState
              icon={FolderArchive}
              title="No files found in storage pool"
              description="Upload server configuration archives or transfer files directly between operators."
              actionLabel="Upload First File"
              onAction={() => setIsUploadOpen(true)}
            />
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <th className="p-3.5 font-semibold">FILE NAME</th>
                      <th className="p-3.5 font-semibold">CATEGORY</th>
                      <th className="p-3.5 font-semibold">SIZE</th>
                      <th className="p-3.5 font-semibold">OWNER / UPLOADER</th>
                      <th className="p-3.5 font-semibold">CREATED DATE</th>
                      <th className="p-3.5 text-right font-semibold">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                    {filteredFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <FileCode className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                            <div>
                              <button
                                onClick={() => setPreviewFile(file)}
                                className="font-bold text-slate-900 dark:text-slate-100 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors text-left"
                              >
                                {file.name}
                              </button>
                              {file.description && (
                                <div className="text-[10px] text-slate-500 font-sans truncate max-w-xs mt-0.5">
                                  {file.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {file.category}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-700 dark:text-slate-300 font-semibold">
                          {(file.size / 1024).toFixed(1)} KB
                        </td>
                        <td className="p-3.5">
                          <span className="text-slate-600 dark:text-slate-400">
                            @{file.user?.username || "operator"}
                          </span>
                        </td>
                        <td className="p-3.5 text-[11px] text-slate-500 dark:text-slate-400">
                          {formatDateTime(file.createdAt)}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleDownload(file)}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                              title="Download file"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedFileToTransfer(file.id);
                                setActiveTab("transfer");
                              }}
                              className="p-1.5 rounded-lg border border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-100 transition-colors"
                              title="Send to another user"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                            {(currentUser.role === "ADMIN" || file.userId === currentUser.id) && (
                              <button
                                onClick={() => setFileToDelete(file)}
                                className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors"
                                title="Delete file"
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
        </div>
      )}

      {/* Tab 2: Send File to User (FTP/SFTP Transfer) */}
      {activeTab === "transfer" && (
        <div className="max-w-2xl mx-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] p-6 shadow-sm">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Dispatch Direct File Transfer
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Transmit cluster file directly to another registered operator via FTP/SFTP
              </p>
            </div>
          </div>

          <form onSubmit={handleTransferSubmit} className="mt-5 space-y-4">
            {/* File Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select File to Transmit
              </label>
              {files.length === 0 ? (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-700 dark:text-amber-300">
                  No files available in your storage. Please upload a file first.
                </div>
              ) : (
                <select
                  required
                  value={selectedFileToTransfer}
                  onChange={(e) => setSelectedFileToTransfer(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none"
                >
                  {files.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({(f.size / 1024).toFixed(1)} KB) — [{f.category}]
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Recipient Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Recipient Operator
              </label>
              {recipients.length === 0 ? (
                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-500">
                  No other active operators registered in realm.
                </div>
              ) : (
                <select
                  required
                  value={targetReceiverId}
                  onChange={(e) => setTargetReceiverId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs text-slate-900 dark:text-slate-100 outline-none"
                >
                  {recipients.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (@{r.username}) — [{r.role}] — {r.email}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Transfer Protocol Options */}
            <div className="grid grid-cols-3 gap-3">
              {(["SFTP", "FTP", "FTPS"] as const).map((proto) => (
                <button
                  key={proto}
                  type="button"
                  onClick={() => setTransferProtocol(proto)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    transferProtocol === proto
                      ? "border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold shadow-xs"
                      : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <div className="text-xs font-mono">{proto}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {proto === "SFTP" ? "Port 22 SSH" : proto === "FTPS" ? "Port 990 SSL" : "Port 21 Plain"}
                  </div>
                </button>
              ))}
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Transfer Message / Context Note
              </label>
              <textarea
                rows={2}
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                placeholder="e.g. Please review Nginx proxy configs before tonight's maintenance..."
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs text-slate-900 dark:text-slate-100 outline-none resize-none"
              />
            </div>

            {/* Simulated Progress */}
            {isTransferring && (
              <div className="space-y-1.5 p-3 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between text-[11px] font-mono text-cyan-600 dark:text-cyan-400">
                  <span>Encrypting & streaming data stream...</span>
                  <span>{transferProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full transition-all duration-300"
                    style={{ width: `${transferProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab("storage")}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isTransferring || files.length === 0 || recipients.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-cyan-glow-sm transition-all disabled:opacity-50"
              >
                {isTransferring ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Dispatching Transfer...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Initiate {transferProtocol} Transmission</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: Zero-Trust Quarantine Approvals */}
      {activeTab === "quarantine" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Zero-Trust Inbound File Quarantine
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Review and authorize inbound files before storage allocation to your private vault
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800">
                {pendingInbound.length} Awaiting Authorization
              </span>
            </div>

            {pendingInbound.length === 0 ? (
              <div className="p-12 text-center space-y-2 font-mono">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Quarantine Ingestion Queue Clear
                </div>
                <p className="text-xs text-slate-500 max-w-md mx-auto font-sans">
                  No incoming peer transfers are currently awaiting review. You can toggle Zero-Trust Ingestion Quarantine in your Profile Security settings.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-xs">
                {pendingInbound.map((item) => (
                  <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-amber-500" />
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {item.fileName}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-bold">
                          PENDING APPROVAL
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px] flex flex-wrap items-center gap-2">
                        <span>Sender: <strong className="text-cyan-600 dark:text-cyan-400">@{item.senderUsername}</strong> ({item.senderName})</span>
                        <span>•</span>
                        <span>Size: {(item.fileSize / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span>Protocol: {item.protocol} (Port {item.port})</span>
                        <span>•</span>
                        <span>Time: {formatDateTime(item.transferredAt)}</span>
                      </div>
                      {item.note && (
                        <div className="text-slate-600 dark:text-slate-400 text-[11px] font-sans italic">
                          Note: {item.note}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleAcceptTransfer(item.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accept & Save</span>
                      </button>
                      <button
                        onClick={() => handleRejectTransfer(item.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold text-xs hover:bg-rose-100 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Transfer Inbox & History */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  INTER-USER TRANSMISSION LOG
                </h3>
                <p className="text-[11px] text-slate-500">All inbound and outbound operator file transfers</p>
              </div>
              <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                {transfers.length} Transferred Objects
              </span>
            </div>

            {transfers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-mono">
                No transfer records logged yet. Use &apos;Send File to User&apos; to dispatch files.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <th className="p-3.5 font-semibold">DATE</th>
                      <th className="p-3.5 font-semibold">SENDER</th>
                      <th className="p-3.5 font-semibold">RECEIVER</th>
                      <th className="p-3.5 font-semibold">FILE NAME</th>
                      <th className="p-3.5 font-semibold">PROTOCOL</th>
                      <th className="p-3.5 font-semibold">STATUS</th>
                      <th className="p-3.5 font-semibold">NOTE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                    {transfers.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 text-slate-500 text-[11px]">
                          {formatDateTime(t.transferredAt)}
                        </td>
                        <td className="p-3.5">
                          <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                            @{t.senderUsername}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="text-purple-600 dark:text-purple-400 font-bold">
                            @{t.receiverUsername}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                          {t.fileName}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                            {t.protocol} (Port {t.port})
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{t.status}</span>
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500 font-sans text-[11px] max-w-xs truncate">
                          {t.note || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: vsftpd Server Telemetry */}
      {activeTab === "daemon" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    vsftpd (Very Secure FTP Daemon) Engine
                  </h3>
                  <p className="text-xs text-slate-500">Service: vsftpd.service / Target: serve-client2</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  ACTIVE (RUNNING)
                </span>
              </div>
            </div>

            {/* Daemon Config Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Listening Port</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">21 (Control) / 20 (Data)</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Passive Ports</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">40000 - 50000</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Chroot Jail</div>
                <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">Enforced (chroot_local_user=YES)</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">SSL / TLS Ciphers</div>
                <div className="font-bold text-cyan-600 dark:text-cyan-400 mt-0.5">TLSv1.3 AES-256-GCM</div>
              </div>
            </div>

            {/* Simulated Live Journalctl Log Output */}
            <div>
              <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                Live FTP Transfer Logs (journalctl -u vsftpd -n 10):
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400 whitespace-pre-line leading-relaxed shadow-inner">
                {`[2026-09-18 10:15:02] [vsftpd] CONNECT: Client "122.188.123.45" connected to port 21
[2026-09-18 10:15:03] [vsftpd] [admin] OK LOGIN: Client "122.188.123.45"
[2026-09-18 10:15:04] [vsftpd] [admin] OK DOWNLOAD: Client "122.188.123.45", "/etc/nginx/nginx.conf.backup", 14500 bytes, 18.2Mbyte/sec
[2026-09-18 10:20:11] [vsftpd] [kaiti] OK UPLOAD: Client "122.128.18.238", "/var/log/audit.log", 18840 bytes, 22.4Mbyte/sec
[2026-09-18 10:20:12] [vsftpd] [kaiti] SUCCESS: Chroot sandbox validated. Transfer closed.`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload File Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsUploadOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Store File in FTP Pool</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Upload configuration scripts, runbooks, or keys</p>
              </div>
            </div>

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-3">
              {/* Local File Picker Dropzone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Upload from Device / Local Storage
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-cyan-500/40 hover:border-cyan-500 rounded-xl p-3.5 text-center cursor-pointer transition-colors bg-cyan-500/5 hover:bg-cyan-500/10"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLocalFileSelect}
                    className="hidden"
                  />
                  <Upload className="w-5 h-5 mx-auto text-cyan-600 dark:text-cyan-400 mb-1" />
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {selectedFileObj ? selectedFileObj.name : "Select or drag file from disk"}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                    {selectedFileObj
                      ? `${(selectedFileObj.size / 1024).toFixed(1)} KB • Auto-detected & loaded`
                      : "Config, shell script, YAML, JSON, log, or binary"}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  File Name
                </label>
                <input
                  type="text"
                  required
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="e.g. proxy_gateway.conf, backup_dump.sql"
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e: any) => setUploadCategory(e.target.value)}
                    className="w-full h-9 px-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none"
                  >
                    <option value="CONFIG">Configuration</option>
                    <option value="SCRIPT">Automation Script</option>
                    <option value="ARCHIVE">Archive Spec</option>
                    <option value="CERTIFICATE">SSL Certificate</option>
                    <option value="LOG">System Log</option>
                    <option value="DATA">General Data</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Brief Note
                  </label>
                  <input
                    type="text"
                    value={uploadDesc}
                    onChange={(e) => setUploadDesc(e.target.value)}
                    placeholder="Short description..."
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  File Contents / Code Body
                </label>
                <textarea
                  rows={6}
                  value={uploadContent}
                  onChange={(e) => setUploadContent(e.target.value)}
                  placeholder="// Paste script, configuration directives, or documentation..."
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 font-mono text-xs text-slate-900 dark:text-slate-100 outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-cyan-glow-sm"
                >
                  {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save to Pool</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview File Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileCode className="w-5 h-5 text-cyan-500" />
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white font-mono">
                    {previewFile.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {(previewFile.size / 1024).toFixed(1)} KB • {previewFile.category} • Uploaded by @{previewFile.user?.username || "operator"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 max-h-96 overflow-y-auto rounded-xl bg-slate-950 p-4 border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
              {previewFile.content}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => handleDownload(previewFile)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File</span>
              </button>

              <button
                onClick={() => setPreviewFile(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(fileToDelete)}
        onClose={() => setFileToDelete(null)}
        onConfirm={handleDeleteFile}
        title="Purge File from Storage Pool"
        description="Permanently delete this object from the cluster file repository."
        targetName={fileToDelete ? `${fileToDelete.name} (${(fileToDelete.size / 1024).toFixed(1)} KB)` : ""}
        confirmLabel="Purge Object"
        isLoading={isDeleting}
      />
    </div>
  );
}
