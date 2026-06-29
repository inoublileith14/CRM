'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { bulkAssignWorker, bulkUnassignWorker } from '@/lib/clientes-api';
import { TipoOperacion } from '@/types/inmueble';
import { Worker, getWorkerRolLabel } from '@/types/worker';

interface ClienteTrabajadorCellProps {
  inmuebleId: string;
  clienteId: string;
  workers: Worker[];
  assignedWorkers: Worker[] | undefined;
  tipoOperacion: TipoOperacion;
  disabled?: boolean;
  onUpdated: (workers: Worker[]) => void;
}

function filterWorkers(workers: Worker[], query: string): Worker[] {
  const q = query.trim().toLowerCase();
  if (!q) return workers;

  return workers.filter((worker) => {
    const nombre = (worker.nombre ?? '').toLowerCase();
    const rol = getWorkerRolLabel(worker.rol).toLowerCase();
    const email = worker.email?.toLowerCase() ?? '';
    return nombre.includes(q) || rol.includes(q) || email.includes(q);
  });
}

function matchesUnassignOption(query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    'sin asignar'.includes(q) ||
    q.includes('sin') ||
    q.includes('asignar')
  );
}

export function ClienteTrabajadorCell({
  inmuebleId,
  clienteId,
  workers,
  assignedWorkers,
  tipoOperacion,
  disabled,
  onUpdated,
}: ClienteTrabajadorCellProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const currentWorker = assignedWorkers?.[0] ?? null;
  const label = currentWorker?.nombre ?? 'Sin asignar';
  const unassigned = !currentWorker;

  const filteredWorkers = useMemo(
    () => filterWorkers(workers, searchQuery),
    [workers, searchQuery],
  );
  const showUnassignOption = useMemo(
    () => matchesUnassignOption(searchQuery),
    [searchQuery],
  );
  const listItemCount =
    (showUnassignOption ? 1 : 0) + filteredWorkers.length;

  const focusRingClass =
    tipoOperacion === 'alquiler'
      ? 'focus:border-emerald-500 focus:ring-emerald-500/20'
      : 'focus:border-blue-600 focus:ring-blue-600/20';

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    function updatePosition() {
      const rect = triggerRef.current!.getBoundingClientRect();
      const margin = 8;
      const panelWidth = Math.max(rect.width, 220);
      const estimatedHeight = Math.min(listItemCount * 44 + 52, 300);
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
  }, [open, listItemCount]);

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      return;
    }

    const focusTimer = window.setTimeout(() => searchRef.current?.focus(), 0);

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
      window.clearTimeout(focusTimer);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  async function handleUnassign() {
    setOpen(false);
    if (!currentWorker) return;

    setSaving(true);
    try {
      await bulkUnassignWorker({ cliente_ids: [clienteId] });
      onUpdated([]);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo quitar la asignación',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSelect(workerId: string) {
    setOpen(false);
    if (currentWorker?.id === workerId) return;

    setSaving(true);
    try {
      await bulkAssignWorker({
        worker_id: workerId,
        assignments: [{ cliente_id: clienteId, inmueble_id: inmuebleId }],
      });
      const worker = workers.find((item) => item.id === workerId);
      if (worker) {
        onUpdated([worker]);
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo asignar el trabajador',
      );
    } finally {
      setSaving(false);
    }
  }

  const hoverClass =
    tipoOperacion === 'alquiler'
      ? 'hover:bg-emerald-50 hover:text-emerald-800'
      : 'hover:bg-blue-50 hover:text-blue-800';

  const dropdown =
    open && mounted ? (
      <div
        ref={panelRef}
        className="fixed z-[200] flex flex-col overflow-hidden rounded border border-slate-200 bg-white shadow-lg"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
          maxHeight: 'min(300px, calc(100vh - 1rem))',
        }}
      >
        <div className="border-b border-slate-100 p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar trabajador…"
              className={`w-full rounded-md border border-slate-300 bg-white py-1.5 pl-7 pr-2 text-xs text-slate-900 outline-none focus:ring-1 ${focusRingClass}`}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        <ul role="listbox" className="overflow-y-auto py-1">
          {showUnassignOption && (
            <li role="option" aria-selected={unassigned}>
              <button
                type="button"
                onClick={() => void handleUnassign()}
                className={`block w-full px-3 py-2 text-left text-xs transition ${hoverClass} ${
                  unassigned
                    ? 'bg-slate-100 font-semibold text-amber-700'
                    : 'text-amber-700'
                }`}
              >
                <span className="block truncate">Sin asignar</span>
                <span className="block text-[10px] font-normal text-slate-500">
                  Quitar trabajador
                </span>
              </button>
            </li>
          )}
          {workers.length === 0 ? (
            !showUnassignOption ? (
              <li className="px-3 py-2 text-xs text-slate-500">
                No hay trabajadores activos
              </li>
            ) : null
          ) : filteredWorkers.length === 0 ? (
            !showUnassignOption ? (
              <li className="px-3 py-2 text-xs text-slate-500">
                Sin resultados
              </li>
            ) : null
          ) : (
            filteredWorkers.map((worker) => (
              <li
                key={worker.id}
                role="option"
                aria-selected={worker.id === currentWorker?.id}
              >
                <button
                  type="button"
                  onClick={() => void handleSelect(worker.id)}
                  className={`block w-full px-3 py-2 text-left text-xs transition ${hoverClass} ${
                    worker.id === currentWorker?.id
                      ? 'bg-slate-100 font-semibold text-slate-900'
                      : 'text-slate-700'
                  }`}
                >
                  <span className="block truncate">{worker.nombre}</span>
                  <span className="block text-[10px] font-normal text-slate-500">
                    {getWorkerRolLabel(worker.rol)}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={
          disabled || saving || (workers.length === 0 && !currentWorker)
        }
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex min-w-[6.5rem] max-w-[10rem] items-center justify-between gap-1 rounded px-1.5 py-1 text-left text-xs transition hover:bg-slate-100 disabled:opacity-60 ${
          unassigned ? 'font-medium text-amber-600' : 'text-slate-700'
        }`}
        title="Asignar trabajador"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {saving ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-slate-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
        )}
      </button>
      {dropdown ? createPortal(dropdown, document.body) : null}
    </>
  );
}
