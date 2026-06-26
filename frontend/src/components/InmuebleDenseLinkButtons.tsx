'use client';

import type { MouseEvent } from 'react';
import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { isUrl } from '@/lib/inmueble-table-utils';

interface InmuebleDenseLinkButtonsProps {
  url: string;
  accent?: 'alquiler' | 'venta';
}

function resolveOpenHref(url: string): string {
  if (isUrl(url)) return url;
  if (url.startsWith('www.')) return `https://${url}`;
  return `https://${url}`;
}

export function InmuebleDenseLinkButtons({
  url,
  accent = 'alquiler',
}: InmuebleDenseLinkButtonsProps) {
  const accentClass =
    accent === 'venta'
      ? 'text-sky-800 hover:bg-sky-100'
      : 'text-emerald-800 hover:bg-emerald-100';

  async function handleCopy(event: MouseEvent) {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Enlace copiado');
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
  }

  const canOpen = isUrl(url) || /^www\./i.test(url) || url.includes('.');

  return (
    <div className="flex items-center justify-center gap-0.5">
      <button
        type="button"
        onClick={(event) => void handleCopy(event)}
        className={`inline-flex items-center justify-center rounded p-1 transition ${accentClass}`}
        title={`Copiar: ${url}`}
        aria-label="Copiar enlace"
      >
        <Copy className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
      </button>
      {canOpen ? (
        <a
          href={resolveOpenHref(url)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
          className={`inline-flex items-center justify-center rounded p-1 transition ${accentClass}`}
          title={`Abrir: ${url}`}
          aria-label="Abrir enlace"
        >
          <ExternalLink className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
        </a>
      ) : null}
    </div>
  );
}
