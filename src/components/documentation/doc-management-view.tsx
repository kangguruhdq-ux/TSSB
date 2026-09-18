"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Plus,
  BookOpen,
  Filter,
  Server,
  User as UserIcon,
  Calendar,
  ExternalLink,
  X,
  Loader2,
} from "lucide-react";
import { RefreshButton } from "@/components/common/refresh-button";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { formatDate } from "@/lib/utils";
import { DocCategory, SessionUser } from "@/types";
import { toast } from "sonner";

interface DocRecord {
  id: string;
  title: string;
  category: DocCategory;
  content: string;
  serverId?: string | null;
  createdAt: string;
  updatedAt: string;
  server?: {
    id: string;
    name: string;
    hostname: string;
  } | null;
  author: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string | null;
  };
}

interface DocManagementViewProps {
  currentUser: SessionUser;
}

export function DocManagementView({ currentUser }: DocManagementViewProps) {
  const [docs, setDocs] = useState<DocRecord[]>([]);
  const [servers, setServers] = useState<{ id: string; name: string; hostname: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<DocCategory>("INSTALLATION");
  const [newContent, setNewContent] = useState("");
  const [newServerId, setNewServerId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDocs = useCallback(async () => {
    setIsLoading(true);
    try {
      const [docRes, srvRes] = await Promise.all([
        fetch("/api/documentation"),
        fetch("/api/servers"),
      ]);
      const docJson = await docRes.json();
      const srvJson = await srvRes.json();

      if (docJson.success && Array.isArray(docJson.data)) {
        setDocs(docJson.data);
      }
      if (srvJson.success && Array.isArray(srvJson.data)) {
        setServers(srvJson.data);
      }
    } catch {
      toast.error("Failed to load documentation library");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/documentation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          content: newContent,
          serverId: newServerId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to publish documentation");
        return;
      }
      toast.success("Documentation published and stored in PostgreSQL!");
      setIsCreateOpen(false);
      setNewTitle("");
      setNewContent("");
      setNewServerId("");
      fetchDocs();
    } catch {
      toast.error("Network communication failure");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = docs.filter((d) => {
    const q = search.toLowerCase();
    const matchQ =
      d.title.toLowerCase().includes(q) ||
      d.content.toLowerCase().includes(q) ||
      (d.server && d.server.hostname.toLowerCase().includes(q));

    const matchCat = categoryFilter === "ALL" || d.category === categoryFilter;
    return matchQ && matchCat;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            <span>Operational Runbooks & Docs</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Standard operating procedures, installation protocols, and security guidelines
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <RefreshButton onRefresh={fetchDocs} isLoading={isLoading} />
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-cyan-glow-sm transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Author Runbook</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search runbooks, protocols, tags..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs w-full sm:w-auto">
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8 px-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="INSTALLATION">Installation</option>
            <option value="CONFIGURATION">Configuration</option>
            <option value="NETWORKING">Networking</option>
            <option value="SECURITY">Security</option>
            <option value="TROUBLESHOOTING">Troubleshooting</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Docs Grid */}
      {isLoading ? (
        <LoadingSpinner label="Fetching documentation guides..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documentation found"
          description="Author an operational runbook or installation protocol to build the knowledge base."
          actionLabel="Author Runbook"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((doc) => (
            <Link
              key={doc.id}
              href={`/documentation/${doc.id}`}
              className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] hover:border-cyan-500/50 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group shadow-xs hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800/40 text-cyan-700 dark:text-cyan-300">
                    {doc.category}
                  </span>
                  {doc.server && (
                    <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Server className="w-3 h-3 text-slate-400" />
                      {doc.server.hostname}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-2 leading-snug">
                  {doc.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                  {doc.content.replace(/[#*`]/g, "")}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 text-[8px]">
                    <UserIcon className="w-2.5 h-2.5" />
                  </div>
                  <span>@{doc.author?.username || "author"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(doc.updatedAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Author Documentation Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Author Runbook Guide</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Document installation or administration procedures</p>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Guide Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. BIND9 DNSSEC Zone Signing Setup Guide"
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as DocCategory)}
                    className="w-full h-9 px-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none"
                  >
                    <option value="INSTALLATION">INSTALLATION</option>
                    <option value="CONFIGURATION">CONFIGURATION</option>
                    <option value="NETWORKING">NETWORKING</option>
                    <option value="SECURITY">SECURITY</option>
                    <option value="TROUBLESHOOTING">TROUBLESHOOTING</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tagged Server (Optional)
                  </label>
                  <select
                    value={newServerId}
                    onChange={(e) => setNewServerId(e.target.value)}
                    className="w-full h-9 px-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none"
                  >
                    <option value="">General (No specific server)</option>
                    {servers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.hostname} — {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Markdown Content
                </label>
                <textarea
                  rows={8}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="### Overview&#10;&#10;Detailed operational instructions, CLI commands, and checklist..."
                  className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="mt-4 flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-cyan-glow-sm"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Publish Runbook</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
