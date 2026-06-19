"use client"
import Image from "next/image"
import { RevealOnScroll } from "@/components/ui/RevealOnScroll"

import { Target, Search, Bot, CheckCircle2, PenLine } from "lucide-react"

const AGENTS = [
  { name: "Orchestrator", role: "Breaks down your question into sub-tasks", icon: Target, color: "#FFF0EB", iconColor: "#C5A059" },
  { name: "Retriever",    role: "Runs hybrid BM25 + vector search",         icon: Search, color: "#EEF2FF", iconColor: "#3B6FE8" },
  { name: "Analyst",      role: "Synthesises passages into a draft answer",  icon: Bot, color: "#EDF5F1", iconColor: "#7CB69E" },
  { name: "Critic",       role: "Scores each claim, loops if < 70%",         icon: CheckCircle2, color: "#FFF8E6", iconColor: "#E2B227" },
  { name: "Writer",       role: "Formats final response with citations",     icon: PenLine, color: "#F0F0F5", iconColor: "#9CA3AF" },
]

export function AgentPipelineSection() {
  return (
    <section id="experts" className="bg-[var(--landing-bg-muted)] px-6 sm:px-8 lg:px-12 py-24 lg:py-32">
      <div className="max-w-7xl mx-auto">
        <RevealOnScroll className="text-center mb-14" variant="bounce">
          <p className="text-xs font-semibold uppercase tracking-widest
                        text-[#C5A059] mb-3">
            The pipeline
          </p>
          <h2 className="font-display text-4xl lg:text-5xl text-[var(--landing-text)]
                         tracking-[-0.02em] leading-[1.1]">
            5 agents. One right answer.
          </h2>
        </RevealOnScroll>

        <div className="flex flex-col lg:flex-row items-stretch gap-3">
          {AGENTS.map((agent, i) => (
            <RevealOnScroll key={agent.name} delay={i * 0.08}
                            className="flex-1" variant="pop">
              <div
                className="premium-glow-soft rounded-2xl border border-[var(--landing-border-soft)] p-6 h-full
                           relative group hover:shadow-card transition-all duration-200"
                style={{ backgroundColor: `${agent.iconColor}10` }}
              >
                <div 
                  className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-[14px] shadow-[inset_0_1px_3px_rgba(255,255,255,0.4)] dark:shadow-none" 
                  style={{ backgroundColor: `${agent.iconColor}15`, border: `1px solid ${agent.iconColor}30` }}
                >
                  <agent.icon className="w-5 h-5" style={{ color: agent.iconColor }} strokeWidth={1.5} />
                </div>
                <div className="text-xs font-semibold text-[var(--landing-text-muted)] uppercase
                                tracking-widest mb-1">
                  Agent {i + 1}
                </div>
                <h3 className="font-semibold text-[var(--landing-text)] text-sm mb-2">
                  {agent.name}
                </h3>
                <p className="text-xs text-[var(--landing-text-secondary)] leading-relaxed">
                  {agent.role}
                </p>

                {/* Arrow */}
                {i < AGENTS.length - 1 && (
                  <div className="hidden lg:block absolute -right-2 top-1/2
                                  -translate-y-1/2 z-10 text-[var(--landing-text-muted)] text-lg">
                    →
                  </div>
                )}
              </div>
            </RevealOnScroll>
          ))}
        </div>

        {/* Loop note */}
        <RevealOnScroll className="mt-6 text-center mb-16">
          <p className="text-sm text-[var(--landing-text-muted)]">
            ↻ Critic loops back to Analyst if confidence score &lt; 70% —
            ensuring every answer meets the quality bar.
          </p>
        </RevealOnScroll>

        <RevealOnScroll className="max-w-[800px] mx-auto" variant="slideLeft">
          <div className="pipeline-visual premium-glow-media group relative overflow-hidden rounded-2xl border border-[var(--landing-border-soft)] bg-[var(--landing-surface)] shadow-card">
            <Image
              src="/images/pipeline_visual.png"
              alt="NexusAI Neural Pipeline"
              width={1600}
              height={900}
              className="pipeline-visual-image w-full h-auto max-h-[400px] object-cover"
              sizes="(min-width: 1024px) 800px, 100vw"
            />
            <div className="pipeline-scan pointer-events-none absolute inset-0" />
            <div className="pipeline-orb pipeline-orb-one" />
            <div className="pipeline-orb pipeline-orb-two" />
            <div className="pipeline-orb pipeline-orb-three" />
          </div>
        </RevealOnScroll>
      </div>
    </section>
  )
}
