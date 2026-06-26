'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CalendarCheck,
  Clock,
  Home,
  MessageCircle,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { ChartCard } from '@/components/dashboard/ChartCard';
import {
  BUDGET_DISTRIBUTION,
  DASHBOARD_KPIS,
  ESTADO_CONTACTO,
  FUNNEL_ALQUILER,
  FUNNEL_VENTA,
  HABITACIONES_DEMAND,
  INMUEBLE_STATUS,
  INMUEBLES_BY_BARRIO,
  LEAD_SOURCE,
  LEADS_OVER_TIME,
  PRICE_DISTRIBUTION,
  RECENT_CLIENTES,
  TIPO_OPERACION_SPLIT,
  TOP_INMUEBLES,
  WHATSAPP_ACTIVITY,
  WORKER_WORKLOAD,
  ZONA_DEMAND,
} from '@/data/dashboard-analytics-fake';

const KPI_ICONS = [
  Users,
  Home,
  Building2,
  CalendarCheck,
  TrendingUp,
  UserPlus,
  Clock,
  MessageCircle,
] as const;

const KPI_COLORS = [
  'bg-blue-500',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-green-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-indigo-500',
] as const;

const tooltipStyle = {
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  fontSize: '13px',
};

function formatTooltipValue(value: number | string | undefined) {
  if (typeof value === 'number') {
    return value.toLocaleString('es-ES');
  }
  return value ?? '';
}

export function DashboardAnalyticsPanel() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
          Panel principal
        </h1>
        <p className="mt-1 text-slate-500">
          Resumen analítico de tu gestión inmobiliaria
          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            Datos de demostración
          </span>
        </p>
      </header>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        {DASHBOARD_KPIS.map((kpi, i) => {
          const Icon = KPI_ICONS[i];
          const color = KPI_COLORS[i];
          return (
            <div
              key={kpi.label}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-500 sm:text-sm">
                    {kpi.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {kpi.value}
                  </p>
                  <div className="mt-1 flex items-center gap-1">
                    {kpi.deltaPositive ? (
                      <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5 text-rose-600" />
                    )}
                    <span
                      className={`text-xs font-medium ${kpi.deltaPositive ? 'text-emerald-600' : 'text-rose-600'}`}
                    >
                      {kpi.delta}
                    </span>
                    <span className="truncate text-xs text-slate-400">
                      {kpi.subtitle}
                    </span>
                  </div>
                </div>
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color} text-white`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Row: leads over time + tipo operacion */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard
          title="Leads en el tiempo"
          description="Nuevos contactos por mes (venta vs alquiler)"
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={LEADS_OVER_TIME}>
              <defs>
                <linearGradient id="ventaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="alquilerGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Area
                type="monotone"
                dataKey="venta"
                name="Venta"
                stroke="#6366f1"
                fill="url(#ventaGrad)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="alquiler"
                name="Alquiler"
                stroke="#10b981"
                fill="url(#alquilerGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Venta vs Alquiler"
          description="Distribución de clientes por operación"
        >
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={TIPO_OPERACION_SPLIT}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={3}
              >
                {TIPO_OPERACION_SPLIT.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => formatTooltipValue(value as number)}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Funnels */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Embudo de gestión — Venta"
          description="Estado del pipeline comercial de venta"
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={FUNNEL_VENTA} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis
                type="category"
                dataKey="estado"
                width={130}
                tick={{ fontSize: 10 }}
                stroke="#94a3b8"
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" name="Clientes" radius={[0, 4, 4, 0]}>
                {FUNNEL_VENTA.map((entry) => (
                  <Cell key={entry.estado} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Embudo de gestión — Alquiler"
          description="Estado del pipeline de alquiler"
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={FUNNEL_ALQUILER}
              layout="vertical"
              margin={{ left: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis
                type="category"
                dataKey="estado"
                width={130}
                tick={{ fontSize: 10 }}
                stroke="#94a3b8"
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" name="Clientes" radius={[0, 4, 4, 0]}>
                {FUNNEL_ALQUILER.map((entry) => (
                  <Cell key={entry.estado} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Demand intelligence */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Distribución de presupuestos"
          description="Demanda de compradores por rango (venta)"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={BUDGET_DISTRIBUTION}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="rango" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar
                dataKey="count"
                name="Leads"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Demanda por zona"
          description="Barrios más buscados por los clientes"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ZONA_DEMAND} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis
                type="category"
                dataKey="zona"
                width={80}
                tick={{ fontSize: 11 }}
                stroke="#94a3b8"
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar
                dataKey="count"
                name="Leads"
                fill="#0ea5e9"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top inmuebles + sources + contacto */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard
          title="Top inmuebles por interés"
          description="Anuncios con más leads vinculados"
          className="lg:col-span-1"
        >
          <ul className="divide-y divide-slate-100">
            {TOP_INMUEBLES.map((item, i) => (
              <li
                key={item.ref}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {item.ref}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {item.direccion}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-0.5 text-sm font-semibold text-indigo-700">
                  {item.leads}
                </span>
              </li>
            ))}
          </ul>
        </ChartCard>

        <ChartCard title="Origen de leads" description="Canal de captación">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={LEAD_SOURCE}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
              >
                {LEAD_SOURCE.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Estado de contacto"
          description="Resultado del primer contacto"
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ESTADO_CONTACTO}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar
                dataKey="value"
                name="Clientes"
                fill="#8b5cf6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Team + WhatsApp */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Carga por asesor"
          description="Clientes asignados y visitas concertadas"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={WORKER_WORKLOAD}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="nombre" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Bar
                dataKey="clientes"
                name="Clientes"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="visitas"
                name="Visitas"
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Actividad WhatsApp"
          description="Mensajes entrantes vs salientes (última semana)"
        >
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={WHATSAPP_ACTIVITY}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="dia" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Line
                type="monotone"
                dataKey="entrantes"
                name="Entrantes"
                stroke="#25d366"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="salientes"
                name="Salientes"
                stroke="#64748b"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Inventory */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard
          title="Precios del inventario"
          description="Distribución por rango (venta y alquiler)"
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={PRICE_DISTRIBUTION}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="rango" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Bar dataKey="venta" name="Venta" fill="#6366f1" />
              <Bar dataKey="alquiler" name="Alquiler" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Inmuebles por barrio"
          description="Stock activo por zona"
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={INMUEBLES_BY_BARRIO} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis
                type="category"
                dataKey="barrio"
                width={72}
                tick={{ fontSize: 11 }}
                stroke="#94a3b8"
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar
                dataKey="count"
                name="Inmuebles"
                fill="#f59e0b"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Demanda por habitaciones"
          description="Preferencia de tamaño (venta)"
        >
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={HABITACIONES_DEMAND}
                dataKey="count"
                nameKey="hab"
                cx="50%"
                cy="50%"
                outerRadius={75}
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {HABITACIONES_DEMAND.map((_, i) => (
                  <Cell
                    key={i}
                    fill={['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd'][i]}
                  />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Status + recent */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Estado BCN del inventario"
          description="I / P / I-M en casas activas"
        >
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={INMUEBLE_STATUS}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
              >
                {INMUEBLE_STATUS.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Últimos clientes"
          description="Contactos recientes (demostración)"
        >
          <ul className="divide-y divide-slate-100">
            {RECENT_CLIENTES.map((cliente) => (
              <li
                key={cliente.nombre}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">
                    {cliente.nombre}
                  </p>
                  <p className="truncate text-sm text-slate-500">
                    {cliente.zona} · {cliente.presupuesto}
                  </p>
                </div>
                <span className="shrink-0 text-sm text-slate-400">
                  {cliente.fecha}
                </span>
              </li>
            ))}
          </ul>
        </ChartCard>
      </div>
    </div>
  );
}
