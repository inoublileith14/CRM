export const INMUEBLE_AMUEBLADO_OPTIONS = [
  {
    value: 'electro_amueblada',
    label: 'Cocina con electrodomésticos y casa amueblada',
  },
  {
    value: 'electro_sin_amueblar',
    label: 'Cocina con electrodomésticos y casa sin amueblar',
  },
  {
    value: 'cocina_vacia_sin_amueblar',
    label: 'Cocina vacía y casa sin amueblar',
  },
  {
    value: 'no_lo_se',
    label: 'No lo sé',
  },
] as const;

export type InmuebleAmueblado =
  (typeof INMUEBLE_AMUEBLADO_OPTIONS)[number]['value'];

const VALUE_SET = new Set<string>(
  INMUEBLE_AMUEBLADO_OPTIONS.map((option) => option.value),
);

const LABEL_ALIASES: Record<string, InmuebleAmueblado> = {
  electro_amueblada: 'electro_amueblada',
  electro_sin_amueblar: 'electro_sin_amueblar',
  cocina_vacia_sin_amueblar: 'cocina_vacia_sin_amueblar',
  no_lo_se: 'no_lo_se',
  si: 'electro_amueblada',
  sí: 'electro_amueblada',
  no: 'electro_sin_amueblar',
  'cocina con electrodomesticos y casa amueblada': 'electro_amueblada',
  'cocina con electrodomésticos y casa amueblada': 'electro_amueblada',
  'cocina con electrodomesticos y casa sin amueblar': 'electro_sin_amueblar',
  'cocina con electrodomésticos y casa sin amueblar': 'electro_sin_amueblar',
  'cocina vacia y casa sin amueblar': 'cocina_vacia_sin_amueblar',
  'cocina vacía y casa sin amueblar': 'cocina_vacia_sin_amueblar',
  'no lo se': 'no_lo_se',
  'no lo sé': 'no_lo_se',
};

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

  if (isInmuebleAmueblado(trimmed)) {
    return trimmed;
  }

  const aliasKey = trimmed
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');

  return LABEL_ALIASES[aliasKey] ?? null;
}

export function getInmuebleAmuebladoLabel(
  value: string | null | undefined,
): string {
  const normalized = normalizeInmuebleAmueblado(value);
  if (!normalized) return '—';

  const option = INMUEBLE_AMUEBLADO_OPTIONS.find(
    (item) => item.value === normalized,
  );
  return option?.label ?? value ?? '—';
}

export function getInmuebleAmuebladoShortLabel(
  value: string | null | undefined,
): string {
  const normalized = normalizeInmuebleAmueblado(value);
  if (!normalized) return '—';

  switch (normalized) {
    case 'electro_amueblada':
      return 'Electro + amueblada';
    case 'electro_sin_amueblar':
      return 'Electro + sin amueblar';
    case 'cocina_vacia_sin_amueblar':
      return 'Cocina vacía';
    case 'no_lo_se':
      return 'No lo sé';
    default:
      return getInmuebleAmuebladoLabel(value);
  }
}
