"use client"

import { motion, useReducedMotion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function MotionReveal({
  children,
  className,
  delay = 0,
  y = 28,
  x = 0,
  once = true,
}: {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  x?: number
  once?: boolean
}) {
  const reduceMotion = useReducedMotion()
  const [ref, inView] = useInView({ triggerOnce: once, threshold: 0.18 })

  return (
    <motion.div
      ref={ref}
      initial={reduceMotion ? false : { opacity: 0, y, x }}
      animate={reduceMotion ? { opacity: 1 } : inView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}
