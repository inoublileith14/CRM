export type ClienteTipoNomina =
  | 'espanolas'
  | 'euro'
  | 'american'
  | 'otros';

export type ClienteTipoNominaOption = {
  value: ClienteTipoNomina;
  label: string;
  shortLabel: string;
};

export const CLIENTE_TIPO_NOMINA_OPTIONS: ClienteTipoNominaOption[] = [
  { value: 'espanolas', label: 'Españolas', shortLabel: 'ESP.' },
  { value: 'euro', label: 'Euro', shortLabel: 'EURO' },
  { value: 'american', label: 'Americana', shortLabel: 'AMER.' },
  { value: 'otros', label: 'Otros', shortLabel: 'OTROS' },
];

const CLIENTE_TIPO_NOMINA_BY_VALUE = new Map(
  CLIENTE_TIPO_NOMINA_OPTIONS.map((option) => [option.value, option]),
);

const CLIENTE_TIPO_NOMINA_ALIASES: Record<string, ClienteTipoNomina> = {
  espanolas: 'espanolas',
  españolas: 'espanolas',
  espanola: 'espanolas',
  española: 'espanolas',
  euro: 'euro',
  euros: 'euro',
  american: 'american',
  americana: 'american',
  americano: 'american',
  otros: 'otros',
  otro: 'otros',
};

export function isClienteTipoNomina(
  value: string | null | undefined,
): value is ClienteTipoNomina {
  return value != null && CLIENTE_TIPO_NOMINA_BY_VALUE.has(value as ClienteTipoNomina);
}

export function normalizeClienteTipoNomina(
  value: string | null | undefined,
): ClienteTipoNomina | null {
  if (!value?.trim()) return null;

  const trimmed = value.trim();
  if (isClienteTipoNomina(trimmed)) return trimmed;

  const normalized = trimmed
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');

  return CLIENTE_TIPO_NOMINA_ALIASES[normalized] ?? null;
}

export function getClienteTipoNominaOption(
  value: string | null | undefined,
): ClienteTipoNominaOption | null {
  const normalized = normalizeClienteTipoNomina(value);
  if (!normalized) return null;
  return CLIENTE_TIPO_NOMINA_BY_VALUE.get(normalized) ?? null;
}

export function getClienteTipoNominaLabel(
  value: string | null | undefined,
  compact = false,
): string {
  const option = getClienteTipoNominaOption(value);
  if (!option) return value?.trim() || '—';
  return compact ? option.shortLabel : option.label;
}
