import { INMUEBLE_FIELDS, InmuebleFormData, TipoOperacion } from '@/types/inmueble';

export interface InmuebleTableFieldConfig {
  key: keyof InmuebleFormData;
  label: string;
  type: (typeof INMUEBLE_FIELDS)[number]['type'];
  options?: (typeof INMUEBLE_FIELDS)[number]['options'];
  shortLabel?: string;
  headClassName?: string;
  cellClassName?: string;
  headAccent?: boolean;
}

/** Multi-line cell text (no ellipsis). */
const WRAP = 'break-words whitespace-normal leading-snug text-center align-middle';

type LayoutConfig = {
  key: keyof InmuebleFormData;
  shortLabel?: string;
  label?: string;
  headClassName?: string;
  cellClassName?: string;
  headAccent?: boolean;
};

/** Shown only when the user expands extra columns from the actions + button. */
export const INMUEBLE_EXTRA_COLUMN_KEYS = [
  'ref',
  'fecha_visitas_entrada',
  'captador_alquilado_por',
] as const;

export type InmuebleExtraColumnKey = (typeof INMUEBLE_EXTRA_COLUMN_KEYS)[number];

const EXTRA_REF_COL = 'w-[5rem] min-w-[5rem] max-w-[5.5rem]';
const EXTRA_VISITAS_COL = 'w-[4.25rem] min-w-[4.25rem] max-w-[4.5rem]';
const EXTRA_CAPT_COL = 'w-[3.75rem] min-w-[3.75rem] max-w-[4rem]';
const EXTRA_HEAD_NOWRAP = 'whitespace-nowrap';

const EXTRA_COLUMN_LAYOUT: Record<
  InmuebleExtraColumnKey,
  LayoutConfig & { ventaShortLabel?: string; ventaLabel?: string }
> = {
  ref: {
    key: 'ref',
    shortLabel: 'Ref.',
    headClassName: `${EXTRA_REF_COL} ${EXTRA_HEAD_NOWRAP}`,
    cellClassName: `${WRAP} ${EXTRA_REF_COL} break-all`,
  },
  fecha_visitas_entrada: {
    key: 'fecha_visitas_entrada',
    shortLabel: 'Visitas',
    label: 'Fecha visitas / entrada',
    ventaShortLabel: 'Video',
    ventaLabel: 'Video Coconut // Link otra agencia',
    headClassName: `${EXTRA_VISITAS_COL} ${EXTRA_HEAD_NOWRAP}`,
    cellClassName: `${WRAP} ${EXTRA_VISITAS_COL}`,
  },
  captador_alquilado_por: {
    key: 'captador_alquilado_por',
    shortLabel: 'Capt.',
    label: 'Captador / Alquilado por',
    ventaLabel: 'Captador / Vendido por',
    headClassName: `${EXTRA_CAPT_COL} ${EXTRA_HEAD_NOWRAP}`,
    cellClassName: `${WRAP} ${EXTRA_CAPT_COL} break-words`,
  },
};

/** Ultra-narrow numeric columns (HAB / BAN / M). */
export const INMUEBLE_NARROW_NUMERIC_KEYS = ['hab', 'banos', 'metros'] as const;

export function isInmuebleNarrowNumericKey(
  key: keyof InmuebleFormData,
): boolean {
  return (INMUEBLE_NARROW_NUMERIC_KEYS as readonly string[]).includes(key);
}

export function isInmuebleCompactHeadKey(
  key: keyof InmuebleFormData,
): boolean {
  return key === 'status' || isInmuebleNarrowNumericKey(key);
}

const NARROW_NUMERIC_HEAD =
  'w-7 max-w-[1.75rem] px-0 whitespace-nowrap text-[9px] font-semibold leading-snug sm:text-[10px]';
const NARROW_NUMERIC_COL = 'w-7 max-w-[1.75rem]';
const NARROW_NUMERIC_CELL =
  'w-7 max-w-[1.75rem] p-0 whitespace-nowrap text-center tabular-nums align-middle text-base font-bold leading-none text-slate-900';

/** Responsive width for Entrada / Espejo columns. */
const IMAGE_COL_CLASS = 'w-[clamp(5rem,12vw,8.5rem)]';

/** Slightly narrower Propi. / Barrio when extra columns are visible. */
const IMAGE_COL_COMPACT = 'w-[clamp(3.75rem,8vw,6rem)]';

const PRECIO_COL = 'w-[3.75rem] max-w-[3.75rem] px-0.5';
const LT_COL = 'w-[2.5rem] max-w-[2.5rem] px-0';
const LT_NUMERIC_HEAD =
  'w-[2.5rem] max-w-[2.5rem] px-0 whitespace-nowrap text-[9px] font-semibold leading-snug sm:text-[10px]';
const LT_NUMERIC_CELL =
  'w-[2.5rem] max-w-[2.5rem] p-0 whitespace-nowrap text-center tabular-nums align-middle text-base font-bold leading-none text-slate-900';
const OBS_COL = 'min-w-[14rem] w-[22%] text-[9px] leading-tight sm:text-[10px]';
const OBS_COL_COMPACT = 'min-w-[9rem] w-[14%] text-[9px] leading-tight sm:text-[10px]';

const ACTIONS_COL = 'w-[5rem] min-w-[5rem] max-w-[5rem]';

export const INMUEBLE_DENSE_ACTIONS_COL_CLASS = ACTIONS_COL;

/** Shared padding / typography for dense table header row. */
export const INMUEBLE_DENSE_HEAD_CELL_CLASS =
  'px-1.5 py-1.5 text-[10px] font-semibold leading-snug sm:px-2 sm:py-2 sm:text-xs sm:leading-tight';

const ALQUILER_TABLE_LAYOUT: LayoutConfig[] = [
  { key: 'status', shortLabel: 'BCN', headClassName: NARROW_NUMERIC_HEAD, cellClassName: 'w-7 max-w-[1.75rem] p-0 text-center align-middle' },
  {
    key: 'nombre_propi',
    shortLabel: 'Propi.',
    label: 'Propietario',
    headClassName: IMAGE_COL_CLASS,
    cellClassName: `${WRAP} p-1 ${IMAGE_COL_CLASS}`,
  },
  {
    key: 'fecha_entrada_inmueble',
    shortLabel: 'Entrada',
    label: 'Entrada, imagen y dirección',
    headClassName: IMAGE_COL_CLASS,
    cellClassName: `p-0 align-middle ${IMAGE_COL_CLASS}`,
    headAccent: true,
  },
  {
    key: 'foto_espejo',
    shortLabel: 'Espejo',
    label: 'Precio espejo, foto y dirección espejo',
    headClassName: IMAGE_COL_CLASS,
    cellClassName: `p-0 align-middle ${IMAGE_COL_CLASS}`,
    headAccent: true,
  },
  { key: 'precio', shortLabel: 'Precio', headClassName: PRECIO_COL, cellClassName: `${WRAP} tabular-nums font-bold ${PRECIO_COL}`, headAccent: true },
  { key: 'hab', shortLabel: 'HAB', headClassName: LT_NUMERIC_HEAD, cellClassName: LT_NUMERIC_CELL },
  { key: 'banos', shortLabel: 'BAN', headClassName: LT_NUMERIC_HEAD, cellClassName: LT_NUMERIC_CELL },
  { key: 'metros', shortLabel: 'M', headClassName: LT_NUMERIC_HEAD, cellClassName: LT_NUMERIC_CELL },
  {
    key: 'observaciones',
    shortLabel: 'Observaciones',
    label: 'Observaciones',
    headClassName: OBS_COL,
    cellClassName: `${WRAP} ${OBS_COL}`,
  },
  { key: 'barrio_distrito', shortLabel: 'Barrio', headClassName: IMAGE_COL_CLASS, cellClassName: `${WRAP} ${IMAGE_COL_CLASS}` },
  { key: 'larga_estancia_temporada', shortLabel: 'L/T', headClassName: LT_COL, cellClassName: `text-center align-middle ${LT_COL}` },
  { key: 'ficha_del_piso_real', shortLabel: 'Ficha', label: 'Ficha piso real', headClassName: PRECIO_COL, cellClassName: `${WRAP} ${PRECIO_COL}` },
  { key: 'link_idealista_espejo', shortLabel: 'Link', label: 'Link Idealista o link espejo', headClassName: PRECIO_COL, cellClassName: `${WRAP} ${PRECIO_COL}`, headAccent: true },
];

const VENTA_TABLE_LAYOUT: LayoutConfig[] = [
  { key: 'status', shortLabel: 'BCN', headClassName: NARROW_NUMERIC_HEAD, cellClassName: 'w-7 max-w-[1.75rem] p-0 text-center align-middle' },
  {
    key: 'nombre_propi',
    shortLabel: 'Propi.',
    label: 'Propietario',
    headClassName: IMAGE_COL_CLASS,
    cellClassName: `${WRAP} p-1 ${IMAGE_COL_CLASS}`,
  },
  {
    key: 'fecha_entrada_inmueble',
    shortLabel: 'Entrada',
    label: 'Entrada, imagen y dirección',
    headClassName: IMAGE_COL_CLASS,
    cellClassName: `p-0 align-middle ${IMAGE_COL_CLASS}`,
    headAccent: true,
  },
  {
    key: 'foto_espejo',
    shortLabel: 'Espejo',
    label: 'Precio espejo, foto y dirección espejo',
    headClassName: IMAGE_COL_CLASS,
    cellClassName: `p-0 align-middle ${IMAGE_COL_CLASS}`,
    headAccent: true,
  },
  { key: 'precio', shortLabel: 'Precio', headClassName: PRECIO_COL, cellClassName: `${WRAP} tabular-nums font-bold ${PRECIO_COL}`, headAccent: true },
  { key: 'hab', shortLabel: 'HAB', headClassName: LT_NUMERIC_HEAD, cellClassName: LT_NUMERIC_CELL },
  { key: 'banos', shortLabel: 'BAN', headClassName: LT_NUMERIC_HEAD, cellClassName: LT_NUMERIC_CELL },
  { key: 'metros', shortLabel: 'M', headClassName: LT_NUMERIC_HEAD, cellClassName: LT_NUMERIC_CELL },
  {
    key: 'observaciones',
    shortLabel: 'Observaciones',
    label: 'Observaciones',
    headClassName: OBS_COL,
    cellClassName: `${WRAP} ${OBS_COL}`,
  },
  { key: 'barrio_distrito', shortLabel: 'Barrio', headClassName: IMAGE_COL_CLASS, cellClassName: `${WRAP} ${IMAGE_COL_CLASS}` },
  { key: 'ficha_del_piso_real', shortLabel: 'Ficha', label: 'Ficha piso real', headClassName: PRECIO_COL, cellClassName: `${WRAP} ${PRECIO_COL}` },
  { key: 'link_idealista_espejo', shortLabel: 'Link', label: 'Link Idealista o link espejo', headClassName: PRECIO_COL, cellClassName: `${WRAP} ${PRECIO_COL}`, headAccent: true },
];

function buildFieldsFromLayout(
  layout: LayoutConfig[],
): InmuebleTableFieldConfig[] {
  const fieldByKey = new Map(INMUEBLE_FIELDS.map((field) => [field.key, field]));

  return layout.map((config) => {
    const base = fieldByKey.get(config.key);
    if (!base) {
      throw new Error(`Missing inmueble field config for ${config.key}`);
    }

    return {
      key: config.key,
      label: config.label ?? base.label,
      type: base.type,
      options: base.options,
      shortLabel: config.shortLabel,
      headClassName: config.headClassName,
      cellClassName: config.cellClassName,
      headAccent: config.headAccent,
    };
  });
}

export function getInmuebleExtraTableFields(
  tipoOperacion: TipoOperacion,
): InmuebleTableFieldConfig[] {
  const fieldByKey = new Map(INMUEBLE_FIELDS.map((field) => [field.key, field]));

  return INMUEBLE_EXTRA_COLUMN_KEYS.map((key) => {
    const config = EXTRA_COLUMN_LAYOUT[key];
    const base = fieldByKey.get(config.key);
    if (!base) {
      throw new Error(`Missing inmueble field config for ${config.key}`);
    }

    const isVenta = tipoOperacion === 'venta';

    return {
      key: config.key,
      label:
        (isVenta ? config.ventaLabel : undefined) ?? config.label ?? base.label,
      type: base.type,
      options: base.options,
      shortLabel:
        (isVenta ? config.ventaShortLabel : undefined) ??
        config.shortLabel,
      headClassName: config.headClassName,
      cellClassName: config.cellClassName,
      headAccent: config.headAccent,
    };
  });
}

export function getInmuebleDisplayedTableFields(
  tipoOperacion: TipoOperacion,
  options?: { includeExtraColumns?: boolean },
): InmuebleTableFieldConfig[] {
  const base = getInmuebleTableFields(tipoOperacion);
  if (!options?.includeExtraColumns || !isDenseInmuebleTable(tipoOperacion)) {
    return base;
  }

  const compactBase = base.map((field) => {
    if (field.key === 'nombre_propi') {
      return {
        ...field,
        headClassName: `${IMAGE_COL_COMPACT} ${EXTRA_HEAD_NOWRAP}`,
        cellClassName: `${WRAP} p-1 ${IMAGE_COL_COMPACT}`,
      };
    }
    if (field.key === 'barrio_distrito') {
      return {
        ...field,
        headClassName: IMAGE_COL_COMPACT,
        cellClassName: `${WRAP} ${IMAGE_COL_COMPACT}`,
      };
    }
    if (field.key === 'observaciones') {
      return {
        ...field,
        headClassName: OBS_COL_COMPACT,
        cellClassName: `${WRAP} ${OBS_COL_COMPACT}`,
      };
    }
    return field;
  });

  return [...compactBase, ...getInmuebleExtraTableFields(tipoOperacion)];
}

export function getInmuebleTableFields(
  tipoOperacion: TipoOperacion,
): InmuebleTableFieldConfig[] {
  if (tipoOperacion === 'alquiler') {
    return buildFieldsFromLayout(ALQUILER_TABLE_LAYOUT);
  }

  if (tipoOperacion === 'venta') {
    return buildFieldsFromLayout(VENTA_TABLE_LAYOUT);
  }

  return INMUEBLE_FIELDS.filter((field) => field.key !== 'tipo_operacion').map(
    (field) => ({
      key: field.key,
      label: field.label,
      type: field.type,
      options: field.options,
    }),
  );
}

export function isDenseInmuebleTable(tipoOperacion: TipoOperacion): boolean {
  return tipoOperacion === 'alquiler' || tipoOperacion === 'venta';
}

/** @deprecated Use isDenseInmuebleTable */
export function isAlquilerDenseInmuebleTable(tipoOperacion: TipoOperacion): boolean {
  return isDenseInmuebleTable(tipoOperacion);
}

export function getInmuebleTableHeaderClass(tipoOperacion: TipoOperacion): string {
  return tipoOperacion === 'venta' ? 'bg-slate-900' : 'bg-emerald-800';
}

/** Wrapper for dense casas tables — no inner vertical scroll; page scrolls instead. */
export const INMUEBLE_DENSE_TABLE_WRAPPER_CLASS = 'overflow-x-clip';

/** Sticky offset below dashboard top nav (h-14 / sm:h-16). */
export const INMUEBLE_STICKY_HEAD_TOP_CLASS = 'top-14 sm:top-16';

export function getInmuebleStickyHeadClass(tipoOperacion: TipoOperacion): string {
  return `sticky ${INMUEBLE_STICKY_HEAD_TOP_CLASS} z-20 ${getInmuebleTableHeaderClass(tipoOperacion)}`;
}

export function getInmuebleDenseColClass(
  key: keyof InmuebleFormData,
  options?: { extraColumnsVisible?: boolean },
): string | undefined {
  const extra = options?.extraColumnsVisible;

  if (key === 'status') {
    return NARROW_NUMERIC_COL;
  }
  if (key === 'hab' || key === 'banos' || key === 'metros') {
    return LT_COL;
  }
  if (key === 'fecha_entrada_inmueble' || key === 'foto_espejo') {
    return IMAGE_COL_CLASS;
  }
  if (key === 'nombre_propi' || key === 'barrio_distrito') {
    return extra ? IMAGE_COL_COMPACT : IMAGE_COL_CLASS;
  }
  if (key === 'precio') return PRECIO_COL;
  if (key === 'larga_estancia_temporada') return LT_COL;
  if (key === 'ficha_del_piso_real' || key === 'link_idealista_espejo') {
    return PRECIO_COL;
  }
  if (key === 'observaciones') {
    return extra ? OBS_COL_COMPACT : OBS_COL;
  }
  if (key === 'ref') return EXTRA_REF_COL;
  if (key === 'fecha_visitas_entrada') return EXTRA_VISITAS_COL;
  if (key === 'captador_alquilado_por') return EXTRA_CAPT_COL;
  return undefined;
}

export function getInmuebleStickyHeadActionsClass(
  tipoOperacion: TipoOperacion,
): string {
  return `sticky z-30 ${getInmuebleTableHeaderClass(tipoOperacion)}`;
}
