"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  LifeBuoy,
  Plus,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
  Image as ImageIcon,
  MessageSquare,
  Shield,
  Loader2,
  RefreshCw,
  X,
  Lock,
  ArrowRight,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { SessionUser } from "@/types";
import { toast } from "sonner";

interface TicketItem {
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

interface TicketsManagementViewProps {
  currentUser: SessionUser;
}

export function TicketsManagementView({ currentUser }: TicketsManagementViewProps) {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    urgent: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"BUG" | "SERVER_INCIDENT" | "SECURITY" | "FEATURE">("BUG");
  const [priority, setPriority] = useState<"LOW" | "NORMAL" | "HIGH" | "URGENT">("NORMAL");
  const [description, setDescription] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Delete dialog state
  const [ticketToDelete, setTicketToDelete] = useState<TicketItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/tickets");
      const json = await res.json();
      if (json.success && json.data) {
        setTickets(json.data.tickets || []);
        if (json.data.stats) setStats(json.data.stats);
      }
    } catch {
      toast.error("Failed to load support tickets");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size exceeds 5MB limit");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Please fill in both title and description.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          priority,
          description,
          imageUrl: imagePreview || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to create ticket");
        return;
      }

      toast.success("Incident ticket created successfully!");
      setIsCreateOpen(false);
      setTitle("");
      setDescription("");
      setImagePreview(null);
      fetchTickets();
    } catch {
      toast.error("Network communication failure");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!ticketToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/tickets/${ticketToDelete.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to delete ticket");
        return;
      }
      toast.success("Ticket deleted successfully");
      setTicketToDelete(null);
      fetchTickets();
    } catch {
      toast.error("Operation failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch =
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.authorName.toLowerCase().includes(q) ||
      t.authorUsername.toLowerCase().includes(q);
    const matchesCategory = categoryFilter === "ALL" || t.category === categoryFilter;
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            <span>Support Tickets & Incident Reporting</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Report bugs, infrastructure anomalies, and collaborate with administrators with screenshot attachments
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchTickets}
            disabled={isLoading}
            className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 text-xs shadow-xs"
            title="Refresh tickets"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-cyan-glow-sm transition-all hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            <span>Open New Ticket</span>
          </button>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-xs text-cyan-800 dark:text-cyan-300">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
          <span>
            <strong>Isolated Personal Space:</strong> Regular operators only see reports authored by themselves. Sensitive system incidents are restricted from public dissemination.
          </span>
        </div>
        <span className="hidden sm:inline font-mono text-[10px] bg-cyan-100 dark:bg-cyan-900 px-2 py-0.5 rounded font-bold uppercase">
          ROLE: {currentUser.role}
        </span>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] shadow-xs">
          <div className="text-[10px] font-mono text-slate-500 uppercase font-bold">TOTAL REPORTS</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{stats.total}</div>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] shadow-xs">
          <div className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 uppercase font-bold">OPEN TICKETS</div>
          <div className="text-xl font-bold text-cyan-600 dark:text-cyan-400 mt-1">{stats.open}</div>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] shadow-xs">
          <div className="text-[10px] font-mono text-purple-600 dark:text-purple-400 uppercase font-bold">IN PROGRESS</div>
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.inProgress}</div>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] shadow-xs">
          <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase font-bold">RESOLVED</div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.resolved}</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets, keywords..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-500 outline-none font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="BUG">Software Bug</option>
            <option value="SERVER_INCIDENT">Server Incident</option>
            <option value="SECURITY">Security Alert</option>
            <option value="FEATURE">Feature Request</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-500 mx-auto mb-2" />
            <span className="text-xs font-mono text-slate-500">Querying incident registry...</span>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <LifeBuoy className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">No Support Tickets Found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto font-mono">
              You haven&apos;t filed any tickets yet. Click &apos;Open New Ticket&apos; to submit an incident or bug report.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredTickets.map((t) => (
              <div
                key={t.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400 font-bold">
                      #{t.id.slice(-6)}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        t.category === "BUG"
                          ? "bg-rose-100 dark:bg-rose-950 text-rose-600"
                          : t.category === "SERVER_INCIDENT"
                          ? "bg-amber-100 dark:bg-amber-950 text-amber-600"
                          : t.category === "SECURITY"
                          ? "bg-red-100 dark:bg-red-950 text-red-600 font-bold"
                          : "bg-blue-100 dark:bg-blue-950 text-blue-600"
                      }`}
                    >
                      {t.category.replace("_", " ")}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        t.priority === "URGENT"
                          ? "bg-rose-600 text-white"
                          : t.priority === "HIGH"
                          ? "bg-amber-500 text-slate-950"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {t.priority}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        t.status === "OPEN"
                          ? "bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300"
                          : t.status === "IN_PROGRESS"
                          ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                          : "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400"
                      }`}
                    >
                      {t.status}
                    </span>

                    {t.imageUrl && (
                      <span className="flex items-center gap-1 text-[11px] font-mono text-cyan-600 dark:text-cyan-400">
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Screenshot Attached</span>
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/tickets/${t.id}`}
                    className="block font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors truncate"
                  >
                    {t.title}
                  </Link>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                    {t.description}
                  </p>

                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-3 pt-0.5">
                    <span>Reported by: <strong className="text-slate-700 dark:text-slate-300">@{t.authorUsername}</strong></span>
                    <span>•</span>
                    <span>{formatDateTime(t.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Link
                    href={`/tickets/${t.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-cyan-500 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>View Discussion</span>
                  </Link>

                  {(currentUser.role === "ADMIN" || t.authorId === currentUser.id) && (
                    <button
                      onClick={() => setTicketToDelete(t)}
                      className="p-2 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs transition-colors"
                      title="Delete ticket"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Submit Incident / Bug Report</h3>
                <p className="text-xs text-slate-500">Provide details and error screenshots to assist administrators</p>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Incident Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Nginx reverse proxy returning 502 Bad Gateway during load spike"
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full h-9 px-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none"
                  >
                    <option value="BUG">Software Bug</option>
                    <option value="SERVER_INCIDENT">Server Incident</option>
                    <option value="SECURITY">Security Vulnerability</option>
                    <option value="FEATURE">Feature Request</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full h-9 px-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none"
                  >
                    <option value="LOW">Low (Minor)</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High (Urgent Attention)</option>
                    <option value="URGENT">Urgent (Production Outage)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Incident Description & Diagnostics
                </label>
                <textarea
                  rows={5}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the steps to reproduce, affected server IP, log extracts, or error messages..."
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs text-slate-900 dark:text-slate-100 outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Image / Screenshot Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Attach Error Screenshot / Diagram (Optional)
                </label>
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="relative rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden bg-slate-950 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => imageInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50 dark:bg-slate-950"
                  >
                    <ImageIcon className="w-6 h-6 mx-auto text-cyan-500 mb-1" />
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Click to upload error screenshot from disk
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      PNG, JPG, WebP up to 5MB
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
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
                  <span>Submit Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Ticket Dialog */}
      <ConfirmDialog
        isOpen={Boolean(ticketToDelete)}
        onClose={() => setTicketToDelete(null)}
        onConfirm={handleDeleteTicket}
        title="Delete Support Ticket"
        description="Permanently delete this incident report and all its discussion thread history."
        targetName={ticketToDelete ? `#${ticketToDelete.id.slice(-6)}: ${ticketToDelete.title}` : ""}
        confirmLabel="Delete Ticket"
        isLoading={isDeleting}
      />
    </div>
  );
}
