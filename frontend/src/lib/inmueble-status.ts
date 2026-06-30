import type { Inmueble, TipoOperacion } from '@/types/inmueble';

export type InmuebleStatus = NonNullable<Inmueble['status']>;

export type InmuebleStatusOption = {
  value: InmuebleStatus | null;
  label: string;
};

export const INMUEBLE_STATUS_OPTIONS: InmuebleStatusOption[] = [
  { value: 'I', label: 'I' },
  { value: 'P', label: 'P' },
  { value: 'I-M', label: 'I-M' },
  { value: null, label: '—' },
];

export const INMUEBLE_STATUS_DISPLAY_LABELS: Record<InmuebleStatus, string> = {
  P: 'PUBLICADO',
  I: 'INTERNO',
  'I-M': 'INTERNO EN MADRID',
};

export function formatInmuebleStatusDisplay(
  value: Inmueble['status'],
): string {
  if (!value) return '—';
  return INMUEBLE_STATUS_DISPLAY_LABELS[value] ?? '—';
}

/** Default row background for dense alquiler tables when no custom color is set. */
export const DEFAULT_DENSE_ROW_COLOR = '#c1d8ad';

/** Default row background for dense venta tables when no custom color is set. */
export const DEFAULT_VENTA_DENSE_ROW_COLOR = '#A4C2F4';

/** @deprecated Use DEFAULT_DENSE_ROW_COLOR */
export const DEFAULT_ALQUILER_ROW_COLOR = DEFAULT_DENSE_ROW_COLOR;

export const INMUEBLE_ROW_COLOR_PRESETS: Array<{
  value: string;
  label: string;
}> = [
  { value: '#ffff00', label: 'Amarillo' },
  { value: '#8b00ff', label: 'Morado' },
  { value: '#00ffff', label: 'Cian' },
  { value: '#c1d8ad', label: 'Verde claro' },
  { value: '#fff2cc', label: 'Amarillo suave' },
  { value: '#ddebf7', label: 'Azul claro' },
  { value: '#f2f2f2', label: 'Gris' },
  { value: '#ffa500', label: 'Naranja' },
];

/** Auto-highlight new CRM entries (matches preset amarillo). */
export const INMUEBLE_ENTRADA_HIGHLIGHT_COLOR = '#ffff00';

/** Days the entrada highlight stays yellow (entrada day + 2 more = 3 days). */
export const INMUEBLE_ENTRADA_HIGHLIGHT_DAYS = 3;

export function getInmuebleStatusOption(
  value: Inmueble['status'],
): InmuebleStatusOption {
  return (
    INMUEBLE_STATUS_OPTIONS.find((option) => option.value === value) ??
    INMUEBLE_STATUS_OPTIONS[INMUEBLE_STATUS_OPTIONS.length - 1]
  );
}

export function normalizeRowColor(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseInmuebleEntradaLocalDate(value: string): Date | null {
  const raw = value.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (iso) {
    return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  }

  const dmy4 = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(raw);
  if (dmy4) {
    return new Date(Number(dmy4[3]), Number(dmy4[2]) - 1, Number(dmy4[1]));
  }

  const dmy2 = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$/.exec(raw);
  if (dmy2) {
    const yy = Number(dmy2[3]);
    const year = yy >= 70 ? 1900 + yy : 2000 + yy;
    return new Date(year, Number(dmy2[2]) - 1, Number(dmy2[1]));
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return startOfLocalDay(parsed);
}

export function isInmuebleWithinEntradaHighlightWindow(
  fechaEntradaInmueble: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!fechaEntradaInmueble?.trim()) return false;

  const entrada = parseInmuebleEntradaLocalDate(fechaEntradaInmueble);
  if (!entrada) return false;

  const diffDays = Math.floor(
    (startOfLocalDay(now).getTime() - startOfLocalDay(entrada).getTime()) /
      (24 * 60 * 60 * 1000),
  );

  return diffDays >= 0 && diffDays < INMUEBLE_ENTRADA_HIGHLIGHT_DAYS;
}

function isManualRowColorOverride(rowColor: string | null): boolean {
  return Boolean(rowColor);
}

export function getInmuebleDefaultRowColor(
  tipoOperacion?: TipoOperacion,
): string {
  if (tipoOperacion === 'venta') return DEFAULT_VENTA_DENSE_ROW_COLOR;
  return DEFAULT_DENSE_ROW_COLOR;
}

/** BCN uses manual/auto row color; all other dense cells use entrada CRM 3-day yellow window. */
export function getInmuebleDenseBodyCellBackground(
  fieldKey: keyof InmuebleFormData | 'actions',
  rowColor: string | null | undefined,
  tipoOperacion: TipoOperacion | undefined,
  fechaEntradaInmueble: string | null | undefined,
): string {
  const defaultBg = getInmuebleDefaultRowColor(tipoOperacion);

  if (fieldKey === 'status') {
    return (
      resolveInmuebleRowColor(rowColor, tipoOperacion, fechaEntradaInmueble) ??
      defaultBg
    );
  }

  if (isInmuebleWithinEntradaHighlightWindow(fechaEntradaInmueble)) {
    return INMUEBLE_ENTRADA_HIGHLIGHT_COLOR;
  }

  return defaultBg;
}

export function resolveInmuebleRowColor(
  rowColor: string | null | undefined,
  tipoOperacion?: TipoOperacion,
  fechaEntradaInmueble?: string | null,
): string | null {
  const normalized = normalizeRowColor(rowColor);

  if (isManualRowColorOverride(normalized)) {
    return normalized;
  }

  if (isInmuebleWithinEntradaHighlightWindow(fechaEntradaInmueble)) {
    return INMUEBLE_ENTRADA_HIGHLIGHT_COLOR;
  }

  if (tipoOperacion === 'venta') return DEFAULT_VENTA_DENSE_ROW_COLOR;
  if (tipoOperacion === 'alquiler') return DEFAULT_DENSE_ROW_COLOR;
  return null;
}

export function getInmuebleRowStyle(
  rowColor: string | null | undefined,
  tipoOperacion?: TipoOperacion,
  fechaEntradaInmueble?: string | null,
): { backgroundColor?: string } {
  const resolved = resolveInmuebleRowColor(
    rowColor,
    tipoOperacion,
    fechaEntradaInmueble,
  );
  return resolved ? { backgroundColor: resolved } : {};
}
