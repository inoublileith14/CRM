import {
  CLIENTE_GESTION_ESTADO_OPTIONS_ALQUILER,
  CLIENTE_GESTION_ESTADO_OPTIONS_VENTA,
  getClienteGestionEstadoOption,
  getDefaultClienteGestionEstado,
  normalizeClienteGestionEstado,
} from '@/lib/cliente-gestion-estado';
import {
  CLIENTE_ORIGEN_LABELS,
  Cliente,
  ClienteOrigen,
} from '@/types/cliente';
import { TIPO_OPERACION_LABELS, TipoOperacion } from '@/types/inmueble';

const MS_PER_DAY = 86_400_000;
const STALE_DAYS = 30;

export type WorkerKpi = {
  label: string;
  value: string;
  hint: string;
  tone: 'blue' | 'violet' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'indigo' | 'slate';
};

export type FunnelRow = {
  estado: string;
  count: number;
  fill: string;
};

export type GestionFunnelRow = FunnelRow & {
  value: string;
  textColor: string;
};

export type WorkerAnalytics = {
  kpis: WorkerKpi[];
  pipelineHealth: {
    label: string;
    percent: number;
    color: string;
  }[];
  activityTimeline: {
    mes: string;
    contactosAlquiler: number;
    contactosVenta: number;
    gestiones: number;
  }[];
  funnelVenta: GestionFunnelRow[];
  funnelAlquiler: GestionFunnelRow[];
  gestionPieVenta: { name: string; value: number; fill: string }[];
  gestionPieAlquiler: { name: string; value: number; fill: string }[];
  clientesAlquiler: number;
  clientesVenta: number;
  gestionLinksAlquiler: number;
  gestionLinksVenta: number;
  tipoOperacion: { name: string; value: number; fill: string }[];
  origenLeads: { name: string; value: number; fill: string }[];
  estadoContacto: { name: string; value: number; fill: string }[];
  ciudadDemand: { zona: string; count: number }[];
  presupuestoVenta: { rango: string; count: number }[];
  presupuestoAlquiler: { rango: string; count: number }[];
  inmueblesVinculados: {
    sinInmueble: number;
    conInmueble: number;
    totalLinks: number;
    mediaPorCliente: number;
  };
  staleClientes: {
    id: string;
    nombre: string;
    diasSinGestion: number;
    tipo: string;
  }[];
  recentClientes: {
    id: string;
    nombre: string;
    subtitulo: string;
    fecha: string;
    badge?: string;
    badgeColor?: string;
  }[];
  conversionRate: number;
  visitasConcertadas: number;
};

const CHART_COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#0ea5e9',
  '#ec4899',
  '#64748b',
] as const;

const WIN_ESTADOS = new Set([
  'ya_compro',
  'ya_encontro_piso',
  'reservado',
]);

const VISITA_ESTADOS = new Set(['visita_concertada']);

const ACTIVE_GESTION = new Set([
  'gestionando',
  'gestionando_w',
  'visita_concertada',
  'pendiente_cuadrar_docs',
  'pendiente_cuadrar_visita',
  'videollamada',
  'reservado',
]);

type GestionLink = {
  clienteId: string;
  tipo: TipoOperacion | null;
  estado: string;
};

function countBy<T extends string>(
  items: Cliente[],
  getKey: (cliente: Cliente) => T | null | undefined,
): Map<T, number> {
  const counts = new Map<T, number>();
  for (const item of items) {
    const key = getKey(item);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function toChartEntries<K extends string>(
  counts: Map<K, number>,
  labelFor: (key: K) => string,
): { name: string; value: number; fill: string }[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, value], index) => ({
      name: labelFor(key),
      value,
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }));
}

function flattenGestionLinks(clientes: Cliente[]): GestionLink[] {
  const links: GestionLink[] = [];
  for (const cliente of clientes) {
    const tipo = cliente.tipo_operacion;
    if (!tipo) continue;

    const rawLinks = cliente.inmueble_gestion_links ?? [];
    const defaultEstado = getDefaultClienteGestionEstado(tipo);

    if (rawLinks.length === 0) {
      const estado = cliente.gestion_estado
        ? normalizeClienteGestionEstado(cliente.gestion_estado, tipo)
        : defaultEstado;
      links.push({ clienteId: cliente.id, tipo, estado });
      continue;
    }

    for (const link of rawLinks) {
      const estado = link.gestion_estado
        ? normalizeClienteGestionEstado(link.gestion_estado, tipo)
        : defaultEstado;
      links.push({ clienteId: cliente.id, tipo, estado });
    }
  }
  return links;
}

function buildFunnel(
  links: GestionLink[],
  tipo: TipoOperacion,
): GestionFunnelRow[] {
  const options =
    tipo === 'alquiler'
      ? CLIENTE_GESTION_ESTADO_OPTIONS_ALQUILER
      : CLIENTE_GESTION_ESTADO_OPTIONS_VENTA;
  const counts = new Map<string, number>();
  for (const link of links) {
    if (link.tipo !== tipo) continue;
    counts.set(link.estado, (counts.get(link.estado) ?? 0) + 1);
  }
  return options.map((option) => ({
    estado: option.label,
    count: counts.get(option.value) ?? 0,
    fill: option.backgroundColor,
    value: option.value,
    textColor: option.textColor,
  }));
}

function funnelToPie(rows: GestionFunnelRow[]) {
  return rows
    .filter((row) => row.count > 0)
    .map((row) => ({
      name: row.estado,
      value: row.count,
      fill: row.fill,
    }));
}

function monthKey(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(key: string): string {
  const [year, month] = key.split('-');
  return new Intl.DateTimeFormat('es-ES', {
    month: 'short',
    year: '2-digit',
  }).format(new Date(Number(year), Number(month) - 1, 1));
}

function buildActivityTimeline(clientes: Cliente[]): WorkerAnalytics['activityTimeline'] {
  const contactos = new Map<string, { alquiler: number; venta: number }>();
  const gestiones = new Map<string, number>();

  for (const cliente of clientes) {
    if (cliente.fecha_contacto) {
      const key = monthKey(cliente.fecha_contacto);
      if (key) {
        const bucket = contactos.get(key) ?? { alquiler: 0, venta: 0 };
        if (cliente.tipo_operacion === 'alquiler') bucket.alquiler += 1;
        else if (cliente.tipo_operacion === 'venta') bucket.venta += 1;
        contactos.set(key, bucket);
      }
    }

    const gestionDates = [
      cliente.fecha_ultima_gestion,
      ...(cliente.inmueble_gestion_links ?? []).map(
        (l) => l.fecha_ultima_gestion,
      ),
    ].filter(Boolean) as string[];

    for (const iso of gestionDates) {
      const key = monthKey(iso);
      if (key) gestiones.set(key, (gestiones.get(key) ?? 0) + 1);
    }
  }

  const keys = new Set([...contactos.keys(), ...gestiones.keys()]);
  return [...keys]
    .sort()
    .slice(-10)
    .map((key) => ({
      mes: formatMonthLabel(key),
      contactosAlquiler: contactos.get(key)?.alquiler ?? 0,
      contactosVenta: contactos.get(key)?.venta ?? 0,
      gestiones: gestiones.get(key) ?? 0,
    }));
}

function parsePresupuestoNumber(value: string | null): number | null {
  if (!value) return null;
  const normalized = value
    .toLowerCase()
    .replace(/\s/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.');
  const match = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  let num = Number(match[1]);
  if (Number.isNaN(num)) return null;
  if (normalized.includes('k') && num < 1000) num *= 1000;
  return num;
}

function bucketVentaPresupuesto(value: number): string {
  if (value < 300_000) return '<300k';
  if (value < 400_000) return '300-400k';
  if (value < 500_000) return '400-500k';
  if (value < 600_000) return '500-600k';
  if (value < 800_000) return '600-800k';
  return '800k+';
}

function bucketAlquilerPresupuesto(value: number): string {
  if (value < 1200) return '<1.200€';
  if (value < 1800) return '1.2-1.8k';
  if (value < 2500) return '1.8-2.5k';
  if (value < 3500) return '2.5-3.5k';
  return '3.5k+';
}

function buildPresupuestoBuckets(
  clientes: Cliente[],
  tipo: TipoOperacion,
): { rango: string; count: number }[] {
  const order =
    tipo === 'venta'
      ? ['<300k', '300-400k', '400-500k', '500-600k', '600-800k', '800k+']
      : ['<1.200€', '1.2-1.8k', '1.8-2.5k', '2.5-3.5k', '3.5k+'];
  const counts = new Map<string, number>();
  for (const cliente of clientes) {
    if (cliente.tipo_operacion !== tipo) continue;
    const num = parsePresupuestoNumber(cliente.presupuesto_maximo);
    if (num === null) continue;
    const bucket =
      tipo === 'venta'
        ? bucketVentaPresupuesto(num)
        : bucketAlquilerPresupuesto(num);
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }
  return order
    .map((rango) => ({ rango, count: counts.get(rango) ?? 0 }))
    .filter((row) => row.count > 0);
}

function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return Math.floor((Date.now() - date.getTime()) / MS_PER_DAY);
}

function avgResponseDays(clientes: Cliente[]): number | null {
  const samples: number[] = [];
  for (const cliente of clientes) {
    if (!cliente.fecha_contacto || !cliente.fecha_ultima_gestion) continue;
    const contact = new Date(cliente.fecha_contacto).getTime();
    const gestion = new Date(cliente.fecha_ultima_gestion).getTime();
    if (Number.isNaN(contact) || Number.isNaN(gestion) || gestion < contact) continue;
    samples.push((gestion - contact) / MS_PER_DAY);
  }
  if (samples.length === 0) return null;
  return samples.reduce((a, b) => a + b, 0) / samples.length;
}

function gestionesLastDays(clientes: Cliente[], days: number): number {
  const cutoff = Date.now() - days * MS_PER_DAY;
  let count = 0;
  for (const cliente of clientes) {
    const dates = [
      cliente.fecha_ultima_gestion,
      ...(cliente.inmueble_gestion_links ?? []).map(
        (l) => l.fecha_ultima_gestion,
      ),
    ].filter(Boolean) as string[];
    if (dates.some((iso) => new Date(iso).getTime() >= cutoff)) {
      count += 1;
    }
  }
  return count;
}

export function buildWorkerAnalytics(clientes: Cliente[]): WorkerAnalytics {
  const total = clientes.length;
  const alquiler = clientes.filter((c) => c.tipo_operacion === 'alquiler').length;
  const venta = clientes.filter((c) => c.tipo_operacion === 'venta').length;

  const gestionLinks = flattenGestionLinks(clientes);
  const gestionLinksAlquiler = gestionLinks.filter((l) => l.tipo === 'alquiler').length;
  const gestionLinksVenta = gestionLinks.filter((l) => l.tipo === 'venta').length;
  const visitasConcertadas = gestionLinks.filter((l) =>
    VISITA_ESTADOS.has(l.estado),
  ).length;
  const wins = gestionLinks.filter((l) => WIN_ESTADOS.has(l.estado)).length;
  const conversionRate =
    gestionLinks.length > 0
      ? Math.round((wins / gestionLinks.length) * 1000) / 10
      : 0;

  const sinInmueble = clientes.filter(
    (c) => (c.inmuebles_count ?? c.inmueble_ids?.length ?? 0) === 0,
  ).length;
  const totalLinks = clientes.reduce(
    (sum, c) => sum + (c.inmuebles_count ?? c.inmueble_ids?.length ?? 0),
    0,
  );
  const conInmueble = total - sinInmueble;
  const mediaPorCliente = total > 0 ? Math.round((totalLinks / total) * 10) / 10 : 0;

  const staleClientes = clientes
    .map((cliente) => {
      const linkDates = (cliente.inmueble_gestion_links ?? [])
        .map((l) => l.fecha_ultima_gestion)
        .filter(Boolean) as string[];
      const lastIso =
        [cliente.fecha_ultima_gestion, ...linkDates, cliente.fecha_contacto]
          .filter(Boolean)
          .sort()
          .pop() ?? null;
      const dias = daysSince(lastIso);
      return { cliente, dias: dias ?? STALE_DAYS + 1 };
    })
    .filter(({ dias }) => dias > STALE_DAYS)
    .sort((a, b) => b.dias - a.dias)
    .slice(0, 8)
    .map(({ cliente, dias }) => ({
      id: cliente.id,
      nombre: cliente.nombre,
      diasSinGestion: dias,
      tipo: cliente.tipo_operacion
        ? TIPO_OPERACION_LABELS[cliente.tipo_operacion]
        : 'Sin tipo',
    }));

  const avgDays = avgResponseDays(clientes);
  const gestion7d = gestionesLastDays(clientes, 7);
  const activePipeline = gestionLinks.filter((l) =>
    ACTIVE_GESTION.has(l.estado),
  ).length;
  const idlePipeline = gestionLinks.length - activePipeline;

  const pipelineHealth = [
    {
      label: 'En gestión activa',
      percent:
        gestionLinks.length > 0
          ? Math.round((activePipeline / gestionLinks.length) * 100)
          : 0,
      color: '#ffc000',
    },
    {
      label: 'Visitas concertadas',
      percent:
        gestionLinks.length > 0
          ? Math.round((visitasConcertadas / gestionLinks.length) * 100)
          : 0,
      color: '#39ff14',
    },
    {
      label: 'Sin gestionar',
      percent:
        gestionLinks.length > 0
          ? Math.round((idlePipeline / gestionLinks.length) * 100)
          : 0,
      color: '#c6e0b4',
    },
    {
      label: 'Con inmueble vinculado',
      percent: total > 0 ? Math.round((conInmueble / total) * 100) : 0,
      color: '#6366f1',
    },
  ];

  const funnelVenta = buildFunnel(gestionLinks, 'venta');
  const funnelAlquiler = buildFunnel(gestionLinks, 'alquiler');

  const estadoContactoRaw = countBy(clientes, (c) => {
    const v = c.estado_contacto?.trim();
    return v ? v : null;
  });
  const estadoContacto = [...estadoContactoRaw.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value], index) => ({
      name,
      value,
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }));

  const ciudadCounts = new Map<string, number>();
  for (const cliente of clientes) {
    const label = cliente.barrio?.trim() || cliente.ciudad?.trim();
    if (!label) continue;
    ciudadCounts.set(label, (ciudadCounts.get(label) ?? 0) + 1);
  }
  const ciudadDemand = [...ciudadCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([zona, count]) => ({ zona, count }));

  const recentClientes = [...clientes]
    .sort((a, b) => {
      const aDate = a.fecha_ultima_gestion ?? a.fecha_contacto ?? a.created_at;
      const bDate = b.fecha_ultima_gestion ?? b.fecha_contacto ?? b.created_at;
      return bDate.localeCompare(aDate);
    })
    .slice(0, 8)
    .map((cliente) => {
      const fechaRaw =
        cliente.fecha_ultima_gestion ??
        cliente.fecha_contacto ??
        cliente.created_at;
      const fecha = fechaRaw
        ? new Intl.DateTimeFormat('es-ES', { dateStyle: 'short' }).format(
            new Date(fechaRaw),
          )
        : '—';
      const tipo = cliente.tipo_operacion
        ? TIPO_OPERACION_LABELS[cliente.tipo_operacion]
        : 'Sin tipo';
      let badge: string | undefined;
      let badgeColor: string | undefined;
      if (cliente.gestion_estado && cliente.tipo_operacion) {
        const option = getClienteGestionEstadoOption(
          cliente.gestion_estado,
          cliente.tipo_operacion,
        );
        badge = option.label;
        badgeColor = option.backgroundColor;
      }
      return {
        id: cliente.id,
        nombre: cliente.nombre,
        subtitulo: badge ? `${tipo} · ${badge}` : tipo,
        fecha,
        badge,
        badgeColor,
      };
    });

  return {
    kpis: [
      {
        label: 'Clientes asignados',
        value: String(total),
        hint: `${alquiler} alquiler · ${venta} venta`,
        tone: 'blue',
      },
      {
        label: 'Visitas concertadas',
        value: String(visitasConcertadas),
        hint: 'En pipeline de gestión',
        tone: 'emerald',
      },
      {
        label: 'Conversión',
        value: `${conversionRate}%`,
        hint: 'Cierre / total gestiones',
        tone: 'violet',
      },
      {
        label: 'Gestiones 7 días',
        value: String(gestion7d),
        hint: 'Clientes con actividad reciente',
        tone: 'cyan',
      },
      {
        label: 'Alquiler',
        value: String(alquiler),
        hint: total > 0 ? `${Math.round((alquiler / total) * 100)}% cartera` : '—',
        tone: 'emerald',
      },
      {
        label: 'Venta',
        value: String(venta),
        hint: total > 0 ? `${Math.round((venta / total) * 100)}% cartera` : '—',
        tone: 'indigo',
      },
      {
        label: 'Inmuebles vinculados',
        value: String(totalLinks),
        hint: `Media ${mediaPorCliente} por cliente`,
        tone: 'amber',
      },
      {
        label: 'Tiempo de respuesta',
        value: avgDays !== null ? `${avgDays.toFixed(1)} d` : '—',
        hint: 'Contacto → primera gestión',
        tone: 'rose',
      },
    ],
    pipelineHealth,
    activityTimeline: buildActivityTimeline(clientes),
    funnelVenta,
    funnelAlquiler,
    gestionPieVenta: funnelToPie(funnelVenta),
    gestionPieAlquiler: funnelToPie(funnelAlquiler),
    clientesAlquiler: alquiler,
    clientesVenta: venta,
    gestionLinksAlquiler,
    gestionLinksVenta,
    tipoOperacion: toChartEntries(
      countBy(clientes, (c) => c.tipo_operacion),
      (key) => TIPO_OPERACION_LABELS[key as TipoOperacion] ?? key,
    ),
    origenLeads: toChartEntries(
      countBy(clientes, (c) => c.origen),
      (key) => CLIENTE_ORIGEN_LABELS[key as ClienteOrigen] ?? key,
    ),
    estadoContacto,
    ciudadDemand,
    presupuestoVenta: buildPresupuestoBuckets(clientes, 'venta'),
    presupuestoAlquiler: buildPresupuestoBuckets(clientes, 'alquiler'),
    inmueblesVinculados: {
      sinInmueble,
      conInmueble,
      totalLinks,
      mediaPorCliente,
    },
    staleClientes,
    recentClientes,
    conversionRate,
    visitasConcertadas,
  };
}
