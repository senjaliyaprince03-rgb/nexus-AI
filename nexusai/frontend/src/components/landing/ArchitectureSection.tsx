"use client"
import { RevealOnScroll } from "@/components/ui/RevealOnScroll"
import { motion } from "framer-motion"
import { LogoMark } from "@/components/brand/LogoMark"

/* ── Animated SVG Diagram ─────────────────────────────────────────────────── */

function AgentDiagram() {
  return (
    <div className="relative w-full max-w-4xl mx-auto" style={{ minHeight: 280 }}>
      {/* ─── SVG Layer (connecting lines + animated dots) ─── */}
      <svg
        viewBox="0 0 900 280"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full absolute inset-0 z-0"
        aria-hidden="true"
      >
        <defs>
          {/* Gradient for left lines (orange = WRITE) */}
          <linearGradient id="grad-write" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C5A059" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#C5A059" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#C5A059" stopOpacity="0.8" />
          </linearGradient>
          {/* Gradient for right line (green = SYNC) */}
          <linearGradient id="grad-sync" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7CB69E" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#7CB69E" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#7CB69E" stopOpacity="0.1" />
          </linearGradient>
          {/* Glow filter for dots */}
          <filter id="glowDot">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ─── Static line paths (left → center) ─── */}
        {/* Agent 1 → Center */}
        <path
          d="M 230 60 C 310 60, 340 140, 390 140"
          fill="none"
          stroke="url(#grad-write)"
          strokeWidth="1.5"
          className="animate-line-draw"
        />
        {/* Agent 2 → Center (straight) */}
        <line
          x1="230" y1="140" x2="390" y2="140"
          stroke="url(#grad-write)"
          strokeWidth="1.5"
          className="animate-line-draw"
        />
        {/* Agent 3 → Center */}
        <path
          d="M 230 220 C 310 220, 340 140, 390 140"
          fill="none"
          stroke="url(#grad-write)"
          strokeWidth="1.5"
          className="animate-line-draw"
        />

        {/* ─── Static line path (center → right) ─── */}
        <line
          x1="510" y1="140" x2="670" y2="140"
          stroke="url(#grad-sync)"
          strokeWidth="1.5"
          className="animate-line-draw"
        />

        {/* ─── SYNC label ─── */}
        <text x="590" y="128" textAnchor="middle"
          className="fill-[#9CA3AF] text-[10px] font-semibold tracking-[0.15em]"
          style={{ fontSize: 10, letterSpacing: "0.15em", fontWeight: 600 }}>
          SYNC
        </text>

        {/* ─── WRITE label ─── */}
        <text x="310" y="128" textAnchor="middle"
          className="fill-[#9CA3AF] text-[10px] font-semibold tracking-[0.15em]"
          style={{ fontSize: 10, letterSpacing: "0.15em", fontWeight: 600 }}>
          WRITE
        </text>

        {/* ─── READ label (on curve bottom) ─── */}
        <text x="310" y="234" textAnchor="middle"
          className="fill-[#9CA3AF] text-[10px] font-semibold tracking-[0.15em]"
          style={{ fontSize: 10, letterSpacing: "0.15em", fontWeight: 600 }}>
          READ
        </text>

        {/* ─── Animated flowing dots (Agent 1 → Center) ─── */}
        <circle r="3" fill="#C5A059" filter="url(#glowDot)" opacity="0.9">
          <animateMotion
            dur="2.5s"
            repeatCount="indefinite"
            path="M 230 60 C 310 60, 340 140, 390 140"
          />
        </circle>
        <circle r="2" fill="#C5A059" opacity="0.5">
          <animateMotion
            dur="2.5s"
            repeatCount="indefinite"
            path="M 230 60 C 310 60, 340 140, 390 140"
            begin="0.8s"
          />
        </circle>

        {/* ─── Animated flowing dots (Agent 2 → Center) ─── */}
        <circle r="3" fill="#C5A059" filter="url(#glowDot)" opacity="0.9">
          <animateMotion
            dur="2s"
            repeatCount="indefinite"
            path="M 230 140 L 390 140"
            begin="0.3s"
          />
        </circle>
        <circle r="2" fill="#C5A059" opacity="0.5">
          <animateMotion
            dur="2s"
            repeatCount="indefinite"
            path="M 230 140 L 390 140"
            begin="1.2s"
          />
        </circle>

        {/* ─── Animated flowing dots (Agent 3 → Center) ─── */}
        <circle r="3" fill="#C5A059" filter="url(#glowDot)" opacity="0.9">
          <animateMotion
            dur="2.8s"
            repeatCount="indefinite"
            path="M 230 220 C 310 220, 340 140, 390 140"
            begin="0.5s"
          />
        </circle>
        <circle r="2" fill="#C5A059" opacity="0.5">
          <animateMotion
            dur="2.8s"
            repeatCount="indefinite"
            path="M 230 220 C 310 220, 340 140, 390 140"
            begin="1.5s"
          />
        </circle>

        {/* ─── Animated flowing dots (Center → Right) ─── */}
        <circle r="3" fill="#7CB69E" filter="url(#glowDot)" opacity="0.9">
          <animateMotion
            dur="2.2s"
            repeatCount="indefinite"
            path="M 510 140 L 670 140"
            begin="0.4s"
          />
        </circle>
        <circle r="2" fill="#7CB69E" opacity="0.5">
          <animateMotion
            dur="2.2s"
            repeatCount="indefinite"
            path="M 510 140 L 670 140"
            begin="1.4s"
          />
        </circle>

        {/* ─── Reverse flowing dots (Right → Center, read-back) ─── */}
        <circle r="2.5" fill="#E8A55B" filter="url(#glowDot)" opacity="0.7">
          <animateMotion
            dur="3s"
            repeatCount="indefinite"
            path="M 670 140 L 510 140"
            begin="1s"
          />
        </circle>
      </svg>

      {/* ─── HTML Overlay: Agent Cards + Central Hub + Business Card ─── */}
      <div className="relative z-10 grid items-center gap-0 h-[280px]"
        style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>

        {/* LEFT: Agent Cards */}
        <div className="grid grid-rows-3 h-[240px] items-center justify-start pl-4 lg:pl-6 w-full">
          {[
            { name: "Orchestrator Agent", icon: "🧠", color: "#E8A0BF" },
            { name: "Retriever Agent", icon: "🔍", color: "#7CB69E" },
            { name: "Analyst Agent", icon: "📊", color: "#3B6FE8" },
          ].map((agent, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.15, duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-[var(--landing-surface)] rounded-xl py-3 px-4 border border-[var(--landing-border)]
                         shadow-[0_1px_4px_rgba(0,0,0,0.04)] flex items-center gap-3 w-[200px]
                         hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow duration-300"
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                style={{ backgroundColor: agent.color + "20", color: agent.color }}
              >
                {agent.icon}
              </div>
              <span className="text-sm font-semibold text-[var(--landing-text)] leading-tight">
                {agent.name}
              </span>
            </motion.div>
          ))}
        </div>

        {/* CENTER: NexusAI Core Hub */}
        <div className="flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.35, delay: 0.5 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute -inset-5 rounded-[2.2rem] bg-gradient-to-br from-[#C5A059] via-[#FF9B6E] to-[var(--landing-text)] opacity-[0.18] blur-2xl animate-pulse" />
            <div className="relative flex h-28 w-28 items-center justify-center rounded-[2rem] border border-[var(--landing-border)] bg-[var(--landing-text)] shadow-[0_24px_60px_rgba(255,107,53,0.18),0_18px_50px_rgba(0,0,0,0.22)] lg:h-32 lg:w-32">
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-tr from-[#C5A059]/12 via-white/5 to-transparent" />
              <LogoMark
                alt="NexusAI shared brain"
                className="relative h-[82px] w-[82px] rounded-[1.45rem] shadow-none lg:h-[94px] lg:w-[94px]"
                priority
              />
            </div>
          </motion.div>
        </div>

        {/* RIGHT: Business Context */}
        <div className="flex items-center justify-end pr-2 lg:pr-4">
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-[var(--landing-surface)] rounded-xl p-5 border border-[var(--landing-border)]
                       shadow-[0_1px_4px_rgba(0,0,0,0.04)] text-center w-[200px]
                       hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow duration-300"
          >
            <h3 className="text-sm font-semibold text-[var(--landing-text)] mb-1.5">
              Your business context
            </h3>
            <p className="text-[10px] text-[var(--landing-text-muted)] uppercase tracking-[0.15em] font-semibold">
              RULES · DATA · POLICIES
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

/* ── Main Section ─────────────────────────────────────────────────────────── */

export function ArchitectureSection() {
  return (
    <section className="border-t border-[var(--landing-border-soft)] bg-[var(--landing-bg-muted)] px-6 sm:px-8 lg:px-12 py-24 lg:py-32">
      <div className="max-w-7xl mx-auto">

        {/* Section header */}
        <RevealOnScroll className="text-center mb-14" variant="fade">
          <h2 className="font-display text-3xl lg:text-5xl tracking-tight text-[var(--landing-text)] mb-4">
            A shared brain your agents{" "}
            <span className="italic text-[#C5A059]">write to and read from.</span>
          </h2>
        </RevealOnScroll>

        {/* Top Diagram Area */}
        <RevealOnScroll
          className="mb-14 bg-[var(--landing-surface)] rounded-3xl border border-[var(--landing-border)]
                     shadow-[0_10px_40px_rgba(0,0,0,0.03)] overflow-hidden"
          variant="fade"
        >
          <div className="p-6 lg:px-10 lg:py-12">
            {/* The animated SVG diagram — desktop only for the full effect */}
            <div className="hidden md:block">
              <AgentDiagram />
            </div>

            {/* Mobile fallback: stacked layout */}
            <div className="md:hidden flex flex-col items-center gap-6">
              <div className="flex flex-col gap-3 w-full">
                {[
                  { name: "Orchestrator Agent", icon: "🧠" },
                  { name: "Retriever Agent", icon: "🔍" },
                  { name: "Analyst Agent", icon: "📊" },
                ].map((agent, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="bg-[var(--landing-surface)] rounded-xl py-3 px-4 border border-[var(--landing-border)]
                               shadow-sm flex items-center gap-3"
                  >
                    <span className="text-sm">{agent.icon}</span>
                    <span className="text-sm font-semibold text-[var(--landing-text)]">{agent.name}</span>
                  </motion.div>
                ))}
              </div>

              {/* Arrow down */}
              <div className="flex flex-col items-center gap-1 text-[#C5A059]">
                <div className="w-px h-6 bg-[#C5A059] opacity-40" />
                <span className="text-xs font-bold tracking-widest">WRITE</span>
                <div className="w-px h-6 bg-[#C5A059] opacity-40" />
              </div>

              {/* Center hub */}
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-[var(--landing-border)] bg-[var(--landing-text)] shadow-[0_18px_40px_rgba(255,107,53,0.18)]">
                <div className="absolute -inset-3 rounded-[2rem] bg-[#C5A059]/15 blur-xl" />
                <LogoMark
                  alt="NexusAI shared brain"
                  className="relative h-[72px] w-[72px] rounded-2xl shadow-none"
                  priority
                />
              </div>

              {/* Arrow down */}
              <div className="flex flex-col items-center gap-1 text-[#7CB69E]">
                <div className="w-px h-6 bg-[#7CB69E] opacity-40" />
                <span className="text-xs font-bold tracking-widest">SYNC</span>
                <div className="w-px h-6 bg-[#7CB69E] opacity-40" />
              </div>

              {/* Business context */}
              <div className="bg-[var(--landing-surface)] rounded-xl p-5 border border-[var(--landing-border)] shadow-sm text-center w-full">
                <h3 className="text-sm font-semibold text-[var(--landing-text)] mb-1">Your business context</h3>
                <p className="text-[10px] text-[var(--landing-text-muted)] uppercase tracking-widest font-semibold">
                  RULES · DATA · POLICIES
                </p>
              </div>
            </div>
          </div>

          {/* Legend bar */}
          <div className="border-t border-[var(--landing-border-soft)] px-6 py-4">
            <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-10
                            text-[11px] font-semibold text-[var(--landing-text-muted)] uppercase tracking-[0.12em]">
              <div className="flex items-center gap-2">
                <span className="w-6 h-0.5 bg-[#C5A059] rounded-full" /> AGENTS WRITE
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-0.5 bg-[#E8A55B] rounded-full" /> AGENTS READ
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-0.5 bg-[#7CB69E] rounded-full" /> CONNECTED TO BUSINESS
              </div>
            </div>
          </div>
        </RevealOnScroll>

        {/* Bottom 3 Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Hybrid Search Pipeline",
              subtitle: "Structured, not retrieved",
              desc: "Every agent reads the same source of truth. No vector lottery, no per-agent scratchpads. BM25 and semantic embeddings fuse for perfect recall.",
              img: "data_processing"
            },
            {
              title: "Agent Orchestration",
              subtitle: "Built for multi-agent systems",
              desc: "Not a personal wiki, not a basic RAG pipeline. NexusAI was designed from day one for fleets of specialized agents that need to coordinate and criticize each other.",
              img: "network_graph"
            },
            {
              title: "Verified Citations",
              subtitle: "Works with the frameworks you use",
              desc: "Drops into LangChain, CrewAI, Mastra, OpenAI, Claude, and the rest. Every piece of knowledge written or read is tracked back to the source PDF or document.",
              img: "analytics_dashboard"
            }
          ].map((card, i) => (
            <RevealOnScroll key={i} delay={i * 0.15} variant="slideLeft">
              <div className="bg-[var(--landing-surface)] rounded-2xl p-6 border border-[var(--landing-border)]
                              shadow-sm h-full hover:shadow-md transition-shadow duration-300">
                <div className="h-32 mb-6 rounded-lg bg-[var(--landing-bg-muted)] overflow-hidden
                                border border-[var(--landing-border-soft)] relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/images/${card.img}.png`}
                    alt={card.title}
                    className="w-full h-full object-cover opacity-80 mix-blend-multiply"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
                </div>
                <h3 className="mb-1 text-lg font-semibold text-[var(--landing-text)]">{card.subtitle}</h3>
                <h4 className="mb-3 text-sm font-medium text-[#C5A059]">{card.title}</h4>
                <p className="text-sm leading-relaxed text-[var(--landing-text-secondary)]">{card.desc}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>

      </div>
    </section>
  )
}
