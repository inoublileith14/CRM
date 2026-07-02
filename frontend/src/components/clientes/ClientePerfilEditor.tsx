'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClientePerfil, updateClientePerfil } from '@/lib/clientes-api';
import {
  CLIENTE_TIPO_NOMINA_OPTIONS,
  normalizeClienteTipoNomina,
} from '@/lib/cliente-tipo-nomina';
import {
  CLIENTE_TIPO_INGRESO_OPTIONS,
  normalizeClienteTipoIngreso,
} from '@/lib/cliente-tipo-ingreso';
import { ClientePerfil, ClientePerfilInput } from '@/types/cliente';

interface ClientePerfilEditorProps {
  clienteId: string;
  perfil: ClientePerfil;
  accentClassName?: string;
  onSaved: () => void;
}

interface PerfilDraft {
  nombre: string;
  telefono: string;
  pais: string;
  tipo_nomina: string;
  tipo_ingreso: string;
  ingreso_monto: string;
  banos: string;
  notas: string;
}

function isLegacyPerfil(id: string): boolean {
  return id.startsWith('legacy-');
}

function perfilToDraft(perfil: ClientePerfil): PerfilDraft {
  return {
    nombre: perfil.nombre?.trim() ?? '',
    telefono: perfil.telefono?.trim() ?? '',
    pais: perfil.pais?.trim() ?? '',
    tipo_nomina: normalizeClienteTipoNomina(perfil.tipo_nomina) ?? '',
    tipo_ingreso: normalizeClienteTipoIngreso(perfil.tipo_ingreso) ?? '',
    ingreso_monto:
      perfil.ingreso_monto != null && !Number.isNaN(perfil.ingreso_monto)
        ? String(perfil.ingreso_monto)
        : '',
    banos:
      perfil.banos != null && !Number.isNaN(perfil.banos)
        ? String(perfil.banos)
        : '',
    notas: perfil.notas?.trim() ?? '',
  };
}

function parseIngresoMonto(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const normalized = trimmed
    .replace(/€/gi, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function parseIntegerDraft(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed.replace(',', '.'));
  return Number.isFinite(value) ? Math.trunc(value) : null;
}

function draftToPayload(
  draft: PerfilDraft,
  orden: number,
): Partial<ClientePerfilInput> {
  const ingreso = parseIngresoMonto(draft.ingreso_monto);
  if (draft.ingreso_monto.trim() && ingreso === null) {
    throw new Error('Introduce un importe de ingreso válido');
  }

  const banos = parseIntegerDraft(draft.banos);
  if (draft.banos.trim() && banos === null) {
    throw new Error('Introduce un número válido de baños');
  }

  return {
    orden,
    nombre: draft.nombre.trim() || null,
    telefono: draft.telefono.trim() || null,
    pais: draft.pais.trim() || null,
    tipo_nomina: draft.tipo_nomina.trim() || null,
    tipo_ingreso: draft.tipo_ingreso.trim() || null,
    ingreso_monto: ingreso,
    banos,
    notas: draft.notas.trim() || null,
  };
}

function PerfilField({
  label,
  value,
  onChange,
  className,
  accentClassName,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  accentClassName?: string;
  type?: 'text' | 'number';
  placeholder?: string;
}) {
  return (
    <label className={`block rounded-xl bg-slate-50 px-3 py-2 ${className ?? ''}`}>
      <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 sm:text-[10px]">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`mt-0.5 w-full border-0 bg-transparent p-0 text-xs font-bold leading-snug text-slate-900 outline-none ring-0 placeholder:font-normal placeholder:text-slate-400 focus:ring-0 sm:text-sm ${
          accentClassName ?? ''
        }`}
      />
    </label>
  );
}

function PerfilSelectField({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  className?: string;
}) {
  return (
    <label className={`block rounded-xl bg-slate-50 px-3 py-2 ${className ?? ''}`}>
      <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 sm:text-[10px]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-0.5 w-full border-0 bg-transparent p-0 text-xs font-bold leading-snug text-slate-900 outline-none ring-0 focus:ring-0 sm:text-sm"
      >
        <option value="">—</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ClientePerfilEditor({
  clienteId,
  perfil,
  accentClassName,
  onSaved,
}: ClientePerfilEditorProps) {
  const [draft, setDraft] = useState<PerfilDraft>(() => perfilToDraft(perfil));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(perfilToDraft(perfil));
  }, [perfil]);

  function updateField<K extends keyof PerfilDraft>(key: K, value: PerfilDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = draftToPayload(draft, perfil.orden);

      if (isLegacyPerfil(perfil.id)) {
        await createClientePerfil(clienteId, payload);
      } else {
        await updateClientePerfil(clienteId, perfil.id, payload);
      }

      onSaved();
      toast.success(`Perfil P${perfil.orden} guardado`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar el perfil',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
        <PerfilField
          label="Nombre"
          value={draft.nombre}
          onChange={(value) => updateField('nombre', value)}
          className="sm:col-span-2"
          placeholder="Nombre del titular"
        />
        <PerfilField
          label="Teléfono"
          value={draft.telefono}
          onChange={(value) => updateField('telefono', value)}
          placeholder="600 00 00 00"
        />
        <PerfilField
          label="País"
          value={draft.pais}
          onChange={(value) => updateField('pais', value)}
          placeholder="España"
        />
        <PerfilSelectField
          label="Tipo nómina"
          value={draft.tipo_nomina}
          onChange={(value) => updateField('tipo_nomina', value)}
          options={CLIENTE_TIPO_NOMINA_OPTIONS}
        />
        <PerfilSelectField
          label="Origen ingresos"
          value={draft.tipo_ingreso}
          onChange={(value) => updateField('tipo_ingreso', value)}
          options={CLIENTE_TIPO_INGRESO_OPTIONS}
        />
        <PerfilField
          label="Ingreso"
          value={draft.ingreso_monto}
          onChange={(value) => updateField('ingreso_monto', value)}
          accentClassName={accentClassName}
          placeholder="1700"
        />
        <PerfilField
          label="Baños"
          value={draft.banos}
          onChange={(value) => updateField('banos', value)}
          type="number"
          placeholder="1"
        />
        <label className="block rounded-xl bg-slate-50 px-3 py-2 sm:col-span-2">
          <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 sm:text-[10px]">
            Notas
          </span>
          <textarea
            value={draft.notas}
            onChange={(event) => updateField('notas', event.target.value)}
            rows={2}
            placeholder="Observaciones del perfil"
            className="mt-0.5 w-full resize-y border-0 bg-transparent p-0 text-xs font-medium leading-snug text-slate-900 outline-none ring-0 placeholder:font-normal placeholder:text-slate-400 focus:ring-0 sm:text-sm"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60 sm:text-sm"
      >
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        Guardar perfil
      </button>
    </div>
  );
}
