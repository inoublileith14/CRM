'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { InmuebleObservacionesEditDialog } from '@/components/InmuebleObservacionesEditDialog';
import { updateInmueble } from '@/lib/inmuebles-api';
import {
  INMUEBLE_MASKED_TEXT_FIELDS,
  InmuebleMaskedTextFieldKey,
} from '@/lib/inmueble-masked-text-columns';

interface InmuebleObservacionesLineCellProps {
  inmuebleId: string;
  value: string | null;
  fieldKey?: InmuebleMaskedTextFieldKey;
  disabled?: boolean;
  onUpdated: (value: string | null) => void;
  /** Dense excel table: centered preview + branded popup editor. */
  fillCell?: boolean;
  expanded?: boolean;
  onToggleExpanded?: () => void;
}

const DENSE_PREVIEW_CLASS =
  'line-clamp-4 max-w-full whitespace-pre-wrap break-words text-center text-[9px] font-bold leading-snug text-red-600 sm:text-[10px]';

export function InmuebleObservacionesLineCell({
  inmuebleId,
  value,
  fieldKey = 'observaciones',
  disabled,
  onUpdated,
  fillCell = false,
  expanded = true,
  onToggleExpanded,
}: InmuebleObservacionesLineCellProps) {
  const fieldMeta = INMUEBLE_MASKED_TEXT_FIELDS[fieldKey];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [saving, setSaving] = useState(false);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => {
    if (!saving && !dialogOpen) {
      setDraft(value ?? '');
    }
  }, [value, saving, dialogOpen]);

  const save = useCallback(
    async (nextDraft: string) => {
      const trimmed = nextDraft.trim();
      const next = trimmed || null;
      const current = value?.trim() || null;

      if (next === current) {
        return true;
      }

      setSaving(true);
      try {
        await updateInmueble(inmuebleId, { [fieldKey]: next });
        onUpdated(next);
        return true;
      } catch (error) {
        setDraft(value ?? '');
        toast.error(
          error instanceof Error ? error.message : fieldMeta.saveError,
        );
        return false;
      } finally {
        setSaving(false);
      }
    },
    [fieldKey, fieldMeta.saveError, inmuebleId, onUpdated, value],
  );

  useEffect(() => {
    if (expanded || fillCell) return;
    const trimmed = draftRef.current.trim();
    const next = trimmed || null;
    const current = value?.trim() || null;
    if (next !== current) {
      void save(draftRef.current);
    }
  }, [expanded, fillCell, save, value]);

  function openDialog() {
    if (saving || !expanded) return;
    setDraft(value ?? '');
    setDialogOpen(true);
  }

  function closeDialog() {
    if (saving) return;
    setDraft(value ?? '');
    setDialogOpen(false);
  }

  async function handleDialogSave() {
    const ok = await save(draft);
    if (ok) {
      setDialogOpen(false);
    }
  }

  const toggleButton = onToggleExpanded ? (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggleExpanded();
      }}
      className="absolute right-0.5 top-1 z-[2] rounded bg-black/40 p-0.5 text-white/90 transition hover:bg-black/55 hover:text-white"
      title={
        expanded
          ? `Ocultar ${fieldMeta.visibilityEntity}`
          : `Mostrar ${fieldMeta.visibilityEntity}`
      }
      aria-label={
        expanded
          ? `Ocultar ${fieldMeta.visibilityEntity}`
          : `Mostrar ${fieldMeta.visibilityEntity}`
      }
      aria-pressed={expanded}
    >
      {expanded ? (
        <Eye className="h-3 w-3 shrink-0" strokeWidth={2.25} />
      ) : (
        <EyeOff className="h-3 w-3 shrink-0" strokeWidth={2.25} />
      )}
    </button>
  ) : null;

  if (fillCell) {
    const previewText = draft.trim();

    return (
      <>
        <div className="absolute inset-0 min-h-[2.75rem] sm:min-h-[3rem]">
          {toggleButton}
          {expanded ? (
            <button
              type="button"
              disabled={saving}
              onClick={(event) => {
                event.stopPropagation();
                openDialog();
              }}
              className="absolute inset-0 z-[1] flex items-center justify-center bg-transparent px-1.5 py-1 pr-7 transition hover:bg-white/90 disabled:cursor-wait disabled:opacity-60 sm:px-2 sm:pr-8"
              title={
                previewText
                  ? `${previewText} — clic para ${disabled ? 'ver' : 'editar'}`
                  : disabled
                    ? 'Sin observaciones'
                    : 'Clic para añadir'
              }
            >
              <span className="flex w-full items-center justify-center">
                {previewText ? (
                  <span className={DENSE_PREVIEW_CLASS}>{previewText}</span>
                ) : (
                  <span className="text-center text-[9px] font-bold text-red-300/80 sm:text-[10px]">
                    —
                  </span>
                )}
              </span>
            </button>
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center px-1.5 py-1 pr-7 sm:px-2 sm:pr-8"
              aria-hidden={!previewText}
            >
              {previewText ? (
                <span className="text-center text-[9px] font-bold leading-tight tracking-wider text-red-600/80 sm:text-[10px]">
                  ****
                </span>
              ) : null}
            </div>
          )}
          {saving ? (
            <Loader2 className="pointer-events-none absolute bottom-0.5 left-0.5 z-[2] h-3 w-3 animate-spin text-red-400" />
          ) : null}
        </div>

        <InmuebleObservacionesEditDialog
          open={dialogOpen}
          subtitle={fieldMeta.shortLabel}
          title={fieldMeta.label}
          value={draft}
          saving={saving}
          readOnly={disabled}
          onChange={setDraft}
          onSave={() => void handleDialogSave()}
          onClose={closeDialog}
        />
      </>
    );
  }

  return (
    <div className="relative w-full min-w-0">
      {toggleButton}
      {expanded ? (
        <div className="flex min-h-[2.5rem] w-full items-center justify-center px-1 py-0.5 pr-6">
          <button
            type="button"
            disabled={disabled || saving}
            onClick={(event) => {
              event.stopPropagation();
              openDialog();
            }}
            className="w-full transition hover:opacity-80 disabled:cursor-default disabled:opacity-60"
            title={draft.trim() ? `${draft.trim()} — clic para editar` : 'Clic para añadir'}
          >
            {draft.trim() ? (
              <span className="line-clamp-3 whitespace-pre-wrap break-words text-center text-sm font-bold leading-snug text-red-600">
                {draft.trim()}
              </span>
            ) : (
              <span className="text-center text-sm font-bold text-red-300/80">—</span>
            )}
          </button>
        </div>
      ) : (
        <div
          className="flex min-h-[2.5rem] w-full items-center justify-center px-1 py-0.5 pr-6"
          aria-hidden={!draft.trim()}
        >
          {draft.trim() ? (
            <span className="text-center text-[9px] font-bold leading-tight tracking-wider text-red-600/80 sm:text-[10px]">
              ****
            </span>
          ) : null}
        </div>
      )}
      {saving ? (
        <Loader2 className="pointer-events-none absolute bottom-0.5 left-0.5 z-[2] h-3 w-3 animate-spin text-red-400" />
      ) : null}

      <InmuebleObservacionesEditDialog
        open={dialogOpen}
        subtitle={fieldMeta.shortLabel}
        title={fieldMeta.label}
        value={draft}
        saving={saving}
        readOnly={disabled}
        onChange={setDraft}
        onSave={() => void handleDialogSave()}
        onClose={closeDialog}
      />
    </div>
  );
}
