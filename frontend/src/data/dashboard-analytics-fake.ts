import {
  CLIENTE_GESTION_ESTADO_OPTIONS_ALQUILER,
  CLIENTE_GESTION_ESTADO_OPTIONS_VENTA,
} from '@/lib/cliente-gestion-estado';

export const DASHBOARD_KPIS = [
  {
    label: 'Clientes totales',
    value: '1.842',
    delta: '+12%',
    deltaPositive: true,
    subtitle: 'vs mes anterior',
  },
  {
    label: 'Inmuebles activos',
    value: '127',
    delta: '+3',
    deltaPositive: true,
    subtitle: 'venta y alquiler',
  },
  {
    label: 'Propietarios',
    value: '89',
    delta: '+2',
    deltaPositive: true,
    subtitle: 'cartera actual',
  },
  {
    label: 'Visitas concertadas',
    value: '34',
    delta: '+8',
    deltaPositive: true,
    subtitle: 'esta semana',
  },
  {
    label: 'Conversión venta',
    value: '4,2%',
    delta: '+0,6%',
    deltaPositive: true,
    subtitle: 'ya compró / total',
  },
  {
    label: 'Leads sin asignar',
    value: '218',
    delta: '-15',
    deltaPositive: true,
    subtitle: 'sin inmueble vinculado',
  },
  {
    label: 'Tiempo medio respuesta',
    value: '1,8 d',
    delta: '-0,4 d',
    deltaPositive: true,
    subtitle: 'contacto → gestión',
  },
  {
    label: 'Mensajes WhatsApp',
    value: '312',
    delta: '+24%',
    deltaPositive: true,
    subtitle: 'últimos 7 días',
  },
] as const;

export const LEADS_OVER_TIME = [
  { mes: 'Oct', venta: 142, alquiler: 68 },
  { mes: 'Nov', venta: 168, alquiler: 74 },
  { mes: 'Dic', venta: 121, alquiler: 52 },
  { mes: 'Ene', venta: 195, alquiler: 81 },
  { mes: 'Feb', venta: 210, alquiler: 88 },
  { mes: 'Mar', venta: 238, alquiler: 95 },
  { mes: 'Abr', venta: 256, alquiler: 102 },
];

export const TIPO_OPERACION_SPLIT = [
  { name: 'Venta', value: 1248, fill: '#6366f1' },
  { name: 'Alquiler', value: 594, fill: '#10b981' },
];

const VENTA_FUNNEL_COUNTS: Record<string, number> = {
  no_gestionado: 412,
  gestionando_w: 286,
  visita_concertada: 98,
  nc: 156,
  pendiente_cuadrar_visita: 64,
  ya_compro: 52,
  perfil_no_encaja: 38,
  videollamada: 22,
};

const ALQUILER_FUNNEL_COUNTS: Record<string, number> = {
  no_gestionando: 198,
  gestionando: 142,
  visita_concertada: 56,
  reservado: 24,
  nc: 48,
  pendiente_cuadrar_docs: 34,
  perfil_no_encaja: 18,
  videollamada: 12,
  ya_encontro_piso: 28,
};

export const FUNNEL_VENTA = CLIENTE_GESTION_ESTADO_OPTIONS_VENTA.map((o) => ({
  estado: o.label,
  count: VENTA_FUNNEL_COUNTS[o.value] ?? 0,
  fill: o.backgroundColor,
}));

export const FUNNEL_ALQUILER = CLIENTE_GESTION_ESTADO_OPTIONS_ALQUILER.map(
  (o) => ({
    estado: o.label,
    count: ALQUILER_FUNNEL_COUNTS[o.value] ?? 0,
    fill: o.backgroundColor,
  }),
);

export const BUDGET_DISTRIBUTION = [
  { rango: '200-300k', count: 186 },
  { rango: '300-400k', count: 312 },
  { rango: '400-500k', count: 278 },
  { rango: '500-600k', count: 194 },
  { rango: '600-800k', count: 142 },
  { rango: '800k+', count: 86 },
];

export const ZONA_DEMAND = [
  { zona: 'Eixample', count: 284 },
  { zona: 'Gràcia', count: 198 },
  { zona: 'Poblenou', count: 156 },
  { zona: 'Sants', count: 124 },
  { zona: 'Sarrià', count: 98 },
  { zona: 'Les Corts', count: 76 },
  { zona: 'Born', count: 68 },
  { zona: 'Otros', count: 142 },
];

export const HABITACIONES_DEMAND = [
  { hab: '1 hab', count: 124 },
  { hab: '2 hab', count: 486 },
  { hab: '3 hab', count: 312 },
  { hab: '4+ hab', count: 98 },
];

export const TOP_INMUEBLES = [
  { ref: 'CLF-042', direccion: 'C/ Mallorca 214', leads: 47 },
  { ref: 'CLF-018', direccion: 'Av. Diagonal 512', leads: 38 },
  { ref: 'CLF-091', direccion: 'C/ Provença 88', leads: 34 },
  { ref: 'CLF-056', direccion: 'Passeig de Gràcia 102', leads: 29 },
  { ref: 'CLF-033', direccion: 'C/ Muntaner 156', leads: 26 },
];

export const LEAD_SOURCE = [
  { name: 'Email (Idealista)', value: 1284, fill: '#3b82f6' },
  { name: 'Llamada', value: 312, fill: '#8b5cf6' },
  { name: 'Otro', value: 246, fill: '#94a3b8' },
];

export const ESTADO_CONTACTO = [
  { name: 'Contestada', value: 892 },
  { name: 'No contestada', value: 624 },
  { name: 'Pendiente', value: 326 },
];

export const WORKER_WORKLOAD = [
  { nombre: 'Laura M.', clientes: 186, visitas: 14 },
  { nombre: 'Carlos R.', clientes: 164, visitas: 11 },
  { nombre: 'Ana P.', clientes: 142, visitas: 9 },
  { nombre: 'Miguel S.', clientes: 128, visitas: 8 },
  { nombre: 'Elena V.', clientes: 98, visitas: 6 },
];

export const WHATSAPP_ACTIVITY = [
  { dia: 'Lun', entrantes: 42, salientes: 38 },
  { dia: 'Mar', entrantes: 56, salientes: 48 },
  { dia: 'Mié', entrantes: 48, salientes: 52 },
  { dia: 'Jue', entrantes: 62, salientes: 58 },
  { dia: 'Vie', entrantes: 54, salientes: 46 },
  { dia: 'Sáb', entrantes: 28, salientes: 22 },
  { dia: 'Dom', entrantes: 18, salientes: 14 },
];

export const PRICE_DISTRIBUTION = [
  { rango: '<1.200€', alquiler: 18, venta: 0 },
  { rango: '1.2-1.8k', alquiler: 34, venta: 0 },
  { rango: '1.8-2.5k', alquiler: 28, venta: 0 },
  { rango: '200-350k', alquiler: 0, venta: 22 },
  { rango: '350-500k', alquiler: 0, venta: 38 },
  { rango: '500-700k', alquiler: 0, venta: 42 },
  { rango: '700k+', alquiler: 0, venta: 25 },
];

export const INMUEBLES_BY_BARRIO = [
  { barrio: 'Eixample', count: 28 },
  { barrio: 'Gràcia', count: 22 },
  { barrio: 'Poblenou', count: 18 },
  { barrio: 'Sants', count: 16 },
  { barrio: 'Sarrià', count: 14 },
  { barrio: 'Les Corts', count: 12 },
  { barrio: 'Born', count: 9 },
  { barrio: 'Otros', count: 8 },
];

export const INMUEBLE_STATUS = [
  { name: 'I (Idealista)', value: 68, fill: '#22c55e' },
  { name: 'P (Pendiente)', value: 34, fill: '#f59e0b' },
  { name: 'I-M (Idealista+M)', value: 25, fill: '#6366f1' },
];

export const RECENT_CLIENTES = [
  { nombre: 'María García', zona: 'Eixample', presupuesto: '420k', fecha: 'Hoy' },
  { nombre: 'Carlos Ruiz', zona: 'Gràcia', presupuesto: '380k', fecha: 'Ayer' },
  { nombre: 'Ana Fernández', zona: 'Poblenou', presupuesto: '1.850€', fecha: 'Ayer' },
  { nombre: 'Javier Moreno', zona: 'Sants', presupuesto: '520k', fecha: '2 días' },
  { nombre: 'Lucía Torres', zona: 'Sarrià', presupuesto: '2.200€', fecha: '3 días' },
];
