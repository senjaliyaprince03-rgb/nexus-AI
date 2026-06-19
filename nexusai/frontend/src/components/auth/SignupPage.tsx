"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, ArrowRight, Check } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { LogoMark } from "@/components/brand/LogoMark"
import { useAuth } from "@/hooks/useAuth";
import { useBackendAvailability } from "@/hooks/useBackendAvailability";

const SLIDES = [
  { src: "/images/laptop_workspace.png",    tagline: "Your workspace, supercharged.",              sub: "Join thousands of teams using multi-agent RAG to uncover insights." },
  { src: "/images/data_processing.png",     tagline: "Documents decoded in seconds, not hours.",   sub: "Neural scanning extracts meaning from any file format." },
  { src: "/images/network_graph.png",       tagline: "Connections your team would never find.",     sub: "Knowledge graphs surface hidden links across your data." },
  { src: "/images/secure_vault.png",        tagline: "Enterprise-grade security, zero compromises.",sub: "End-to-end encryption keeps your documents safe." },
  { src: "/images/analytics_dashboard.png", tagline: "Insights at a glance, depth on demand.",     sub: "Real-time analytics across every workspace." },
];

const passwordRules = [
  { id: "length", test: (pwd: string) => pwd.length >= 8, message: "At least 8 characters" },
  { id: "upper", test: (pwd: string) => /[A-Z]/.test(pwd), message: "One uppercase letter" },
  { id: "lower", test: (pwd: string) => /[a-z]/.test(pwd), message: "One lowercase letter" },
  { id: "digit", test: (pwd: string) => /[0-9]/.test(pwd), message: "One digit" },
  { id: "special", test: (pwd: string) => /[^A-Za-z0-9]/.test(pwd), message: "One special character" }
];

export default function SignupPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [form, setForm] = useState({ email: "", password: "", workspace_name: "" });
  const [showPw, setShowPw] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [statusText, setStatusText] = useState("Creating account");
  const [activeSlide, setActiveSlide] = useState(0);
  const [formNotice, setFormNotice] = useState<string | null>(null);
  const [formNoticeTone, setFormNoticeTone] = useState<"warning" | "error">("error");
  const { user, isAuthenticated, isLoading: authChecking } = useAuth();
  const backend = useBackendAvailability();

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const passwordValidation = passwordRules.map(rule => ({
    id: rule.id,
    message: rule.message,
    passed: rule.test(form.password)
  }));
  const isPasswordValid = passwordValidation.every(rule => rule.passed);

  // Auto-advance carousel every 5 seconds
  const nextSlide = useCallback(() => {
    setActiveSlide((prev) => (prev + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  useEffect(() => {
    if (authChecking || !isAuthenticated || !user) return;
    if (!user.is_verified) {
      router.replace(`/auth/verify-email?email=${encodeURIComponent(user.email)}`);
      return;
    }
    router.replace("/dashboard");
  }, [authChecking, isAuthenticated, router, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormNotice(null);
    const email = form.email.trim().toLowerCase();
    const workspaceName = form.workspace_name.trim();
    if (backend.isOffline) {
      setFormNoticeTone("warning");
      setFormNotice("Account creation is unavailable until the API server is running. Start the backend, then try again.");
      return;
    }
    if (!isPasswordValid) { setFormNoticeTone("error"); setFormNotice("Please ensure your password meets all requirements."); return; }
    if (!email) { setFormNoticeTone("error"); setFormNotice("Email is required."); return; }
    if (!workspaceName) { setFormNoticeTone("error"); setFormNotice("Workspace name is required."); return; }
    setRegistering(true);
    setStatusText("Creating secure workspace");
    try {
      const session = await register(email, form.password, workspaceName);
      setStatusText("Opening verification step");
      toast.success("Account created. Opening verification step.");
      router.push(`/auth/verify-email?email=${encodeURIComponent(session.user.email)}`);
    } catch (err: any) {
      const rawMessage =
        err?.detail ??
        err?.message ??
        "Registration failed. Please check your connection.";
      const message = rawMessage === "Email already registered"
        ? "This email already has an account. Sign in with the same password or reset it."
        : rawMessage;
      if (/unavailable|offline|cannot reach|failed to fetch/i.test(message)) {
        setFormNoticeTone("warning");
        setFormNotice("Account creation is unavailable until the API server is running. Start the backend, then try again.");
      } else {
        setFormNoticeTone("warning");
        setFormNotice(message);
      }
    } finally {
      setRegistering(false);
      setStatusText("Creating account");
    }
  }

  const loading = registering || isLoading || backend.isChecking;

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
    <div className="min-h-screen bg-white flex overflow-hidden font-sans">
      {/* Left side: Premium Image Carousel */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex w-[45%] relative bg-[#050505] flex-col items-center justify-center overflow-hidden"
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
        <div className="relative z-10 mt-auto w-full px-12 pb-16">
          {/* Logo Badge */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 20 }}
            className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-[#F8F9FA]/20 shadow-[0_8px_32px_rgba(0,0,0,0.2)] flex items-center justify-center mb-8 text-white relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#C5A059]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
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
              <h2 className="font-display text-4xl text-white tracking-[-0.03em] leading-[1.1] mb-4 drop-shadow-lg">
                {SLIDES[activeSlide].tagline}
              </h2>
              <p className="text-white/70 text-[15px] leading-relaxed max-w-[360px] font-medium">
                {SLIDES[activeSlide].sub}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Premium Dot indicators */}
          <div className="flex items-center gap-2.5 mt-10">
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

      {/* Right side: Premium Signup Form */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-12 relative bg-[#FCFCFB] lg:bg-white">
        
        {/* Subtle background glow for desktop */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden lg:block">
           <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-[radial-gradient(circle,rgba(255,107,53,0.04),transparent_70%)] blur-3xl" />
           <div className="absolute bottom-[0%] left-[0%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(59,111,232,0.02),transparent_70%)] blur-3xl" />
        </div>

        <div className="w-full max-w-[400px] relative z-10">
          {/* Logo visible on all sizes now, styled beautifully */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3 mb-10"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C5A059] to-[#FF8F5E] shadow-[0_8px_16px_rgba(255,107,53,0.25)] flex items-center justify-center text-white">
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
            className="space-y-7 bg-white p-8 sm:p-10 lg:p-0 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:shadow-none border border-[rgba(0,0,0,0.03)] lg:border-none relative"
          >
            <motion.div variants={itemVars}>
              <h1 className="text-[32px] font-display font-bold text-[#18181B] tracking-tight mb-2">Create account</h1>
              <p className="text-[15px] text-[#666666] font-medium">Get started with your free NexusAI workspace.</p>
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
                      Account creation is paused until the API server is running. Refresh after the backend is back online.
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

            <motion.form variants={itemVars} onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#4B5563] uppercase tracking-[0.08em] ml-1">
                  Work Email
                </label>
                <input
                  type="email"
                  className="w-full bg-white border border-[#E5E5E5] rounded-2xl px-4 py-3.5 text-[15px] text-[#18181B] outline-none hover:border-[#D1D1D1] focus:border-[#C5A059] focus:ring-4 focus:ring-[#C5A059]/10 transition-all placeholder:text-[#B0B0B0] shadow-sm"
                  placeholder="name@company.com"
                  value={form.email}
                  onChange={(event) => {
                    set("email")(event)
                    if (formNotice) setFormNotice(null)
                  }}
                  disabled={loading}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#4B5563] uppercase tracking-[0.08em] ml-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  className="w-full bg-white border border-[#E5E5E5] rounded-2xl px-4 py-3.5 text-[15px] text-[#18181B] outline-none hover:border-[#D1D1D1] focus:border-[#C5A059] focus:ring-4 focus:ring-[#C5A059]/10 transition-all placeholder:text-[#B0B0B0] shadow-sm"
                  placeholder="Acme Corp"
                  value={form.workspace_name}
                  onChange={(event) => {
                    set("workspace_name")(event)
                    if (formNotice) setFormNotice(null)
                  }}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#4B5563] uppercase tracking-[0.08em] ml-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    className="w-full bg-white border border-[#E5E5E5] rounded-2xl px-4 py-3.5 pr-11 text-[15px] text-[#18181B] outline-none hover:border-[#D1D1D1] focus:border-[#C5A059] focus:ring-4 focus:ring-[#C5A059]/10 transition-all placeholder:text-[#B0B0B0] shadow-sm"
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={(event) => {
                      set("password")(event)
                      if (formNotice) setFormNotice(null)
                    }}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    disabled={loading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#18181B] transition-colors p-1"
                  >
                    {showPw ? <Eye className="w-[18px] h-[18px]" /> : <EyeOff className="w-[18px] h-[18px]" />}
                  </button>
                </div>
                
                {/* Password Rules Checklist */}
                <AnimatePresence>
                  {form.password.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 overflow-hidden"
                    >
                      {passwordValidation.map(rule => (
                        <div key={rule.id} className="flex items-center gap-2 text-[12px]">
                          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors ${rule.passed ? 'bg-green-500/20 text-green-600' : 'bg-[#F0F0F0] text-[#A0A0A0]'}`}>
                            {rule.passed ? <Check className="w-2.5 h-2.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />}
                          </div>
                          <span className={`transition-colors ${rule.passed ? 'text-green-600 font-medium' : 'text-[#9CA3AF]'}`}>{rule.message}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                whileHover={{ y: -1, scale: 1.005 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || backend.isOffline}
                className="w-full py-4 mt-4 rounded-2xl text-[15px] font-semibold transition-all bg-gradient-to-b from-[#1A1A1A] to-[#050505] text-white hover:from-[#222222] hover:to-[#18181B] shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_25px_rgba(0,0,0,0.18)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group border border-[#F8F9FA]/5"
              >
                {registering ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {statusText}
                  </>
                ) : backend.isChecking ? (
                  "Checking connection..."
                ) : "Create Account"}
                {!registering && !backend.isChecking && <ArrowRight className="w-[18px] h-[18px] opacity-80 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />}
              </motion.button>
            </motion.form>

            <motion.p variants={itemVars} className="text-center text-[15px] text-[#666666] pt-4 border-t border-[#E5E5E5]">
              Already have an account?{" "}
              {registering ? (
                <span className="font-semibold text-[#9CA3AF]">Finishing setup...</span>
              ) : backend.isChecking ? (
                <span className="font-semibold text-[#9CA3AF]">Checking connection...</span>
              ) : (
                <Link href="/auth/login" className="text-[#18181B] font-semibold hover:text-[#C5A059] transition-colors">
                  Sign in
                </Link>
              )}
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

