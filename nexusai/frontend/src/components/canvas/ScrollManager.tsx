/**
 * ScrollManager — GSAP ScrollTrigger reading DOM scroll → Zustand scrollStore
 *
 * ── SCROLL PIPELINE ───────────────────────────────────────────────────────────
 *  1. Lenis (smooth scroll) updates the actual scroll position
 *  2. ScrollTrigger listens to Lenis's `scroll` event and tracks it
 *  3. This component creates a single full-page ScrollTrigger that
 *     normalises scroll progress to 0–1 and pushes it to useScrollStore
 *  4. All 3D scenes read from the store in their useFrame loops
 *
 * This decoupling means scenes never touch DOM scroll APIs directly.
 * ──────────────────────────────────────────────────────────────────────────────
 */
"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useScrollStore } from "@/store/scrollStore"

gsap.registerPlugin(ScrollTrigger)

export function ScrollManager() {
  const setProgress = useScrollStore((s) => s.setProgress)
  const setPrefersReducedMotion = useScrollStore((s) => s.setPrefersReducedMotion)
  const hasInitialised = useRef(false)

  useEffect(() => {
    // Respect reduced motion preference
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener("change", handler)

    if (hasInitialised.current) return
    hasInitialised.current = true

    // Create a dummy element that spans the full page height.
    // ScrollTrigger tracks scroll through this element and normalises it.
    const track = document.createElement("div")
    track.id = "scroll-tracker"
    track.style.position = "absolute"
    track.style.top = "0"
    track.style.width = "1px"
    track.style.pointerEvents = "none"
    document.body.prepend(track)

    // Pin-based approach: a pinned dummy element the height of the page
    // gives us clean 0–1 progress readout via ScrollTrigger's progress.
    // The actual HTML content scrolls naturally on top of the fixed canvas.
    const st = ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.5, // Smooth interpolation lag — makes camera feel weighted
      onUpdate: (self) => {
        setProgress(self.progress)
      },
    })

    return () => {
      st.kill()
      track.remove()
      mq.removeEventListener("change", handler)
    }
  }, [setProgress, setPrefersReducedMotion])

  return null
}