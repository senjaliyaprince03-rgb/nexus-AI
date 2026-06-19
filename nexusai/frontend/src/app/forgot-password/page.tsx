"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { LogoMark } from "@/components/brand/LogoMark"
import { useBackendAvailability } from "@/hooks/useBackendAvailability";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeTone, setNoticeTone] = useState<"warning" | "error">("warning");
  const backend = useBackendAvailability();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    if (backend.isOffline) {
      setNoticeTone("warning");
      setNotice("Password reset is unavailable until the API server is running. Start the backend, then try again.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email });
      setSent(true);
    } catch (err: unknown) {
      const detail = (err as { detail?: string })?.detail ?? (err as { message?: string })?.message ?? "";
      if (/unavailable|offline|cannot reach|failed to fetch/i.test(detail)) {
        setNoticeTone("warning");
        setNotice("Password reset is unavailable until the API server is running. Start the backend, then try again.");
      } else {
        setNoticeTone("error");
        setNotice(detail || "We couldn't send the reset email right now.");
      }
    } finally {
      setLoading(false);
    }
  }

  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.15 } }
  };
  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, bounce: 0.4 } }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left side */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex w-[45%] relative bg-[#18181B] flex-col items-center justify-center overflow-hidden"
      >
        <Image src="/images/secure_vault.png" alt="Security" fill className="object-cover opacity-50" sizes="45vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#18181B] via-[#18181B]/40 to-transparent" />
        <div className="relative z-10 mt-auto w-full px-10 pb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-[#F8F9FA]/10 flex items-center justify-center mb-6 text-[#C5A059]"
          >
            <LogoMark className="w-6 h-6 rounded-md shadow-none" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="font-display text-3xl text-white tracking-[-0.02em] leading-[1.15] mb-3"
          >
            We&apos;ve got your back.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-white/60 text-sm leading-relaxed max-w-[340px]"
          >
            Reset your password securely and get back to your workspace in seconds.
          </motion.p>
        </div>
      </motion.div>

      {/* Right side */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded-lg bg-[#C5A059] flex items-center justify-center text-white">
              <LogoMark className="w-5 h-5 rounded-md shadow-none" />
            </div>
            <span className="font-sans font-bold text-[#18181B] tracking-tight text-[17px]">NexusAI</span>
          </div>

          <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-8">
            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", bounce: 0.3 }}
                  className="text-center space-y-5 py-6"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-[#18181B] mb-2">Check your inbox</h2>
                    <p className="text-[15px] text-[#9CA3AF]">
                      If <strong className="text-[#18181B]">{email}</strong> is registered, you&apos;ll receive a reset link shortly.
                    </p>
                  </div>
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#C5A059] hover:text-[#E55A25] transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to login
                  </Link>
                </motion.div>
              ) : (
                <motion.div key="form" className="space-y-8">
                  <motion.div variants={itemVars}>
                    <h1 className="text-3xl font-semibold text-[#18181B] tracking-tight mb-2">Forgot password</h1>
                    <p className="text-[15px] text-[#9CA3AF]">We&apos;ll email you a reset link.</p>
                  </motion.div>

                  {backend.isOffline && (
                    <motion.div
                      variants={itemVars}
                      role="status"
                      className="rounded-2xl border border-[#FFD7C7] bg-[#FFF7F2] px-4 py-3 text-sm font-medium leading-relaxed text-[#A07D3A]"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold">Backend unavailable</p>
                          <p className="mt-1 text-sm leading-relaxed">
                            Reset emails can&apos;t be sent until the API server is running. Refresh after the backend is back online.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void backend.retry()}
                          className="inline-flex shrink-0 items-center justify-center rounded-full border border-[#FFB893] bg-white px-3 py-1.5 text-xs font-semibold text-[#A07D3A] transition hover:bg-[rgba(212,175,55,0.08)]"
                        >
                          Retry connection
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {notice && (
                    <motion.div
                      variants={itemVars}
                      role="status"
                      className={`rounded-2xl border px-4 py-3 text-sm font-medium leading-relaxed ${
                        noticeTone === "warning"
                          ? "border-[#FFD7C7] bg-[#FFF7F2] text-[#A07D3A]"
                          : "border-[#E0A8A8] bg-[#FFF5F5] text-[#A23333]"
                      }`}
                    >
                      {notice}
                    </motion.div>
                  )}

                  <motion.form variants={itemVars} onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-[#4B5563] uppercase tracking-wider">Email</label>
                      <input
                        type="email"
                        className="w-full bg-[#F8F7F4] border border-transparent rounded-xl px-4 py-3.5 text-sm text-[#18181B] outline-none focus:bg-white focus:border-[#C5A059] focus:ring-4 focus:ring-[#C5A059]/10 transition-all placeholder:text-[#A0A0A0]"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          if (notice) setNotice(null)
                        }}
                        required
                        disabled={loading || backend.isChecking}
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={loading || backend.isChecking || backend.isOffline}
                      className="w-full py-3.5 rounded-xl text-sm font-medium transition-all bg-[#18181B] text-white hover:bg-[#222222] shadow-[0_4px_12px_rgba(0,0,0,0.15)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : backend.isChecking ? "Checking connection..." : "Send reset link"}
                    </motion.button>
                  </motion.form>

                  <motion.p variants={itemVars} className="text-center text-[15px] text-[#9CA3AF]">
                    <Link href="/auth/login" className="text-[#18181B] font-semibold hover:text-[#C5A059] transition-colors inline-flex items-center gap-1.5">
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to login
                    </Link>
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

