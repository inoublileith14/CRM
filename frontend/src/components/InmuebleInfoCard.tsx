'use client';

import Link from 'next/link';
import { ArrowLeft, Copy, ExternalLink, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { InmuebleDenseImageCell } from '@/components/InmuebleDenseImageCell';
import { QueryRefreshingBadge } from '@/components/QueryRefreshingBadge';
import { getInmueblePropietarios } from '@/lib/inmueble-propietarios';
import {
  buildInmuebleDenseImageOverlays,
  formatInmuebleCell,
  isUrl,
  toInmuebleCellValue,
} from '@/lib/inmueble-table-utils';
import { INMUEBLE_FIELDS, Inmueble, InmuebleFormData, TIPO_OPERACION_LABELS } from '@/types/inmueble';

const HIDDEN_KEYS = new Set<keyof InmuebleFormData>([
  'imagen_real',
  'foto_espejo',
  'ficha_del_piso_real',
  'link_idealista_espejo',
  'ref',
  'direccion_piso_real',
]);

const REAL_INFO_FIELD_ORDER: (keyof InmuebleFormData)[] = [
  'tipo_operacion',
  'barrio_distrito',
  'precio',
  'status',
  'hab',
  'banos',
  'metros',
  'larga_estancia_temporada',
  'amueblado',
  'fecha_entrada_inmueble',
  'fecha_visitas_entrada',
  'captador_alquilado_por',
  'observaciones',
];

const ESPEJO_INFO_FIELD_ORDER: (keyof InmuebleFormData)[] = [
  'precio_espejo',
  'espejo_direccion',
];

const REAL_ALWAYS_VISIBLE_KEYS = new Set<keyof InmuebleFormData>([
  'tipo_operacion',
  'barrio_distrito',
  'precio',
  'status',
  'hab',
  'banos',
  'metros',
  'observaciones',
]);

const ESPEJO_ALWAYS_VISIBLE_KEYS = new Set<keyof InmuebleFormData>([
  'precio_espejo',
  'espejo_direccion',
]);

const EMPHASIZED_KEYS = new Set<keyof InmuebleFormData>([
  'tipo_operacion',
  'barrio_distrito',
  'precio',
  'precio_espejo',
  'status',
]);

const actionButtonClass =
  'inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';

function emphasizedValueClass(key: keyof InmuebleFormData): string {
  if (key === 'precio') {
    return 'text-base font-bold text-emerald-700 sm:text-lg';
  }
  if (key === 'precio_espejo') {
    return 'text-base font-bold text-slate-800 sm:text-lg';
  }
  return 'text-sm font-semibold text-slate-900';
}

function LinkActions({ url }: { url: string }) {
  const canOpen = isUrl(url);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Enlace copiado');
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
  }

  return (
    <div className="flex flex-nowrap items-center gap-1.5">
      {canOpen ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${actionButtonClass} text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50`}
          title={url}
        >
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          Abrir
        </a>
      ) : null}
      <button
        type="button"
        onClick={() => void handleCopy()}
        className={actionButtonClass}
        title={url}
      >
        <Copy className="h-3.5 w-3.5 shrink-0" />
        Copiar
      </button>
    </div>
  );
}

interface InmuebleInfoCardProps {
  inmueble: Inmueble;
  onPreviewImage: (src: string, alt: string) => void;
  listPath?: string;
  listLabel?: string;
  editHref?: string;
  isRefreshing?: boolean;
  tipoAccentClass?: string;
}

export function InmuebleInfoCard({
  inmueble,
  onPreviewImage,
  listPath,
  listLabel,
  editHref,
  isRefreshing,
  tipoAccentClass = 'text-emerald-600',
}: InmuebleInfoCardProps) {
  const fieldByKey = new Map(INMUEBLE_FIELDS.map((field) => [field.key, field]));

  function buildVisibleFields(order: (keyof InmuebleFormData)[], alwaysVisible: Set<keyof InmuebleFormData>) {
    return order
      .map((key) => fieldByKey.get(key))
      .filter(
        (field): field is (typeof INMUEBLE_FIELDS)[number] =>
          field != null && !HIDDEN_KEYS.has(field.key),
      )
      .filter(({ key }) => {
        if (alwaysVisible.has(key)) return true;
        const raw = toInmuebleCellValue(inmueble[key]);
        const display = formatInmuebleCell(key, raw);
        return Boolean(display && display !== '—');
      });
  }

  const realFields = buildVisibleFields(REAL_INFO_FIELD_ORDER, REAL_ALWAYS_VISIBLE_KEYS);
  const espejoFields = buildVisibleFields(ESPEJO_INFO_FIELD_ORDER, ESPEJO_ALWAYS_VISIBLE_KEYS);

  const title =
    inmueble.direccion_piso_real?.trim() ||
    inmueble.barrio_distrito?.trim() ||
    'Inmueble sin dirección';
  const subtitle =
    inmueble.barrio_distrito?.trim() &&
    inmueble.direccion_piso_real?.trim() &&
    inmueble.barrio_distrito !== inmueble.direccion_piso_real
      ? inmueble.barrio_distrito
      : null;
  const tipoLabel = inmueble.tipo_operacion
    ? TIPO_OPERACION_LABELS[inmueble.tipo_operacion]
    : '—';

  const propietarios = getInmueblePropietarios(inmueble);

  const imagenSrc = inmueble.imagen_real?.trim() ?? '';
  const fotoEspejoSrc = inmueble.foto_espejo?.trim() ?? '';

  const realImageOverlays = {
    top: inmueble.ref?.trim() || '—',
    bottom: inmueble.direccion_piso_real?.trim() || '—',
  };
  const espejoImageOverlays = buildInmuebleDenseImageOverlays(inmueble, 'espejo');

  function renderValue(key: keyof InmuebleFormData) {
    const raw = toInmuebleCellValue(inmueble[key]);

    if (EMPHASIZED_KEYS.has(key)) {
      return (
        <span className={emphasizedValueClass(key)}>
          {formatInmuebleCell(key, raw)}
        </span>
      );
    }

    if (key === 'observaciones') {
      const text = formatInmuebleCell(key, raw);
      return (
        <span className="whitespace-pre-wrap text-sm text-slate-900">
          {text}
        </span>
      );
    }

    return (
      <span className="text-sm text-slate-900">
        {formatInmuebleCell(key, raw)}
      </span>
    );
  }

  function renderFieldGrid(
    fields: (typeof INMUEBLE_FIELDS)[number][],
    observacionesSpan = 'sm:col-span-2 lg:col-span-3',
  ) {
    return (
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
        {fields.map(({ key, label }) => (
          <div
            key={key}
            className={key === 'observaciones' ? observacionesSpan : undefined}
          >
            <dt
              className={`mb-0.5 leading-tight ${
                EMPHASIZED_KEYS.has(key)
                  ? 'text-xs font-semibold text-slate-600'
                  : 'text-[11px] font-medium text-slate-500'
              }`}
            >
              {label}
            </dt>
            <dd className="leading-snug">{renderValue(key)}</dd>
          </div>
        ))}
      </dl>
    );
  }

  function renderImageBlock(
    imageUrl: string,
    topOverlayText: string,
    bottomOverlayText: string,
    alt: string,
    label: string,
    linkValue: string | null | undefined,
    linkLabel: string,
  ) {
    const link =
      typeof linkValue === 'string' && linkValue.trim() ? linkValue.trim() : null;
    const hasImage = Boolean(imageUrl) && isUrl(imageUrl);

    return (
      <div>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>
        {hasImage ? (
          <InmuebleDenseImageCell
            imageUrl={imageUrl}
            topOverlayText={topOverlayText}
            bottomOverlayText={bottomOverlayText}
            alt={alt}
            onPreview={() => onPreviewImage(imageUrl, alt)}
          />
        ) : (
          <div className="flex aspect-square w-full min-h-[5rem] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-[10px] text-slate-400">
            Sin {label.toLowerCase()}
          </div>
        )}
        {link ? (
          <div className="mt-2 space-y-1">
            <p className="text-[10px] font-medium leading-tight text-slate-600">
              {linkLabel}
            </p>
            <LinkActions url={link} />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <section className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {listPath && listLabel ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-slate-100 bg-slate-50/80 px-3 py-2">
          <Link
            href={listPath}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-slate-500 transition hover:text-emerald-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {listLabel}
          </Link>
          <span className="hidden h-3 w-px shrink-0 bg-slate-200 sm:block" aria-hidden />
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className={`shrink-0 text-[10px] font-bold uppercase tracking-wide ${tipoAccentClass}`}
            >
              {tipoLabel}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
              {subtitle ? (
                <p className="truncate text-xs text-slate-500">{subtitle}</p>
              ) : null}
            </div>
            {isRefreshing ? <QueryRefreshingBadge /> : null}
          </div>
          {editHref ? (
            <Link
              href={editHref}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Editar</span>
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col sm:flex-row">
        <div className="shrink-0 border-b border-slate-100 p-2.5 sm:w-32 sm:border-b-0 sm:border-r lg:w-36">
          {renderImageBlock(
            imagenSrc,
            realImageOverlays.top,
            realImageOverlays.bottom,
            'Imagen del inmueble',
            'Imagen real',
            inmueble.ficha_del_piso_real,
            fieldByKey.get('ficha_del_piso_real')?.label ?? 'Ficha del piso real',
          )}
        </div>

        <div className="min-w-0 flex-1 p-3 sm:p-4">
          {renderFieldGrid(realFields)}

          {propietarios.length > 0 ? (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="mb-2 text-xs font-semibold text-slate-600">
                Propietarios
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {propietarios.map((propietario, index) => (
                  <div
                    key={`${propietario.nombre}-${index}`}
                    className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {propietario.nombre}
                    </p>
                    {propietario.telf ? (
                      <p className="text-sm text-slate-600">{propietario.telf}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t-2 border-slate-300" aria-hidden />

      <div className="flex flex-col sm:flex-row">
        <div className="shrink-0 border-b border-slate-100 p-2.5 sm:w-32 sm:border-b-0 sm:border-r lg:w-36">
          {renderImageBlock(
            fotoEspejoSrc,
            espejoImageOverlays.top,
            espejoImageOverlays.bottom,
            'Foto espejo del inmueble',
            'Foto espejo',
            inmueble.link_idealista_espejo,
            fieldByKey.get('link_idealista_espejo')?.label ??
              'Link Idealista o link espejo',
          )}
        </div>

        <div className="min-w-0 flex-1 p-3 sm:p-4">
          {renderFieldGrid(espejoFields, 'sm:col-span-2')}
        </div>
      </div>
    </section>
  );
}
