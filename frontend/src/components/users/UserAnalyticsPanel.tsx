'use client';

import Link from 'next/link';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle, Users } from 'lucide-react';
import { ChartCard } from '@/components/dashboard/ChartCard';
import {
  PipelineHealthBar,
  WorkerStatKpiGrid,
} from '@/components/users/WorkerStatKpiGrid';
import { WorkerGestionSection } from '@/components/users/WorkerGestionCharts';
import { buildWorkerAnalytics } from '@/lib/worker-analytics';
import { getUserClientesHref } from '@/lib/user-routes';
import { Cliente } from '@/types/cliente';

const tooltipStyle = {
  borderRadius: '10px',
  border: '1px solid #e2e8f0',
  fontSize: '13px',
  boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
};

function EmptyChart({ message }: { message: string }) {
  return (
    <p className="flex h-[260px] items-center justify-center text-sm text-slate-500">
      {message}
    </p>
  );
}

type UserAnalyticsPanelProps = {
  userId: string;
  userName: string;
  clientes: Cliente[];
};

export function UserAnalyticsPanel({
  userId,
  userName,
  clientes,
}: UserAnalyticsPanelProps) {
  const analytics = buildWorkerAnalytics(clientes);

  if (clientes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <Users className="mx-auto h-12 w-12 text-slate-300" />
        <p className="mt-4 text-lg font-semibold text-slate-800">
          {userName} aún no tiene clientes asignados
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          Cuando se asignen clientes verás embudo comercial, actividad temporal,
          demanda por zona y presupuesto.
        </p>
        <Link
          href={getUserClientesHref(userId)}
          className="mt-6 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          Ver clientes asignados
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <WorkerStatKpiGrid kpis={analytics.kpis} />

      {(analytics.clientesAlquiler > 0 || analytics.clientesVenta > 0) && (
        <WorkerGestionSection
          clientesAlquiler={analytics.clientesAlquiler}
          clientesVenta={analytics.clientesVenta}
          gestionLinksAlquiler={analytics.gestionLinksAlquiler}
          gestionLinksVenta={analytics.gestionLinksVenta}
          funnelAlquiler={analytics.funnelAlquiler}
          funnelVenta={analytics.funnelVenta}
          gestionPieAlquiler={analytics.gestionPieAlquiler}
          gestionPieVenta={analytics.gestionPieVenta}
        />
      )}

      {analytics.activityTimeline.length > 0 && (
        <ChartCard
          title="Actividad en el tiempo"
          description="Nuevos contactos (alquiler vs venta) y gestiones registradas por mes"
          className="overflow-hidden"
        >
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={analytics.activityTimeline}>
              <defs>
                <linearGradient id="alquilerActGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ventaActGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Area
                type="monotone"
                dataKey="contactosAlquiler"
                name="Contactos alquiler"
                stroke="#10b981"
                fill="url(#alquilerActGrad)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="contactosVenta"
                name="Contactos venta"
                stroke="#6366f1"
                fill="url(#ventaActGrad)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="gestiones"
                name="Gestiones"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#f59e0b' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard
          title="Salud del pipeline"
          description="Porcentajes según estados GESTIÓN e inmuebles vinculados"
          className="lg:col-span-1"
        >
          <PipelineHealthBar items={analytics.pipelineHealth} />
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
            <div className="rounded-lg bg-slate-50 p-3 text-center">
              <p className="text-2xl font-bold text-slate-900">
                {analytics.inmueblesVinculados.conInmueble}
              </p>
              <p className="text-xs text-slate-500">Con inmueble</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-center">
              <p className="text-2xl font-bold text-slate-900">
                {analytics.inmueblesVinculados.sinInmueble}
              </p>
              <p className="text-xs text-slate-500">Sin vincular</p>
            </div>
          </div>
        </ChartCard>

        <ChartCard
          title="Venta vs Alquiler"
          description="Composición de la cartera asignada"
          className="lg:col-span-1"
        >
          {analytics.tipoOperacion.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={analytics.tipoOperacion}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={98}
                  paddingAngle={4}
                >
                  {analytics.tipoOperacion.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="Sin tipo de operación definido" />
          )}
        </ChartCard>

        <ChartCard
          title="Origen de leads"
          description="Canales de captación"
          className="lg:col-span-1"
        >
          {analytics.origenLeads.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={analytics.origenLeads}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {analytics.origenLeads.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="Sin datos de origen" />
          )}
        </ChartCard>
      </div>

      {(analytics.ciudadDemand.length > 0 ||
        analytics.estadoContacto.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {analytics.ciudadDemand.length > 0 ? (
            <ChartCard
              title="Demanda por zona"
              description="Ciudades o barrios más buscados"
            >
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={analytics.ciudadDemand} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis
                    type="category"
                    dataKey="zona"
                    width={88}
                    tick={{ fontSize: 11 }}
                    stroke="#94a3b8"
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar
                    dataKey="count"
                    name="Clientes"
                    fill="#0ea5e9"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          ) : null}

          {analytics.estadoContacto.length > 0 ? (
            <ChartCard
              title="Estado de contacto"
              description="Resultado del primer contacto"
            >
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={analytics.estadoContacto}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" name="Clientes" radius={[6, 6, 0, 0]}>
                    {analytics.estadoContacto.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          ) : null}
        </div>
      )}

      {(analytics.presupuestoVenta.length > 0 ||
        analytics.presupuestoAlquiler.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {analytics.presupuestoVenta.length > 0 ? (
            <ChartCard
              title="Presupuesto compradores"
              description="Rangos de presupuesto máximo (venta)"
            >
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={analytics.presupuestoVenta}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="rango" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar
                    dataKey="count"
                    name="Clientes"
                    fill="#6366f1"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          ) : null}

          {analytics.presupuestoAlquiler.length > 0 ? (
            <ChartCard
              title="Presupuesto inquilinos"
              description="Rangos de presupuesto máximo (alquiler)"
            >
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={analytics.presupuestoAlquiler}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="rango" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar
                    dataKey="count"
                    name="Clientes"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          ) : null}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Actividad reciente"
          description="Últimos clientes con gestión o contacto"
        >
          <ul className="divide-y divide-slate-100">
            {analytics.recentClientes.map((cliente) => (
              <li
                key={cliente.id}
                className="flex items-center justify-between gap-3 py-3.5"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/dashboard/clientes/${cliente.id}`}
                    className="truncate font-medium text-slate-900 hover:text-emerald-600"
                  >
                    {cliente.nombre}
                  </Link>
                  <p className="truncate text-sm text-slate-500">
                    {cliente.subtitulo}
                  </p>
                  {cliente.badge ? (
                    <span
                      className="mt-1 inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black"
                      style={{ backgroundColor: cliente.badgeColor }}
                    >
                      {cliente.badge}
                    </span>
                  ) : null}
                </div>
                <span className="shrink-0 text-sm text-slate-400">
                  {cliente.fecha}
                </span>
              </li>
            ))}
          </ul>
        </ChartCard>

        <ChartCard
          title="Requieren seguimiento"
          description="Clientes sin actividad en más de 30 días"
        >
          {analytics.staleClientes.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {analytics.staleClientes.map((cliente) => (
                <li
                  key={cliente.id}
                  className="flex items-center justify-between gap-3 py-3.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/clientes/${cliente.id}`}
                        className="truncate font-medium text-slate-900 hover:text-emerald-600"
                      >
                        {cliente.nombre}
                      </Link>
                      <p className="text-sm text-slate-500">{cliente.tipo}</p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                    {cliente.diasSinGestion}d
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Users className="h-6 w-6" />
              </div>
              <p className="mt-3 font-medium text-slate-700">
                Cartera al día
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Todos los clientes tienen actividad reciente
              </p>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
