import { getClienteEntradaSortKey, getClienteCalendarDateKey } from '@/lib/cliente-date-utils';
import {
  ClienteGestionEstado,
  normalizeClienteGestionEstado,
} from '@/lib/cliente-gestion-estado';
import { clienteMatchesPhoneSearch } from '@/lib/cliente-telefonos';
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
  /** `YYYY-MM-DD` — filter clients whose fecha de petición is on this day. */
  fecha_contacto: string;
}

export const EMPTY_INMUEBLE_CLIENTE_FILTERS: InmuebleClienteFilters = {
  search: '',
  gestion_estado: '',
  worker_id: '',
  fecha_ultima_gestion: '',
  fecha_contacto: '',
};

/** Guard against partial objects from persisted table state (shallow merge). */
export function normalizeInmuebleClienteFilters(
  filters: Partial<InmuebleClienteFilters> | undefined | null,
): InmuebleClienteFilters {
  return {
    ...EMPTY_INMUEBLE_CLIENTE_FILTERS,
    ...filters,
    search: filters?.search ?? '',
    gestion_estado: filters?.gestion_estado ?? '',
    worker_id: filters?.worker_id ?? '',
    fecha_ultima_gestion: filters?.fecha_ultima_gestion ?? '',
    fecha_contacto: filters?.fecha_contacto ?? '',
  };
}

export type InmuebleClienteFechaSort = 'asc' | 'desc' | null;

export function hasActiveInmuebleClienteFilters(
  filters: InmuebleClienteFilters,
  fechaContactoSort: InmuebleClienteFechaSort,
  fechaUltimaGestionSort: InmuebleClienteFechaSort = null,
): boolean {
  const normalized = normalizeInmuebleClienteFilters(filters);
  return (
    normalized.search.trim() !== '' ||
    normalized.gestion_estado !== '' ||
    normalized.worker_id !== '' ||
    normalized.fecha_ultima_gestion.trim() !== '' ||
    normalized.fecha_contacto.trim() !== '' ||
    fechaContactoSort !== null ||
    fechaUltimaGestionSort !== null
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
  const normalized = normalizeInmuebleClienteFilters(filters);
  const search = normalized.search.trim().toLowerCase();
  const searchDigits = normalizePhoneDigits(search);

  return clientes.filter((cliente) => {
    if (normalized.gestion_estado) {
      const estado = normalizeClienteGestionEstado(
        cliente.gestion_estado,
        tipoOperacion,
      );
      if (estado !== normalized.gestion_estado) return false;
    }

    if (normalized.worker_id) {
      const workerIds = cliente.workers?.map((worker) => worker.id) ?? [];
      if (normalized.worker_id === INMUEBLE_CLIENTE_UNASSIGNED_WORKER) {
        if (workerIds.length > 0) return false;
      } else if (!workerIds.includes(normalized.worker_id)) {
        return false;
      }
    }

    const fechaUltimaFilter = normalized.fecha_ultima_gestion.trim();
    if (fechaUltimaFilter) {
      const clienteFecha = getClienteCalendarDateKey(cliente.fecha_ultima_gestion);
      if (clienteFecha !== fechaUltimaFilter) return false;
    }

    const fechaContactoFilter = normalized.fecha_contacto.trim();
    if (fechaContactoFilter) {
      const clienteFecha = getClienteCalendarDateKey(cliente.fecha_contacto);
      if (clienteFecha !== fechaContactoFilter) return false;
    }

    if (!search) return true;

    const name = cliente.nombre?.toLowerCase() ?? '';
    const nameMatch = name.includes(search);
    if (nameMatch) return true;

    if (searchDigits.length === 0) return false;

    return clienteMatchesPhoneSearch(cliente, searchDigits);
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

function getClienteFechaUltimaGestionSortKey(
  fechaUltimaGestion: string | null | undefined,
): number {
  const key = getClienteCalendarDateKey(fechaUltimaGestion);
  if (!key) return 0;
  const match = key.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return 0;
  return (
    Number(match[1]) * 10_000 +
    Number(match[2]) * 100 +
    Number(match[3])
  );
}

export function sortInmuebleClientesByFechaUltimaGestion(
  clientes: Cliente[],
  direction: 'asc' | 'desc',
): Cliente[] {
  const mult = direction === 'asc' ? 1 : -1;

  return clientes
    .map((cliente, index) => ({
      cliente,
      index,
      key: getClienteFechaUltimaGestionSortKey(cliente.fecha_ultima_gestion),
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
  fechaContactoSort: InmuebleClienteFechaSort,
  fechaUltimaGestionSort: InmuebleClienteFechaSort = null,
): Cliente[] {
  let result = filterInmuebleClientes(clientes, filters, tipoOperacion);
  if (fechaContactoSort) {
    result = sortInmuebleClientesByFechaContacto(result, fechaContactoSort);
  }
  if (fechaUltimaGestionSort) {
    result = sortInmuebleClientesByFechaUltimaGestion(
      result,
      fechaUltimaGestionSort,
    );
  }
  return result;
}
