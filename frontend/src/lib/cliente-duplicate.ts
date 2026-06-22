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
