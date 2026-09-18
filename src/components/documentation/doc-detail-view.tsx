"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  ArrowLeft,
  Server,
  User as UserIcon,
  Calendar,
  Trash2,
  Edit2,
  Copy,
  Check,
  Tag,
} from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { formatDateTime } from "@/lib/utils";
import { SessionUser } from "@/types";
import { toast } from "sonner";

interface DocDetailProps {
  doc: any;
  currentUser: SessionUser;
}

export function DocDetailView({ doc, currentUser }: DocDetailProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const canManage = currentUser.role === "ADMIN" || doc.authorId === currentUser.id;

  const handleCopy = () => {
    navigator.clipboard.writeText(doc.content);
    setCopied(true);
    toast.success("Runbook content copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/documentation/${doc.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to delete runbook");
        return;
      }
      toast.success("Documentation guide removed from PostgreSQL");
      router.push("/documentation");
      router.refresh();
    } catch {
      toast.error("Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/documentation"
          className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Documentation</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-mono shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy Raw"}</span>
          </button>

          {canManage && (
            <button
              onClick={() => setIsConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-xs font-mono"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Document Body */}
      <article className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] p-6 sm:p-8 shadow-sm dark:shadow-xl">
        {/* Document Header */}
        <div className="pb-6 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950 border border-cyan-200 dark:border-cyan-800/40 text-cyan-700 dark:text-cyan-300">
              {doc.category}
            </span>
            {doc.server && (
              <Link
                href={`/servers/${doc.server.id}`}
                className="font-mono text-xs text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 flex items-center gap-1 px-2.5 py-0.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <Server className="w-3 h-3 text-slate-400" />
                <span>Tagged: {doc.server.hostname}</span>
              </Link>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {doc.title}
          </h1>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-500 dark:text-slate-400 pt-1">
            <div className="flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Authored by @{doc.author?.username || "admin"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Last updated: {formatDateTime(doc.updatedAt)}</span>
            </div>
          </div>
        </div>

        {/* Content Rendered Cleanly */}
        <div className="mt-6 text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
          {doc.content}
        </div>
      </article>

      {/* Delete Modal */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Documentation Article"
        description="Permanently delete this runbook guide from the PostgreSQL database."
        targetName={doc.title}
        confirmLabel="Delete Guide"
        isLoading={isDeleting}
      />
    </div>
  );
}
