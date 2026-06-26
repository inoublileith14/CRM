'use client';

import { useMemo } from 'react';
import { CalendarRange } from 'lucide-react';
import { DEFAULT_VENTA_DENSE_ROW_COLOR } from '@/lib/inmueble-status';
import {
  buildPropietarioFilterOptions,
  buildRefFilterOptions,
  InmuebleAlquilerFilters,
} from '@/lib/inmueble-alquiler-filters';
import { TableFilterSearchSelect } from '@/components/TableFilterSearchSelect';
import { Inmueble, TipoOperacion } from '@/types/inmueble';

interface InmuebleAlquilerFiltersBarProps {
  inmuebles: Inmueble[];
  filters: InmuebleAlquilerFilters;
  onChange: (filters: InmuebleAlquilerFilters) => void;
  onClear: () => void;
  disabled?: boolean;
  hasActiveFilters: boolean;
  tipoOperacion?: TipoOperacion;
}

interface RangeFilterGroupProps {
  label: string;
  minValue: string;
  maxValue: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  disabled?: boolean;
  compact?: boolean;
  focusRingClass: string;
}

function RangeFilterGroup({
  label,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  disabled,
  compact,
  focusRingClass,
}: RangeFilterGroupProps) {
  const inputClass = compact
    ? `w-14 min-w-0 rounded-md border border-slate-300 bg-white px-1.5 py-1 text-sm text-slate-900 outline-none transition ${focusRingClass} disabled:opacity-60 sm:w-16`
    : `w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 outline-none transition ${focusRingClass} disabled:opacity-60`;

  return (
    <div className={compact ? 'shrink-0' : 'w-[9.5rem] shrink-0'}>
      <p className="mb-1 text-xs font-medium text-slate-600">{label}</p>
      <div className="flex gap-1.5">
        <input
          type="text"
          inputMode="decimal"
          value={minValue}
          onChange={(event) => onMinChange(event.target.value)}
          placeholder="Mín"
          disabled={disabled}
          className={inputClass}
          aria-label={`${label} mínimo`}
        />
        <input
          type="text"
          inputMode="decimal"
          value={maxValue}
          onChange={(event) => onMaxChange(event.target.value)}
          placeholder="Máx"
          disabled={disabled}
          className={inputClass}
          aria-label={`${label} máximo`}
        />
      </div>
    </div>
  );
}

export function InmuebleAlquilerFiltersBar({
  inmuebles,
  filters,
  onChange,
  onClear,
  disabled,
  hasActiveFilters,
  tipoOperacion = 'alquiler',
}: InmuebleAlquilerFiltersBarProps) {
  const isVenta = tipoOperacion === 'venta';
  const focusRingClass = isVenta
    ? 'focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20'
    : 'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20';
  const clearButtonClass = isVenta
    ? 'text-slate-700 hover:text-slate-600'
    : 'text-emerald-700 hover:text-emerald-600';
  const selectAccent = isVenta ? 'blue' : 'emerald';

  const refOptions = useMemo(
    () => buildRefFilterOptions(inmuebles),
    [inmuebles],
  );
  const propietarioOptions = useMemo(
    () => buildPropietarioFilterOptions(inmuebles),
    [inmuebles],
  );

  function patch(partial: Partial<InmuebleAlquilerFilters>) {
    onChange({ ...filters, ...partial });
  }

  return (
    <div
      className="px-3 py-2 sm:px-4"
      style={
        isVenta ? { backgroundColor: DEFAULT_VENTA_DENSE_ROW_COLOR } : undefined
      }
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-end gap-2">
          <TableFilterSearchSelect
            label="Buscar referencias"
            value={filters.ref}
            options={refOptions}
            onChange={(ref) => patch({ ref })}
            placeholder="Buscar referencia…"
            emptyOptionLabel="Todas las referencias"
            disabled={disabled}
            accent={selectAccent}
            className="w-[10rem] shrink-0"
          />
          <TableFilterSearchSelect
            label="Propietario / teléfono"
            value={filters.propietario}
            options={propietarioOptions}
            onChange={(propietario) => patch({ propietario })}
            placeholder="Todos los propietarios"
            searchPlaceholder="Nombre o teléfono…"
            disabled={disabled}
            accent={selectAccent}
            className="w-[11rem] shrink-0"
          />
          <div className="w-[12rem] shrink-0">
            <p className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-600">
              <CalendarRange className="h-3.5 w-3.5" />
              Fecha entrada
            </p>
            <div className="flex gap-1.5">
              <input
                type="date"
                value={filters.fecha_entrada_desde}
                onChange={(event) =>
                  patch({ fecha_entrada_desde: event.target.value })
                }
                disabled={disabled}
                className={`min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-1.5 py-1 text-sm text-slate-900 outline-none transition ${focusRingClass} disabled:opacity-60`}
                aria-label="Fecha entrada desde"
              />
              <input
                type="date"
                value={filters.fecha_entrada_hasta}
                onChange={(event) =>
                  patch({ fecha_entrada_hasta: event.target.value })
                }
                disabled={disabled}
                className={`min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-1.5 py-1 text-sm text-slate-900 outline-none transition ${focusRingClass} disabled:opacity-60`}
                aria-label="Fecha entrada hasta"
              />
            </div>
          </div>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onClear}
              disabled={disabled}
              className={`shrink-0 self-end rounded-md px-2 py-1 text-xs font-medium disabled:opacity-60 ${clearButtonClass}`}
            >
              Limpiar
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <RangeFilterGroup
            label="Precio (€)"
            minValue={filters.precio_min}
            maxValue={filters.precio_max}
            onMinChange={(precio_min) => patch({ precio_min })}
            onMaxChange={(precio_max) => patch({ precio_max })}
            disabled={disabled}
            focusRingClass={focusRingClass}
          />
          <RangeFilterGroup
            label="Habitaciones"
            minValue={filters.hab_min}
            maxValue={filters.hab_max}
            onMinChange={(hab_min) => patch({ hab_min })}
            onMaxChange={(hab_max) => patch({ hab_max })}
            disabled={disabled}
            compact
            focusRingClass={focusRingClass}
          />
          <RangeFilterGroup
            label="Baños"
            minValue={filters.banos_min}
            maxValue={filters.banos_max}
            onMinChange={(banos_min) => patch({ banos_min })}
            onMaxChange={(banos_max) => patch({ banos_max })}
            disabled={disabled}
            compact
            focusRingClass={focusRingClass}
          />
          <RangeFilterGroup
            label="Metros"
            minValue={filters.metros_min}
            maxValue={filters.metros_max}
            onMinChange={(metros_min) => patch({ metros_min })}
            onMaxChange={(metros_max) => patch({ metros_max })}
            disabled={disabled}
            compact
            focusRingClass={focusRingClass}
          />
          <div className="w-[10rem] shrink-0">
            <p className="mb-1 text-xs font-medium text-slate-600">Zona</p>
            <input
              type="text"
              value={filters.zona}
              onChange={(event) => patch({ zona: event.target.value })}
              placeholder="Dirección o barrio…"
              disabled={disabled}
              className={`w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 outline-none transition ${focusRingClass} disabled:opacity-60`}
              aria-label="Filtrar por dirección o barrio"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
