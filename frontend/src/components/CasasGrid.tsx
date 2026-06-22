'use client';

import { useState } from 'react';
import { Bath, BedDouble, MapPin, Maximize2, Phone, User } from 'lucide-react';
import { ImagePreviewModal } from '@/components/ImagePreviewModal';
import { Casa } from '@/data/casas-fake-data';

const STATUS_STYLES: Record<Casa['status'], string> = {
  disponible: 'bg-emerald-100 text-emerald-800',
  reservado: 'bg-amber-100 text-amber-800',
  ocupado: 'bg-slate-200 text-slate-700',
};

const STATUS_LABELS: Record<Casa['status'], string> = {
  disponible: 'Disponible',
  reservado: 'Reservado',
  ocupado: 'Ocupado',
};

interface CasasGridProps {
  casas: Casa[];
  tipo: 'alquiler' | 'venta';
}

function formatPrecio(precio: number, tipo: 'alquiler' | 'venta'): string {
  const formatted = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(precio);

  return tipo === 'alquiler' ? `${formatted}/mes` : formatted;
}

export function CasasGrid({ casas, tipo }: CasasGridProps) {
  const [previewImage, setPreviewImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {casas.map((casa) => (
          <article
            key={casa.id}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
          >
            <button
              type="button"
              onClick={() =>
                setPreviewImage({ src: casa.imagen, alt: casa.direccion })
              }
              className="group relative block w-full cursor-zoom-in"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={casa.imagen}
                alt={casa.direccion}
                className="h-48 w-full object-cover transition group-hover:opacity-95"
              />
              <span
                className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[casa.status]}`}
              >
                {STATUS_LABELS[casa.status]}
              </span>
              <span className="absolute bottom-3 right-3 rounded-lg bg-slate-900/75 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                {formatPrecio(casa.precio, tipo)}
              </span>
            </button>

            <div className="p-4">
              <p className="font-mono text-xs text-slate-400">{casa.id}</p>
              <h3 className="mt-1 font-semibold text-slate-900 line-clamp-2">
                {casa.direccion}
              </h3>
              <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {casa.barrio}
              </p>

              <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <BedDouble className="h-4 w-4 text-slate-400" />
                  {casa.hab} hab
                </span>
                <span className="inline-flex items-center gap-1">
                  <Bath className="h-4 w-4 text-slate-400" />
                  {casa.banos} baños
                </span>
                <span className="inline-flex items-center gap-1">
                  <Maximize2 className="h-4 w-4 text-slate-400" />
                  {casa.metros} m²
                </span>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                {casa.amueblado ? 'Amueblado' : 'Sin amueblar'}
              </p>

              {casa.observaciones && (
                <p className="mt-2 text-xs text-slate-500 line-clamp-2">
                  {casa.observaciones}
                </p>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1 truncate">
                  <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  {casa.propietario}
                </span>
                <span className="inline-flex items-center gap-1 shrink-0">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  {casa.telefono}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {previewImage && (
        <ImagePreviewModal
          src={previewImage.src}
          alt={previewImage.alt}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </>
  );
}
