'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
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
  /** Stretch textarea to fill the table cell (dense excel tables). */
  fillCell?: boolean;
  expanded?: boolean;
  onToggleExpanded?: () => void;
}

const AUTO_SAVE_MS = 1000;

function useAutoResizeTextarea(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  value: string,
  enabled: boolean,
) {
  const resize = useCallback(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [enabled, ref]);

  useLayoutEffect(() => {
    resize();
  }, [resize, value]);

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [enabled, resize]);

  return resize;
}

const DENSE_TEXTAREA_CLASS =
  'box-border max-h-full w-full resize-none overflow-hidden border-0 bg-transparent text-center text-[9px] font-bold leading-tight text-red-600 outline-none placeholder:text-red-300/70 disabled:cursor-not-allowed disabled:opacity-60 sm:text-[10px]';

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
  const [draft, setDraft] = useState(value ?? '');
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const resizeTextarea = useAutoResizeTextarea(
    textareaRef,
    draft,
    expanded && !disabled && !fillCell,
  );

  useEffect(() => {
    if (!saving) {
      setDraft(value ?? '');
    }
  }, [value, saving]);

  const save = useCallback(
    async (nextDraft: string) => {
      const trimmed = nextDraft.trim();
      const next = trimmed || null;
      const current = value?.trim() || null;

      if (next === current) {
        return;
      }

      setSaving(true);
      try {
        await updateInmueble(inmuebleId, { [fieldKey]: next });
        onUpdated(next);
      } catch (error) {
        setDraft(value ?? '');
        toast.error(
          error instanceof Error ? error.message : fieldMeta.saveError,
        );
      } finally {
        setSaving(false);
      }
    },
    [fieldKey, fieldMeta.saveError, inmuebleId, onUpdated, value],
  );

  useEffect(() => {
    if (!expanded || disabled || saving) return;

    const trimmed = draft.trim();
    const next = trimmed || null;
    const current = value?.trim() || null;
    if (next === current) return;

    const timer = window.setTimeout(() => {
      void save(draft);
    }, AUTO_SAVE_MS);

    return () => window.clearTimeout(timer);
  }, [draft, disabled, expanded, save, saving, value]);

  useEffect(() => {
    if (expanded) return;
    const trimmed = draftRef.current.trim();
    const next = trimmed || null;
    const current = value?.trim() || null;
    if (next !== current) {
      void save(draftRef.current);
    }
  }, [expanded, save, value]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      setDraft(value ?? '');
      textareaRef.current?.blur();
      return;
    }

    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      void save(draft);
      textareaRef.current?.blur();
      return;
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void save(draft);
      textareaRef.current?.blur();
    }
  }

  const toggleButton = onToggleExpanded ? (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggleExpanded();
      }}
      className="absolute right-0.5 top-1/2 z-[2] -translate-y-1/2 rounded bg-black/40 p-0.5 text-white/90 transition hover:bg-black/55 hover:text-white"
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

  return (
    <div
      className={fillCell ? 'absolute inset-0' : 'relative w-full min-w-0'}
    >
      {toggleButton}
      {expanded ? (
        fillCell ? (
          <div
            className="absolute inset-0 z-[1] flex items-center justify-center bg-transparent px-1.5 py-1 pr-6 transition focus-within:bg-white/95 sm:px-2 sm:py-1.5 sm:pr-7"
            onClick={(event) => {
              event.stopPropagation();
              textareaRef.current?.focus();
            }}
          >
            <textarea
              ref={textareaRef}
              value={draft}
              disabled={disabled || saving}
              rows={1}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={() => void save(draft)}
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
              onKeyDown={handleKeyDown}
              title="Enter guarda · Shift+Enter nueva línea"
              className={DENSE_TEXTAREA_CLASS}
            />
          </div>
        ) : (
          <div className="flex min-h-[2.5rem] w-full items-center justify-center px-1 py-0.5 pr-6">
            <textarea
              ref={textareaRef}
              value={draft}
              disabled={disabled || saving}
              rows={1}
              onChange={(event) => {
                setDraft(event.target.value);
                requestAnimationFrame(() => resizeTextarea());
              }}
              onBlur={() => void save(draft)}
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
              onKeyDown={handleKeyDown}
              title="Enter guarda · Shift+Enter nueva línea"
              className="block max-h-full w-full resize-none rounded border border-transparent bg-transparent text-center text-sm font-bold leading-snug text-red-600 outline-none transition placeholder:text-red-300/70 focus:border-red-300/60 focus:bg-white/80 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        )
      ) : (
        <div
          className={
            fillCell
              ? 'absolute inset-0 flex items-center justify-center px-1.5 py-1 pr-6 sm:px-2 sm:pr-7'
              : 'flex min-h-[2.5rem] w-full items-center justify-center px-1 py-0.5 pr-6'
          }
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
    </div>
  );
}
