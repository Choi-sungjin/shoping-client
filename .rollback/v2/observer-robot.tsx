"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { SplineScene } from "@/components/ui/spline-scene"

export const LOGOUT_HOVER_EVENT = "robot:logout-hover"

const ROBOT_SCENE = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
const HEAD_TRACK_X = 16
const HEAD_TRACK_Y = 10
const HEAD_TRACK_SMOOTH = 0.1
const SWAY_YAW_DEG = 18
const SWAY_SPEED = 2.2
const HEAD_ORIGIN_Y = 24
const TRACK_SCALE = 1.2

export function ObserverRobot() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const isDenyMode = useRef(false)

  const mouseRef = useRef({ x: 0, y: 0 })
  const currentRotation = useRef({ x: 0, y: 0 })
  const rafId = useRef<number>(0)
  const denyBaseRotation = useRef({ x: 0, y: 0 })
  const denyStartedAt = useRef(0)

  const updateRotation = useCallback(() => {
    if (!containerRef.current || isDenyMode.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const dx = mouseRef.current.x - centerX
    const dy = mouseRef.current.y - centerY

    const nx = Math.max(-1, Math.min(1, dx / (rect.width * TRACK_SCALE)))
    const ny = Math.max(-1, Math.min(1, dy / (rect.height * TRACK_SCALE)))

    const targetX = ny * -HEAD_TRACK_Y
    const targetY = nx * HEAD_TRACK_X

    currentRotation.current.x += (targetX - currentRotation.current.x) * HEAD_TRACK_SMOOTH
    currentRotation.current.y += (targetY - currentRotation.current.y) * HEAD_TRACK_SMOOTH

    const transform = `perspective(1000px) rotateX(${currentRotation.current.x}deg) rotateY(${currentRotation.current.y}deg)`
    containerRef.current.style.transform = transform
  }, [])

  const updateDeny = useCallback(() => {
    if (!containerRef.current || !isDenyMode.current) return

    const elapsed = (performance.now() - denyStartedAt.current) / 1000
    const sway = Math.sin(elapsed * SWAY_SPEED * Math.PI * 2) * SWAY_YAW_DEG
    const yaw = denyBaseRotation.current.y + sway
    const pitch = denyBaseRotation.current.x

    containerRef.current.style.transform = `perspective(1000px) rotateX(${pitch}deg) rotateY(${yaw}deg)`
  }, [])

  const setDenyMode = useCallback((active: boolean) => {
    if (!containerRef.current) return

    if (active) {
      isDenyMode.current = true
      denyBaseRotation.current = { ...currentRotation.current }
      denyStartedAt.current = performance.now()
      return
    }

    isDenyMode.current = false
    containerRef.current.style.transform = `perspective(1000px) rotateX(${currentRotation.current.x}deg) rotateY(${currentRotation.current.y}deg)`
  }, [])

  useEffect(() => {
    mouseRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }

    const handleLogoutHover = (event: Event) => {
      const active = (event as CustomEvent<{ active?: boolean }>).detail?.active ?? false
      setDenyMode(active)
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true })
    window.addEventListener(LOGOUT_HOVER_EVENT, handleLogoutHover)

    const tick = () => {
      if (isDenyMode.current) {
        updateDeny()
      } else {
        updateRotation()
      }
      rafId.current = requestAnimationFrame(tick)
    }
    rafId.current = requestAnimationFrame(tick)

    const timer = setTimeout(() => setVisible(true), 600)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener(LOGOUT_HOVER_EVENT, handleLogoutHover)
      cancelAnimationFrame(rafId.current)
      clearTimeout(timer)
    }
  }, [setDenyMode, updateDeny, updateRotation])

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
          transformOrigin: `50% ${HEAD_ORIGIN_Y}% 0`,
        }}
      >
        <SplineScene scene={ROBOT_SCENE} className="w-full h-full" />
      </div>
    </div>
  )
}
