"use client"
import CountUp from "react-countup"
import { useInView } from "react-intersection-observer"
import { motion } from "framer-motion"

const STATS = [
  { value: 50, suffix: "MB", label: "Max upload size", prefix: "" },
  { value: 5, suffix: "", label: "AI agents in pipeline", prefix: "" },
  { value: 99, suffix: "%", label: "Source accuracy", prefix: "" },
  { value: 3, suffix: "s", label: "Average response time", prefix: "<" },
]

export function StatsSection() {
  const [ref, inView] = useInView({ threshold: 0.3, triggerOnce: true })

  return (
    <section className="py-24 px-6 bg-slate-900/30 border-y border-slate-800/50">
      <div ref={ref} className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="text-center"
          >
            <div className="text-4xl md:text-5xl font-bold font-syne text-amber-400 mb-2">
              {stat.prefix}
              {inView ? (
                <CountUp end={stat.value} duration={2} suffix={stat.suffix} />
              ) : (
                "0"
              )}
            </div>
            <div className="text-sm text-slate-500">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
