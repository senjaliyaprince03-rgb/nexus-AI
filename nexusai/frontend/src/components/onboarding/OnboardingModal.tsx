"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowRight,
  Upload,
  FileText,
  Command,
  Search,
  Bot,
  Building2,
  CheckCircle2,
} from "lucide-react"
import { LogoMark } from "@/components/brand/LogoMark"
import { useOnboarding } from "@/hooks/useOnboarding"
import { useAuthStore } from "@/store/authStore"

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const TOTAL_STEPS = 4
const SUPPORTED_FORMATS = ["PDF", "DOCX", "TXT", "MD", "CSV"]

const TIPS = [
  { icon: Command, label: "Use ⌘K to quickly navigate" },
  { icon: Upload, label: "Upload documents to start querying" },
  { icon: Bot, label: "Try our AI agents for automated analysis" },
]

/* -------------------------------------------------------------------------- */
/*  Slide animation variants                                                  */
/* -------------------------------------------------------------------------- */

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 280 : -280,
    opacity: 0,
    scale: 0.96,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -280 : 280,
    opacity: 0,
    scale: 0.96,
  }),
}

/* -------------------------------------------------------------------------- */
/*  Confetti particle component (CSS-only)                                    */
/* -------------------------------------------------------------------------- */

function Confetti() {
  const colors = ["#C5A059", "#7CB69E", "#3B6FE8", "#D4AF37", "#EC4899", "#8B5CF6"]
  const particles = Array.from({ length: 48 }, (_, i) => i)

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((i) => {
        const color = colors[i % colors.length]
        const left = `${Math.random() * 100}%`
        const delay = `${Math.random() * 1.2}s`
        const duration = `${1.8 + Math.random() * 1.6}s`
        const size = `${4 + Math.random() * 6}px`
        const rotation = `${Math.random() * 360}deg`

        return (
          <span
            key={i}
            className="absolute top-0 animate-confetti-fall rounded-sm"
            style={{
              left,
              width: size,
              height: size,
              backgroundColor: color,
              animationDelay: delay,
              animationDuration: duration,
              transform: `rotate(${rotation})`,
            }}
          />
        )
      })}

      {/* Inline keyframes – scoped to the confetti container */}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-20px) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(520px) rotate(720deg) scale(0.4);
            opacity: 0;
          }
        }
        .animate-confetti-fall {
          animation-name: confetti-fall;
          animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Step components                                                           */
/* -------------------------------------------------------------------------- */

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center text-center px-2">
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
      >
        <LogoMark className="h-20 w-20 mb-6" priority />
      </motion.div>

      <motion.h2
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-bold tracking-tight text-[#18181B] dark:text-[#F8F9FA]"
      >
        Welcome to NexusAI
      </motion.h2>

      <motion.p
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-3 max-w-xs text-[15px] leading-relaxed text-[#4B5563] dark:text-[#A1A1AA]"
      >
        Your AI-powered document intelligence platform
      </motion.p>

      <motion.button
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onNext}
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#C5A059] px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-[#C5A059]/25 transition-colors hover:bg-[#e85f2e]"
      >
        Get Started
        <ArrowRight className="h-4 w-4" />
      </motion.button>
    </div>
  )
}

function StepWorkspace({
  onNext,
  workspaceName,
  setWorkspaceName,
}: {
  onNext: () => void
  workspaceName: string
  setWorkspaceName: (v: string) => void
}) {
  return (
    <div className="flex flex-col items-center text-center px-2">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
        className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#3B6FE8]/10 dark:bg-[#3B6FE8]/20"
      >
        <Building2 className="h-8 w-8 text-[#3B6FE8]" />
      </motion.div>

      <motion.h2
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-2xl font-bold tracking-tight text-[#18181B] dark:text-[#F8F9FA]"
      >
        Name your workspace
      </motion.h2>

      <motion.p
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="mt-2 max-w-xs text-[14px] leading-relaxed text-[#4B5563] dark:text-[#A1A1AA]"
      >
        This is where your team&apos;s documents and AI workflows live.
      </motion.p>

      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mt-6 w-full max-w-xs"
      >
        <input
          type="text"
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
          placeholder="e.g. Acme Inc."
          className="w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-sm text-[#18181B] placeholder:text-[#9CA3AF] shadow-sm outline-none transition-all focus:border-[#C5A059]/50 focus:ring-2 focus:ring-[#C5A059]/20 dark:border-[#F8F9FA]/[0.12] dark:bg-white/[0.06] dark:text-[#F8F9FA] dark:placeholder:text-[#71717A] dark:focus:border-[#C5A059]/50 dark:focus:ring-[#C5A059]/20"
        />
      </motion.div>

      <motion.button
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onNext}
        disabled={!workspaceName.trim()}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#C5A059] px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-[#C5A059]/25 transition-colors hover:bg-[#e85f2e] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Continue
        <ArrowRight className="h-4 w-4" />
      </motion.button>
    </div>
  )
}

function StepUpload({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [isDragging, setIsDragging] = useState(false)

  return (
    <div className="flex flex-col items-center text-center px-2">
      <motion.h2
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-2xl font-bold tracking-tight text-[#18181B] dark:text-[#F8F9FA]"
      >
        Upload your first document
      </motion.h2>

      <motion.p
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-2 max-w-xs text-[14px] leading-relaxed text-[#4B5563] dark:text-[#A1A1AA]"
      >
        Drag &amp; drop a file or click to browse. You can always do this later.
      </motion.p>

      {/* Drop zone */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
        }}
        className={`mt-6 flex w-full max-w-sm cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 transition-all ${
          isDragging
            ? "border-[#C5A059] bg-[#C5A059]/5 dark:bg-[#C5A059]/10"
            : "border-black/[0.12] bg-[#F8F7F4] hover:border-[#C5A059]/40 dark:border-[#F8F9FA]/[0.12] dark:bg-white/[0.04] dark:hover:border-[#C5A059]/40"
        }`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#C5A059]/10 dark:bg-[#C5A059]/20">
          <Upload className="h-6 w-6 text-[#C5A059]" />
        </div>
        <p className="mt-3 text-sm font-medium text-[#18181B] dark:text-[#F8F9FA]">
          Drop files here
        </p>
        <p className="mt-1 text-xs text-[#9CA3AF] dark:text-[#71717A]">or click to browse</p>
      </motion.div>

      {/* Supported formats */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-4 flex flex-wrap items-center justify-center gap-2"
      >
        {SUPPORTED_FORMATS.map((fmt) => (
          <span
            key={fmt}
            className="inline-flex items-center gap-1 rounded-lg bg-black/[0.04] px-2.5 py-1 text-[11px] font-medium text-[#4B5563] dark:bg-white/[0.08] dark:text-[#A1A1AA]"
          >
            <FileText className="h-3 w-3" />
            {fmt}
          </span>
        ))}
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 flex items-center gap-3"
      >
        <button
          onClick={onSkip}
          className="rounded-xl px-5 py-2.5 text-sm font-medium text-[#4B5563] transition-colors hover:bg-black/[0.04] dark:text-[#A1A1AA] dark:hover:bg-white/[0.06]"
        >
          Skip for now
        </button>
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-xl bg-[#C5A059] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#C5A059]/25 transition-colors hover:bg-[#e85f2e]"
        >
          Upload
          <ArrowRight className="h-4 w-4" />
        </button>
      </motion.div>
    </div>
  )
}

function StepReady({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="relative flex flex-col items-center text-center px-2 overflow-hidden">
      <Confetti />

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
        className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#7CB69E]/15 dark:bg-[#7CB69E]/20"
      >
        <CheckCircle2 className="h-8 w-8 text-[#7CB69E]" />
      </motion.div>

      <motion.h2
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-bold tracking-tight text-[#18181B] dark:text-[#F8F9FA]"
      >
        Your workspace is ready!
      </motion.h2>

      <motion.p
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-2 max-w-xs text-[14px] leading-relaxed text-[#4B5563] dark:text-[#A1A1AA]"
      >
        Here are a few tips to get the most out of NexusAI.
      </motion.p>

      {/* Tips */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 w-full max-w-xs space-y-3"
      >
        {TIPS.map(({ icon: Icon, label }, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-white/60 px-4 py-3 text-left backdrop-blur dark:border-[#F8F9FA]/[0.08] dark:bg-white/[0.04]"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#C5A059]/10 dark:bg-[#C5A059]/20">
              <Icon className="h-4 w-4 text-[#C5A059]" />
            </div>
            <span className="text-[13px] font-medium text-[#18181B] dark:text-[#F8F9FA]/90">
              {label}
            </span>
          </div>
        ))}
      </motion.div>

      <motion.button
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.55 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onFinish}
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#C5A059] px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-[#C5A059]/25 transition-colors hover:bg-[#e85f2e]"
      >
        <ArrowRight className="h-4 w-4" />
        Go to Dashboard
      </motion.button>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Progress dots                                                             */
/* -------------------------------------------------------------------------- */

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <motion.div
          key={i}
          layout
          className={`h-2 rounded-full transition-colors ${
            i === current
              ? "w-6 bg-[#C5A059]"
              : "w-2 bg-black/[0.12] dark:bg-white/[0.16]"
          }`}
        />
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Main OnboardingModal component                                            */
/* -------------------------------------------------------------------------- */

export function OnboardingModal() {
  const { showOnboarding, completeOnboarding } = useOnboarding()
  const user = useAuthStore((s) => s.user)
  const pathname = usePathname()

  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1) // 1 = forward, -1 = backward
  const [workspaceName, setWorkspaceName] = useState("")

  // Pre-fill workspace name from email domain
  useEffect(() => {
    if (user?.email) {
      const domain = user.email.split("@")[1]
      if (domain) {
        const name = domain.split(".")[0]
        setWorkspaceName(name.charAt(0).toUpperCase() + name.slice(1))
      }
    }
  }, [user?.email])

  const goNext = useCallback(() => {
    setDirection(1)
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
  }, [])

  const handleFinish = useCallback(() => {
    completeOnboarding()
  }, [completeOnboarding])

  if (!showOnboarding) return null
  if (pathname?.startsWith("/dashboard")) return null

  return (
    <AnimatePresence>
      {showOnboarding && (
        <motion.div
          key="onboarding-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md"
        >
          {/* Card */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[#F8F9FA]/20 bg-white/80 shadow-2xl shadow-black/10 backdrop-blur-2xl dark:border-[#F8F9FA]/[0.1] dark:bg-[#18181A]/80 dark:shadow-black/40"
          >
            {/* Subtle gradient accent at top */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#C5A059] via-[#3B6FE8] to-[#7CB69E]" />

            {/* Content area */}
            <div className="relative min-h-[420px] px-8 pt-12 pb-8 flex flex-col">
              <div className="flex-1 flex items-center justify-center">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={step}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="w-full"
                  >
                    {step === 0 && <StepWelcome onNext={goNext} />}
                    {step === 1 && (
                      <StepWorkspace
                        onNext={goNext}
                        workspaceName={workspaceName}
                        setWorkspaceName={setWorkspaceName}
                      />
                    )}
                    {step === 2 && <StepUpload onNext={goNext} onSkip={goNext} />}
                    {step === 3 && <StepReady onFinish={handleFinish} />}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Progress dots */}
              <div className="mt-8">
                <ProgressDots current={step} total={TOTAL_STEPS} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
