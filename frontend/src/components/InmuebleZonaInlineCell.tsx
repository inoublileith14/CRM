'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useFloatingPanelPosition } from '@/hooks/use-floating-panel-position';
import {
  BARCELONA_DISTRITOS,
  BARCELONA_ZONAS,
  findDistritoForBarrio,
  isCatalogBarrio,
  isCatalogDistrito,
} from '@/lib/barcelona-zonas';
import { updateInmueble } from '@/lib/inmuebles-api';

interface InmuebleZonaInlineCellProps {
  inmuebleId: string;
  kind: 'barrio' | 'distrito';
  value: string | null;
  editable?: boolean;
  disabled?: boolean;
  accent?: 'emerald' | 'blue';
  onUpdated: (patch: {
    barrio_distrito?: string | null;
    distrito_ciudad?: string | null;
  }) => void;
}

const COLLAPSED_PREVIEW_COUNT = 3;

const VALUE_TEXT_CLASS =
  'break-words whitespace-normal text-center text-sm font-bold leading-snug';

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function isSelected(current: string, option: string): boolean {
  return normalizeKey(current) === normalizeKey(option);
}

function findGroupForBarrio(barrio: string): string | null {
  const key = normalizeKey(barrio);
  for (const group of BARCELONA_ZONAS) {
    if (group.barrios.some((item) => normalizeKey(item) === key)) {
      return group.distrito;
    }
  }
  return null;
}

function buildInitialExpandedGroups(kind: 'barrio' | 'distrito', draft: string): Set<string> {
  if (kind !== 'barrio' || !draft.trim()) {
    return new Set<string>();
  }
  const group = findGroupForBarrio(draft);
  return group ? new Set([group]) : new Set(['__custom__']);
}

export function InmuebleZonaInlineCell({
  inmuebleId,
  kind,
  value,
  editable,
  disabled,
  accent = 'emerald',
  onUpdated,
}: InmuebleZonaInlineCellProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set());
  const [draft, setDraft] = useState(value?.trim() ?? '');
  const [initialDraft, setInitialDraft] = useState(value?.trim() ?? '');

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const displayLabel = value?.trim() || '—';
  const isEmpty = displayLabel === '—';
  const isDirty = open && normalizeKey(draft) !== normalizeKey(initialDraft);
  const panelTitleLabel = kind === 'barrio' ? 'barrio' : 'distrito';

  const saveButtonClass =
    accent === 'emerald'
      ? 'bg-emerald-600 hover:bg-emerald-700'
      : 'bg-blue-600 hover:bg-blue-700';

  const position = useFloatingPanelPosition({
    open,
    triggerRef,
    panelRef,
    minPanelWidth: 300,
    estimatedHeight: kind === 'barrio' ? 460 : 360,
    maxPanelHeight: 520,
    deps: [kind, open, search],
  });

  const filteredBarrioGroups = useMemo(() => {
    const q = normalizeKey(search);
    if (!q) return [...BARCELONA_ZONAS];
    return BARCELONA_ZONAS.map((group) => ({
      ...group,
      barrios: group.barrios.filter(
        (barrio) =>
          normalizeKey(barrio).includes(q) ||
          normalizeKey(group.distrito).includes(q),
      ),
    })).filter((group) => group.barrios.length > 0);
  }, [search]);

  const filteredDistritos = useMemo(() => {
    const q = normalizeKey(search);
    if (!q) return [...BARCELONA_DISTRITOS];
    return BARCELONA_DISTRITOS.filter((distrito) =>
      normalizeKey(distrito).includes(q),
    );
  }, [search]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      const next = value?.trim() ?? '';
      setDraft(next);
      setInitialDraft(next);
      setCustomValue('');
      setSearch('');
      setExpandedGroups(new Set());
    }
  }, [open, value]);

  async function persist(patch: {
    barrio_distrito?: string | null;
    distrito_ciudad?: string | null;
  }) {
    setSaving(true);
    try {
      const updated = await updateInmueble(inmuebleId, patch);
      onUpdated({
        barrio_distrito: updated.barrio_distrito ?? null,
        distrito_ciudad: updated.distrito_ciudad ?? null,
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : kind === 'barrio'
            ? 'No se pudo guardar el barrio'
            : 'No se pudo guardar el distrito',
      );
      throw error;
    } finally {
      setSaving(false);
    }
  }

  async function closePanel(save: boolean) {
    if (save) {
      if (normalizeKey(draft) !== normalizeKey(initialDraft)) {
        try {
          const nextValue = draft.trim() || null;
          if (kind === 'barrio') {
            const distrito = findDistritoForBarrio(nextValue ?? '');
            await persist({
              barrio_distrito: nextValue,
              ...(distrito ? { distrito_ciudad: distrito } : {}),
            });
          } else {
            await persist({ distrito_ciudad: nextValue });
          }
          setInitialDraft(draft.trim());
        } catch {
          return;
        }
      }
    } else {
      setDraft(initialDraft);
    }
    setOpen(false);
    setCustomValue('');
    setSearch('');
  }

  function openPanel() {
    const next = value?.trim() ?? '';
    setDraft(next);
    setInitialDraft(next);
    setCustomValue('');
    setSearch('');
    setExpandedGroups(buildInitialExpandedGroups(kind, next));
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

  function addCustom() {
    const trimmed = customValue.trim();
    if (!trimmed) return;
    setDraft(trimmed);
    setCustomValue('');
    if (kind === 'barrio') {
      setExpandedGroups((prev) => new Set(prev).add('__custom__'));
    }
  }

  function selectOption(option: string) {
    setDraft(option);
    if (kind === 'barrio') {
      const group = findGroupForBarrio(option);
      if (group) {
        setExpandedGroups((prev) => new Set(prev).add(group));
      }
    }
  }

  function toggleGroup(groupKey: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  }

  function expandAllGroups() {
    if (kind === 'barrio') {
      setExpandedGroups(
        new Set([
          ...filteredBarrioGroups.map((group) => group.distrito),
          ...(customCurrent ? ['__custom__'] : []),
        ]),
      );
      return;
    }
    setExpandedGroups(new Set(['__all__']));
  }

  function collapseAllGroups() {
    const next = new Set<string>();
    if (kind === 'barrio' && draft.trim()) {
      const group = findGroupForBarrio(draft);
      if (group) next.add(group);
      else if (customCurrent) next.add('__custom__');
    }
    setExpandedGroups(next);
  }

  const panelTitle = kind === 'barrio' ? 'Barrio' : 'Distrito';
  const customCurrent =
    draft.trim() &&
    (kind === 'barrio'
      ? !isCatalogBarrio(draft)
      : !isCatalogDistrito(draft))
      ? draft.trim()
      : null;

  const showDistritoExpandAll =
    kind === 'distrito' && filteredDistritos.length > COLLAPSED_PREVIEW_COUNT;
  const distritosExpanded =
    expandedGroups.has('__all__') || !showDistritoExpandAll;

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
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              kind === 'barrio' ? 'Buscar barrio o distrito…' : 'Buscar distrito…'
            }
            className="mt-2 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
          />
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
          {kind === 'barrio' ? (
            <div className="mt-2 flex gap-2 text-[10px]">
              <button
                type="button"
                onClick={expandAllGroups}
                className="font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
              >
                Ver todos
              </button>
              <span className="text-slate-300">·</span>
              <button
                type="button"
                onClick={collapseAllGroups}
                className="font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
              >
                Agrupar
              </button>
            </div>
          ) : showDistritoExpandAll ? (
            <div className="mt-2 text-[10px]">
              <button
                type="button"
                onClick={() =>
                  distritosExpanded
                    ? collapseAllGroups()
                    : expandAllGroups()
                }
                className="font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
              >
                {distritosExpanded ? 'Ver menos' : `Ver todos (${filteredDistritos.length})`}
              </button>
            </div>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          {kind === 'distrito' ? (
            <ul className="space-y-0.5">
              {(distritosExpanded
                ? filteredDistritos
                : filteredDistritos.slice(0, COLLAPSED_PREVIEW_COUNT)
              ).map((distrito) => {
                const selected = isSelected(draft, distrito);
                return (
                  <li key={distrito}>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => selectOption(distrito)}
                      className={`block w-full rounded px-2 py-1.5 text-left text-xs leading-snug transition hover:bg-slate-50 disabled:opacity-60 ${
                        selected
                          ? 'bg-slate-100 font-semibold text-slate-900'
                          : 'text-slate-800'
                      }`}
                    >
                      {distrito}
                    </button>
                  </li>
                );
              })}
              {!distritosExpanded && filteredDistritos.length > COLLAPSED_PREVIEW_COUNT ? (
                <li>
                  <button
                    type="button"
                    onClick={expandAllGroups}
                    className="mt-1 w-full rounded px-2 py-1.5 text-left text-xs font-medium text-slate-500 hover:bg-slate-50"
                  >
                    … Ver todos ({filteredDistritos.length - COLLAPSED_PREVIEW_COUNT} más)
                  </button>
                </li>
              ) : null}
              {customCurrent ? (
                <>
                  <li className="pt-2 text-[10px] font-semibold uppercase text-slate-400">
                    Personalizado
                  </li>
                  <li>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => selectOption(customCurrent)}
                      className={`block w-full rounded px-2 py-1.5 text-left text-xs leading-snug transition hover:bg-slate-50 disabled:opacity-60 ${
                        isSelected(draft, customCurrent)
                          ? 'bg-slate-100 font-semibold text-slate-900'
                          : 'text-slate-800'
                      }`}
                    >
                      {customCurrent}
                    </button>
                  </li>
                </>
              ) : null}
            </ul>
          ) : filteredBarrioGroups.length === 0 ? (
            <p className="px-1 py-2 text-xs text-slate-500">Sin resultados.</p>
          ) : (
            <div className="space-y-2">
              {filteredBarrioGroups.map((group) => {
                const expanded = expandedGroups.has(group.distrito);
                const visibleBarrios = expanded
                  ? group.barrios
                  : group.barrios.slice(0, COLLAPSED_PREVIEW_COUNT);
                const hiddenCount = group.barrios.length - visibleBarrios.length;
                const selectedInGroup = group.barrios.some((barrio) =>
                  isSelected(draft, barrio),
                );

                return (
                  <div
                    key={group.distrito}
                    className="rounded-md border border-slate-100 bg-slate-50/60"
                  >
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.distrito)}
                      className="flex w-full items-center gap-1.5 px-2 py-1.5 text-left"
                    >
                      <ChevronRight
                        className={`h-3 w-3 shrink-0 text-slate-400 transition ${
                          expanded ? 'rotate-90' : ''
                        }`}
                      />
                      <span className="min-w-0 flex-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        {group.distrito}
                      </span>
                      <span className="shrink-0 text-[10px] text-slate-400">
                        {group.barrios.length}
                      </span>
                    </button>
                    <ul className="space-y-0.5 px-1 pb-1.5">
                      {visibleBarrios.map((barrio) => {
                        const selected = isSelected(draft, barrio);
                        return (
                          <li key={`${group.distrito}-${barrio}`}>
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => selectOption(barrio)}
                              className={`block w-full rounded px-2 py-1.5 text-left text-xs leading-snug transition hover:bg-white disabled:opacity-60 ${
                                selected
                                  ? 'bg-white font-semibold text-slate-900 shadow-sm'
                                  : 'text-slate-700'
                              }`}
                            >
                              {barrio}
                            </button>
                          </li>
                        );
                      })}
                      {!expanded && hiddenCount > 0 ? (
                        <li>
                          <button
                            type="button"
                            onClick={() => toggleGroup(group.distrito)}
                            className="block w-full rounded px-2 py-1 text-left text-xs font-medium text-slate-500 hover:bg-white"
                          >
                            … Ver todos ({hiddenCount} más)
                            {selectedInGroup && !visibleBarrios.some((barrio) => isSelected(draft, barrio))
                              ? ' · selección oculta'
                              : ''}
                          </button>
                        </li>
                      ) : null}
                    </ul>
                  </div>
                );
              })}
              {customCurrent ? (
                <div className="rounded-md border border-slate-100 bg-slate-50/60">
                  <button
                    type="button"
                    onClick={() => toggleGroup('__custom__')}
                    className="flex w-full items-center gap-1.5 px-2 py-1.5 text-left"
                  >
                    <ChevronRight
                      className={`h-3 w-3 shrink-0 text-slate-400 transition ${
                        expandedGroups.has('__custom__') ? 'rotate-90' : ''
                      }`}
                    />
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Personalizado
                    </span>
                  </button>
                  {expandedGroups.has('__custom__') ? (
                    <ul className="space-y-0.5 px-1 pb-1.5">
                      <li>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => selectOption(customCurrent)}
                          className={`block w-full rounded px-2 py-1.5 text-left text-xs leading-snug transition hover:bg-white disabled:opacity-60 ${
                            isSelected(draft, customCurrent)
                              ? 'bg-white font-semibold text-slate-900 shadow-sm'
                              : 'text-slate-700'
                          }`}
                        >
                          {customCurrent}
                        </button>
                      </li>
                    </ul>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleGroup('__custom__')}
                      className="block w-full px-3 pb-2 text-left text-xs font-medium text-slate-500 hover:text-slate-700"
                    >
                      … Ver personalizado
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2">
          <span
            className="min-w-0 flex-1 truncate text-[10px] text-slate-500"
            title={draft.trim() || 'Sin selección'}
          >
            {draft.trim() ? draft.trim() : 'Sin selección'}
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
              className={`rounded px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60 ${saveButtonClass}`}
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    ) : null;

  if (!editable) {
    return (
      <span
        className={`block ${VALUE_TEXT_CLASS} ${isEmpty ? 'text-slate-400' : ''}`}
        title={isEmpty ? undefined : displayLabel}
      >
        {displayLabel}
      </span>
    );
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || saving}
        onClick={handleTriggerClick}
        className="absolute inset-0 z-[1] flex w-full items-center justify-center p-0.5 text-center transition hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-60"
        title={
          isEmpty
            ? `Seleccionar ${panelTitleLabel}`
            : `${displayLabel} — clic para editar`
        }
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {saving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
        ) : (
          <span
            className={`${VALUE_TEXT_CLASS} ${isEmpty ? 'text-slate-400' : ''}`}
          >
            {displayLabel}
          </span>
        )}
      </button>
      {panel ? createPortal(panel, document.body) : null}
    </>
  );
}
