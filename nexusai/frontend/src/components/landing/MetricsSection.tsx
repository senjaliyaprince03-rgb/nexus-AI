"use client"

import { Target, Cpu, Shield, LineChart, Library, Blocks, type LucideIcon } from "lucide-react"
import { RevealOnScroll } from "@/components/ui/RevealOnScroll"

type Capability = {
  title: string
  description: string
  icon: LucideIcon
  className?: string
}

const CAPABILITIES: Capability[] = [
  {
    title: "Hybrid retrieval architecture",
    description:
      "Blend semantic recall with exact lexical matching so deep technical terms do not vanish inside embedding-only search.",
    icon: Target,
    className: "lg:col-span-2",
  },
  {
    title: "Multi-agent orchestration",
    description: "Separate retrieval, synthesis, critique, and answer delivery into specialized roles.",
    icon: Cpu,
  },
  {
    title: "Workspace isolation",
    description: "Keep documents and answer histories partitioned by workspace for cleaner governance.",
    icon: Shield,
  },
  {
    title: "Observability-ready analytics",
    description: "Surface usage trends, document activity, and answer behavior in a control-room style interface.",
    icon: LineChart,
  },
  {
    title: "Cited answer streaming",
    description: "Progressive output keeps review loops moving while the system maintains source traceability.",
    icon: Library,
  },
  {
    title: "Infrastructure-grade extensibility",
    description:
      "Designed to feel like an AI platform, not a toy chatbot, with room for agents, controls, and workflow evolution.",
    icon: Blocks,
    className: "lg:col-span-2",
  },
]

export function MetricsSection() {
  return (
    <section id="capabilities" className="relative overflow-hidden bg-[var(--landing-bg-muted)] px-6 sm:px-8 lg:px-12 py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,107,53,0.08),transparent_28%),radial-gradient(circle_at_80%_80%,rgba(124,182,158,0.08),transparent_28%)]" />

      <div className="relative mx-auto max-w-7xl">
        <RevealOnScroll className="text-center mb-16" variant="rise">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#C5A059]">
            Capabilities
          </p>
          <h2 className="font-display text-4xl lg:text-5xl font-bold tracking-[-0.02em] text-[var(--landing-text)] leading-[1.05] max-w-[900px] mx-auto">
            A product surface shaped by retrieval rigor,{" "}
            <span className="italic text-[#C5A059] font-serif font-normal">not demo theatrics.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-[var(--landing-text-secondary)]">
            The interface should showcase what makes NexusAI trustworthy: careful search, grounded reasoning, and a product shell that feels operationally mature.
          </p>
        </RevealOnScroll>

        <div className="grid gap-5 lg:grid-cols-3">
          {CAPABILITIES.map((capability, index) => {
            const Icon = capability.icon

            return (
              <RevealOnScroll key={capability.title} delay={index * 0.06} variant="pop">
                <article
                  className={`h-full rounded-[30px] border border-[var(--landing-border)] bg-[var(--landing-surface)] p-7 shadow-[0_20px_40px_rgba(2,8,20,0.18)] transition-transform duration-300 hover:-translate-y-1.5 hover:border-[var(--landing-border-soft)] ${capability.className ?? ""}`}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#C5A059]/10 via-[#C5A059]/5 to-transparent border border-[#C5A059]/20 text-[#C5A059] shadow-[inset_0_1px_4px_rgba(255,107,53,0.1)]">
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="mt-8 text-2xl font-semibold tracking-tight text-[var(--landing-text)]">
                    {capability.title}
                  </h3>
                  <p className="mt-4 max-w-xl text-base leading-7 text-[var(--landing-text-secondary)]">
                    {capability.description}
                  </p>
                </article>
              </RevealOnScroll>
            )
          })}
        </div>
      </div>
    </section>
  )
}
