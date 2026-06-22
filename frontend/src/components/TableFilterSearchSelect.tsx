'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X } from 'lucide-react';
import { FilterSearchOption } from '@/lib/inmueble-alquiler-filters';

interface TableFilterSearchSelectProps {
  label: string;
  value: string;
  options: FilterSearchOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  emptyOptionLabel?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  accent?: 'blue' | 'emerald';
  className?: string;
}

export function TableFilterSearchSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Todos',
  emptyOptionLabel,
  searchPlaceholder = 'Buscar…',
  disabled,
  accent = 'emerald',
  className = '',
}: TableFilterSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const focusRing =
    accent === 'emerald'
      ? 'focus:border-emerald-500 focus:ring-emerald-500/20'
      : 'focus:border-blue-500 focus:ring-blue-500/20';

  const selected = options.find((option) => option.value === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => {
      const haystack = `${option.label} ${option.sublabel ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [options, query]);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    function updatePosition() {
      const rect = triggerRef.current!.getBoundingClientRect();
      const margin = 8;
      const panelWidth = Math.max(rect.width, 240);
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
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    searchRef.current?.focus();

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  function handleSelect(next: string) {
    onChange(next);
    setOpen(false);
    setQuery('');
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      onChange(query.trim());
      setOpen(false);
      setQuery('');
    }
  }

  const clearOptionLabel = emptyOptionLabel ?? placeholder;

  const dropdown =
    open && mounted ? (
      <div
        ref={panelRef}
        className="fixed z-[200] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
        }}
      >
        <div className="border-b border-slate-100 p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={searchPlaceholder}
              className={`w-full rounded-md border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-900 outline-none focus:ring-2 ${focusRing}`}
            />
          </div>
          <p className="mt-1.5 px-0.5 text-[10px] text-slate-500">
            Pulsa Enter para filtrar por texto libre
          </p>
        </div>

        <ul className="max-h-52 overflow-y-auto py-1" role="listbox">
          <li>
            <button
              type="button"
              onClick={() => handleSelect('')}
              className={`block w-full px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${
                !value ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600'
              }`}
            >
              {clearOptionLabel}
            </button>
          </li>
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-500">
              Sin coincidencias en la lista
            </li>
          ) : (
            filtered.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  onClick={() => handleSelect(option.value)}
                  className={`flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${
                    option.value === value
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'text-slate-900'
                  }`}
                >
                  <span className="font-medium">{option.label}</span>
                  {option.sublabel ? (
                    <span className="text-xs text-slate-500">
                      {option.sublabel}
                    </span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    ) : null;

  return (
    <div className={`min-w-[10rem] flex-1 ${className}`}>
      <p className="mb-1 text-xs font-medium text-slate-600">{label}</p>
      <div ref={rootRef} className="relative">
        <div
          ref={triggerRef}
          className={`flex w-full items-center gap-1 rounded-md border border-slate-300 bg-white outline-none transition hover:bg-slate-50 disabled:opacity-60 ${focusRing}`}
        >
          <button
            type="button"
            disabled={disabled}
            onClick={() => setOpen((prev) => !prev)}
            className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-1.5 text-left text-sm text-slate-900"
            aria-expanded={open}
            aria-haspopup="listbox"
          >
            <span className="min-w-0 flex-1 truncate">
              {value || selected?.label || placeholder}
            </span>
          </button>
          {value ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange('')}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-60"
              aria-label={`Limpiar ${label}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            disabled={disabled}
            onClick={() => setOpen((prev) => !prev)}
            className="px-1.5 py-1.5 text-slate-400 disabled:opacity-60"
            aria-label={`Abrir ${label}`}
          >
            <ChevronDown
              className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>
      {dropdown ? createPortal(dropdown, document.body) : null}
    </div>
  );
}
