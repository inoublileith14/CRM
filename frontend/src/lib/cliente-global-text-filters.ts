import { InmuebleClienteLinkRow } from '@/types/inmueble-cliente-link';

export interface ClienteGlobalTextFilters {
  nombre: string;
  telefono: string;
  ref_cliente: string;
}

export const EMPTY_CLIENTE_GLOBAL_TEXT_FILTERS: ClienteGlobalTextFilters = {
  nombre: '',
  telefono: '',
  ref_cliente: '',
};

function normalizePhoneDigits(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

export function hasActiveClienteGlobalTextFilters(
  filters: ClienteGlobalTextFilters,
): boolean {
  return (
    (filters.nombre ?? '').trim() !== '' ||
    (filters.telefono ?? '').trim() !== '' ||
    (filters.ref_cliente ?? '').trim() !== ''
  );
}

export function filterClienteLinkRowsByText(
  rows: InmuebleClienteLinkRow[],
  filters: ClienteGlobalTextFilters,
): InmuebleClienteLinkRow[] {
  const nombreQuery = (filters.nombre ?? '').trim().toLowerCase();
  const phoneDigits = normalizePhoneDigits((filters.telefono ?? '').trim());
  const refQuery = (filters.ref_cliente ?? '').trim().toLowerCase();

  if (!nombreQuery && phoneDigits.length === 0 && !refQuery) {
    return rows;
  }

  return rows.filter((row) => {
    if (nombreQuery) {
      const name = row.cliente.nombre?.toLowerCase() ?? '';
      if (!name.includes(nombreQuery)) return false;
    }

    if (phoneDigits.length > 0) {
      const rowDigits = normalizePhoneDigits(row.cliente.telefono);
      if (!rowDigits.includes(phoneDigits)) return false;
    }

    if (refQuery) {
      const ref = row.cliente.ref_cliente?.toLowerCase() ?? '';
      if (!ref.includes(refQuery)) return false;
    }

    return true;
  });
}
