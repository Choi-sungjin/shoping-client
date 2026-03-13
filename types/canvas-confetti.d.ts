declare module "canvas-confetti" {
  type ConfettiOptions = {
    particleCount?: number
    spread?: number
    origin?: { x?: number; y?: number }
    colors?: string[]
    ticks?: number
    gravity?: number
    decay?: number
    startVelocity?: number
    shapes?: string[]
  }

  export default function confetti(options?: ConfettiOptions): Promise<null> | null
}
