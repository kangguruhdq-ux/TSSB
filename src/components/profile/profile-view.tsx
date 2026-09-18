"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  Shield,
  Key,
  Save,
  Loader2,
  Server,
  FileText,
  Building,
  Phone,
  CheckCircle2,
  Sparkles,
  Upload,
  Trash2,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { SessionUser } from "@/types";
import { toast } from "sonner";

interface ProfileViewProps {
  initialUser: any;
}

export function ProfileView({ initialUser }: ProfileViewProps) {
  const router = useRouter();
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialUser.name || "");
  const [username, setUsername] = useState(initialUser.username || "");
  const [email, setEmail] = useState(initialUser.email || "");
  const [bio, setBio] = useState(initialUser.bio || "");
  const [department, setDepartment] = useState(initialUser.department || "Infrastructure Engineering");
  const [phone, setPhone] = useState(initialUser.phone || "+1 (555) 234-5678");
  const [avatarUrl, setAvatarUrl] = useState(initialUser.avatarUrl || "");
  const [isSaving, setIsSaving] = useState(false);

  // 8 High-resolution professional tech avatars
  const presetAvatars = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
  ];

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Format file harus berupa gambar (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const rawUri = ev.target?.result as string;
      if (!rawUri) return;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.85);
          setAvatarUrl(compressed);
        } else {
          setAvatarUrl(rawUri);
        }
        toast.success("Foto profil siap disimpan! Klik 'Save Profile Changes'.");
      };
      img.onerror = () => {
        setAvatarUrl(rawUri);
        toast.success("Foto profil dipilih!");
      };
      img.src = rawUri;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          username,
          email,
          bio,
          avatarUrl,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        toast.error(data?.message || `Failed to update profile (${res.status})`);
        return;
      }
      toast.success("Operator profile updated successfully!");
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Network communication failure");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <UserIcon className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            <span>Operator Profile & Identity</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Identity credentials, biography, avatar selection, and cluster footprint
          </p>
        </div>

        <Link
          href="/profile/security"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-400 text-xs font-mono transition-colors shadow-xs"
        >
          <Key className="w-3.5 h-3.5 text-cyan-500" />
          <span>Security & Password</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Avatar & Overview */}
        <div className="md:col-span-4 space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] p-5 text-center shadow-xs">
            <div className="w-24 h-24 rounded-full mx-auto bg-slate-100 dark:bg-slate-800 border-2 border-cyan-500 p-1 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <img
                src={
                  avatarUrl ||
                  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
                }
                alt={name}
                className="w-full h-full rounded-full object-cover"
              />
            </div>

            <input
              type="file"
              ref={avatarFileRef}
              accept="image/*"
              onChange={handleAvatarFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => avatarFileRef.current?.click()}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-xs font-semibold transition-colors shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Foto dari Perangkat</span>
            </button>

            <h2 className="text-base font-bold text-slate-900 dark:text-white mt-3">{name}</h2>
            <div className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-semibold">@{username}</div>
            <div className="text-[11px] font-mono text-slate-500 mt-1">{email}</div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2">
              <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 border border-cyan-300 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300">
                {initialUser.role}
              </span>
              <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
                {initialUser.status}
              </span>
            </div>

            {/* Quick avatar selection */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold mb-2">
                Preset Operator Avatars
              </div>
              <div className="grid grid-cols-4 gap-2 justify-center">
                {presetAvatars.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(p)}
                    className={`w-9 h-9 rounded-full border overflow-hidden hover:scale-110 transition-all ${
                      avatarUrl === p
                        ? "border-cyan-500 ring-2 ring-cyan-500/40"
                        : "border-slate-200 dark:border-slate-700 opacity-75 hover:opacity-100"
                    }`}
                  >
                    <img src={p} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Owned Stats Card */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] p-4 text-xs font-mono text-slate-600 dark:text-slate-400 space-y-2.5 shadow-xs">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              INFRASTRUCTURE FOOTPRINT
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-cyan-500" />
                <span>Provisioned Servers</span>
              </span>
              <span className="text-slate-900 dark:text-slate-100 font-bold">
                {initialUser._count?.servers || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-500" />
                <span>Authored Runbooks</span>
              </span>
              <span className="text-slate-900 dark:text-slate-100 font-bold">
                {initialUser._count?.documentation || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile Form */}
        <div className="md:col-span-8">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] p-6 shadow-xs space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight pb-3 border-b border-slate-100 dark:border-slate-800">
              Account Credentials & Personal Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department / Team
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. DevOps Core, NetOps"
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Custom Avatar Image (URL / Base64)
                </label>
                {avatarUrl?.startsWith("data:image") && (
                  <span className="text-[10px] font-mono text-cyan-500 font-bold">
                    (Foto lokal terunggah)
                  </span>
                )}
              </div>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://... atau gunakan tombol 'Upload Foto' di sebelah kiri"
                className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Operator Bio / Role Description
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Lead DevOps administrator responsible for edge gateways..."
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs text-slate-900 dark:text-slate-100 outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-cyan-glow-sm transition-all"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
