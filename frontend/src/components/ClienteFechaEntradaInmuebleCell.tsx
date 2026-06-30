'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useFloatingPanelPosition } from '@/hooks/use-floating-panel-position';
import { updateCliente } from '@/lib/clientes-api';
import {
  CLIENTE_ENTRADA_PREVISTA_OPTIONS,
  ClienteEntradaPrevista,
  getClienteEntradaPrevistaOption,
  isClienteEntradaPrevista,
  normalizeClienteEntradaPrevista,
} from '@/lib/cliente-entrada-prevista';

interface ClienteFechaEntradaInmuebleCellProps {
  clienteId: string;
  value: string | null | undefined;
  disabled?: boolean;
  compact?: boolean;
  onUpdated: (fechaEntradaInmueble: string | null) => void;
}

export function ClienteFechaEntradaInmuebleCell({
  clienteId,
  value,
  disabled,
  compact,
  onUpdated,
}: ClienteFechaEntradaInmuebleCellProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);

  const current = getClienteEntradaPrevistaOption(value);
  const position = useFloatingPanelPosition({
    open,
    triggerRef,
    panelRef,
    minPanelWidth: 168,
    estimatedHeight: CLIENTE_ENTRADA_PREVISTA_OPTIONS.length * 32 + 8,
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

  async function handleSelect(next: ClienteEntradaPrevista) {
    setOpen(false);

    const currentValue = normalizeClienteEntradaPrevista(value);
    if (currentValue === next) return;

    setSaving(true);
    try {
      await updateCliente(clienteId, { fecha_entrada_inmueble: next });
      onUpdated(next);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar la entrada prevista',
      );
    } finally {
      setSaving(false);
    }
  }

  const isYa = normalizeClienteEntradaPrevista(value) === 'ya';
  const filledClass = isYa
    ? compact
      ? 'bg-transparent text-slate-900 hover:bg-yellow-200'
      : 'bg-yellow-300 text-slate-900 hover:bg-yellow-200'
    : 'text-slate-700 hover:bg-slate-100';

  const dropdown =
    open && mounted ? (
      <ul
        ref={panelRef}
        role="listbox"
        className="fixed z-[200] overflow-y-auto rounded border border-slate-200 bg-white py-1 shadow-lg"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
          maxHeight: 'min(280px, calc(100vh - 1rem))',
        }}
      >
        {CLIENTE_ENTRADA_PREVISTA_OPTIONS.map((option) => (
          <li
            key={option.value}
            role="option"
            aria-selected={current.value === option.value}
          >
            <button
              type="button"
              onClick={() => void handleSelect(option.value)}
              className={`block w-full px-3 py-2 text-left text-xs font-bold uppercase transition hover:bg-slate-50 ${
                current.value === option.value
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-700'
              }`}
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>
    ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || saving}
        onClick={() => setOpen((prev) => !prev)}
        className={
          compact
            ? `inline-flex w-full min-w-0 items-center justify-center gap-0.5 rounded px-0.5 py-0.5 text-center text-[10px] font-bold uppercase leading-tight transition disabled:opacity-60 ${filledClass}`
            : `inline-flex w-full min-w-[7rem] items-center justify-between gap-1 rounded px-1 py-0.5 text-left text-sm font-semibold uppercase transition disabled:opacity-60 ${filledClass}`
        }
        aria-haspopup="listbox"
        aria-expanded={open}
        title={
          isClienteEntradaPrevista(value)
            ? current.label
            : 'Seleccionar entrada prevista'
        }
      >
        {saving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
        ) : (
          <>
            <span className="min-w-0 break-words leading-tight">
              {current.label}
            </span>
            <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
          </>
        )}
      </button>
      {dropdown ? createPortal(dropdown, document.body) : null}
    </>
  );
}
