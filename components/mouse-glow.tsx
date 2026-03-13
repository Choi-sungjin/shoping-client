'use client'
import { useEffect, useRef } from 'react'

export default function MouseGlow() {
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!glowRef.current) return
      const size = 200
      glowRef.current.style.left = `${e.clientX - size / 2}px`
      glowRef.current.style.top = `${e.clientY - size / 2}px`
      glowRef.current.style.opacity = '1'
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed rounded-full blur-xl transition-opacity duration-200 opacity-0"
      style={{
        width: '200px',
        height: '200px',
        background: 'radial-gradient(circle at center, rgba(255,255,255,0.15), transparent 80%)',
        zIndex: 9999,
      }}
    />
  )
}
