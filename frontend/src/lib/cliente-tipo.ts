export type ClienteTipoCliente =
  | 'estudiante'
  | 'parejas'
  | 'familia_con_hijos'
  | 'compartir';

export type ClienteTipoClienteOption = {
  value: ClienteTipoCliente;
  label: string;
  shortLabel: string;
};

export const CLIENTE_TIPO_CLIENTE_OPTIONS: ClienteTipoClienteOption[] = [
  { value: 'estudiante', label: 'ESTUDIANTE', shortLabel: 'ESTUD.' },
  { value: 'parejas', label: 'PAREJAS', shortLabel: 'PAREJ.' },
  {
    value: 'familia_con_hijos',
    label: 'FAMILIA CON HIJOS',
    shortLabel: 'FAM.',
  },
  { value: 'compartir', label: 'COMPARTIR', shortLabel: 'COMP.' },
];

const CLIENTE_TIPO_CLIENTE_BY_VALUE = new Map(
  CLIENTE_TIPO_CLIENTE_OPTIONS.map((option) => [option.value, option]),
);

export function isClienteTipoCliente(
  value: string | null | undefined,
): value is ClienteTipoCliente {
  return value != null && CLIENTE_TIPO_CLIENTE_BY_VALUE.has(value as ClienteTipoCliente);
}

export function getClienteTipoClienteOption(
  value: string | null | undefined,
): ClienteTipoClienteOption | null {
  if (!isClienteTipoCliente(value)) return null;
  return CLIENTE_TIPO_CLIENTE_BY_VALUE.get(value) ?? null;
}

export function getClienteTipoClienteLabel(
  value: string | null | undefined,
  compact = false,
): string {
  const option = getClienteTipoClienteOption(value);
  if (!option) return '—';
  return compact ? option.shortLabel : option.label;
}
