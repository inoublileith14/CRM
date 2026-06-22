'use client';

import { X } from 'lucide-react';

interface ImagePreviewModalProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export function ImagePreviewModal({ src, alt, onClose }: ImagePreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3">
      <button
        type="button"
        aria-label="Cerrar vista previa"
        className="absolute inset-0 bg-black/85"
        onClick={onClose}
      />
      <div className="relative z-10 flex h-[96vh] w-[96vw] flex-col overflow-hidden rounded-lg shadow-2xl">
        <div className="flex shrink-0 items-center justify-between bg-black/60 px-4 py-2 backdrop-blur-sm">
          <p className="truncate text-sm font-medium text-white">{alt}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-black/40 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}
