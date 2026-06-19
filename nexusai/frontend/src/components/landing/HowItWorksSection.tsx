"use client"

import { useRef } from "react"
import Image from "next/image"
import {
  Bot,
  Search,
  ShieldCheck,
  UploadCloud,
  type LucideIcon,
} from "lucide-react"
import { RevealOnScroll } from "@/components/ui/RevealOnScroll"

type StepItem = {
  n: string
  who: string
  title: string
  desc: string
  img: string
  icon: LucideIcon
  note: string
  tags: string[]
}

const STEPS: StepItem[] = [
  {
    n: "01",
    who: "Ingestion",
    title: "Ingest the source material",
    desc: "PDFs, reports, datasets, and structured files are parsed into retrieval-ready chunks so the system understands both language and document boundaries.",
    img: "laptop_workspace",
    icon: UploadCloud,
    note: "Background ingestion, chunking, and embedding preparation keep the corpus organized before retrieval begins.",
    tags: ["Ingestion pipeline", "Workspace boundaries"],
  },
  {
    n: "02",
    who: "Retrieval",
    title: "Fuse semantic and exact retrieval",
    desc: "NexusAI combines vector similarity with lexical ranking so obscure names, clauses, and product codes stay discoverable alongside conceptual meaning.",
    img: "data_processing",
    icon: Search,
    note: "Hybrid retrieval with reciprocal ranking discipline keeps both meaning and exact wording in play.",
    tags: ["Dense retrieval", "Lexical ranking"],
  },
  {
    n: "03",
    who: "Reasoning",
    title: "Run multi-agent reasoning",
    desc: "Specialized agents coordinate retrieval, synthesis, critique, and answer shaping to keep responses useful without drifting away from the corpus.",
    img: "analytics_dashboard",
    icon: Bot,
    note: "Retriever, analyst, critic, and writer collaboration keeps the answer grounded from first draft to final pass.",
    tags: ["Specialized agents", "Critic loop"],
  },
  {
    n: "04",
    who: "Evidence",
    title: "Stream answers with evidence",
    desc: "The final response arrives progressively with citation anchors, helping teams validate claims immediately instead of waiting for a finished block of text.",
    img: "secure_vault",
    icon: ShieldCheck,
    note: "Streaming answers with grounded citations make verification immediate instead of deferred.",
    tags: ["Live citations", "Source traceability"],
  },
]

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement | null>(null)



  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="wm relative overflow-hidden bg-[var(--landing-bg-muted)] px-6 sm:px-8 lg:px-12 py-24 lg:py-32 text-[var(--landing-text)]"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(255,107,53,0.10),transparent_22%),radial-gradient(circle_at_82%_20%,rgba(209,236,255,0.10),transparent_24%),radial-gradient(circle_at_74%_78%,rgba(255,155,110,0.08),transparent_26%)]" />
        <div className="absolute left-[-12%] top-[8%] h-[420px] w-[420px] rounded-full bg-[#C5A059]/[0.10] blur-3xl" />
        <div className="absolute right-[-8%] top-[28%] h-[520px] w-[520px] rounded-full bg-[#D1ECFF]/[0.07] blur-3xl" />
        <div className="absolute right-[8%] top-[16%] hidden h-[36%] w-[26%] rounded-full bg-[radial-gradient(circle,rgba(255,107,53,0.06),transparent_70%)] blur-3xl lg:block" />
        <div className="absolute left-1/2 top-[14%] hidden h-[72%] w-px -translate-x-1/2 bg-[linear-gradient(180deg,transparent,color-mix(in_srgb,var(--landing-text)_15%,transparent),transparent)] lg:block" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1180px]">
        <RevealOnScroll variant="rise" className="mb-14 lg:mb-16">
          <div className="max-w-[920px]">
            <h2 className="font-display text-4xl lg:text-5xl font-bold leading-[1.05] tracking-[-0.02em] text-[var(--landing-text)] drop-shadow-sm">
              From raw files to defensible answers
              <br />
              <span className="italic text-[#C5A059] font-serif font-normal">in one continuous system.</span>
            </h2>
            <p className="mt-5 max-w-[760px] text-lg leading-relaxed text-[var(--landing-text-secondary)] font-medium lg:leading-8">
              The product story should read like infrastructure made elegant: quiet power, measurable rigor, and fast clarity at every stage.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3 lg:mt-8">
              <SummaryCard
                label="Workflow"
                value="4 steps"
                detail="From ingestion to grounded output"
              />
              <SummaryCard
                label="Retrieval"
                value="Hybrid"
                detail="Dense and sparse ranking combined"
              />
              <SummaryCard
                label="Outcome"
                value="Verified"
                detail="Answers backed by live citations"
              />
            </div>
          </div>
        </RevealOnScroll>

        <div className="space-y-8 lg:space-y-10">
          {STEPS.map((step, index) => {
            const mediaFirst = index % 2 === 0
            return (
              <div
                key={step.n}
                className="py-6 lg:py-10"
              >
                <div className="grid gap-4 lg:grid-cols-12 lg:items-center lg:gap-5">
                  <RevealOnScroll
                    variant={mediaFirst ? "slideLeft" : "slideRight"}
                    className={
                      mediaFirst
                        ? "lg:col-span-6"
                        : "lg:col-span-6 lg:col-start-7 lg:row-start-1"
                    }
                  >
                    <StepMediaCard
                      step={step}
                    />
                  </RevealOnScroll>

                  <div
                    className={
                      mediaFirst
                        ? "lg:col-span-6"
                        : "lg:col-span-6 lg:col-start-1 lg:row-start-1"
                    }
                  >
                    <StepDetailCard step={step} mediaFirst={mediaFirst} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function StepMediaCard({
  step,
}: {
  step: StepItem
}) {
  const Icon = step.icon

  return (
    <div className="group relative">
      <div className="rounded-[32px] bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,240,235,0.84))] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))] p-[1px] shadow-[0_22px_52px_rgba(15,23,42,0.10)]">
        <div className="relative overflow-hidden rounded-[31px] border border-[#F8F9FA]/75 dark:border-[#F8F9FA]/10 bg-white/75 dark:bg-[#1A1A1A]/90">
          
          <Image
            src={`/images/${step.img}.png`}
            alt={step.title}
            width={1400}
            height={1050}
            quality={100}
            unoptimized={true}
            className="aspect-[4/3] min-h-[280px] w-full object-cover transition-transform duration-700 group-hover:scale-[1.02] sm:min-h-[340px] lg:min-h-[420px]"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />

          <div className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-[#F8F9FA]/80 dark:border-[#F8F9FA]/10 bg-white/90 dark:bg-black/60 px-3 py-1.5 shadow-[0_14px_28px_rgba(15,23,42,0.10)] backdrop-blur">
            <Icon className="h-3.5 w-3.5 text-[#C5A059]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#64748B] dark:text-gray-300">
              {step.who}
            </span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 z-20 sm:bottom-5 sm:left-5 sm:right-5">
            <div className="rounded-[24px] border border-[#F8F9FA]/75 dark:border-[#F8F9FA]/10 bg-white/80 dark:bg-black/60 p-3.5 shadow-[0_14px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:p-4.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[16px] font-semibold tracking-tight text-[#18181B] dark:text-[#F8F9FA] lg:text-[18px]">
                  {step.title}
                </p>
                <div className="rounded-full bg-[#201915] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                  Step {step.n}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StepDetailCard({ step, mediaFirst }: { step: StepItem; mediaFirst: boolean }) {
  const Icon = step.icon
  const slideVariant = mediaFirst ? "slideRight" : "slideLeft"

  return (
    <article className="lg:px-10">
      <RevealOnScroll variant={slideVariant} delay={0.0}>
        <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-[#FFB99A]/30 dark:border-[#C5A059]/20 bg-[#FFF2EC] dark:bg-[#C5A059]/10 text-[#C5A059] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] dark:shadow-none">
          <Icon className="h-5 w-5" />
        </div>
      </RevealOnScroll>

      <RevealOnScroll variant={slideVariant} delay={0.1}>
        <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#C5A059]">
          {step.who}
        </p>
      </RevealOnScroll>

      <RevealOnScroll variant={slideVariant} delay={0.2}>
        <h3 className="mt-3 font-display text-[clamp(1.75rem,2.5vw,2.25rem)] leading-[1.05] tracking-tight bg-gradient-to-br from-gray-900 via-gray-800 to-gray-600 dark:from-white dark:via-[#F0F0F0] dark:to-[#B0B0B0] bg-clip-text text-transparent">
          {step.title}
        </h3>
      </RevealOnScroll>

      <RevealOnScroll variant={slideVariant} delay={0.3}>
        <p className="mt-4 text-[14px] leading-7 text-[#4B5563] dark:text-[#A8A39F] sm:text-[15px] lg:text-[16px] lg:leading-8">
          {step.desc}
        </p>
      </RevealOnScroll>

      <RevealOnScroll variant={slideVariant} delay={0.4}>
        <div className="mt-6 flex flex-wrap gap-2.5">
          {step.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[var(--landing-border)] bg-gray-50 px-3 py-1.5 text-[11px] font-semibold text-[var(--landing-text-muted)] shadow-sm sm:px-3.5 sm:text-[12px]"
            >
              {tag}
            </span>
          ))}
        </div>
      </RevealOnScroll>

      <RevealOnScroll variant={slideVariant} delay={0.5}>
        <div className="mt-6 border-t border-[var(--landing-border)] pt-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#C5A059]">
            What this improves
          </p>
          <p className="mt-3 text-[13px] leading-6 text-[var(--landing-text-muted)] sm:text-[14px] sm:leading-7">
            {step.note}
          </p>
        </div>
      </RevealOnScroll>
    </article>
  )
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-[24px] border border-[var(--landing-border)] bg-[var(--landing-surface)] px-5 py-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none backdrop-blur sm:px-6 sm:py-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--landing-text-muted)]">
        {label}
      </p>
      <p className="mt-2 font-display text-[1.75rem] leading-none text-[var(--landing-text)] sm:text-[1.9rem] lg:text-[2.05rem]">
        {value}
      </p>
      <p className="mt-2 text-[13px] leading-5 text-[var(--landing-text-muted)] sm:text-sm sm:leading-6">
        {detail}
      </p>
    </div>
  )
}
