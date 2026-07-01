export const CLIENTE_ENTRADA_PREVISTA_OPTIONS = [
  { value: 'ya', label: 'YA' },
  { value: 'semana', label: '1 SEMANA' },
  { value: '15_dias', label: '15 DIA' },
  { value: 'mes', label: '1 MES' },
  { value: 'mas_mes', label: '2 MAS' },
  /** Sin información de entrada prevista */
  { value: 'sin_info', label: '—' },
] as const;

export type ClienteEntradaPrevista =
  (typeof CLIENTE_ENTRADA_PREVISTA_OPTIONS)[number]['value'];

const VALUE_SET = new Set<string>(
  CLIENTE_ENTRADA_PREVISTA_OPTIONS.map((option) => option.value),
);

const LABEL_ALIASES: Record<string, ClienteEntradaPrevista> = {
  ya: 'ya',
  semana: 'semana',
  '1_semana': 'semana',
  '15_dias': '15_dias',
  '15_dia': '15_dias',
  '15dias': '15_dias',
  mes: 'mes',
  '1_mes': 'mes',
  mas_mes: 'mas_mes',
  masmes: 'mas_mes',
  '2_mas': 'mas_mes',
  mas: 'mas_mes',
  sin_info: 'sin_info',
  sin_informacion: 'sin_info',
  vacio: 'sin_info',
  vasio: 'sin_info',
  '-': 'sin_info',
  '—': 'sin_info',
};

export function isClienteEntradaPrevista(
  value: string | null | undefined,
): value is ClienteEntradaPrevista {
  return Boolean(value && VALUE_SET.has(value));
}

export function normalizeClienteEntradaPrevista(
  value: string | null | undefined,
): ClienteEntradaPrevista | null {
  if (value == null) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (isClienteEntradaPrevista(trimmed)) {
    return trimmed;
  }

  const aliasKey = trimmed
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, '_');

  return LABEL_ALIASES[aliasKey] ?? null;
}

export function getClienteEntradaPrevistaOption(
  value: string | null | undefined,
): { value: ClienteEntradaPrevista | null; label: string } {
  const normalized = normalizeClienteEntradaPrevista(value);
  if (!normalized) {
    return { value: null, label: '—' };
  }

  const option = CLIENTE_ENTRADA_PREVISTA_OPTIONS.find(
    (item) => item.value === normalized,
  );
  return {
    value: normalized,
    label: option?.label ?? normalized.toUpperCase(),
  };
}

export function formatClienteEntradaPrevistaLabel(
  value: string | null | undefined,
): string {
  return getClienteEntradaPrevistaOption(value).label;
}
