'use client';

import type { CSSProperties } from 'react';
import {
  INMUEBLE_PISO_CODIGO_LEGEND_ITEMS,
  type InmueblePisoCodigo,
} from '@/lib/inmueble-status';

interface PisoCodigoLegendSwitchProps {
  color: string;
  label: string;
  active: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

function PisoCodigoLegendSwitch({
  color,
  label,
  active,
  disabled,
  onToggle,
}: PisoCodigoLegendSwitchProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      aria-pressed={active}
      title={
        active
          ? `${label} — clic para ocultar`
          : `${label} — clic para mostrar solo este estado`
      }
      className="flex items-center gap-2 rounded-md px-1 py-0.5 transition hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span
        className={`relative flex h-5 w-[2.35rem] shrink-0 items-center rounded-full border border-black/10 shadow-sm transition ${
          active ? '' : 'opacity-45 grayscale'
        }`}
        style={{ backgroundColor: color }}
        aria-hidden
      >
        <span
          className={`absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white shadow transition-all ${
            active ? 'right-0.5' : 'left-0.5'
          }`}
        />
      </span>
      <span
        className={`text-xs font-medium ${
          active ? 'text-slate-700' : 'text-slate-400'
        }`}
      >
        {label}
      </span>
    </button>
  );
}

interface InmueblePisoCodigoLegendProps {
  selected: InmueblePisoCodigo[];
  onToggle: (codigo: InmueblePisoCodigo) => void;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  align?: 'start' | 'end';
}

export function InmueblePisoCodigoLegend({
  selected,
  onToggle,
  disabled,
  className = '',
  style,
  align = 'end',
}: InmueblePisoCodigoLegendProps) {
  const selectedSet = new Set(selected);

  return (
    <div
      className={`px-3 py-1.5 sm:px-4 ${className}`.trim()}
      style={style}
      role="group"
      aria-label="Filtrar por estado del piso"
    >
      <div
        className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 ${
          align === 'end' ? 'justify-end' : 'justify-start'
        }`}
      >
        {INMUEBLE_PISO_CODIGO_LEGEND_ITEMS.map((item) => (
          <PisoCodigoLegendSwitch
            key={item.codigo}
            color={item.color}
            label={item.label}
            active={selectedSet.has(item.codigo)}
            disabled={disabled}
            onToggle={() => onToggle(item.codigo)}
          />
        ))}
      </div>
    </div>
  );
}
