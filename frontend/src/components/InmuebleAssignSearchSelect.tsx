'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Building2, ChevronDown, Search } from 'lucide-react';
import { useFloatingPanelPosition } from '@/hooks/use-floating-panel-position';
import { Inmueble } from '@/types/inmueble';
import {
  filterInmueblesForAssignSearch,
  getInmuebleAssignLabel,
  getInmuebleAssignSublabel,
  getInmuebleAssignTriggerLabel,
} from '@/lib/inmueble-assign-utils';

interface InmuebleAssignSearchSelectProps {
  inmuebles: Inmueble[];
  value: string;
  onChange: (inmuebleId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  onOpenChange?: (open: boolean) => void;
}

export function InmuebleAssignSearchSelect({
  inmuebles,
  value,
  onChange,
  disabled,
  placeholder = 'Asignar a piso…',
  className = '',
  onOpenChange,
}: InmuebleAssignSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = inmuebles.find((inmueble) => inmueble.id === value) ?? null;

  const filtered = useMemo(
    () => filterInmueblesForAssignSearch(inmuebles, query),
    [inmuebles, query],
  );

  const position = useFloatingPanelPosition({
    open,
    triggerRef,
    panelRef,
    minPanelWidth: 280,
    maxPanelHeight: 320,
    estimatedHeight: 280,
    deps: [filtered.length, query],
  });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
      onOpenChange?.(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        onOpenChange?.(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onOpenChange]);

  function setOpenState(next: boolean) {
    setOpen(next);
    onOpenChange?.(next);
    if (!next) setQuery('');
  }

  function handleSelect(inmuebleId: string) {
    onChange(inmuebleId);
    setOpenState(false);
  }

  const dropdown =
    open && mounted ? (
      <div
        ref={panelRef}
        className="fixed z-[200] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
          maxHeight: 'min(320px, calc(100vh - 1rem))',
        }}
      >
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
                    <span className="font-medium leading-snug">{label}</span>
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
    ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpenState(!open)}
        className={`flex w-full items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm text-slate-900 outline-none transition hover:bg-slate-50 disabled:opacity-60 sm:min-w-[14rem] sm:w-auto ${className}`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
        <span className="min-w-0 flex-1 truncate">
          {selected ? getInmuebleAssignTriggerLabel(selected) : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {dropdown ? createPortal(dropdown, document.body) : null}
    </>
  );
}
