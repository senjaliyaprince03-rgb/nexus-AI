"use client"

import { motion, useReducedMotion } from "framer-motion"

const stack = [
  "Next.js 14",
  "FastAPI",
  "LangGraph",
  "MongoDB",
  "Redis",
  "Celery",
  "Vector Search",
  "MinIO",
  "TypeScript",
  "Framer Motion",
  "Three.js",
  "Tailwind CSS",
]

export function TechStrip() {
  const reduceMotion = useReducedMotion()

  return (
    <section className="overflow-hidden border-y border-[#F8F9FA]/8 px-6 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-center text-[11px] uppercase tracking-[0.34em] text-slate-500">
          Built with a modern AI application stack
        </p>
        <div className="mt-6 flex overflow-hidden">
          <motion.div
            animate={reduceMotion ? {} : { x: ["0%", "-50%"] }}
            transition={{ duration: 26, ease: "linear", repeat: Infinity }}
            className="flex min-w-max gap-3"
          >
            {[...stack, ...stack].map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="rounded-full border border-[#F8F9FA]/10 bg-white/4 px-4 py-2 text-sm text-slate-300"
              >
                {item}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
