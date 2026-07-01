'use client';

import {
  useEffect,
  useId,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Loader2, X } from 'lucide-react';
import { INMUEBLE_PLACEHOLDER_IMAGE_SRC } from '@/lib/inmueble-table-utils';

export type CoconutBrandedDialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const SIZE_MAX_WIDTH: Record<CoconutBrandedDialogSize, string> = {
  sm: 'max-w-[480px]',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[min(96vw,90rem)]',
};

export const COCONUT_DIALOG_GOLD_GRADIENT =
  'linear-gradient(90deg, #b8924b, #e6c77b, #b8924b)';

export const COCONUT_DIALOG_INPUT_CLASS =
  'w-full rounded-xl border border-[#eadfcd] bg-[#faf7f1] px-3 py-2 text-sm text-[#24211f] outline-none transition placeholder:text-[#a49a8f] focus:border-[#b8924b]/50 focus:bg-white focus:ring-2 focus:ring-[#b8924b]/15 disabled:opacity-60';

export const COCONUT_DIALOG_LABEL_CLASS =
  'mb-1 block text-xs font-semibold uppercase tracking-wide text-[#5f574f]';

export const COCONUT_DIALOG_BODY_TEXT_CLASS = 'text-sm text-[#5f574f]';

export type CoconutBrandedDialogPrimaryTone =
  | 'brand'
  | 'danger'
  | 'success'
  | 'info'
  | 'whatsapp';

const PRIMARY_TONE_CLASS: Record<CoconutBrandedDialogPrimaryTone, string> = {
  brand:
    'bg-[#b8924b] shadow-[0_8px_18px_rgba(184,146,75,0.24)] hover:brightness-95',
  danger: 'bg-red-600 hover:brightness-95',
  success: 'bg-emerald-600 hover:brightness-95',
  info: 'bg-blue-700 hover:brightness-95',
  whatsapp: 'bg-[#128C7E] hover:brightness-95',
};

export function toneFromLegacyButtonClass(
  className: string,
): CoconutBrandedDialogPrimaryTone {
  if (className.includes('red')) return 'danger';
  if (className.includes('emerald')) return 'success';
  if (className.includes('blue')) return 'info';
  if (className.includes('128C7E')) return 'whatsapp';
  return 'brand';
}

interface CoconutBrandedDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  titleId?: string;
  size?: CoconutBrandedDialogSize;
  zIndexClass?: string;
  blockClose?: boolean;
  closable?: boolean;
  children?: ReactNode;
  footer?: ReactNode;
  bodyClassName?: string;
  align?: 'center' | 'left';
  scrollable?: boolean;
  maxHeightClass?: string;
  description?: ReactNode;
}

export function CoconutBrandedDialog({
  open,
  onClose,
  title,
  subtitle,
  titleId,
  size = 'sm',
  zIndexClass = 'z-[250]',
  blockClose = false,
  closable = true,
  children,
  footer,
  bodyClassName = '',
  align = 'center',
  scrollable = false,
  maxHeightClass = 'max-h-[min(92vh,720px)]',
  description,
}: CoconutBrandedDialogProps) {
  const [mounted, setMounted] = useState(false);
  const generatedId = useId();
  const headingId = titleId ?? `coconut-dialog-title-${generatedId}`;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !blockClose && closable) onClose();
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose, blockClose, closable]);

  if (!open || !mounted) return null;

  const cardClass = [
    'relative z-10 w-full overflow-hidden rounded-[18px] border border-[#e6ddcf] bg-white shadow-[0_20px_50px_rgba(35,31,28,0.28)] ring-1 ring-black/10',
    SIZE_MAX_WIDTH[size],
    scrollable ? `flex ${maxHeightClass} flex-col` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const bodyClass = [
    'px-6 pb-5 pt-5',
    align === 'center' ? 'text-center' : 'text-left',
    scrollable ? 'flex min-h-0 flex-1 flex-col overflow-y-auto' : '',
    bodyClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return createPortal(
    <div
      className={`fixed inset-0 ${zIndexClass} flex items-center justify-center bg-transparent p-4`}
    >
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0"
        onClick={blockClose || !closable ? undefined : onClose}
        disabled={blockClose || !closable}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className={cardClass}
      >
        <div className="relative shrink-0 bg-black px-4 py-2">
          {closable ? (
            <button
              type="button"
              onClick={onClose}
              disabled={blockClose}
              className="absolute right-2 top-1.5 z-10 rounded-full bg-black/45 p-1 text-white/90 transition hover:bg-black/60 disabled:opacity-60"
              aria-label="Cerrar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
          <Image
            src={INMUEBLE_PLACEHOLDER_IMAGE_SRC}
            alt="COCONUT LUXURY FLATS"
            width={432}
            height={120}
            className="mx-auto h-auto w-full max-w-[14.5rem] object-contain sm:max-w-[16rem]"
            priority
          />
        </div>

        <div
          className="h-1 shrink-0"
          style={{ background: COCONUT_DIALOG_GOLD_GRADIENT }}
        />

        <div
          className={
            scrollable ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : ''
          }
        >
          <div className={bodyClass}>
            {subtitle ? (
              <p className="m-0 mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#b8924b]">
                {subtitle}
              </p>
            ) : null}
            <h2
              id={headingId}
              className="m-0 mb-3 text-xl font-bold leading-tight text-[#24211f]"
            >
              {title}
            </h2>
            {description ? (
              <div className={`mb-3 ${COCONUT_DIALOG_BODY_TEXT_CLASS}`}>
                {description}
              </div>
            ) : null}
            {children}
          </div>
          {footer}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function CoconutBrandedDialogActions({
  children,
  className = '',
  align = 'center',
}: {
  children: ReactNode;
  className?: string;
  align?: 'center' | 'end';
}) {
  return (
    <div
      className={`mt-4 flex flex-wrap items-center gap-2.5 ${
        align === 'end' ? 'justify-end' : 'justify-center'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CoconutBrandedDialogFooter({
  children,
  className = '',
  align = 'center',
}: {
  children: ReactNode;
  className?: string;
  align?: 'center' | 'end';
}) {
  return (
    <div
      className={`shrink-0 border-t border-[#eadfcd] bg-white px-6 py-4 ${className}`}
    >
      <div
        className={`flex flex-wrap items-center gap-2.5 ${
          align === 'end' ? 'justify-end' : 'justify-center'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export function CoconutBrandedDialogCancelButton({
  children = 'Cancelar',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`rounded-full border border-[#e6ddcf] bg-white px-5 py-2 text-sm font-bold text-[#5f574f] transition hover:bg-[#faf7f1] disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function CoconutBrandedDialogPrimaryButton({
  children,
  loading,
  tone = 'brand',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  tone?: CoconutBrandedDialogPrimaryTone;
}) {
  return (
    <button
      type={props.type ?? 'button'}
      className={`inline-flex min-w-[7.5rem] items-center justify-center gap-2 rounded-full px-6 py-2 text-sm font-bold text-white transition disabled:opacity-60 ${PRIMARY_TONE_CLASS[tone]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
