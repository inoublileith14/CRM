"use client"

import { useRef, useState } from "react"
import { BedDouble, MapPin, Maximize, Plus } from "lucide-react"

export type Property = {
  id: number
  image: string
  title: string
  zone: string
  price: string
  rooms: number
  size: string
  match: number
}

export function PropertyCard3D({ property }: { property: Property }) {
  const ref = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState("")
  const [glow, setGlow] = useState({ x: 50, y: 50 })

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    const rotateY = (px - 0.5) * 16
    const rotateX = (0.5 - py) * 16
    setTransform(
      `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(14px)`,
    )
    setGlow({ x: px * 100, y: py * 100 })
  }

  function reset() {
    setTransform("perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)")
  }

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      className="group relative rounded-2xl bg-card shadow-sm ring-1 ring-border transition-shadow duration-300 hover:shadow-xl"
      style={{ transform, transformStyle: "preserve-3d", transition: "transform 0.15s ease-out" }}
    >
      <div className="relative overflow-hidden rounded-t-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={property.image || "/placeholder.svg"}
          alt={property.title}
          className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle at ${glow.x}% ${glow.y}%, color-mix(in oklch, var(--accent) 55%, transparent), transparent 60%)`,
          }}
        />
        <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow">
          {property.match}% match
        </span>
        <span className="absolute right-3 bottom-3 rounded-lg bg-card/90 px-2.5 py-1 text-sm font-bold text-foreground backdrop-blur">
          {property.price}
        </span>
      </div>

      <div className="space-y-2 p-4" style={{ transform: "translateZ(28px)" }}>
        <h4 className="font-heading font-semibold leading-tight text-card-foreground text-pretty">
          {property.title}
        </h4>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-3.5" />
          {property.zone}
        </p>
        <div className="flex items-center gap-4 pt-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <BedDouble className="size-4" />
            {property.rooms} hab.
          </span>
          <span className="flex items-center gap-1">
            <Maximize className="size-4" />
            {property.size}
          </span>
        </div>
      </div>
    </div>
  )
}

export function AddPropertyCard() {
  return (
    <button
      type="button"
      className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-secondary/40 text-muted-foreground transition-colors hover:border-primary hover:bg-secondary hover:text-primary"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border">
        <Plus className="size-6" />
      </span>
      <span className="text-sm font-medium">Añadir sugerencia</span>
    </button>
  )
}
