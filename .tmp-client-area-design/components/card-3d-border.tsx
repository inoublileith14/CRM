"use client"

import { useRef, useState, type ReactNode } from "react"

export function Card3DBorder({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState<string>(
    "perspective(1200px) rotateX(0deg) rotateY(0deg)",
  )

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    setTransform(
      `perspective(1200px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg) scale(1.01)`,
    )
  }

  function handleLeave() {
    setTransform("perspective(1200px) rotateX(0deg) rotateY(0deg)")
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ transform, transition: "transform 0.25s ease-out" }}
      className="relative overflow-hidden rounded-3xl p-[2.5px] shadow-lg shadow-primary/10 will-change-transform"
    >
      {/* rotating 3D-style glowing border */}
      <div className="animated-border absolute inset-[-40%]" aria-hidden />
      {/* soft static ring so the border is always visible */}
      <div className="absolute inset-0 rounded-3xl ring-1 ring-border" aria-hidden />
      <div className="relative rounded-[calc(1.5rem-2.5px)] bg-card">{children}</div>
    </div>
  )
}
