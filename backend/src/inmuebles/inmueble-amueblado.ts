export const INMUEBLE_AMUEBLADO_VALUES = [
  'electro_amueblada',
  'electro_sin_amueblar',
  'cocina_vacia_sin_amueblar',
  'no_lo_se',
] as const;

export type InmuebleAmueblado = (typeof INMUEBLE_AMUEBLADO_VALUES)[number];

const VALUE_SET = new Set<string>(INMUEBLE_AMUEBLADO_VALUES);

export function isInmuebleAmueblado(
  value: string | null | undefined,
): value is InmuebleAmueblado {
  return Boolean(value && VALUE_SET.has(value));
}

export function normalizeInmuebleAmueblado(
  value: string | null | undefined,
): InmuebleAmueblado | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (isInmuebleAmueblado(trimmed)) return trimmed;
  if (trimmed === 'si') return 'electro_amueblada';
  if (trimmed === 'no') return 'electro_sin_amueblar';
  return null;
}
