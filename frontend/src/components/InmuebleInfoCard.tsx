'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, ExternalLink, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { InmuebleDenseImageCell } from '@/components/InmuebleDenseImageCell';
import { InmuebleObservacionesLineCell } from '@/components/InmuebleObservacionesLineCell';
import { QueryRefreshingBadge } from '@/components/QueryRefreshingBadge';
import { getInmueblePropietarios } from '@/lib/inmueble-propietarios';
import {
  buildInmuebleDenseImageOverlays,
  formatInmuebleCell,
  formatInmuebleEntradaDate,
  getInmuebleImageBackground,
  isUrl,
  toInmuebleCellValue,
} from '@/lib/inmueble-table-utils';
import { formatInmuebleStatusDisplay } from '@/lib/inmueble-status';
import { getInmuebleAmuebladoLabel } from '@/lib/inmueble-amueblado';
import { hydrateInmuebleSplitFields } from '@/lib/inmueble-split-fields';
import { updateInmueble } from '@/lib/inmuebles-api';
import { INMUEBLE_FIELDS, Inmueble, InmuebleFormData } from '@/types/inmueble';

const HIDDEN_KEYS = new Set<keyof InmuebleFormData>([
  'imagen_real',
  'foto_espejo',
  'ficha_del_piso_real',
  'link_idealista',
  'link_espejo',
  'link_idealista_espejo',
  'ref',
  'tipo_operacion',
]);

const INFO_CARD_ROW1_ORDER: (keyof InmuebleFormData)[] = [
  'precio',
  'hab',
  'banos',
  'metros',
  'larga_estancia_temporada',
];

const INFO_CARD_ROW2_ORDER: (keyof InmuebleFormData)[] = [
  'status',
  'direccion_piso_real',
  'observaciones',
  'requisitos_propietario',
  'amueblado',
  'captador',
  'alquilado_por',
];

const INFO_CARD_LABEL_OVERRIDES: Partial<Record<keyof InmuebleFormData, string>> = {
  direccion_piso_real: 'Dirección',
  requisitos_propietario: 'Requisitos del propietario',
};

const INLINE_FIELD_SHORT_LABELS: Partial<
  Record<keyof InmuebleFormData, string>
> = {
  precio: 'Precio',
  hab: 'Hab',
  banos: 'Baños',
  metros: 'Metros',
  fecha_entrada_inmueble: 'Entrada CRM',
  fecha_visitas: 'Visitas',
  fecha_visitas_entrada: 'Entrada piso',
  larga_estancia_temporada: 'L/T',
  amueblado: 'Amuebl.',
  captador: 'Capt.',
  alquilado_por: 'Alq.',
};

const ESPEJO_INFO_FIELD_ORDER: (keyof InmuebleFormData)[] = [
  'precio_espejo',
  'espejo_direccion',
];

const ESPEJO_ALWAYS_VISIBLE_KEYS = new Set<keyof InmuebleFormData>([
  'precio_espejo',
  'espejo_direccion',
]);

const EMPHASIZED_KEYS = new Set<keyof InmuebleFormData>([
  'barrio_distrito',
  'precio',
  'precio_espejo',
  'status',
]);

const INFO_CARD_GRID_CLASS =
  'grid w-full min-w-[48rem] grid-cols-7 gap-x-1.5 gap-y-3';

const actionButtonClass =
  'inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';

const FIELD_TITLE_CLASS =
  'text-xs font-bold uppercase tracking-wide text-slate-700 sm:text-sm';
const FIELD_TITLE_INLINE_CLASS =
  'text-[11px] font-bold uppercase tracking-wide text-slate-700 sm:text-xs';
const SECTION_TITLE_CLASS =
  'text-xs font-bold uppercase tracking-wide text-slate-700 sm:text-sm';

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
  onUpdated?: (updated: Inmueble) => void;
  listPath?: string;
  listLabel?: string;
  editHref?: string;
  readOnly?: boolean;
  isRefreshing?: boolean;
  tipoAccentClass?: string;
}

export function InmuebleInfoCard({
  inmueble,
  onPreviewImage,
  onUpdated,
  listPath,
  listLabel,
  editHref,
  readOnly = false,
  isRefreshing,
  tipoAccentClass = 'text-emerald-600',
}: InmuebleInfoCardProps) {
  const detail = hydrateInmuebleSplitFields(inmueble);
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
        const raw = toInmuebleCellValue(detail[key]);
        const display = formatInmuebleCell(key, raw);
        return Boolean(display && display !== '—');
      });
  }

  const espejoFields = buildVisibleFields(ESPEJO_INFO_FIELD_ORDER, ESPEJO_ALWAYS_VISIBLE_KEYS);

  const propietarios = getInmueblePropietarios(detail);

  const imagenSrc = detail.imagen_real?.trim() ?? '';
  const fotoEspejoSrc = detail.foto_espejo?.trim() ?? '';
  const espejoLink =
    detail.link_espejo?.trim() ||
    detail.link_idealista?.trim() ||
    detail.link_idealista_espejo?.trim() ||
    null;
  const hasEspejoImage = Boolean(fotoEspejoSrc) && isUrl(fotoEspejoSrc);
  const hasEspejoFields =
    Boolean(detail.precio_espejo) ||
    Boolean(detail.espejo_direccion?.trim());
  const showEspejoSection = hasEspejoImage || Boolean(espejoLink) || hasEspejoFields;

  const realImageOverlays = buildInmuebleDenseImageOverlays(inmueble, 'entrada');
  const espejoImageOverlays = buildInmuebleDenseImageOverlays(inmueble, 'espejo');
  const refLabel = detail.ref?.trim() || '—';

  function resolveInmuebleVisitasDate(): string | number | null {
    return detail.fecha_visitas ?? null;
  }

  function toDateInput(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') return '';
    const d = new Date(String(value));
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function fromDateInput(value: string): string | null {
    if (!value.trim()) return null;
    return `${value}T00:00:00.000Z`;
  }

  async function persistInmuebleDate(
    key: 'fecha_entrada_inmueble' | 'fecha_visitas' | 'fecha_visitas_entrada',
    nextIso: string | null,
  ) {
    try {
      const payload: Partial<InmuebleFormData> =
        key === 'fecha_visitas_entrada' && nextIso
          ? { [key]: nextIso.split('T')[0] }
          : { [key]: nextIso };
      const updated = await updateInmueble(inmueble.id, payload);
      onUpdated?.(updated);
      toast.success('Guardado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar la fecha');
    }
  }

  function EditableDateInline({
    title,
    fieldKey,
    value,
    defaultIso,
  }: {
    title: string;
    fieldKey: 'fecha_entrada_inmueble' | 'fecha_visitas' | 'fecha_visitas_entrada';
    value: string | number | null | undefined;
    defaultIso: string;
  }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(toDateInput(value) || defaultIso);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
      if (!editing) {
        setDraft(toDateInput(value) || defaultIso);
      }
    }, [value, editing, defaultIso]);

    if (editing) {
      return (
        <input
          type="date"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            setEditing(false);
            const nextIso = fromDateInput(draft);
            const currentIso = fromDateInput(toDateInput(value) || '');
            if (nextIso === currentIso) return;
            setSaving(true);
            void persistInmuebleDate(fieldKey, nextIso).finally(() => setSaving(false));
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              setEditing(false);
              setDraft(toDateInput(value) || defaultIso);
            }
            if (e.key === 'Enter') {
              e.preventDefault();
              (e.currentTarget as HTMLInputElement).blur();
            }
          }}
          disabled={saving}
          className="w-full min-w-0 rounded border border-slate-300 bg-white px-1 py-0.5 text-left text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
          aria-label={title}
        />
      );
    }

    const display = formatInmuebleEntradaDate(value);
    const displayOrFallback = display !== '—' ? display : formatInmuebleEntradaDate(defaultIso);

    if (readOnly) {
      return (
        <span className="w-full min-w-0 px-1 py-0.5 text-left text-sm font-bold text-slate-900">
          {displayOrFallback}
        </span>
      );
    }

    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="w-full min-w-0 rounded px-1 py-0.5 text-left text-sm font-bold text-slate-900 transition hover:bg-white/60"
        title={`${title} — clic para editar`}
      >
        {displayOrFallback}
      </button>
    );
  }

  function renderValue(key: keyof InmuebleFormData) {
    if (key === 'fecha_entrada_inmueble') {
      return (
        <span className="text-sm font-bold text-slate-900">
          {formatInmuebleEntradaDate(detail.fecha_entrada_inmueble)}
        </span>
      );
    }

    if (key === 'fecha_visitas') {
      return (
        <span className="text-sm font-bold text-slate-900">
          {formatInmuebleEntradaDate(detail.fecha_visitas)}
        </span>
      );
    }

    if (key === 'fecha_visitas_entrada') {
      return (
        <span className="text-sm font-bold text-slate-900">
          {formatInmuebleEntradaDate(detail.fecha_visitas_entrada)}
        </span>
      );
    }

    const raw = toInmuebleCellValue(detail[key]);

    if (key === 'status') {
      return (
        <span className={emphasizedValueClass(key)}>
          {formatInmuebleStatusDisplay(detail.status)}
        </span>
      );
    }

    if (EMPHASIZED_KEYS.has(key)) {
      return (
        <span className={emphasizedValueClass(key)}>
          {formatInmuebleCell(key, raw)}
        </span>
      );
    }

    if (key === 'observaciones' || key === 'requisitos_propietario') {
      const text = formatInmuebleCell(key, raw);
      return (
        <span className="whitespace-pre-wrap text-sm text-slate-900">
          {text}
        </span>
      );
    }

    if (key === 'amueblado') {
      const display = getInmuebleAmuebladoLabel(
        typeof raw === 'string' ? raw : null,
      );
      return (
        <span
          className="block truncate text-sm font-bold text-slate-900"
          title={display !== '—' ? display : undefined}
        >
          {display}
        </span>
      );
    }

    return (
      <span className="text-sm text-slate-900">
        {formatInmuebleCell(key, raw)}
      </span>
    );
  }

  function renderInlineValue(key: keyof InmuebleFormData) {
    if (key === 'precio') return renderValue(key);
    if (key === 'hab' || key === 'banos' || key === 'metros') {
      const raw = toInmuebleCellValue(detail[key]);
      return (
        <span className="text-base font-extrabold leading-none text-slate-900 sm:text-lg">
          {formatInmuebleCell(key, raw)}
        </span>
      );
    }
    if (key === 'larga_estancia_temporada' || key === 'amueblado') {
      const raw = toInmuebleCellValue(detail[key]);
      const display =
        key === 'amueblado'
          ? getInmuebleAmuebladoLabel(
              typeof raw === 'string' ? raw : null,
            )
          : formatInmuebleCell(key, raw);
      return (
        <span className="text-sm font-bold leading-snug text-slate-900">
          {display}
        </span>
      );
    }
    if (key === 'captador' || key === 'alquilado_por') {
      const raw = toInmuebleCellValue(detail[key]);
      return (
        <span className="text-sm font-bold leading-none text-slate-900">
          {formatInmuebleCell(key, raw)}
        </span>
      );
    }
    if (
      key === 'fecha_entrada_inmueble' ||
      key === 'fecha_visitas' ||
      key === 'fecha_visitas_entrada'
    ) {
      const defaultIso =
        key === 'fecha_visitas'
          ? toDateInput(resolveInmuebleVisitasDate()) ||
            toDateInput(new Date().toISOString())
          : key === 'fecha_visitas_entrada'
            ? toDateInput(detail.fecha_visitas_entrada) ||
              toDateInput(new Date().toISOString())
            : toDateInput(detail.fecha_entrada_inmueble) ||
              toDateInput(new Date().toISOString());

      const title =
        key === 'fecha_entrada_inmueble'
          ? 'Fecha entrada al CRM'
          : key === 'fecha_visitas'
            ? 'Fecha de visitas'
            : 'Fecha entrada al piso';

      const value =
        key === 'fecha_visitas'
          ? (detail.fecha_visitas ?? null)
          : key === 'fecha_visitas_entrada'
            ? (detail.fecha_visitas_entrada ?? null)
            : (detail.fecha_entrada_inmueble ?? null);

      return (
        <EditableDateInline
          title={title}
          fieldKey={key}
          value={value}
          defaultIso={defaultIso}
        />
      );
    }
    return renderValue(key);
  }

  function renderGridCell(
    key: string,
    label: string,
    colSpan: number,
    content: ReactNode,
  ) {
    const spanClass =
      colSpan === 2
        ? 'col-span-2'
        : colSpan === 3
          ? 'col-span-3'
          : colSpan === 4
            ? 'col-span-4'
            : '';

    return (
      <div key={key} className={`min-w-0 ${spanClass}`}>
        <dt
          className={`leading-tight ${FIELD_TITLE_INLINE_CLASS}`}
          title={label}
        >
          {label}
        </dt>
        <dd className="mt-0.5 min-w-0 leading-snug">{content}</dd>
      </div>
    );
  }

  function renderInfoCardFieldValue(key: keyof InmuebleFormData) {
    if (key === 'observaciones' || key === 'requisitos_propietario') {
      return (
        <InmuebleObservacionesLineCell
          inmuebleId={inmueble.id}
          value={(detail[key] as string | null) ?? null}
          fieldKey={key}
          disabled={readOnly}
          variant="info"
          onUpdated={(next) =>
            onUpdated?.({
              ...inmueble,
              [key]: next,
            })
          }
        />
      );
    }

    if (INFO_CARD_ROW1_ORDER.includes(key)) {
      return renderInlineValue(key);
    }

    return renderValue(key);
  }

  function renderInfoCardRow(
    keys: (keyof InmuebleFormData)[],
    emptyTrailing = 0,
  ) {
    return (
      <>
        {keys.map((key) => {
          const field = fieldByKey.get(key);
          if (!field || HIDDEN_KEYS.has(key)) return null;
          const label = (
            INFO_CARD_LABEL_OVERRIDES[key] ??
            INLINE_FIELD_SHORT_LABELS[key] ??
            field.label
          ).toUpperCase();
          return renderGridCell(key, label, 1, renderInfoCardFieldValue(key));
        })}
        {Array.from({ length: emptyTrailing }, (_, index) => (
          <div key={`empty-${index}`} className="min-w-0" aria-hidden />
        ))}
      </>
    );
  }

  function renderRealInfoGrid() {
    const names = propietarios.map((p) => p.nombre.trim()).filter(Boolean);
    const phones = propietarios
      .map((p) => (p.telf ?? '').trim())
      .filter(Boolean);

    const entradaCrmDefault =
      toDateInput(detail.fecha_entrada_inmueble) ||
      toDateInput(new Date().toISOString());
    const visitasDefault =
      toDateInput(detail.fecha_visitas) ||
      toDateInput(new Date().toISOString());
    const entradaPisoDefault =
      toDateInput(detail.fecha_visitas_entrada) ||
      toDateInput(new Date().toISOString());

    return (
      <dl className={INFO_CARD_GRID_CLASS}>
        {renderInfoCardRow(INFO_CARD_ROW1_ORDER, 2)}
        {renderInfoCardRow(INFO_CARD_ROW2_ORDER)}
        {renderGridCell(
          'fecha_entrada_inmueble',
          'ENTRADA CRM',
          1,
          <EditableDateInline
            title="Fecha entrada al CRM"
            fieldKey="fecha_entrada_inmueble"
            value={detail.fecha_entrada_inmueble ?? null}
            defaultIso={entradaCrmDefault}
          />,
        )}
        {renderGridCell(
          'fecha_visitas',
          'FECHA VISITAS',
          1,
          <EditableDateInline
            title="Fecha de visitas"
            fieldKey="fecha_visitas"
            value={detail.fecha_visitas ?? null}
            defaultIso={visitasDefault}
          />,
        )}
        {renderGridCell(
          'fecha_visitas_entrada',
          'ENTRADA PISO',
          1,
          <EditableDateInline
            title="Fecha entrada al piso"
            fieldKey="fecha_visitas_entrada"
            value={detail.fecha_visitas_entrada ?? null}
            defaultIso={entradaPisoDefault}
          />,
        )}
        {renderGridCell(
          'propietario',
          'PROPI',
          1,
          <span className="text-sm font-bold text-slate-900">
            {names.length ? names.join(' / ') : '—'}
          </span>,
        )}
        {renderGridCell(
          'telefono_propietario',
          'TLF',
          1,
          <span className="text-sm font-bold tabular-nums text-slate-900">
            {phones.length ? phones.join(' / ') : '—'}
          </span>,
        )}
        <div className="min-w-0" aria-hidden />
        <div className="min-w-0" aria-hidden />
      </dl>
    );
  }

  function renderFieldGrid(
    fields: (typeof INMUEBLE_FIELDS)[number][],
    observacionesSpan = 'sm:col-span-3',
  ) {
    return (
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-3">
        {fields.map(({ key, label }) => (
          <div
            key={key}
            className={
              key === 'observaciones' || key === 'requisitos_propietario'
                ? observacionesSpan
                : undefined
            }
          >
            <dt className={`mb-0.5 leading-tight ${FIELD_TITLE_CLASS}`}>
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
    compactBottomOverlay = false,
  ) {
    const link =
      typeof linkValue === 'string' && linkValue.trim() ? linkValue.trim() : null;
    const hasImage = Boolean(imageUrl) && isUrl(imageUrl);

    return (
      <div>
        {label ? (
          <p className={`mb-1 ${SECTION_TITLE_CLASS}`}>{label}</p>
        ) : null}
        {hasImage ? (
          <InmuebleDenseImageCell
            imageUrl={imageUrl}
            topOverlayText={topOverlayText}
            bottomOverlayText={bottomOverlayText}
            alt={alt}
            backgroundColor={getInmuebleImageBackground(detail.tipo_operacion)}
            compactBottomOverlay={compactBottomOverlay}
            bottomOverlayCopyable={compactBottomOverlay}
            onPreview={() => onPreviewImage(imageUrl, alt)}
          />
        ) : (
          <div className="flex aspect-square w-full min-h-[5rem] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-[10px] text-slate-400">
            Sin imagen
          </div>
        )}
        {link ? (
          <div className="mt-2 space-y-1">
            <p className={`leading-tight ${FIELD_TITLE_INLINE_CLASS}`}>
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
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 gap-y-1 border-b border-slate-100 bg-slate-50/80 px-3 py-2">
          <Link
            href={listPath}
            className="inline-flex items-center gap-1 justify-self-start text-xs font-medium text-slate-500 transition hover:text-emerald-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {listLabel}
          </Link>
          <p
            className="min-w-0 truncate px-2 text-center text-xs font-semibold text-slate-800 sm:text-sm"
            title={refLabel !== '—' ? refLabel : undefined}
          >
            {refLabel}
          </p>
          <div className="flex items-center justify-end gap-2 justify-self-end">
            {isRefreshing ? <QueryRefreshingBadge /> : null}
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
        </div>
      ) : null}

      <div className="flex flex-col sm:flex-row">
        <div className="shrink-0 border-b border-slate-100 p-2.5 sm:w-32 sm:border-b-0 sm:border-r lg:w-36">
          {renderImageBlock(
            imagenSrc,
            realImageOverlays.top,
            realImageOverlays.bottom,
            'Imagen del inmueble',
            '',
            detail.ficha_del_piso_real,
            'Ficha del piso',
            true,
          )}
        </div>

        <div className="min-w-0 flex-1 overflow-x-auto p-3 sm:p-4">
          {renderRealInfoGrid()}
        </div>
      </div>

      {showEspejoSection ? (
        <>
          <div className="border-t-2 border-slate-300" aria-hidden />

          <div className="flex flex-col sm:flex-row">
            <div className="shrink-0 border-b border-slate-100 p-2.5 sm:w-32 sm:border-b-0 sm:border-r lg:w-36">
              {renderImageBlock(
                fotoEspejoSrc,
                espejoImageOverlays.top,
                espejoImageOverlays.bottom,
                'Foto espejo del inmueble',
                'Foto espejo',
                espejoLink,
                fieldByKey.get('link_espejo')?.label ?? 'Link espejo',
              )}
            </div>

            <div className="min-w-0 flex-1 p-3 sm:p-4">
              {renderFieldGrid(espejoFields, 'sm:col-span-2')}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
