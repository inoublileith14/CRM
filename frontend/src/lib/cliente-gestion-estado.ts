import { TipoOperacion } from '@/types/inmueble';

export type ClienteGestionEstadoAlquiler =
  | 'no_gestionando'
  | 'gestionando'
  | 'visita_concertada'
  | 'reservado'
  | 'alquilado_por_coc'
  | 'nc'
  | 'pendiente_cuadrar_docs'
  | 'int_pendiente_docs'
  | 'perfil_no_encaja'
  | 'videollamada'
  | 'ya_encontro_piso'
  | 'cliente_no_interesado';

export type ClienteGestionEstadoVenta =
  | 'no_gestionado'
  | 'gestionando_w'
  | 'visita_concertada'
  | 'nc'
  | 'pendiente_cuadrar_visita'
  | 'ya_compro'
  | 'perfil_no_encaja'
  | 'videollamada'
  | 'cliente_no_interesado';

export type ClienteGestionEstado =
  | ClienteGestionEstadoAlquiler
  | ClienteGestionEstadoVenta;

export type GestionOption = {
  value: ClienteGestionEstado;
  label: string;
  backgroundColor: string;
  textColor: string;
};

/** Electric green used for VISITA CONCERTADA (and no-asistió toggle ON). */
export const CLIENTE_VISITA_CONCERTADA_GREEN = '#39ff14';

const VISITA_CONCERTADA_BG = CLIENTE_VISITA_CONCERTADA_GREEN;
const INT_PENDIENTE_DOCS_BG = '#5b9bd5';
const INT_PENDIENTE_DOCS_TEXT = '#ffffff';
const NC_BG = '#a0a0a0';
const NC_TEXT = '#000000';
const CLIENTE_NO_INTERESADO_BG = '#000000';
const CLIENTE_NO_INTERESADO_TEXT = '#ffffff';
const RESERVADO_BG = '#ffff00';
const RESERVADO_TEXT = '#000000';

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
    value: 'reservado',
    label: 'RESERVADO',
    backgroundColor: RESERVADO_BG,
    textColor: RESERVADO_TEXT,
  },
  {
    value: 'alquilado_por_coc',
    label: 'ALQUILADO POR COC',
    backgroundColor: RESERVADO_BG,
    textColor: RESERVADO_TEXT,
  },
  {
    value: 'nc',
    label: 'NC',
    backgroundColor: NC_BG,
    textColor: NC_TEXT,
  },
  {
    value: 'cliente_no_interesado',
    label: 'CLIENTE NO INTERESADO',
    backgroundColor: CLIENTE_NO_INTERESADO_BG,
    textColor: CLIENTE_NO_INTERESADO_TEXT,
  },
  {
    value: 'pendiente_cuadrar_docs',
    label: 'INT. DOCS RECIBIDO',
    backgroundColor: INT_PENDIENTE_DOCS_BG,
    textColor: INT_PENDIENTE_DOCS_TEXT,
  },
  {
    value: 'int_pendiente_docs',
    label: 'INT.Pendiente Docs',
    backgroundColor: INT_PENDIENTE_DOCS_BG,
    textColor: INT_PENDIENTE_DOCS_TEXT,
  },
  {
    value: 'videollamada',
    label: 'VIDEOLLAMADA',
    backgroundColor: '#7030a0',
    textColor: '#ffffff',
  },
  {
    value: 'perfil_no_encaja',
    label: 'PERFIL NO ENCAJA',
    backgroundColor: '#ff0000',
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
    backgroundColor: NC_BG,
    textColor: NC_TEXT,
  },
  {
    value: 'cliente_no_interesado',
    label: 'CLIENTE NO INTERESADO',
    backgroundColor: CLIENTE_NO_INTERESADO_BG,
    textColor: CLIENTE_NO_INTERESADO_TEXT,
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
    value: 'videollamada',
    label: 'VIDEOLLAMADA',
    backgroundColor: '#7030a0',
    textColor: '#ffffff',
  },
  {
    value: 'perfil_no_encaja',
    label: 'PERFIL NO ENCAJA',
    backgroundColor: '#ff0000',
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

/** Longest gestión label for the given operation (dropdown width baseline). */
export function getLongestClienteGestionEstadoLabel(tipo: TipoOperacion): string {
  return getClienteGestionEstadoOptions(tipo).reduce(
    (longest, option) =>
      option.label.length > longest.length ? option.label : longest,
    '',
  );
}

/** Horizontal chrome: label padding + chevron column. */
export const GESTION_SELECT_CHROME_PX = 40;

export const GESTION_SELECT_LABEL_CLASS =
  'text-[10px] font-bold uppercase leading-tight sm:text-xs';

function measureGestionLabelsWidthPx(labels: string[]): number {
  if (labels.length === 0) return 0;

  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context) {
      const rootFontSize =
        Number.parseFloat(getComputedStyle(document.documentElement).fontSize) ||
        16;
      const fontSize =
        window.matchMedia('(min-width: 640px)').matches
          ? rootFontSize * 0.75
          : rootFontSize * 0.625;
      context.font = `700 ${fontSize}px system-ui, -apple-system, sans-serif`;
      return Math.max(
        ...labels.map((label) => context.measureText(label).width),
      );
    }
  }

  return Math.max(...labels.map((label) => label.length * 7.25));
}

/**
 * Estimated trigger/dropdown width so the longest option fits on one line.
 * Used for per-house client tables (rent / sell detail).
 */
export function estimateGestionSelectWidthPx(tipo: TipoOperacion): number {
  const labels = getClienteGestionEstadoOptions(tipo).map((option) => option.label);
  const maxText = measureGestionLabelsWidthPx(labels);
  if (!maxText) return 152;
  return Math.ceil(maxText) + GESTION_SELECT_CHROME_PX;
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

export function requiresCalendarEventDialog(
  estado: ClienteGestionEstado,
): estado is 'visita_concertada' | 'videollamada' {
  return estado === 'visita_concertada' || estado === 'videollamada';
}

export function isClienteVisitaGestionEstado(
  value: string | null | undefined,
): value is 'visita_concertada' | 'videollamada' {
  return value === 'visita_concertada' || value === 'videollamada';
}
