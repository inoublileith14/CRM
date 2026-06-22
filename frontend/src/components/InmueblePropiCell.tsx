'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight } from 'lucide-react';
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

function getPillTheme(tipoOperacion: TipoOperacion): PillTheme {
  if (tipoOperacion === 'alquiler') {
    return {
      primary: {
        pill: 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/20',
        circle: 'bg-emerald-500',
        circleBorder: 'border-l border-emerald-400/40',
        hover: 'hover:bg-emerald-500',
      },
      secondary: {
        pill: 'bg-emerald-50 text-emerald-900 shadow-sm shadow-emerald-900/5',
        circle: 'bg-white',
        circleBorder: 'border-l border-emerald-200/80',
        hover: 'hover:bg-emerald-100/80',
      },
      fecha: {
        pill: 'bg-[#fde047] text-emerald-950 shadow-sm shadow-amber-900/10',
        circle: 'bg-amber-300',
        circleBorder: 'border-l border-amber-400/50',
        hover: 'hover:bg-amber-300',
      },
      empty: 'bg-slate-100 text-slate-400 shadow-sm shadow-slate-900/5',
    };
  }

  return {
    primary: {
      pill: 'bg-blue-600 text-white shadow-sm shadow-blue-900/20',
      circle: 'bg-blue-500',
      circleBorder: 'border-l border-blue-400/40',
      hover: 'hover:bg-blue-500',
    },
    secondary: {
      pill: 'bg-blue-50 text-blue-900 shadow-sm shadow-blue-900/5',
      circle: 'bg-white',
      circleBorder: 'border-l border-blue-200/80',
      hover: 'hover:bg-blue-100/80',
    },
    fecha: {
      pill: 'bg-[#fde047] text-blue-950 shadow-sm shadow-amber-900/10',
      circle: 'bg-amber-300',
      circleBorder: 'border-l border-amber-400/50',
      hover: 'hover:bg-amber-300',
    },
    empty: 'bg-slate-100 text-slate-400 shadow-sm shadow-slate-900/5',
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
        className={`inline-flex h-6 w-full max-w-full items-stretch overflow-hidden rounded-full transition ${baseClass}`}
      >
        {inner}
      </button>
    );
  }

  return (
    <span
      title={title}
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
      <PropiPill label={summary} variant={variant} theme={theme} title={summary} />
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

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function PropiWhatsAppButton({
  phone,
  tipoOperacion,
}: {
  phone: string;
  tipoOperacion: TipoOperacion;
}) {
  const href = toWhatsAppHref(phone);
  if (!href) return null;

  const accentClass =
    tipoOperacion === 'alquiler'
      ? 'bg-[#25D366] text-white hover:bg-[#1ebe57]'
      : 'bg-[#25D366] text-white hover:bg-[#1ebe57]';

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => event.stopPropagation()}
      className={`inline-flex h-6 w-full max-w-full items-center justify-center rounded-full transition ${accentClass}`}
      title={`WhatsApp: ${phone}`}
    >
      <WhatsAppIcon className="h-3.5 w-3.5" />
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
      {phones[0] ? (
        <PropiWhatsAppButton phone={phones[0]} tipoOperacion={tipoOperacion} />
      ) : null}
    </div>
  );
}
