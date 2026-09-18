"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Shield,
  User as UserIcon,
  ExternalLink,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/common/status-badge";
import { SafeUser } from "@/types";

interface UserManagementTableProps {
  users: SafeUser[];
  onRefresh?: () => void;
  isAdmin?: boolean;
}

export function UserManagementTable({
  users,
  onRefresh,
  isAdmin = false,
}: UserManagementTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const filtered = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);

    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchStatus = statusFilter === "ALL" || u.status === statusFilter;

    return matchSearch && matchRole && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322]/90 p-5 shadow-sm dark:shadow-lg flex flex-col justify-between overflow-hidden">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-xs font-bold tracking-wider uppercase text-slate-900 dark:text-slate-200">
              USER MANAGEMENT (RBAC)
            </h3>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            Role-based access matrix and identity directory
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search identity..."
              className="h-8 pl-8 pr-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-500 outline-none w-32 sm:w-40 font-mono"
            />
          </div>

          {/* Role Filter Selector */}
          <div className="relative flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs">
            <Filter className="w-3 h-3 text-cyan-600 dark:text-cyan-400 mr-1" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-[11px] font-mono text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">All Roles</option>
              <option value="ADMIN" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Admin</option>
              <option value="USER" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">User</option>
            </select>
          </div>

          {isAdmin && (
            <Link
              href="/admin/users"
              className="px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs font-mono hover:bg-cyan-100 dark:hover:bg-cyan-500/20 transition-colors"
            >
              Actions
            </Link>
          )}
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="pb-2.5 font-semibold">AVATAR</th>
              <th className="pb-2.5 font-semibold">NAME</th>
              <th className="pb-2.5 font-semibold">USERNAME</th>
              <th className="pb-2.5 font-semibold">EMAIL</th>
              <th className="pb-2.5 font-semibold">ROLE</th>
              <th className="pb-2.5 font-semibold">STATUS</th>
              <th className="pb-2.5 font-semibold">CREATED</th>
              <th className="pb-2.5 text-right font-semibold">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-slate-500 font-mono text-xs">
                  No user accounts match current filters.
                </td>
              </tr>
            ) : (
              paginated.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5">
                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 overflow-hidden text-[10px] font-bold">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserIcon className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 font-medium text-slate-900 dark:text-slate-200">
                    {user.name}
                  </td>
                  <td className="py-2.5 font-mono text-slate-600 dark:text-slate-400">
                    @{user.username}
                  </td>
                  <td className="py-2.5 font-mono text-slate-600 dark:text-slate-400 text-[11px] truncate max-w-[140px]">
                    {user.email}
                  </td>
                  <td className="py-2.5">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        user.role === "ADMIN"
                          ? "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30"
                          : "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <StatusBadge status={user.status} showDot={true} />
                  </td>
                  <td className="py-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="py-2.5 text-right">
                    {isAdmin ? (
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-600 dark:text-cyan-400 hover:text-cyan-500"
                        title="Manage user"
                      >
                        <span>Manage</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-400">View</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer matching reference (1 2 >) */}
      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-mono">
        <span className="text-slate-500">
          Showing {paginated.length} of {filtered.length} users
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="w-6 h-6 rounded border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-6 h-6 rounded text-[11px] font-mono flex items-center justify-center transition-colors ${
                currentPage === i + 1
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-xs"
                  : "border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-700"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="w-6 h-6 rounded border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
