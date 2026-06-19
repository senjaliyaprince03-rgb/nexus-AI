"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { sendVerificationEmail } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { LogoMark } from "@/components/brand/LogoMark";
import { API_BASE_URL, ApiError } from "@/lib/api";

const SLIDES = [
  { src: "/images/tech_abstract.png",   tagline: "Intelligence that scales with your documents.",  sub: "Multi-agent RAG — instant answers, perfectly cited." },
  { src: "/images/data_processing.png",  tagline: "Documents decoded in seconds, not hours.",       sub: "Neural scanning extracts meaning from any file format." },
  { src: "/images/network_graph.png",    tagline: "Connections your team would never find alone.",   sub: "Knowledge graphs surface hidden links across your data." },
  { src: "/images/secure_vault.png",     tagline: "Enterprise-grade security, zero compromises.",    sub: "End-to-end encryption keeps your documents safe." },
  { src: "/images/analytics_dashboard.png", tagline: "Insights at a glance, depth on demand.",      sub: "Real-time analytics across every workspace." },
];

type SocialButtonProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  href?: string;
  icon: ReactNode;
  onClick?: () => void;


}

function SocialButton({ children, className = "", disabled = false, href, icon, onClick }: SocialButtonProps) {
  const baseClass =
    "w-full flex items-center justify-center gap-3 rounded-2xl px-5 py-3.5 text-[15px] font-semibold transition-all shadow-sm hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D4AF37]/15 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm";

  if (href) {
    return (
      <a href={href} className={`${baseClass} ${className}`}>
        {icon}
        {children}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${baseClass} ${className}`}>
      {icon}
      {children}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}




type BackendStatus = "checking" | "online" | "offline"
type NoticeTone = "warning" | "error"

export function LoginPage() {
  const router = useRouter();
  const storeLogin = useAuthStore((s) => s.login);
  const loginWithFirebaseGoogle = useAuthStore((s) => s.loginWithFirebaseGoogle);
  const { user, isAuthenticated, isLoading: authChecking } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");
  const [formNotice, setFormNotice] = useState<string | null>(null);
  const [formNoticeTone, setFormNoticeTone] = useState<NoticeTone>("error");

  // Auto-advance carousel every 5 seconds
  const nextSlide = useCallback(() => {
    setActiveSlide((prev) => (prev + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const probeBackend = useCallback(async () => {
    try {
      setBackendStatus("checking");
      const res = await fetch(`${API_BASE_URL}/health`);
      if (res.ok) {
        setBackendStatus("online");
      } else {
        setBackendStatus("offline");
      }
    } catch {
      setBackendStatus("offline");
    }
  }, []);

  useEffect(() => {
    void probeBackend();
  }, [probeBackend]);

  useEffect(() => {
    if (authChecking || !isAuthenticated || !user) return;
    if (!user.is_verified) {
      router.replace(`/auth/verify-email?email=${encodeURIComponent(user.email)}`);
      return;
    }
    router.replace("/dashboard");
  }, [authChecking, isAuthenticated, router, user]);

  const handleSocialSignIn = async (provider: string) => {
    setFormNotice(null);
    if (backendStatus !== "online") {
      setFormNoticeTone("warning");
      setFormNotice("Sign-in is unavailable until the API server is running. Start the backend, then try again.");
      return;
    }

    try {
      setLoading(true);
      if (provider === "Google") {
        const { signInWithGoogle } = await import("@/lib/firebase");
        const user = await signInWithGoogle();
        const token = await user.getIdToken();
        await useAuthStore.getState().loginWithFirebaseGoogle(token);
      } else if (provider === "GitHub") {
        const { signInWithGithub } = await import("@/lib/firebase");
        const user = await signInWithGithub();
        const token = await user.getIdToken();
        await useAuthStore.getState().loginWithFirebaseGithub(token);
      } else {
        throw new Error(`${provider} sign in is not implemented yet.`);
      }
      toast.success(`Signed in with ${provider} successfully.`);
      router.push("/dashboard");
    } catch (error) {
      if (isOfflineAuthError(error)) {
        setBackendStatus("offline");
      }
      setFormNoticeTone("warning");
      setFormNotice(getAuthFailureMessage(error, `${provider} sign-in failed.`));
      setLoading(false);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormNotice(null);
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setFormNoticeTone("error");
      setFormNotice("Please enter your email and password.");
      return;
    }

    if (backendStatus !== "online") {
      setFormNoticeTone("warning");
      setFormNotice("Sign-in is unavailable until the API server is running. Start the backend, then try again.");
      return;
    }

    setLoading(true);
    try {
      await storeLogin(normalizedEmail, password);
      toast.success("Signed in successfully.");
      router.push("/dashboard");
    } catch (err: unknown) {
      toast.error("An error occurred during sign in.");
    } finally {
      setLoading(false);
    }
  }

  // Animation variants for staggering children
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, bounce: 0.4 } }
  };

  return (
    <div className="h-screen min-h-screen bg-[#18181B] flex overflow-hidden font-sans">
      {/* Left side: Premium Image Carousel */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex lg:w-1/2 relative bg-[#050505] flex-col items-center justify-center overflow-hidden"
      >
        {/* Background images with crossfade */}
        <AnimatePresence mode="wait">
          <motion.img
            key={activeSlide}
            src={SLIDES[activeSlide].src}
            alt={SLIDES[activeSlide].tagline}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.8, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>

        {/* Premium noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

        {/* Gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/60 via-[#050505]/20 to-transparent" />

        {/* Content overlay — pinned to bottom */}
        <div className="relative z-10 mt-auto w-full px-9 pb-10 xl:px-10 xl:pb-12">
          {/* Logo Badge */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 20 }}
            className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-[#F8F9FA]/20 shadow-[0_8px_32px_rgba(0,0,0,0.2)] flex items-center justify-center mb-8 text-white relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <LogoMark className="w-6 h-6 relative z-10 drop-shadow-md rounded-md shadow-none" />
          </motion.div>

          {/* Tagline with elegant crossfade */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2 className="font-display text-[2rem] xl:text-[2.25rem] text-white tracking-[-0.03em] leading-[1.08] mb-3 drop-shadow-lg">
                {SLIDES[activeSlide].tagline}
              </h2>
              <p className="text-white/70 text-[15px] leading-relaxed max-w-[360px] font-medium">
                {SLIDES[activeSlide].sub}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Premium Dot indicators */}
          <div className="flex items-center gap-2.5 mt-8">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className="relative h-1.5 rounded-full transition-all duration-500 overflow-hidden"
                style={{ width: i === activeSlide ? 36 : 10 }}
              >
                <span className={`absolute inset-0 rounded-full transition-colors duration-300 ${i === activeSlide ? "bg-white/20" : "bg-white/20 hover:bg-white/40"}`} />
                {i === activeSlide && (
                  <motion.span
                    className="absolute inset-0 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 5, ease: "linear" }}
                    key={`progress-${activeSlide}`}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Right side: Premium Login Form */}
      <div className="login-auth-bg w-full lg:w-1/2 flex items-center justify-center overflow-y-auto p-4 py-5 sm:p-6 lg:p-7 xl:p-8 relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(245,158,11,0.16),transparent_32%),radial-gradient(circle_at_88%_22%,rgba(124,182,158,0.13),transparent_28%),linear-gradient(135deg,#fffaf7_0%,#fff_38%,#f8fbf8_100%)]" />
          <div className="login-grid absolute inset-0 opacity-[0.42]" />
          <div className="login-orb login-orb-one" />
          <div className="login-orb login-orb-two" />
          <div className="login-orb login-orb-three" />
          <div className="login-cube login-cube-one" />
          <div className="login-cube login-cube-two" />
          <div className="login-cube login-cube-three" />
        </div>

        <div className="w-full max-w-[520px] relative z-10 py-3">
          {/* Logo visible on all sizes now, styled beautifully */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3 mb-4 pl-1"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#FF8F5E] shadow-[0_8px_16px_rgba(245,158,11,0.25)] flex items-center justify-center text-white">
              <LogoMark className="w-5 h-5 rounded-md shadow-none" />
            </div>
            <span className="font-display font-bold text-[#18181B] tracking-tight text-2xl">
              NexusAI
            </span>
          </motion.div>

          <motion.div 
            variants={containerVars} 
            initial="hidden" 
            animate="show"
            className="premium-glow relative space-y-3 rounded-[1.75rem] border border-[#F8F9FA]/80 bg-white/[0.88] p-6 shadow-[0_28px_86px_rgba(20,12,8,0.12),inset_0_1px_0_rgba(255,255,255,0.86)] backdrop-blur-2xl lg:p-[18px] xl:p-5"
          >
            <motion.div variants={itemVars}>
              <h1 className="text-[32px] sm:text-[36px] font-display font-bold text-[#18181B] tracking-tight mb-1">Welcome back</h1>
              <p className="text-[15px] text-[#666666] font-medium">Please enter your details to sign in.</p>
            </motion.div>

            {backendStatus === "offline" && (
              <motion.div
                variants={itemVars}
                role="status"
                className="rounded-2xl border border-[#FFD7C7] bg-[#FFF7F2] px-4 py-3 text-sm font-medium leading-relaxed text-[#A07D3A]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold">Backend unavailable</p>
                    <p className="mt-1 text-sm leading-relaxed">
                      Sign-in is paused until the API server is running. Once it is back online, refresh and try again.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void probeBackend()}
                    className="inline-flex shrink-0 items-center justify-center rounded-full border border-[#FFB893] bg-white px-3 py-1.5 text-sm font-semibold text-[#A07D3A] transition hover:bg-[#FFF0EB]"
                  >
                    Retry connection
                  </button>
                </div>
              </motion.div>
            )}

            {formNotice && (
              <motion.div
                variants={itemVars}
                role="status"
                className={`rounded-2xl border px-4 py-3 text-sm font-medium leading-relaxed ${
                  formNoticeTone === "warning"
                    ? "border-[#FFD7C7] bg-[#FFF7F2] text-[#A07D3A]"
                    : "border-[#E0A8A8] bg-[#FFF5F5] text-[#A23333]"
                }`}
              >
                {formNotice}
              </motion.div>
            )}

            <motion.form variants={itemVars} onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#4B5563] uppercase tracking-[0.08em] ml-1">
                  Email
                </label>
                <div className="premium-glow-field rounded-2xl transition-shadow duration-300">
                  <input
                    type="email"
                    className="w-full bg-white/90 border border-[#E5E5E5] rounded-2xl px-5 py-3.5 text-[16px] text-[#18181B] outline-none hover:border-[#D1D1D1] focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 transition-all placeholder:text-[#B0B0B0] shadow-sm"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (formNotice) setFormNotice(null)
                    }}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#4B5563] uppercase tracking-[0.08em] ml-1">
                  Password
                </label>
                <div className="relative">
                  <div className="premium-glow-field rounded-2xl transition-shadow duration-300">
                    <input
                      type={showPw ? "text" : "password"}
                      className="w-full bg-white/90 border border-[#E5E5E5] rounded-2xl px-5 py-3.5 pr-14 text-[16px] text-[#18181B] outline-none hover:border-[#D1D1D1] focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 transition-all placeholder:text-[#B0B0B0] shadow-sm"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (formNotice) setFormNotice(null)
                      }}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#18181B] transition-colors p-1"
                    >
                      {showPw ? <Eye className="w-[18px] h-[18px]" /> : <EyeOff className="w-[18px] h-[18px]" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <Link href="/auth/forgot-password" className="text-[13px] font-semibold text-[#D4AF37] hover:text-[#E55A25] transition-colors">
                    Forgot password?
                  </Link>
                </div>
              </div>

              <motion.button
                whileHover={{ y: -1, scale: 1.005 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || authChecking || backendStatus !== "online"}
                className="w-full py-3.5 mt-1 rounded-2xl text-[16px] font-semibold transition-all bg-gradient-to-b from-[#1A1A1A] to-[#050505] text-white hover:from-[#222222] hover:to-[#18181B] shadow-[0_16px_36px_rgba(0,0,0,0.18)] hover:shadow-[0_20px_42px_rgba(0,0,0,0.22)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group border border-[#F8F9FA]/5"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : backendStatus === "checking" ? (
                  "Checking connection..."
                ) : (
                  "Sign In"
                )}
                {!loading && backendStatus === "online" && !authChecking && (
                  <ArrowRight className="w-[18px] h-[18px] opacity-80 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
                )}
              </motion.button>
            </motion.form>

            <motion.div variants={itemVars} className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E5E5E5]" />
              </div>
              <div className="relative flex justify-center text-[13px] font-medium text-[#9CA3AF]">
                <span className="bg-white px-4">Or continue with</span>
              </div>
            </motion.div>

            <motion.div variants={itemVars} className="space-y-2">
              <SocialButton
                onClick={() => handleSocialSignIn("Google")}
                icon={<GoogleIcon />}
                disabled={loading || authChecking || backendStatus !== "online"}
                className="border border-[#E5E5E5] bg-white text-[#202124] hover:border-[#D1D1D1] hover:bg-[#FAFAF9]"
              >
                Sign in with Google
              </SocialButton>
              <SocialButton
                icon={<GithubIcon />}
                onClick={() => handleSocialSignIn("GitHub")}
                disabled={loading || authChecking || backendStatus !== "online"}
                className="border border-[#24292E] bg-[#24292E] text-white hover:bg-[#1B1F23]"
              >
                Sign in with GitHub
              </SocialButton>

            </motion.div>

            <motion.p variants={itemVars} className="text-center text-[15px] text-[#666666] pt-2">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-[#18181B] font-semibold hover:text-[#D4AF37] transition-colors">
                Sign up
              </Link>
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage

export function getAuthFailureMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return "Sign-in service is temporarily unavailable. Start the backend server, then try again.";
    }

    if (/unavailable|offline|cannot reach|failed to fetch/i.test(error.detail)) {
      return "Sign-in service is temporarily unavailable. Start the backend server, then try again.";
    }

    return error.detail || fallback
  }

  const detail =
    (error as { detail?: string })?.detail ??
    (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
    (error as { message?: string })?.message ??
    ""

  if (/unavailable|offline|cannot reach|failed to fetch/i.test(detail)) {
    return "Sign-in service is temporarily unavailable. Start the backend server, then try again.";
  }

  return detail || fallback
}

function isOfflineAuthError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 0) return true
    return /unavailable|offline|cannot reach|failed to fetch/i.test(error.detail)
  }

  const detail =
    (error as { detail?: string })?.detail ??
    (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
    (error as { message?: string })?.message ??
    ""

  return /unavailable|offline|cannot reach|failed to fetch/i.test(detail)
}
