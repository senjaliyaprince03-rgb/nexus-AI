"use client"
import { BarChart3, Clock3, FileSpreadsheet, FileText, Search } from "lucide-react"
import type { CSSProperties } from "react"
import { RevealOnScroll } from "@/components/ui/RevealOnScroll"

const TASKS = [
  {
    category: "RESEARCH",
    title: "Find source documents instantly",
    desc: "Ask a specific question and get the exact passage, table, or data point from across all your uploaded files.",
    time: "< 3 seconds",
    output: "Cited answer",
    icon: Search,
    color: "#EDF5F1",
    border: "#7CB69E",
  },
  {
    category: "ANALYSIS",
    title: "Compare across multiple documents",
    desc: "Upload 10 contracts and ask which ones contain a particular clause. NexusAI reads all of them simultaneously.",
    time: "< 10 seconds",
    output: "Comparison table",
    icon: BarChart3,
    color: "#EEF2FF",
    border: "#3B6FE8",
  },
  {
    category: "EXTRACTION",
    title: "Pull structured data from PDFs",
    desc: "Extract all dates, names, figures, or tables from a PDF into a clean structured format.",
    time: "< 5 seconds",
    output: "Structured data",
    icon: FileSpreadsheet,
    color: "rgba(212,175,55,0.08)",
    border: "#C5A059",
  },
  {
    category: "SUMMARIES",
    title: "Summarise long reports",
    desc: "Get a concise executive summary of any document with the most important points highlighted.",
    time: "< 8 seconds",
    output: "Summary doc",
    icon: FileText,
    color: "#F8F7F4",
    border: "#9CA3AF",
  },
]

export function TaskShowcaseSection() {
  return (
    <section id="features" className="task-showcase-3d relative overflow-hidden px-6 sm:px-8 lg:px-12 py-24 lg:py-32 bg-[var(--landing-bg)]">
      <div className="task-depth-grid" />
      <div className="max-w-7xl mx-auto relative z-10">
        <RevealOnScroll variant="bounce">
          <p className="text-xs font-semibold uppercase tracking-widest
                        text-[#C5A059] mb-3">
            What you can do
          </p>
          <h2 className="font-display text-4xl lg:text-5xl font-bold tracking-[-0.02em] text-[var(--landing-text)] leading-[1.05] mb-4 max-w-[700px]">
            Not everything needs to be{" "}
            <span className="italic text-[#C5A059] font-serif font-normal">on your plate.</span>
          </h2>
          <p className="text-[var(--landing-text-secondary)] text-lg max-w-[480px] mb-14">
            Ask NexusAI anything about your documents —
            it finds, extracts, and synthesises the answer in seconds.
          </p>
        </RevealOnScroll>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TASKS.map((task, i) => {
            const Icon = task.icon

            return (
            <RevealOnScroll key={task.title} delay={i * 0.08} variant="slideRight">
              <div
                className="landing-3d-card feature-card-premium premium-glow-soft rounded-2xl border border-[var(--landing-border)] p-6 h-full group cursor-default bg-[var(--task-surface)] dark:bg-[var(--landing-surface)]"
                style={{
                  "--feature-accent": task.border,
                  "--task-surface": task.color,
                  animationDelay: `${i * -0.7}s`,
                } as CSSProperties}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="feature-icon-orb" style={{ color: task.border }}>
                    <Icon className="h-5 w-5" strokeWidth={2.1} />
                  </div>
                  <span className="inline-block px-2.5 py-1 rounded-full text-[10px]
                                   font-semibold tracking-widest uppercase"
                        style={{
                          background: `${task.border}15`,
                          color: task.border,
                        }}>
                    {task.category}
                  </span>
                </div>
                <h3 className="font-semibold text-[var(--landing-text)] text-[15px] mb-2 leading-snug">
                  {task.title}
                </h3>
                <p className="text-sm text-[var(--landing-text-secondary)] leading-relaxed mb-4">
                  {task.desc}
                </p>
                <div className="flex items-center gap-3 pt-4
                                border-t border-[var(--landing-border-soft)]">
                  <span className="inline-flex items-center gap-1.5 text-xs text-[var(--landing-text-muted)]">
                    <Clock3 className="h-3.5 w-3.5" strokeWidth={2} />
                    {task.time}
                  </span>
                  <span className="text-xs text-[var(--landing-text-muted)]">·</span>
                  <span className="text-xs text-[var(--landing-text-muted)]">{task.output}</span>
                </div>
              </div>
            </RevealOnScroll>
            )
          })}
        </div>
      </div>
    </section>
  )
}

