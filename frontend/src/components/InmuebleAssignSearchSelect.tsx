'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, ChevronDown, Search } from 'lucide-react';
import { Inmueble } from '@/types/inmueble';
import {
  filterInmueblesForAssignSearch,
  getInmuebleAssignLabel,
  getInmuebleAssignSublabel,
} from '@/lib/inmueble-assign-utils';

interface InmuebleAssignSearchSelectProps {
  inmuebles: Inmueble[];
  value: string;
  onChange: (inmuebleId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function InmuebleAssignSearchSelect({
  inmuebles,
  value,
  onChange,
  disabled,
  placeholder = 'Asignar a piso…',
  className = '',
}: InmuebleAssignSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = inmuebles.find((inmueble) => inmueble.id === value) ?? null;

  const filtered = useMemo(
    () => filterInmueblesForAssignSearch(inmuebles, query),
    [inmuebles, query],
  );

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
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

  function handleSelect(inmuebleId: string) {
    onChange(inmuebleId);
    setOpen(false);
    setQuery('');
  }

  return (
    <div ref={rootRef} className={`relative w-full sm:w-auto sm:min-w-[14rem] ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm text-slate-900 outline-none transition hover:bg-slate-50 disabled:opacity-60"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
        <span className="min-w-0 flex-1 truncate">
          {selected ? getInmuebleAssignLabel(selected) : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por referencia o precio…"
                className="w-full rounded-md border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <ul
            className="max-h-60 overflow-y-auto py-1"
            role="listbox"
            aria-label="Pisos"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-sm text-slate-500">
                No se encontraron pisos
              </li>
            ) : (
              filtered.map((inmueble) => {
                const label = getInmuebleAssignLabel(inmueble);
                const sublabel = getInmuebleAssignSublabel(inmueble);
                const isSelected = inmueble.id === value;

                return (
                  <li key={inmueble.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(inmueble.id)}
                      className={`flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${
                        isSelected ? 'bg-blue-50 text-blue-800' : 'text-slate-900'
                      }`}
                    >
                      <span className="font-medium">{label}</span>
                      {sublabel ? (
                        <span className="text-xs text-slate-500">{sublabel}</span>
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
