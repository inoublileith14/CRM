'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { KeyRound, Home } from 'lucide-react';
import type { GestionFunnelRow } from '@/lib/worker-analytics';

const tooltipStyle = {
  borderRadius: '10px',
  border: '1px solid #e2e8f0',
  fontSize: '13px',
  boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
};

type WorkerGestionSectionProps = {
  clientesAlquiler: number;
  clientesVenta: number;
  gestionLinksAlquiler: number;
  gestionLinksVenta: number;
  funnelAlquiler: GestionFunnelRow[];
  funnelVenta: GestionFunnelRow[];
  gestionPieAlquiler: { name: string; value: number; fill: string }[];
  gestionPieVenta: { name: string; value: number; fill: string }[];
};

export function WorkerGestionSection({
  clientesAlquiler,
  clientesVenta,
  gestionLinksAlquiler,
  gestionLinksVenta,
  funnelAlquiler,
  funnelVenta,
  gestionPieAlquiler,
  gestionPieVenta,
}: WorkerGestionSectionProps) {
  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-4 sm:px-5">
        <h2 className="text-base font-semibold text-emerald-900">
          Estados GESTIÓN
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-emerald-800/90">
          Son los mismos valores del desplegable{' '}
          <span className="font-semibold">GESTIÓN</span> en las tablas de
          clientes por inmueble (NO GESTIONANDO, GESTIONANDO, VISITA
          CONCERTADA…). Alquiler y venta tienen listas distintas; aquí van
          separadas.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {clientesAlquiler > 0 ? (
          <GestionTipoPanel
            tipo="alquiler"
            icon={KeyRound}
            accent="emerald"
            clientesCount={clientesAlquiler}
            linksCount={gestionLinksAlquiler}
            funnel={funnelAlquiler}
            pie={gestionPieAlquiler}
          />
        ) : null}

        {clientesVenta > 0 ? (
          <GestionTipoPanel
            tipo="venta"
            icon={Home}
            accent="indigo"
            clientesCount={clientesVenta}
            linksCount={gestionLinksVenta}
            funnel={funnelVenta}
            pie={gestionPieVenta}
          />
        ) : null}
      </div>
    </section>
  );
}

function GestionTipoPanel({
  tipo,
  icon: Icon,
  accent,
  clientesCount,
  linksCount,
  funnel,
  pie,
}: {
  tipo: 'alquiler' | 'venta';
  icon: typeof KeyRound;
  accent: 'emerald' | 'indigo';
  clientesCount: number;
  linksCount: number;
  funnel: GestionFunnelRow[];
  pie: { name: string; value: number; fill: string }[];
}) {
  const title = tipo === 'alquiler' ? 'Gestión — Alquiler' : 'Gestión — Venta';
  const accentRing =
    accent === 'emerald' ? 'ring-emerald-600/20' : 'ring-indigo-600/20';
  const accentBg = accent === 'emerald' ? 'bg-emerald-600' : 'bg-indigo-600';
  const chartHeight = Math.max(300, funnel.length * 34);

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ${accentRing}`}
    >
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accentBg} text-white`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="mt-0.5 text-sm text-slate-500">
              {clientesCount} cliente{clientesCount !== 1 ? 's' : ''} ·{' '}
              {linksCount} inmueble{linksCount !== 1 ? 's' : ''} en seguimiento
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-5">
        <div className="border-b border-slate-100 p-4 lg:col-span-2 lg:border-b-0 lg:border-r">
          {pie.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pie}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={78}
                  paddingAngle={2}
                >
                  {pie.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} stroke="#fff" />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="flex h-[220px] items-center justify-center px-4 text-center text-sm text-slate-500">
              Todos en NO GESTIONANDO / NO GESTIONADO
            </p>
          )}
          <GestionLegend rows={funnel} />
        </div>

        <div className="p-4 lg:col-span-3">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={funnel}
              layout="vertical"
              margin={{ left: 4, right: 16, top: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                stroke="#94a3b8"
              />
              <YAxis
                type="category"
                dataKey="estado"
                width={148}
                tick={{ fontSize: 10 }}
                stroke="#94a3b8"
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [`${value} inmueble(s)`, 'Cantidad']}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={22}>
                {funnel.map((entry) => (
                  <Cell key={entry.value} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function GestionLegend({ rows }: { rows: GestionFunnelRow[] }) {
  return (
    <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto px-1">
      {rows.map((row) => (
        <li
          key={row.value}
          className="flex items-center justify-between gap-2 text-xs"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span
              className="h-3 w-3 shrink-0 rounded-sm ring-1 ring-black/10"
              style={{ backgroundColor: row.fill }}
            />
            <span
              className="truncate font-medium"
              style={{ color: row.count > 0 ? '#0f172a' : '#94a3b8' }}
            >
              {row.estado}
            </span>
          </span>
          <span className="shrink-0 font-semibold tabular-nums text-slate-700">
            {row.count}
          </span>
        </li>
      ))}
    </ul>
  );
}
