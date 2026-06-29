'use client';

import {
  EMPTY_INMUEBLE_CLIENTE_FILTERS,
  INMUEBLE_CLIENTE_UNASSIGNED_WORKER,
  InmuebleClienteFilters,
} from '@/lib/inmueble-cliente-filters';
import { ClienteGestionEstadoFilterSelect } from '@/components/ClienteGestionEstadoFilterSelect';
import { TipoOperacion } from '@/types/inmueble';
import { Worker, getWorkerRolLabel } from '@/types/worker';

interface InmuebleClienteFiltersBarProps {
  filters: InmuebleClienteFilters;
  onChange: (filters: InmuebleClienteFilters) => void;
  onClear: () => void;
  tipoOperacion: TipoOperacion;
  workers: Worker[];
  hasActiveFilters: boolean;
  disabled?: boolean;
  compact?: boolean;
}

export function InmuebleClienteFiltersBar({
  filters,
  onChange,
  onClear,
  tipoOperacion,
  workers,
  hasActiveFilters,
  disabled,
  compact = false,
}: InmuebleClienteFiltersBarProps) {
  const focusRingClass =
    tipoOperacion === 'alquiler'
      ? 'focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20'
      : 'focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20';
  const clearButtonClass =
    tipoOperacion === 'alquiler'
      ? 'text-emerald-700 hover:text-emerald-600'
      : 'text-blue-700 hover:text-blue-600';
  const inputClass = compact
    ? `h-7 min-w-0 shrink rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900 outline-none transition disabled:opacity-60 ${focusRingClass}`
    : `min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:ring-2 disabled:opacity-60 ${focusRingClass}`;

  function patch(partial: Partial<InmuebleClienteFilters>) {
    onChange({ ...filters, ...partial });
  }

  return (
    <div
      className={
        compact
          ? 'flex min-w-0 flex-1 flex-wrap items-center justify-start gap-1'
          : 'flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center'
      }
    >
      <input
        type="search"
        value={filters.search ?? ''}
        onChange={(e) => patch({ search: e.target.value })}
        placeholder={compact ? 'Nombre o tel.' : 'Buscar nombre o teléfono…'}
        disabled={disabled}
        className={compact ? `w-[7.5rem] sm:w-28 ${inputClass}` : `w-full sm:w-52 ${inputClass}`}
        aria-label="Buscar por nombre o teléfono"
      />
      <ClienteGestionEstadoFilterSelect
        value={filters.gestion_estado}
        onChange={(gestion_estado) => patch({ gestion_estado })}
        tipoOperacion={tipoOperacion}
        disabled={disabled}
        compact={compact}
      />
      <select
        value={filters.worker_id}
        onChange={(e) => patch({ worker_id: e.target.value })}
        disabled={disabled}
        className={compact ? `max-w-[6.5rem] sm:max-w-[7.5rem] ${inputClass}` : `w-full sm:w-52 ${inputClass}`}
        aria-label="Filtrar por trabajador"
        title={compact ? 'Filtrar por trabajador' : undefined}
      >
        <option value="">{compact ? 'Trabajador' : 'Todos los trabajadores'}</option>
        <option value={INMUEBLE_CLIENTE_UNASSIGNED_WORKER}>Sin asignar</option>
        {workers.map((worker) => (
          <option key={worker.id} value={worker.id}>
            {compact
              ? worker.nombre
              : `${worker.nombre} (${getWorkerRolLabel(worker.rol)})`}
          </option>
        ))}
      </select>
      {hasActiveFilters ? (
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className={`shrink-0 font-medium disabled:opacity-60 ${
            compact ? `text-xs ${clearButtonClass}` : `text-sm ${clearButtonClass}`
          }`}
        >
          {compact ? 'Limpiar' : 'Limpiar filtros'}
        </button>
      ) : null}
    </div>
  );
}

export { EMPTY_INMUEBLE_CLIENTE_FILTERS };
