"use client"
import { RevealOnScroll } from "@/components/ui/RevealOnScroll"

const ROWS = [
  { label: "Generates a plausible draft",    other: true,  nexus: false, nexusLabel: "Delivers a verified, cited answer" },
  { label: "Can hallucinate, no source",     other: true,  nexus: false, nexusLabel: "Every claim links to exact passage" },
  { label: "You are the QA layer",           other: true,  nexus: false, nexusLabel: "Critic agent verifies before output" },
  { label: "You prompt, check, redo",        other: true,  nexus: false, nexusLabel: "Ask once, get it right" },
  { label: "Single LLM call",                other: true,  nexus: false, nexusLabel: "5-agent collaborative pipeline" },

]

export function ComparisonSection() {
  return (
    <section className="bg-[var(--landing-bg)] px-6 sm:px-8 lg:px-12 py-24 lg:py-32">
      <div className="max-w-[800px] mx-auto">
        <RevealOnScroll className="text-center mb-14" variant="bounce">
          <p className="text-xs font-semibold uppercase tracking-widest
                        text-[#C5A059] mb-3">
            Why NexusAI
          </p>
          <h2 className="font-display text-4xl lg:text-5xl font-bold tracking-[-0.02em] text-[var(--landing-text)] leading-[1.05]">
            Other AI tools are fast.
            <br />
            <span className="italic text-[#C5A059] font-serif font-normal">NexusAI is accountable.</span>
          </h2>
        </RevealOnScroll>

        <RevealOnScroll variant="slideRight" duration={0.8}>
          <div className="rounded-2xl border border-[var(--landing-border)] overflow-hidden
                          shadow-card">
            {/* Header */}
            <div className="grid grid-cols-2 border-b border-[var(--landing-border-soft)]">
              <div className="px-6 py-4 bg-[var(--landing-bg-muted)] text-center">
                <span className="text-sm font-semibold text-[var(--landing-text-muted)] uppercase
                                 tracking-widest">
                  Other AI Tools
                </span>
              </div>
              <div className="px-6 py-4 bg-[var(--landing-surface-strong)] text-center">
                <span className="text-sm font-bold text-[#C5A059] uppercase
                                 tracking-widest">
                  NexusAI
                </span>
              </div>
            </div>

            {/* Rows */}
            {ROWS.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-2 border-b border-[var(--landing-border-soft)]
                           last:border-0 hover:bg-[var(--landing-surface-muted)] transition-colors"
              >
                <div className="px-6 py-4 flex items-center gap-3">
                  <span className="text-[var(--landing-text-muted)] text-sm flex-shrink-0">✗</span>
                  <span className="text-sm text-[var(--landing-text-secondary)]">{row.label}</span>
                </div>
                <div className="px-6 py-4 flex items-center gap-3">
                  <span className="text-[#7CB69E] text-sm flex-shrink-0">✓</span>
                  <span className="text-sm text-[var(--landing-text)] font-medium">
                    {row.nexusLabel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </RevealOnScroll>
      </div>
    </section>
  )
}
