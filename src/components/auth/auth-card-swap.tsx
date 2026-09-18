"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowLeftRight,
  Shield,
  Server,
  Database,
  Cpu,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import { TssbLogo } from "@/components/common/logo";
import { toast } from "sonner";

interface AuthCardSwapProps {
  initialMode?: "login" | "register";
  allowRegistrationInitial?: boolean;
}

export function AuthCardSwap({
  initialMode = "login",
  allowRegistrationInitial = true,
}: AuthCardSwapProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";
  const noticeParam = searchParams.get("notice");

  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [publicSettings, setPublicSettings] = useState<{
    allowRegistration: boolean;
    maintenanceMode: boolean;
    loginSuspended: boolean;
    loginSuspensionMessage: string;
  }>({
    allowRegistration: allowRegistrationInitial,
    maintenanceMode: false,
    loginSuspended: false,
    loginSuspensionMessage: "",
  });

  useEffect(() => {
    fetch("/api/public-settings")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setPublicSettings(json.data);
          if (json.data.allowRegistration === false) {
            setMode("login");
          }
        }
      })
      .catch(() => {});
  }, []);

  // Sync if URL requested registration but it's closed
  useEffect(() => {
    if (noticeParam === "registration_closed" || publicSettings.allowRegistration === false) {
      setMode("login");
    }
  }, [noticeParam, publicSettings.allowRegistration]);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state
  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  // Calculate password strength
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "Empty", color: "bg-slate-700" };
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

  const strength = getPasswordStrength(regPassword);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: loginIdentifier,
          password: loginPassword,
          rememberMe,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || "Invalid authentication credentials.");
        toast.error(data.message || "Login failed");
        return;
      }

      toast.success("Authentication confirmed. Accessing TSSB...");
      router.push(redirectUrl);
      router.refresh();
    } catch {
      setErrorMsg("Network error connecting to authentication service.");
      toast.error("Network communication failure");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (publicSettings.allowRegistration === false) {
      toast.error("Pendaftaran operator baru sedang dinonaktifkan oleh Administrator.");
      setMode("login");
      return;
    }

    setErrorMsg(null);

    if (regPassword !== regConfirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    if (regPassword.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          username: regUsername,
          email: regEmail,
          password: regPassword,
          confirmPassword: regConfirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || "Registration failed. Check inputs.");
        toast.error(data.message || "Registration failed");
        return;
      }

      toast.success("Account provisioned successfully in PostgreSQL!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrorMsg("Error registering account. Please try again.");
      toast.error("Network communication failure");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    if (publicSettings.allowRegistration === false && mode === "login") {
      toast.error("Pendaftaran akun sedang ditutup oleh Administrator.");
      return;
    }
    setErrorMsg(null);
    setMode((prev) => (prev === "login" ? "register" : "login"));
  };

  return (
    <div className="min-h-screen w-full bg-[#080c14] text-slate-100 flex flex-col justify-center items-center p-3.5 sm:p-6 cyber-grid relative overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="w-full max-w-5xl mb-4 sm:mb-6 flex items-center justify-between z-10 px-1">
        <TssbLogo size="lg" />
        <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2.5 sm:px-3 py-1.5 rounded-lg shadow-sm">
          <Shield className="w-3.5 h-3.5" />
          <span>ZERO-TRUST REALM</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start lg:items-center z-10">
        {/* Left Side: Modern Interactive Swap Card Form */}
        <div className="lg:col-span-6 w-full">
          <div className="text-left mb-3.5">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>TSSB — AUTHENTICATION HUB</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Secure enterprise cluster access & operator management
            </p>
          </div>

          {/* Maintenance Mode Alert Banner */}
          {(publicSettings.maintenanceMode || publicSettings.loginSuspended) && (
            <div className="mb-3.5 p-3 rounded-xl border border-amber-500/40 bg-amber-950/40 text-amber-300 text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <Shield className="w-4 h-4 flex-shrink-0 text-amber-400" />
              <div>
                <strong className="block font-bold">Maintenance Window Aktif:</strong>
                <span>
                  {publicSettings.loginSuspensionMessage ||
                    "Akses login pengguna sedang ditangguhkan sementara. Hanya akun Administrator yang dapat login."}
                </span>
              </div>
            </div>
          )}

          {/* Registration Closed Notice Banner */}
          {(noticeParam === "registration_closed" ||
            (publicSettings.allowRegistration === false && mode === "register")) && (
            <div className="mb-3.5 p-3 rounded-xl border border-amber-500/40 bg-amber-950/40 text-amber-300 text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <Lock className="w-4 h-4 flex-shrink-0 text-amber-400" />
              <div>
                <strong className="block font-bold">Pendaftaran Ditutup:</strong>
                <span>Pendaftaran akun operator baru sedang dinonaktifkan oleh Administrator. Silakan gunakan akun yang telah terdaftar.</span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-3.5 p-3 rounded-xl border border-rose-500/30 bg-rose-950/40 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Card Frame with Framer Motion */}
          <div className="w-full relative rounded-2xl border border-slate-700/80 bg-[#0d1322]/95 shadow-2xl p-5 sm:p-7 backdrop-blur-xl ring-1 ring-cyan-500/20">
            {/* Interactive Top Tab Selector with Animated Spring Highlight */}
            <div className="flex p-1 bg-slate-950/80 border border-slate-800 rounded-xl mb-5 relative w-full">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setMode("login");
                }}
                className={`flex-1 relative z-10 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  mode === "login" ? "text-cyan-400 font-bold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Masuk (Login)</span>
                {mode === "login" && (
                  <motion.div
                    layoutId="auth-active-tab-indicator"
                    className="absolute inset-0 bg-cyan-950/70 border border-cyan-500/40 rounded-lg -z-10 shadow-xs"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
              </button>

              <button
                type="button"
                disabled={publicSettings.allowRegistration === false}
                onClick={() => {
                  if (publicSettings.allowRegistration === false) {
                    toast.error("Pendaftaran operator baru sedang ditutup.");
                    return;
                  }
                  setErrorMsg(null);
                  setMode("register");
                }}
                className={`flex-1 relative z-10 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  publicSettings.allowRegistration === false
                    ? "opacity-60 cursor-not-allowed text-slate-500"
                    : mode === "register"
                    ? "text-cyan-400 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {publicSettings.allowRegistration === false ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Daftar (Ditutup)</span>
                  </>
                ) : (
                  <>
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>Daftar Akun</span>
                    {mode === "register" && (
                      <motion.div
                        layoutId="auth-active-tab-indicator"
                        className="absolute inset-0 bg-cyan-950/70 border border-cyan-500/40 rounded-lg -z-10 shadow-xs"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      />
                    )}
                  </>
                )}
              </button>
            </div>

            {/* Form Swap Animation Container */}
            <AnimatePresence mode="wait" initial={false}>
              {mode === "login" ? (
                /* LOGIN FORM */
                <motion.form
                  key="login-view"
                  onSubmit={handleLoginSubmit}
                  initial={{ opacity: 0, x: -14, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 14, scale: 0.98 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-white">Login Operator</h2>
                      <p className="text-xs text-slate-400">Masuk ke konsol administrasi TSSB</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <Shield className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Email or Username */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Email atau Username
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="nama@domain.com atau username"
                        className="w-full h-10 pl-9 pr-3 rounded-lg bg-slate-950/70 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs text-slate-100 placeholder-slate-500 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* Password with Eye Toggle */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Kata Sandi
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Masukkan kata sandi"
                        className="w-full h-10 pl-9 pr-10 rounded-lg bg-slate-950/70 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs text-slate-100 placeholder-slate-500 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 p-1"
                        aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <label className="flex items-center gap-2 text-slate-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500/20"
                      />
                      <span>Ingat sesi browser</span>
                    </label>
                    <span className="text-[11px] font-mono text-cyan-400/70">
                      TLS 1.3 Active
                    </span>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-10 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all duration-200 active:scale-[0.98] shadow-cyan-glow flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Memverifikasi...</span>
                      </>
                    ) : (
                      <span>Masuk ke Platform</span>
                    )}
                  </button>
                </motion.form>
              ) : (
                /* REGISTRATION FORM */
                <motion.form
                  key="register-view"
                  onSubmit={handleRegisterSubmit}
                  initial={{ opacity: 0, x: 14, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -14, scale: 0.98 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-3.5"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-white">Registrasi Operator</h2>
                      <p className="text-xs text-slate-400">Buat akun untuk akses layanan cluster</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Nama Lengkap
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Nama lengkap operator"
                        className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-950/70 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs text-slate-100 placeholder-slate-500 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* Username & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        required
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="username_baru"
                        className="w-full h-9 px-3 rounded-lg bg-slate-950/70 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs text-slate-100 placeholder-slate-500 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="email@domain.com"
                        className="w-full h-9 px-3 rounded-lg bg-slate-950/70 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs text-slate-100 placeholder-slate-500 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* Password with Strength Meter */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Kata Sandi (min 8 karakter)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Buat sandi aman"
                        className="w-full h-9 pl-9 pr-10 rounded-lg bg-slate-950/70 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs text-slate-100 placeholder-slate-500 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 p-1"
                        aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {regPassword && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden flex gap-1">
                          {[1, 2, 3, 4].map((step) => (
                            <div
                              key={step}
                              className={`h-full flex-1 transition-colors duration-300 ${
                                strength.score >= step ? strength.color : "bg-slate-800"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {strength.label}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Konfirmasi Sandi
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Ulangi kata sandi"
                        className="w-full h-9 pl-9 pr-10 rounded-lg bg-slate-950/70 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs text-slate-100 placeholder-slate-500 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 p-1"
                        aria-label={showConfirmPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Submit Register Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-10 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all duration-200 active:scale-[0.98] shadow-cyan-glow flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Mendaftarkan Akun...</span>
                      </>
                    ) : (
                      <span>Daftar Akun Baru</span>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Interactive Switch Trigger at Card Bottom */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col items-center gap-2 text-center">
              {publicSettings.allowRegistration === false ? (
                <div className="text-[11px] font-mono text-amber-400/90 bg-amber-950/30 border border-amber-800/40 px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>Pendaftaran akun baru saat ini dinonaktifkan oleh Administrator.</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={toggleMode}
                  className="inline-flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 font-mono transition-colors p-2 rounded-lg hover:bg-cyan-950/30 active:scale-95"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>
                    {mode === "login"
                      ? "Belum punya akun? Buat akun operator baru"
                      : "Sudah punya akun? Masuk ke Platform"}
                  </span>
                </button>
              )}
              <span className="text-[10px] font-mono text-slate-500">
                Enkripsi Sesi End-to-End & Proteksi RBAC Server-Side
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Visual Technical Infrastructure Panel */}
        <div className="lg:col-span-6 flex flex-col justify-center">
          <div className="relative rounded-2xl border border-slate-800 bg-[#0a0f1d]/90 p-5 sm:p-7 shadow-2xl overflow-hidden">
            {/* Visual background accents */}
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-5 sm:space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-3">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>INFRASTRUCTURE CONTROL</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Server Administration & System Management
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  A unified enterprise control platform designed for managing servers, microservices, network VLANs, authoritative DNS, documentation runbooks, and audit trails.
                </p>
              </div>

              {/* Infrastructure Nodes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 flex items-start gap-2.5">
                  <Server className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-slate-200 font-semibold">Web & App Nodes</div>
                    <div className="text-[10px] text-slate-400">Nginx / Node.js / Quic</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 flex items-start gap-2.5">
                  <Database className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-slate-200 font-semibold">PostgreSQL Relational</div>
                    <div className="text-[10px] text-slate-400">Neon Serverless Pool</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-slate-200 font-semibold">RBAC Security</div>
                    <div className="text-[10px] text-slate-400">Strict Server-side Auth</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-slate-200 font-semibold">Live Audit Logging</div>
                    <div className="text-[10px] text-slate-400">Transactional History</div>
                  </div>
                </div>
              </div>

              {/* Technical Topology Flow Snippet */}
              <div className="p-3 sm:p-3.5 rounded-xl border border-cyan-500/20 bg-slate-950/80 font-mono text-[11px] text-slate-300">
                <div className="text-cyan-400 font-semibold mb-1 flex items-center justify-between">
                  <span>ARCHITECTURE PIPELINE</span>
                  <span className="text-[9px] bg-cyan-900/40 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-700/40">
                    ONLINE
                  </span>
                </div>
                <div className="text-slate-400 break-words text-[10px] sm:text-[11px]">
                  Client → Vercel Edge → Next.js 15 App Router → Prisma ORM → Neon PostgreSQL
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
