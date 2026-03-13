"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import type { Application } from "@splinetool/runtime"
import { SplineScene } from "@/components/ui/spline-scene"

export const LOGOUT_HOVER_EVENT = "robot:logout-hover"
export const LOGOUT_CLICK_EVENT = "robot:logout-click"

const ROBOT_SCENE = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"

const HEAD_TRACK_X = 36
const HEAD_TRACK_Y = 22
const HEAD_TRACK_SPEED = 0.2
const BODY_TRACK_FACTOR = 0.02
const CENTER_DEADZONE = 0.02
const HEAD_ANCHOR_Y_RATIO = 0.15
const NOD_DURATION_MS = 900

const EYE_RED_FILTER = "sepia(1) hue-rotate(300deg) saturate(6) brightness(1.1)"

const SPLINE_HEAD_NAMES = ["Head", "head", "Robot", "Character", "Avatar"]

type SplineHeadObject = { rotation: { x: number; y: number; z: number } }
type RobotMode = "idle" | "logout"
type GlobalPointerState = { x: number; y: number }

declare global {
  interface Window {
    __observerRobotPointer?: GlobalPointerState
    __observerRobotPointerReady?: boolean
  }
}

function ensureGlobalPointerState(): GlobalPointerState {
  if (!window.__observerRobotPointer) {
    window.__observerRobotPointer = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    }
  }

  if (!window.__observerRobotPointerReady) {
    const update = (e: MouseEvent | PointerEvent) => {
      if (!window.__observerRobotPointer) return
      window.__observerRobotPointer.x = e.clientX
      window.__observerRobotPointer.y = e.clientY
    }

    window.addEventListener("mousemove", update, { passive: true })
    window.addEventListener("pointermove", update, { passive: true })
    window.__observerRobotPointerReady = true
  }

  return window.__observerRobotPointer
}

export function ObserverRobot() {
  const robotRef = useRef<HTMLDivElement>(null)
  const splineAppRef = useRef<Application | null>(null)
  const splineHeadRef = useRef<SplineHeadObject | null>(null)
  const pointerStateRef = useRef<GlobalPointerState | null>(null)

  const [visible, setVisible] = useState(false)
  const [isAlertRed, setIsAlertRed] = useState(false)

  const currentRotation = useRef({ x: 0, y: 0 })
  const rafId = useRef<number>(0)
  const robotModeRef = useRef<RobotMode>("idle")
  const nodStartAtRef = useRef<number>(0)
  const baseRotationXRef = useRef<number>(0)
  const baseRotationYRef = useRef<number>(0)
  const headNeutralRadRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  const resolveSplineHead = useCallback((app: Application) => {
    try {
      for (const name of SPLINE_HEAD_NAMES) {
        const obj = app.findObjectByName(name)
        if (obj?.rotation) {
          splineHeadRef.current = obj as SplineHeadObject
          headNeutralRadRef.current = {
            x: splineHeadRef.current.rotation.x,
            y: splineHeadRef.current.rotation.y,
          }
          return
        }
      }
      const all = app.getAllObjects?.()
      if (Array.isArray(all)) {
        const head = all.find((o) => o?.rotation && /head|robot|character/i.test(String(o.name)))
        if (head?.rotation) {
          splineHeadRef.current = head as SplineHeadObject
          headNeutralRadRef.current = {
            x: splineHeadRef.current.rotation.x,
            y: splineHeadRef.current.rotation.y,
          }
        }
      }
    } catch {
      splineHeadRef.current = null
    }
  }, [])

  const handleSplineLoad = useCallback((app: Application) => {
    splineAppRef.current = app
    resolveSplineHead(app)
  }, [resolveSplineHead])

  const applyRotation = useCallback((pitchDeg: number, yawDeg: number) => {
    if (robotRef.current) {
      const bodyPitch = pitchDeg * BODY_TRACK_FACTOR
      const bodyYaw = yawDeg * BODY_TRACK_FACTOR
      robotRef.current.style.transform = `perspective(900px) rotateX(${bodyPitch}deg) rotateY(${bodyYaw}deg)`
    }

    if (!splineHeadRef.current && splineAppRef.current) {
      resolveSplineHead(splineAppRef.current)
    }

    const head = splineHeadRef.current
    if (head?.rotation) {
      head.rotation.x = headNeutralRadRef.current.x + (pitchDeg * Math.PI) / 180
      head.rotation.y = headNeutralRadRef.current.y + (yawDeg * Math.PI) / 180
    }
  }, [resolveSplineHead])

  const applyHeadTracking = useCallback(() => {
    if (robotModeRef.current !== "idle") return
    if (!pointerStateRef.current) return
    if (!robotRef.current) return

    const rect = robotRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height * HEAD_ANCHOR_Y_RATIO

    const dx = pointerStateRef.current.x - centerX
    const dy = pointerStateRef.current.y - centerY

    const nxRaw = Math.max(-1, Math.min(1, dx / (rect.width / 2)))
    const nyRaw = Math.max(-1, Math.min(1, dy / (rect.height / 2)))
    const nx = Math.abs(nxRaw) < CENTER_DEADZONE ? 0 : nxRaw
    const ny = Math.abs(nyRaw) < CENTER_DEADZONE ? 0 : nyRaw

    const targetX = ny * HEAD_TRACK_Y
    const targetY = nx * HEAD_TRACK_X

    currentRotation.current.x += (targetX - currentRotation.current.x) * HEAD_TRACK_SPEED
    currentRotation.current.y += (targetY - currentRotation.current.y) * HEAD_TRACK_SPEED

    applyRotation(currentRotation.current.x, currentRotation.current.y)
  }, [applyRotation])

  const applyLogoutNod = useCallback(() => {
    if (robotModeRef.current !== "logout") return
    const elapsed = performance.now() - nodStartAtRef.current
    const t = Math.min(1, elapsed / NOD_DURATION_MS)
    const eased = Math.sin(Math.PI * t)
    const pitch = baseRotationXRef.current + eased * 18
    const yaw = baseRotationYRef.current

    applyRotation(pitch, yaw)

    if (t >= 1) {
      robotModeRef.current = "idle"
      applyRotation(baseRotationXRef.current, baseRotationYRef.current)
    }
  }, [applyRotation])

  const tick = useCallback(() => {
    if (robotModeRef.current === "logout") {
      applyLogoutNod()
    } else {
      applyHeadTracking()
    }
    rafId.current = requestAnimationFrame(tick)
  }, [applyHeadTracking, applyLogoutNod])

  const startLogout = useCallback(() => {
    setIsAlertRed(false)
    robotModeRef.current = "logout"
    nodStartAtRef.current = performance.now()
    baseRotationXRef.current = currentRotation.current.x
    baseRotationYRef.current = currentRotation.current.y
  }, [])

  useEffect(() => {
    pointerStateRef.current = ensureGlobalPointerState()
    robotModeRef.current = "idle"
    currentRotation.current = { x: 0, y: 0 }
    rafId.current = requestAnimationFrame(tick)

    const timer = setTimeout(() => setVisible(true), 600)

    const onLogoutHover = (e: Event) => {
      const active = (e as CustomEvent<{ active?: boolean }>).detail?.active ?? false
      setIsAlertRed(active)
    }

    const onLogoutClick = () => {
      if (robotModeRef.current === "logout") return
      startLogout()
    }

    window.addEventListener(LOGOUT_HOVER_EVENT, onLogoutHover)
    window.addEventListener(LOGOUT_CLICK_EVENT, onLogoutClick)

    return () => {
      window.removeEventListener(LOGOUT_HOVER_EVENT, onLogoutHover)
      window.removeEventListener(LOGOUT_CLICK_EVENT, onLogoutClick)
      cancelAnimationFrame(rafId.current)
      clearTimeout(timer)
    }
  }, [startLogout, tick])

  useEffect(() => {
    if (!robotRef.current) return
    robotRef.current.style.filter = isAlertRed ? EYE_RED_FILTER : "none"
  }, [isAlertRed])

  return (
    <div
      className="fixed z-0 pointer-events-none hidden md:block"
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
        className="pointer-events-none absolute rounded-full blur-xl transition-all duration-500"
        style={{
          background: isAlertRed
            ? "radial-gradient(circle, rgba(220,30,30,0.22) 0%, rgba(200,0,0,0.06) 55%, transparent 80%)"
            : "radial-gradient(circle, rgba(240,240,240,0.06) 0%, rgba(220,220,220,0.02) 55%, transparent 80%)",
          width: isAlertRed ? 380 : 300,
          height: isAlertRed ? 380 : 300,
          left: "50%",
          top: "38%",
          transform: "translate(-50%, -50%)",
        }}
      />

      <div
        ref={robotRef}
        className="relative w-full h-full"
        style={{
          willChange: "transform, filter",
          transformOrigin: "50% 26% 0",
        }}
      >
        <SplineScene scene={ROBOT_SCENE} className="w-full h-full" onLoad={handleSplineLoad} />
      </div>
    </div>
  )
}
