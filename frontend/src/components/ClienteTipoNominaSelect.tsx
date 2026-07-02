'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useFloatingPanelPosition } from '@/hooks/use-floating-panel-position';
import { updateCliente } from '@/lib/clientes-api';
import {
  CLIENTE_TIPO_NOMINA_OPTIONS,
  ClienteTipoNomina,
  getClienteTipoNominaOption,
  normalizeClienteTipoNomina,
} from '@/lib/cliente-tipo-nomina';

interface ClienteTipoNominaSelectProps {
  clienteId: string;
  value: string | null | undefined;
  disabled?: boolean;
  compact?: boolean;
  onUpdated: (tipoNomina: ClienteTipoNomina | null) => void;
}

export function ClienteTipoNominaSelect({
  clienteId,
  value,
  disabled,
  compact = true,
  onUpdated,
}: ClienteTipoNominaSelectProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);

  const current = getClienteTipoNominaOption(value);
  const position = useFloatingPanelPosition({
    open,
    triggerRef,
    panelRef,
    minPanelWidth: 180,
    estimatedHeight: CLIENTE_TIPO_NOMINA_OPTIONS.length * 32 + 40,
    deps: [],
  });

  useEffect(() => setMounted(true), []);

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

  async function handleSelect(next: ClienteTipoNomina | null) {
    setOpen(false);
    const currentValue = normalizeClienteTipoNomina(value);
    if (currentValue === next) return;

    setSaving(true);
    try {
      await updateCliente(clienteId, { tipo_nomina: next });
      onUpdated(next);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar el tipo de nómina',
      );
    } finally {
      setSaving(false);
    }
  }

  const dropdown =
    open && mounted ? (
      <ul
        ref={panelRef}
        role="listbox"
        aria-label="Tipo de nómina"
        className="fixed z-[200] overflow-y-auto overflow-x-hidden rounded border border-slate-200 bg-white shadow-lg"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
          maxHeight: 'min(280px, calc(100vh - 1rem))',
        }}
      >
        <li role="option" aria-selected={!current} className="border-b border-slate-100">
          <button
            type="button"
            onClick={() => void handleSelect(null)}
            className="block w-full px-2 py-1.5 text-left text-[10px] font-medium text-slate-500 transition hover:bg-slate-50 sm:text-xs"
          >
            Sin nómina
          </button>
        </li>
        {CLIENTE_TIPO_NOMINA_OPTIONS.map((option) => (
          <li
            key={option.value}
            role="option"
            aria-selected={option.value === current?.value}
            className="border-b border-slate-100 last:border-b-0"
          >
            <button
              type="button"
              onClick={() => void handleSelect(option.value)}
              className="block w-full px-2 py-1.5 text-left text-[10px] font-semibold leading-tight text-slate-700 transition hover:bg-slate-50 sm:text-xs"
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>
    ) : null;

  const displayLabel = current
    ? compact
      ? current.shortLabel
      : current.label
    : '—';

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || saving}
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex w-full min-w-0 flex-col items-center justify-center gap-0.5 rounded border border-slate-200 bg-white px-1 py-0.5 text-center text-[10px] font-semibold uppercase leading-tight text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 sm:text-xs ${
          current ? '' : 'text-slate-400'
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={current?.label ?? 'Seleccionar tipo de nómina'}
      >
        <span className="flex w-full items-center justify-center gap-0.5">
          <span className="min-w-0 break-words whitespace-normal leading-snug">
            {displayLabel}
          </span>
          {saving ? (
            <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
          ) : (
            <ChevronDown className="h-3 w-3 shrink-0 opacity-70" />
          )}
        </span>
      </button>
      {dropdown ? createPortal(dropdown, document.body) : null}
    </>
  );
}
