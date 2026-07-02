'use client';

import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import {
  getInmuebleImageBackground,
  INMUEBLE_DENSE_OVERLAY_BAR_CLASS,
  INMUEBLE_DENSE_OVERLAY_TEXT_CLASS,
  resolveInmuebleImageSrc,
} from '@/lib/inmueble-table-utils';

interface InmuebleDenseImageCellProps {
  imageUrl: string | null | undefined;
  topOverlayText: string;
  bottomOverlayText: string;
  alt: string;
  onPreview?: () => void;
  hoverRingClass?: string;
  /** Stretch to fill the table cell height (dense excel tables). */
  fillCell?: boolean;
  /** Cell/placeholder background — defaults to alquiler green. */
  backgroundColor?: string;
  /** Smaller overlay text that wraps instead of truncating (detail card ref). */
  compactBottomOverlay?: boolean;
  /** Show copy control on the bottom overlay (ref / address). */
  bottomOverlayCopyable?: boolean;
  /** Taller overlay bar — matches entrada address bar height. */
  tallTopBar?: boolean;
  /** Taller bottom bar — matches entrada address bar height. */
  tallBottomBar?: boolean;
  /** Bottom overlay bar colors — match dense table header when set. */
  bottomOverlayBackgroundColor?: string;
  bottomOverlayTextClass?: string;
  /** Top overlay bar colors — match dense table header when set. */
  topOverlayBackgroundColor?: string;
  topOverlayTextClass?: string;
}

function ImageOverlayBar({
  text,
  compact = false,
  wrap = false,
  tall = false,
  onCopy,
  backgroundColor,
  textClassName,
}: {
  text: string;
  compact?: boolean;
  wrap?: boolean;
  /** ~25% taller bar — used for entrada address overlay. */
  tall?: boolean;
  onCopy?: () => void;
  backgroundColor?: string;
  textClassName?: string;
}) {
  const onLightBackground =
    Boolean(backgroundColor) && !textClassName?.includes('text-white');
  const textColorClass = textClassName ?? 'text-white';

  return (
    <div
      className={`flex gap-0.5 px-1 sm:px-1 ${
        tall
          ? 'min-h-[0.9375rem] items-center py-0.5 sm:min-h-[1.25rem] sm:py-1'
          : 'items-start py-px sm:py-0.5'
      }${backgroundColor ? '' : ` ${INMUEBLE_DENSE_OVERLAY_BAR_CLASS}`}`}
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      <p
        className={`min-w-0 flex-1 select-text ${INMUEBLE_DENSE_OVERLAY_TEXT_CLASS} ${textColorClass} ${
          compact ? 'text-[7px] sm:text-[8px]' : ''
        } ${tall ? '' : 'leading-tight'} ${
          wrap ? 'break-words whitespace-normal' : 'truncate'
        }`}
      >
        {text}
      </p>
      {onCopy ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onCopy();
          }}
          className={
            onLightBackground
              ? 'shrink-0 rounded p-0.5 text-slate-600 transition hover:bg-black/10 hover:text-slate-900'
              : 'shrink-0 rounded p-0.5 text-white/90 transition hover:bg-white/15 hover:text-white'
          }
          title="Copiar"
          aria-label="Copiar texto"
        >
          <Copy className={compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
        </button>
      ) : null}
    </div>
  );
}

export function InmuebleDenseImageCell({
  imageUrl,
  topOverlayText,
  bottomOverlayText,
  alt,
  onPreview,
  hoverRingClass = 'hover:ring-2 hover:ring-inset hover:ring-white/40',
  fillCell = false,
  backgroundColor = getInmuebleImageBackground('alquiler'),
  compactBottomOverlay = false,
  bottomOverlayCopyable = false,
  tallTopBar = false,
  tallBottomBar = false,
  bottomOverlayBackgroundColor,
  bottomOverlayTextClass,
  topOverlayBackgroundColor,
  topOverlayTextClass,
}: InmuebleDenseImageCellProps) {
  const { src: displaySrc, isPlaceholder } = resolveInmuebleImageSrc(imageUrl);
  const bottomText = bottomOverlayText.trim();

  async function handleCopyBottom() {
    if (!bottomText) return;
    try {
      await navigator.clipboard.writeText(bottomText);
      toast.success('Copiado');
    } catch {
      toast.error('No se pudo copiar');
    }
  }

  return (
    <div
      className={`relative w-full min-w-0 max-w-full overflow-hidden ${
        fillCell
          ? 'h-full min-h-[5.5rem]'
          : 'aspect-square min-h-[5rem] sm:min-h-[5.5rem]'
      } ${onPreview ? `transition ${hoverRingClass}` : ''}`}
      style={{ backgroundColor }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={displaySrc}
        alt={alt}
        className={`absolute inset-0 h-full w-full ${
          isPlaceholder ? 'object-contain p-1' : 'object-cover'
        }`}
        style={isPlaceholder ? { backgroundColor } : undefined}
      />
      {onPreview ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onPreview();
          }}
          className="absolute inset-0 z-[1] cursor-zoom-in"
          title="Ver imagen"
          aria-label="Ver imagen"
        />
      ) : null}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[2]">
        {topOverlayText.trim() ? (
          <div className="pointer-events-auto">
            <ImageOverlayBar
              text={topOverlayText}
              tall={tallTopBar}
              backgroundColor={topOverlayBackgroundColor}
              textClassName={topOverlayTextClass}
            />
          </div>
        ) : null}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2]">
        {bottomText ? (
          <div
            className="pointer-events-auto"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <ImageOverlayBar
              text={bottomOverlayText}
              compact={compactBottomOverlay}
              wrap={compactBottomOverlay}
              tall={tallBottomBar}
              backgroundColor={bottomOverlayBackgroundColor}
              textClassName={bottomOverlayTextClass}
              onCopy={
                bottomOverlayCopyable ? () => void handleCopyBottom() : undefined
              }
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
