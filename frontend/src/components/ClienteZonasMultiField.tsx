'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useFloatingPanelPosition } from '@/hooks/use-floating-panel-position';
import {
  BARCELONA_DISTRITOS,
  BARCELONA_ZONAS,
  addCustomClienteZona,
  isCatalogBarrio,
  isCatalogDistrito,
  toggleClienteBarrioSelection,
  toggleClienteDistritoSelection,
} from '@/lib/barcelona-zonas';
import {
  formatClienteZonasCompact,
  normalizeClienteZonas,
} from '@/lib/cliente-zonas';
import { updateCliente } from '@/lib/clientes-api';
import { clienteDenseTextClass } from '@/components/ClienteRefValue';

interface ClienteZonasMultiFieldProps {
  clienteId: string;
  kind: 'barrio' | 'distrito';
  barrios: string[] | null | undefined;
  distritos: string[] | null | undefined;
  disabled?: boolean;
  compact?: boolean;
  onUpdated: (patch: { barrio?: string[]; distrito?: string[] }) => void;
}

type ZonaDraft = { barrios: string[]; distritos: string[] };

function hasZonaKey(list: string[], value: string): boolean {
  const key = value.trim().toLowerCase();
  return list.some((item) => item.trim().toLowerCase() === key);
}

function zonasEqual(a: ZonaDraft, b: ZonaDraft): boolean {
  const sortKeys = (list: string[]) =>
    [...list].map((item) => item.trim().toLowerCase()).sort().join('\0');
  return (
    sortKeys(a.barrios) === sortKeys(b.barrios) &&
    sortKeys(a.distritos) === sortKeys(b.distritos)
  );
}

function readDraft(
  barrios: string[] | null | undefined,
  distritos: string[] | null | undefined,
): ZonaDraft {
  return {
    barrios: normalizeClienteZonas(barrios),
    distritos: normalizeClienteZonas(distritos),
  };
}

export function ClienteZonasMultiField({
  clienteId,
  kind,
  barrios,
  distritos,
  disabled,
  compact = true,
  onUpdated,
}: ClienteZonasMultiFieldProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [draft, setDraft] = useState<ZonaDraft>(() => readDraft(barrios, distritos));
  const [initialDraft, setInitialDraft] = useState<ZonaDraft>(() =>
    readDraft(barrios, distritos),
  );

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const displayLabel = formatClienteZonasCompact(
    kind === 'barrio' ? barrios : distritos,
  );
  const isEmpty = displayLabel === '—';
  const isDirty = open && !zonasEqual(draft, initialDraft);

  const position = useFloatingPanelPosition({
    open,
    triggerRef,
    panelRef,
    minPanelWidth: 300,
    estimatedHeight: kind === 'barrio' ? 460 : 360,
    maxPanelHeight: 520,
    deps: [kind, draft.distritos.length, draft.barrios.length],
  });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      const next = readDraft(barrios, distritos);
      setDraft(next);
      setInitialDraft(next);
      setCustomValue('');
    }
  }, [open, barrios, distritos]);

  async function persist(next: ZonaDraft) {
    setSaving(true);
    try {
      await updateCliente(clienteId, {
        barrio: next.barrios,
        distrito: next.distritos,
      });
      setInitialDraft(next);
      setDraft(next);
      onUpdated({ barrio: next.barrios, distrito: next.distritos });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudieron guardar barrio/distrito',
      );
      throw error;
    } finally {
      setSaving(false);
    }
  }

  async function closePanel(save: boolean) {
    if (save) {
      if (!zonasEqual(draft, initialDraft)) {
        try {
          await persist(draft);
        } catch {
          return;
        }
      }
    } else {
      setDraft(initialDraft);
    }
    setOpen(false);
    setCustomValue('');
  }

  function openPanel() {
    const next = readDraft(barrios, distritos);
    setDraft(next);
    setInitialDraft(next);
    setCustomValue('');
    setOpen(true);
  }

  function handleTriggerClick() {
    if (open) {
      void closePanel(false);
      return;
    }
    openPanel();
  }

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
      void closePanel(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') void closePanel(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
    // closePanel identity is stable enough for this effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, draft, initialDraft]);

  function toggleDistrito(distrito: string, checked: boolean) {
    setDraft((current) =>
      toggleClienteDistritoSelection(distrito, checked, current),
    );
  }

  function toggleBarrio(barrio: string, checked: boolean) {
    setDraft((current) =>
      toggleClienteBarrioSelection(barrio, checked, current),
    );
  }

  function addCustom() {
    setDraft((current) => addCustomClienteZona(kind, customValue, current));
    setCustomValue('');
  }

  const customBarrios = draft.barrios.filter((barrio) => !isCatalogBarrio(barrio));
  const customDistritos = draft.distritos.filter(
    (distrito) => !isCatalogDistrito(distrito),
  );

  const panelTitle = kind === 'barrio' ? 'Barrios' : 'Distritos';
  const selectedCount =
    kind === 'barrio' ? draft.barrios.length : draft.distritos.length;

  const panel =
    open && mounted ? (
      <div
        ref={panelRef}
        className="fixed z-[250] flex max-h-[min(520px,calc(100vh-1rem))] w-[min(24rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl"
        style={{
          top: position.top,
          left: position.left,
          width: Math.max(position.width, 300),
        }}
      >
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            {panelTitle}
          </p>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustom();
                }
              }}
              placeholder={
                kind === 'distrito'
                  ? 'Añadir distrito personalizado…'
                  : 'Añadir barrio personalizado…'
              }
              className="min-w-0 flex-1 rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="button"
              onClick={addCustom}
              disabled={!customValue.trim() || saving}
              className="shrink-0 rounded bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              Añadir
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          {kind === 'distrito' ? (
            <ul className="space-y-1">
              {BARCELONA_DISTRITOS.map((distrito) => {
                const checked = hasZonaKey(draft.distritos, distrito);
                return (
                  <li key={distrito}>
                    <label className="flex cursor-pointer items-start gap-2 rounded px-1 py-0.5 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={saving}
                        onChange={(e) =>
                          toggleDistrito(distrito, e.target.checked)
                        }
                        className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300"
                      />
                      <span className="text-xs leading-snug text-slate-800">
                        {distrito}
                      </span>
                    </label>
                  </li>
                );
              })}
              {customDistritos.length > 0 ? (
                <>
                  <li className="pt-2 text-[10px] font-semibold uppercase text-slate-400">
                    Personalizados
                  </li>
                  {customDistritos.map((distrito) => {
                    const checked = hasZonaKey(draft.distritos, distrito);
                    return (
                      <li key={`custom-${distrito}`}>
                        <label className="flex cursor-pointer items-start gap-2 rounded px-1 py-0.5 hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={saving}
                            onChange={(e) =>
                              toggleDistrito(distrito, e.target.checked)
                            }
                            className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300"
                          />
                          <span className="text-xs leading-snug text-slate-800">
                            {distrito}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </>
              ) : null}
            </ul>
          ) : (
            <div className="space-y-2">
              {BARCELONA_ZONAS.map((group) => (
                <div key={group.distrito}>
                  <p className="mb-0.5 text-[10px] font-semibold text-slate-500">
                    {group.distrito}
                  </p>
                  <ul className="space-y-0.5">
                    {group.barrios.map((barrio) => {
                      const checked = hasZonaKey(draft.barrios, barrio);
                      return (
                        <li key={`${group.distrito}-${barrio}`}>
                          <label className="flex cursor-pointer items-start gap-2 rounded px-1 py-0.5 hover:bg-slate-50">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={saving}
                              onChange={(e) =>
                                toggleBarrio(barrio, e.target.checked)
                              }
                              className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300"
                            />
                            <span className="text-xs leading-snug text-slate-700">
                              {barrio}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
              {customBarrios.length > 0 ? (
                <div>
                  <p className="mb-0.5 text-[10px] font-semibold text-slate-500">
                    Personalizados
                  </p>
                  <ul className="space-y-0.5">
                    {customBarrios.map((barrio) => {
                      const checked = hasZonaKey(draft.barrios, barrio);
                      return (
                        <li key={`custom-${barrio}`}>
                          <label className="flex cursor-pointer items-start gap-2 rounded px-1 py-0.5 hover:bg-slate-50">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={saving}
                              onChange={(e) =>
                                toggleBarrio(barrio, e.target.checked)
                              }
                              className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300"
                            />
                            <span className="text-xs leading-snug text-slate-700">
                              {barrio}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2">
          <span className="min-w-0 flex-1 text-[10px] text-slate-500">
            {selectedCount} seleccionado{selectedCount !== 1 ? 's' : ''}
            {isDirty ? ' · sin guardar' : ''}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => void closePanel(false)}
              disabled={saving}
              className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void closePanel(true)}
              disabled={saving}
              className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || saving}
        onClick={handleTriggerClick}
        className={`group inline-flex w-full min-w-0 items-center justify-center gap-0.5 rounded border border-slate-200 bg-white px-1 py-0.5 text-center transition hover:bg-slate-50 disabled:opacity-60 ${
          compact ? 'text-[10px] sm:text-xs' : 'text-sm'
        } ${isEmpty ? 'text-slate-400' : 'text-slate-700'}`}
        title={
          isEmpty
            ? kind === 'barrio'
              ? 'Seleccionar barrios'
              : 'Seleccionar distritos'
            : formatClienteZonasCompact(
                kind === 'barrio' ? barrios : distritos,
                20,
              )
        }
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span
          className={`min-w-0 flex-1 break-words whitespace-normal leading-snug ${
            isEmpty ? '' : clienteDenseTextClass
          }`}
        >
          {saving ? (
            <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin text-slate-400" />
          ) : isEmpty ? (
            '+'
          ) : (
            displayLabel
          )}
        </span>
        {!saving ? (
          <ChevronDown className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
        ) : null}
      </button>
      {panel ? createPortal(panel, document.body) : null}
    </>
  );
}
