'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  ClienteGestionEstado,
  getClienteGestionEstadoOption,
  getClienteGestionEstadoOptions,
  getGestionOptionStyle,
  normalizeClienteGestionEstado,
} from '@/lib/cliente-gestion-estado';
import { updateClienteGestionEstado } from '@/lib/inmuebles-api';
import { TipoOperacion } from '@/types/inmueble';

interface ClienteGestionEstadoSelectProps {
  inmuebleId: string;
  clienteId: string;
  tipoOperacion: TipoOperacion;
  value: string | null | undefined;
  disabled?: boolean;
  compact?: boolean;
  onUpdated: (result: {
    gestion_estado: ClienteGestionEstado;
    fecha_ultima_gestion: string;
  }) => void;
}

export function ClienteGestionEstadoSelect({
  inmuebleId,
  clienteId,
  tipoOperacion,
  value,
  disabled,
  compact,
  onUpdated,
}: ClienteGestionEstadoSelectProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);

  const options = getClienteGestionEstadoOptions(tipoOperacion);
  const current = getClienteGestionEstadoOption(value, tipoOperacion);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    function updatePosition() {
      const rect = triggerRef.current!.getBoundingClientRect();
      const margin = 8;
      const estimatedHeight = options.length * 36 + 8;
      const spaceBelow = window.innerHeight - rect.bottom - margin;
      const spaceAbove = rect.top - margin;
      const openUp = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

      let top = openUp ? rect.top - estimatedHeight - 4 : rect.bottom + 4;
      top = Math.max(margin, Math.min(top, window.innerHeight - margin - 48));

      let left = rect.left;
      const panelWidth = Math.max(rect.width, 256);
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
  }, [open, options.length]);

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

  async function handleSelect(next: ClienteGestionEstado) {
    setOpen(false);
    if (normalizeClienteGestionEstado(value, tipoOperacion) === next) return;

    setSaving(true);
    try {
      const result = await updateClienteGestionEstado(
        inmuebleId,
        clienteId,
        next,
      );
      onUpdated(result);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar el estado de gestión',
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
        className="fixed z-[200] overflow-hidden rounded border border-slate-200 bg-white shadow-lg"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
          maxHeight: 'min(320px, calc(100vh - 1rem))',
        }}
      >
        {options.map((option) => (
          <li
            key={option.value}
            role="option"
            aria-selected={option.value === current.value}
          >
            <button
              type="button"
              onClick={() => void handleSelect(option.value)}
              style={getGestionOptionStyle(option)}
              className="block w-full whitespace-nowrap px-2 py-2 text-left text-[10px] font-bold uppercase leading-none transition hover:brightness-95 sm:text-xs"
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
        style={getGestionOptionStyle(current)}
        className={`inline-flex items-center justify-between gap-1 rounded px-2 py-1 text-left text-[10px] font-bold uppercase leading-tight sm:text-xs disabled:opacity-60 ${
          compact ? 'w-full min-w-0' : 'min-w-[10rem] max-w-xs w-full'
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="min-w-0 flex-1 truncate">{current.label}</span>
        {saving ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
        )}
      </button>
      {dropdown ? createPortal(dropdown, document.body) : null}
    </>
  );
}
