"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Mail,
  Send,
  Inbox,
  SendHorizontal,
  Trash2,
  Search,
  CheckCircle2,
  Paperclip,
  Reply,
  AlertCircle,
  Loader2,
  RefreshCw,
  Server,
  Shield,
  FileCode,
  X,
  Download,
  ShieldAlert,
  HardDrive,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { SessionUser } from "@/types";
import { toast } from "sonner";

interface MailAttachment {
  fileName: string;
  fileSize: number;
  fileType: string;
  content?: string;
}

interface MailItem {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  body: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  status?: string;
  isRead: boolean;
  isTrash?: boolean;
  hasAttachment: boolean;
  attachmentName?: string | null;
  attachments?: MailAttachment[];
  sentAt: string;
}

interface RecipientOption {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

interface AttachmentOption {
  id: string;
  name: string;
  size: number;
  content?: string;
}

interface WebmailViewProps {
  currentUser: SessionUser;
}

export function WebmailView({ currentUser }: WebmailViewProps) {
  const [folder, setFolder] = useState<"inbox" | "quarantined" | "sent" | "trash" | "compose" | "telemetry">("inbox");
  const [inbox, setInbox] = useState<MailItem[]>([]);
  const [quarantined, setQuarantined] = useState<MailItem[]>([]);
  const [sent, setSent] = useState<MailItem[]>([]);
  const [trash, setTrash] = useState<MailItem[]>([]);
  const [storage, setStorage] = useState({
    usedBytes: 0,
    quotaBytes: 500 * 1024 * 1024,
    percentUsed: "0.00",
  });
  const [recipients, setRecipients] = useState<RecipientOption[]>([]);
  const [availableAttachments, setAvailableAttachments] = useState<AttachmentOption[]>([]);
  const [selectedMail, setSelectedMail] = useState<MailItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [isEmptyingTrash, setIsEmptyingTrash] = useState(false);

  // Compose states
  const [composeRecipientId, setComposeRecipientId] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composePriority, setComposePriority] = useState<"NORMAL" | "HIGH" | "URGENT">("NORMAL");
  const [composeBody, setComposeBody] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<MailAttachment[]>([]);
  const [isSending, setIsSending] = useState(false);
  const localAttachmentInputRef = useRef<HTMLInputElement>(null);

  const fetchMail = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/mail");
      const json = await res.json();
      if (json.success && json.data) {
        const inboxList = json.data.inbox || [];
        const quarList = json.data.quarantined || [];
        const sentList = json.data.sent || [];
        const trashList = json.data.trash || [];

        setInbox(inboxList);
        setQuarantined(quarList);
        setSent(sentList);
        setTrash(trashList);
        setRecipients(json.data.recipients || []);
        setAvailableAttachments(json.data.availableAttachments || []);
        if (json.data.storage) setStorage(json.data.storage);

        if (json.data.recipients?.length > 0 && !composeRecipientId) {
          setComposeRecipientId(json.data.recipients[0].id);
        }

        // Auto select or synchronize selected message with updated state
        setSelectedMail((current) => {
          if (!current) {
            return inboxList.length > 0 ? inboxList[0] : null;
          }
          const all = [...inboxList, ...quarList, ...sentList, ...trashList];
          const found = all.find((m) => m.id === current.id);
          return found || (inboxList.length > 0 ? inboxList[0] : null);
        });
      }
    } catch {
      toast.error("Failed to load mail spool");
    } finally {
      setIsLoading(false);
    }
  }, [composeRecipientId]);

  useEffect(() => {
    fetchMail();
  }, [fetchMail]);

  const handleSelectMail = async (item: MailItem) => {
    setSelectedMail(item);
    if (!item.isRead && item.recipientId === currentUser.id && item.status !== "PENDING_APPROVAL") {
      try {
        await fetch(`/api/mail/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isRead: true }),
        });
        setInbox((prev) =>
          prev.map((m) => (m.id === item.id ? { ...m, isRead: true } : m))
        );
      } catch {
        // silent fail
      }
    }
  };

  const handleLocalAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setAttachedFiles((prev) => [
        ...prev,
        {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || "application/octet-stream",
          content: content || "",
        },
      ]);
      toast.success(`Attached ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    };

    if (file.type.startsWith("text/") || file.size < 500000) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
    // reset input
    e.target.value = "";
  };

  const handleAttachFromCluster = (attachmentName: string) => {
    if (!attachmentName) return;
    const found = availableAttachments.find((a) => a.name === attachmentName);
    if (!found) return;

    if (attachedFiles.some((a) => a.fileName === found.name)) {
      toast.error("File is already attached");
      return;
    }

    setAttachedFiles((prev) => [
      ...prev,
      {
        fileName: found.name,
        fileSize: found.size,
        fileType: "text/plain",
        content: found.content || `// File from cluster: ${found.name}`,
      },
    ]);
    toast.success(`Attached ${found.name} from FTP pool`);
  };

  const removeAttachment = (fileName: string) => {
    setAttachedFiles((prev) => prev.filter((a) => a.fileName !== fileName));
  };

  const handleSendMail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeRecipientId) {
      toast.error("Select a recipient user.");
      return;
    }
    if (!composeSubject.trim()) {
      toast.error("Subject is required.");
      return;
    }
    if (!composeBody.trim()) {
      toast.error("Message body cannot be empty.");
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: composeRecipientId,
          subject: composeSubject,
          body: composeBody,
          priority: composePriority,
          hasAttachment: attachedFiles.length > 0,
          attachmentName: attachedFiles[0]?.fileName || null,
          attachments: attachedFiles,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to dispatch email");
        return;
      }
      toast.success(data.message);
      setComposeSubject("");
      setComposeBody("");
      setAttachedFiles([]);
      setFolder("sent");
      fetchMail();
    } catch {
      toast.error("Network communication error");
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMail = async (id: string) => {
    try {
      // If already in trash, permanent delete. Else move to trash
      if (folder === "trash") {
        const res = await fetch(`/api/mail/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (res.ok && data.success) {
          toast.success("Email permanently purged from mailbox");
          setTrash((prev) => prev.filter((m) => m.id !== id));
          if (selectedMail?.id === id) setSelectedMail(null);
          fetchMail();
        } else {
          toast.error(data.message || "Failed to purge email");
        }
      } else {
        const res = await fetch(`/api/mail/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isTrash: true }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          toast.success("Email moved to trash");
          setInbox((prev) => prev.filter((m) => m.id !== id));
          setQuarantined((prev) => prev.filter((m) => m.id !== id));
          setSent((prev) => prev.filter((m) => m.id !== id));
          if (selectedMail?.id === id) setSelectedMail(null);
          fetchMail();
        } else {
          toast.error(data.message || "Failed to move email to trash");
        }
      }
    } catch {
      toast.error("Operation failed");
    }
  };

  const handleEmptyTrash = async () => {
    setIsEmptyingTrash(true);
    try {
      const res = await fetch("/api/mail?action=empty_trash", { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Trash emptied. Mailbox storage reclaimed!");
        setTrash([]);
        setSelectedMail(null);
        fetchMail();
      } else {
        toast.error(data.message || "Failed to empty trash");
      }
    } catch {
      toast.error("Operation failed");
    } finally {
      setIsEmptyingTrash(false);
    }
  };

  const handleAcceptQuarantine = async (id: string) => {
    // Optimistic update: immediately clear quarantined state and update status to DELIVERED
    setQuarantined((prev) => prev.filter((m) => m.id !== id));
    setSelectedMail((curr) => {
      if (curr && curr.id === id) {
        return { ...curr, status: "DELIVERED" };
      }
      return curr;
    });

    try {
      const res = await fetch(`/api/mail/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ACCEPT" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Email accepted and released to inbox");
        if (folder === "quarantined") {
          setFolder("inbox");
        }
        fetchMail();
      } else {
        toast.error(data.message || "Failed to accept email");
        fetchMail();
      }
    } catch {
      toast.error("Network communication failure");
      fetchMail();
    }
  };

  const handleRejectQuarantine = async (id: string) => {
    // Optimistic update: immediately drop from quarantined state and clear selected if active
    setQuarantined((prev) => prev.filter((m) => m.id !== id));
    setSelectedMail((curr) => {
      if (curr && curr.id === id) {
        return null;
      }
      return curr;
    });

    try {
      const res = await fetch(`/api/mail/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REJECT" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Quarantined email rejected");
        if (folder === "quarantined") {
          setFolder("inbox");
        }
        fetchMail();
      } else {
        toast.error(data.message || "Failed to reject email");
        fetchMail();
      }
    } catch {
      toast.error("Network communication failure");
      fetchMail();
    }
  };

  const handleDownloadAttachment = (att: MailAttachment) => {
    const blob = new Blob([att.content || `Attachment: ${att.fileName}`], {
      type: att.fileType || "application/octet-stream",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = att.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${att.fileName}`);
  };

  const handleReply = (original: MailItem) => {
    setComposeRecipientId(original.senderId);
    setComposeSubject(original.subject.startsWith("Re: ") ? original.subject : `Re: ${original.subject}`);
    setComposeBody(`\n\n--- Original message from ${original.senderName} (${original.senderEmail}) ---\n${original.body}`);
    setFolder("compose");
  };

  const currentList =
    folder === "inbox"
      ? inbox
      : folder === "quarantined"
      ? quarantined
      : folder === "sent"
      ? sent
      : folder === "trash"
      ? trash
      : [];

  const filteredList = currentList.filter((m) => {
    const q = search.toLowerCase();
    const matchesSearch =
      m.subject.toLowerCase().includes(q) ||
      m.body.toLowerCase().includes(q) ||
      m.senderName.toLowerCase().includes(q) ||
      m.recipientName.toLowerCase().includes(q);
    const matchesPriority = priorityFilter === "ALL" || m.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const unreadCount = inbox.filter((m) => !m.isRead).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Mail className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            <span>Internal Cluster Webmail</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Postfix SMTP relay & Dovecot IMAP engine with quarantined screening and storage efficiency
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchMail}
            disabled={isLoading}
            className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 text-xs shadow-xs"
            title="Refresh mail spool"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setFolder("compose")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-cyan-glow-sm transition-all hover:scale-102"
          >
            <SendHorizontal className="w-4 h-4" />
            <span>Compose Message</span>
          </button>
        </div>
      </div>

      {/* Main Mail Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left Column: Folders & Storage Meter */}
        <div className="lg:col-span-3 space-y-4">
          {/* Folders Navigation */}
          <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] shadow-xs space-y-1">
            {/* Inbox */}
            <button
              onClick={() => {
                setFolder("inbox");
                if (inbox.length > 0) setSelectedMail(inbox[0]);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                folder === "inbox"
                  ? "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-bold border border-cyan-500/30"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Inbox className="w-4 h-4" />
                <span>Inbox</span>
              </div>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-bold text-[10px]">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Quarantined Pending Screen */}
            <button
              onClick={() => {
                setFolder("quarantined");
                if (quarantined.length > 0) setSelectedMail(quarantined[0]);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                folder === "quarantined"
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>Quarantined</span>
              </div>
              {quarantined.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px]">
                  {quarantined.length}
                </span>
              )}
            </button>

            {/* Sent */}
            <button
              onClick={() => {
                setFolder("sent");
                if (sent.length > 0) setSelectedMail(sent[0]);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                folder === "sent"
                  ? "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-bold border border-cyan-500/30"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <SendHorizontal className="w-4 h-4" />
                <span>Sent Outbox</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">{sent.length}</span>
            </button>

            {/* Trash */}
            <button
              onClick={() => {
                setFolder("trash");
                if (trash.length > 0) setSelectedMail(trash[0]);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                folder === "trash"
                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/30"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-4 h-4 text-rose-500" />
                <span>Trash</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">{trash.length}</span>
            </button>

            {/* Compose */}
            <button
              onClick={() => setFolder("compose")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                folder === "compose"
                  ? "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-bold border border-cyan-500/30"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Compose Email</span>
            </button>

            {/* MTA Server Status */}
            <button
              onClick={() => setFolder("telemetry")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                folder === "telemetry"
                  ? "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-bold border border-cyan-500/30"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Server className="w-4 h-4" />
              <span>MTA Server Status</span>
            </button>
          </div>

          {/* Mailbox Storage Efficiency Meter Card */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] shadow-xs space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500 uppercase font-semibold">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-cyan-500" />
                <span>Mailbox Storage</span>
              </span>
              <span className="text-cyan-600 dark:text-cyan-400 font-bold">{storage.percentUsed}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(4, Number(storage.percentUsed))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>{(storage.usedBytes / 1024).toFixed(1)} KB</span>
              <span>/ {(storage.quotaBytes / 1024 / 1024).toFixed(0)} MB Quota</span>
            </div>

            {trash.length > 0 && (
              <button
                onClick={handleEmptyTrash}
                disabled={isEmptyingTrash}
                className="w-full mt-2 py-1.5 px-3 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5"
              >
                {isEmptyingTrash ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                <span>Empty Trash & Reclaim Space</span>
              </button>
            )}
          </div>

          {/* Mail Server Status Card */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] shadow-xs space-y-2 text-xs font-mono">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
              DAEMON TELEMETRY
            </div>
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
              <span>Postfix SMTP</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Port 587
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
              <span>Dovecot IMAP</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Port 993
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500">
              Zero-Trust Quarantine & Screening Active
            </div>
          </div>
        </div>

        {/* Middle + Right Pane */}
        {folder === "compose" ? (
          /* Compose View */
          <div className="lg:col-span-9 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Compose Internal Transmission
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Dispatch message via Postfix relay with optional local file attachments
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSendMail} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Recipient Operator
                  </label>
                  {recipients.length === 0 ? (
                    <div className="text-xs text-slate-500 font-mono py-2">No other operators registered.</div>
                  ) : (
                    <select
                      value={composeRecipientId}
                      onChange={(e) => setComposeRecipientId(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs text-slate-900 dark:text-slate-100 outline-none"
                    >
                      {recipients.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} (@{r.username}) — {r.email}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Transmission Priority
                  </label>
                  <select
                    value={composePriority}
                    onChange={(e: any) => setComposePriority(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none"
                  >
                    <option value="NORMAL">Normal Priority</option>
                    <option value="HIGH">High Priority (Urgent Action)</option>
                    <option value="URGENT">Critical Incident Alert</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Header
                </label>
                <input
                  type="text"
                  required
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="e.g. Scheduled Network Maintenance Window (VLAN 30)"
                  className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              {/* Attachments Control */}
              <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-cyan-500" />
                    <span>File Attachments (Local Storage & FTP Vault)</span>
                  </label>

                  <div className="flex items-center gap-2">
                    {/* Hidden input for local device file attachment */}
                    <input
                      type="file"
                      ref={localAttachmentInputRef}
                      onChange={handleLocalAttachmentChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => localAttachmentInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 text-[11px] font-semibold hover:bg-cyan-500/20 transition-colors flex items-center gap-1"
                    >
                      <Paperclip className="w-3 h-3" />
                      <span>Attach from Computer</span>
                    </button>

                    {availableAttachments.length > 0 && (
                      <select
                        onChange={(e) => {
                          handleAttachFromCluster(e.target.value);
                          e.target.value = "";
                        }}
                        defaultValue=""
                        className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] text-slate-700 dark:text-slate-300 font-mono outline-none"
                      >
                        <option value="" disabled>
                          + Attach from FTP Pool
                        </option>
                        {availableAttachments.map((att) => (
                          <option key={att.id} value={att.name}>
                            {att.name} ({(att.size / 1024).toFixed(1)} KB)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Attached Files List */}
                {attachedFiles.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    {attachedFiles.map((att) => (
                      <span
                        key={att.fileName}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-100 dark:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300 text-xs font-mono"
                      >
                        <FileCode className="w-3 h-3" />
                        <span>{att.fileName} ({(att.fileSize / 1024).toFixed(1)} KB)</span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(att.fileName)}
                          className="text-cyan-600 hover:text-rose-500 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 font-mono">
                    No files attached. Attach configurations, logs, or scripts from your device or cluster storage.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Message Body
                </label>
                <textarea
                  rows={8}
                  required
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Draft your operational memo, maintenance request, or incident dispatch..."
                  className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs text-slate-900 dark:text-slate-100 outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setFolder("inbox")}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-cyan-glow-sm disabled:opacity-50"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Dispatching Email...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Dispatch Email</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : folder === "telemetry" ? (
          /* MTA Server Telemetry View */
          <div className="lg:col-span-9 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Mail Transfer Agent (Postfix & Dovecot)
                  </h3>
                  <p className="text-xs text-slate-500">Service: postfix.service / Host: serve-client3</p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold">
                OPERATIONAL
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">SMTP Submission</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">Port 587 (STARTTLS)</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">IMAP Retrieval</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">Port 993 (SSL/TLS)</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Mail Queue</div>
                <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">0 Active / 0 Deferred</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Quarantine Gate</div>
                <div className="font-bold text-cyan-600 dark:text-cyan-400 mt-0.5">Enforced (Zero-Trust)</div>
              </div>
            </div>

            <div>
              <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                Postfix Relay Mail Logs (mail.log -n 8):
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400 whitespace-pre-line leading-relaxed shadow-inner">
                {`[2026-09-18 08:30:14] postfix/smtpd[4921]: connect from serve-client2[122.128.18.238]
[2026-09-18 08:30:15] postfix/smtpd[4921]: Anonymous TLS connection established: TLSv1.3 with cipher TLS_AES_256_GCM_SHA384
[2026-09-18 08:30:15] postfix/smtpd[4921]: 7A1C9281B: client=serve-client2[122.128.18.238], sasl_method=LOGIN, sasl_username=admin@tssb.local
[2026-09-18 08:30:16] postfix/cleanup[4923]: 7A1C9281B: message-id=<20260918083015.7A1C9281B@tssb.local>
[2026-09-18 08:30:16] postfix/qmgr[1822]: 7A1C9281B: from=<admin@tssb.local>, size=1840, nrcpt=1 (queue active)
[2026-09-18 08:30:17] dovecot: lda(user@tssb.local)<4925>: msgid=<20260918083015.7A1C9281B@tssb.local>: saved mail to INBOX
[2026-09-18 08:30:17] postfix/local[4924]: 7A1C9281B: to=<user@tssb.local>, relay=local, delay=1.4, dsn=2.0.0, status=sent (delivered to maildir)`}
              </div>
            </div>
          </div>
        ) : (
          /* Split-Pane Message List and Reader */
          <>
            {/* Middle Column: Message List */}
            <div className="lg:col-span-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] overflow-hidden shadow-xs flex flex-col h-[600px]">
              {/* Search & Filter Header */}
              <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase text-slate-500">
                    {folder === "inbox"
                      ? "Inbox"
                      : folder === "quarantined"
                      ? "Quarantined"
                      : folder === "sent"
                      ? "Sent Outbox"
                      : "Trash Pool"}
                  </span>
                  {folder === "trash" && trash.length > 0 && (
                    <button
                      onClick={handleEmptyTrash}
                      disabled={isEmptyingTrash}
                      className="text-[10px] text-rose-500 font-bold hover:underline"
                    >
                      Empty
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search messages, operators..."
                    className="w-full h-8 pl-8 pr-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-500 outline-none font-mono"
                  />
                </div>

                <div className="flex items-center gap-1">
                  {["ALL", "NORMAL", "HIGH", "URGENT"].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriorityFilter(p)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors ${
                        priorityFilter === p
                          ? "bg-cyan-500 text-slate-950 font-bold"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message List Items */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {isLoading ? (
                  <div className="p-8">
                    <LoadingSpinner label="Spooling messages..." />
                  </div>
                ) : filteredList.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 font-mono">
                    No messages in {folder}.
                  </div>
                ) : (
                  filteredList.map((msg) => {
                    const isSelected = selectedMail?.id === msg.id;
                    const isUnread = !msg.isRead && folder === "inbox";

                    return (
                      <div
                        key={msg.id}
                        onClick={() => handleSelectMail(msg)}
                        className={`p-3 cursor-pointer transition-colors text-left ${
                          isSelected
                            ? "bg-cyan-500/10 dark:bg-cyan-950/30 border-l-4 border-cyan-500"
                            : isUnread
                            ? "bg-slate-50/90 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/30"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className={`text-xs font-semibold truncate ${
                              isUnread ? "text-cyan-600 dark:text-cyan-400 font-bold" : "text-slate-800 dark:text-slate-200"
                            }`}
                          >
                            {folder === "inbox" || folder === "quarantined"
                              ? msg.senderName
                              : `To: ${msg.recipientName}`}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">
                            {formatDateTime(msg.sentAt).split(",")[0]}
                          </span>
                        </div>

                        <div className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate mb-1 flex items-center gap-1.5">
                          {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 flex-shrink-0" />}
                          <span className="truncate">{msg.subject}</span>
                        </div>

                        <div className="text-[11px] text-slate-500 truncate leading-snug">
                          {msg.body}
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 dark:border-slate-800/60 text-[10px] font-mono">
                          <span
                            className={`px-1.5 py-0.2 rounded font-semibold ${
                              msg.priority === "URGENT"
                                ? "bg-rose-100 dark:bg-rose-950 text-rose-600"
                                : msg.priority === "HIGH"
                                ? "bg-amber-100 dark:bg-amber-950 text-amber-600"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                            }`}
                          >
                            {msg.priority}
                          </span>

                          {(msg.hasAttachment || (msg.attachments && msg.attachments.length > 0)) && (
                            <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400">
                              <Paperclip className="w-3 h-3" />
                              <span className="truncate max-w-[90px]">
                                {msg.attachments && msg.attachments.length > 0
                                  ? `${msg.attachments.length} files`
                                  : msg.attachmentName}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Message Reading Pane */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] p-5 shadow-sm flex flex-col justify-between h-[600px]">
              {selectedMail ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Quarantined Warning Banner */}
                  {selectedMail.status === "PENDING_APPROVAL" && (
                    <div className="mb-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                        <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <span>Quarantined: Inbound peer mail requires operator verification.</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleAcceptQuarantine(selectedMail.id)}
                          className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-500"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectQuarantine(selectedMail.id)}
                          className="px-2.5 py-1 rounded bg-rose-600 text-white font-bold text-[11px] hover:bg-rose-500"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Message Header */}
                  <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {selectedMail.subject}
                      </h2>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex-shrink-0 ${
                          selectedMail.priority === "URGENT"
                            ? "bg-rose-100 dark:bg-rose-950 text-rose-600"
                            : selectedMail.priority === "HIGH"
                            ? "bg-amber-100 dark:bg-amber-950 text-amber-600"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {selectedMail.priority} PRIORITY
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono">
                      <div>
                        <div className="text-slate-800 dark:text-slate-200 font-semibold">
                          From: {selectedMail.senderName} ({selectedMail.senderEmail})
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          To: {selectedMail.recipientName} ({selectedMail.recipientEmail})
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-400 text-right">
                        {formatDateTime(selectedMail.sentAt)}
                      </div>
                    </div>

                    {/* Attachments Display Section */}
                    {((selectedMail.attachments && selectedMail.attachments.length > 0) || selectedMail.hasAttachment) && (
                      <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Paperclip className="w-3.5 h-3.5 text-cyan-500" />
                          <span>ATTACHED ARTIFACTS</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedMail.attachments && selectedMail.attachments.length > 0 ? (
                            selectedMail.attachments.map((att) => (
                              <div
                                key={att.fileName}
                                className="flex items-center justify-between gap-3 p-2 rounded-lg bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 text-xs font-mono"
                              >
                                <div className="flex items-center gap-1.5">
                                  <FileCode className="w-3.5 h-3.5 text-cyan-500" />
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {att.fileName}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    ({(att.fileSize / 1024).toFixed(1)} KB)
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleDownloadAttachment(att)}
                                  className="p-1 rounded hover:bg-cyan-50 dark:hover:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400"
                                  title="Download attachment"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center justify-between gap-3 p-2 rounded-lg bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 text-xs font-mono w-full">
                              <div className="flex items-center gap-1.5">
                                <FileCode className="w-3.5 h-3.5 text-cyan-500" />
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {selectedMail.attachmentName}
                                </span>
                              </div>
                              <span className="text-[10px] text-cyan-600 font-mono">Linked Storage</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message Body Content */}
                  <div className="flex-1 overflow-y-auto my-4 py-2 pr-2 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {selectedMail.body}
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReply(selectedMail)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-xs"
                      >
                        <Reply className="w-3.5 h-3.5" />
                        <span>Reply</span>
                      </button>
                    </div>

                    <button
                      onClick={() => handleDeleteMail(selectedMail.id)}
                      className="p-2 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs"
                      title={folder === "trash" ? "Purge permanently" : "Move to trash"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <Mail className="w-10 h-10 mb-2 opacity-40 text-cyan-500" />
                  <div className="text-xs font-mono">Select a message from the list to preview details</div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
