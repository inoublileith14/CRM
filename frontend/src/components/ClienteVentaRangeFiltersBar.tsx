'use client';

import { VentaRangeFilters } from '@/lib/cliente-venta-range-filters';

interface ClienteVentaRangeFiltersBarProps {
  filters: VentaRangeFilters;
  onChange: (filters: VentaRangeFilters) => void;
  onClear: () => void;
  disabled?: boolean;
  hasActiveFilters: boolean;
  accent?: 'blue' | 'emerald';
}

interface RangeFilterGroupProps {
  label: string;
  minValue: string;
  maxValue: string;
  minPlaceholder?: string;
  maxPlaceholder?: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  disabled?: boolean;
  budget?: boolean;
  compact?: boolean;
  focusRingClass: string;
}

function RangeFilterGroup({
  label,
  minValue,
  maxValue,
  minPlaceholder = 'Mín',
  maxPlaceholder = 'Máx',
  onMinChange,
  onMaxChange,
  disabled,
  budget,
  compact,
  focusRingClass,
}: RangeFilterGroupProps) {
  const inputClass = compact
    ? `w-14 min-w-0 rounded-md border border-slate-300 bg-white px-1.5 py-1.5 text-sm text-slate-900 outline-none transition focus:ring-2 ${focusRingClass} disabled:opacity-60 sm:w-16`
    : `w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none transition focus:ring-2 ${focusRingClass} disabled:opacity-60`;

  return (
    <div className={compact ? 'shrink-0' : 'min-w-[9.5rem] flex-1'}>
      <p className="mb-1 text-xs font-medium text-slate-600">{label}</p>
      <div className="flex gap-1.5">
        <input
          type={budget ? 'text' : 'number'}
          inputMode={budget ? 'decimal' : 'numeric'}
          min={budget ? undefined : 0}
          value={minValue}
          onChange={(e) => onMinChange(e.target.value)}
          placeholder={budget ? `${minPlaceholder} (k)` : minPlaceholder}
          disabled={disabled}
          className={inputClass}
          aria-label={`${label} mínimo`}
        />
        <input
          type={budget ? 'text' : 'number'}
          inputMode={budget ? 'decimal' : 'numeric'}
          min={budget ? undefined : 0}
          value={maxValue}
          onChange={(e) => onMaxChange(e.target.value)}
          placeholder={budget ? `${maxPlaceholder} (k)` : maxPlaceholder}
          disabled={disabled}
          className={inputClass}
          aria-label={`${label} máximo`}
        />
      </div>
    </div>
  );
}

export function ClienteVentaRangeFiltersBar({
  filters,
  onChange,
  onClear,
  disabled,
  hasActiveFilters,
  accent = 'blue',
}: ClienteVentaRangeFiltersBarProps) {
  const focusRingClass =
    accent === 'emerald'
      ? 'focus:border-emerald-500 focus:ring-emerald-500/20'
      : 'focus:border-blue-500 focus:ring-blue-500/20';
  const clearButtonClass =
    accent === 'emerald'
      ? 'text-emerald-700 hover:text-emerald-600'
      : 'text-blue-700 hover:text-blue-600';

  function patch(partial: Partial<VentaRangeFilters>) {
    onChange({ ...filters, ...partial });
  }

  return (
    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Filtros por rango
        </p>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            className={`text-xs font-medium disabled:opacity-60 ${clearButtonClass}`}
          >
            Limpiar filtros
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-3">
        <RangeFilterGroup
          label="Presupuesto máximo"
          minValue={filters.presupuesto_maximo_min}
          maxValue={filters.presupuesto_maximo_max}
          onMinChange={(presupuesto_maximo_min) =>
            patch({ presupuesto_maximo_min })
          }
          onMaxChange={(presupuesto_maximo_max) =>
            patch({ presupuesto_maximo_max })
          }
          disabled={disabled}
          budget
          focusRingClass={focusRingClass}
        />
        <RangeFilterGroup
          label="Presupuesto de petición"
          minValue={filters.presupuesto_peticion_min}
          maxValue={filters.presupuesto_peticion_max}
          onMinChange={(presupuesto_peticion_min) =>
            patch({ presupuesto_peticion_min })
          }
          onMaxChange={(presupuesto_peticion_max) =>
            patch({ presupuesto_peticion_max })
          }
          disabled={disabled}
          budget
          focusRingClass={focusRingClass}
        />
        <RangeFilterGroup
          label="Habitaciones"
          minValue={filters.habitaciones_min}
          maxValue={filters.habitaciones_max}
          onMinChange={(habitaciones_min) => patch({ habitaciones_min })}
          onMaxChange={(habitaciones_max) => patch({ habitaciones_max })}
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
        <div className="min-w-[10rem] flex-1">
          <p className="mb-1 text-xs font-medium text-slate-600">Zona</p>
          <input
            type="text"
            value={filters.zona}
            onChange={(e) => patch({ zona: e.target.value })}
            placeholder="Buscar zona…"
            disabled={disabled}
            className={`w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none transition focus:ring-2 ${focusRingClass} disabled:opacity-60`}
            aria-label="Filtrar por zona"
          />
        </div>
      </div>
    </div>
  );
}
