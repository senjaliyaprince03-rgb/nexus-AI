/**
 * Effects — Post-processing pipeline for the 3D canvas.
 *
 * Applies film grain + chromatic aberration + subtle bloom.
 * This gives the 3D scenes a cinematic, slightly "analog" feel that
 * contrasts with the digital precision of the UI.
 *
 * Uses @react-three/postprocessing which wraps Three.js EffectComposer.
 * ─────────────────────────────────────────────────────────────────────────────
 */
"use client"

import { EffectComposer, Bloom, ChromaticAberration, Noise } from "@react-three/postprocessing"
import * as THREE from "three"
import { useScrollStore } from "@/store/scrollStore"

export function Effects() {
  const prefersReducedMotion = useScrollStore((s) => s.prefersReducedMotion)

  // Respect reduced motion — still show scene but skip heavy effects
  if (prefersReducedMotion) {
    return (
      <EffectComposer>
        <Noise opacity={0.015} premultiply />
      </EffectComposer>
    )
  }

  return (
    <EffectComposer>
      {/* Subtle bloom on bright elements (gold accents) */}
      <Bloom
        intensity={0.3}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.8}
        mipmapBlur
      />

      {/* Chromatic aberration — very mild RGB separation at edges */}
      <ChromaticAberration
        offset={new THREE.Vector2(0.001, 0.0005)}
        radialModulation={false}
        modulationOffset={0}
      />

      {/* Film grain — adds texture to solid colour areas */}
      <Noise opacity={0.025} premultiply />
    </EffectComposer>
  )
}
