"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import {
  ArrowLeft,
  Phone,
  CalendarClock,
  Wallet,
  MapPin,
  Home,
  Building2,
  TrendingUp,
  BedDouble,
  Gift,
  CalendarDays,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddPropertyCard, PropertyCard3D, type Property } from "@/components/property-card-3d"
import { Card3DBorder } from "@/components/card-3d-border"

const Title3D = dynamic(() => import("@/components/title-3d").then((m) => m.Title3D), {
  ssr: false,
  loading: () => <div className="size-full" />,
})

const properties: Property[] = [
  {
    id: 1,
    image: "/pisos/piso-1.png",
    title: "Ático luminoso con terraza",
    zone: "Eixample, Barcelona",
    price: "1.450 €/mes",
    rooms: 2,
    size: "78 m²",
    match: 96,
  },
  {
    id: 2,
    image: "/pisos/piso-2.png",
    title: "Piso con ladrillo visto",
    zone: "Gràcia, Barcelona",
    price: "1.380 €/mes",
    rooms: 2,
    size: "65 m²",
    match: 91,
  },
  {
    id: 3,
    image: "/pisos/piso-3.png",
    title: "Vivienda con balcón al atardecer",
    zone: "Sant Martí, Barcelona",
    price: "1.500 €/mes",
    rooms: 2,
    size: "72 m²",
    match: 88,
  },
  {
    id: 4,
    image: "/pisos/piso-4.png",
    title: "Dormitorio amplio y soleado",
    zone: "Poblenou, Barcelona",
    price: "1.290 €/mes",
    rooms: 2,
    size: "61 m²",
    match: 84,
  },
]

const profiles = [
  {
    id: "P1",
    label: "Titular",
    name: "Pia Maya",
    relation: "Solicitante principal · España",
    income: "5.000 €",
  },
  {
    id: "P2",
    label: "Cónyuge",
    name: "Lucas Bernard",
    relation: "Co-titular · Francia",
    income: "5.000 €",
  },
  {
    id: "P3",
    label: "Aval",
    name: "Sin asignar",
    relation: "Garante adicional",
    income: "—",
  },
]

const filters = ["Largo plazo", "Temporada", "Indiferente"] as const

export default function Page() {
  const [mode, setMode] = useState<"venta" | "alquiler">("alquiler")
  const [activeProfile, setActiveProfile] = useState("P1")
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("Largo plazo")

  const current = profiles.find((p) => p.id === activeProfile) ?? profiles[0]

  return (
    <main className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="size-4" />
            Volver a clientes
          </button>
          <div className="animated-border rounded-full p-[2px] shadow-[0_4px_14px_-4px_rgba(120,60,20,0.35)]">
            <h1 className="rounded-full bg-card px-5 py-1.5 font-heading text-base font-bold tracking-wide text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-2px_3px_rgba(120,60,20,0.12)] sm:text-lg">
              Ficha Cliente
            </h1>
          </div>
          <div className="flex items-center rounded-full bg-secondary p-1 text-sm">
            {(["venta", "alquiler"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-full px-3 py-1 font-medium capitalize transition-colors ${
                  mode === m
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        {/* 3D title in the center */}
        <div className="relative mx-auto h-36 w-full max-w-4xl sm:h-44">
          <div className="absolute inset-0">
            <Title3D />
          </div>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground drop-shadow-sm sm:text-5xl text-balance">
              Datos · Perfil
            </h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Ficha completa del cliente
            </p>
          </div>
        </div>

        <div className="mt-2 grid gap-6 lg:grid-cols-12 lg:items-start">
          {/* LEFT: two cards in a column */}
          <div className="flex flex-col gap-6 lg:col-span-5">
            {/* Client data card with 3D animated border */}
            <Card3DBorder>
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
                      PM
                    </div>
                    <div>
                      <h2 className="font-heading text-2xl font-bold text-card-foreground">Pia Maya</h2>
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <span className="text-base leading-none">🇫🇷</span>
                        Francia · +33 685 342 823
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                    Activo
                  </span>
                </div>

                <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <DataItem icon={CalendarClock} label="Última gestión" value="22 / Sept" />
                  <DataItem icon={Wallet} label="Presupuesto" value="1.500 €" />
                  <DataItem icon={MapPin} label="Zona" value="2h Diputación" />
                  <DataItem icon={Phone} label="Contacto" value="WhatsApp" />
                  <DataItem
                    icon={Home}
                    label="Operación"
                    value={mode === "alquiler" ? "Alquiler" : "Venta"}
                  />
                  <DataItem icon={Building2} label="Pisos vistos" value="4" />
                </dl>

                {/* preference filters */}
                <div className="mt-6 border-t border-border pt-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Preferencia de estancia
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {filters.map((f) => (
                      <button
                        key={f}
                        onClick={() => setActiveFilter(f)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                          activeFilter === f
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card3DBorder>

            {/* Profile card */}
            <div className="rounded-3xl bg-card p-6 ring-1 ring-border">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="font-heading text-lg font-bold text-card-foreground">Perfil financiero</h3>
                <div className="flex items-center gap-1 rounded-full bg-secondary p-1">
                  {profiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setActiveProfile(p.id)}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                        activeProfile === p.id
                          ? "bg-primary text-primary-foreground shadow"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {p.id}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-5">
                <div className="rounded-2xl bg-secondary/50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {current.label}
                  </p>
                  <p className="mt-1 font-heading text-xl font-bold text-card-foreground">
                    {current.name}
                  </p>
                  <p className="text-sm text-muted-foreground">{current.relation}</p>
                  <p className="mt-4 text-sm text-muted-foreground">Ingresos del perfil</p>
                  <p className="font-heading text-2xl font-bold text-primary">{current.income}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <Stat icon={CalendarDays} label="Entrada vivienda" value="1 Julio 2026" />
                  <Stat icon={TrendingUp} label="Ingresos totales" value="10.000 €" />
                  <Stat icon={Wallet} label="Presupuesto máx." value="2.500 €" highlight />
                  <Stat icon={BedDouble} label="Habitaciones mín." value="2" />
                  <Stat icon={Gift} label="Bono / Ayuda" value="Sí · D. BCN" />
                  <Stat icon={Home} label="Tipo contrato" value={activeFilter} />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: suggested properties */}
          <section className="lg:col-span-7">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-heading text-lg font-bold text-foreground">Pisos sugeridos</h3>
              <Button variant="outline" size="sm">
                Enviar sugerencias
              </Button>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {properties.map((p) => (
                <PropertyCard3D key={p.id} property={p} />
              ))}
              <AddPropertyCard />
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

function DataItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl bg-secondary/50 p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </p>
      <p className="mt-1 font-semibold text-card-foreground">{value}</p>
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ElementType
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="rounded-2xl bg-secondary/40 p-4">
      <span
        className={`flex size-9 items-center justify-center rounded-lg ${
          highlight ? "bg-primary text-primary-foreground" : "bg-card text-primary ring-1 ring-border"
        }`}
      >
        <Icon className="size-5" />
      </span>
      <p className="mt-3 text-xs text-muted-foreground">{label}</p>
      <p className="font-heading text-lg font-bold text-card-foreground">{value}</p>
    </div>
  )
}
