import { getClienteEntradaSortKey, getClienteCalendarDateKey } from '@/lib/cliente-date-utils';
import {
  ClienteGestionEstado,
  normalizeClienteGestionEstado,
} from '@/lib/cliente-gestion-estado';
import { Cliente } from '@/types/cliente';
import { InmuebleClienteLinkRow } from '@/types/inmueble-cliente-link';
import { TipoOperacion } from '@/types/inmueble';

export const INMUEBLE_CLIENTE_UNASSIGNED_WORKER = '__unassigned__';

export interface InmuebleClienteFilters {
  search: string;
  gestion_estado: ClienteGestionEstado | '';
  worker_id: string;
  /** `YYYY-MM-DD` — filter clients whose última gestión is on this day. */
  fecha_ultima_gestion: string;
}

export const EMPTY_INMUEBLE_CLIENTE_FILTERS: InmuebleClienteFilters = {
  search: '',
  gestion_estado: '',
  worker_id: '',
  fecha_ultima_gestion: '',
};

export type InmuebleClienteFechaSort = 'asc' | 'desc' | null;

export function hasActiveInmuebleClienteFilters(
  filters: InmuebleClienteFilters,
  fechaSort: InmuebleClienteFechaSort,
): boolean {
  return (
    filters.search.trim() !== '' ||
    filters.gestion_estado !== '' ||
    filters.worker_id !== '' ||
    filters.fecha_ultima_gestion.trim() !== '' ||
    fechaSort !== null
  );
}

function normalizePhoneDigits(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

export function filterInmuebleClientes(
  clientes: Cliente[],
  filters: InmuebleClienteFilters,
  tipoOperacion: TipoOperacion,
): Cliente[] {
  const search = filters.search.trim().toLowerCase();
  const searchDigits = normalizePhoneDigits(search);

  return clientes.filter((cliente) => {
    if (filters.gestion_estado) {
      const estado = normalizeClienteGestionEstado(
        cliente.gestion_estado,
        tipoOperacion,
      );
      if (estado !== filters.gestion_estado) return false;
    }

    if (filters.worker_id) {
      const workerIds = cliente.workers?.map((worker) => worker.id) ?? [];
      if (filters.worker_id === INMUEBLE_CLIENTE_UNASSIGNED_WORKER) {
        if (workerIds.length > 0) return false;
      } else if (!workerIds.includes(filters.worker_id)) {
        return false;
      }
    }

    const fechaUltimaFilter = filters.fecha_ultima_gestion.trim();
    if (fechaUltimaFilter) {
      const clienteFecha = getClienteCalendarDateKey(cliente.fecha_ultima_gestion);
      if (clienteFecha !== fechaUltimaFilter) return false;
    }

    if (!search) return true;

    const name = cliente.nombre?.toLowerCase() ?? '';
    const nameMatch = name.includes(search);
    if (nameMatch) return true;

    if (searchDigits.length === 0) return false;

    const phoneDigits = normalizePhoneDigits(cliente.telefono);
    return phoneDigits.includes(searchDigits);
  });
}

export function sortInmuebleClientesByFechaContacto(
  clientes: Cliente[],
  direction: 'asc' | 'desc',
): Cliente[] {
  const mult = direction === 'asc' ? 1 : -1;

  return clientes
    .map((cliente, index) => ({
      cliente,
      index,
      key: getClienteEntradaSortKey(cliente.fecha_contacto),
    }))
    .sort((a, b) => {
      if (a.key !== b.key) return (a.key - b.key) * mult;
      return a.index - b.index;
    })
    .map(({ cliente }) => cliente);
}

export function sortInmuebleClienteLinkRowsByEntrada(
  rows: InmuebleClienteLinkRow[],
  direction: 'asc' | 'desc',
): InmuebleClienteLinkRow[] {
  const mult = direction === 'asc' ? 1 : -1;

  return rows
    .map((row, index) => ({
      row,
      index,
      key: getClienteEntradaSortKey(row.cliente.fecha_contacto),
    }))
    .sort((a, b) => {
      if (a.key !== b.key) return (a.key - b.key) * mult;
      return a.index - b.index;
    })
    .map(({ row }) => row);
}

export function applyInmuebleClienteListFilters(
  clientes: Cliente[],
  filters: InmuebleClienteFilters,
  tipoOperacion: TipoOperacion,
  fechaSort: InmuebleClienteFechaSort,
): Cliente[] {
  const filtered = filterInmuebleClientes(clientes, filters, tipoOperacion);
  if (!fechaSort) return filtered;
  return sortInmuebleClientesByFechaContacto(filtered, fechaSort);
}
