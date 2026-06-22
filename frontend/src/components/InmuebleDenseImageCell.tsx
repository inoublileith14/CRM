'use client';

import { isUrl } from '@/lib/inmueble-table-utils';

interface InmuebleDenseImageCellProps {
  imageUrl: string | null | undefined;
  topOverlayText: string;
  bottomOverlayText: string;
  alt: string;
  onPreview?: () => void;
  hoverRingClass?: string;
}

function ImageOverlayBar({ text }: { text: string }) {
  return (
    <div className="bg-black/55 px-1 py-px sm:px-1 sm:py-0.5">
      <p className="truncate font-serif text-[10px] font-bold leading-tight text-white sm:text-xs">
        {text}
      </p>
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
}: InmuebleDenseImageCellProps) {
  const trimmed = imageUrl?.trim() ?? '';
  const hasImage = Boolean(trimmed) && isUrl(trimmed);

  const content = (
    <div className="relative aspect-square w-full min-h-[5rem] min-w-0 max-w-full overflow-hidden bg-slate-300 sm:min-h-[5.5rem]">
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={trimmed}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
      <div className="absolute inset-x-0 top-0 z-[1]">
        {topOverlayText.trim() ? (
          <ImageOverlayBar text={topOverlayText} />
        ) : null}
      </div>
      <div className="absolute inset-x-0 bottom-0 z-[1]">
        <ImageOverlayBar text={bottomOverlayText} />
      </div>
    </div>
  );

  if (hasImage && onPreview) {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onPreview();
        }}
        className={`block w-full min-h-0 max-w-full cursor-zoom-in transition ${hoverRingClass}`}
        title="Ver imagen"
      >
        {content}
      </button>
    );
  }

  return content;
}
