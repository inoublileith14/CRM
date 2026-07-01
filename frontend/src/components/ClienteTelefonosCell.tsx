'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { updateCliente } from '@/lib/clientes-api';
import {
  getClientePhones,
  splitClientePhones,
} from '@/lib/cliente-telefonos';

interface ClienteTelefonosCellProps {
  clienteId: string;
  telefono: string | null;
  telefonosExtra?: string[] | null;
  disabled?: boolean;
  onUpdated: (patch: {
    telefono: string | null;
    telefonos_extra: string[];
  }) => void;
}

function AddPhoneButton({
  disabled,
  onClick,
}: {
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="inline-flex shrink-0 items-center justify-center rounded border border-slate-300 bg-white p-0.5 text-slate-600 transition hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-60"
      title="Añadir teléfono"
      aria-label="Añadir teléfono"
    >
      <Plus className="h-3 w-3" />
    </button>
  );
}

export function ClienteTelefonosCell({
  clienteId,
  telefono,
  telefonosExtra,
  disabled,
  onUpdated,
}: ClienteTelefonosCellProps) {
  const phones = getClientePhones({
    telefono,
    telefonos_extra: telefonosExtra,
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingIndex !== null) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editingIndex]);

  function cancelEdit() {
    if (saving) return;
    setEditingIndex(null);
    setDraft('');
  }

  async function persistPhones(nextPhones: string[]) {
    const payload = splitClientePhones(nextPhones);
    setSaving(true);
    try {
      await updateCliente(clienteId, payload);
      onUpdated({
        telefono: payload.telefono,
        telefonos_extra: payload.telefonos_extra,
      });
      setEditingIndex(null);
      setDraft('');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar el teléfono',
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveDraft(index: number) {
    const trimmed = draft.trim();
    const currentPhones = getClientePhones({
      telefono,
      telefonos_extra: telefonosExtra,
    });
    const nextPhones = [...currentPhones];

    if (index >= nextPhones.length) {
      if (!trimmed) {
        cancelEdit();
        return;
      }
      nextPhones.push(trimmed);
    } else if (!trimmed) {
      nextPhones.splice(index, 1);
    } else {
      nextPhones[index] = trimmed;
    }

    const unchanged =
      nextPhones.length === currentPhones.length &&
      nextPhones.every((phone, phoneIndex) => phone === currentPhones[phoneIndex]);

    if (unchanged) {
      cancelEdit();
      return;
    }

    await persistPhones(nextPhones);
  }

  function startEdit(index: number) {
    if (disabled || saving) return;
    const currentPhones = getClientePhones({
      telefono,
      telefonos_extra: telefonosExtra,
    });
    setEditingIndex(index);
    setDraft(currentPhones[index] ?? '');
  }

  function startAdd() {
    if (disabled || saving || editingIndex !== null) return;
    const currentPhones = getClientePhones({
      telefono,
      telefonos_extra: telefonosExtra,
    });
    setEditingIndex(currentPhones.length);
    setDraft('');
  }

  const showAsteriskList = phones.length > 2;
  const firstPhone = phones[0];
  const extraPhones = phones.slice(1);
  const editingFirst = editingIndex === 0;
  const editingNew =
    editingIndex !== null && editingIndex >= phones.length && phones.length > 0;
  const editingEmpty = editingIndex === 0 && phones.length === 0;

  function renderPhoneInput(
    index: number,
    placeholder: string,
    withAsterisk = false,
  ) {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-1">
        {withAsterisk ? (
          <span className="shrink-0 text-xs font-bold text-slate-500">*</span>
        ) : null}
        <input
          ref={inputRef}
          type="tel"
          value={draft}
          disabled={saving}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => void saveDraft(index)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void saveDraft(index);
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              cancelEdit();
            }
          }}
          onClick={(event) => event.stopPropagation()}
          className="w-full min-w-0 rounded border border-emerald-400 bg-white px-1 py-0.5 text-[11px] tabular-nums text-slate-900 outline-none ring-2 ring-emerald-500/20"
          placeholder={placeholder}
        />
        {saving ? (
          <Loader2 className="h-3 w-3 shrink-0 animate-spin text-slate-400" />
        ) : null}
      </div>
    );
  }

  function renderPhoneButton(
    phone: string,
    index: number,
    withAsterisk = false,
  ) {
    return (
      <button
        type="button"
        disabled={disabled || saving}
        onClick={(event) => {
          event.stopPropagation();
          startEdit(index);
        }}
        className="shrink-0 whitespace-nowrap rounded px-0.5 py-0.5 text-left transition hover:bg-slate-100 disabled:opacity-60"
        title={`${phone} — clic para editar`}
      >
        {withAsterisk ? (
          <span className="shrink-0 text-xs font-bold text-slate-500">*</span>
        ) : null}
        <span className="whitespace-nowrap text-[11px] leading-tight tabular-nums text-slate-700">
          {phone}
        </span>
      </button>
    );
  }

  return (
    <div className="flex min-w-0 flex-col justify-center gap-0.5">
      <div className="flex min-w-0 items-center gap-1">
        <AddPhoneButton
          disabled={disabled || saving || editingIndex !== null}
          onClick={startAdd}
        />

        {editingFirst || editingEmpty
          ? renderPhoneInput(0, 'Teléfono…')
          : firstPhone
            ? renderPhoneButton(firstPhone, 0)
            : (
                <button
                  type="button"
                  disabled={disabled || saving}
                  onClick={(event) => {
                    event.stopPropagation();
                    startAdd();
                  }}
                  className="min-w-0 flex-1 rounded px-0.5 py-0.5 text-left text-[11px] text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-60"
                  title="Clic para añadir teléfono"
                >
                  —
                </button>
              )}
      </div>

      {extraPhones.map((phone, offset) => {
        const index = offset + 1;
        const withAsterisk = showAsteriskList && index >= 2;

        if (editingIndex === index) {
          return (
            <div key={`edit-${index}`} className="flex items-center gap-1 pl-5">
              {renderPhoneInput(index, 'Teléfono…', withAsterisk)}
            </div>
          );
        }

        return (
          <div key={`${index}-${phone}`} className="flex items-center gap-1 pl-5">
            {renderPhoneButton(phone, index, withAsterisk)}
          </div>
        );
      })}

      {editingNew ? (
        <div className="flex items-center gap-1 pl-5">
          {renderPhoneInput(
            editingIndex,
            'Nuevo teléfono…',
            showAsteriskList || phones.length >= 2,
          )}
        </div>
      ) : null}
    </div>
  );
}
