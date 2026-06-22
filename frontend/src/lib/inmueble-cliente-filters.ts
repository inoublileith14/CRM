import { resolveClienteEntradaIso } from '@/lib/cliente-date-utils';
import {
  ClienteGestionEstado,
  normalizeClienteGestionEstado,
} from '@/lib/cliente-gestion-estado';
import { Cliente } from '@/types/cliente';
import { TipoOperacion } from '@/types/inmueble';

export const INMUEBLE_CLIENTE_UNASSIGNED_WORKER = '__unassigned__';

export interface InmuebleClienteFilters {
  search: string;
  gestion_estado: ClienteGestionEstado | '';
  worker_id: string;
}

export const EMPTY_INMUEBLE_CLIENTE_FILTERS: InmuebleClienteFilters = {
  search: '',
  gestion_estado: '',
  worker_id: '',
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

  return [...clientes].sort((a, b) => {
    const da = new Date(resolveClienteEntradaIso(a.fecha_contacto)).getTime();
    const db = new Date(resolveClienteEntradaIso(b.fecha_contacto)).getTime();
    if (Number.isNaN(da) && Number.isNaN(db)) return 0;
    if (Number.isNaN(da)) return 1 * mult;
    if (Number.isNaN(db)) return -1 * mult;
    return (da - db) * mult;
  });
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
