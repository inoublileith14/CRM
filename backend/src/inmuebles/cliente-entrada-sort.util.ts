const CLIENTE_ENTRADA_DEFAULT_MONTHS = 2;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function getDefaultClienteEntradaIso(referenceDate = new Date()): string {
  const local = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  local.setMonth(local.getMonth() - CLIENTE_ENTRADA_DEFAULT_MONTHS);
  return `${local.getFullYear()}-${pad2(local.getMonth() + 1)}-${pad2(local.getDate())}T00:00:00.000Z`;
}

export function resolveClienteEntradaIso(
  fechaContacto: string | null | undefined,
): string {
  if (fechaContacto?.trim()) {
    const parsed = new Date(fechaContacto);
    if (!Number.isNaN(parsed.getTime())) {
      return fechaContacto;
    }
  }
  return getDefaultClienteEntradaIso();
}

/** YYYYMMDD integer for stable calendar-day sorting. */
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
