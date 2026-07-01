import { BadRequestException } from '@nestjs/common';

export const CLIENTE_ENTRADA_PREVISTA_VALUES = [
  'ya',
  'semana',
  '15_dias',
  'mes',
  'mas_mes',
  'sin_info',
] as const;

export type ClienteEntradaPrevista =
  (typeof CLIENTE_ENTRADA_PREVISTA_VALUES)[number];

const VALUE_SET = new Set<string>(CLIENTE_ENTRADA_PREVISTA_VALUES);

const LABEL_ALIASES: Record<string, ClienteEntradaPrevista> = {
  ya: 'ya',
  semana: 'semana',
  '1_semana': 'semana',
  '15_dias': '15_dias',
  '15_dia': '15_dias',
  '15dias': '15_dias',
  '15_días': '15_dias',
  mes: 'mes',
  '1_mes': 'mes',
  mas_mes: 'mas_mes',
  masmes: 'mas_mes',
  '2_mas': 'mas_mes',
  mas: 'mas_mes',
  'más_mes': 'mas_mes',
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

  const fromAlias = LABEL_ALIASES[aliasKey];
  if (fromAlias) return fromAlias;

  return null;
}

export function parseClienteEntradaPrevistaInput(
  value: string | null | undefined,
): ClienteEntradaPrevista | null {
  const normalized = normalizeClienteEntradaPrevista(value);
  if (normalized || value == null || !String(value).trim()) {
    return normalized;
  }

  throw new BadRequestException({
    message:
      'Entrada prevista no válida. Usa: YA, 1 SEMANA, 15 DIA, 1 MES, 2 MAS o — (sin información)',
    code: 'CLIENTE_ENTRADA_PREVISTA_INVALID',
  });
}
