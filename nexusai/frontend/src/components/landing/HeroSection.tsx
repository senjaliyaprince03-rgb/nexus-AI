"use client"
import { BrainCircuit } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"
import { type CSSProperties } from "react"
import { Button } from "@/components/ui/button"

const settleTransition = {
  duration: 1.05,
  ease: [0.22, 1, 0.36, 1],
} as const

function HeroImage3D() {
  return (
    <div className="hero-visual hero-depth-stage relative mx-auto mt-12 w-full max-w-[660px] overflow-visible px-7 pb-10 pt-9 sm:px-12 sm:pb-14 sm:pt-12 lg:mt-0">
      <div
        className="hero-frame premium-glow-media relative z-10 overflow-hidden rounded-[1.35rem] border-[3px] border-[var(--landing-border)] bg-[var(--landing-surface)] shadow-[0_30px_60px_rgba(0,0,0,0.12)] sm:rounded-3xl sm:border-4"
      >
        <Image
          src="/images/laptop_workspace.png"
          alt="NexusAI workspace"
          width={1400}
          height={1050}
          className="w-full h-auto aspect-[4/3] object-cover"
          sizes="(min-width: 1024px) 550px, 100vw"
          priority
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
      </div>

      <motion.div
        className="hero-float absolute left-0 top-6 z-20 sm:left-1 sm:top-8"
        initial={false}
        animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
        transition={{ ...settleTransition, delay: 0.18 }}
        style={{ "--float-distance": "-10px", "--float-duration": "4.8s" } as CSSProperties}
      >
        <div className="hero-float-3d premium-glow-tight flex items-center gap-3 rounded-2xl border border-[var(--landing-border)] bg-white/85 dark:bg-[#0A1628]/85 backdrop-blur-md px-4 py-3 shadow-[0_20px_40px_rgba(0,0,0,0.08)] sm:px-5 sm:py-4">
          <div className="w-9 h-9 rounded-xl bg-[var(--landing-surface-muted)] text-[#C5A059] flex items-center justify-center text-lg sm:h-10 sm:w-10 sm:text-xl">
            <BrainCircuit className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--landing-text)]">AI-Powered Agents</p>
            <p className="text-xs text-[var(--landing-text-muted)]">Working in sequence</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="hero-float absolute right-1 bottom-[5.9rem] z-30 w-[112px] sm:right-3 sm:bottom-[6.9rem] sm:w-[132px]"
        initial={false}
        animate={{ x: 0, y: 0, width: "8.25rem" }}
        transition={{ ...settleTransition, delay: 0.06 }}
        style={{ "--float-distance": "8px", "--float-duration": "5.6s", "--float-delay": "-1.1s" } as CSSProperties}
      >
        <div className="hero-float-3d premium-glow-tight flex w-full flex-col gap-1 rounded-2xl border border-[var(--landing-border)] bg-white/85 dark:bg-[#0A1628]/85 backdrop-blur-md px-5 py-5 shadow-[0_20px_40px_rgba(0,0,0,0.08)] sm:px-6 sm:py-6">
          <p className="text-2xl font-bold text-[var(--landing-text)]">10h+</p>
          <p className="text-sm text-[var(--landing-text-muted)]">Saved weekly</p>
        </div>
      </motion.div>

      <motion.div
        className="hero-float absolute bottom-5 left-10 z-20 w-[260px] sm:bottom-7 sm:left-20"
        initial={false}
        animate={{ x: 0, y: 0, width: "16.25rem" }}
        transition={{ ...settleTransition, delay: 0.14 }}
        style={{ "--float-distance": "-6px", "--float-duration": "4.2s", "--float-delay": "-0.55s" } as CSSProperties}
      >
        <div className="hero-float-3d premium-glow-dark flex w-full items-center gap-2 rounded-full border border-[var(--landing-border)] bg-white/90 dark:bg-[#0A1628]/90 backdrop-blur-md px-5 py-3 shadow-[0_15px_30px_rgba(0,0,0,0.16)]">
          <div className="h-2 w-2 rounded-full bg-[#7CB69E] shadow-[0_0_0_4px_rgba(124,182,158,0.16)]" />
          <p className="whitespace-nowrap text-sm font-semibold text-[var(--landing-text)]">50K+ Documents Indexed</p>
        </div>
      </motion.div>
    </div>
  )
}

export function HeroSection() {
  const primaryHref = "/signup"
  const secondaryHref = "/login"

  return (
    <section className="relative overflow-hidden bg-[var(--landing-bg)] px-6 sm:px-8 lg:px-12 pt-40 pb-24 lg:pb-32 text-[var(--landing-text)]">
      {/* Very subtle background pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_center,var(--landing-text)_1px,transparent_1px)]"
        style={{ backgroundSize: "24px 24px" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-[var(--landing-bg)]" />

      {/* Main hero content */}
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Left Column: Copy & CTA */}
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 inline-flex items-center rounded-full border border-[var(--landing-border)]
                         bg-[var(--landing-surface-strong)] px-3 py-1.5 text-sm text-[var(--landing-text-secondary)] shadow-sm"
            >
              <span className="flex h-2 w-2 rounded-full bg-[#7CB69E] mr-2 animate-pulse" />
              NexusAI v2 is now live
            </motion.div>

            <motion.h1
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-[clamp(2.5rem,6vw,4rem)] leading-[1.05]
                         tracking-[-0.02em] text-[var(--landing-text)] mb-6"
            >
              Behind every answer:
              <br />
              <span className="italic text-[#C5A059] font-serif font-normal">your documents</span>
            </motion.h1>

            <motion.p
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8 max-w-[480px] text-lg leading-relaxed text-[var(--landing-text-secondary)]"
            >
              Upload any document. Ask anything in plain
              <br />
              English. Get answers backed by numbered citations
              <br />
              from the exact source passages.
            </motion.p>

            <motion.div
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-3 mb-8"
            >
              <Button href={primaryHref} variant="primary" size="lg">
                Start Free
              </Button>
              <Button href={secondaryHref} variant="secondary" size="lg">
                Log in
              </Button>
            </motion.div>

            <motion.p
              initial={false}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-[var(--landing-text-muted)]"
            >
              No setup. No API key. Works in 60 seconds.
            </motion.p>

            {/* Stats row */}
            <motion.div
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-8 mt-10 pt-8
                         border-t border-[var(--landing-border)]"
            >
              {[
                { value: "28%", label: "reduction in agentic time" },
                { value: "5", label: "expert AI agents" },
                { value: "< 3s", label: "average response time" },
              ].map(s => (
                <div key={s.label}>
                  <div className="text-xl font-semibold text-[var(--landing-text)]">
                    {s.value}
                  </div>
                  <div className="mt-0.5 text-xs text-[var(--landing-text-muted)]">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: floating UI card */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <HeroImage3D />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
