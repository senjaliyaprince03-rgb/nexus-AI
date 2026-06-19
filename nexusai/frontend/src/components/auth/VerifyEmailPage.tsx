"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Loader2, MailCheck, RefreshCcw, ShieldCheck, TriangleAlert } from "lucide-react";
import { LogoMark } from "@/components/brand/LogoMark";
import { sendVerificationEmail, verifyEmail } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";
import { useBackendAvailability } from "@/hooks/useBackendAvailability";

type VerifyState = "checking" | "verified" | "waiting" | "error";

function VerifyEmailContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params?.get("token");
  const emailParam = params?.get("email");
  const user = useAuthStore((s) => s.user);
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const backend = useBackendAvailability();
  const [state, setState] = useState<VerifyState>(token ? "checking" : "waiting");
  const [message, setMessage] = useState("We sent a secure verification link to your inbox.");
  const [resending, setResending] = useState(false);

  const displayEmail = useMemo(() => emailParam || user?.email || "your email address", [emailParam, user?.email]);

  useEffect(() => {
    if (!token) return;
    if (backend.isChecking) return;
    if (backend.isOffline) {
      setState("error");
      setMessage("Email verification is unavailable until the API server is running. Start the backend, then try again.");
      return;
    }

    let active = true;
    const verificationToken = token;

    async function run() {
      try {
        const result = await verifyEmail(verificationToken);
        if (!active) return;
        setState("verified");
        setMessage(result.message || "Email verified successfully.");
        await fetchUser().catch(() => undefined);
      } catch (err: unknown) {
        if (!active) return;
        const detail = (err as { detail?: string })?.detail ?? (err as { message?: string })?.message;
        setState("error");
        setMessage(detail || "This verification link is invalid or expired.");
      }
    }

    run();
    return () => {
      active = false;
    };
  }, [backend.isChecking, backend.isOffline, fetchUser, token]);

  async function handleResend() {
    if (backend.isOffline) {
      setState("error");
      setMessage("Verification email is unavailable until the API server is running. Start the backend, then try again.");
      return;
    }

    setResending(true);
    try {
      const result = await sendVerificationEmail();
      setState("waiting");
      setMessage(result.message || "Verification email sent.");
      if (result.verify_url) {
        const target = new URL(result.verify_url, window.location.origin);
        router.push(`${target.pathname}${target.search}`);
      }
    } catch (err: unknown) {
      const detail = (err as { detail?: string })?.detail ?? (err as { message?: string })?.message;
      if (/unavailable|offline|cannot reach|failed to fetch/i.test(detail || "")) {
        setState("error");
        setMessage("Verification email is unavailable until the API server is running. Start the backend, then try again.");
        return;
      }
      setState("error");
      setMessage(detail || "Sign in first, then request a new verification email.");
      if (!isAuthenticated) router.push("/auth/login");
    } finally {
      setResending(false);
    }
  }

  const icon =
    state === "verified" ? (
      <CheckCircle2 className="h-8 w-8 text-[#7CB69E]" strokeWidth={2.1} />
    ) : state === "error" ? (
      <TriangleAlert className="h-8 w-8 text-[#C5A059]" strokeWidth={2.1} />
    ) : state === "checking" ? (
      <Loader2 className="h-8 w-8 animate-spin text-[#C5A059]" strokeWidth={2.1} />
    ) : (
      <MailCheck className="h-8 w-8 text-[#C5A059]" strokeWidth={2.1} />
    );

  const title =
    state === "verified"
      ? "Email verified"
      : state === "error" && backend.isOffline
        ? "Verification paused"
        : state === "error"
        ? "Verification needs attention"
        : state === "checking"
          ? "Verifying your email"
          : "Check your inbox";

  return (
    <main className="login-auth-bg relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(255,107,53,0.18),transparent_30%),radial-gradient(circle_at_82%_22%,rgba(124,182,158,0.14),transparent_30%),linear-gradient(135deg,#fffaf7_0%,#fff_42%,#f8fbf8_100%)]" />
        <div className="login-grid absolute inset-0 opacity-[0.36]" />
        <div className="login-orb login-orb-one" />
        <div className="login-orb login-orb-two" />
        <div className="login-orb login-orb-three" />
        <div className="login-cube login-cube-one" />
        <div className="login-cube login-cube-two" />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="premium-glow relative z-10 w-full max-w-[560px] overflow-hidden rounded-[2.25rem] border border-[#F8F9FA]/80 bg-white/[0.88] p-7 shadow-[0_34px_110px_rgba(20,12,8,0.12),inset_0_1px_0_rgba(255,255,255,0.86)] backdrop-blur-2xl sm:p-10"
      >
        <div className="absolute right-7 top-7 flex items-center gap-2 rounded-full border border-[#E5E5E5] bg-white/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#4B5563]">
          <ShieldCheck className="h-3.5 w-3.5 text-[#7CB69E]" />
          Secure step
        </div>

        <Link href="/" className="mb-10 inline-flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#C5A059] to-[#FF8F5E] text-white shadow-[0_8px_16px_rgba(255,107,53,0.25)]">
            <LogoMark className="h-5 w-5 rounded-md shadow-none" />
          </span>
          <span className="font-display text-2xl font-bold tracking-tight text-[#18181B]">NexusAI</span>
        </Link>

        <AnimatePresence mode="wait">
          <motion.div
            key={state}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-7 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#FFE1D4] bg-[rgba(212,175,55,0.08)] shadow-[0_18px_44px_rgba(255,107,53,0.14)]">
              {icon}
            </div>
            <h1 className="mb-3 font-display text-[40px] font-bold leading-tight tracking-tight text-[#18181B]">
              {title}
            </h1>
            <p className="max-w-[440px] text-[15px] font-medium leading-relaxed text-[#666666]">
              {backend.isOffline
                ? "We can’t verify your email until the API server is running. Start the backend, then try again."
                : state === "waiting"
                ? `We sent a verification link to ${displayEmail}. Open it to unlock your workspace.`
                : message}
            </p>
          </motion.div>
        </AnimatePresence>

        {backend.isOffline && (
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 12 },
              show: { opacity: 1, y: 0, transition: { type: "spring" as const, bounce: 0.25 } }
            }}
            role="status"
            className="mt-8 rounded-2xl border border-[#FFD7C7] bg-[#FFF7F2] px-4 py-3 text-sm font-medium leading-relaxed text-[#A07D3A]"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold">Backend unavailable</p>
                <p className="mt-1 text-sm leading-relaxed">
                  Verification actions are paused until the API server is running. Refresh after the backend is back online.
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

        <div className="mt-9 grid gap-3 sm:grid-cols-2">
          {state === "verified" ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#18181B] px-5 py-4 text-[15px] font-semibold text-white shadow-[0_18px_42px_rgba(0,0,0,0.20)] transition-all hover:-translate-y-0.5 hover:bg-[#1A1A1A]"
            >
              Continue to dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || state === "checking" || backend.isChecking || backend.isOffline}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#18181B] px-5 py-4 text-[15px] font-semibold text-white shadow-[0_18px_42px_rgba(0,0,0,0.20)] transition-all hover:-translate-y-0.5 hover:bg-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-55"
            >
              {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : backend.isChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Resend email
            </button>
          )}
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center rounded-2xl border border-[#E5E5E5] bg-white px-5 py-4 text-[15px] font-semibold text-[#18181B] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#D1D1D1]"
          >
            Back to sign in
          </Link>
        </div>

        <p className="mt-7 border-t border-[#E5E5E5] pt-5 text-[13px] leading-relaxed text-[#9CA3AF]">
          This extra step protects your workspace from typo-based signups and account takeover attempts.
        </p>
      </motion.section>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}

