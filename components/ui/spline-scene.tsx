"use client"

import { useEffect, useRef, useState } from "react"
import { Application } from "@splinetool/runtime"

interface SplineSceneProps {
  scene: string
  className?: string
  onLoad?: (app: Application) => void
}

export function SplineScene({ scene, className, onLoad }: SplineSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const appRef = useRef<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let disposed = false

    const setup = async () => {
      if (!canvasRef.current) return

      try {
        const app = new Application(canvasRef.current, {
          renderMode: "continuous",
        })

        appRef.current = app
        await app.load(scene)

        if (disposed) {
          app.dispose()
          return
        }

        setLoading(false)
        setError(false)
        onLoad?.(app)
      } catch {
        if (disposed) return
        setLoading(false)
        setError(true)
      }
    }

    setLoading(true)
    setError(false)
    setup()

    return () => {
      disposed = true
      appRef.current?.dispose()
      appRef.current = null
    }
  }, [scene, onLoad])

  return (
    <div className={`relative ${className ?? ""}`}>
      <canvas ref={canvasRef} className="block h-full w-full" />
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/5">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      ) : null}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg border border-border bg-card/80 px-6 text-center text-sm text-muted-foreground backdrop-blur">
          Robot scene failed to load
        </div>
      ) : null}
    </div>
  )
}
