'use client';

import { CSSProperties, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Filter } from 'lucide-react';
import {
  BLANK_FILTER_VALUE,
  ColumnFilterState,
} from '@/lib/table-column-filters';
import { formatTableHeaderLabel } from '@/lib/table-header-label';
import { EXCEL_CELL_BORDER, TABLE_HEAD_PADDING_DENSE } from '@/lib/excel-table-styles';

interface InmuebleDenseSimpleFilterHeadProps {
  label: string;
  shortLabel?: string;
  uniqueValues: string[];
  filter: ColumnFilterState | undefined;
  isOpen: boolean;
  isFilterActive: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (filter: ColumnFilterState | undefined) => void;
  style?: CSSProperties;
  className?: string;
  labelClassName?: string;
}

function formatFilterValue(value: string): string {
  return value === BLANK_FILTER_VALUE ? '(Vacío)' : value;
}

function getDraftSelection(
  filter: ColumnFilterState | undefined,
  uniqueValues: string[],
): Set<string> {
  if (!filter?.allowedValues || filter.allowedValues.length === 0) {
    return new Set(uniqueValues);
  }
  return new Set(filter.allowedValues);
}

export function InmuebleDenseSimpleFilterHead({
  label,
  shortLabel,
  uniqueValues,
  filter,
  isOpen,
  isFilterActive,
  onOpenChange,
  onApply,
  style,
  className = '',
  labelClassName = '',
}: InmuebleDenseSimpleFilterHeadProps) {
  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState<Set<string>>(() =>
    getDraftSelection(filter, uniqueValues),
  );
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    setDraft(getDraftSelection(filter, uniqueValues));
  }, [isOpen, filter, uniqueValues]);

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    function updatePosition() {
      const rect = triggerRef.current!.getBoundingClientRect();
      const margin = 8;
      const panelWidth = 220;
      const estimatedHeight = 280;
      const spaceBelow = window.innerHeight - rect.bottom - margin;
      const spaceAbove = rect.top - margin;
      const openUp = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

      let top = openUp ? rect.top - estimatedHeight - 4 : rect.bottom + 4;
      top = Math.max(margin, Math.min(top, window.innerHeight - margin - 48));

      let left = rect.left;
      if (left + panelWidth > window.innerWidth - margin) {
        left = window.innerWidth - panelWidth - margin;
      }
      if (left < margin) left = margin;

      setPosition({ top, left, width: panelWidth });
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, uniqueValues.length]);

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

  const allSelected =
    uniqueValues.length > 0 && uniqueValues.every((value) => draft.has(value));
  const someSelected = uniqueValues.some((value) => draft.has(value));

  function toggleValue(value: string) {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  function toggleAll() {
    setDraft(allSelected ? new Set() : new Set(uniqueValues));
  }

  function handleClear() {
    setDraft(new Set(uniqueValues));
    onApply(undefined);
    onOpenChange(false);
  }

  function handleApply() {
    if (draft.size === 0) {
      onApply({ allowedValues: [] });
    } else if (draft.size === uniqueValues.length) {
      onApply(undefined);
    } else {
      onApply({ allowedValues: [...draft] });
    }
    onOpenChange(false);
  }

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

        <div className="max-h-56 overflow-y-auto px-3 py-2">
          <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 text-sm text-slate-800 hover:bg-slate-50">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected && !allSelected;
              }}
              onChange={toggleAll}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="font-medium">Seleccionar todo</span>
          </label>

          {uniqueValues.map((value) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 text-sm text-slate-800 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={draft.has(value)}
                onChange={() => toggleValue(value)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className={value === BLANK_FILTER_VALUE ? 'italic text-slate-500' : ''}>
                {formatFilterValue(value)}
              </span>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2">
          <button
            type="button"
            onClick={handleClear}
            className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            Borrar filtro
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="rounded-md bg-[#007a55] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#006847]"
          >
            Aceptar
          </button>
        </div>
      </div>
    ) : null;

  return (
    <>
      <th
        style={style}
        className={`text-center ${TABLE_HEAD_PADDING_DENSE} ${EXCEL_CELL_BORDER} ${className}`}
      >
        <div className="flex min-h-[3.25rem] w-full items-center justify-center gap-1 px-0.5 py-1">
          <span
            className={`whitespace-nowrap leading-none ${labelClassName}`}
            title={titleLabel}
          >
            {displayLabel}
          </span>
          <button
            ref={triggerRef}
            type="button"
            onClick={() => onOpenChange(!isOpen)}
            className="inline-flex shrink-0 items-center justify-center rounded p-0.5 transition hover:bg-black/10"
            aria-expanded={isOpen}
            aria-haspopup="dialog"
            title={`Filtrar: ${titleLabel}`}
          >
            <Filter
              className={`h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3 ${
                isFilterActive ? 'text-yellow-300' : 'text-white/75'
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

