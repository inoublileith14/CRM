export const CLIENTE_GESTION_ESTADOS_ALQUILER = [
  'no_gestionando',
  'gestionando',
  'visita_concertada',
  'reservado',
  'alquilado_por_coc',
  'nc',
  'cliente_no_interesado',
  'pendiente_cuadrar_docs',
  'int_pendiente_docs',
  'videollamada',
  'perfil_no_encaja',
  'ya_encontro_piso',
] as const;

export const CLIENTE_GESTION_ESTADOS_VENTA = [
  'no_gestionado',
  'gestionando_w',
  'visita_concertada',
  'nc',
  'cliente_no_interesado',
  'pendiente_cuadrar_visita',
  'ya_compro',
  'videollamada',
  'perfil_no_encaja',
] as const;

export const CLIENTE_GESTION_ESTADOS = [
  ...CLIENTE_GESTION_ESTADOS_ALQUILER,
  ...CLIENTE_GESTION_ESTADOS_VENTA,
] as const;

export type ClienteGestionEstadoAlquiler =
  (typeof CLIENTE_GESTION_ESTADOS_ALQUILER)[number];

export type ClienteGestionEstadoVenta =
  (typeof CLIENTE_GESTION_ESTADOS_VENTA)[number];

export type ClienteGestionEstado = (typeof CLIENTE_GESTION_ESTADOS)[number];

export function getDefaultClienteGestionEstado(
  tipoOperacion: 'alquiler' | 'venta',
): ClienteGestionEstado {
  return tipoOperacion === 'alquiler' ? 'no_gestionando' : 'no_gestionado';
}

export function isClienteGestionEstadoForTipo(
  value: string,
  tipoOperacion: 'alquiler' | 'venta',
): value is ClienteGestionEstado {
  const allowed =
    tipoOperacion === 'alquiler'
      ? CLIENTE_GESTION_ESTADOS_ALQUILER
      : CLIENTE_GESTION_ESTADOS_VENTA;
  return (allowed as readonly string[]).includes(value);
}

export function isClienteVisitaGestionEstado(
  value: string | null | undefined,
): value is 'visita_concertada' | 'videollamada' {
  return value === 'visita_concertada' || value === 'videollamada';
}
