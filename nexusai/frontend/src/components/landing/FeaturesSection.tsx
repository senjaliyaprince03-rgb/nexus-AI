"use client"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"

const FEATURES = [
  {
    title: "Hybrid BM25 + Vector Search",
    description: "Cosine similarity alone misses rare terms. BM25 catches what embeddings miss. RRF fusion picks the winner.",
    icon: "⚡",
    size: "col-span-3 md:col-span-2",
    color: "amber",
  },
  {
    title: "Multi-Agent Pipeline",
    description: "5 agents work in sequence. Critic loops back if confidence < 70%.",
    icon: "🤖",
    size: "col-span-3 md:col-span-1",
    color: "violet",
  },
  {
    title: "Real-time Streaming",
    description: "SSE tokens appear as the LLM generates them. No loading spinners.",
    icon: "🌊",
    size: "col-span-3 md:col-span-1",
    color: "cyan",
  },
  {
    title: "Cited Sources",
    description: "Every claim links back to the exact passage, page number, and document.",
    icon: "📑",
    size: "col-span-3 md:col-span-1",
    color: "emerald",
  },
  {
    title: "Workspace Isolation",
    description: "Each team gets its own knowledge base. Documents and chat history never cross workspaces.",
    icon: "🏢",
    size: "col-span-3 md:col-span-2",
    color: "rose",
  },
]

function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true })

  const colors: Record<string, string> = {
    amber:   "border-amber-500/30 hover:border-amber-500/60",
    violet:  "border-violet-500/30 hover:border-violet-500/60",
    cyan:    "border-cyan-500/30 hover:border-cyan-500/60",
    emerald: "border-emerald-500/30 hover:border-emerald-500/60",
    rose:    "border-rose-500/30 hover:border-rose-500/60",
  }
  const glows: Record<string, string> = {
    amber:  "group-hover:shadow-amber-500/20",
    violet: "group-hover:shadow-violet-500/20",
    cyan:   "group-hover:shadow-cyan-500/20",
    emerald:"group-hover:shadow-emerald-500/20",
    rose:   "group-hover:shadow-rose-500/20",
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className={`${feature.size} group p-8 rounded-3xl bg-slate-900/50 border ${colors[feature.color]} 
        backdrop-blur transition-all duration-300 cursor-default
        hover:scale-[1.02] hover:shadow-2xl ${glows[feature.color]}`}
    >
      <div className="text-4xl mb-4">{feature.icon}</div>
      <h3 className="text-xl font-bold font-syne text-[var(--landing-text)] mb-2">{feature.title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
    </motion.div>
  )
}

export function FeaturesSection() {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true })

  return (
    <section className="py-32 px-6 bg-[#020617]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold font-syne text-[var(--landing-text)]">
            Everything you need
            <br />
            <span className="text-slate-500">nothing you don&apos;t</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
