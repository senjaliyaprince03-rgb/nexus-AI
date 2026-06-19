# NexusAI — 80s Corporate Tech 3D Landing

A production-grade portfolio/studio website inspired by shader.se, featuring a fixed 3D WebGL canvas behind scrolling HTML content with selective rendering for optimal performance.

## Architecture

### Fixed Canvas + HTML Overlay

The R3F Canvas renders at `position: fixed; z-index: -1; inset: 0` — it stays behind all HTML content. Standard `min-h-screen` divs scroll naturally over it. This creates the illusion of 3D scenes reacting to scroll without blocking content interaction.

### Scroll Pipeline

1. **Lenis** — smooth, snappable scroll driver
2. **GSAP ScrollTrigger** — reads scroll position, normalises to 0–1 progress
3. **Zustand store** (`store/scrollStore.ts`) — single source of truth for scroll state
4. **3D scenes** — each scene reads progress from store and lerps camera position in `useFrame`

### Selective Rendering (Performance)

The core performance optimisation. Without it, having 4–5 complex 3D scenes would destroy mobile framerates.

- `SceneManager.tsx` holds a config array: `[{ id, Component, range }]`
- Each scene registers its scroll range `{ start: 0–1, end: 0–1 }` on mount
- In `useFrame`, `SceneManager` iterates scenes and calls `render()` only on those whose range overlaps the current viewport
- Out-of-view scenes do zero GPU work that frame
- Each scene exposes `render()` via `useImperativeHandle`

### Scene Transitions

- **Screen-space**: `TransitionShader.ts` — a custom GLSL material that mixes between two render targets using a noise-based dissolve with gold edge glow
- **Physical**: Camera animates into 3D monitor geometry (future enhancement)

### Post-Processing

Applied via `@react-three/postprocessing`:
- **Bloom** — subtle glow on gold/bright elements
- **Chromatic Aberration** — very mild RGB split at edges
- **Film Grain/Noise** — adds texture to solid colour areas

## Design Theme: 80s Corporate Tech

Satirical corporate aesthetic with brutalist minimalism:

| Token | Value |
|-------|-------|
| Background | `#0a0a0a` |
| Text | `#f5f5f5` |
| Accent Gold | `#c8a84b` |
| Accent Blue | `#4a7a9c` |
| Font (body) | Inter Tight |
| Font (mono) | DM Mono |

Visual effects: scanline overlay, noise grain texture, thin gold borders, monospace labels.

## File Structure

```
src/
├── app/
│   ├── globals.css          # Tailwind + corporate theme overrides
│   ├── layout.tsx           # Font loading + providers + scanlines overlay
│   ├── providers.tsx        # CanvasLayout + QueryClient + SmoothScroll
│   └── page.tsx             # Landing page with all sections
├── components/
│   ├── canvas/
│   │   ├── CanvasLayout.tsx # Fixed R3F Canvas + lighting + effects
│   │   ├── Effects.tsx      # Post-processing (bloom, CA, grain)
│   │   ├── SceneManager.tsx # Selective rendering system
│   │   ├── ScrollManager.tsx# GSAP ScrollTrigger → Zustand bridge
│   │   └── scenes/
│   │       ├── HeroScene.tsx# Particle sphere + wireframe orb
│   │       └── AboutScene.tsx # Torus knot tunnel
├── shaders/
│   └── TransitionShader.ts  # Screen-space dissolve transition
├── store/
│   └── scrollStore.ts       # Zustand scroll state
├── styles/
│   └── tokens.css           # CSS custom property palette
```

## Performance Budgets

- Desktop: 60 fps target
- Mobile: 30 fps minimum
- `prefers-reduced-motion`: disables post-processing and limits animation
- WebGL 2.0 required; graceful fallback if unavailable
- Canvas DPR capped at 1.5 for mobile memory

## Development

```bash
cd nexuai/frontend
npm install
npm run dev
```

## Adding a New Scene

1. Create `components/canvas/scenes/NewScene.tsx` using `forwardRef` and `useImperativeHandle`
2. Add a config entry in `SceneManager.tsx`'s `SCENE_CONFIGS` array with `id`, `Component`, and scroll `range`
3. Add the corresponding HTML section to the landing page
