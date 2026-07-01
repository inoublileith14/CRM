'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useFloatingPanelPosition } from '@/hooks/use-floating-panel-position';
import {
  filterBarrioOptions,
  filterDistritoOptions,
  findDistritoForBarrio,
} from '@/lib/barcelona-zonas';

interface BarcelonaZonaComboboxProps {
  kind: 'barrio' | 'distrito';
  value: string;
  onChange: (value: string) => void;
  /** Fired when user picks a catalog barrio (parent distrito included). */
  onBarrioPick?: (barrio: string, distrito: string) => void;
  disabled?: boolean;
  compact?: boolean;
  denseTable?: boolean;
  accent?: 'emerald' | 'blue';
  placeholder?: string;
  className?: string;
  onBlur?: () => void;
  'aria-label'?: string;
}

export function BarcelonaZonaCombobox({
  kind,
  value,
  onChange,
  onBarrioPick,
  disabled,
  compact,
  denseTable,
  accent = 'blue',
  placeholder,
  className,
  onBlur,
  'aria-label': ariaLabel,
}: BarcelonaZonaComboboxProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);

  const options =
    kind === 'barrio'
      ? filterBarrioOptions(value)
      : filterDistritoOptions(value);

  const visibleOptions = options.slice(0, 12);

  const position = useFloatingPanelPosition({
    open,
    triggerRef: inputRef,
    panelRef,
    minPanelWidth: 180,
    estimatedHeight: 192,
    maxPanelHeight: 240,
    deps: [value, kind, visibleOptions.length],
  });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setHighlightIndex(0);
  }, [value, kind]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  function pickOption(option: string) {
    onChange(option);
    if (kind === 'barrio') {
      const distrito = findDistritoForBarrio(option);
      if (distrito) onBarrioPick?.(option, distrito);
    }
    setOpen(false);
    inputRef.current?.blur();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightIndex((i) =>
        visibleOptions.length === 0 ? 0 : (i + 1) % visibleOptions.length,
      );
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightIndex((i) =>
        visibleOptions.length === 0
          ? 0
          : (i - 1 + visibleOptions.length) % visibleOptions.length,
      );
      return;
    }

    if (event.key === 'Enter' && open && visibleOptions.length > 0) {
      event.preventDefault();
      pickOption(visibleOptions[highlightIndex] ?? visibleOptions[0]);
      return;
    }

    if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  const focusRingClass =
    accent === 'emerald'
      ? 'focus:border-emerald-500 focus:ring-emerald-500/20'
      : 'focus:border-blue-500 focus:ring-blue-500/20';

  const inputClass = denseTable
    ? `w-full min-w-0 rounded border border-slate-300 bg-white px-0.5 py-0.5 text-center text-[9px] font-medium leading-tight text-slate-900 outline-none transition focus:ring-1 sm:text-[10px] disabled:opacity-60 ${focusRingClass}`
    : compact
      ? `w-full min-w-0 rounded border border-slate-300 bg-white px-1.5 py-1.5 text-xs text-slate-900 outline-none transition focus:ring-2 ${focusRingClass} disabled:opacity-60`
      : `w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none transition focus:ring-2 ${focusRingClass} disabled:opacity-60`;

  const dropdown =
    open && visibleOptions.length > 0 && mounted ? (
      <ul
        ref={panelRef}
        className="fixed z-[200] max-h-48 overflow-y-auto rounded border border-slate-200 bg-white py-1 shadow-lg"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
          maxHeight: 'min(12rem, calc(100vh - 1rem))',
        }}
        role="listbox"
      >
        {visibleOptions.map((option, index) => (
          <li key={option} role="option" aria-selected={index === highlightIndex}>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pickOption(option)}
              className={`block w-full px-2 py-1.5 text-left text-xs text-slate-700 transition hover:bg-slate-50 ${
                index === highlightIndex ? 'bg-slate-100' : ''
              }`}
            >
              {option}
              {kind === 'barrio' ? (
                <span className="ml-1 text-[10px] text-slate-400">
                  ({findDistritoForBarrio(option)})
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    ) : null;

  return (
    <div ref={containerRef} className={`relative min-w-0 ${className ?? ''}`}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          onBlur?.();
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClass}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={open}
        role="combobox"
      />
      {dropdown ? createPortal(dropdown, document.body) : null}
    </div>
  );
}
