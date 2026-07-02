/**
 * Duplicate rule: phone + visit/contact day + property (inmueble).
 * Same phone on another property or another date is allowed.
 */

/** Normaliza teléfono para comparar duplicados (solo dígitos). */
export function normalizeClienteTelefono(
  telefono: string | null | undefined,
): string | null {
  if (!telefono) return null;
  const digits = telefono.replace(/\D/g, '');
  return digits || null;
}

function contactDateKey(
  fechaContacto: string | null | undefined,
): string | null {
  if (!fechaContacto) return null;
  const d = new Date(fechaContacto);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

/** Clave única teléfono + fecha (día UTC) + inmueble. */
export function getClienteDuplicateKey(
  telefono: string | null | undefined,
  fechaContacto: string | null | undefined,
  inmuebleId: string | null | undefined,
): string | null {
  const phone = normalizeClienteTelefono(telefono);
  const dateKey = contactDateKey(fechaContacto);
  if (!phone || !dateKey || !inmuebleId?.trim()) return null;
  return `${phone}|${dateKey}|${inmuebleId.trim()}`;
}

/** Todas las claves de duplicado de un cliente (una por inmueble vinculado). */
export function getClienteDuplicateKeys(
  telefono: string | null | undefined,
  fechaContacto: string | null | undefined,
  inmuebleIds: string[] | null | undefined,
): string[] {
  if (!inmuebleIds?.length) return [];
  const keys = inmuebleIds
    .map((id) => getClienteDuplicateKey(telefono, fechaContacto, id))
    .filter((key): key is string => key != null);
  return [...new Set(keys)];
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

export function pickUniqueClienteIdsFromLinkRows(
  rows: {
    cliente: { id: string; telefono: string | null | undefined };
    inmueble_id: string | null;
  }[],
  targetInmuebleId?: string,
): string[] {
  const byId = new Map<string, ClienteTelefonoRef>();
  for (const row of rows) {
    if (!byId.has(row.cliente.id)) {
      byId.set(row.cliente.id, {
        id: row.cliente.id,
        telefono: row.cliente.telefono,
      });
    }
  }

  const preferClienteIds = targetInmuebleId
    ? rows
        .filter((row) => row.inmueble_id === targetInmuebleId)
        .map((row) => row.cliente.id)
    : undefined;

  return pickUniqueClienteIdsByTelefono([...byId.values()], {
    preferClienteIds,
  });
}
