/**
 * Format stored phone for WhatsApp Cloud API `to` field (digits only, no +).
 */
export function formatWhatsAppRecipient(
  telefono: string | null | undefined,
): string | null {
  if (!telefono) return null;
  const digits = telefono.replace(/\D/g, '');
  if (!digits) return null;

  if (/^[67]\d{8}$/.test(digits)) {
    return `34${digits}`;
  }

  return digits;
}
