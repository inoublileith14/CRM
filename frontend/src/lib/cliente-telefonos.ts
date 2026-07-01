import { Cliente } from '@/types/cliente';

export function normalizeClienteTelefonosExtra(
  value: string[] | null | undefined,
): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
}

export function getClientePhones(cliente: {
  telefono?: string | null;
  telefonos_extra?: string[] | null;
}): string[] {
  const primary = cliente.telefono?.trim() ?? '';
  const extras = normalizeClienteTelefonosExtra(cliente.telefonos_extra);
  if (!primary) return extras;
  return [primary, ...extras];
}

export function splitClientePhones(phones: string[]): {
  telefono: string | null;
  telefonos_extra: string[];
} {
  const cleaned = phones
    .map((phone) => phone.trim())
    .filter(Boolean);
  return {
    telefono: cleaned[0] ?? null,
    telefonos_extra: cleaned.slice(1),
  };
}

export function formatClientePhonesDisplay(cliente: Cliente): string {
  const phones = getClientePhones(cliente);
  if (phones.length === 0) return '—';
  if (phones.length <= 2) return phones.join(' / ');
  return `${phones.slice(0, 2).join(' / ')} +${phones.length - 2}`;
}

export function clienteMatchesPhoneSearch(
  cliente: {
    telefono?: string | null;
    telefonos_extra?: string[] | null;
  },
  searchDigits: string,
): boolean {
  if (!searchDigits) return false;
  return getClientePhones(cliente).some((phone) =>
    phone.replace(/\D/g, '').includes(searchDigits),
  );
}
