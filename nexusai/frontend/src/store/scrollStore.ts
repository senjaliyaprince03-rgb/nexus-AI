/**
 * scrollStore — shared scroll state for the 3D pipeline.
 *
 * Lenis + GSAP ScrollTrigger → this Zustand store → scenes consume in useFrame.
 * This decouples scroll input from 3D rendering so scenes don't need to know
 * about DOM scroll at all — they just read progress and lerp their camera.
 */
import { create } from "zustand"

export interface SceneRange {
  /** 0–1: scroll progress at which this scene becomes active */
  start: number
  /** 0–1: scroll progress at which this scene finishes */
  end: number
}

interface ScrollState {
  /** Normalised 0–1 scroll progress for the entire page */
  progress: number
  /** 0–1 progress within the currently active scene */
  sceneProgress: number
  /** ID of the scene that overlaps the current viewport */
  activeSceneId: string | null
  /** Per-scene scroll ranges (set by SceneManager on mount) */
  sceneRanges: Record<string, SceneRange>
  /** Whether user prefers reduced motion */
  prefersReducedMotion: boolean

  setProgress: (p: number) => void
  setActiveScene: (id: string | null) => void
  registerScene: (id: string, range: SceneRange) => void
  unregisterScene: (id: string) => void
  setPrefersReducedMotion: (v: boolean) => void
}

export const useScrollStore = create<ScrollState>((set, get) => ({
  progress: 0,
  sceneProgress: 0,
  activeSceneId: null,
  sceneRanges: {},
  prefersReducedMotion: false,

  setProgress: (progress) => {
    const { sceneRanges } = get()
    // Find which scene range contains the current progress
    let activeId: string | null = null
    let sceneProgress = 0

    for (const [id, range] of Object.entries(sceneRanges)) {
      if (progress >= range.start && progress <= range.end) {
        activeId = id
        const rangeSize = range.end - range.start
        sceneProgress = rangeSize > 0 ? (progress - range.start) / rangeSize : 0
        break
      }
    }

    set({ progress, activeSceneId: activeId, sceneProgress })
  },

  setActiveScene: (activeSceneId) => set({ activeSceneId }),

  registerScene: (id, range) =>
    set((s) => ({
      sceneRanges: { ...s.sceneRanges, [id]: range },
    })),

  unregisterScene: (id) =>
    set((s) => {
      const { [id]: _, ...rest } = s.sceneRanges
      return { sceneRanges: rest }
    }),

  setPrefersReducedMotion: (v) => set({ prefersReducedMotion: v }),
}))
