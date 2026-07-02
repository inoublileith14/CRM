'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFloatingPanelPosition } from '@/hooks/use-floating-panel-position';
import { createPortal } from 'react-dom';
import { ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  InmueblePropietarioContacto,
  padPropietarioFormSlots,
  parsePropietariosFromForm,
} from '@/lib/inmueble-propietarios';
import { updateInmueble } from '@/lib/inmuebles-api';
import {
  INMUEBLE_DENSE_OVERLAY_BAR_CLASS,
  INMUEBLE_DENSE_OVERLAY_TEXT_CLASS,
} from '@/lib/inmueble-table-utils';
import { TipoOperacion } from '@/types/inmueble';

interface InmueblePropiCellProps {
  propietarios: InmueblePropietarioContacto[];
  tipoOperacion: TipoOperacion;
  entradaDate?: string;
  centered?: boolean;
  editable?: boolean;
  inmuebleId?: string;
  disabled?: boolean;
  onUpdated?: (patch: {
    propietarios_contactos: InmueblePropietarioContacto[];
    nombre_propi: string | null;
    telf: string | null;
  }) => void;
}

type PillVariant = 'primary' | 'secondary' | 'fecha' | 'empty';

interface PillStyleSet {
  pill: string;
  circle: string;
  circleBorder: string;
  hover: string;
}

interface PillTheme {
  primary: PillStyleSet;
  secondary: PillStyleSet;
  fecha: PillStyleSet;
  empty: string;
}

/** Dense PROPI tags — same bar as entrada address overlay (Calle…). */
const DENSE_PROPI_TAG_BASE = INMUEBLE_DENSE_OVERLAY_BAR_CLASS;

const DENSE_PROPI_TAG_TEXT = `${INMUEBLE_DENSE_OVERLAY_TEXT_CLASS} normal-case tracking-normal`;

const DENSE_PROPI_PILL_STYLE: PillStyleSet = {
  pill: DENSE_PROPI_TAG_BASE,
  circle: 'bg-black/70',
  circleBorder: 'border-l border-white/20',
  hover: 'hover:bg-black/65',
};

function getPillTheme(_tipoOperacion: TipoOperacion): PillTheme {
  return {
    primary: DENSE_PROPI_PILL_STYLE,
    secondary: DENSE_PROPI_PILL_STYLE,
    fecha: DENSE_PROPI_PILL_STYLE,
    empty: `${DENSE_PROPI_TAG_BASE} text-white/55`,
  };
}

interface PropiPillProps {
  label: string;
  variant: PillVariant;
  theme: PillTheme;
  interactive?: boolean;
  isPlaceholder?: boolean;
  onClick?: () => void;
  title?: string;
}

function PropiPill({
  label,
  variant,
  theme,
  interactive = false,
  isPlaceholder = false,
  onClick,
  title,
}: PropiPillProps) {
  const styles =
    variant === 'empty'
      ? null
      : theme[variant as 'primary' | 'secondary' | 'fecha'];

  const baseClass =
    variant === 'empty'
      ? theme.empty
      : `${styles!.pill} ${interactive ? `${styles!.hover} cursor-pointer` : ''}`;

  const textClass = isPlaceholder
    ? `${DENSE_PROPI_TAG_TEXT} uppercase tracking-wide`
    : DENSE_PROPI_TAG_TEXT;

  const inner = (
    <>
      <span
        className={`flex min-w-0 flex-1 items-center justify-center truncate px-2 py-1 leading-none ${textClass}`}
      >
        {label}
      </span>
      {interactive && styles ? (
        <span
          className={`flex h-full w-6 shrink-0 items-center justify-center ${styles.circle} ${styles.circleBorder}`}
        >
          <ChevronRight className="h-3 w-3 shrink-0" strokeWidth={2.5} />
        </span>
      ) : null}
    </>
  );

  if (interactive && onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        className={`inline-flex h-6 w-full max-w-full items-stretch overflow-hidden rounded-sm transition ${baseClass}`}
      >
        {inner}
      </button>
    );
  }

  return (
    <span
      title={title}
      className={`inline-flex h-6 w-full max-w-full items-stretch overflow-hidden rounded-sm ${baseClass}`}
    >
      {inner}
    </span>
  );
}

interface PropiValueLineProps {
  emptyLabel: string;
  values: string[];
  variant: 'primary' | 'secondary' | 'fecha';
  showFirstOnlyWhenMultiple?: boolean;
  theme: PillTheme;
  centered?: boolean;
}

function PropiValueLine({
  emptyLabel,
  values,
  variant,
  showFirstOnlyWhenMultiple = false,
  theme,
  centered = false,
}: PropiValueLineProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const position = useFloatingPanelPosition({
    open,
    triggerRef,
    panelRef,
    minPanelWidth: 160,
    estimatedHeight: Math.min(values.length * 32 + 8, 200),
    deps: [values.length],
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

  const wrapperClass = centered ? 'mx-auto w-full max-w-full' : 'w-full max-w-full';

  if (values.length === 0) {
    return (
      <div className={wrapperClass}>
        <PropiPill
          label={emptyLabel}
          variant="empty"
          theme={theme}
          isPlaceholder
        />
      </div>
    );
  }

  const summary =
    values.length > 1 && showFirstOnlyWhenMultiple
      ? values[0]
      : values.join(' / ');

  const isInteractive = values.length > 1;

  const dropdown =
    open && mounted ? (
      <div
        ref={panelRef}
        className="fixed z-[200] overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
          maxHeight: 'min(200px, calc(100vh - 1rem))',
        }}
      >
        <ul className="divide-y divide-slate-100">
          {values.map((value, index) => (
            <li
              key={`${value}-${index}`}
              className="px-3 py-2 text-xs text-slate-800"
            >
              {value}
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  if (isInteractive) {
    return (
      <div className={wrapperClass}>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          title={`Ver todos (${values.length})`}
          className={`inline-flex h-6 w-full max-w-full items-stretch overflow-hidden rounded-sm transition ${
            theme[variant].pill
          } ${theme[variant].hover} cursor-pointer`}
        >
          <span className={`flex min-w-0 flex-1 items-center justify-center truncate px-2 py-1 leading-none ${DENSE_PROPI_TAG_TEXT}`}>
            {summary}
          </span>
          <span
            className={`flex h-full w-6 shrink-0 items-center justify-center ${theme[variant].circle} ${theme[variant].circleBorder}`}
          >
            <ChevronRight className="h-3 w-3 shrink-0" strokeWidth={2.5} />
          </span>
        </button>
        {dropdown ? createPortal(dropdown, document.body) : null}
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <PropiPill
        label={summary}
        variant={variant}
        theme={theme}
        title={summary}
      />
    </div>
  );
}

function contactosEqual(
  a: InmueblePropietarioContacto[],
  b: InmueblePropietarioContacto[],
): boolean {
  if (a.length !== b.length) return false;
  return a.every(
    (item, index) =>
      item.nombre === b[index]?.nombre &&
      (item.telf ?? null) === (b[index]?.telf ?? null),
  );
}

interface EditablePropiValueLineProps {
  emptyLabel: string;
  slots: { nombre: string; telf: string }[];
  field: 'nombre' | 'telf';
  variant: 'primary' | 'secondary';
  showFirstOnlyWhenMultiple?: boolean;
  theme: PillTheme;
  centered?: boolean;
  disabled?: boolean;
  saving?: boolean;
  inputMode?: 'text' | 'tel';
  onCommit: (index: number, value: string) => void | Promise<void>;
}

function EditablePropiValueLine({
  emptyLabel,
  slots,
  field,
  variant,
  showFirstOnlyWhenMultiple = false,
  theme,
  centered = false,
  disabled,
  saving,
  inputMode = 'text',
  onCommit,
}: EditablePropiValueLineProps) {
  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [dropdownDrafts, setDropdownDrafts] = useState<Record<number, string>>({});
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const styles = theme[variant];
  const wrapperClass = centered ? 'mx-auto w-full max-w-full' : 'w-full max-w-full';

  const entries = useMemo(
    () =>
      slots
        .map((slot, index) => ({
          index,
          value: (field === 'nombre' ? slot.nombre : slot.telf).trim(),
        }))
        .filter((entry) => entry.value),
    [slots, field],
  );

  const position = useFloatingPanelPosition({
    open,
    triggerRef,
    panelRef,
    minPanelWidth: 200,
    estimatedHeight: Math.min(entries.length * 44 + 16, 240),
    deps: [entries.length, field, open],
  });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (editingIndex === null) return;
    const current =
      field === 'nombre'
        ? slots[editingIndex]?.nombre ?? ''
        : slots[editingIndex]?.telf ?? '';
    setDraft(current);
  }, [editingIndex, field, slots]);

  useEffect(() => {
    if (editingIndex === null) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editingIndex]);

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

  function toggleDropdown() {
    if (open) {
      setOpen(false);
      return;
    }
    const next: Record<number, string> = {};
    for (const entry of entries) {
      next[entry.index] = entry.value;
    }
    setDropdownDrafts(next);
    setOpen(true);
  }

  function startEdit(index: number) {
    setOpen(false);
    setEditingIndex(index);
  }

  function cancelEdit() {
    if (saving) return;
    setEditingIndex(null);
  }

  async function saveEdit() {
    if (editingIndex === null || saving || disabled) return;
    const current =
      field === 'nombre'
        ? slots[editingIndex]?.nombre ?? ''
        : slots[editingIndex]?.telf ?? '';
    if (draft === current) {
      setEditingIndex(null);
      return;
    }
    await onCommit(editingIndex, draft);
    setEditingIndex(null);
  }

  async function saveDropdownEntry(index: number) {
    if (saving || disabled) return;
    const nextValue = dropdownDrafts[index] ?? '';
    const current =
      field === 'nombre'
        ? slots[index]?.nombre ?? ''
        : slots[index]?.telf ?? '';
    if (nextValue === current) return;
    await onCommit(index, nextValue);
  }

  const isMulti = entries.length > 1;

  if (editingIndex !== null && !isMulti) {
    return (
      <div className={wrapperClass}>
        <div
          className={`inline-flex h-6 w-full max-w-full items-center overflow-hidden rounded-sm ${styles.pill}`}
        >
          <input
            ref={inputRef}
            type={inputMode === 'tel' ? 'tel' : 'text'}
            inputMode={inputMode === 'tel' ? 'tel' : 'text'}
            value={draft}
            disabled={disabled || saving}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => void saveEdit()}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void saveEdit();
              }
              if (event.key === 'Escape') {
                event.preventDefault();
                cancelEdit();
              }
            }}
            onClick={(event) => event.stopPropagation()}
            placeholder={emptyLabel}
            className={`min-w-0 flex-1 border-0 bg-transparent px-2 py-1 text-center leading-none text-white outline-none placeholder:text-white/50 disabled:opacity-60 ${DENSE_PROPI_TAG_TEXT}`}
          />
          {saving ? (
            <Loader2 className="mr-1 h-3 w-3 shrink-0 animate-spin text-white/80" />
          ) : null}
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className={wrapperClass}>
        <button
          type="button"
          disabled={disabled || saving}
          onClick={(event) => {
            event.stopPropagation();
            startEdit(0);
          }}
          title={`Clic para añadir ${emptyLabel.toLowerCase()}`}
          className={`inline-flex h-6 w-full max-w-full items-stretch overflow-hidden rounded-sm transition ${theme.empty} cursor-pointer disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <span className={`flex min-w-0 flex-1 items-center justify-center truncate px-2 py-1 uppercase tracking-wide leading-none ${DENSE_PROPI_TAG_TEXT}`}>
            {emptyLabel}
          </span>
        </button>
      </div>
    );
  }

  const summary =
    entries.length > 1 && showFirstOnlyWhenMultiple
      ? entries[0].value
      : entries.length > 1
        ? entries.map((entry) => entry.value).join(' / ')
        : entries[0].value;

  const dropdown =
    open && mounted && isMulti ? (
      <div
        ref={panelRef}
        className="fixed z-[200] overflow-auto rounded-lg border border-slate-200 bg-white p-2 shadow-lg"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
          maxHeight: 'min(240px, calc(100vh - 1rem))',
        }}
      >
        <ul className="flex flex-col gap-2">
          {entries.map((entry) => (
            <li key={`${field}-${entry.index}`}>
              <input
                type={inputMode === 'tel' ? 'tel' : 'text'}
                inputMode={inputMode === 'tel' ? 'tel' : 'text'}
                value={dropdownDrafts[entry.index] ?? entry.value}
                disabled={disabled || saving}
                onChange={(event) =>
                  setDropdownDrafts((prev) => ({
                    ...prev,
                    [entry.index]: event.target.value,
                  }))
                }
                onBlur={() => void saveDropdownEntry(entry.index)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void saveDropdownEntry(entry.index);
                  }
                }}
                onClick={(event) => event.stopPropagation()}
                placeholder={`${emptyLabel} ${entry.index + 1}`}
                className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-60"
              />
            </li>
          ))}
        </ul>
        {saving ? (
          <div className="mt-2 flex justify-center">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
          </div>
        ) : null}
      </div>
    ) : null;

  if (isMulti) {
    return (
      <div className={wrapperClass}>
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled || saving}
          onClick={(event) => {
            event.stopPropagation();
            toggleDropdown();
          }}
          title={`${summary} — clic para editar en el desplegable`}
          className={`inline-flex h-6 w-full max-w-full items-stretch overflow-hidden rounded-sm transition ${styles.pill} ${styles.hover} cursor-pointer disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <span className={`flex min-w-0 flex-1 items-center justify-center truncate px-2 py-1 leading-none ${DENSE_PROPI_TAG_TEXT}`}>
            {summary}
          </span>
          <span
            className={`flex h-full w-6 shrink-0 items-center justify-center ${styles.circle} ${styles.circleBorder}`}
          >
            <ChevronRight className="h-3 w-3 shrink-0" strokeWidth={2.5} />
          </span>
        </button>
        {dropdown ? createPortal(dropdown, document.body) : null}
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <button
        type="button"
        disabled={disabled || saving}
        onClick={(event) => {
          event.stopPropagation();
          startEdit(entries[0].index);
        }}
        title={`${summary} — clic para editar`}
        className={`inline-flex h-6 w-full max-w-full items-stretch overflow-hidden rounded-sm transition ${styles.pill} ${styles.hover} cursor-pointer disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <span className={`flex min-w-0 flex-1 items-center justify-center truncate px-2 py-1 leading-none ${DENSE_PROPI_TAG_TEXT}`}>
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : summary}
        </span>
      </button>
    </div>
  );
}

function toWhatsAppHref(phone: string): string | null {
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 9 && /^[67]/.test(digits)) {
    digits = `34${digits}`;
  }
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

function PropiWhatsAppButton({ phone }: { phone: string }) {
  const href = toWhatsAppHref(phone);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => event.stopPropagation()}
      className="inline-flex h-6 w-full max-w-full items-center justify-center transition hover:opacity-90"
      title={`WhatsApp: ${phone}`}
    >
      <img
        src="/whatsapp-logo.png"
        alt="WhatsApp"
        className="h-6 w-6 shrink-0 object-contain"
        width={24}
        height={24}
        draggable={false}
      />
    </a>
  );
}

export function InmueblePropiCell({
  propietarios,
  tipoOperacion,
  entradaDate,
  centered = false,
  editable,
  inmuebleId,
  disabled,
  onUpdated,
}: InmueblePropiCellProps) {
  const slotCount = Math.max(propietarios.length, 1);
  const [slots, setSlots] = useState(() =>
    padPropietarioFormSlots(propietarios).slice(0, slotCount),
  );
  const [saving, setSaving] = useState(false);

  const names = propietarios.map((item) => item.nombre.trim()).filter(Boolean);
  const phones = propietarios
    .map((item) => item.telf?.trim() ?? '')
    .filter(Boolean);
  const dateValues =
    entradaDate && entradaDate !== '—' ? [entradaDate] : [];

  const theme = getPillTheme(tipoOperacion);

  useEffect(() => {
    if (!saving) {
      const count = Math.max(propietarios.length, 1);
      setSlots(padPropietarioFormSlots(propietarios).slice(0, count));
    }
  }, [propietarios, saving]);

  async function commitSlots(nextSlots: { nombre: string; telf: string }[]) {
    if (!editable || !inmuebleId || !onUpdated) return;

    const parsed = parsePropietariosFromForm(nextSlots);
    if (contactosEqual(parsed, propietarios)) return;

    setSaving(true);
    try {
      const updated = await updateInmueble(inmuebleId, {
        propietarios_contactos: parsed,
        nombre_propi: parsed[0]?.nombre ?? null,
        telf: parsed[0]?.telf ?? null,
      });
      onUpdated({
        propietarios_contactos: updated.propietarios_contactos ?? parsed,
        nombre_propi: updated.nombre_propi ?? null,
        telf: updated.telf ?? null,
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudieron guardar los datos del propietario',
      );
      const count = Math.max(propietarios.length, 1);
      setSlots(padPropietarioFormSlots(propietarios).slice(0, count));
    } finally {
      setSaving(false);
    }
  }

  async function updateSlot(
    index: number,
    field: 'nombre' | 'telf',
    value: string,
  ) {
    const next = slots.map((slot, slotIndex) =>
      slotIndex === index ? { ...slot, [field]: value } : slot,
    );
    setSlots(next);
    await commitSlots(next);
  }

  const isEditable = Boolean(editable && inmuebleId && onUpdated);
  const fieldDisabled = disabled || saving;
  const whatsappPhone = isEditable
    ? slots.map((slot) => slot.telf.trim()).find(Boolean)
    : phones[0];

  return (
    <div
      className={`flex min-w-0 w-full max-w-full flex-col gap-1 leading-none ${centered ? 'mx-auto items-center' : 'items-stretch'}`}
    >
      <PropiValueLine
        emptyLabel="FECHA"
        values={dateValues}
        variant="fecha"
        theme={theme}
        centered={centered}
      />
      {isEditable ? (
        <>
          <EditablePropiValueLine
            emptyLabel="PROPI"
            slots={slots}
            field="nombre"
            variant="primary"
            theme={theme}
            centered={centered}
            disabled={fieldDisabled}
            saving={saving}
            onCommit={(index, value) => updateSlot(index, 'nombre', value)}
          />
          <EditablePropiValueLine
            emptyLabel="TLF"
            slots={slots}
            field="telf"
            variant="secondary"
            showFirstOnlyWhenMultiple
            theme={theme}
            centered={centered}
            disabled={fieldDisabled}
            saving={saving}
            inputMode="tel"
            onCommit={(index, value) => updateSlot(index, 'telf', value)}
          />
        </>
      ) : (
        <>
          <PropiValueLine
            emptyLabel="PROPI"
            values={names}
            variant="primary"
            theme={theme}
            centered={centered}
          />
          <PropiValueLine
            emptyLabel="TLF"
            values={phones}
            variant="secondary"
            showFirstOnlyWhenMultiple
            theme={theme}
            centered={centered}
          />
        </>
      )}
      {whatsappPhone ? (
        <PropiWhatsAppButton phone={whatsappPhone} />
      ) : null}
    </div>
  );
}
