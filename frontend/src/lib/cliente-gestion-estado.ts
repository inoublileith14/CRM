import { TipoOperacion } from '@/types/inmueble';

export type ClienteGestionEstadoAlquiler =
  | 'no_gestionando'
  | 'gestionando'
  | 'visita_concertada'
  | 'nc'
  | 'pendiente_cuadrar_docs'
  | 'perfil_no_encaja'
  | 'videollamada'
  | 'ya_encontro_piso';

export type ClienteGestionEstadoVenta =
  | 'no_gestionado'
  | 'gestionando_w'
  | 'visita_concertada'
  | 'nc'
  | 'pendiente_cuadrar_visita'
  | 'ya_compro'
  | 'perfil_no_encaja'
  | 'videollamada';

export type ClienteGestionEstado =
  | ClienteGestionEstadoAlquiler
  | ClienteGestionEstadoVenta;

export type GestionOption = {
  value: ClienteGestionEstado;
  label: string;
  backgroundColor: string;
  textColor: string;
};

const VISITA_CONCERTADA_BG = '#39ff14';

export const CLIENTE_GESTION_ESTADO_OPTIONS_ALQUILER: GestionOption[] = [
  {
    value: 'no_gestionando',
    label: 'NO GESTIONANDO',
    backgroundColor: '#c6e0b4',
    textColor: '#000000',
  },
  {
    value: 'gestionando',
    label: 'GESTIONANDO',
    backgroundColor: '#ffc000',
    textColor: '#000000',
  },
  {
    value: 'visita_concertada',
    label: 'VISITA CONCERTADA',
    backgroundColor: VISITA_CONCERTADA_BG,
    textColor: '#000000',
  },
  {
    value: 'nc',
    label: 'NC',
    backgroundColor: '#a9b8a0',
    textColor: '#000000',
  },
  {
    value: 'pendiente_cuadrar_docs',
    label: 'PENDIENTE CUADRAR HORARIO/DOCS',
    backgroundColor: '#5b9bd5',
    textColor: '#ffffff',
  },
  {
    value: 'perfil_no_encaja',
    label: 'PERFIL NO ENCAJA',
    backgroundColor: '#ff0000',
    textColor: '#ffffff',
  },
  {
    value: 'videollamada',
    label: 'VIDEOLLAMADA',
    backgroundColor: '#7030a0',
    textColor: '#ffffff',
  },
  {
    value: 'ya_encontro_piso',
    label: 'YA ENCONTRÓ PISO',
    backgroundColor: '#ff0000',
    textColor: '#000000',
  },
];

export const CLIENTE_GESTION_ESTADO_OPTIONS_VENTA: GestionOption[] = [
  {
    value: 'no_gestionado',
    label: 'NO GESTIONADO',
    backgroundColor: '#c6e0b4',
    textColor: '#000000',
  },
  {
    value: 'gestionando_w',
    label: 'GESTIONANDO (w)',
    backgroundColor: '#ffc000',
    textColor: '#000000',
  },
  {
    value: 'visita_concertada',
    label: 'VISITA CONCERTADA',
    backgroundColor: VISITA_CONCERTADA_BG,
    textColor: '#000000',
  },
  {
    value: 'nc',
    label: 'NC',
    backgroundColor: '#a9b8a0',
    textColor: '#000000',
  },
  {
    value: 'pendiente_cuadrar_visita',
    label: 'PENDIENTE CUADRAR VISITA',
    backgroundColor: '#5b9bd5',
    textColor: '#ffffff',
  },
  {
    value: 'ya_compro',
    label: 'YA COMPRÓ',
    backgroundColor: '#ff0000',
    textColor: '#ffffff',
  },
  {
    value: 'perfil_no_encaja',
    label: 'PERFIL NO ENCAJA',
    backgroundColor: '#ff0000',
    textColor: '#ffffff',
  },
  {
    value: 'videollamada',
    label: 'VIDEOLLAMADA',
    backgroundColor: '#7030a0',
    textColor: '#ffffff',
  },
];

const optionMaps = {
  alquiler: new Map(
    CLIENTE_GESTION_ESTADO_OPTIONS_ALQUILER.map((o) => [o.value, o]),
  ),
  venta: new Map(
    CLIENTE_GESTION_ESTADO_OPTIONS_VENTA.map((o) => [o.value, o]),
  ),
} as const;

export function getClienteGestionEstadoOptions(
  tipo: TipoOperacion,
): GestionOption[] {
  return tipo === 'alquiler'
    ? CLIENTE_GESTION_ESTADO_OPTIONS_ALQUILER
    : CLIENTE_GESTION_ESTADO_OPTIONS_VENTA;
}

export function getDefaultClienteGestionEstado(
  tipo: TipoOperacion,
): ClienteGestionEstado {
  return tipo === 'alquiler' ? 'no_gestionando' : 'no_gestionado';
}

export function normalizeClienteGestionEstado(
  value: string | null | undefined,
  tipo: TipoOperacion,
): ClienteGestionEstado {
  const options = optionMaps[tipo];
  if (value && options.has(value as ClienteGestionEstado)) {
    return value as ClienteGestionEstado;
  }
  if (tipo === 'venta' && value === 'no_gestionando') {
    return 'no_gestionado';
  }
  if (tipo === 'alquiler' && value === 'no_gestionado') {
    return 'no_gestionando';
  }
  return getDefaultClienteGestionEstado(tipo);
}

export function getClienteGestionEstadoOption(
  value: string | null | undefined,
  tipo: TipoOperacion,
): GestionOption {
  return optionMaps[tipo].get(normalizeClienteGestionEstado(value, tipo))!;
}

export function getGestionOptionStyle(option: GestionOption): {
  backgroundColor: string;
  color: string;
} {
  return {
    backgroundColor: option.backgroundColor,
    color: option.textColor,
  };
}
