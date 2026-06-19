"use client"

import CountUp from "react-countup"
import { MotionReveal } from "./MotionReveal"
import { SectionHeader } from "./SectionHeader"
import { useInView } from "react-intersection-observer"

const stats = [
  { value: 5, suffix: "", label: "Specialized agents in the reasoning loop", prefix: "" },
  { value: 50, suffix: "MB", label: "Current single-file upload budget", prefix: "" },
  { value: 3, suffix: "s", label: "Target answer feel for quick questions", prefix: "<" },
  { value: 100, suffix: "%", label: "Responses designed to stay citation-linked", prefix: "" },
]

export function ProofSection() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.25 })

  return (
    <section id="proof" className="relative px-6 sm:px-8 lg:px-12 py-24 lg:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(139,92,246,0.12),transparent_24%),radial-gradient(circle_at_80%_100%,rgba(212,175,55,0.1),transparent_24%)]" />
      <div className="relative mx-auto max-w-7xl">
        <MotionReveal>
          <SectionHeader
            eyebrow="Proof points"
            title="Premium presentation only works if the numbers feel grounded."
            description="These signals are intentionally rooted in the product’s current capabilities so the interface feels credible, not inflated."
            align="center"
          />
        </MotionReveal>

        <div ref={ref} className="mt-16 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => (
            <MotionReveal key={stat.label} delay={index * 0.08}>
              <div className="feature-card rounded-[30px] p-7 text-center">
                <div className="font-display text-5xl tracking-[-0.08em] text-[var(--landing-text)]">
                  {stat.prefix}
                  {inView ? <CountUp end={stat.value} duration={2} suffix={stat.suffix} /> : "0"}
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-400">{stat.label}</p>
              </div>
            </MotionReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

