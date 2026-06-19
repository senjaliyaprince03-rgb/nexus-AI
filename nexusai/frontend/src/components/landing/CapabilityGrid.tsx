"use client"

import { Activity, Binary, Bot, DatabaseZap, Radar, ShieldCheck } from "lucide-react"
import { MotionReveal } from "./MotionReveal"
import { SectionHeader } from "./SectionHeader"

const features = [
  {
    title: "Hybrid retrieval architecture",
    description: "Blend semantic recall with exact lexical matching so deep technical terms do not vanish inside embedding-only search.",
    icon: Radar,
    className: "lg:col-span-2",
  },
  {
    title: "Multi-agent orchestration",
    description: "Separate retrieval, synthesis, critique, and answer delivery into specialized roles.",
    icon: Bot,
  },
  {
    title: "Workspace isolation",
    description: "Keep documents and answer histories partitioned by workspace for cleaner governance.",
    icon: ShieldCheck,
  },
  {
    title: "Observability-ready analytics",
    description: "Surface usage trends, document activity, and answer behavior in a control-room style interface.",
    icon: Activity,
  },
  {
    title: "Cited answer streaming",
    description: "Progressive output keeps review loops moving while the system maintains source traceability.",
    icon: DatabaseZap,
  },
  {
    title: "Infrastructure-grade extensibility",
    description: "Designed to feel like an AI platform, not a toy chatbot, with room for agents, controls, and workflow evolution.",
    icon: Binary,
    className: "lg:col-span-2",
  },
]

export function CapabilityGrid() {
  return (
    <section id="capabilities" className="px-6 sm:px-8 lg:px-12 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <MotionReveal>
          <SectionHeader
            eyebrow="Capabilities"
            title="A product surface shaped by retrieval rigor, not demo theatrics."
            description="The interface should showcase what makes NexusAI trustworthy: careful search, grounded reasoning, and a product shell that feels operationally mature."
          />
        </MotionReveal>

        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          {features.map((feature, index) => (
            <MotionReveal key={feature.title} delay={index * 0.06} y={30}>
              <article className={`feature-card group h-full rounded-[30px] p-7 ${feature.className ?? ""}`}>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#F8F9FA]/10 bg-white/5 text-amber-300">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-10 text-2xl font-semibold tracking-tight text-[var(--landing-text)]">
                  {feature.title}
                </h3>
                <p className="mt-4 max-w-xl text-base leading-7 text-slate-400">
                  {feature.description}
                </p>
              </article>
            </MotionReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
