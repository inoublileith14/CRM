'use client';

import { CSSProperties, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Filter } from 'lucide-react';
import { useFloatingPanelPosition } from '@/hooks/use-floating-panel-position';
import {
  CLIENTE_ENTRADA_PREVISTA_OPTIONS,
  ClienteEntradaPrevista,
} from '@/lib/cliente-entrada-prevista';
import { formatTableHeaderLabel } from '@/lib/table-header-label';
import {
  EXCEL_CELL_BORDER,
  TABLE_HEAD_PADDING_DENSE,
  TABLE_HEAD_TEXT_CLASS,
} from '@/lib/excel-table-styles';

type EntradaPrevistaFilterAccent = 'emerald' | 'blue';

interface TableColumnEntradaPrevistaFilterHeadProps {
  label: string;
  shortLabel?: string;
  selected: ClienteEntradaPrevista[];
  isOpen: boolean;
  isFilterActive: boolean;
  onOpenChange: (open: boolean) => void;
  onToggle: (value: ClienteEntradaPrevista) => void;
  onClear: () => void;
  accent?: EntradaPrevistaFilterAccent;
  style?: CSSProperties;
  className?: string;
  labelClassName?: string;
}

const ACCENT_STYLES: Record<
  EntradaPrevistaFilterAccent,
  { button: string; filterActive: string; filterIdle: string }
> = {
  emerald: {
    button: 'bg-emerald-600 hover:bg-emerald-500',
    filterActive: 'text-emerald-600',
    filterIdle: 'text-slate-400',
  },
  blue: {
    button: 'bg-blue-700 hover:bg-blue-600',
    filterActive: 'text-blue-700',
    filterIdle: 'text-slate-400',
  },
};

export function TableColumnEntradaPrevistaFilterHead({
  label,
  shortLabel,
  selected,
  isOpen,
  isFilterActive,
  onOpenChange,
  onToggle,
  onClear,
  accent = 'emerald',
  style,
  className = '',
  labelClassName = '',
}: TableColumnEntradaPrevistaFilterHeadProps) {
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const selectedSet = new Set(selected);
  const position = useFloatingPanelPosition({
    open: isOpen,
    triggerRef,
    panelRef,
    panelWidth: 200,
    estimatedHeight: CLIENTE_ENTRADA_PREVISTA_OPTIONS.length * 32 + 72,
  });
  const accentStyles = ACCENT_STYLES[accent];

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      onOpenChange(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onOpenChange(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onOpenChange]);

  const displayLabel = formatTableHeaderLabel(shortLabel ?? label);
  const titleLabel = formatTableHeaderLabel(label);

  const panel =
    isOpen && mounted ? (
      <div
        ref={panelRef}
        role="dialog"
        aria-label={`Filtrar por ${titleLabel}`}
        className="fixed z-[200] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
        }}
      >
        <div className="border-b border-slate-200 px-3 py-2">
          <p className="text-xs font-semibold text-slate-800">{titleLabel}</p>
        </div>

        <ul className="max-h-56 overflow-y-auto py-1">
          {CLIENTE_ENTRADA_PREVISTA_OPTIONS.map((option) => (
            <li key={option.value}>
              <label className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={selectedSet.has(option.value)}
                  onChange={() => onToggle(option.value)}
                  className="rounded border-slate-300 text-slate-700 focus:ring-slate-400"
                />
                <span>{option.label}</span>
              </label>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2">
          <button
            type="button"
            onClick={onClear}
            className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            Mostrar todos
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold text-white transition ${accentStyles.button}`}
          >
            Cerrar
          </button>
        </div>
      </div>
    ) : null;

  return (
    <>
      <th
        style={style}
        className={`whitespace-normal ${TABLE_HEAD_TEXT_CLASS} text-slate-600 ${TABLE_HEAD_PADDING_DENSE} text-center ${EXCEL_CELL_BORDER} ${className}`}
      >
        <div className="flex w-full items-center justify-center gap-0.5 px-0.5">
          <span
            className={`break-words leading-tight ${labelClassName}`}
            title={titleLabel}
          >
            {displayLabel}
          </span>
          <button
            ref={triggerRef}
            type="button"
            onClick={() => onOpenChange(!isOpen)}
            className="inline-flex shrink-0 items-center justify-center rounded p-0.5 transition hover:bg-slate-200/80"
            aria-expanded={isOpen}
            aria-haspopup="dialog"
            title={`Filtrar: ${titleLabel}`}
          >
            <Filter
              className={`h-3 w-3 shrink-0 ${
                isFilterActive
                  ? accentStyles.filterActive
                  : accentStyles.filterIdle
              }`}
              aria-hidden
            />
          </button>
        </div>
      </th>
      {panel ? createPortal(panel, document.body) : null}
    </>
  );
}
