import { INMUEBLE_FIELDS, InmuebleFormData, TipoOperacion } from '@/types/inmueble';
import { EXCEL_STICKY_TABLE_CLASS } from '@/lib/excel-table-styles';
import type { CSSProperties } from 'react';

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
    shortLabel: 'REF.',
    headClassName: `${EXTRA_REF_COL} ${EXTRA_HEAD_NOWRAP}`,
    cellClassName: `${WRAP} ${EXTRA_REF_COL} break-all`,
  },
  fecha_visitas_entrada: {
    key: 'fecha_visitas_entrada',
    shortLabel: 'ENTR. PISO',
    label: 'FECHA ENTRADA AL PISO',
    ventaShortLabel: 'ENTR. PISO',
    ventaLabel: 'FECHA ENTRADA AL PISO',
    headClassName: `${EXTRA_VISITAS_COL} ${EXTRA_HEAD_NOWRAP}`,
    cellClassName: `${WRAP} ${EXTRA_VISITAS_COL}`,
  },
  captador_alquilado_por: {
    key: 'captador_alquilado_por',
    shortLabel: 'CAPT.',
    label: 'CAPTADOR / ALQUILADO POR',
    ventaLabel: 'CAPTADOR / VENDIDO POR',
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

export function isInmuebleDenseNumericCellKey(
  key: keyof InmuebleFormData,
): boolean {
  return (
    isInmuebleNarrowNumericKey(key) ||
    key === 'precio' ||
    key === 'larga_estancia_temporada'
  );
}

export function isInmuebleCompactHeadKey(
  key: keyof InmuebleFormData,
): boolean {
  return (
    key === 'status' ||
    key === 'distrito_ciudad' ||
    isInmuebleNarrowNumericKey(key)
  );
}

export function isInmuebleDenseLinkColumnKey(
  key: keyof InmuebleFormData,
): boolean {
  return (
    key === 'link_idealista' ||
    key === 'link_espejo' ||
    key === 'link_idealista_espejo'
  );
}

const NARROW_NUMERIC_HEAD =
  'w-7 max-w-[1.75rem] px-0 whitespace-nowrap text-[9px] font-semibold leading-snug sm:text-[10px]';
const NARROW_NUMERIC_COL = 'w-7 max-w-[1.75rem]';
const NARROW_NUMERIC_CELL =
  'w-7 max-w-[1.75rem] p-0 whitespace-nowrap text-center tabular-nums align-middle text-sm font-bold leading-none text-slate-900 sm:text-base';

/** Shared typography for PRECIO / HAB / BAN / M dense cells. */
const DENSE_NUMERIC_CELL_TEXT =
  'text-sm font-bold leading-none text-slate-900 tabular-nums sm:text-base';

/** BCN / status column — slightly wider than HAB/BAN/M. */
const STATUS_COL = 'w-10 min-w-[2.5rem] max-w-[2.75rem]';
const STATUS_HEAD =
  'w-10 min-w-[2.5rem] max-w-[2.75rem] px-0.5 whitespace-nowrap text-[9px] font-semibold leading-snug sm:text-[10px]';
const STATUS_CELL = `${STATUS_COL} p-0 text-center align-middle`;

/** Responsive width for Entrada / Espejo columns. */
const IMAGE_COL_CLASS = 'w-[clamp(5rem,12vw,8.5rem)]';

/** Fixed widths when extra columns are visible (no vw — avoids squash on horizontal scroll). */
const IMAGE_COL_EXTRA = 'w-[5.5rem] min-w-[5.5rem] max-w-[5.5rem]';
const PROPI_COL_EXTRA = 'w-[5rem] min-w-[5rem] max-w-[5rem]';
const BARRIO_COL_EXTRA = 'w-[7.5rem] min-w-[7.5rem] max-w-[7.5rem]';
const OBS_COL_EXTRA = 'w-[7rem] min-w-[7rem] max-w-[7rem]';

/** Barrio / distrito — same width and wrap as clientes global. */
const BARRIO_COL = 'w-[7.5rem] min-w-[7.5rem] max-w-[7.5rem]';
const BARRIO_CELL = `${WRAP} px-1 text-[10px] sm:text-xs`;
/** Slightly smaller header so "DIST./CIUD." fits on one line. */
const DISTRITO_CIUDAD_HEAD_TEXT =
  'px-0.5 whitespace-nowrap text-[8px] font-semibold leading-none sm:text-[9px]';

const PRECIO_COL = 'w-[3.75rem] max-w-[3.75rem] px-0.5';
const PRECIO_CELL = `whitespace-nowrap text-center align-middle ${DENSE_NUMERIC_CELL_TEXT} ${PRECIO_COL}`;
const VENTA_PRECIO_COL = 'px-1 whitespace-nowrap';
const VENTA_PRECIO_CELL = `whitespace-nowrap text-center align-middle ${DENSE_NUMERIC_CELL_TEXT} ${VENTA_PRECIO_COL}`;
const LT_COL = 'w-[2.5rem] max-w-[2.5rem] px-0';
const LT_NUMERIC_HEAD =
  'w-[2.5rem] max-w-[2.5rem] px-0 whitespace-nowrap text-[9px] font-semibold leading-snug sm:text-[10px]';
const LT_NUMERIC_CELL =
  `w-[2.5rem] max-w-[2.5rem] p-0 whitespace-nowrap text-center align-middle ${DENSE_NUMERIC_CELL_TEXT}`;
const LT_CELL = `whitespace-nowrap text-center align-middle ${DENSE_NUMERIC_CELL_TEXT} ${LT_COL}`;
const MASKED_TEXT_WIDTH_COL = 'min-w-[7rem] w-[11%]';
const MASKED_TEXT_COL_EXTRA = 'w-[7rem] min-w-[7rem] max-w-[7rem]';
/** Cell body typography for masked text columns (observaciones, requisitos). */
const MASKED_TEXT_CELL_TEXT = 'text-[9px] leading-tight sm:text-[10px]';
const MASKED_TEXT_COL = `${MASKED_TEXT_WIDTH_COL} ${MASKED_TEXT_CELL_TEXT}`;

const ACTIONS_COL = 'w-[4.5rem] min-w-[4.5rem] max-w-[4.5rem]';

export const INMUEBLE_DENSE_ACTIONS_COL_CLASS = ACTIONS_COL;

/** Shared padding / typography for dense table header row. */
export const INMUEBLE_DENSE_HEAD_CELL_CLASS =
  'min-h-[3.5rem] px-2 py-3 text-[10px] font-semibold leading-snug sm:px-2.5 sm:py-3.5 sm:text-xs sm:leading-tight';

const ALQUILER_TABLE_LAYOUT: LayoutConfig[] = [
  { key: 'status', shortLabel: 'BCN', headClassName: STATUS_HEAD, cellClassName: STATUS_CELL },
  {
    key: 'nombre_propi',
    shortLabel: 'PROPI.',
    label: 'PROPIETARIO',
    headClassName: IMAGE_COL_CLASS,
    cellClassName: `${WRAP} p-1 ${IMAGE_COL_CLASS}`,
  },
  {
    key: 'fecha_entrada_inmueble',
    shortLabel: 'ENTRADA',
    label: 'ENTRADA, IMAGEN Y DIRECCIÓN',
    headClassName: IMAGE_COL_CLASS,
    cellClassName: `p-0 align-middle ${IMAGE_COL_CLASS}`,
    headAccent: true,
  },
  {
    key: 'foto_espejo',
    shortLabel: 'ESPEJO',
    label: 'PRECIO ESPEJO, FOTO Y DIRECCIÓN ESPEJO',
    headClassName: IMAGE_COL_CLASS,
    cellClassName: `p-0 align-middle ${IMAGE_COL_CLASS}`,
    headAccent: true,
  },
  { key: 'precio', shortLabel: 'PRECIO', headClassName: PRECIO_COL, cellClassName: PRECIO_CELL, headAccent: true },
  { key: 'hab', shortLabel: 'HAB', headClassName: LT_NUMERIC_HEAD, cellClassName: LT_NUMERIC_CELL },
  { key: 'banos', shortLabel: 'BAN', headClassName: LT_NUMERIC_HEAD, cellClassName: LT_NUMERIC_CELL },
  { key: 'metros', shortLabel: 'M²', headClassName: LT_NUMERIC_HEAD, cellClassName: LT_NUMERIC_CELL },
  { key: 'barrio_distrito', shortLabel: 'BARRIO', headClassName: BARRIO_COL, cellClassName: `${BARRIO_CELL} ${BARRIO_COL}` },
  {
    key: 'distrito_ciudad',
    shortLabel: 'DIST./CIUD.',
    label: 'DISTRITO / CIUDAD',
    headClassName: `${BARRIO_COL} ${DISTRITO_CIUDAD_HEAD_TEXT}`,
    cellClassName: `${BARRIO_CELL} ${BARRIO_COL}`,
  },
  { key: 'larga_estancia_temporada', shortLabel: 'L/T', headClassName: LT_COL, cellClassName: LT_CELL },
  { key: 'ficha_del_piso_real', shortLabel: 'FICHA', label: 'FICHA PISO REAL', headClassName: PRECIO_COL, cellClassName: `${WRAP} ${PRECIO_COL}` },
  {
    key: 'link_idealista_espejo',
    shortLabel: 'LINK\nIDEALISTA\nLINK\nESPEJO',
    label: 'LINK IDEALISTA O LINK ESPEJO',
    headClassName: PRECIO_COL,
    cellClassName: `${WRAP} ${PRECIO_COL}`,
    headAccent: true,
  },
  {
    key: 'observaciones',
    shortLabel: 'OBSERVACIONES',
    label: 'OBSERVACIONES',
    headClassName: MASKED_TEXT_WIDTH_COL,
    cellClassName: `p-0 h-full align-middle ${MASKED_TEXT_COL}`,
  },
  {
    key: 'requisitos_propietario',
    shortLabel: 'REQ. PROPI.',
    label: 'REQUISITOS DEL PROPIETARIO',
    headClassName: MASKED_TEXT_WIDTH_COL,
    cellClassName: `p-0 h-full align-middle ${MASKED_TEXT_COL}`,
  },
];

const VENTA_TABLE_LAYOUT: LayoutConfig[] = [
  { key: 'status', shortLabel: 'BCN', headClassName: STATUS_HEAD, cellClassName: STATUS_CELL },
  {
    key: 'nombre_propi',
    shortLabel: 'PROPI.',
    label: 'PROPIETARIO',
    headClassName: IMAGE_COL_CLASS,
    cellClassName: `${WRAP} p-1 ${IMAGE_COL_CLASS}`,
  },
  {
    key: 'fecha_entrada_inmueble',
    shortLabel: 'ENTRADA',
    label: 'ENTRADA, IMAGEN Y DIRECCIÓN',
    headClassName: IMAGE_COL_CLASS,
    cellClassName: `p-0 align-middle ${IMAGE_COL_CLASS}`,
    headAccent: true,
  },
  {
    key: 'foto_espejo',
    shortLabel: 'ESPEJO',
    label: 'PRECIO ESPEJO, FOTO Y DIRECCIÓN ESPEJO',
    headClassName: IMAGE_COL_CLASS,
    cellClassName: `p-0 align-middle ${IMAGE_COL_CLASS}`,
    headAccent: true,
  },
  { key: 'precio', shortLabel: 'PRECIO', headClassName: VENTA_PRECIO_COL, cellClassName: VENTA_PRECIO_CELL, headAccent: true },
  { key: 'hab', shortLabel: 'HAB', headClassName: LT_NUMERIC_HEAD, cellClassName: LT_NUMERIC_CELL },
  { key: 'banos', shortLabel: 'BAN', headClassName: LT_NUMERIC_HEAD, cellClassName: LT_NUMERIC_CELL },
  { key: 'metros', shortLabel: 'M²', headClassName: LT_NUMERIC_HEAD, cellClassName: LT_NUMERIC_CELL },
  { key: 'barrio_distrito', shortLabel: 'BARRIO', headClassName: BARRIO_COL, cellClassName: `${BARRIO_CELL} ${BARRIO_COL}` },
  {
    key: 'distrito_ciudad',
    shortLabel: 'DIST./CIUD.',
    label: 'DISTRITO / CIUDAD',
    headClassName: `${BARRIO_COL} ${DISTRITO_CIUDAD_HEAD_TEXT}`,
    cellClassName: `${BARRIO_CELL} ${BARRIO_COL}`,
  },
  { key: 'ficha_del_piso_real', shortLabel: 'FICHA', label: 'FICHA PISO REAL', headClassName: PRECIO_COL, cellClassName: `${WRAP} ${PRECIO_COL}` },
  {
    key: 'link_idealista',
    shortLabel: 'LINK\nIDEALISTA',
    label: 'LINK IDEALISTA',
    headClassName: PRECIO_COL,
    cellClassName: `${WRAP} ${PRECIO_COL}`,
  },
  {
    key: 'link_espejo',
    shortLabel: 'LINK\nESPEJO',
    label: 'LINK ESPEJO',
    headClassName: PRECIO_COL,
    cellClassName: `${WRAP} ${PRECIO_COL}`,
    headAccent: true,
  },
  {
    key: 'observaciones',
    shortLabel: 'OBSERVACIONES',
    label: 'OBSERVACIONES',
    headClassName: MASKED_TEXT_WIDTH_COL,
    cellClassName: `p-0 h-full align-middle ${MASKED_TEXT_COL}`,
  },
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
        headClassName: `${PROPI_COL_EXTRA} ${EXTRA_HEAD_NOWRAP}`,
        cellClassName: `${WRAP} p-1 ${PROPI_COL_EXTRA}`,
      };
    }
    if (
      field.key === 'fecha_entrada_inmueble' ||
      field.key === 'foto_espejo'
    ) {
      return {
        ...field,
        headClassName: IMAGE_COL_EXTRA,
        cellClassName: `p-0 align-middle ${IMAGE_COL_EXTRA}`,
      };
    }
    if (field.key === 'barrio_distrito') {
      return {
        ...field,
        headClassName: BARRIO_COL_EXTRA,
        cellClassName: `${BARRIO_CELL} ${BARRIO_COL_EXTRA}`,
      };
    }
    if (field.key === 'distrito_ciudad') {
      return {
        ...field,
        headClassName: `${BARRIO_COL_EXTRA} ${DISTRITO_CIUDAD_HEAD_TEXT}`,
        cellClassName: `${BARRIO_CELL} ${BARRIO_COL_EXTRA}`,
      };
    }
    if (
      field.key === 'observaciones' ||
      field.key === 'requisitos_propietario'
    ) {
      return {
        ...field,
        headClassName: OBS_COL_EXTRA,
        cellClassName: `p-0 h-full align-middle ${OBS_COL_EXTRA} ${MASKED_TEXT_CELL_TEXT}`,
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

/** Forest green for alquiler dense table header and BCN column. */
export const INMUEBLE_DENSE_HEADER_COLOR = '#007a55';

/** Dark blue for venta dense table header and BCN column. */
export const INMUEBLE_VENTA_DENSE_HEADER_COLOR = '#1C4587';

export function getInmuebleDenseHeaderColor(
  tipoOperacion?: TipoOperacion,
): string {
  return tipoOperacion === 'venta'
    ? INMUEBLE_VENTA_DENSE_HEADER_COLOR
    : INMUEBLE_DENSE_HEADER_COLOR;
}

/** Header row band colors (match PROPI cell pills: fecha / propi / tlf). */
export const INMUEBLE_HEAD_FECHA_BG = '#fde047';
export const INMUEBLE_HEAD_PRIMARY_BG = '#ffffff';
export const INMUEBLE_HEAD_SECONDARY_BG = '#ffffff';

export function getInmuebleDenseHeaderStyle(
  tipoOperacion?: TipoOperacion,
): { backgroundColor: string } {
  return { backgroundColor: getInmuebleDenseHeaderColor(tipoOperacion) };
}

export function getInmuebleDenseHeadCellBackground(
  _fieldKey: keyof InmuebleFormData | 'actions',
  _columnIndex: number,
  tipoOperacion?: TipoOperacion,
): string {
  return getInmuebleDenseHeaderColor(tipoOperacion);
}

export function getInmuebleDenseHeadTextClass(
  fieldKey: keyof InmuebleFormData | 'actions',
  _background: string,
): string {
  if (fieldKey === 'status') return '';
  return 'text-white';
}

export function getInmuebleTableHeaderClass(_tipoOperacion: TipoOperacion): string {
  return '';
}

/** Wrapper for dense casas tables — clip horizontal bleed; page scrolls vertically. */
export const INMUEBLE_DENSE_TABLE_WRAPPER_CLASS = 'w-full';

/** Wide tables scroll in <main>; avoid overflow-x here — it breaks vertical sticky thead. */
export const INMUEBLE_DENSE_TABLE_WRAPPER_EXTRA_COLS_CLASS =
  'w-full max-w-full min-w-0';

/** When extra columns are shown the table is wider than the viewport — scroll instead of squashing. */
export function getInmuebleDenseTableWrapperClass(
  extraColumnsVisible: boolean,
): string {
  return extraColumnsVisible
    ? INMUEBLE_DENSE_TABLE_WRAPPER_EXTRA_COLS_CLASS
    : INMUEBLE_DENSE_TABLE_WRAPPER_CLASS;
}

const EXTRA_MODE_COLUMN_WIDTHS: Partial<
  Record<keyof InmuebleFormData, string>
> = {
  status: '2.5rem',
  nombre_propi: '5rem',
  fecha_entrada_inmueble: '5.5rem',
  foto_espejo: '5.5rem',
  precio: '3.75rem',
  hab: '2rem',
  banos: '2rem',
  metros: '2rem',
  barrio_distrito: '7.5rem',
  distrito_ciudad: '7.5rem',
  larga_estancia_temporada: '2.5rem',
  ficha_del_piso_real: '3.75rem',
  link_idealista_espejo: '3.75rem',
  link_idealista: '3.75rem',
  link_espejo: '3.75rem',
  observaciones: '7rem',
  requisitos_propietario: '7rem',
  ref: '5rem',
  fecha_visitas_entrada: '4.25rem',
  captador_alquilado_por: '3.75rem',
};

export const INMUEBLE_DENSE_ACTIONS_COL_WIDTH = '4.5rem';

export interface InmuebleDenseColOptions {
  extraColumnsVisible?: boolean;
  tipoOperacion?: TipoOperacion;
  ventaPrecioColumnWidth?: string;
}

export function getInmuebleDenseTableClass(extraColumnsVisible: boolean): string {
  if (extraColumnsVisible) {
    return `table-fixed border-separate border-spacing-0 border border-black text-center text-xs md:text-sm`;
  }
  return EXCEL_STICKY_TABLE_CLASS;
}

export function getInmuebleDenseTableStyle(
  fieldKeys: (keyof InmuebleFormData)[],
  extraColumnsVisible: boolean,
  options?: Pick<InmuebleDenseColOptions, 'tipoOperacion' | 'ventaPrecioColumnWidth'>,
): CSSProperties | undefined {
  if (!extraColumnsVisible) return undefined;

  let totalRem = parseFloat(INMUEBLE_DENSE_ACTIONS_COL_WIDTH);
  for (const key of fieldKeys) {
    const width = getInmuebleDenseColWidth(key, true, options);
    if (width) {
      if (width.endsWith('ch')) {
        totalRem += parseFloat(width) * 0.55;
      } else {
        totalRem += parseFloat(width);
      }
    }
  }

  const width = `${totalRem}rem`;
  return { width, minWidth: width };
}

export function getInmuebleDenseColWidth(
  key: keyof InmuebleFormData,
  extraColumnsVisible = false,
  options?: Pick<InmuebleDenseColOptions, 'tipoOperacion' | 'ventaPrecioColumnWidth'>,
): string | undefined {
  if (
    key === 'precio' &&
    options?.tipoOperacion === 'venta' &&
    options.ventaPrecioColumnWidth
  ) {
    return options.ventaPrecioColumnWidth;
  }

  if (extraColumnsVisible) {
    return EXTRA_MODE_COLUMN_WIDTHS[key];
  }

  return undefined;
}

export function getInmuebleDenseColStyle(
  key: keyof InmuebleFormData,
  extraColumnsVisible: boolean,
  options?: Pick<InmuebleDenseColOptions, 'tipoOperacion' | 'ventaPrecioColumnWidth'>,
): { width: string; minWidth: string } | undefined {
  const width = getInmuebleDenseColWidth(key, extraColumnsVisible, options);
  return width ? { width, minWidth: width } : undefined;
}

/** Sticky offset within dashboard <main> (nav is outside the scroll container). */
export const INMUEBLE_STICKY_HEAD_TOP_CLASS = 'top-0';

/** Paints opaque cover above sticky blocks so rows cannot show in <main> top inset. */
export const INMUEBLE_STICKY_SCROLL_MASK_SHADOW =
  'shadow-[0_-100vh_0_100vh_#ffffff]';

/** Below dashboard nav (z-50+) so header menus stay clickable while scrolling. */
export const INMUEBLE_DENSE_STICKY_STACK_CLASS = [
  'sticky top-0 z-30 isolate bg-white',
  INMUEBLE_STICKY_SCROLL_MASK_SHADOW,
  'shadow-[0_4px_8px_-2px_rgba(0,0,0,0.12)]',
].join(' ');

export const INMUEBLE_STICKY_HEAD_SHADOW =
  'shadow-[0_2px_4px_rgba(0,0,0,0.12)]';

export function getInmuebleStickyHeadClass(tipoOperacion: TipoOperacion): string {
  return `sticky top-0 z-40 ${INMUEBLE_STICKY_HEAD_SHADOW} ${INMUEBLE_STICKY_SCROLL_MASK_SHADOW} ${getInmuebleTableHeaderClass(tipoOperacion)}`;
}

export function getInmuebleDenseColClass(
  key: keyof InmuebleFormData,
  options?: InmuebleDenseColOptions,
): string | undefined {
  const extra = options?.extraColumnsVisible;

  if (key === 'status') {
    return STATUS_COL;
  }
  if (key === 'hab' || key === 'banos' || key === 'metros') {
    return LT_COL;
  }
  if (key === 'nombre_propi') {
    return extra ? PROPI_COL_EXTRA : IMAGE_COL_CLASS;
  }
  if (key === 'distrito_ciudad' || key === 'barrio_distrito') {
    return extra ? BARRIO_COL_EXTRA : BARRIO_COL;
  }
  if (key === 'fecha_entrada_inmueble' || key === 'foto_espejo') {
    return extra ? IMAGE_COL_EXTRA : IMAGE_COL_CLASS;
  }
  if (key === 'precio') {
    return options?.tipoOperacion === 'venta' ? VENTA_PRECIO_COL : PRECIO_COL;
  }
  if (key === 'larga_estancia_temporada') return LT_COL;
  if (
    key === 'ficha_del_piso_real' ||
    key === 'link_idealista_espejo' ||
    key === 'link_idealista' ||
    key === 'link_espejo'
  ) {
    return PRECIO_COL;
  }
  if (key === 'observaciones' || key === 'requisitos_propietario') {
    return extra ? OBS_COL_EXTRA : MASKED_TEXT_WIDTH_COL;
  }
  if (key === 'ref') return EXTRA_REF_COL;
  if (key === 'fecha_visitas_entrada') return EXTRA_VISITAS_COL;
  if (key === 'captador_alquilado_por') return EXTRA_CAPT_COL;
  return undefined;
}

export function getInmuebleStickyHeadActionsClass(
  tipoOperacion: TipoOperacion,
): string {
  return `sticky z-40 ${INMUEBLE_STICKY_HEAD_SHADOW} ${getInmuebleTableHeaderClass(tipoOperacion)}`;
}
