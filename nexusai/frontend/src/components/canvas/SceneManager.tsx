/**
 * SceneManager — Selective rendering system for scroll-driven 3D.
 *
 * ── SELECTIVE RENDERING ───────────────────────────────────────────────────────
 *  Only scenes whose scroll range overlaps the current viewport execute
 *  any GPU work that frame. Out-of-view scenes do nothing.
 *
 *  Each scene is a separate R3F component that:
 *    1. Exposes a `render()` method via useImperativeHandle
 *    2. Reads scroll progress from useScrollStore
 *    3. Lerps its camera position based on progress
 *
 *  SceneManager holds a ref map and calls render() on only the active scene(s)
 *  inside useFrame. This is the core performance trick — without it, having
 *  4–5 complex 3D scenes would tank mobile framerates.
 * ──────────────────────────────────────────────────────────────────────────────
 */
"use client"

import { useRef, useCallback, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import { useScrollStore } from "@/store/scrollStore"
import type { SceneRange } from "@/store/scrollStore"
import { HeroScene } from "./scenes/HeroScene"
import { AboutScene } from "./scenes/AboutScene"

interface SceneConfig {
  id: string
  Component: React.ForwardRefExoticComponent<
    React.RefAttributes<{ render: (progress: number, sceneProgress: number) => void }>
  >
  range: SceneRange
}

/**
 * Configuration array — each entry is a 3D scene with its scroll range.
 * Only the scene(s) overlapping the current scroll progress will render.
 *
 * To add a new scene: push an entry here and create the corresponding
 * component in ./scenes/. No other wiring needed.
 */
const SCENE_CONFIGS: SceneConfig[] = [
  {
    id: "hero",
    Component: HeroScene,
    range: { start: 0, end: 0.25 },
  },
  {
    id: "about",
    Component: AboutScene,
    range: { start: 0.25, end: 0.5 },
  },
]

/**
 * SceneWrapper renders a single scene and registers its scroll range.
 * The actual render() call is driven by the parent SceneManager via ref.
 */
function SceneWrapper({
  config,
  onRef,
}: {
  config: SceneConfig
  onRef: (id: string, ref: { render: (p: number, sp: number) => void }) => void
}) {
  const registerScene = useScrollStore((s) => s.registerScene)
  const unregisterScene = useScrollStore((s) => s.unregisterScene)

  useEffect(() => {
    registerScene(config.id, config.range)
    return () => unregisterScene(config.id)
  }, [config.id, config.range, registerScene, unregisterScene])

  return (
    <config.Component
      ref={(ref) => {
        if (ref) onRef(config.id, ref)
      }}
    />
  )
}

export function SceneManager() {
  const progress = useScrollStore((s) => s.progress)
  const sceneProgress = useScrollStore((s) => s.sceneProgress)
  const sceneRanges = useScrollStore((s) => s.sceneRanges)

  // Store refs to each scene's render function
  const sceneRefs = useRef<Map<string, { render: (p: number, sp: number) => void }>>(new Map())

  const handleRef = useCallback(
    (id: string, ref: { render: (p: number, sp: number) => void }) => {
      sceneRefs.current.set(id, ref)
    },
    [],
  )

  // ── Selective rendering: only call render() on scenes in view ──────────
  useFrame(() => {
    for (const [id, ref] of sceneRefs.current.entries()) {
      const range = sceneRanges[id]
      if (!range) continue

      // If this scene's scroll range overlaps the current viewport, render it
      if (progress >= range.start && progress <= range.end) {
        // Calculate local progress within this scene
        const localProgress =
          range.end - range.start > 0
            ? (progress - range.start) / (range.end - range.start)
            : 0
        ref.render(progress, localProgress)
      }
    }
  })

  return (
    <group>
      {SCENE_CONFIGS.map((config) => (
        <SceneWrapper key={config.id} config={config} onRef={handleRef} />
      ))}
    </group>
  )
}
