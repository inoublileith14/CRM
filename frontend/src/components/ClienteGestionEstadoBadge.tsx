'use client';

import {
  getClienteGestionEstadoOption,
  getGestionOptionStyle,
} from '@/lib/cliente-gestion-estado';
import { TipoOperacion } from '@/types/inmueble';

interface ClienteGestionEstadoBadgeProps {
  value: string | null | undefined;
  tipoOperacion: TipoOperacion;
  compact?: boolean;
}

export function ClienteGestionEstadoBadge({
  value,
  tipoOperacion,
  compact = true,
}: ClienteGestionEstadoBadgeProps) {
  const option = getClienteGestionEstadoOption(value, tipoOperacion);

  return (
    <span
      className={`inline-block max-w-full truncate rounded font-bold uppercase leading-tight ${
        compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'
      }`}
      style={getGestionOptionStyle(option)}
      title={option.label}
    >
      {option.label}
    </span>
  );
}
