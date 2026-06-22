export const CLIENTE_GESTION_ESTADOS_ALQUILER = [
  'no_gestionando',
  'gestionando',
  'visita_concertada',
  'nc',
  'pendiente_cuadrar_docs',
  'perfil_no_encaja',
  'videollamada',
  'ya_encontro_piso',
] as const;

export const CLIENTE_GESTION_ESTADOS_VENTA = [
  'no_gestionado',
  'gestionando_w',
  'visita_concertada',
  'nc',
  'pendiente_cuadrar_visita',
  'ya_compro',
  'perfil_no_encaja',
  'videollamada',
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
