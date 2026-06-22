'use client';

import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Cliente } from '@/types/cliente';

const compactToolbarButtonClass =
  'inline-flex h-7 w-[11.25rem] shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-md px-2 text-xs font-semibold';

interface ClienteCopyContactsButtonProps {
  clientes: Cliente[];
  disabled?: boolean;
  compact?: boolean;
}

function formatClientsContacts(clientes: Cliente[]): string {
  return clientes
    .map((cliente) => {
      const nombre = cliente.nombre.trim();
      const telefono = (cliente.telefono ?? '').trim();
      return `${nombre}\t${telefono}`;
    })
    .join('\n');
}

export function ClienteCopyContactsButton({
  clientes,
  disabled,
  compact,
}: ClienteCopyContactsButtonProps) {
  async function handleCopy() {
    if (clientes.length === 0) {
      toast.error('Selecciona al menos un cliente');
      return;
    }

    const text = formatClientsContacts(clientes);

    try {
      await navigator.clipboard.writeText(text);
      toast.success(
        `${clientes.length} contacto${clientes.length !== 1 ? 's' : ''} copiado${clientes.length !== 1 ? 's' : ''}`,
      );
    } catch {
      toast.error('No se pudo copiar al portapapeles');
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      disabled={disabled || clientes.length === 0}
      className={
        compact
          ? `${compactToolbarButtonClass} border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 disabled:opacity-60`
          : 'inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 sm:w-auto'
      }
      title="Copiar nombres y teléfonos de los clientes seleccionados"
    >
      <Copy className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      Copiar seleccionados
    </button>
  );
}
