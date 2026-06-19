"use client"
import { motion } from "framer-motion"

const STACK = [
  "FastAPI", "Next.js 14", "LangGraph", "MongoDB",
  "Claude Sonnet", "Celery", "Redis", "MinIO",
  "sentence-transformers", "Tailwind CSS", "Redis",
  "Docker", "Framer Motion", "TypeScript", "Python 3.11",
]

export function TechMarquee() {
  return (
    <section className="py-16 overflow-hidden border-y border-slate-800/50">
      <p className="text-center text-xs text-slate-600 uppercase tracking-widest mb-8">
        Built with
      </p>
      <div className="flex">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="flex gap-6 whitespace-nowrap"
        >
          {[...STACK, ...STACK].map((tech, i) => (
            <span
              key={i}
              className="px-5 py-2.5 text-sm text-slate-400 border border-slate-700/50 rounded-full hover:border-amber-500/40 hover:text-amber-400 transition-colors cursor-default flex-shrink-0"
            >
              {tech}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
