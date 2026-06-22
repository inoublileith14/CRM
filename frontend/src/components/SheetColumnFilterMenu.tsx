'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Filter } from 'lucide-react';
import {
  BLANK_FILTER_VALUE,
  ColumnFilterFieldType,
  ColumnFilterState,
  NumberConditionOp,
  SortDirection,
  TextConditionOp,
  isColumnFilterActive,
} from '@/lib/table-column-filters';

const TEXT_CONDITION_OPTIONS: { value: TextConditionOp; label: string }[] = [
  { value: 'contains', label: 'Contiene' },
  { value: 'not_contains', label: 'No contiene' },
  { value: 'equals', label: 'Es igual a' },
  { value: 'not_equals', label: 'No es igual a' },
  { value: 'starts_with', label: 'Empieza por' },
  { value: 'ends_with', label: 'Termina en' },
  { value: 'is_empty', label: 'Está vacío' },
  { value: 'is_not_empty', label: 'No está vacío' },
];

const NUMBER_CONDITION_OPTIONS: { value: NumberConditionOp; label: string }[] = [
  { value: 'eq', label: 'Es igual a' },
  { value: 'neq', label: 'No es igual a' },
  { value: 'gt', label: 'Mayor que' },
  { value: 'gte', label: 'Mayor o igual que' },
  { value: 'lt', label: 'Menor que' },
  { value: 'lte', label: 'Menor o igual que' },
  { value: 'is_empty', label: 'Está vacío' },
  { value: 'is_not_empty', label: 'No está vacío' },
];

interface SheetColumnFilterMenuProps {
  columnLabel: string;
  fieldType: ColumnFilterFieldType;
  uniqueValues: string[];
  filter: ColumnFilterState | undefined;
  sortDirection: SortDirection | null;
  isSortColumn: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (filter: ColumnFilterState | undefined) => void;
  onSort: (direction: SortDirection) => void;
  iconClassName?: string;
}

function needsConditionValue(
  op: TextConditionOp | NumberConditionOp | undefined,
): boolean {
  return op !== 'is_empty' && op !== 'is_not_empty' && op !== undefined;
}

function buildDraft(
  filter: ColumnFilterState | undefined,
  uniqueValues: string[],
): ColumnFilterState {
  if (filter) {
    return {
      allowedValues:
        filter.allowedValues === null
          ? [...uniqueValues]
          : [...filter.allowedValues],
      textCondition: filter.textCondition
        ? { ...filter.textCondition }
        : undefined,
      numberCondition: filter.numberCondition
        ? { ...filter.numberCondition }
        : undefined,
    };
  }
  return { allowedValues: [...uniqueValues] };
}

export function SheetColumnFilterMenu({
  columnLabel,
  fieldType,
  uniqueValues,
  filter,
  sortDirection,
  isSortColumn,
  isOpen,
  onOpenChange,
  onApply,
  onSort,
  iconClassName,
}: SheetColumnFilterMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<ColumnFilterState>(() =>
    buildDraft(filter, uniqueValues),
  );
  const [valueSearch, setValueSearch] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  const active = isColumnFilterActive(filter);
  const textOp = draft.textCondition?.op;
  const numberOp = draft.numberCondition?.op;
  const conditionNeedsValue =
    fieldType === 'number'
      ? needsConditionValue(numberOp)
      : needsConditionValue(textOp);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isOpen) {
      setDraft(buildDraft(filter, uniqueValues));
      setValueSearch('');
    }
  }, [isOpen, filter, uniqueValues]);

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    function updatePosition() {
      const rect = triggerRef.current!.getBoundingClientRect();
      const panelWidth = 300;
      const margin = 8;
      let left = rect.left;
      let top = rect.bottom + 4;

      if (left + panelWidth > window.innerWidth - margin) {
        left = window.innerWidth - panelWidth - margin;
      }
      if (left < margin) left = margin;

      const maxHeight = 420;
      if (top + maxHeight > window.innerHeight - margin) {
        top = Math.max(margin, rect.top - maxHeight - 4);
      }

      setPosition({ top, left });
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        panelRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      onOpenChange(false);
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onOpenChange(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onOpenChange]);

  const filteredUniqueValues = uniqueValues.filter((value) =>
    value.toLowerCase().includes(valueSearch.toLowerCase()),
  );

  const allowedSet = new Set(draft.allowedValues ?? []);
  const allVisibleSelected =
    filteredUniqueValues.length > 0 &&
    filteredUniqueValues.every((v) => allowedSet.has(v));
  const someVisibleSelected = filteredUniqueValues.some((v) =>
    allowedSet.has(v),
  );

  function toggleValue(value: string) {
    setDraft((prev) => {
      const current = new Set(prev.allowedValues ?? uniqueValues);
      if (current.has(value)) current.delete(value);
      else current.add(value);
      return { ...prev, allowedValues: [...current] };
    });
  }

  function toggleSelectAllVisible() {
    setDraft((prev) => {
      const current = new Set(prev.allowedValues ?? uniqueValues);
      if (allVisibleSelected) {
        for (const v of filteredUniqueValues) current.delete(v);
      } else {
        for (const v of filteredUniqueValues) current.add(v);
      }
      return { ...prev, allowedValues: [...current] };
    });
  }

  function handleClear() {
    onApply(undefined);
    onOpenChange(false);
  }

  function handleApply() {
    const allSelected =
      draft.allowedValues !== null &&
      draft.allowedValues.length === uniqueValues.length &&
      uniqueValues.every((v) => draft.allowedValues!.includes(v));

    const next: ColumnFilterState = {
      allowedValues: allSelected ? null : draft.allowedValues,
      textCondition: draft.textCondition,
      numberCondition: draft.numberCondition,
    };

    const hasCondition =
      !!next.textCondition?.op || !!next.numberCondition?.op;
    const hasValueFilter =
      next.allowedValues !== null &&
      (next.allowedValues.length === 0 ||
        next.allowedValues.length < uniqueValues.length);

    if (!hasCondition && !hasValueFilter) {
      onApply(undefined);
    } else {
      onApply(next);
    }
    onOpenChange(false);
  }

  function handleSort(direction: SortDirection) {
    onSort(direction);
    onOpenChange(false);
  }

  const sortAscLabel =
    fieldType === 'number' || fieldType === 'date'
      ? 'Ordenar de menor a mayor'
      : 'Ordenar A → Z';
  const sortDescLabel =
    fieldType === 'number' || fieldType === 'date'
      ? 'Ordenar de mayor a menor'
      : 'Ordenar Z → A';

  const panel = isOpen ? (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={`Filtro: ${columnLabel}`}
      className="fixed z-[100] flex max-h-[min(420px,calc(100vh-1rem))] w-[min(300px,calc(100vw-1rem))] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white text-left text-sm normal-case shadow-xl"
      style={{ top: position.top, left: position.left }}
    >
      <div className="shrink-0 border-b border-slate-100 p-1">
        <button
          type="button"
          onClick={() => handleSort('asc')}
          className={`flex w-full rounded-md px-3 py-2 text-left text-slate-700 hover:bg-slate-50 ${
            isSortColumn && sortDirection === 'asc' ? 'bg-emerald-50 font-medium text-emerald-800' : ''
          }`}
        >
          {sortAscLabel}
        </button>
        <button
          type="button"
          onClick={() => handleSort('desc')}
          className={`flex w-full rounded-md px-3 py-2 text-left text-slate-700 hover:bg-slate-50 ${
            isSortColumn && sortDirection === 'desc' ? 'bg-emerald-50 font-medium text-emerald-800' : ''
          }`}
        >
          {sortDescLabel}
        </button>
      </div>

      <div className="shrink-0 border-b border-slate-100 px-3 py-2">
        <p className="mb-1.5 text-xs font-semibold text-slate-500">
          Filtrar por condición
        </p>
        {fieldType === 'number' ? (
          <div className="space-y-2">
            <select
              value={numberOp ?? ''}
              onChange={(e) => {
                const op = e.target.value as NumberConditionOp | '';
                setDraft((prev) => ({
                  ...prev,
                  numberCondition: op
                    ? {
                        op,
                        value: prev.numberCondition?.value ?? '',
                      }
                    : undefined,
                  textCondition: undefined,
                }));
              }}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Ninguna</option>
              {NUMBER_CONDITION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {conditionNeedsValue && (
              <input
                type="number"
                value={draft.numberCondition?.value ?? ''}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    numberCondition: {
                      op: prev.numberCondition!.op,
                      value: e.target.value,
                    },
                  }))
                }
                placeholder="Valor"
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <select
              value={textOp ?? ''}
              onChange={(e) => {
                const op = e.target.value as TextConditionOp | '';
                setDraft((prev) => ({
                  ...prev,
                  textCondition: op
                    ? { op, value: prev.textCondition?.value ?? '' }
                    : undefined,
                  numberCondition: undefined,
                }));
              }}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Ninguna</option>
              {TEXT_CONDITION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {conditionNeedsValue && (
              <input
                type={fieldType === 'date' ? 'date' : 'text'}
                value={draft.textCondition?.value ?? ''}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    textCondition: {
                      op: prev.textCondition!.op,
                      value: e.target.value,
                    },
                  }))
                }
                placeholder="Valor"
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            )}
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-3 py-2">
        <p className="mb-1.5 shrink-0 text-xs font-semibold text-slate-500">
          Filtrar por valores
        </p>
        <input
          type="search"
          value={valueSearch}
          onChange={(e) => setValueSearch(e.target.value)}
          placeholder="Buscar valores…"
          className="mb-2 shrink-0 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <label className="mb-1 flex shrink-0 cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-slate-50">
          <input
            type="checkbox"
            checked={allVisibleSelected}
            ref={(el) => {
              if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected;
            }}
            onChange={toggleSelectAllVisible}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="font-medium text-slate-700">Seleccionar todo</span>
        </label>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {filteredUniqueValues.length === 0 ? (
            <p className="py-2 text-xs text-slate-400">Sin coincidencias</p>
          ) : (
            filteredUniqueValues.map((value) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={allowedSet.has(value)}
                  onChange={() => toggleValue(value)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span
                  className={`truncate ${
                    value === BLANK_FILTER_VALUE
                      ? 'italic text-slate-400'
                      : 'text-slate-700'
                  }`}
                  title={value}
                >
                  {value}
                </span>
              </label>
            ))
          )}
        </div>
      </div>

      <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 bg-slate-50 px-3 py-2">
        <button
          type="button"
          onClick={handleClear}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
        >
          Borrar filtro
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          Aceptar
        </button>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenChange(!isOpen);
        }}
        className={
          iconClassName ??
          `ml-1 inline-flex shrink-0 rounded p-0.5 transition hover:bg-emerald-700/60 ${
            active || (isSortColumn && sortDirection)
              ? 'text-amber-200'
              : 'text-emerald-200/80'
          }`
        }
        title={`Filtrar ${columnLabel}`}
        aria-label={`Filtrar ${columnLabel}`}
        aria-expanded={isOpen}
      >
        <Filter className="h-3.5 w-3.5" fill={active ? 'currentColor' : 'none'} />
      </button>
      {mounted && panel ? createPortal(panel, document.body) : null}
    </>
  );
}
