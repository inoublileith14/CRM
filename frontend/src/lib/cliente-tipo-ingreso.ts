export type ClienteTipoIngreso = 'contrato' | 'freelance';

export type ClienteTipoIngresoOption = {
  value: ClienteTipoIngreso;
  label: string;
  shortLabel: string;
};

export const CLIENTE_TIPO_INGRESO_OPTIONS: ClienteTipoIngresoOption[] = [
  { value: 'contrato', label: 'Contrato', shortLabel: 'CONT.' },
  { value: 'freelance', label: 'Freelance', shortLabel: 'FREE.' },
];

const CLIENTE_TIPO_INGRESO_BY_VALUE = new Map(
  CLIENTE_TIPO_INGRESO_OPTIONS.map((option) => [option.value, option]),
);

const CLIENTE_TIPO_INGRESO_ALIASES: Record<string, ClienteTipoIngreso> = {
  contrato: 'contrato',
  'contrato indefinido': 'contrato',
  indefinido: 'contrato',
  freelance: 'freelance',
  autonomo: 'freelance',
  autónomo: 'freelance',
  autonomos: 'freelance',
  autónomos: 'freelance',
};

export function isClienteTipoIngreso(
  value: string | null | undefined,
): value is ClienteTipoIngreso {
  return (
    value != null && CLIENTE_TIPO_INGRESO_BY_VALUE.has(value as ClienteTipoIngreso)
  );
}

export function normalizeClienteTipoIngreso(
  value: string | null | undefined,
): ClienteTipoIngreso | null {
  if (!value?.trim()) return null;

  const trimmed = value.trim();
  if (isClienteTipoIngreso(trimmed)) return trimmed;

  const normalized = trimmed
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');

  return CLIENTE_TIPO_INGRESO_ALIASES[normalized] ?? null;
}

export function getClienteTipoIngresoOption(
  value: string | null | undefined,
): ClienteTipoIngresoOption | null {
  const normalized = normalizeClienteTipoIngreso(value);
  if (!normalized) return null;
  return CLIENTE_TIPO_INGRESO_BY_VALUE.get(normalized) ?? null;
}

export function getClienteTipoIngresoLabel(
  value: string | null | undefined,
  compact = false,
): string {
  const option = getClienteTipoIngresoOption(value);
  if (!option) return value?.trim() || '—';
  return compact ? option.shortLabel : option.label;
}
