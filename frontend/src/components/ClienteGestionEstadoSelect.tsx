'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useFloatingPanelPosition } from '@/hooks/use-floating-panel-position';
import { createPortal } from 'react-dom';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  GestionCalendarEventDialog,
  GestionCalendarEventFormValues,
} from '@/components/GestionCalendarEventDialog';
import {
  ClienteGestionEstado,
  estimateGestionSelectWidthPx,
  GESTION_SELECT_CHROME_PX,
  GESTION_SELECT_LABEL_CLASS,
  getClienteGestionEstadoOption,
  getClienteGestionEstadoOptions,
  getGestionOptionStyle,
  normalizeClienteGestionEstado,
  requiresCalendarEventDialog,
} from '@/lib/cliente-gestion-estado';
import {
  handleGestionCalendarError,
  saveGestionWithCalendar,
} from '@/lib/save-gestion-with-calendar';
import { useCalendarStatusQuery } from '@/hooks/use-dashboard-queries';
import { TipoOperacion } from '@/types/inmueble';

export interface ClienteGestionEventContext {
  clienteNombre: string;
  clienteTelefono: string | null;
  clienteRef: string | null;
  clienteNotas: string | null;
  inmuebleLabel: string | null;
}

interface ClienteGestionEstadoSelectProps {
  inmuebleId: string;
  clienteId: string;
  tipoOperacion: TipoOperacion;
  value: string | null | undefined;
  disabled?: boolean;
  compact?: boolean;
  /** Dense per-house clients table: full column width, label may wrap 2 lines. */
  tableLayout?: boolean;
  eventContext?: ClienteGestionEventContext;
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
  tableLayout,
  eventContext,
  onUpdated,
}: ClienteGestionEstadoSelectProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingEstado, setPendingEstado] = useState<
    Extract<ClienteGestionEstado, 'visita_concertada' | 'videollamada'> | null
  >(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);

  const calendarStatusQuery = useCalendarStatusQuery(dialogOpen || open);
  const calendarConnected = calendarStatusQuery.data?.connected ?? false;
  const canCreateEvents = calendarStatusQuery.data?.canCreateEvents ?? false;

  const options = getClienteGestionEstadoOptions(tipoOperacion);
  const current = getClienteGestionEstadoOption(value, tipoOperacion);
  const measureRef = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);

  const contentWidth =
    measuredWidth ?? estimateGestionSelectWidthPx(tipoOperacion);

  useLayoutEffect(() => {
    if (!tableLayout || !measureRef.current) return;
    const labels = measureRef.current.querySelectorAll('[data-gestion-label]');
    let maxText = 0;
    labels.forEach((node) => {
      maxText = Math.max(maxText, node.getBoundingClientRect().width);
    });
    if (maxText > 0) {
      setMeasuredWidth(Math.ceil(maxText) + GESTION_SELECT_CHROME_PX);
    }
  }, [options, tableLayout, tipoOperacion]);

  const position = useFloatingPanelPosition({
    open,
    triggerRef,
    panelRef,
    minPanelWidth: tableLayout ? contentWidth : 256,
    estimatedHeight: options.length * 32 + 8,
    deps: [options.length, contentWidth, tableLayout],
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

  async function saveGestionEstado(
    next: ClienteGestionEstado,
    formValues?: GestionCalendarEventFormValues,
  ) {
    setSaving(true);
    try {
      const result = await saveGestionWithCalendar({
        inmuebleId,
        clienteId,
        next,
        formValues,
        queryClient,
      });
      onUpdated(result);
    } catch (error) {
      handleGestionCalendarError(error);
    } finally {
      setSaving(false);
      setPendingEstado(null);
      setDialogOpen(false);
    }
  }

  async function handleSelect(next: ClienteGestionEstado) {
    setOpen(false);
    if (normalizeClienteGestionEstado(value, tipoOperacion) === next) return;

    if (requiresCalendarEventDialog(next)) {
      setPendingEstado(next);
      setDialogOpen(true);
      return;
    }

    await saveGestionEstado(next);
  }

  async function handleDialogConfirm(formValues: GestionCalendarEventFormValues) {
    if (!pendingEstado) return;
    await saveGestionEstado(pendingEstado, formValues);
  }

  function handleDialogCancel() {
    if (saving) return;
    setDialogOpen(false);
    setPendingEstado(null);
  }

  const dropdown =
    open && mounted ? (
      <ul
        ref={panelRef}
        role="listbox"
        className="fixed z-[200] overflow-y-auto overflow-x-hidden rounded border border-slate-200 bg-white shadow-lg"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
          maxHeight: 'min(360px, calc(100vh - 1rem))',
        }}
      >
        {options.map((option) => (
          <li
            key={option.value}
            role="option"
            aria-selected={option.value === current.value}
            className="border-b border-black/10 last:border-b-0"
          >
            <button
              type="button"
              onClick={() => void handleSelect(option.value)}
              style={getGestionOptionStyle(option)}
              className={`gestion-select-option block w-full whitespace-nowrap px-2 py-1 text-center ${GESTION_SELECT_LABEL_CLASS}`}
            >
              <span className="relative z-[1]">{option.label}</span>
            </button>
          </li>
        ))}
      </ul>
    ) : null;

  return (
    <>
      {tableLayout ? (
        <div
          ref={measureRef}
          aria-hidden
          className="pointer-events-none fixed -left-[9999px] top-0 opacity-0"
        >
          {options.map((option) => (
            <span
              key={option.value}
              data-gestion-label
              className={`block whitespace-nowrap ${GESTION_SELECT_LABEL_CLASS}`}
            >
              {option.label}
            </span>
          ))}
        </div>
      ) : null}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || saving}
        onClick={() => setOpen((prev) => !prev)}
        style={{
          ...getGestionOptionStyle(current),
          ...(tableLayout ? { width: contentWidth } : undefined),
        }}
        className={`gestion-select-trigger disabled:opacity-60 ${
          open ? 'gestion-select-trigger--open' : ''
        } ${
          tableLayout
            ? `gestion-select-trigger--table mx-auto inline-flex items-center justify-between gap-1 whitespace-nowrap py-1 pl-2 pr-1.5 leading-none ${GESTION_SELECT_LABEL_CLASS}`
            : `inline-flex items-center justify-between gap-1 px-2 py-1 text-left ${GESTION_SELECT_LABEL_CLASS} ${
                compact ? 'w-full min-w-0' : 'min-w-[10rem] max-w-xs w-full'
              }`
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className={
            tableLayout
              ? 'relative z-[1] min-w-0 flex-1 text-center leading-none'
              : 'relative z-[1] min-w-0 flex-1 truncate'
          }
        >
          {current.label}
        </span>
        {saving ? (
          <Loader2 className="relative z-[1] h-3 w-3 shrink-0 animate-spin self-center opacity-80" />
        ) : (
          <ChevronDown className="relative z-[1] h-3 w-3 shrink-0 self-center opacity-80" />
        )}
      </button>
      {dropdown ? createPortal(dropdown, document.body) : null}
      {pendingEstado ? (
        <GestionCalendarEventDialog
          open={dialogOpen}
          gestionEstado={pendingEstado}
          clienteNombre={eventContext?.clienteNombre ?? 'Cliente'}
          clienteTelefono={eventContext?.clienteTelefono ?? null}
          clienteRef={eventContext?.clienteRef ?? null}
          clienteNotas={eventContext?.clienteNotas ?? null}
          inmuebleLabel={eventContext?.inmuebleLabel ?? null}
          calendarConnected={calendarConnected}
          canCreateEvents={canCreateEvents}
          loading={saving}
          onConfirm={(formValues) => void handleDialogConfirm(formValues)}
          onCancel={handleDialogCancel}
        />
      ) : null}
    </>
  );
}
