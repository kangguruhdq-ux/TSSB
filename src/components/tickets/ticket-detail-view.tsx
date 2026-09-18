"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MessageSquare,
  Send,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Loader2,
  X,
  LifeBuoy,
  User as UserIcon,
  Maximize2,
  ExternalLink,
  Download,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { SessionUser } from "@/types";
import { toast } from "sonner";

interface TicketMessage {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorRole: string;
  authorAvatar?: string | null;
  message: string;
  imageUrl?: string | null;
  createdAt: string;
}

interface TicketData {
  id: string;
  title: string;
  category: "BUG" | "SERVER_INCIDENT" | "SECURITY" | "FEATURE";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string | null;
  assignedTo?: string | null;
  description: string;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TicketDetailViewProps {
  ticketId: string;
  currentUser: SessionUser;
}

export function TicketDetailView({ ticketId, currentUser }: TicketDetailViewProps) {
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Reply state
  const [replyText, setReplyText] = useState("");
  const [replyImage, setReplyImage] = useState<string | null>(null);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const replyImageInputRef = useRef<HTMLInputElement>(null);

  // Lightbox modal state
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Updating status state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchTicketDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setTicket(json.data.ticket);
        setMessages(json.data.messages || []);
      } else {
        toast.error(json.message || "Failed to load ticket");
      }
    } catch {
      toast.error("Network communication failure");
    } finally {
      setIsLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchTicketDetails();
  }, [fetchTicketDetails]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && lightboxImage) {
        setLightboxImage(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxImage]);

  const handleReplyImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files can be attached.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size must be less than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setReplyImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) {
      toast.error("Reply text cannot be empty");
      return;
    }

    setIsSendingReply(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: replyText,
          imageUrl: replyImage || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to send message");
        return;
      }

      toast.success("Reply posted to thread");
      setReplyText("");
      setReplyImage(null);
      fetchTicketDetails();
    } catch {
      toast.error("Network error");
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Ticket marked as ${newStatus}`);
        fetchTicketDetails();
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch {
      toast.error("Communication error");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Ticket deleted successfully");
        window.location.href = "/tickets";
      } else {
        toast.error(data.message || "Failed to delete ticket");
      }
    } catch {
      toast.error("Operation failed");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mx-auto mb-3" />
        <span className="text-xs font-mono text-slate-500">Loading incident conversation...</span>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-16 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">Ticket Not Found</h2>
        <p className="text-xs text-slate-500 font-mono">This ticket may have been deleted or access is restricted.</p>
        <Link
          href="/tickets"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Tickets</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <Link
          href="/tickets"
          className="inline-flex items-center gap-2 text-xs font-mono text-cyan-600 dark:text-cyan-400 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Tickets Registry</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Status selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-500 font-semibold">STATUS:</span>
            <select
              value={ticket.status}
              disabled={isUpdatingStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="h-8 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>

          {(currentUser.role === "ADMIN" || ticket.authorId === currentUser.id) && (
            <button
              onClick={() => setIsDeleteOpen(true)}
              className="p-2 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs transition-colors"
              title="Delete ticket"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Ticket Master Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-400">
            #{ticket.id.slice(-6)}
          </span>

          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
              ticket.category === "BUG"
                ? "bg-rose-100 dark:bg-rose-950 text-rose-600"
                : ticket.category === "SERVER_INCIDENT"
                ? "bg-amber-100 dark:bg-amber-950 text-amber-600"
                : ticket.category === "SECURITY"
                ? "bg-red-100 dark:bg-red-950 text-red-600 font-bold"
                : "bg-blue-100 dark:bg-blue-950 text-blue-600"
            }`}
          >
            {ticket.category.replace("_", " ")}
          </span>

          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
              ticket.priority === "URGENT"
                ? "bg-rose-600 text-white"
                : ticket.priority === "HIGH"
                ? "bg-amber-500 text-slate-950"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}
          >
            {ticket.priority} PRIORITY
          </span>

          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
              ticket.status === "OPEN"
                ? "bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300"
                : ticket.status === "IN_PROGRESS"
                ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                : "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400"
            }`}
          >
            {ticket.status}
          </span>
        </div>

        <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
          {ticket.title}
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-mono text-slate-500">
          <div>
            Reported by: <strong className="text-slate-800 dark:text-slate-200">{ticket.authorName} (@{ticket.authorUsername})</strong>
          </div>
          <div>
            Assigned to: <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{ticket.assignedTo || "System Administrator"}</span>
          </div>
          <div>
            Logged: {formatDateTime(ticket.createdAt)}
          </div>
        </div>
      </div>

      {/* Threaded Discussion Messages */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-slate-500 px-1">
          <MessageSquare className="w-4 h-4 text-cyan-500" />
          <span>Incident Conversation History ({messages.length})</span>
        </div>

        <div className="space-y-4">
          {messages.map((msg, index) => {
            const isAdmin = msg.authorRole === "ADMIN";
            const isSelf = msg.authorId === currentUser.id;

            return (
              <div
                key={msg.id}
                className={`rounded-2xl border p-4 sm:p-5 shadow-xs space-y-3 transition-colors ${
                  isAdmin
                    ? "border-cyan-200 dark:border-cyan-900/60 bg-cyan-50/40 dark:bg-cyan-950/20"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322]"
                }`}
              >
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 font-mono">
                      {msg.authorName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{msg.authorName}</span>
                        <span className="text-slate-500 text-[11px] font-mono">@{msg.authorUsername}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                            isAdmin
                              ? "bg-cyan-500 text-slate-950"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {msg.authorRole}
                        </span>
                        {isSelf && (
                          <span className="text-[10px] text-cyan-600 font-mono font-bold">
                            (YOU)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400">
                    {formatDateTime(msg.createdAt)}
                  </span>
                </div>

                {/* Message Body */}
                <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {msg.message}
                </div>

                {/* Attached Screenshot Image */}
                {msg.imageUrl && (
                  <div className="pt-2">
                    <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-950 overflow-hidden shadow-md max-w-2xl">
                      {/* Action Header Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-900 border-b border-slate-800 text-xs font-mono">
                        <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                          <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Lampiran Bukti / Screenshot Diagnostik</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setLightboxImage(msg.imageUrl || null)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] transition-colors"
                            title="Perbesar gambar"
                          >
                            <Maximize2 className="w-3 h-3" />
                            <span>Perbesar Gambar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (msg.imageUrl) {
                                const w = window.open();
                                if (w) {
                                  w.document.write(
                                    `<!DOCTYPE html><html><head><title>Diagnostic Screenshot</title><style>body{margin:0;background:#0d1322;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;box-sizing:border-box;}img{max-width:100%;height:auto;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,0.8);}</style></head><body><img src="${msg.imageUrl}"/></body></html>`
                                  );
                                }
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors"
                            title="Buka langsung di tab baru"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Buka Langsung</span>
                          </button>
                          <a
                            href={msg.imageUrl}
                            download={`diagnostic-screenshot-${msg.id.slice(-4)}.png`}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors"
                            title="Unduh gambar"
                          >
                            <Download className="w-3 h-3" />
                            <span>Unduh</span>
                          </a>
                        </div>
                      </div>

                      {/* Direct Clickable High-Resolution Preview */}
                      <div
                        onClick={() => setLightboxImage(msg.imageUrl || null)}
                        className="p-2 bg-slate-950 flex items-center justify-center cursor-pointer hover:bg-slate-900/50 transition-colors group min-h-[160px] max-h-80 overflow-hidden"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={msg.imageUrl}
                          alt="Diagnostic Screenshot"
                          className="max-h-72 w-auto max-w-full rounded object-contain group-hover:scale-[1.01] transition-transform duration-150"
                        />
                      </div>
                      <div className="px-3 py-1.5 bg-slate-900/60 border-t border-slate-800/60 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                        <span>Klik gambar untuk tampilan modal penuh</span>
                        <span className="text-cyan-400 font-semibold">Tersedia Resolusi Penuh</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Reply Composer Form */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Send className="w-3.5 h-3.5 text-cyan-500" />
            <span>Post Reply / Status Update</span>
          </h3>

          <button
            type="button"
            onClick={() => replyImageInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 text-xs font-semibold hover:bg-cyan-500/20 transition-colors"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Attach Screenshot</span>
          </button>
        </div>

        <input
          type="file"
          ref={replyImageInputRef}
          onChange={handleReplyImageSelect}
          accept="image/*"
          className="hidden"
        />

        {replyImage && (
          <div className="relative inline-block rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden bg-slate-950 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={replyImage} alt="Reply preview" className="max-h-36 rounded object-contain" />
            <button
              type="button"
              onClick={() => setReplyImage(null)}
              className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white hover:bg-rose-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <form onSubmit={handleSendReply} className="space-y-3">
          <textarea
            rows={4}
            required
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your reply, troubleshooting steps, or resolution verification..."
            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs text-slate-900 dark:text-slate-100 outline-none resize-none leading-relaxed"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSendingReply}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-cyan-glow-sm disabled:opacity-50"
            >
              {isSendingReply ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending Message...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Reply</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-150"
        >
          {/* Modal Header Controls */}
          <div
            className="w-full max-w-5xl flex items-center justify-between py-2 px-4 mb-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-cyan-400" />
              <span className="font-bold">Detail Gambar Diagnostik Layar Penuh</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  const w = window.open();
                  if (w) {
                    w.document.write(
                      `<!DOCTYPE html><html><head><title>Diagnostic Screenshot</title><style>body{margin:0;background:#0d1322;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;box-sizing:border-box;}img{max-width:100%;height:auto;border-radius:8px;}</style></head><body><img src="${lightboxImage}"/></body></html>`
                    );
                  }
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Buka di Tab Baru</span>
              </button>
              <a
                href={lightboxImage}
                download="diagnostic-screenshot-full.png"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh</span>
              </a>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Tutup (ESC)</span>
              </button>
            </div>
          </div>

          {/* Modal Image Box */}
          <div
            className="relative max-w-5xl max-h-[82vh] p-2 bg-slate-950 rounded-2xl border border-slate-700 shadow-2xl flex items-center justify-center overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImage}
              alt="Enlarged screenshot"
              className="max-w-full max-h-[78vh] rounded-lg object-contain"
            />
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Incident Ticket"
        description="Permanently delete this ticket and all conversation messages. This action cannot be undone."
        targetName={`#${ticket.id.slice(-6)}: ${ticket.title}`}
        confirmLabel="Delete Ticket"
        isLoading={isDeleting}
      />
    </div>
  );
}
