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

export interface ClienteTelefonoRef {
  id: string;
  telefono: string | null | undefined;
}

/** One cliente per normalized phone when bulk-assigning to an inmueble. */
export function pickUniqueClienteIdsByTelefono(
  clientes: ClienteTelefonoRef[],
  options?: { preferClienteIds?: Iterable<string> },
): string[] {
  const prefer = options?.preferClienteIds
    ? new Set(options.preferClienteIds)
    : null;
  const seenIds = new Set<string>();
  const byPhone = new Map<string, string>();
  const withoutPhone: string[] = [];

  for (const cliente of clientes) {
    if (seenIds.has(cliente.id)) continue;
    seenIds.add(cliente.id);

    const phone = normalizeClienteTelefono(cliente.telefono);
    if (!phone) {
      withoutPhone.push(cliente.id);
      continue;
    }

    const existingId = byPhone.get(phone);
    if (!existingId) {
      byPhone.set(phone, cliente.id);
      continue;
    }

    if (prefer?.has(cliente.id) && !prefer.has(existingId)) {
      byPhone.set(phone, cliente.id);
    }
  }

  return [...withoutPhone, ...byPhone.values()];
}
