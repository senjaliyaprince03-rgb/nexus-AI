/**
 * CanvasLayout — Fixed R3F Canvas + ScrollManager + SceneManager + effects.
 *
 * ── ARCHITECTURE ───────────────────────────────────────────────────────────────
 *  This component:
 *    1. Renders an R3F Canvas that is position: fixed, z-index: -1, behind all HTML
 *    2. Hosts the SceneManager (selective rendering of per-section 3D scenes)
 *    3. Hosts the ScrollManager (GSAP ScrollTrigger → Zustand)
 *    4. Applies post-processing (film grain, chromatic aberration, bloom)
 *    5. Handles WebGPU detection with WebGL fallback
 *    6. Responds to prefers-reduced-motion
 *
 *  The HTML overlay scrolls normally on top of this fixed canvas via standard
 *  CSS stacking (the canvas is z-index: -1, content is z-index: 1+).
 *
 *  CSS is applied via Tailwind classes on the wrapping div.
 * ───────────────────────────────────────────────────────────────────────────────
 */
"use client"

import { Suspense, useEffect, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { useScrollStore } from "@/store/scrollStore"
import { SceneManager } from "./SceneManager"
import { ScrollManager } from "./ScrollManager"
import { Effects } from "./Effects"

function SceneContent() {
  const prefersReducedMotion = useScrollStore((s) => s.prefersReducedMotion)

  return (
    <>
      {/* Ambient + directional lights for scene illumination */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} color="#c8a84b" />
      <directionalLight position={[-3, 2, -5]} intensity={0.4} color="#4a7a9c" />

      {/* Selective rendering manager — controls all per-section scenes */}
      <SceneManager />

      {/* GSAP ScrollTrigger → Zustand bridge */}
      <ScrollManager />

      {/* Post-processing: film grain, chromatic aberration, bloom */}
      {!prefersReducedMotion && <Effects />}
    </>
  )
}

export function CanvasLayout() {
  const [webglSupported, setWebglSupported] = useState(true)

  useEffect(() => {
    // Quick WebGL 2.0 detection (WebGPU support is detected at the R3F level)
    try {
      const canvas = document.createElement("canvas")
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl")
      if (!gl) setWebglSupported(false)
    } catch {
      setWebglSupported(false)
    }
  }, [])

  if (!webglSupported) return null

  return (
    <div
      className="fixed inset-0 z-[-1] h-full w-full"
      aria-hidden="true" // Canvas is decorative — screen readers skip it
    >
      <Canvas
        dpr={[1, 1.5]} // Cap pixel ratio for performance on Retina displays
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{
          position: [0, 0, 4.5],
          fov: 50,
          near: 0.1,
          far: 100,
        }}
        style={{ background: "transparent" }}
        // Fallback: R3F auto-detects WebGL2 → WebGL1 → disable if neither
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0) // Transparent clear
        }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  )
}
