"use client"

import { MotionReveal } from "./MotionReveal"
import { SectionHeader } from "./SectionHeader"

const steps = [
  {
    id: "01",
    title: "Ingest the source material",
    description:
      "PDFs, reports, datasets, and structured files are parsed into retrieval-ready chunks so the system understands both language and document boundaries.",
    detail: "Background ingestion, chunking, and embedding preparation",
  },
  {
    id: "02",
    title: "Fuse semantic and exact retrieval",
    description:
      "NexusAI combines vector similarity with lexical ranking so obscure names, clauses, and product codes stay discoverable alongside conceptual meaning.",
    detail: "Hybrid retrieval with reciprocal ranking discipline",
  },
  {
    id: "03",
    title: "Run multi-agent reasoning",
    description:
      "Specialized agents coordinate retrieval, synthesis, critique, and answer shaping to keep responses useful without drifting away from the corpus.",
    detail: "Retriever, analyst, critic, and writer collaboration",
  },
  {
    id: "04",
    title: "Stream answers with evidence",
    description:
      "The final response arrives progressively with citation anchors, helping teams validate claims immediately instead of waiting for a finished block of text.",
    detail: "Streaming answers with grounded citations",
  },
]

export function PlatformSection() {
  return (
    <section id="platform" className="relative px-6 sm:px-8 lg:px-12 py-24 lg:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(103,232,249,0.08),transparent_28%),radial-gradient(circle_at_80%_80%,rgba(245,158,11,0.08),transparent_28%)]" />
      <div className="relative mx-auto max-w-7xl">
        <MotionReveal>
          <SectionHeader
            eyebrow="Platform flow"
            title="From raw files to defensible answers in one continuous system."
            description="The product story should read like infrastructure made elegant: quiet power, measurable rigor, and fast clarity at every stage."
          />
        </MotionReveal>

        <div className="mt-16 grid gap-5 lg:grid-cols-2">
          {steps.map((step, index) => (
            <MotionReveal key={step.id} delay={index * 0.08} x={index % 2 === 0 ? -24 : 24}>
              <article className="feature-card group h-full rounded-[30px] p-7">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-5xl font-display tracking-[-0.08em] text-[var(--landing-text)] opacity-20">
                    {step.id}
                  </span>
                  <div className="rounded-full border border-[#F8F9FA]/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-slate-500">
                    Stage {step.id}
                  </div>
                </div>
                <h3 className="mt-8 max-w-md text-2xl font-semibold tracking-tight text-[var(--landing-text)] sm:text-[1.9rem]">
                  {step.title}
                </h3>
                <p className="mt-4 max-w-xl text-base leading-7 text-slate-400">
                  {step.description}
                </p>
                <div className="mt-8 border-t border-[#F8F9FA]/8 pt-5 text-sm text-amber-200/78">
                  {step.detail}
                </div>
              </article>
            </MotionReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
