"use client"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { ReactNode } from "react"

interface Props {
  children: ReactNode
  delay?: number
  className?: string
  variant?: "rise" | "slideLeft" | "slideRight" | "pop" | "bounce" | "fade"
  duration?: number
}

export function RevealOnScroll({
  children,
  delay = 0,
  className = "",
  variant = "rise",
  duration = 0.5
}: Props) {
  const [ref, inView] = useInView({ threshold: 0.15, triggerOnce: true })

  const variants: Record<string, any> = {
    rise:       { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { duration, delay, ease: [0.22, 1, 0.36, 1] } },
    slideLeft:  { initial: { opacity: 0, x: -40 }, animate: { opacity: 1, x: 0 }, transition: { duration, delay, ease: [0.22, 1, 0.36, 1] } },
    slideRight: { initial: { opacity: 0, x: 40 }, animate: { opacity: 1, x: 0 }, transition: { duration, delay, ease: [0.22, 1, 0.36, 1] } },
    pop:        { initial: { opacity: 0, scale: 0.85, y: 10 }, animate: { opacity: 1, scale: 1, y: 0 }, transition: { type: "spring", bounce: 0.3, duration: duration * 1.5, delay } },
    bounce:     { initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0 }, transition: { type: "spring", bounce: 0.5, duration: duration * 1.5, delay } },
    fade:       { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration, delay, ease: "easeInOut" } }
  }

  const selected = variants[variant]

  return (
    <motion.div
      ref={ref}
      initial={selected.initial}
      animate={inView ? selected.animate : selected.initial}
      transition={selected.transition}
      className={className}
    >
      {children}
    </motion.div>
  )
}
