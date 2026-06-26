'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X } from 'lucide-react';
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
  searchPlaceholder,
  disabled,
  accent = 'emerald',
  className = '',
}: TableFilterSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const focusRing =
    accent === 'emerald'
      ? 'focus:border-emerald-500 focus:ring-emerald-500/20'
      : 'focus:border-blue-500 focus:ring-blue-500/20';

  const inputPlaceholder = searchPlaceholder ?? placeholder;

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => {
      const haystack = `${option.label} ${option.sublabel ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [options, value]);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    function updatePosition() {
      const rect = triggerRef.current!.getBoundingClientRect();
      const margin = 8;
      const panelWidth = Math.max(rect.width, 240);
      const estimatedHeight = 240;
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

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  function handleSelect(next: string) {
    onChange(next);
    setOpen(false);
    inputRef.current?.focus();
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      setOpen(false);
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
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
          className={`flex w-full items-center gap-1 rounded-md border border-slate-300 bg-white outline-none transition focus-within:ring-2 disabled:opacity-60 ${focusRing}`}
        >
          <input
            ref={inputRef}
            type="search"
            value={value}
            disabled={disabled}
            onChange={(event) => {
              onChange(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleInputKeyDown}
            placeholder={inputPlaceholder}
            className="min-w-0 flex-1 border-0 bg-transparent px-2.5 py-1.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-label={label}
          />
          {value ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                onChange('');
                setOpen(false);
                inputRef.current?.focus();
              }}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-60"
              aria-label={`Limpiar ${label}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setOpen((prev) => !prev);
              inputRef.current?.focus();
            }}
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
