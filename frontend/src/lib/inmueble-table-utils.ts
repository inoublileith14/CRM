import { getInmuebleAmuebladoShortLabel } from '@/lib/inmueble-amueblado';
import {
  InmuebleFormData,
  TIPO_OPERACION_LABELS,
  type Inmueble,
  type TipoOperacion,
} from '@/types/inmueble';
import { DEFAULT_VENTA_DENSE_ROW_COLOR } from '@/lib/inmueble-status';

/** Default thumbnail when an inmueble has no imagen real / foto espejo. */
export const INMUEBLE_PLACEHOLDER_IMAGE_SRC = '/image_background.jpg';

/** Background behind alquiler property thumbnails (RGB 193, 216, 173). */
export const INMUEBLE_IMAGE_BACKGROUND_ALQUILER = 'rgb(193, 216, 173)';

/** Background behind venta property thumbnails — matches venta row color. */
export const INMUEBLE_IMAGE_BACKGROUND_VENTA = DEFAULT_VENTA_DENSE_ROW_COLOR;

/** @deprecated Use getInmuebleImageBackground */
export const INMUEBLE_IMAGE_BACKGROUND = INMUEBLE_IMAGE_BACKGROUND_ALQUILER;

/** Semi-transparent bar behind address/ref on dense property thumbnails. */
export const INMUEBLE_DENSE_OVERLAY_BAR_CLASS = 'bg-black/55';

/** Text on dense image overlay bars (entrada address, espejo ref, etc.). */
export const INMUEBLE_DENSE_OVERLAY_TEXT_CLASS =
  'font-serif font-bold text-white text-[10px] sm:text-xs leading-snug';

export function getInmuebleImageBackground(
  tipoOperacion: TipoOperacion | null | undefined,
): string {
  return tipoOperacion === 'venta'
    ? INMUEBLE_IMAGE_BACKGROUND_VENTA
    : INMUEBLE_IMAGE_BACKGROUND_ALQUILER;
}

export function resolveInmuebleImageSrc(
  imageUrl: string | null | undefined,
): { src: string; isPlaceholder: boolean } {
  const trimmed = imageUrl?.trim() ?? '';
  if (trimmed && isUrl(trimmed)) {
    return { src: trimmed, isPlaceholder: false };
  }
  return { src: INMUEBLE_PLACEHOLDER_IMAGE_SRC, isPlaceholder: true };
}

/** Scalar inmueble field value safe for table cells. */
export function toInmuebleCellValue(value: unknown): string | number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' || typeof value === 'number') return value;
  return null;
}

/** Display date as dd/mm/yy (e.g. 19/05/26). */
export function formatInmuebleEntradaDate(
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined || value === '') return '—';

  const raw = String(value).trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (iso) {
    const [, year, month, day] = iso;
    return `${day}/${month}/${year.slice(-2)}`;
  }

  const dmy4 = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(raw);
  if (dmy4) {
    const [, day, month, year] = dmy4;
    const pad = (n: string) => n.padStart(2, '0');
    return `${pad(day)}/${pad(month)}/${year.slice(-2)}`;
  }

  const dmy2 = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$/.exec(raw);
  if (dmy2) {
    const [, day, month, year] = dmy2;
    const pad = (n: string) => n.padStart(2, '0');
    return `${pad(day)}/${pad(month)}/${year}`;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${String(parsed.getFullYear()).slice(-2)}`;
  }

  return raw;
}

/** e.g. 3000 → "3.000" (Spanish thousands separator, no decimals). */
export function formatInmueblePrecio(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(value));
}

/** Column width for venta PRECIO — fits header and largest formatted price in the list. */
export function getVentaPrecioColumnWidth(
  inmuebles: ReadonlyArray<{ precio: number | null }>,
): string {
  let maxChars = 6;
  for (const row of inmuebles) {
    if (typeof row.precio === 'number') {
      maxChars = Math.max(maxChars, formatInmueblePrecio(row.precio).length);
    }
  }
  return `${Math.min(12, maxChars + 2)}ch`;
}

export function formatInmuebleCell(
  key: keyof InmuebleFormData,
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined || value === '') return '—';
  if (key === 'fecha_entrada_inmueble' || key === 'fecha_visitas' || key === 'fecha_visitas_entrada') {
    return formatInmuebleEntradaDate(value);
  }
  if (key === 'precio' && typeof value === 'number') {
    return formatInmueblePrecio(value);
  }
  if (key === 'precio_espejo' && typeof value === 'number') {
    return formatInmueblePrecio(value);
  }
  if (key === 'larga_estancia_temporada') {
    return value === 'larga' ? 'Larga' : value === 't' ? 'Temporada' : String(value);
  }
  if (key === 'amueblado') {
    return getInmuebleAmuebladoShortLabel(
      typeof value === 'string' ? value : null,
    );
  }
  if (key === 'status') {
    return value === 'I' || value === 'P' || value === 'I-M'
      ? String(value)
      : '—';
  }
  if (key === 'tipo_operacion' && typeof value === 'string') {
    return TIPO_OPERACION_LABELS[value as keyof typeof TIPO_OPERACION_LABELS] ?? value;
  }
  return String(value);
}

export function formatLargaEstanciaCompact(
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined || value === '') return '—';
  if (value === 'larga') return 'L';
  if (value === 't') return 'T';
  return String(value);
}

export const TIPO_OPERACION_STYLES: Record<string, string> = {
  alquiler: 'bg-sky-100 text-sky-800',
  venta: 'bg-rose-100 text-rose-800',
};

export const STATUS_STYLES: Record<string, string> = {
  I: 'bg-blue-100 text-blue-800',
  P: 'bg-amber-100 text-amber-800',
  'I-M': 'bg-purple-100 text-purple-800',
};

export function isUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

/** Top/bottom overlay labels for dense table property thumbnails. */
export function buildInmuebleDenseImageOverlays(
  inmueble: Inmueble,
  variant: 'entrada' | 'espejo',
): { top: string; bottom: string } {
  if (variant === 'entrada') {
    return {
      top: '',
      bottom: inmueble.direccion_piso_real?.trim() || '—',
    };
  }

  return {
    top:
      inmueble.precio_espejo != null
        ? formatInmuebleCell('precio_espejo', inmueble.precio_espejo)
        : '',
    bottom: inmueble.espejo_direccion?.trim() ?? '',
  };
}
