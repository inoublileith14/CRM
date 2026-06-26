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
  { value: '#ffffff', label: 'Blanco' },
];

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

export function resolveInmuebleRowColor(
  rowColor: string | null | undefined,
  tipoOperacion?: TipoOperacion,
): string | null {
  const normalized = normalizeRowColor(rowColor);
  if (normalized) return normalized;
  if (tipoOperacion === 'venta') return DEFAULT_VENTA_DENSE_ROW_COLOR;
  if (tipoOperacion === 'alquiler') return DEFAULT_DENSE_ROW_COLOR;
  return null;
}

export function getInmuebleRowStyle(
  rowColor: string | null | undefined,
  tipoOperacion?: TipoOperacion,
): { backgroundColor?: string } {
  const resolved = resolveInmuebleRowColor(rowColor, tipoOperacion);
  return resolved ? { backgroundColor: resolved } : {};
}
