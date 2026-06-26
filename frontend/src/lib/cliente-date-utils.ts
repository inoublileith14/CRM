export const CLIENTE_ENTRADA_DEFAULT_MONTHS = 2;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Subtract full calendar months, keeping the day when possible. */
export function subtractCalendarMonths(date: Date, months: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setMonth(result.getMonth() - months);
  return result;
}

/** ISO date (UTC midnight) for today minus the default entrada offset. */
export function getDefaultClienteEntradaIso(referenceDate = new Date()): string {
  const local = subtractCalendarMonths(
    referenceDate,
    CLIENTE_ENTRADA_DEFAULT_MONTHS,
  );
  return `${local.getFullYear()}-${pad2(local.getMonth() + 1)}-${pad2(local.getDate())}T00:00:00.000Z`;
}

/** Stored fecha_contacto or the default entrada date when missing. */
export function resolveClienteEntradaIso(
  fechaContacto: string | null | undefined,
): string {
  if (fechaContacto) {
    const parsed = new Date(fechaContacto);
    if (!Number.isNaN(parsed.getTime())) {
      return fechaContacto;
    }
  }
  return getDefaultClienteEntradaIso();
}

export function formatClienteEntradaDate(
  fechaContacto: string | null | undefined,
): string {
  const iso = resolveClienteEntradaIso(fechaContacto);
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'short' }).format(d);
}

export function isDefaultClienteEntradaDate(
  fechaContacto: string | null | undefined,
): boolean {
  return !fechaContacto?.trim();
}

export function getClienteEntradaSortKey(
  fechaContacto: string | null | undefined,
): number {
  const iso = resolveClienteEntradaIso(fechaContacto);
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return (
      Number(match[1]) * 10_000 +
      Number(match[2]) * 100 +
      Number(match[3])
    );
  }

  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** Full calendar months elapsed from an ISO date until today. */
export function monthsSinceDate(isoDate: string | null | undefined): number | null {
  const resolved = resolveClienteEntradaIso(isoDate);
  const entrada = new Date(resolved);
  if (Number.isNaN(entrada.getTime())) return null;

  const today = new Date();
  let months =
    (today.getFullYear() - entrada.getFullYear()) * 12 +
    (today.getMonth() - entrada.getMonth());

  if (today.getDate() < entrada.getDate()) {
    months -= 1;
  }

  return Math.max(0, months);
}
export function formatMonthsSinceEntrada(
  isoDate: string | null | undefined,
  compact = false,
): string | null {
  const months = monthsSinceDate(isoDate);
  if (months === null) return null;

  if (compact) {
    return `${months}M`;
  }

  if (months === 0) return '<1 mes';
  if (months === 1) return '1 mes';
  return `${months} meses`;
}

export function formatEntradaElapsedLabel(isoDate: string | null | undefined): string | null {
  const months = monthsSinceDate(isoDate);
  if (months === null) return null;

  if (months === 0) return 'Hace menos de 1 mes';
  if (months === 1) return 'Hace 1 mes';
  return `Hace ${months} meses`;
}

/** `YYYY-MM-DD` calendar key for an ISO timestamp (UTC date part when present). */
export function getClienteCalendarDateKey(
  isoDate: string | null | undefined,
): string | null {
  if (!isoDate?.trim()) return null;
  const match = isoDate.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
