declare module "vanta/dist/vanta.birds.min" {
  type VantaEffect = {
    destroy?: () => void
  }

  type BirdsOptions = {
    el: HTMLElement
    THREE: unknown
    mouseControls?: boolean
    touchControls?: boolean
    gyroControls?: boolean
    minHeight?: number
    minWidth?: number
    scale?: number
    scaleMobile?: number
    backgroundColor?: number
    backgroundAlpha?: number
    color1?: number
    color2?: number
    colorMode?: string
    birdSize?: number
    wingSpan?: number
    speedLimit?: number
    separation?: number
    alignment?: number
    cohesion?: number
    quantity?: number
  }

  const BIRDS: (options: BirdsOptions) => VantaEffect
  export default BIRDS
}
