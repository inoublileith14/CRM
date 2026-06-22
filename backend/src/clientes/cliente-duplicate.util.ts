/**
 * Duplicate rule: same phone + same visit/contact day + same property (inmueble).
 * Phone alone, or phone+date on another property, is not a duplicate.
 */

export function normalizeClienteTelefono(
  telefono: string | null | undefined,
): string | null {
  if (!telefono) return null;
  const digits = telefono.replace(/\D/g, '');
  return digits || null;
}

export function clienteContactDateKey(
  fechaContacto: string | null | undefined,
): string | null {
  if (!fechaContacto) return null;
  const d = new Date(fechaContacto);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

/** Composite key: phone | calendar day (UTC) | inmueble id */
export function buildClienteDuplicateKey(
  telefono: string | null | undefined,
  fechaContacto: string | null | undefined,
  inmuebleId: string | null | undefined,
): string | null {
  const phone = normalizeClienteTelefono(telefono);
  const dateKey = clienteContactDateKey(fechaContacto);
  if (!phone || !dateKey || !inmuebleId?.trim()) return null;
  return `${phone}|${dateKey}|${inmuebleId.trim()}`;
}

export function contactDayUtcRange(dateKey: string): {
  dayStart: string;
  dayEnd: string;
} {
  const dayStart = `${dateKey}T00:00:00.000Z`;
  const dayEndDate = new Date(`${dateKey}T00:00:00.000Z`);
  dayEndDate.setUTCDate(dayEndDate.getUTCDate() + 1);
  return { dayStart, dayEnd: dayEndDate.toISOString() };
}
