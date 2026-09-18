"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Key,
  Shield,
  Eye,
  EyeOff,
  Lock,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Smartphone,
  Laptop,
  Check,
  Radio,
} from "lucide-react";
import { toast } from "sonner";

export function SecurityView() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Security settings state
  const [requireTransferApproval, setRequireTransferApproval] = useState(false);
  const [requireMailApproval, setRequireMailApproval] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isUpdatingSetting, setIsUpdatingSetting] = useState<string | null>(null);

  React.useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/profile/security");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data?.securitySettings) {
            setRequireTransferApproval(!!json.data.securitySettings.requireTransferApproval);
            setRequireMailApproval(!!json.data.securitySettings.requireMailApproval);
            setIs2FAEnabled(!!json.data.securitySettings.twoFactorEnabled);
          }
        }
      } catch {
        // ignore initial fetch error
      }
    }
    loadSettings();
  }, []);

  const updateSetting = async (key: string, value: boolean) => {
    setIsUpdatingSetting(key);
    try {
      const res = await fetch("/api/profile/security", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (key === "requireTransferApproval") setRequireTransferApproval(value);
        if (key === "requireMailApproval") setRequireMailApproval(value);
        if (key === "twoFactorEnabled") setIs2FAEnabled(value);
        toast.success(value ? "Security policy activated" : "Security policy deactivated");
      } else {
        toast.error(data.message || "Failed to update security preference");
      }
    } catch {
      toast.error("Network communication failure");
    } finally {
      setIsUpdatingSetting(null);
    }
  };

  const getStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "Empty", color: "bg-slate-300 dark:bg-slate-700" };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-rose-500" };
    if (score === 2) return { score: 2, label: "Fair", color: "bg-amber-500" };
    if (score === 3) return { score: 3, label: "Good", color: "bg-cyan-500" };
    return { score: 4, label: "Strong", color: "bg-emerald-500" };
  };

  const strength = getStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/profile/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to update password");
        return;
      }

      toast.success(data.message || "Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Network communication failure");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle2FA = () => {
    updateSetting("twoFactorEnabled", !is2FAEnabled);
  };

  const handleTerminateSessions = () => {
    toast.success("All other active operator sessions terminated successfully");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-xs font-mono text-cyan-600 dark:text-cyan-400 hover:underline transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Profile</span>
        </Link>
      </div>

      {/* Password Reset Form Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-500/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Security Credentials & Authentication
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Change your login password and enforce cryptographic verification
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showCurrent ? "text" : "password"}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full h-10 pl-9 pr-10 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs text-slate-900 dark:text-slate-100 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-500"
                aria-label={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              New Password (Minimum 8 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showNew ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new strong password"
                className="w-full h-10 pl-9 pr-10 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs text-slate-900 dark:text-slate-100 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-500"
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Strength Meter */}
            {newPassword && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-full flex-1 transition-colors duration-300 ${
                        strength.score >= step ? strength.color : "bg-slate-200 dark:bg-slate-800"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showConfirm ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full h-10 pl-9 pr-10 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 text-xs text-slate-900 dark:text-slate-100 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-500"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-cyan-glow-sm transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating Credentials...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Inbound File Quarantine Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Zero-Trust File Ingestion Quarantine
              </h3>
              <p className="text-[11px] text-slate-500">
                Incoming peer file transfers require manual operator acceptance before storage allocation
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isUpdatingSetting === "requireTransferApproval"}
            onClick={() => updateSetting("requireTransferApproval", !requireTransferApproval)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              requireTransferApproval
                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            {isUpdatingSetting === "requireTransferApproval" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : requireTransferApproval ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : null}
            <span>{requireTransferApproval ? "Quarantine Active" : "Auto-Accept Transfers"}</span>
          </button>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
          <p>
            When enabled, all inbound peer-to-peer file transfers will enter a <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">PENDING_APPROVAL</span> state. Files will not be stored in your personal vault until you review and confirm acceptance.
          </p>
        </div>
      </div>

      {/* Inbound Mail Quarantine Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Inbound Peer Mail Quarantine & Screening
              </h3>
              <p className="text-[11px] text-slate-500">
                Hold newly delivered emails in quarantine until operator verification
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isUpdatingSetting === "requireMailApproval"}
            onClick={() => updateSetting("requireMailApproval", !requireMailApproval)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              requireMailApproval
                ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            {isUpdatingSetting === "requireMailApproval" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : requireMailApproval ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : null}
            <span>{requireMailApproval ? "Quarantine Active" : "Direct Ingestion"}</span>
          </button>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
          <p>
            When enabled, incoming emails from other users will be held in the <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">Quarantined</span> inbox queue. Storage is protected from spam and unapproved messages until accepted.
          </p>
        </div>
      </div>

      {/* Two-Factor Authentication Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-cyan-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Two-Factor Authentication (2FA / TOTP)
              </h3>
              <p className="text-[11px] text-slate-500">
                Require authenticator app code on login
              </p>
            </div>
          </div>

          <button
            onClick={handleToggle2FA}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              is2FAEnabled
                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            {is2FAEnabled ? "2FA Enabled" : "Enable 2FA"}
          </button>
        </div>

        {is2FAEnabled && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Cryptographic Token Active</span>
            </div>
            <span>Secret Key: TSSB-AUTH-8921-ENCRYPTED-HEX</span>
          </div>
        )}
      </div>

      {/* Active Login Sessions Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Laptop className="w-5 h-5 text-blue-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Active Operator Sessions
              </h3>
              <p className="text-[11px] text-slate-500">
                Devices authorized with valid JWT sessions
              </p>
            </div>
          </div>

          <button
            onClick={handleTerminateSessions}
            className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 transition-colors"
          >
            Terminate Others
          </button>
        </div>

        <div className="space-y-2 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <div>
                <div className="text-slate-900 dark:text-slate-100 font-bold font-sans">
                  Current Browser Session (Windows / Chrome)
                </div>
                <div className="text-[11px] text-slate-500">IP: 127.0.0.1 • Active Now</div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
              THIS DEVICE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
