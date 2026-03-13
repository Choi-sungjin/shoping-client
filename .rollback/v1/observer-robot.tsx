"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { SplineScene } from "@/components/ui/spline-scene"

const ROBOT_SCENE = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
const HEAD_TRACK_X = 16
const HEAD_TRACK_Y = 10
const HEAD_TRACK_SMOOTH = 0.1

export function ObserverRobot() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  const mouseRef = useRef({ x: 0, y: 0 })
  const currentRotation = useRef({ x: 0, y: 0 })
  const rafId = useRef<number>(0)

  const updateRotation = useCallback(() => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const dx = mouseRef.current.x - centerX
    const dy = mouseRef.current.y - centerY

    const nx = Math.max(-1, Math.min(1, dx / (window.innerWidth / 2)))
    const ny = Math.max(-1, Math.min(1, dy / (window.innerHeight / 2)))

    const targetX = ny * -HEAD_TRACK_Y
    const targetY = nx * HEAD_TRACK_X

    currentRotation.current.x += (targetX - currentRotation.current.x) * HEAD_TRACK_SMOOTH
    currentRotation.current.y += (targetY - currentRotation.current.y) * HEAD_TRACK_SMOOTH

    const transform = `perspective(1000px) rotateX(${currentRotation.current.x}deg) rotateY(${currentRotation.current.y}deg)`
    containerRef.current.style.transform = transform
  }, [])

  useEffect(() => {
    mouseRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true })

    const tick = () => {
      updateRotation()
      rafId.current = requestAnimationFrame(tick)
    }
    rafId.current = requestAnimationFrame(tick)

    const timer = setTimeout(() => setVisible(true), 600)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      cancelAnimationFrame(rafId.current)
      clearTimeout(timer)
    }
  }, [updateRotation])

  return (
    <div
      className="fixed z-30 pointer-events-none hidden md:block"
      style={{
        top: "50%",
        right: "0",
        transform: "translateY(-50%)",
        width: "45vw",
        height: "90vh",
        opacity: visible ? 1 : 0,
        transition: "opacity 1.5s ease-out",
      }}
    >
      <div
        className="pointer-events-none absolute rounded-full blur-xl"
        style={{
          background:
            "radial-gradient(circle at center, rgba(240,240,240,0.06) 0%, rgba(220,220,220,0.03) 50%, transparent 80%)",
          width: 300,
          height: 300,
          left: "50%",
          top: "40%",
          transform: "translate(-50%, -50%)",
        }}
      />

      <div
        ref={containerRef}
        className="w-full h-full pointer-events-auto relative"
        style={{
          willChange: "transform",
          transformOrigin: "50% 24% 0",
        }}
      >
        <SplineScene scene={ROBOT_SCENE} className="w-full h-full" />
      </div>
    </div>
  )
}
