import { Inmueble } from '@/types/inmueble';
import { getInmueblePropietarios } from '@/lib/inmueble-propietarios';

export interface InmuebleAlquilerFilters {
  ref: string;
  zona: string;
  precio_min: string;
  precio_max: string;
  hab_min: string;
  hab_max: string;
  banos_min: string;
  banos_max: string;
  metros_min: string;
  metros_max: string;
  propietario: string;
  fecha_entrada_desde: string;
  fecha_entrada_hasta: string;
}

export const EMPTY_INMUEBLE_ALQUILER_FILTERS: InmuebleAlquilerFilters = {
  ref: '',
  zona: '',
  precio_min: '',
  precio_max: '',
  hab_min: '',
  hab_max: '',
  banos_min: '',
  banos_max: '',
  metros_min: '',
  metros_max: '',
  propietario: '',
  fecha_entrada_desde: '',
  fecha_entrada_hasta: '',
};

export type FilterSearchOption = {
  value: string;
  label: string;
  sublabel?: string;
};

function parseNumberInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function matchesNumericRange(
  value: number | null,
  minRaw: string,
  maxRaw: string,
): boolean {
  const min = parseNumberInput(minRaw);
  const max = parseNumberInput(maxRaw);
  if (min === null && max === null) return true;
  if (value === null) return false;
  if (min !== null && value < min) return false;
  if (max !== null && value > max) return false;
  return true;
}

function matchesDateRange(
  value: string | null | undefined,
  desde: string,
  hasta: string,
): boolean {
  const desdeIso = desde.trim();
  const hastaIso = hasta.trim();
  if (!desdeIso && !hastaIso) return true;
  if (!value) return false;

  const date = value.slice(0, 10);
  if (desdeIso && date < desdeIso) return false;
  if (hastaIso && date > hastaIso) return false;
  return true;
}

function matchesPropietario(inmueble: Inmueble, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const qCompact = q.replace(/\s/g, '');

  return getInmueblePropietarios(inmueble).some((propietario) => {
    const nombre = propietario.nombre.toLowerCase();
    const telf = propietario.telf?.replace(/\s/g, '').toLowerCase() ?? '';

    if (nombre.includes(q)) return true;
    if (telf.includes(qCompact)) return true;

    const combined = `${nombre} · ${propietario.telf ?? ''}`.toLowerCase();
    return combined.includes(q);
  });
}

function matchesZona(inmueble: Inmueble, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const direccion = inmueble.direccion_piso_real?.toLowerCase() ?? '';
  const barrio = inmueble.barrio_distrito?.toLowerCase() ?? '';

  return direccion.includes(q) || barrio.includes(q);
}

export function hasActiveInmuebleAlquilerFilters(
  filters: InmuebleAlquilerFilters,
): boolean {
  return (
    filters.ref.trim() !== '' ||
    filters.zona.trim() !== '' ||
    filters.propietario.trim() !== '' ||
    filters.fecha_entrada_desde.trim() !== '' ||
    filters.fecha_entrada_hasta.trim() !== '' ||
    filters.precio_min.trim() !== '' ||
    filters.precio_max.trim() !== '' ||
    filters.hab_min.trim() !== '' ||
    filters.hab_max.trim() !== '' ||
    filters.banos_min.trim() !== '' ||
    filters.banos_max.trim() !== '' ||
    filters.metros_min.trim() !== '' ||
    filters.metros_max.trim() !== ''
  );
}

export function buildRefFilterOptions(inmuebles: Inmueble[]): FilterSearchOption[] {
  const refs = new Set<string>();
  for (const inmueble of inmuebles) {
    if (inmueble.ref?.trim()) refs.add(inmueble.ref.trim());
  }

  return [...refs]
    .sort((a, b) => a.localeCompare(b, 'es'))
    .map((ref) => ({ value: ref, label: ref }));
}

export function buildPropietarioFilterOptions(
  inmuebles: Inmueble[],
): FilterSearchOption[] {
  const seen = new Set<string>();
  const options: FilterSearchOption[] = [];

  for (const inmueble of inmuebles) {
    for (const propietario of getInmueblePropietarios(inmueble)) {
      const nombre = propietario.nombre.trim();
      const telf = propietario.telf?.trim() ?? '';
      if (!nombre && !telf) continue;

      const label = nombre && telf ? `${nombre} · ${telf}` : nombre || telf;
      const key = label.toLowerCase();
      if (seen.has(key)) continue;

      seen.add(key);
      options.push({
        value: label,
        label,
        sublabel: telf && nombre ? telf : undefined,
      });
    }
  }

  return options.sort((a, b) => a.label.localeCompare(b.label, 'es'));
}

export function filterInmueblesByAlquilerFilters(
  inmuebles: Inmueble[],
  filters: InmuebleAlquilerFilters,
): Inmueble[] {
  if (!hasActiveInmuebleAlquilerFilters(filters)) return inmuebles;

  const refQuery = filters.ref.trim().toLowerCase();

  return inmuebles.filter((inmueble) => {
    if (refQuery) {
      const ref = inmueble.ref?.toLowerCase() ?? '';
      if (!ref.includes(refQuery)) return false;
    }

    if (!matchesZona(inmueble, filters.zona)) return false;
    if (!matchesPropietario(inmueble, filters.propietario)) return false;

    if (
      !matchesDateRange(
        inmueble.fecha_entrada_inmueble,
        filters.fecha_entrada_desde,
        filters.fecha_entrada_hasta,
      )
    ) {
      return false;
    }

    if (
      !matchesNumericRange(
        inmueble.precio,
        filters.precio_min,
        filters.precio_max,
      )
    ) {
      return false;
    }

    if (!matchesNumericRange(inmueble.hab, filters.hab_min, filters.hab_max)) {
      return false;
    }

    if (
      !matchesNumericRange(inmueble.banos, filters.banos_min, filters.banos_max)
    ) {
      return false;
    }

    if (
      !matchesNumericRange(
        inmueble.metros,
        filters.metros_min,
        filters.metros_max,
      )
    ) {
      return false;
    }

    return true;
  });
}
