'use client';

import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ImageUploadField } from '@/components/ImageUploadField';
import {
  getInmueblePropietarios,
  MAX_INMUEBLE_PROPIETARIOS,
  padPropietarioFormSlots,
  parsePropietariosFromForm,
} from '@/lib/inmueble-propietarios';
import {
  hydrateInmuebleSplitFields,
  normalizeInmuebleSplitFieldsForSave,
} from '@/lib/inmueble-split-fields';
import { toInmuebleCellValue } from '@/lib/inmueble-table-utils';
import {
  INMUEBLE_FIELDS,
  InmuebleFormData,
  TIPO_OPERACION_LABELS,
  TipoOperacion,
  emptyInmuebleForm,
  getInmuebleDefaultEntradaDate,
} from '@/types/inmueble';

interface InmuebleFormProps {
  initial?: InmuebleFormData;
  onSubmit: (data: InmuebleFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  loading?: boolean;
  fixedTipoOperacion?: TipoOperacion;
}

type FieldDef = (typeof INMUEBLE_FIELDS)[number];

const FORM_SECTIONS: {
  title: string;
  description?: string;
  keys: (keyof InmuebleFormData)[];
  imageGrid?: boolean;
  showPropietariosFields?: boolean;
}[] = [
  {
    title: 'Operación',
    keys: ['tipo_operacion', 'ref', 'status'],
  },
  {
    title: 'Imágenes del inmueble',
    description:
      'Foto real del piso y foto espejo. Clic en la imagen para verla en grande.',
    keys: ['imagen_real', 'foto_espejo'],
    imageGrid: true,
  },
  {
    title: 'Ubicación',
    keys: ['direccion_piso_real', 'espejo_direccion', 'barrio_distrito', 'distrito_ciudad'],
  },
  {
    title: 'Características',
    keys: [
      'precio',
      'precio_espejo',
      'hab',
      'banos',
      'metros',
      'larga_estancia_temporada',
      'amueblado',
    ],
  },
  {
    title: 'Propietarios',
    description: 'Hasta 5 propietarios con nombre y teléfono.',
    showPropietariosFields: true,
    keys: [],
  },
  {
    title: 'Enlaces y captación',
    keys: [
      'captador',
      'alquilado_por',
      'ficha_del_piso_real',
      'link_idealista',
      'link_espejo',
      'fecha_visitas',
      'fecha_visitas_entrada',
    ],
  },
  {
    title: 'Observaciones y requisitos',
    keys: ['observaciones', 'requisitos_propietario'],
  },
];

const fieldByKey = new Map(
  INMUEBLE_FIELDS.map((field) => [field.key, field]),
);

function toFormValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

function toDateInputValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const raw = String(value);
  const isoMatch = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function InmuebleForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
  loading = false,
  fixedTipoOperacion,
}: InmuebleFormProps) {
  const defaults = hydrateInmuebleSplitFields(initial ?? emptyInmuebleForm());
  const [propietarioSlots, setPropietarioSlots] = useState(() =>
    padPropietarioFormSlots(getInmueblePropietarios(defaults)),
  );

  useEffect(() => {
    setPropietarioSlots(
      padPropietarioFormSlots(getInmueblePropietarios(defaults)),
    );
  }, [initial]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const tipoOperacion =
      fixedTipoOperacion ||
      ((form.get('tipo_operacion') as 'alquiler' | 'venta') || null);

    const propietariosContactos = parsePropietariosFromForm(propietarioSlots);
    const firstOwner = propietariosContactos[0];

    const data = normalizeInmuebleSplitFieldsForSave({
      ref: (form.get('ref') as string) || null,
      fecha_entrada_inmueble: initial
        ? defaults.fecha_entrada_inmueble ?? getInmuebleDefaultEntradaDate()
        : getInmuebleDefaultEntradaDate(),
      imagen_real: (form.get('imagen_real') as string) || null,
      direccion_piso_real: (form.get('direccion_piso_real') as string) || null,
      foto_espejo: (form.get('foto_espejo') as string) || null,
      espejo_direccion: (form.get('espejo_direccion') as string) || null,
      barrio_distrito: (form.get('barrio_distrito') as string) || null,
      distrito_ciudad: (form.get('distrito_ciudad') as string) || null,
      precio: form.get('precio') ? Number(form.get('precio')) : null,
      precio_espejo: form.get('precio_espejo')
        ? Number(form.get('precio_espejo'))
        : null,
      hab: form.get('hab') ? Number(form.get('hab')) : null,
      banos: form.get('banos') ? Number(form.get('banos')) : null,
      metros: form.get('metros') ? Number(form.get('metros')) : null,
      larga_estancia_temporada:
        (form.get('larga_estancia_temporada') as 'larga' | 't') || null,
      propietario_id: null,
      propietarios_contactos: propietariosContactos,
      nombre_propi: firstOwner?.nombre ?? null,
      telf: firstOwner?.telf ?? null,
      ficha_del_piso_real: (form.get('ficha_del_piso_real') as string) || null,
      link_idealista: (form.get('link_idealista') as string) || null,
      link_espejo: (form.get('link_espejo') as string) || null,
      link_idealista_espejo: null,
      fecha_visitas: (form.get('fecha_visitas') as string) || null,
      fecha_visitas_entrada:
        (form.get('fecha_visitas_entrada') as string) || null,
      observaciones: (form.get('observaciones') as string) || null,
      requisitos_propietario:
        (form.get('requisitos_propietario') as string) || null,
      amueblado: (form.get('amueblado') as 'si' | 'no') || null,
      captador: (form.get('captador') as string) || null,
      alquilado_por: (form.get('alquilado_por') as string) || null,
      captador_alquilado_por: null,
      status: (form.get('status') as 'I' | 'P' | 'I-M') || null,
      activo: defaults.activo ?? true,
      row_color: defaults.row_color ?? null,
      tipo_operacion: tipoOperacion,
    });

    if (!data.tipo_operacion) {
      toast.error('Selecciona alquiler o venta');
      return;
    }

    await onSubmit(data);
  }

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60';

  function updatePropietarioSlot(
    index: number,
    field: 'nombre' | 'telf',
    value: string,
  ) {
    setPropietarioSlots((prev) =>
      prev.map((slot, slotIndex) =>
        slotIndex === index ? { ...slot, [field]: value } : slot,
      ),
    );
  }

  function renderPropietariosFields() {
    return (
      <div className="space-y-3">
        {propietarioSlots.map((slot, index) => (
          <div
            key={index}
            className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-2"
          >
            <div>
              <label
                htmlFor={`propietario_nombre_${index}`}
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600"
              >
                Propietario {index + 1} — Nombre
              </label>
              <input
                id={`propietario_nombre_${index}`}
                type="text"
                value={slot.nombre}
                onChange={(event) =>
                  updatePropietarioSlot(index, 'nombre', event.target.value)
                }
                disabled={loading}
                className={inputClass}
                placeholder={index === 0 ? 'Nombre del propietario' : 'Opcional'}
              />
            </div>
            <div>
              <label
                htmlFor={`propietario_telf_${index}`}
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600"
              >
                Propietario {index + 1} — Teléfono
              </label>
              <input
                id={`propietario_telf_${index}`}
                type="text"
                value={slot.telf}
                onChange={(event) =>
                  updatePropietarioSlot(index, 'telf', event.target.value)
                }
                disabled={loading}
                className={inputClass}
                placeholder="Teléfono"
              />
            </div>
          </div>
        ))}
        <p className="text-xs text-slate-400">
          Puedes dejar filas vacías. Máximo {MAX_INMUEBLE_PROPIETARIOS}{' '}
          propietarios.
        </p>
      </div>
    );
  }

  function renderImageField(field: FieldDef) {
    return (
      <ImageUploadField
        key={field.key}
        name={field.key}
        label={field.label}
        defaultUrl={defaults[field.key] as string | null}
        disabled={loading}
      />
    );
  }

  function renderStandardField(field: FieldDef) {
    if (field.key === 'tipo_operacion' && fixedTipoOperacion) {
      return (
        <div key={field.key}>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
            {field.label}
          </label>
          <input type="hidden" name="tipo_operacion" value={fixedTipoOperacion} />
          <p className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
            {TIPO_OPERACION_LABELS[fixedTipoOperacion]}
          </p>
        </div>
      );
    }

    const fullWidth = field.type === 'textarea';

    return (
      <div
        key={field.key}
        className={fullWidth ? 'sm:col-span-2' : undefined}
      >
        <label
          htmlFor={field.key}
          className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600"
        >
          {field.label}
        </label>

        {field.type === 'select' ? (
          <select
            id={field.key}
            name={field.key}
            defaultValue={
              field.key === 'tipo_operacion' && fixedTipoOperacion
                ? fixedTipoOperacion
                : toFormValue(toInmuebleCellValue(defaults[field.key]))
            }
            disabled={loading || field.key === 'tipo_operacion'}
            required={field.key === 'tipo_operacion' && !fixedTipoOperacion}
            className={inputClass}
          >
            <option value="">
              {field.key === 'tipo_operacion'
                ? 'Selecciona alquiler o venta'
                : '—'}
            </option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : field.type === 'textarea' ? (
          <textarea
            id={field.key}
            name={field.key}
            rows={4}
            defaultValue={toFormValue(toInmuebleCellValue(defaults[field.key]))}
            disabled={loading}
            className={inputClass}
          />
        ) : field.type === 'date' ? (
          <input
            id={field.key}
            name={field.key}
            type="date"
            defaultValue={toDateInputValue(
              defaults[field.key] as string | null | undefined,
            )}
            disabled={loading}
            className={inputClass}
          />
        ) : (
          <input
            id={field.key}
            name={field.key}
            type={field.type}
            step={field.type === 'number' ? 'any' : undefined}
            defaultValue={toFormValue(toInmuebleCellValue(defaults[field.key]))}
            disabled={loading}
            className={inputClass}
          />
        )}
      </div>
    );
  }

  function renderSectionFields(
    section: (typeof FORM_SECTIONS)[number],
  ): ReactNode {
    if (section.showPropietariosFields) {
      return renderPropietariosFields();
    }

    const fields = section.keys
      .map((key) => fieldByKey.get(key))
      .filter((field): field is FieldDef => field != null);

    if (section.imageGrid) {
      return (
        <div className="grid gap-6 lg:grid-cols-2">
          {fields.map((field) => renderImageField(field))}
        </div>
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) =>
          field.type === 'image'
            ? renderImageField(field)
            : renderStandardField(field),
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {FORM_SECTIONS.map((section) => (
        <section
          key={section.title}
          className="rounded-xl border border-slate-200 bg-slate-50/50 p-5"
        >
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-900">
              {section.title}
            </h3>
            {section.description && (
              <p className="mt-1 text-xs text-slate-500">
                {section.description}
              </p>
            )}
          </div>
          {renderSectionFields(section)}
        </section>
      ))}

      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
        >
          {loading ? 'Guardando…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
