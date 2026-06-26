'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight } from 'lucide-react';
import { getInmuebleDenseHeaderColor } from '@/lib/inmueble-table-layout';
import { InmueblePropietarioContacto } from '@/lib/inmueble-propietarios';
import { TipoOperacion } from '@/types/inmueble';

interface InmueblePropiCellProps {
  propietarios: InmueblePropietarioContacto[];
  tipoOperacion: TipoOperacion;
  entradaDate?: string;
  centered?: boolean;
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

const DENSE_PROPI_PILL_STYLE_ALQUILER: PillStyleSet = {
  pill: 'text-white shadow-sm shadow-black/10',
  circle: 'bg-[#006847]',
  circleBorder: 'border-l border-white/20',
  hover: 'hover:opacity-90',
};

const DENSE_PROPI_PILL_STYLE_VENTA: PillStyleSet = {
  pill: 'text-white shadow-sm shadow-black/10',
  circle: 'bg-[#163a72]',
  circleBorder: 'border-l border-white/20',
  hover: 'hover:opacity-90',
};

function getPillTheme(tipoOperacion: TipoOperacion): PillTheme {
  const pillStyle =
    tipoOperacion === 'venta'
      ? DENSE_PROPI_PILL_STYLE_VENTA
      : DENSE_PROPI_PILL_STYLE_ALQUILER;
  return {
    primary: pillStyle,
    secondary: pillStyle,
    fecha: pillStyle,
    empty: 'text-white/60 shadow-sm shadow-black/10',
  };
}

function getPropiPillBackgroundStyle(tipoOperacion: TipoOperacion) {
  return { backgroundColor: getInmuebleDenseHeaderColor(tipoOperacion) };
}

interface PropiPillProps {
  label: string;
  variant: PillVariant;
  theme: PillTheme;
  pillBackgroundStyle: { backgroundColor: string };
  interactive?: boolean;
  isPlaceholder?: boolean;
  onClick?: () => void;
  title?: string;
}

function PropiPill({
  label,
  variant,
  theme,
  pillBackgroundStyle,
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
    ? 'text-xs font-bold uppercase tracking-wide'
    : 'text-xs font-bold normal-case tracking-normal';

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
        style={pillBackgroundStyle}
        className={`inline-flex h-6 w-full max-w-full items-stretch overflow-hidden rounded-full transition ${baseClass}`}
      >
        {inner}
      </button>
    );
  }

  return (
    <span
      title={title}
      style={pillBackgroundStyle}
      className={`inline-flex h-6 w-full max-w-full items-stretch overflow-hidden rounded-full ${baseClass}`}
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
  pillBackgroundStyle: { backgroundColor: string };
  centered?: boolean;
}

function PropiValueLine({
  emptyLabel,
  values,
  variant,
  showFirstOnlyWhenMultiple = false,
  theme,
  pillBackgroundStyle,
  centered = false,
}: PropiValueLineProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    function updatePosition() {
      const rect = triggerRef.current!.getBoundingClientRect();
      const margin = 8;
      const panelWidth = Math.max(rect.width, 160);
      const estimatedHeight = Math.min(values.length * 32 + 8, 200);
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
  }, [open, values.length]);

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
          pillBackgroundStyle={pillBackgroundStyle}
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
          style={pillBackgroundStyle}
          className={`inline-flex h-6 w-full max-w-full items-stretch overflow-hidden rounded-full transition ${
            theme[variant].pill
          } ${theme[variant].hover} cursor-pointer`}
        >
          <span className="flex min-w-0 flex-1 items-center justify-center truncate px-2 py-1 text-xs font-bold leading-none normal-case tracking-normal">
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
        pillBackgroundStyle={pillBackgroundStyle}
        title={summary}
      />
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
}: InmueblePropiCellProps) {
  const names = propietarios.map((item) => item.nombre.trim()).filter(Boolean);
  const phones = propietarios
    .map((item) => item.telf?.trim() ?? '')
    .filter(Boolean);
  const dateValues =
    entradaDate && entradaDate !== '—' ? [entradaDate] : [];

  const theme = getPillTheme(tipoOperacion);
  const pillBackgroundStyle = getPropiPillBackgroundStyle(tipoOperacion);

  return (
    <div
      className={`flex min-w-0 w-full max-w-full flex-col gap-1 leading-none ${centered ? 'mx-auto items-center' : 'items-stretch'}`}
    >
      <PropiValueLine
        emptyLabel="FECHA"
        values={dateValues}
        variant="fecha"
        theme={theme}
        pillBackgroundStyle={pillBackgroundStyle}
        centered={centered}
      />
      <PropiValueLine
        emptyLabel="PROPI"
        values={names}
        variant="primary"
        theme={theme}
        pillBackgroundStyle={pillBackgroundStyle}
        centered={centered}
      />
      <PropiValueLine
        emptyLabel="TLF"
        values={phones}
        variant="secondary"
        showFirstOnlyWhenMultiple
        theme={theme}
        pillBackgroundStyle={pillBackgroundStyle}
        centered={centered}
      />
      {phones[0] ? (
        <PropiWhatsAppButton phone={phones[0]} />
      ) : null}
    </div>
  );
}
